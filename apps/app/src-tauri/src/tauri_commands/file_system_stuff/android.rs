use super::FileNode;

pub fn build_tree_recursive_android(
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

async fn rename_file_android_impl(
    app: tauri::AppHandle,
    uri: String,
    new_name: String,
    document_top_tree_uri: Option<String>,
) -> Result<String, String> {
    use tauri_plugin_android_fs::AndroidFsExt;
    use tauri_plugin_android_fs::FileUri;

    let app_clone = app.clone();

    // 1. Derive parent URI for return value
    let parent_uri = match uri.rsplit_once("%2F") {
        Some((parent, _)) => parent.to_string(),
        None => {
            return Err("Could not determine parent URI from path".to_string());
        }
    };

    let new_name_clone = new_name.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let api = app_clone.android_fs();
        let source_json = serde_json::json!({
            "uri": uri,
            "documentTopTreeUri": document_top_tree_uri
        });
        let source_file_uri = FileUri::from_json_str(&source_json.to_string())
            .map_err(|e| format!("Failed to create Source FileUri: {}", e))?;

        api.rename(&source_file_uri, &new_name_clone)
            .map_err(|e| format!("Failed to rename file: {}", e))?;

        Ok::<(), String>(())
    })
    .await
    .map_err(|e| e.to_string())??;

    let new_constructed_path = format!("{}%2F{}", parent_uri, urlencoding::encode(&new_name));
    Ok(new_constructed_path)
}

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

fn move_recursive_sync<R: tauri::Runtime>(
    api: &tauri_plugin_android_fs::api::api_sync::AndroidFs<R>,
    source_uri: String,
    target_parent_uri: String,
    target_name: String,
    document_top_tree_uri: Option<String>,
    is_directory: bool,
) -> Result<String, String> {
    use tauri_plugin_android_fs::FileUri;

    if !is_directory {
        let source_json = serde_json::json!({
            "uri": source_uri,
            "documentTopTreeUri": document_top_tree_uri
        });
        let source_file_uri = FileUri::from_json_str(&source_json.to_string())
            .map_err(|e| format!("Failed to create Source FileUri: {}", e))?;

        let content = api
            .read(&source_file_uri)
            .map_err(|e| format!("Failed to read source file: {}", e))?;

        let parent_json = serde_json::json!({
            "uri": target_parent_uri,
            "documentTopTreeUri": document_top_tree_uri
        });
        let parent_file_uri = FileUri::from_json_str(&parent_json.to_string())
            .map_err(|e| format!("Failed to create Parent FileUri: {}", e))?;

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

        api.remove_file(&source_file_uri)
            .map_err(|e| format!("Failed to delete source file: {}", e))?;

        let new_constructed_path = format!(
            "{}%2F{}",
            target_parent_uri,
            urlencoding::encode(&target_name)
        );
        Ok(new_constructed_path)
    } else {
        let parent_json = serde_json::json!({
            "uri": target_parent_uri,
            "documentTopTreeUri": document_top_tree_uri
        });
        let parent_file_uri = FileUri::from_json_str(&parent_json.to_string())
            .map_err(|e| format!("Failed to create Parent FileUri: {}", e))?;

        // create_dir_all is the available method for creating directories
        let _ = api
            .create_dir_all(&parent_file_uri, &target_name)
            .map_err(|e| format!("Failed to create new directory: {}", e))?;

        let new_dir_path_str = format!(
            "{}%2F{}",
            target_parent_uri,
            urlencoding::encode(&target_name)
        );

        let source_json = serde_json::json!({
            "uri": source_uri,
            "documentTopTreeUri": document_top_tree_uri
        });
        let source_file_uri = FileUri::from_json_str(&source_json.to_string())
            .map_err(|e| format!("Failed to create Source FileUri: {}", e))?;

        let entries = api
            .read_dir(&source_file_uri)
            .map_err(|e| format!("Failed to read source directory: {}", e))?;

        for entry in entries {
            let child_name = entry.name().to_string();
            let child_is_dir = entry.is_dir();
            let child_source_uri = format!("{}%2F{}", source_uri, urlencoding::encode(&child_name));

            move_recursive_sync(
                api,
                child_source_uri,
                new_dir_path_str.clone(),
                child_name,
                document_top_tree_uri.clone(),
                child_is_dir,
            )?;
        }

        api.remove_dir(&source_file_uri)
            .map_err(|e| format!("Failed to remove source directory: {}", e))?;

        Ok(new_dir_path_str)
    }
}

