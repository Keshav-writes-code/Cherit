use automerge::{Automerge, ObjType, ReadDoc, transaction::Transactable, ROOT};
use std::collections::HashMap;
use std::path::PathBuf;
use tokio::fs;

#[allow(dead_code)]
pub struct DocumentState {
    pub automerge_doc: Automerge,
    pub text_obj_id: automerge::ObjId,
    pub path: PathBuf,
}

#[allow(dead_code)]
pub struct CrdtManager {
    pub base_dir: PathBuf,
    pub sync_dir: PathBuf,
    pub documents: HashMap<PathBuf, DocumentState>,
}

#[allow(dead_code)]
impl CrdtManager {
    pub async fn new(base_dir: PathBuf) -> Result<Self, String> {
        let sync_dir = base_dir.join(".sync");
        if !sync_dir.exists() {
            fs::create_dir_all(&sync_dir)
                .await
                .map_err(|e| format!("Failed to create .sync dir: {}", e))?;
        }

        Ok(Self {
            base_dir,
            sync_dir,
            documents: HashMap::new(),
        })
    }

    pub async fn load_or_create_doc(&mut self, relative_path: &PathBuf) -> Result<(), String> {
        let abs_file_path = self.base_dir.join(relative_path);
        let sync_file_path = self.sync_dir.join(relative_path.with_extension("am"));

        let mut automerge_doc = Automerge::new();
        let mut text_obj_id = None;

        if sync_file_path.exists() {
            let data = fs::read(&sync_file_path)
                .await
                .map_err(|e| format!("Failed to read sync file: {}", e))?;
            automerge_doc = Automerge::load(&data)
                .map_err(|e| format!("Failed to load automerge doc: {}", e))?;

            if let Ok(Some((automerge::Value::Object(ObjType::Text), id))) = automerge_doc.get(ROOT, "content") {
                text_obj_id = Some(id);
            }
        }

        if text_obj_id.is_none() {
            let mut tx = automerge_doc.transaction();
            let new_id = tx.put_object(ROOT, "content", ObjType::Text)
                .map_err(|e| format!("Failed to create text object: {}", e))?;

            if abs_file_path.exists() {
                if let Ok(content) = fs::read_to_string(&abs_file_path).await {
                    tx.splice_text(&new_id, 0, 0, &content)
                        .map_err(|e| format!("Failed to splice initial content: {}", e))?;
                }
            } else {
                // Ensure the base directory exists if this is a newly synced file
                if let Some(parent) = abs_file_path.parent() {
                    let _ = fs::create_dir_all(parent).await;
                }
                // Pre-create the empty markdown file
                let _ = fs::write(&abs_file_path, "").await;
            }
            tx.commit();
            text_obj_id = Some(new_id);

            if let Some(parent) = sync_file_path.parent() {
                fs::create_dir_all(parent)
                    .await
                    .map_err(|e| format!("Failed to create sync subdirs: {}", e))?;
            }
            fs::write(&sync_file_path, automerge_doc.save())
                .await
                .map_err(|e| format!("Failed to write initial sync file: {}", e))?;
        }

        self.documents.insert(
            relative_path.clone(),
            DocumentState {
                automerge_doc,
                text_obj_id: text_obj_id.unwrap(),
                path: relative_path.clone(),
            },
        );

        Ok(())
    }

    pub async fn update_doc_from_file(&mut self, relative_path: &PathBuf) -> Result<(), String> {
        let abs_file_path = self.base_dir.join(relative_path);
        let sync_file_path = self.sync_dir.join(relative_path.with_extension("am"));

        if !self.documents.contains_key(relative_path) {
            self.load_or_create_doc(relative_path).await?;
        }

        if let Some(doc_state) = self.documents.get_mut(relative_path) {
            let new_content = match fs::read_to_string(&abs_file_path).await {
                Ok(c) => c,
                Err(_) => {
                    // If the file cannot be read, assume it was deleted or missing.
                    // For now, we'll treat it as empty.
                    String::new()
                }
            };

            // Calculate basic text change to minimize history bloat
            let current_text = doc_state.automerge_doc.text(&doc_state.text_obj_id)
                .unwrap_or_default();

            // Only mutate if there's actually a change
            if current_text != new_content {
                // If it is completely different we splice the whole text out and in.
                // However, if new_content is empty (e.g. file just created or wiped),
                // we still need to record the deletion.
                let mut tx = doc_state.automerge_doc.transaction();
                let current_len = tx.length(&doc_state.text_obj_id);
                tx.splice_text(&doc_state.text_obj_id, 0, current_len as isize, &new_content)
                    .map_err(|e| format!("Failed to update content via splice: {}", e))?;
                tx.commit();
            }

            fs::write(&sync_file_path, doc_state.automerge_doc.save())
                .await
                .map_err(|e| format!("Failed to save sync file: {}", e))?;
        }

        Ok(())
    }

    pub async fn apply_sync_data(&mut self, relative_path: &PathBuf, remote_data: &[u8]) -> Result<(), String> {
        let sync_file_path = self.sync_dir.join(relative_path.with_extension("am"));
        let abs_file_path = self.base_dir.join(relative_path);

        if !self.documents.contains_key(relative_path) {
            self.load_or_create_doc(relative_path).await?;
        }

        if let Some(doc_state) = self.documents.get_mut(relative_path) {
            let mut remote_doc = Automerge::load(remote_data)
                .map_err(|e| format!("Failed to load remote automerge doc: {}", e))?;

            doc_state.automerge_doc.merge(&mut remote_doc)
                .map_err(|e| format!("Failed to merge docs: {}", e))?;

            // Save updated sync state
            fs::write(&sync_file_path, doc_state.automerge_doc.save())
                .await
                .map_err(|e| format!("Failed to save sync file after merge: {}", e))?;

            // Project new state to plain markdown file
            if let Ok(content_str) = doc_state.automerge_doc.text(&doc_state.text_obj_id) {
                fs::write(&abs_file_path, content_str)
                    .await
                    .map_err(|e| format!("Failed to write merged content to markdown: {}", e))?;
            }
        }

        Ok(())
    }
}
