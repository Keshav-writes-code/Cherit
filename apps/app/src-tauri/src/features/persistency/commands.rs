use super::structs::AppPersistentStates;
use std::sync::Mutex;
use tauri::{AppHandle, State};

#[tauri::command]
pub fn get_persistent_states(
    state: State<'_, Mutex<AppPersistentStates>>,
) -> Result<AppPersistentStates, String> {
    Ok(state.lock().map_err(|e| e.to_string())?.clone())
}

#[tauri::command]
pub fn save_persistent_states(
    state: State<'_, Mutex<AppPersistentStates>>,
    app: AppHandle,
    states: AppPersistentStates,
) -> Result<(), String> {
    println!(
        "Got from Frontend : {}",
        serde_json::to_string(&states).map_err(|e| e.to_string())?
    );
    state
        .lock()
        .map_err(|e| e.to_string())?
        .clone()
        .save_states(&app)
        .map_err(|e| e.to_string())?;

    Ok(())
}
