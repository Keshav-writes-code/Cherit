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
        // Use a persistent random ID or generate one
        let my_id = "test-device-id-123".to_string(); // MVP: Needs persistent store
        let my_name = "User's Device".to_string();
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
