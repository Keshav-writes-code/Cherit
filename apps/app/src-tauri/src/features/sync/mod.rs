use std::{
    collections::HashMap,
    net::{IpAddr, Ipv4Addr},
};

use local_ip_address::{list_afinet_netifas, local_ip};
use mdns_sd::{ServiceDaemon, ServiceEvent, ServiceInfo};
use serde::Serialize;
use tauri::{Emitter, Window};

#[derive(Clone, Serialize, Hash, PartialEq, Eq)]
struct DiscoveredDevice {
    name: String,
    ip: String,
}

fn gen_nick_name() -> String {
    use rand::prelude::*;

    const ADJECTIVES: &[&str] = &["swift", "cozy", "brave", "clever", "sunny"];
    const NOUN: &[&str] = &["fox", "panda", "falcon", "otter", "tiger"];
    let mut rng = rand::rng();

    format!(
        "{} {}",
        ADJECTIVES.choose(&mut rng).unwrap(),
        NOUN.choose(&mut rng).unwrap()
    )
}

#[tauri::command]
pub fn join_scan_local_network(win: Window) {
    const SERVICE_TYPE: &str = "_cherit._udp.local.";
    let deamon = ServiceDaemon::new().expect("Cannot create mdns deamon");
    let name = gen_nick_name();
    let active_ip = local_ip().expect("Failed to get local IP");
    let host_name = format!("{}.local.", active_ip);
    let properties = [("ip", active_ip.to_string()), ("name", name.to_string())];

    let service = ServiceInfo::new(
        SERVICE_TYPE,
        &name,
        &host_name,
        active_ip,
        8080,
        &properties[..],
    )
    .expect("Cannot create ServiceInfo")
    .enable_addr_auto();
    deamon.register(service).expect("Cannot join service");

    // Scan Local Network
    std::thread::spawn(move || {
        let receiver = deamon.browse(SERVICE_TYPE).unwrap();
        let mut recevied_devices = HashMap::<String, DiscoveredDevice>::new();

        while let Ok(event) = receiver.recv() {
            if let ServiceEvent::ServiceResolved(info) = event {
                if let Some(ip) = info.get_property_val_str("ip") {
                    let device = DiscoveredDevice {
                        name: info.get_property_val_str("name").unwrap_or("").to_string(),
                        ip: ip.to_string(),
                    };
                    recevied_devices.insert(info.fullname, device);
                    let _ = win.emit("device_found", &recevied_devices);
                }
            } else if let ServiceEvent::ServiceRemoved(_, full_name) = event {
                recevied_devices.remove(&full_name);
                let _ = win.emit("device_found", &recevied_devices);
            }
        }
    });
}
