use std::collections::HashMap;

use local_ip_address::local_ip;
use mdns_sd::{ServiceDaemon, ServiceEvent, ServiceInfo};
use serde::Serialize;
use tauri::{Emitter, Window};
use tauri_plugin_os::OsType;

#[derive(Clone, Serialize, Hash, PartialEq, Eq)]
struct DiscoveredDevice {
    name: String,
    ip: String,
    host_name_2: String,
    os: String,
}

pub fn gen_nick_name() -> String {
    use rand::prelude::*;

    static ADJECTIVES: &[&str] = &["swift", "cozy", "brave", "clever", "sunny"];
    static NOUN: &[&str] = &["fox", "panda", "falcon", "otter", "tiger"];
    let mut rng = rand::rng();

    format!(
        "{} {}",
        ADJECTIVES.choose(&mut rng).unwrap(),
        NOUN.choose(&mut rng).unwrap()
    )
}

#[tauri::command(rename_all = "snake_case")]
pub fn join_scan_local_network(win: Window, nick_name: String) {
    static SERVICE_TYPE: &str = "_cherit._udp.local.";
    let deamon = ServiceDaemon::new().expect("Cannot create mdns deamon");
    let active_ip = local_ip().expect("Failed to get local IP");
    let host_name = format!("{}.local.", active_ip);
    let host_name_2 = tauri_plugin_os::hostname();
    let os = tauri_plugin_os::platform();
    let properties = [
        ("ip", active_ip.to_string()),
        ("name", nick_name.clone()),
        ("hostname2", host_name_2),
        ("os", os.to_string()),
    ];

    let service = ServiceInfo::new(
        SERVICE_TYPE,
        &nick_name,
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
                if host_name == info.get_hostname() {
                    continue;
                }
                let (Some(name), Some(ip), Some(host_name_2_fetched), Some(os)) = (
                    info.get_property_val_str("name"),
                    info.get_property_val_str("ip"),
                    info.get_property_val_str("hostname2"),
                    info.get_property_val_str("os"),
                ) else {
                    continue;
                };

                let device = DiscoveredDevice {
                    name: name.to_string(),
                    ip: ip.to_string(),
                    host_name_2: host_name_2_fetched.to_string(),
                    os: os.to_string(),
                };
                recevied_devices.insert(info.fullname, device);
                let _ = win.emit("device_found", &recevied_devices);
            } else if let ServiceEvent::ServiceRemoved(_, full_name) = event {
                recevied_devices.remove(&full_name);
                let _ = win.emit("device_found", &recevied_devices);
            }
        }
    });
}
