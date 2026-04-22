use super::structs::AppPersistentStates;
use tauri::AppHandle;

#[tauri::command]
pub fn get_persistent_states(app: AppHandle) -> Result<AppPersistentStates, String> {
    let mut temp_states = AppPersistentStates::new();
    temp_states.load_states(&app).map_err(|e| e.to_string())?;
    Ok(temp_states)
}

#[tauri::command]
pub fn save_persistent_states(app: AppHandle, states: AppPersistentStates) -> Result<(), String> {
    let mut temp_states = AppPersistentStates::new();
    temp_states
        .save_states(&app, &states)
        .map_err(|e| e.to_string())?;
    Ok(())
}
