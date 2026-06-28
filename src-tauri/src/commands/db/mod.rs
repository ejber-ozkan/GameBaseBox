mod games;
mod querying;
mod secure_settings;

use crate::models::{ExtraRow, GameFilters, GameRow};

#[tauri::command]
pub async fn get_genres(platform_id: Option<String>) -> Result<Vec<String>, String> {
    games::get_genres(platform_id).await
}

#[tauri::command]
pub async fn get_sub_genres(
    genre: Option<String>,
    platform_id: Option<String>,
) -> Result<Vec<String>, String> {
    games::get_sub_genres(genre, platform_id).await
}

#[tauri::command]
pub async fn get_db_games(
    limit: Option<usize>,
    offset: Option<usize>,
    filters: Option<GameFilters>,
    platform_id: Option<String>,
) -> Result<Vec<GameRow>, String> {
    games::get_db_games(limit, offset, filters, platform_id).await
}

#[tauri::command]
pub async fn get_game_detail(
    game_id: String,
    platform_id: Option<String>,
) -> Result<Option<crate::models::GameDetailRow>, String> {
    games::get_game_detail(game_id, platform_id).await
}

#[tauri::command]
pub async fn get_db_game_count(
    filters: Option<GameFilters>,
    platform_id: Option<String>,
) -> Result<usize, String> {
    games::get_db_game_count(filters, platform_id).await
}

#[tauri::command]
pub async fn get_game_extras(
    game_id: String,
    platform_id: Option<String>,
) -> Result<Vec<ExtraRow>, String> {
    games::get_game_extras(game_id, platform_id).await
}

#[tauri::command]
pub async fn save_secure_setting(key: String, value: String) -> Result<(), String> {
    secure_settings::save_secure_setting(key, value).await
}

#[tauri::command]
pub async fn get_secure_setting(key: String) -> Result<Option<String>, String> {
    secure_settings::get_secure_setting(key).await
}

#[cfg(test)]
mod tests;
