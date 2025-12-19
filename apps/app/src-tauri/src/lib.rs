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
        use tauri_plugin_android_fs::EntryOptions;
        use futures::future::join_all;

        let api = app.android_fs();

        let json_obj = serde_json::json!({
            "uri": path,
            "documentTopTreeUri": document_top_tree_uri
        });
        let file_uri = FileUri::from_json_str(&json_obj.to_string())
            .map_err(|e| format!("Failed to create FileUri: {}", e))?;

        let options = EntryOptions {
            uri: false,
            name: true,
            last_modified: false,
            len: false,
            mime_type: false,
        };

        let entries = api.read_dir_with_options(&file_uri, options)
            .map_err(|e| e.to_string())?;

        let mut futures = Vec::new();
        let mut nodes = Vec::new();

        for entry in entries {
            let is_directory = entry.is_dir();
            let name_opt = entry.name();

            if let Some(name_str) = name_opt {
                let name = name_str.to_string();
                let starts_with_dot = name.starts_with('.');
                let ends_with_md = name.ends_with(".md");

                if (is_directory && !starts_with_dot) || ends_with_md {
                    let path_uri = format!("{}%2F{}", path, urlencoding::encode(&name));

                    if is_directory {
                        let app_clone = app.clone();
                        let path_clone = path_uri.clone();
                        let doc_uri_clone = document_top_tree_uri.clone();
                        let name_clone = name.clone();

                        futures.push(async move {
                             let children_res = build_tree_recursive_android(
                                app_clone,
                                path_clone.clone(),
                                doc_uri_clone
                            ).await;

                            match children_res {
                                Ok(children) => Some(FileNode {
                                    name: name_clone.trim_end_matches(".md").to_string(),
                                    path: path_clone,
                                    is_directory: true,
                                    children,
                                }),
                                Err(_) => None
                            }
                        });
                    } else {
                        nodes.push(FileNode {
                            name: name.trim_end_matches(".md").to_string(),
                            path: path_uri,
                            is_directory: false,
                            children: vec![],
                        });
                    }
                }
            }
        }

        let results = join_all(futures).await;
        for res in results {
            if let Some(node) = res {
                nodes.push(node);
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
    let nodes;

    #[cfg(target_os = "android")]
    {
        let mut unsorted_nodes = build_tree_recursive_android(app, path, document_top_tree_uri).await?;
        sort_nodes(&mut unsorted_nodes);
        nodes = unsorted_nodes;
    }

    #[cfg(not(target_os = "android"))]
    {
        // Suppress unused variable warnings on desktop
        let _ = app;
        let _ = document_top_tree_uri;
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
