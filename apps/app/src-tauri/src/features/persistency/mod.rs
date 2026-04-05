mod local_config;
use local_config::LocalConfig;

use serde::{Deserialize, Serialize};
#[derive(Serialize, Deserialize)]
pub struct AppPersistentStates {
    local: LocalConfig,
}

#[tauri::command]
pub fn get_persistent_states() -> Result<AppPersistentStates, String> {
    let state = AppPersistentStates {
        local: LocalConfig::get_config().map_err(|err| err.to_string())?,
    };
    Ok(state)
}
#[tauri::command]
pub fn save_persistent_states(state: AppPersistentStates) -> Result<(), String> {
    state.local.save_to_file().map_err(|e| e.to_string())?;
    Ok(())
}
