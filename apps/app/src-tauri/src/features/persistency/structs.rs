use std::{error::Error, fs, path::PathBuf};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

// Global Struct
#[derive(Serialize, Deserialize, Clone)]
struct GenericPath {
    path: PathBuf,
    document_top_tree_uri: Option<PathBuf>,
}

// Domain : Wokrspace
#[derive(Serialize, Deserialize, Clone)]
struct WorkspaceMetaData {
    last_accessed: DateTime<Utc>,
    recent_file_node_path: GenericPath,
}

// Domain : Other

// Main config
#[derive(Serialize, Deserialize, Clone)]
struct AppConfig {
    workspaces_metadata: Vec<WorkspaceMetaData>,
}

impl AppConfig {
    pub fn new() -> Self {
        Self {
            workspaces_metadata: vec![],
        }
    }
    pub fn save_to_file(&self, app: &AppHandle) -> Result<(), Box<dyn Error>> {
        let content = serde_json::to_string(self)?;
        let path = app.path().config_dir().unwrap().join("config.json");
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(path, content)?;
        Ok(())
    }

    pub fn load_states(&mut self, app: &AppHandle) -> Result<(), Box<dyn Error>> {
        let path = app.path().config_dir().unwrap().join("config.json");
        if !path.exists() {
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent)?;
            }
            let data = serde_json::to_string(&self)?;
            fs::write(&path, data)?;
            return Ok(());
        }

        let raw = fs::read_to_string(path)?;
        *self = serde_json::from_str::<Self>(&raw)?;
        Ok(())
    }
}

#[derive(Serialize, Deserialize, Clone)]
struct AppSecureConfig {
    llm_api: String,
}

impl AppSecureConfig {
    pub fn new() -> Self {
        Self {
            llm_api: "".to_string(),
        }
    }
    pub fn save_to_file(&self, app: &AppHandle) -> Result<(), Box<dyn Error>> {
        let content = serde_json::to_string(self)?;
        let path = app.path().config_dir().unwrap().join("secure_config.json");
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(path, content)?;
        Ok(())
    }

    pub fn load_states(&mut self, app: &AppHandle) -> Result<(), Box<dyn Error>> {
        let path = app.path().config_dir().unwrap().join("secure_config.json");
        if !path.exists() {
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent)?;
            }
            let data = serde_json::to_string(&self)?;
            fs::write(&path, data)?;
            return Ok(());
        }

        let raw = fs::read_to_string(path)?;
        *self = serde_json::from_str::<Self>(&raw)?;
        Ok(())
    }
}

// Main Parent State
#[derive(Serialize, Deserialize, Clone)]
pub struct AppPersistentStates {
    schema_version: u8,
    app_config: AppConfig,
    secure: AppSecureConfig,
}

impl AppPersistentStates {
    pub fn new() -> Self {
        Self {
            schema_version: 1,
            app_config: AppConfig::new(),
            secure: AppSecureConfig::new(),
        }
    }
    pub fn save_states(&self, app: &AppHandle) -> Result<(), Box<dyn Error>> {
        self.app_config.save_to_file(app)?;
        self.secure.save_to_file(app)?;
        Ok(())
    }
    pub fn load_states(&mut self, app: &AppHandle) -> Result<(), String> {
        self.app_config
            .load_states(app)
            .map_err(|e| e.to_string())?;
        self.secure.load_states(app).map_err(|e| e.to_string())?;
        Ok(())
    }
}
