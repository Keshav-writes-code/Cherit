use crate::features::persistency::structs::AppPersistentStates;

mod features;

#[cfg(all(test, not(target_os = "android")))]
mod desktop_test;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_device_info::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_android_fs::init())
        .plugin(tauri_plugin_safe_area_insets_css::init())
        .invoke_handler(tauri::generate_handler![
            features::file_system::build_file_tree,
            features::file_system::android::move_file_android,
            features::file_system::android::move_directory_android,
            features::persistency::commands::get_persistent_states,
            features::persistency::commands::save_persistent_states,
            features::sync::discovery::join_scan_local_network
        ])
        .setup(|app| {
            let app_config = AppPersistentStates::new();
            app_config.setup_config_path(app.handle())?;
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                use tauri::Manager;
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
