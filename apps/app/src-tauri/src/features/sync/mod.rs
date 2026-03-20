use local_ip_address::local_ip;
use mdns_sd::{ServiceDaemon, ServiceEvent, ServiceInfo};
use serde::Serialize;
use tauri::{Emitter, Window};

#[derive(Clone, Serialize)]
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
fn join_local_network(deamon: &ServiceDaemon, service_type: &str) {
    let name = gen_nick_name();
    let active_ip = local_ip().expect("Failed to get local IP");
    let host_name = format!("{}.local.", active_ip);
    let properties = [("ip", active_ip.to_string()), ("name", name.to_string())];

    let service = ServiceInfo::new(
        service_type,
        &name,
        &host_name,
        active_ip,
        8080,
        &properties[..],
    )
    .expect("Cannot create ServiceInfo")
    .enable_addr_auto();
    deamon.register(service).expect("Cannot join service");
}

#[tauri::command]
pub fn join_scan_local_network(win: Window) {
    let mdns = ServiceDaemon::new().expect("Cannot create mdns deamon");
    const SERVICE_TYPE: &str = "_cherit._udp.local.";
    join_local_network(&mdns, SERVICE_TYPE);

    // Scan Local Network
    std::thread::spawn(move || {
        let receiver = mdns.browse(SERVICE_TYPE).unwrap();

        while let Ok(event) = receiver.recv() {
            if let ServiceEvent::ServiceResolved(info) = event {
                let device = DiscoveredDevice {
                    name: info.get_property_val_str("name").unwrap_or("").to_string(),
                    ip: info.get_property_val_str("ip").unwrap_or("").to_string(),
                };
                let _ = win.emit("device_found", device);
            }
        }
    });
}
