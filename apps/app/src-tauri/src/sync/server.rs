use axum::{
    extract::{State, Json},
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use crate::sync::discovery::SyncState;
use tauri::Emitter;
use crate::sync::pairing::{PairRequest, PairResponse};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct PeerStatus {
    pub id: String,
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct SyncRequest {
    pub peer_id: String,
    pub file_path: String,
    pub content: Vec<u8>,
}

#[derive(Serialize, Deserialize)]
pub struct SyncResponse {
    pub success: bool,
}

pub async fn start_server(state: Arc<SyncState>, port: u16, app_handle: tauri::AppHandle) -> Result<(), String> {
    let server_state = ServerState {
        sync: state.clone(),
        app: app_handle,
    };

    let app = Router::new()
        .route("/status", get(status_handler))
        .route("/pair", post(pair_handler))
        .route("/sync", post(sync_handler))
        .with_state(server_state);

    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .map_err(|e| e.to_string())?;

    println!("Sync server listening on {}", addr);

    let mut rx = state.server_shutdown_tx.as_ref().unwrap().subscribe();

    tokio::spawn(async move {
        let server = axum::serve(listener, app).with_graceful_shutdown(async move {
            let _ = rx.recv().await;
            println!("Sync server gracefully shutting down");
        });

        if let Err(e) = server.await {
            eprintln!("Server error: {}", e);
        }
    });

    Ok(())
}

// Due to the wrapper struct, we need to adjust handlers signature to extract it.
// To avoid redefining struct visibility issues, we'll inline it at the module level.
#[derive(Clone)]
struct ServerState {
    sync: Arc<SyncState>,
    app: tauri::AppHandle,
}

async fn status_handler(State(state): State<ServerState>) -> Json<PeerStatus> {
    Json(PeerStatus {
        id: state.sync.my_id.clone(),
        name: state.sync.my_name.clone(),
    })
}

async fn pair_handler(
    State(state): State<ServerState>,
    Json(payload): Json<PairRequest>,
) -> Json<PairResponse> {
    let active_pin = state.sync.active_pin.read().await;

    if let Some(pin) = active_pin.as_ref() {
        if pin == &payload.pin {
            let mut peers = state.sync.peers.write().await;
            if let Some(peer) = peers.get_mut(&payload.peer_id) {
                peer.is_paired = true;
            } else {
                let stub_peer = crate::sync::discovery::PeerInfo {
                    id: payload.peer_id.clone(),
                    name: "Unknown Peer".to_string(),
                    ip: "0.0.0.0".to_string(),
                    port: 8080,
                    is_paired: true,
                };
                peers.insert(payload.peer_id.clone(), stub_peer);
            }

            // Drop lock and save asynchronously
            drop(peers);
            state.sync.save_peers().await;

            return Json(PairResponse {
                success: true,
                message: "Successfully paired".to_string(),
            });
        }
    }

    Json(PairResponse {
        success: false,
        message: "Invalid PIN or pairing not active".to_string(),
    })
}

async fn sync_handler(
    State(state): State<ServerState>,
    Json(payload): Json<SyncRequest>,
) -> Json<SyncResponse> {
    let peers = state.sync.peers.read().await;

    // Authenticate: Ensure the peer exists and is paired
    if let Some(peer) = peers.get(&payload.peer_id) {
        if peer.is_paired {
            let relative_path_str = payload.file_path.clone();
            // Ensure any incoming Unix paths are correctly converted to local platform paths (e.g. Windows)
            let relative_path = std::path::PathBuf::from(relative_path_str.replace('/', std::path::MAIN_SEPARATOR_STR));

            let mut crdt_manager = state.sync.crdt_manager.write().await;

            match crdt_manager.apply_sync_data(&relative_path, &payload.content).await {
                Ok(_) => {
                    println!("Successfully merged sync data from {} for {:?}", peer.name, relative_path);

                    // Emit event so the frontend knows to reload this file
                    let _ = state.app.emit("sync-file-updated", relative_path_str);

                    return Json(SyncResponse { success: true });
                }
                Err(e) => {
                    eprintln!("Failed to merge sync data: {}", e);
                    return Json(SyncResponse { success: false });
                }
            }
        }
    }

    Json(SyncResponse { success: false })
}
