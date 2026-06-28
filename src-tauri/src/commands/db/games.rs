use crate::models::{ExtraRow, GameFilters, GameRow};
use rusqlite::{params_from_iter, Row};

use super::querying::{
    load_game_count_with_fallback, load_ordered_game_ids_with_fallback, open_db_connection,
    sqlite_table_exists,
};

pub(crate) fn build_game_summary_query(
    platform_id: &str,
    ids: &[String],
    include_cover_index: bool,
) -> (String, Vec<String>) {
    let requested_ids = ids
        .iter()
        .enumerate()
        .map(|(index, _)| format!("(?, {index})"))
        .collect::<Vec<_>>()
        .join(", ");
    let cover_select = if include_cover_index {
        "cover.cover_path as cover_path,"
    } else {
        "NULL as cover_path,"
    };
    let cover_join = if include_cover_index {
        "LEFT JOIN GameCoverIndex cover ON cover.GA_Id = g.GA_Id AND cover.platform_id = gv.platformId"
    } else {
        ""
    };
    let query = format!(
        "
        WITH requested_ids(id, order_index) AS (
            VALUES {requested_ids}
        )
        SELECT 
            gv.id, gv.name, gv.filename, gv.gameFilename, gv.screenshotFilename,
            gv.boxFrontFilename, gv.titlescreenFilename, gv.videoSnapFilename,
            gv.sidFilename, gv.crc, gv.year, gv.isPal, gv.isNtsc, gv.trueDriveEmu,
            gv.isClassic, gv.parentGenre, gv.subGenre, gv.developer_name, gv.publisher_name,
            {cover_select}
            g.Adult as isAdult
        FROM requested_ids
        JOIN GameView gv ON gv.id = requested_ids.id AND gv.platformId = ?
        JOIN Games g ON gv.id = g.GA_Id AND g.platform_id = gv.platformId
        {cover_join}
        GROUP BY requested_ids.order_index, gv.platformId, gv.id
        ORDER BY requested_ids.order_index"
    );
    let mut params = Vec::with_capacity(ids.len() + 1);
    params.extend(ids.iter().cloned());
    params.push(platform_id.to_string());
    (query, params)
}

pub(crate) fn build_game_detail_query(
    platform_id: &str,
    id: &str,
    include_cover_index: bool,
) -> (String, Vec<String>) {
    let cover_select = if include_cover_index {
        "cover.cover_path as cover_path,"
    } else {
        "NULL as cover_path,"
    };
    let cover_join = if include_cover_index {
        "LEFT JOIN GameCoverIndex cover ON cover.GA_Id = g.GA_Id AND cover.platform_id = gv.platformId"
    } else {
        ""
    };
    let query = format!(
        "
        SELECT 
            gv.*, 
            g.Adult as isAdult,
            g.Control as control,
            g.PlayersFrom as players_from,
            g.PlayersTo as players_to,
            g.PlayersSim as players_sim,
            g.Comment as comment,
            g.ReviewRating as review_rating,
            mu.Photo as musician_photo,
            mu.Nick as musician_nick,
            mu.Grp as musician_group,
            {cover_select}
            pr.Programmer as coder_name,
            ar.Artist as graphics_name,
            gv.developer_name as version_by,
            g.V_Trainers as v_trainers,
            g.V_Length as v_length,
            CASE WHEN g.V_LoadingScreen = '1' THEN 1 ELSE 0 END as v_loading_screen,
            CASE WHEN g.V_HighScoreSaver = '1' THEN 1 ELSE 0 END as v_high_score_saver,
            CASE WHEN g.V_IncludedDocs = '1' THEN 1 ELSE 0 END as v_included_docs,
            CASE WHEN g.V_TrueDriveEmu = '1' THEN 1 ELSE 0 END as v_true_drive_emu,
            g.V_PalNTSC as v_pal_ntsc,
            g.MemoText as memo
        FROM GameView gv
        JOIN Games g ON gv.id = g.GA_Id AND g.platform_id = gv.platformId
        LEFT JOIN Musicians mu ON g.MU_Id = mu.MU_Id
        {cover_join}
        LEFT JOIN Programmers pr ON g.PR_Id = pr.PR_Id
        LEFT JOIN Artists ar ON g.AR_Id = ar.AR_Id
        WHERE gv.id = ?
          AND gv.platformId = ?"
    );
    (query, vec![id.to_string(), platform_id.to_string()])
}

