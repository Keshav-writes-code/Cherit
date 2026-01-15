use serde::{Deserialize, Serialize};

#[cfg(all(test, not(target_os = "android")))]
mod desktop_test;

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
        // Use natural ordering with case-insensitive comparison
        // to match TypeScript's localeCompare with numeric: true
        natord::compare_ignore_case(&a.name, &b.name)
    });

    for node in nodes {
        if !node.children.is_empty() {
            sort_nodes(&mut node.children);
        }
    }
}

#[cfg(not(target_os = "android"))]
fn build_tree_recursive_desktop(path_str: &str) -> std::io::Result<Vec<FileNode>> {
    use rayon::prelude::*;
    use std::fs;

    // Collect entries first to handle errors and prepare for parallel iteration
    let entries = fs::read_dir(path_str)?
        .collect::<Result<Vec<_>, std::io::Error>>()?;

    let nodes = entries
        .into_par_iter()
        .filter_map(|entry| {
            if let Ok(metadata) = entry.metadata() {
                let file_name = entry.file_name().to_string_lossy().to_string();

                let is_directory = metadata.is_dir();
                let starts_with_dot = file_name.starts_with('.');
                let ends_with_md = file_name.ends_with(".md");

                if (is_directory && !starts_with_dot) || ends_with_md {
                    let path = entry.path().to_string_lossy().to_string();
                    let mut children = Vec::new();

                    if is_directory {
                        match build_tree_recursive_desktop(&path) {
                            Ok(sub_children) => {
                                children = sub_children;
                            }
                            Err(e) => {
                                eprintln!("Failed to read subdirectory '{}': {}", path, e);
                            }
                        }
                    }

                    Some(FileNode {
                        name: file_name.trim_end_matches(".md").to_string(),
                        path,
                        is_directory,
                        children,
                    })
                } else {
                    None
                }
            } else {
                None
            }
        })
        .collect();

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

        let entries = tauri::async_runtime::spawn_blocking(move || {
            api.read_dir(&file_uri).map_err(|e| e.to_string())
        })
        .await
        .map_err(|e| format!("Task join failed: {}", e))??;

        let mut child_handles = Vec::new();
        let mut files = Vec::new();

        for entry in entries {
            let name = entry.name().to_string();
            let is_directory = entry.is_dir();

            let starts_with_dot = name.starts_with('.');
            let ends_with_md = name.ends_with(".md");

            if (is_directory && !starts_with_dot) || ends_with_md {
                let path_uri = format!("{}%2F{}", path, urlencoding::encode(&name));

                if is_directory {
                    let app_clone = app.clone();
                    let path_uri_clone = path_uri.clone();
                    let doc_uri_clone = document_top_tree_uri.clone();
                    let name_clone = name.clone();

                    child_handles.push(tauri::async_runtime::spawn(async move {
                        let children = build_tree_recursive_android(
                            app_clone,
                            path_uri_clone.clone(),
                            doc_uri_clone,
                        )
                        .await?;
                        Ok::<FileNode, String>(FileNode {
                            name: name_clone.trim_end_matches(".md").to_string(),
                            path: path_uri_clone,
                            is_directory: true,
                            children,
                        })
                    }));
                } else {
                    files.push(FileNode {
                        name: name.trim_end_matches(".md").to_string(),
                        path: path_uri,
                        is_directory: false,
                        children: Vec::new(),
                    });
                }
            }
        }

        let mut nodes = files;
        let results = futures::future::join_all(child_handles).await;

        for res in results {
            match res {
                Ok(inner_res) => match inner_res {
                    Ok(node) => nodes.push(node),
                    Err(e) => return Err(e),
                },
                Err(e) => return Err(format!("Task failed: {}", e)),
            }
        }

        Ok(nodes)
    })
}

#[tauri::command]
#[allow(unused_variables)]
async fn build_file_tree(
    app: tauri::AppHandle,
    path: String,
    document_top_tree_uri: Option<String>,
) -> Result<Vec<FileNode>, String> {
    let nodes;

    #[cfg(target_os = "android")]
    {
        // On Android, we need the app handle and args.
        // We can use them directly.
        // (Parameter names no longer start with _.)
        let mut unsorted_nodes =
            build_tree_recursive_android(app, path, document_top_tree_uri).await?;
        sort_nodes(&mut unsorted_nodes);
        nodes = unsorted_nodes;
    }

    #[cfg(not(target_os = "android"))]
    {
        nodes = tauri::async_runtime::spawn_blocking(move || {
            let mut n = build_tree_recursive_desktop(&path)?;
            sort_nodes(&mut n);
            Ok(n)
        })
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e: std::io::Error| e.to_string())?;
    }

    Ok(nodes)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_android_fs::init())
        .plugin(tauri_plugin_safe_area_insets_css::init())
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
