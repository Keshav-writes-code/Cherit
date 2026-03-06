use mdns_sd::{ServiceDaemon, ServiceEvent, ServiceInfo};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

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
    // Add pairing pin state here later
    pub active_pin: RwLock<Option<String>>,
}

impl SyncState {
    pub fn new(id: String, name: String, port: u16) -> Result<Self, String> {
        let mdns = ServiceDaemon::new().map_err(|e| e.to_string())?;
        Ok(Self {
            mdns,
            my_id: id,
            my_name: name,
            peers: RwLock::new(HashMap::new()),
            port,
            active_pin: RwLock::new(None),
        })
    }

    pub fn start_broadcasting(&self) -> Result<(), String> {
        let instance_name = format!("{}-{}", self.my_name, self.my_id);
        let my_ip = "0.0.0.0"; // For now broadcast on all interfaces

        let mut properties = HashMap::new();
        properties.insert("id".to_string(), self.my_id.clone());

        let service_info = ServiceInfo::new(
            SERVICE_TYPE,
            &instance_name,
            &format!("{}.local.", instance_name),
            my_ip,
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
                                let peer_info = PeerInfo {
                                    id: peer_id.to_string(),
                                    name: info.get_fullname().to_string(), // Need to parse name better later
                                    ip: ip.to_string(),
                                    port: info.get_port(),
                                    is_paired: false, // Default to false until handshake
                                };
                                let mut peers = state.peers.write().await;
                                peers.insert(peer_id.to_string(), peer_info);
                            }
                        }
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
