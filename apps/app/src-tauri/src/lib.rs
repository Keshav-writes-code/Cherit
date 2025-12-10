use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub children: Vec<FileNode>,
}

#[cfg(not(target_os = "android"))]
fn build_tree_recursive_desktop(path_str: &str) -> std::io::Result<Vec<FileNode>> {
    use std::fs;
    let mut nodes = Vec::new();
    // read_dir can fail if permission denied, just return empty? Or propagate error?
    // Propagating is better.
    let entries = fs::read_dir(path_str)?;

    for entry in entries {
        // Ignore errors for individual entries?
        if let Ok(entry) = entry {
            if let Ok(metadata) = entry.metadata() {
                let file_name = entry.file_name().to_string_lossy().to_string();

                let is_directory = metadata.is_dir();
                let starts_with_dot = file_name.starts_with('.');
                let ends_with_md = file_name.ends_with(".md");

                if (is_directory && !starts_with_dot) || ends_with_md {
                    let path = entry.path().to_string_lossy().to_string();
                    let mut children = Vec::new();

                    if is_directory {
                        // Ignore permission errors in subdirectories by catching result
                        if let Ok(sub_children) = build_tree_recursive_desktop(&path) {
                            children = sub_children;
                        }
                    }

                    nodes.push(FileNode {
                        name: file_name.trim_end_matches(".md").to_string(),
                        path,
                        is_directory,
                        children,
                    });
                }
            }
        }
    }
    // Sort nodes?
    // nodes.sort_by(|a, b| a.name.cmp(&b.name));
    // Not explicitly requested, but good for UI.
    Ok(nodes)
}

#[cfg(target_os = "android")]
fn build_tree_recursive_android(
    app: tauri::AppHandle,
    path: String,
    document_top_tree_uri: Option<String>,
) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Vec<FileNode>, String>> + Send>> {
    Box::pin(async move {
        use tauri_plugin_android_fs::AndroidFsExt;
        let api = app.android_fs();
        let entries = api.read_dir(path.clone(), document_top_tree_uri.clone())
            .map_err(|e| e.to_string())?;

        let mut nodes = Vec::new();
        for entry in entries {
            let name = entry.name.clone();
            // Assuming entry has is_dir field or method.
            // If it's `type` field like in JS, we need to check if it matches 'Dir'.
            // Rust struct field likely `is_dir` (bool) or `kind` (enum).
            // Trying `is_dir` as property. If it fails, maybe `is_dir()` method?
            // Since we can't see the struct, we rely on standard Rust patterns.
            let is_directory = entry.is_dir;

            let starts_with_dot = name.starts_with('.');
            let ends_with_md = name.ends_with(".md");

            if (is_directory && !starts_with_dot) || ends_with_md {
                let path_uri = format!("{}%2F{}", path, urlencoding::encode(&name));

                let mut children = Vec::new();
                if is_directory {
                     children = build_tree_recursive_android(app.clone(), path_uri.clone(), document_top_tree_uri.clone()).await?;
                }

                nodes.push(FileNode {
                    name: name.trim_end_matches(".md").to_string(),
                    path: path_uri,
                    is_directory,
                    children,
                });
            }
        }
        Ok(nodes)
    })
}

#[tauri::command]
async fn build_file_tree(
    app: tauri::AppHandle,
    path: String,
    document_top_tree_uri: Option<String>,
) -> Result<Vec<FileNode>, String> {
    #[cfg(target_os = "android")]
    {
        build_tree_recursive_android(app, path, document_top_tree_uri).await
    }

    #[cfg(not(target_os = "android"))]
    {
         tauri::async_runtime::spawn_blocking(move || {
            build_tree_recursive_desktop(&path)
        }).await.map_err(|e| e.to_string())?
          .map_err(|e| e.to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_android_fs::init())
        .invoke_handler(tauri::generate_handler![build_file_tree])
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