#[tauri::command]
pub async fn rename_directory_android(
    app: tauri::AppHandle,
    uri: String,
    new_name: String,
    document_top_tree_uri: Option<String>,
) -> Result<String, String> {
    #[cfg(target_os = "android")]
    {
        use tauri_plugin_android_fs::AndroidFsExt;
        use tauri_plugin_android_fs::FileUri;

        let app_clone = app.clone();
        // We need parent URI to construct the new path string at the end?
        // Actually, if we rename, the ID usually stays the same in SAF, but the path string we use in the app (uri based)
        // might depend on the name if we constructed it using name.
        // In `build_tree_recursive_android`, we construct path as `parent_uri + encoded_name`.
        // So yes, we need to return the new constructed path.

        let parent_uri = match uri.rsplit_once("%2F") {
            Some((parent, _)) => parent.to_string(),
            None => return Err("Could not determine parent URI".to_string()),
        };

        let new_name_clone = new_name.clone();
        tauri::async_runtime::spawn_blocking(move || {
            let api = app_clone.android_fs();

            let source_json = serde_json::json!({
                "uri": uri,
                "documentTopTreeUri": document_top_tree_uri
            });
            let source_file_uri = FileUri::from_json_str(&source_json.to_string())
                .map_err(|e| format!("Failed to create Source FileUri: {}", e))?;

            // Try native rename
            // Note: The signature might be `rename(&self, file: &FileUri, new_name: &str)`
            api.rename(&source_file_uri, &new_name_clone)
                .map_err(|e| format!("Failed to rename directory: {}", e))?;

            Ok::<(), String>(())
        })
        .await
        .map_err(|e| e.to_string())??;

        // Construct new path
        let new_constructed_path = format!("{}%2F{}", parent_uri, urlencoding::encode(&new_name));
        Ok(new_constructed_path)
    }
    #[cfg(not(target_os = "android"))]
    {
        Err("Not supported on this platform".to_string())
    }
}

#[tauri::command]
pub async fn move_directory_android(
    app: tauri::AppHandle,
    uri: String,
    new_parent_uri: String,
    document_top_tree_uri: Option<String>,
) -> Result<String, String> {
    #[cfg(target_os = "android")]
    {
        use tauri_plugin_android_fs::AndroidFsExt;
        let app_clone = app.clone();

        // Extract name from uri
        let name_encoded = match uri.rsplit_once("%2F") {
            Some((_, name)) => name,
            None => return Err("Could not extract name from URI".to_string()),
        };
        let name = urlencoding::decode(name_encoded)
            .map_err(|e| format!("Failed to decode filename: {}", e))?
            .to_string();

        tauri::async_runtime::spawn_blocking(move || {
            let api = app_clone.android_fs();
            move_recursive_sync(
                &api,
                uri,
                new_parent_uri,
                name,
                document_top_tree_uri,
                true, // is_directory
            )
        })
        .await
        .map_err(|e| e.to_string())?
    }
    #[cfg(not(target_os = "android"))]
    {
        Err("Not supported on this platform".to_string())
    }
}

// Updating rename_file_android to just use the new sync helper if we wanted, but existing impl is fine for files.
// However, the user asked to "fix move_node for directories".
// So I will update `move_file_android` (or just leave it and use `move_directory_android` in frontend).
// The user said "implement a rename_directory_android Rust command".
// I will stick to adding the new commands.

#[tauri::command]
pub async fn rename_file_android(
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
pub async fn move_file_android(
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