fn map_game_row(row: &Row<'_>) -> rusqlite::Result<GameRow> {
    Ok(GameRow {
        id: row.get("id")?,
        name: row.get("name")?,
        filename: row.get("filename")?,
        game_filename: row.get("gameFilename")?,
        screenshot_filename: row.get("screenshotFilename")?,
        box_front_filename: row.get("boxFrontFilename")?,
        cover_path: row.get("cover_path")?,
        titlescreen_filename: row.get("titlescreenFilename")?,
        video_snap_filename: row.get("videoSnapFilename")?,
        sid_filename: row.get("sidFilename")?,
        crc: row.get("crc")?,
        year: row.get("year")?,
        is_pal: row.get::<_, i32>("isPal")? == 1,
        is_ntsc: row.get::<_, i32>("isNtsc")? == 1,
        true_drive_emu: row.get::<_, i32>("trueDriveEmu")? == 1,
        is_classic: row.get::<_, i32>("isClassic")? == 1,
        parent_genre: row.get("parentGenre")?,
        sub_genre: row.get("subGenre")?,
        developer_name: row.get("developer_name")?,
        publisher_name: row.get("publisher_name")?,
    })
}

use crate::models::GameDetailRow;

fn map_game_detail_row(row: &Row<'_>) -> rusqlite::Result<GameDetailRow> {
    Ok(GameDetailRow {
        game: map_game_row(row)?,
        musician_name: row.get("musician_name")?,
        musician_photo: row.get("musician_photo")?,
        musician_nick: row.get("musician_nick")?,
        musician_group: row.get("musician_group")?,
        coder_name: row.get("coder_name")?,
        graphics_name: row.get("graphics_name")?,
        version_by: row.get("version_by")?,
        control: row.get("control")?,
        players_from: row.get("players_from")?,
        players_to: row.get("players_to")?,
        players_sim: row.get("players_sim")?,
        comment: row.get("comment")?,
        review_rating: row.get("review_rating")?,
        languages: row.get("languages")?,
        v_trainers: row.get("v_trainers")?,
        v_length: row.get("v_length")?,
        v_loading_screen: Some(row.get::<_, i32>("v_loading_screen")? == 1),
        v_high_score_saver: Some(row.get::<_, i32>("v_high_score_saver")? == 1),
        v_included_docs: Some(row.get::<_, i32>("v_included_docs")? == 1),
        v_true_drive_emu: Some(row.get::<_, i32>("v_true_drive_emu")? == 1),
        v_pal_ntsc: row.get("v_pal_ntsc")?,
        memo: row.get("memo")?,
    })
}

