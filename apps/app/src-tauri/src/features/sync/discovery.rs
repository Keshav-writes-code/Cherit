use std::{
    collections::HashMap,
    sync::{atomic::AtomicBool, Mutex},
};

use local_ip_address::local_ip;
use mdns_sd::{ServiceDaemon, ServiceEvent, ServiceInfo};
use serde::Serialize;
use tauri::{Emitter, Window};
use tauri_plugin_os::OsType;

#[derive(Clone, Serialize, Hash, PartialEq, Eq)]
struct DiscoveredDevice {
    name: String,
    ip: String,
    //the Os Hostname
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

// MDNS Daemon Variables
static MDNS_SD_DAEMON: Mutex<Option<ServiceDaemon>> = Mutex::new(None);
static SERVICE_TYPE: &str = "_cherit._udp.local.";

// Tauri COmmands Variables
static SCAN_TASK: Mutex<Option<tauri::async_runtime::JoinHandle<()>>> = Mutex::new(None);

fn get_daemon() -> ServiceDaemon {
    let mut guard = MDNS_SD_DAEMON.lock().unwrap();
    let daemon =
        guard.get_or_insert_with(|| ServiceDaemon::new().expect("Cannot create Service Daemon"));
    daemon.clone()
}

#[tauri::command]
pub fn stop_scan_and_discover() {
    let mut scan_task_guard = SCAN_TASK.lock().unwrap();
    if let Some(task) = scan_task_guard.take() {
        task.abort();
    }

    let mut mdns_daemon = MDNS_SD_DAEMON.lock().unwrap();
    if let Some(daemon) = mdns_daemon.take() {
        daemon.shutdown().expect("Cannot shutdown daemon");
    }
}

#[tauri::command]
pub fn scan_local_network(win: Window) {
    let mut scan_task_guard = SCAN_TASK.lock().unwrap();
    if let Some(task) = scan_task_guard.take() {
        task.abort();
    }

    let handle = tauri::async_runtime::spawn(async move {
        let daemon = get_daemon();
        let receiver = daemon.browse(SERVICE_TYPE).unwrap();
        let active_ip = local_ip().expect("Failed to get local IP");
        let host_name = format!("{}.local.", active_ip);

        let mut recevied_devices = HashMap::<String, DiscoveredDevice>::new();

        while let Ok(event) = receiver.recv_async().await {
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
    *scan_task_guard = Some(handle);
}

#[tauri::command(rename_all = "snake_case")]
pub fn join_local_network(win: Window, nick_name: Option<String>) {
    // First check if nick_name is sent and allow ths user to run this command again
    let Some(nick_name_str) = nick_name else {
        return;
    };

    let daemon = get_daemon();
    let active_ip = local_ip().expect("Failed to get local IP");
    let host_name = format!("{}.local.", active_ip);
    let host_name_2 = tauri_plugin_os::hostname();
    let os = tauri_plugin_os::platform();
    let properties = [
        ("ip", active_ip.to_string()),
        ("name", nick_name_str.clone()),
        ("hostname2", host_name_2),
        ("os", os.to_string()),
    ];

    let service = ServiceInfo::new(
        SERVICE_TYPE,
        &nick_name_str,
        &host_name,
        active_ip,
        8080,
        &properties[..],
    )
    .expect("Cannot create ServiceInfo")
    .enable_addr_auto();
    daemon.register(service).expect("Cannot join service");
}
