use rand::Rng;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PairRequest {
    pub peer_id: String,
    pub pin: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PairResponse {
    pub success: bool,
    pub message: String,
}

pub async fn generate_pin() -> String {
    let mut rng = rand::rng();
    let pin: u32 = rng.random_range(100_000..=999_999);
    pin.to_string()
}
