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

        let json_obj = serde_json::json!({
            "uri": path,
            "documentTopTreeUri": document_top_tree_uri
        });
        let file_uri_str = json_obj.to_string();

        let app_clone = app.clone();

        let entries = tauri::async_runtime::spawn_blocking(move || {
            let api = app_clone.android_fs();
            let file_uri = FileUri::from_json_str(&file_uri_str)
                .map_err(|e| format!("Failed to create FileUri: {}", e))?;
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

#[cfg(target_os = "android")]
fn copy_recursive_android(
    app: tauri::AppHandle,
    source_uri: String,
    target_parent_uri: String,
    target_name: String,
    document_top_tree_uri: Option<String>,
) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<(), String>> + Send>> {
    Box::pin(async move {
        use tauri_plugin_android_fs::AndroidFsExt;
        use tauri_plugin_android_fs::FileUri;

        let api = app.android_fs();

        let source_json = serde_json::json!({
            "uri": source_uri,
            "documentTopTreeUri": document_top_tree_uri
        });
        let source_file_uri = FileUri::from_json_str(&source_json.to_string())
            .map_err(|e| format!("Failed to create Source FileUri: {}", e))?;

        // Check if directory
        // We use read_dir to check. If it works, it's a directory.
        let is_dir = api.read_dir(&source_file_uri).is_ok();

        let parent_json = serde_json::json!({
            "uri": target_parent_uri,
            "documentTopTreeUri": document_top_tree_uri
        });
        let parent_file_uri = FileUri::from_json_str(&parent_json.to_string())
            .map_err(|e| format!("Failed to create Parent FileUri: {}", e))?;

        if is_dir {
            // Create Dir
            // Assuming create_dir exists and returns the new URI
            api.create_dir_all(&parent_file_uri, &target_name)
                .map_err(|e| format!("Failed to create new directory: {}", e))?;

            // Recurse
            let entries = api
                .read_dir(&source_file_uri)
                .map_err(|e| e.to_string())?;

            let mut handles = Vec::new();

            // Construct new parent path string
            let new_dir_path_str =
                format!("{}%2F{}", target_parent_uri, urlencoding::encode(&target_name));

            for entry in entries {
                let name = entry.name().to_string();
                let child_source_path = format!("{}%2F{}", source_uri, urlencoding::encode(&name));

                let app_clone = app.clone();
                let doc_uri_clone = document_top_tree_uri.clone();
                let new_dir_path_clone = new_dir_path_str.clone();

                handles.push(copy_recursive_android(
                    app_clone,
                    child_source_path,
                    new_dir_path_clone,
                    name,
                    doc_uri_clone,
                ));
            }

            futures::future::try_join_all(handles).await?;
        } else {
            // File Copy
            let content = api
                .read(&source_file_uri)
                .map_err(|e| format!("Failed to read source file: {}", e))?;

            let mime_type = if target_name.ends_with(".md") {
                "text/markdown"
            } else {
                "application/octet-stream"
            };

            let new_file_uri = api
                .create_new_file(&parent_file_uri, &target_name, Some(mime_type))
                .map_err(|e| format!("Failed to create new file: {}", e))?;

            api.write(&new_file_uri, &content)
                .map_err(|e| format!("Failed to write to new file: {}", e))?;
        }

        Ok(())
    })
}

#[cfg(target_os = "android")]
fn delete_recursive_android(
    app: tauri::AppHandle,
    target_uri: String,
    document_top_tree_uri: Option<String>,
) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<(), String>> + Send>> {
    Box::pin(async move {
        use tauri_plugin_android_fs::AndroidFsExt;
        use tauri_plugin_android_fs::FileUri;

        let api = app.android_fs();

        let target_json = serde_json::json!({
            "uri": target_uri,
            "documentTopTreeUri": document_top_tree_uri
        });
        let target_file_uri = FileUri::from_json_str(&target_json.to_string())
            .map_err(|e| format!("Failed to create Target FileUri: {}", e))?;

        let is_dir = api.read_dir(&target_file_uri).is_ok();

        if is_dir {
            api.remove_dir_all(&target_file_uri)
                .map_err(|e| format!("Failed to remove directory: {}", e))?;
        } else {
            api.remove_file(&target_file_uri)
                .map_err(|e| format!("Failed to remove file: {}", e))?;
        }
        Ok(())
    })
}

#[cfg(target_os = "android")]
async fn move_node_android_impl(
    app: tauri::AppHandle,
    source_uri: String,
    new_parent_uri: String,
    new_name: Option<String>,
    document_top_tree_uri: Option<String>,
) -> Result<String, String> {
    // 1. Determine target name
    let target_name = if let Some(n) = new_name {
        n
    } else {
        // Extract from source URI
        let name_encoded = match source_uri.rsplit_once("%2F") {
            Some((_, name)) => name,
            None => return Err("Could not extract filename from URI".to_string()),
        };
        urlencoding::decode(name_encoded)
            .map_err(|e| format!("Failed to decode filename: {}", e))?
            .to_string()
    };

    // 2. Recursive Copy
    copy_recursive_android(
        app.clone(),
        source_uri.clone(),
        new_parent_uri.clone(),
        target_name.clone(),
        document_top_tree_uri.clone(),
    )
    .await?;

    // 3. Recursive Delete (Source)
    delete_recursive_android(app, source_uri, document_top_tree_uri).await?;

    // 4. Return new path
    let new_constructed_path =
        format!("{}%2F{}", new_parent_uri, urlencoding::encode(&target_name));
    Ok(new_constructed_path)
}

#[tauri::command]
async fn rename_node_android(
    app: tauri::AppHandle,
    uri: String,
    new_name: String,
    document_top_tree_uri: Option<String>,
) -> Result<String, String> {
    #[cfg(target_os = "android")]
    {
        // For rename, parent is the same.
        let parent_uri = match uri.rsplit_once("%2F") {
            Some((parent, _)) => parent.to_string(),
            None => return Err("Could not determine parent URI".to_string()),
        };
        move_node_android_impl(
            app,
            uri,
            parent_uri,
            Some(new_name),
            document_top_tree_uri,
        )
        .await
    }
    #[cfg(not(target_os = "android"))]
    {
        Err("Not supported on this platform".to_string())
    }
}

#[tauri::command]
async fn move_node_android(
    app: tauri::AppHandle,
    uri: String,
    new_parent_uri: String,
    document_top_tree_uri: Option<String>,
) -> Result<String, String> {
    #[cfg(target_os = "android")]
    {
        move_node_android_impl(app, uri, new_parent_uri, None, document_top_tree_uri).await
    }
    #[cfg(not(target_os = "android"))]
    {
        Err("Not supported on this platform".to_string())
    }
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
        .invoke_handler(tauri::generate_handler![
            build_file_tree,
            rename_node_android,
            move_node_android
        ])
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
