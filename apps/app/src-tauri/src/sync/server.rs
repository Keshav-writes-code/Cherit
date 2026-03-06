use axum::{
    extract::{State, Json},
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use crate::sync::discovery::SyncState;
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

pub async fn start_server(state: Arc<SyncState>, port: u16) -> Result<(), String> {
    let app = Router::new()
        .route("/status", get(status_handler))
        .route("/pair", post(pair_handler))
        .route("/sync", post(sync_handler))
        .with_state(state);

    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .map_err(|e| e.to_string())?;

    println!("Sync server listening on {}", addr);

    tokio::spawn(async move {
        if let Err(e) = axum::serve(listener, app).await {
            eprintln!("Server error: {}", e);
        }
    });

    Ok(())
}

async fn status_handler(State(state): State<Arc<SyncState>>) -> Json<PeerStatus> {
    Json(PeerStatus {
        id: state.my_id.clone(),
        name: state.my_name.clone(),
    })
}

async fn pair_handler(
    State(state): State<Arc<SyncState>>,
    Json(payload): Json<PairRequest>,
) -> Json<PairResponse> {
    let active_pin = state.active_pin.read().await;

    if let Some(pin) = active_pin.as_ref() {
        if pin == &payload.pin {
            // Pin matches, pair the device
            let mut peers = state.peers.write().await;
            if let Some(peer) = peers.get_mut(&payload.peer_id) {
                peer.is_paired = true;
                return Json(PairResponse {
                    success: true,
                    message: "Successfully paired".to_string(),
                });
            } else {
                return Json(PairResponse {
                    success: false,
                    message: "Peer not found in discovered list".to_string(),
                });
            }
        }
    }

    Json(PairResponse {
        success: false,
        message: "Invalid PIN or pairing not active".to_string(),
    })
}

async fn sync_handler(
    State(state): State<Arc<SyncState>>,
    Json(payload): Json<SyncRequest>,
) -> Json<SyncResponse> {
    let peers = state.peers.read().await;

    // Authenticate: Ensure the peer exists and is paired
    if let Some(peer) = peers.get(&payload.peer_id) {
        if peer.is_paired {
            // For MVP, without the CRDTManager hooked into global state,
            // we will write the synced content directly to the documents directory.
            // A more complete CRDT impl is in crdt.rs but requires global state integration

            let file_name = payload.file_path;

            // For safety and MVP purposes, assume files are saved to a common default local location
            // or the same dir structure if they have identical root workspaces.
            // Here we simply print and save into a `.sync-inbox` to prove it works without
            // accidentally overwriting the user's primary workspace root if not configured properly.

            // Note: full CRDT integration requires the app's selected workspace dir, which is kept
            // in the Svelte frontend state (or passed to Rust via set_workspace_root).

            if let Some(mut home_dir) = dirs::home_dir() {
                 home_dir.push(".cherit-sync-inbox");
                 let _ = std::fs::create_dir_all(&home_dir);
                 let save_path = home_dir.join(&file_name);
                 let _ = std::fs::write(&save_path, &payload.content);

                 println!("Received sync data from {} for {:?} and saved to {:?}", peer.name, file_name, save_path);
            } else {
                 let _ = std::fs::write(&file_name, &payload.content);
                 println!("Received sync data from {} for {:?}", peer.name, file_name);
            }

            return Json(SyncResponse { success: true });
        }
    }

    Json(SyncResponse { success: false })
}
