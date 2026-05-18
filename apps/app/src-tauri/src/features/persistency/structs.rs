use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::{
    error::Error,
    fs::{self, File},
    path::PathBuf,
};
use tauri::{AppHandle, Manager};

const CONFIG_FILE_NAME: &str = "config.json";

// Global Struct
#[derive(Serialize, Deserialize, Clone, Default)]
struct GenericPath {
    path: PathBuf,
    document_top_tree_uri: Option<PathBuf>,
}

// Domain : Wokrspace
#[derive(Serialize, Deserialize, Clone, Default)]
struct WorkspaceMetaData {
    path: GenericPath,
    last_accessed: DateTime<Utc>,
    recent_filenode_path: Option<GenericPath>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
struct AppConfig {
    workspaces_metadata: Vec<WorkspaceMetaData>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
struct AppSecureConfig {
    llm_api: Option<String>,
}

// Main Parent State
#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct AppPersistentStates {
    app_config: AppConfig,
    secure: AppSecureConfig,
}

impl AppPersistentStates {
    pub fn save_states(
        &mut self,
        app: &AppHandle,
        states: &AppPersistentStates,
    ) -> Result<(), Box<dyn Error>> {
        self.app_config = states.app_config.clone();
        self.secure = states.secure.clone();

        let path = app.path().app_config_dir().unwrap().join(CONFIG_FILE_NAME);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }

        let file = File::create(path)?;
        serde_json::to_writer_pretty(&file, &self)?;

        Ok(())
    }

    pub fn load_states(&mut self, app: &AppHandle) -> Result<(), Box<dyn Error>> {
        // Setup Config Path
        self.setup_config_path(app)?;

        let path = app.path().app_config_dir().unwrap().join(CONFIG_FILE_NAME);
        let file = fs::File::options().read(true).open(path)?;
        *self = serde_json::from_reader(&file)?;
        Ok(())
    }
    pub fn setup_config_path(&self, app: &AppHandle) -> Result<(), Box<dyn Error>> {
        let path = app.path().app_config_dir().unwrap().join(CONFIG_FILE_NAME);
        // Create the file path if doesn't exists
        if !path.exists() {
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent)?;
            }
            let file = File::create(&path)?;
            serde_json::to_writer_pretty(&file, &self)?;
        }
        Ok(())
    }
}
