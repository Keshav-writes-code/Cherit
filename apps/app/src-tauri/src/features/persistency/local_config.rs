use std::{error::Error, fs};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

// Global Struct
#[derive(Serialize, Deserialize)]
struct GenericPath {
    path: String,
    document_top_tree_uri: Option<String>,
}

// Domain : Wokrspace
#[derive(Serialize, Deserialize)]
struct WorkspaceMetaData {
    last_accessed: DateTime<Utc>,
    recent_file_node_path: GenericPath,
}

// Domain : Other

// Main config
#[derive(Serialize, Deserialize)]
pub struct LocalConfig {
    schema_version: u8,
    workspaces_metadata: Vec<WorkspaceMetaData>,
}

impl LocalConfig {
    pub fn save_to_file(&self, app: &AppHandle) -> Result<(), Box<dyn Error>> {
        let content = serde_json::to_string(self)?;
        let path = app.path().config_dir().unwrap().join("local_config.json");
        fs::write(path, content)?;
        Ok(())
    }

    pub fn get_config(app: &AppHandle) -> Result<LocalConfig, Box<dyn Error>> {
        let path = app.path().config_dir().unwrap().join("local_config.json");
        let raw = fs::read_to_string(path)?;
        let config = serde_json::from_str::<LocalConfig>(&raw)?;
        Ok(config)
    }
}
