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
                        match build_tree_recursive_desktop(&path) {
                            Ok(sub_children) => {
                                children = sub_children;
                            }
                            Err(e) => {
                                eprintln!("Failed to read subdirectory '{}': {}", path, e);
                            }
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

        let entries = api.read_dir(&file_uri).map_err(|e| e.to_string())?;

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
                        document_top_tree_uri.clone(),
                    )
                    .await?;
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
async fn rename_file_android_impl(
    app: tauri::AppHandle,
    uri: String,
    new_name: String,
    document_top_tree_uri: Option<String>,
) -> Result<String, String> {
    use tauri_plugin_android_fs::AndroidFsExt;
    use tauri_plugin_android_fs::FileUri;

    let api = app.android_fs();

    // 1. Derive parent URI
    let parent_uri = match uri.rsplit_once("%2F") {
        Some((parent, _)) => parent.to_string(),
        None => {
            return Err("Could not determine parent URI from path".to_string());
        }
    };

    let source_json = serde_json::json!({
        "uri": uri,
        "documentTopTreeUri": document_top_tree_uri
    });
    let source_file_uri = FileUri::from_json_str(&source_json.to_string())
        .map_err(|e| format!("Failed to create Source FileUri: {}", e))?;

    // 2. Read content
    let content = api
        .read(&source_file_uri)
        .map_err(|e| format!("Failed to read source file: {}", e))?;

    // 3. Create new file in parent
    let parent_json = serde_json::json!({
        "uri": parent_uri,
        "documentTopTreeUri": document_top_tree_uri
    });
    let parent_file_uri = FileUri::from_json_str(&parent_json.to_string())
        .map_err(|e| format!("Failed to create Parent FileUri: {}", e))?;

    // Determine mime type
    let mime_type = if new_name.ends_with(".md") {
        "text/markdown"
    } else {
        "application/octet-stream"
    };

    let new_file_uri = api
        .create_new_file(&parent_file_uri, &new_name, Some(mime_type))
        .map_err(|e| format!("Failed to create new file: {}", e))?;

    // 4. Write content to new file
    api.write(&new_file_uri, &content)
        .map_err(|e| format!("Failed to write to new file: {}", e))?;

    // 5. Delete old file
    api.remove_file(&source_file_uri)
        .map_err(|e| format!("Failed to delete source file: {}", e))?;

    let new_constructed_path = format!("{}%2F{}", parent_uri, urlencoding::encode(&new_name));
    Ok(new_constructed_path)
}

#[cfg(target_os = "android")]
async fn move_file_android_impl(
    app: tauri::AppHandle,
    uri: String,
    new_parent_uri: String,
    document_top_tree_uri: Option<String>,
) -> Result<String, String> {
    use tauri_plugin_android_fs::AndroidFsExt;
    use tauri_plugin_android_fs::FileUri;

    let api = app.android_fs();

    // 1. Derive filename from source URI
    let name_encoded = match uri.rsplit_once("%2F") {
        Some((_, name)) => name,
        None => return Err("Could not extract filename from URI".to_string()),
    };
    let name = urlencoding::decode(name_encoded)
        .map_err(|e| format!("Failed to decode filename: {}", e))?
        .to_string();

    let source_json = serde_json::json!({
        "uri": uri,
        "documentTopTreeUri": document_top_tree_uri
    });
    let source_file_uri = FileUri::from_json_str(&source_json.to_string())
        .map_err(|e| format!("Failed to create Source FileUri: {}", e))?;

    // 2. Read content
    let content = api
        .read(&source_file_uri)
        .map_err(|e| format!("Failed to read source file: {}", e))?;

    // 3. Create new file in new parent
    let parent_json = serde_json::json!({
        "uri": new_parent_uri,
        "documentTopTreeUri": document_top_tree_uri
    });
    let parent_file_uri = FileUri::from_json_str(&parent_json.to_string())
        .map_err(|e| format!("Failed to create Parent FileUri: {}", e))?;

    let mime_type = if name.ends_with(".md") {
        "text/markdown"
    } else {
        "application/octet-stream"
    };

    let new_file_uri = api
        .create_new_file(&parent_file_uri, &name, Some(mime_type))
        .map_err(|e| format!("Failed to create new file: {}", e))?;

    // 4. Write content
    api.write(&new_file_uri, &content)
        .map_err(|e| format!("Failed to write to new file: {}", e))?;

    // 5. Delete old
    api.remove_file(&source_file_uri)
        .map_err(|e| format!("Failed to delete source file: {}", e))?;

    // Return constructed path
    let new_constructed_path = format!("{}%2F{}", new_parent_uri, name_encoded);
    Ok(new_constructed_path)
}

#[tauri::command]
async fn rename_file_android(
    app: tauri::AppHandle,
    uri: String,
    new_name: String,
    document_top_tree_uri: Option<String>,
) -> Result<String, String> {
    #[cfg(target_os = "android")]
    {
        rename_file_android_impl(app, uri, new_name, document_top_tree_uri).await
    }
    #[cfg(not(target_os = "android"))]
    {
        Err("Not supported on this platform".to_string())
    }
}

#[tauri::command]
async fn move_file_android(
    app: tauri::AppHandle,
    uri: String,
    new_parent_uri: String,
    document_top_tree_uri: Option<String>,
) -> Result<String, String> {
    #[cfg(target_os = "android")]
    {
        move_file_android_impl(app, uri, new_parent_uri, document_top_tree_uri).await
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
            rename_file_android,
            move_file_android
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
