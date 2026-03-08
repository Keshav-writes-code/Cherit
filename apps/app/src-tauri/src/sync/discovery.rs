use mdns_sd::{ServiceDaemon, ServiceEvent, ServiceInfo};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::sync::crdt::CrdtManager;

pub const SERVICE_TYPE: &str = "_cherit._tcp.local.";

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PeerInfo {
    pub id: String,
    pub name: String,
    pub ip: String,
    pub port: u16,
    pub is_paired: bool,
}

pub struct SyncState {
    pub mdns: ServiceDaemon,
    pub my_id: String,
    pub my_name: String,
    pub peers: RwLock<HashMap<String, PeerInfo>>,
    pub port: u16,
    pub active_pin: RwLock<Option<String>>,
    pub crdt_manager: RwLock<CrdtManager>,
    pub server_shutdown_tx: Option<tokio::sync::broadcast::Sender<()>>,
    pub config_dir: std::path::PathBuf,
    // pub fs_watcher: RwLock<Option<notify_debouncer_full::Debouncer<notify::RecommendedWatcher, notify_debouncer_full::FileIdMap>>>,
}

impl SyncState {
    pub async fn new(id: String, name: String, port: u16, workspace_root: String, config_dir: std::path::PathBuf) -> Result<Self, String> {
        let mdns = ServiceDaemon::new().map_err(|e| e.to_string())?;

        // Clean URL-encoded file protocols if present
        let mut path_str = workspace_root.clone();
        if path_str.starts_with("file://") {
            path_str = path_str.trim_start_matches("file://").to_string();
        }
        path_str = urlencoding::decode(&path_str).unwrap_or(std::borrow::Cow::Borrowed(&path_str)).to_string();

        let crdt_manager = CrdtManager::new(std::path::PathBuf::from(path_str), config_dir.clone()).await?;

        // Channel for server shutdown
        let (tx, _) = tokio::sync::broadcast::channel(1);

        let peers_file = config_dir.join("peers.json");
        let mut peers = HashMap::new();
        if peers_file.exists() {
            if let Ok(data) = std::fs::read_to_string(&peers_file) {
                if let Ok(saved_peers) = serde_json::from_str::<HashMap<String, PeerInfo>>(&data) {
                    peers = saved_peers;
                }
            }
        }

        Ok(Self {
            mdns,
            my_id: id,
            my_name: name,
            peers: RwLock::new(peers),
            port,
            active_pin: RwLock::new(None),
            crdt_manager: RwLock::new(crdt_manager),
            server_shutdown_tx: Some(tx),
            config_dir,
        })
    }

    pub async fn save_peers(&self) {
        let peers = self.peers.read().await;
        let peers_file = self.config_dir.join("peers.json");
        if let Ok(data) = serde_json::to_string(&*peers) {
            let _ = std::fs::write(peers_file, data);
        }
    }

    pub fn start_broadcasting(&self) -> Result<(), String> {
        let instance_name = format!("{}-{}", self.my_name, self.my_id);

        // Find the actual local IP address on the network instead of 0.0.0.0
        let my_ip = match std::net::UdpSocket::bind("0.0.0.0:0") {
            Ok(s) => match s.connect("8.8.8.8:80") {
                Ok(_) => s.local_addr().map(|a| a.ip().to_string()).unwrap_or_else(|_| "0.0.0.0".to_string()),
                Err(_) => "0.0.0.0".to_string(),
            },
            Err(_) => "0.0.0.0".to_string(),
        };

        let mut properties = HashMap::new();
        properties.insert("id".to_string(), self.my_id.clone());

        let service_info = ServiceInfo::new(
            SERVICE_TYPE,
            &instance_name,
            &format!("{}.local.", instance_name),
            &my_ip,
            self.port,
            Some(properties),
        )
        .map_err(|e| e.to_string())?;

        self.mdns
            .register(service_info)
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn stop_broadcasting(&self) -> Result<(), String> {
        let instance_name = format!("{}-{}", self.my_name, self.my_id);
        self.mdns.unregister(&format!("{}.{}", instance_name, SERVICE_TYPE)).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub async fn start_discovery(state: Arc<SyncState>) -> Result<(), String> {
        // Also proactively probe known peers to make connection fast instead of waiting for mDNS
        let peers_clone = state.peers.read().await.clone();
        tokio::spawn(async move {
            let client = reqwest::Client::builder().timeout(std::time::Duration::from_secs(2)).build().unwrap();
            for (_, peer) in peers_clone {
                if peer.is_paired {
                    let url = format!("http://{}:{}/status", peer.ip, peer.port);
                    if client.get(&url).send().await.is_ok() {
                        // Found them!
                    }
                }
            }
        });

        let receiver = state.mdns.browse(SERVICE_TYPE).map_err(|e| e.to_string())?;

        tokio::spawn(async move {
            while let Ok(event) = receiver.recv_async().await {
                match event {
                    ServiceEvent::ServiceResolved(info) => {
                        let properties = info.get_properties();
                        if let Some(peer_id) = properties.get_property_val_str("id") {
                            // Don't add ourselves
                            if peer_id == state.my_id {
                                continue;
                            }

                            if let Some(ip) = info.get_addresses().iter().next() {
                                // Extract the clean name by removing the "-<id>._cherit._tcp.local." suffix
                                let raw_fullname = info.get_fullname().to_string();
                                let mut clean_name = raw_fullname.clone();
                                if let Some(idx) = raw_fullname.find("._cherit") {
                                    clean_name = raw_fullname[..idx].to_string();
                                }

                                let peer_info = PeerInfo {
                                    id: peer_id.to_string(),
                                    name: clean_name,
                                    ip: ip.to_string(),
                                    port: info.get_port(),
                                    is_paired: false,
                                };
                                let mut peers = state.peers.write().await;

                                // Preserve pairing status if we already knew this peer
                                let is_paired = peers.get(&peer_id.to_string()).map(|p| p.is_paired).unwrap_or(false);

                                let mut updated_info = peer_info;
                                updated_info.is_paired = is_paired;

                                peers.insert(peer_id.to_string(), updated_info);
                            }
                        }
                    }
                    ServiceEvent::ServiceFound(_service_type, _fullname) => {
                         // mdns-sd automatically resolves found services on the next broadcast packet
                    }
                    ServiceEvent::ServiceRemoved(_, fullname) => {
                        // For now we need to iterate to find the peer to remove,
                        // or better yet, store fullnames or resolve ids.
                        // A simpler approach is to periodically clear dead peers.
                        let mut peers = state.peers.write().await;
                        peers.retain(|_, v| !fullname.contains(&v.name));
                    }
                    _ => {}
                }
            }
        });

        Ok(())
    }
}
