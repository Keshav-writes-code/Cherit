pub mod android;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub children: Vec<FileNode>,
}

pub fn sort_nodes(nodes: &mut Vec<FileNode>) {
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
pub fn build_tree_recursive_desktop(path_str: &str) -> std::io::Result<Vec<FileNode>> {
    use rayon::prelude::*;
    use std::fs;

    // Collect entries first to handle errors and prepare for parallel iteration
    let entries = fs::read_dir(path_str)?.collect::<Result<Vec<_>, std::io::Error>>()?;

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

#[tauri::command]
#[allow(unused_variables)]
pub async fn build_file_tree(
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
            android::build_tree_recursive_android(app, path, document_top_tree_uri).await?;
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

