use crate::sync::discovery::SyncState;
use crate::sync::pairing::{PairRequest, PairResponse};
use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::{Manager, State};

pub struct AppSyncState {
    pub inner: RwLock<Option<Arc<SyncState>>>,
}

#[tauri::command]
pub async fn start_sync_service(app_handle: tauri::AppHandle, state: State<'_, AppSyncState>, workspace_root: String) -> Result<(), String> {
    let mut sync_state_lock = state.inner.write().await;

    if sync_state_lock.is_none() {
        // Generate a random ID for the session to prevent collisions in MVP
        let my_id = crate::sync::pairing::generate_pin().await;
        let my_name = format!("Device-{}", my_id);
        let port = 8080; // Should find an available port dynamically

        let config_dir = app_handle.path().app_config_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
        let _ = std::fs::create_dir_all(&config_dir);

        let sync_state = Arc::new(SyncState::new(my_id, my_name, port, workspace_root, config_dir).await?);

        // Start broadcasting our presence
        sync_state.start_broadcasting()?;

        // Start discovering peers
        SyncState::start_discovery(sync_state.clone()).await?;

        // Start the server
        let state_clone = sync_state.clone();
        let app_handle_clone = app_handle.clone();
        tokio::spawn(async move {
            if let Err(e) = crate::sync::server::start_server(state_clone, port, app_handle_clone).await {
                eprintln!("Failed to start server: {}", e);
            }
        });

        *sync_state_lock = Some(sync_state);

        #[cfg(target_os = "android")]
        {
            use tauri::Manager;
            if let Err(e) = app_handle.run_mobile_plugin("start_sync_service", ()) {
                eprintln!("Failed to start Android background service: {:?}", e);
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn stop_sync_service(state: State<'_, AppSyncState>) -> Result<(), String> {
    let mut sync_state_lock = state.inner.write().await;
    if let Some(sync_state) = sync_state_lock.as_ref() {
        sync_state.stop_broadcasting()?;
        if let Some(tx) = &sync_state.server_shutdown_tx {
            let _ = tx.send(());
        }
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

        let path_obj = std::path::PathBuf::from(&file_path);

        // Use CRDT Manager to update our local state and get the automerge doc payload
        let mut crdt_manager = sync_state.crdt_manager.write().await;

        // Strip the base_dir from the file path to get a relative path
        let relative_path = match path_obj.strip_prefix(&crdt_manager.base_dir) {
            Ok(p) => p.to_path_buf(),
            Err(_) => {
                // If it's not in the base dir, we just use the filename as a fallback MVP
                std::path::PathBuf::from(path_obj.file_name().unwrap_or_default())
            }
        };

        // First ensure the file is loaded into the CRDT manager so we have an active tracking state
        // This is necessary if it's the very first time the file is being synced.
        if !crdt_manager.documents.contains_key(&relative_path) {
            let _ = crdt_manager.load_or_create_doc(&relative_path).await;
        }

        let _ = crdt_manager.update_doc_from_file(&relative_path).await;

        // Fetch the raw bytes of the automerge CRDT state to send
        let payload_content = match crdt_manager.documents.get(&relative_path) {
            Some(doc) => doc.automerge_doc.save(),
            None => return Err("Failed to generate CRDT payload".to_string()),
        };

        // Convert the local relative path to a cross-platform friendly Unix format for the network
        let relative_path_str = relative_path.to_string_lossy().replace('\\', "/");

        for peer in peers.values() {
            if peer.is_paired {
                let url = format!("http://{}:{}/sync", peer.ip, peer.port);

                let request = crate::sync::server::SyncRequest {
                    peer_id: sync_state.my_id.clone(),
                    file_path: relative_path_str.clone(),
                    content: payload_content.clone(),
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
                drop(peers_write);
                sync_state.save_peers().await;
            }

            Ok(pair_response)
        } else {
            Err("Peer not found".into())
        }
    } else {
        Err("Sync service is not running".into())
    }
}