pub async fn get_genres(platform_id: Option<String>) -> Result<Vec<String>, String> {
    let platform_id = platform_id.unwrap_or_else(|| "c64".to_string());
    let conn = open_db_connection("DB error")?;
    let mut stmt = conn
        .prepare("SELECT DISTINCT parentGenre FROM GameView WHERE platformId = ?1 AND parentGenre != '' ORDER BY parentGenre")
        .map_err(|e| e.to_string())?;
    let genres: Vec<String> = stmt
        .query_map([platform_id], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    Ok(genres)
}

pub async fn get_sub_genres(
    genre: Option<String>,
    platform_id: Option<String>,
) -> Result<Vec<String>, String> {
    let Some(selected_genre) = genre.filter(|value| !value.trim().is_empty()) else {
        return Ok(Vec::new());
    };
    let platform_id = platform_id.unwrap_or_else(|| "c64".to_string());

    let conn = open_db_connection("DB error")?;
    let mut stmt = conn
        .prepare(
            "SELECT DISTINCT subGenre
             FROM GameView
             WHERE platformId = ?1
               AND parentGenre = ?2
               AND subGenre IS NOT NULL
               AND TRIM(subGenre) != ''
             ORDER BY subGenre COLLATE NOCASE",
        )
        .map_err(|e| e.to_string())?;
    let sub_genres: Vec<String> = stmt
        .query_map([platform_id, selected_genre], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    Ok(sub_genres)
}

pub async fn get_db_games(
    limit: Option<usize>,
    offset: Option<usize>,
    filters: Option<GameFilters>,
    platform_id: Option<String>,
) -> Result<Vec<GameRow>, String> {
    let platform_id = platform_id.unwrap_or_else(|| "c64".to_string());
    let conn = open_db_connection("Database error")?;
    let ordered_ids = load_ordered_game_ids_with_fallback(
        &conn,
        &platform_id,
        limit.unwrap_or(50),
        offset.unwrap_or(0),
        filters,
    )?;

    if ordered_ids.is_empty() {
        return Ok(Vec::new());
    }

    let include_cover_index = sqlite_table_exists(&conn, "GameCoverIndex")?;
    let (details_query, detail_params) =
        build_game_summary_query(&platform_id, &ordered_ids, include_cover_index);
    let mut details_stmt = conn
        .prepare(&details_query)
        .map_err(|e| format!("Prepare error: {e}"))?;
    let game_iter = details_stmt
        .query_map(params_from_iter(detail_params), map_game_row)
        .map_err(|e| e.to_string())?;

    let mut games = Vec::with_capacity(ordered_ids.len());
    for game in game_iter {
        games.push(game.map_err(|e| e.to_string())?);
    }

    Ok(games)
}

pub async fn get_game_detail(
    game_id: String,
    platform_id: Option<String>,
) -> Result<Option<GameDetailRow>, String> {
    let platform_id = platform_id.unwrap_or_else(|| "c64".to_string());
    let conn = open_db_connection("Database error")?;
    let include_cover_index = sqlite_table_exists(&conn, "GameCoverIndex")?;
    let (query, params) = build_game_detail_query(&platform_id, &game_id, include_cover_index);
    
    let mut stmt = conn.prepare(&query).map_err(|e| format!("Prepare error: {e}"))?;
    
    let mut iter = stmt.query_map(params_from_iter(params), map_game_detail_row)
        .map_err(|e| e.to_string())?;
        
    if let Some(row) = iter.next() {
        Ok(Some(row.map_err(|e| e.to_string())?))
    } else {
        Ok(None)
    }
}

pub async fn get_db_game_count(
    filters: Option<GameFilters>,
    platform_id: Option<String>,
) -> Result<usize, String> {
    let platform_id = platform_id.unwrap_or_else(|| "c64".to_string());
    let conn = open_db_connection("Database error")?;
    load_game_count_with_fallback(&conn, &platform_id, filters)
}

pub async fn get_game_extras(
    game_id: String,
    platform_id: Option<String>,
) -> Result<Vec<ExtraRow>, String> {
    let platform_id = platform_id.unwrap_or_else(|| "c64".to_string());
    let conn = open_db_connection("DB error")?;
    let mut stmt = conn
        .prepare(
            "SELECT e.EX_Id, e.Name, e.Path, e.Type
             FROM Extras e
             WHERE e.GA_Id = ?1
               AND e.platform_id = ?2
             ORDER BY e.DisplayOrder ASC",
        )
        .map_err(|e| e.to_string())?;

    let extra_iter = stmt
        .query_map([game_id, platform_id], |row| {
            Ok(ExtraRow {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                extra_type: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut extras = Vec::new();
    for extra in extra_iter {
        extras.push(extra.map_err(|e| e.to_string())?);
    }
    Ok(extras)
}
