mod local_config;
use local_config::LocalConfig;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
#[derive(Serialize, Deserialize)]
pub struct AppPersistentStates {
    local: LocalConfig,
}

#[tauri::command]
pub fn get_persistent_states(app: AppHandle) -> Result<AppPersistentStates, String> {
    println!("Printed from get function");
    let state = AppPersistentStates {
        local: LocalConfig::get_config(&app).map_err(|err| err.to_string())?,
    };
    Ok(state)
}
#[tauri::command]
pub fn save_persistent_states(state: LocalConfig, app: AppHandle) -> Result<(), String> {
    println!("Hello");
    state.save_to_file(&app).map_err(|e| e.to_string())?;
    Ok(())
}
