use hf_hub::api::tokio::Api;
use tauri_plugin_llm::LLMRuntimeConfig;

#[tauri::command]
pub async fn download_and_load_model(model_repo: String) -> Result<String, String> {
    let api = Api::new().map_err(|e| e.to_string())?;
    let repo = api.model(model_repo.clone());
    let info = repo.info().await.map_err(|e| e.to_string())?;

    for sibling in info.siblings {
        let file_name = sibling.rfilename;
        if file_name.ends_with(".json") || file_name.ends_with(".safetensors") {
            println!("Downloading {}...", &file_name);
            repo.get(&file_name).await.map_err(|e| e.to_string())?;
        }
    }

    let config = LLMRuntimeConfig::from_hf_local_cache(model_repo, None::<&str>)
        .map_err(|e| e.to_string())?;

    serde_json::to_string(&config).map_err(|e| e.to_string())
}
