mod tasks;

#[cfg(all(test, not(target_os = "android")))]
mod desktop_test;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_android_fs::init())
        .plugin(tauri_plugin_safe_area_insets_css::init())
        .plugin(tauri_plugin_llm::init())
        .invoke_handler(tauri::generate_handler![
            tasks::file_system_stuff::build_file_tree,
            tasks::lm_management::download_and_load_model,
            #[cfg(target_os = "android")]
            tasks::file_system_stuff::android::rename_file_android,
            #[cfg(target_os = "android")]
            tasks::file_system_stuff::android::move_file_android,
            #[cfg(target_os = "android")]
            tasks::file_system_stuff::android::rename_directory_android,
            #[cfg(target_os = "android")]
            tasks::file_system_stuff::android::move_directory_android
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
