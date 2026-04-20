use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::{
    error::Error,
    fs::{self, File},
    path::PathBuf,
};
use tauri::{AppHandle, Manager};

const CONFIG_FILE_NAME: &str = "config.json";
const LATEST_SCHEMA_V: u8 = 1;

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
    pub fn save_states(
        &mut self,
        app: &AppHandle,
        states: &AppPersistentStates,
    ) -> Result<(), Box<dyn Error>> {
        self.schema_version= states.schema_version;
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

        // Run migrations if needed
        if self.schema_version == LATEST_SCHEMA_V {
            return Ok(());
        }

        Err(format!(
            "Current Schema version is Unsuppoirted : {}",
            self.schema_version
        )
        .into())

        // Future Migration Pipeline (Uncomment when LATEST_SCHEMA_V is 2)
        // while self.schema_version < LATEST_SCHEMA_V {
        //     match self.schema_version {
        //         1 => migrate_1_to_2(&mut self),
        //         _ => return Err("The Schema is not Valid".into()),
        //     }
        // }

        // Ok(())
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
