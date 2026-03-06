use crate::sync::discovery::SyncState;
use crate::sync::pairing::{PairRequest, PairResponse};
use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::State;

pub struct AppSyncState {
    pub inner: RwLock<Option<Arc<SyncState>>>,
}

#[tauri::command]
pub async fn start_sync_service(state: State<'_, AppSyncState>) -> Result<(), String> {
    let mut sync_state_lock = state.inner.write().await;

    if sync_state_lock.is_none() {
        // Generate a random ID for the session to prevent collisions in MVP
        let my_id = crate::sync::pairing::generate_pin().await;
        let my_name = format!("Device-{}", my_id);
        let port = 8080; // Should find an available port dynamically

        let sync_state = Arc::new(SyncState::new(my_id, my_name, port)?);

        // Start broadcasting our presence
        sync_state.start_broadcasting()?;

        // Start discovering peers
        SyncState::start_discovery(sync_state.clone()).await?;

        // Start the server
        let state_clone = sync_state.clone();
        tokio::spawn(async move {
            if let Err(e) = crate::sync::server::start_server(state_clone, port).await {
                eprintln!("Failed to start server: {}", e);
            }
        });

        *sync_state_lock = Some(sync_state);

        #[cfg(target_os = "android")]
        {
            // Tauri Android plugin way to start service would go here.
            // For now, this is mocked as we just created the Kotlin class.
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn stop_sync_service(state: State<'_, AppSyncState>) -> Result<(), String> {
    let mut sync_state_lock = state.inner.write().await;
    if let Some(sync_state) = sync_state_lock.as_ref() {
        sync_state.stop_broadcasting()?;
        *sync_state_lock = None;
    }
    Ok(())
}

#[tauri::command]
pub async fn generate_pairing_pin(state: State<'_, AppSyncState>) -> Result<String, String> {
    let sync_state_lock = state.inner.read().await;
    if let Some(sync_state) = sync_state_lock.as_ref() {
        let pin = crate::sync::pairing::generate_pin().await;
        let mut active_pin = sync_state.active_pin.write().await;
        *active_pin = Some(pin.clone());
        Ok(pin)
    } else {
        Err("Sync service is not running".into())
    }
}

#[tauri::command]
pub async fn get_discovered_peers(state: State<'_, AppSyncState>) -> Result<Vec<crate::sync::discovery::PeerInfo>, String> {
    let sync_state_lock = state.inner.read().await;
    if let Some(sync_state) = sync_state_lock.as_ref() {
        let peers = sync_state.peers.read().await;
        Ok(peers.values().cloned().collect())
    } else {
        Err("Sync service is not running".into())
    }
}

#[tauri::command]
pub async fn sync_file(state: State<'_, AppSyncState>, file_path: String) -> Result<(), String> {
    let sync_state_lock = state.inner.read().await;
    if let Some(sync_state) = sync_state_lock.as_ref() {
        let peers = sync_state.peers.read().await;

        let client = reqwest::Client::new();

        // For MVP, if we don't have CRDT fully hooked up to a global manager,
        // we can just send the raw file content, but let's actually read it from disk first
        // so it actually does something.

        let path_obj = std::path::PathBuf::from(&file_path);
        let content = match tokio::fs::read(&path_obj).await {
            Ok(c) => c,
            Err(e) => return Err(format!("Failed to read file for sync: {}", e)),
        };

        for peer in peers.values() {
            if peer.is_paired {
                let url = format!("http://{}:{}/sync", peer.ip, peer.port);

                // Keep the path relative to the sync root.
                // For MVP, just taking the file name is safer if paths differ across platforms.
                let relative_path = path_obj.file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .into_owned();

                let request = crate::sync::server::SyncRequest {
                    peer_id: sync_state.my_id.clone(),
                    file_path: relative_path,
                    content: content.clone(),
                };

                // Fire and forget sync request
                let _ = client.post(&url).json(&request).send().await;
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn pair_with_peer(state: State<'_, AppSyncState>, peer_id: String, pin: String) -> Result<PairResponse, String> {
    let sync_state_lock = state.inner.read().await;
    if let Some(sync_state) = sync_state_lock.as_ref() {
        let peers = sync_state.peers.read().await;
        if let Some(peer) = peers.get(&peer_id) {
            let client = reqwest::Client::new();
            let url = format!("http://{}:{}/pair", peer.ip, peer.port);

            let request = PairRequest {
                peer_id: sync_state.my_id.clone(),
                pin,
            };

            let res = client.post(&url)
                .json(&request)
                .send()
                .await
                .map_err(|e| e.to_string())?;

            let pair_response: PairResponse = res.json().await.map_err(|e| e.to_string())?;

            if pair_response.success {
                // Drop read lock to acquire write lock safely
                drop(peers);
                let mut peers_write = sync_state.peers.write().await;
                if let Some(p) = peers_write.get_mut(&peer_id) {
                    p.is_paired = true;
                }
            }

            Ok(pair_response)
        } else {
            Err("Peer not found".into())
        }
    } else {
        Err("Sync service is not running".into())
    }
}
