mod games;
mod querying;

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

/// The library ID query exactly as `get_db_games` builds it (no filters, FTS mode), for
/// query-plan tests elsewhere in the crate.
#[cfg(test)]
pub(crate) fn build_game_query_for_tests(
    platform_id: &str,
    limit: usize,
    offset: usize,
) -> (String, Vec<String>) {
    querying::build_game_query(platform_id, limit, offset, None, querying::SearchMode::Fts)
        .expect("an unfiltered query is always built")
}

#[cfg(test)]
mod tests;
