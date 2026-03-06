use automerge::{Automerge, ReadDoc, transaction::Transactable, ROOT};
use std::collections::HashMap;
use std::path::PathBuf;
use tokio::fs;

#[allow(dead_code)]
pub struct DocumentState {
    pub automerge_doc: Automerge,
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

        if sync_file_path.exists() {
            // Load existing Automerge doc
            let data = fs::read(&sync_file_path)
                .await
                .map_err(|e| format!("Failed to read sync file: {}", e))?;
            automerge_doc = Automerge::load(&data)
                .map_err(|e| format!("Failed to load automerge doc: {}", e))?;
        } else if abs_file_path.exists() {
            // New doc but file exists, initialize it
            let content = fs::read_to_string(&abs_file_path)
                .await
                .map_err(|e| format!("Failed to read markdown file: {}", e))?;

            let mut tx = automerge_doc.transaction();
            tx.put(ROOT, "content", content)
                .map_err(|e| format!("Failed to put initial content: {}", e))?;
            tx.commit();

            // Save the initialized doc
            if let Some(parent) = sync_file_path.parent() {
                fs::create_dir_all(parent)
                    .await
                    .map_err(|e| format!("Failed to create sync subdirs: {}", e))?;
            }
            fs::write(&sync_file_path, automerge_doc.save())
                .await
                .map_err(|e| format!("Failed to write initial sync file: {}", e))?;
        } else {
            // Entirely new document
            let mut tx = automerge_doc.transaction();
            tx.put(ROOT, "content", "")
                .map_err(|e| format!("Failed to put empty content: {}", e))?;
            tx.commit();
        }

        self.documents.insert(
            relative_path.clone(),
            DocumentState {
                automerge_doc,
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
            let content = fs::read_to_string(&abs_file_path)
                .await
                .map_err(|e| format!("Failed to read markdown file: {}", e))?;

            // Simple text replacement for MVP instead of diffing
            // A more complex implementation would diff `content` with the current CRDT text
            // and apply splice operations.
            let mut tx = doc_state.automerge_doc.transaction();
            tx.put(ROOT, "content", content)
                .map_err(|e| format!("Failed to update content: {}", e))?;
            tx.commit();

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
            if let Ok(Some((value, _))) = doc_state.automerge_doc.get(ROOT, "content") {
                if let automerge::Value::Scalar(s) = value {
                    let content_str = s.to_string();
                    fs::write(&abs_file_path, content_str)
                        .await
                        .map_err(|e| format!("Failed to write merged content to markdown: {}", e))?;
                }
            }
        }

        Ok(())
    }
}
