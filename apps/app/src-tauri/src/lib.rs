use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub children: Vec<FileNode>,
}

fn sort_nodes(nodes: &mut Vec<FileNode>) {
    nodes.sort_by(|a, b| {
        if a.is_directory != b.is_directory {
            return if a.is_directory {
                std::cmp::Ordering::Less
            } else {
                std::cmp::Ordering::Greater
            };
        }
        a.name.to_lowercase().cmp(&b.name.to_lowercase())
    });

    for node in nodes {
        if !node.children.is_empty() {
            sort_nodes(&mut node.children);
        }
    }
}

#[cfg(not(target_os = "android"))]
fn build_tree_recursive_desktop(path_str: &str) -> std::io::Result<Vec<FileNode>> {
    use std::fs;
    let mut nodes = Vec::new();
    let entries = fs::read_dir(path_str)?;

    for entry in entries {
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
        use tauri_plugin_android_fs::FileUri;

        let api = app.android_fs();

        let json_obj = serde_json::json!({
            "uri": path,
            "documentTopTreeUri": document_top_tree_uri
        });
        let file_uri = FileUri::from_json_str(&json_obj.to_string())
            .map_err(|e| format!("Failed to create FileUri: {}", e))?;

        let entries = api.read_dir(&file_uri)
            .map_err(|e| e.to_string())?;

        let mut nodes = Vec::new();
        for entry in entries {
            let name = entry.name().to_string();
            let is_directory = entry.is_dir();

            let starts_with_dot = name.starts_with('.');
            let ends_with_md = name.ends_with(".md");

            if (is_directory && !starts_with_dot) || ends_with_md {
                let path_uri = format!("{}%2F{}", path, urlencoding::encode(&name));

                let mut children = Vec::new();
                if is_directory {
                    children = build_tree_recursive_android(
                        app.clone(),
                        path_uri.clone(),
                        document_top_tree_uri.clone()
                    ).await?;
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
    _app: tauri::AppHandle,
    path: String,
    _document_top_tree_uri: Option<String>,
) -> Result<Vec<FileNode>, String> {
    let nodes;

    #[cfg(target_os = "android")]
    {
        // On Android, we need the app handle and args.
        // But we renamed arguments to start with _.
        // We can use them directly.
        let mut unsorted_nodes = build_tree_recursive_android(_app, path, _document_top_tree_uri).await?;
        sort_nodes(&mut unsorted_nodes);
        nodes = unsorted_nodes;
    }

    #[cfg(not(target_os = "android"))]
    {
        nodes = tauri::async_runtime::spawn_blocking(move || {
            let mut n = build_tree_recursive_desktop(&path)?;
            sort_nodes(&mut n);
            Ok(n)
        }).await.map_err(|e| e.to_string())?
          .map_err(|e: std::io::Error| e.to_string())?;
    }

    Ok(nodes)
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
