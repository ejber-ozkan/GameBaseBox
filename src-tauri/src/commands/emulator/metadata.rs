//! Per-game launch metadata (FileToRun, GEMUS options) read from the library database.


#[derive(Default)]
pub(super) struct GameLaunchMetadata {
    pub(super) file_to_run: String,
    pub(super) gemus: String,
}

pub(super) fn games_table_has_column(conn: &rusqlite::Connection, column_name: &str) -> bool {
    let Ok(mut stmt) = conn.prepare("PRAGMA table_info(Games)") else {
        return false;
    };
    let Ok(columns) = stmt.query_map([], |row| row.get::<_, String>(1)) else {
        return false;
    };

    let has_column = columns
        .filter_map(Result::ok)
        .any(|column| column.eq_ignore_ascii_case(column_name));
    has_column
}

pub(super) fn load_game_launch_metadata(
    game_id: Option<&str>,
    platform_id: Option<&str>,
) -> GameLaunchMetadata {
    let Some(game_id) = game_id else {
        return GameLaunchMetadata::default();
    };

    use crate::database::get_db_path;
    use rusqlite::OptionalExtension;

    let Ok(conn) = crate::database::connection::open_connection(get_db_path()) else {
        return GameLaunchMetadata::default();
    };

    let has_file_to_run = games_table_has_column(&conn, "FileToRun");
    let has_gemus = games_table_has_column(&conn, "Gemus");
    if !has_file_to_run && !has_gemus {
        return GameLaunchMetadata::default();
    }

    let file_to_run_expr = if has_file_to_run { "FileToRun" } else { "''" };
    let gemus_expr = if has_gemus { "Gemus" } else { "''" };
    let has_platform_id = games_table_has_column(&conn, "platform_id");

    let row = if has_platform_id {
        if let Some(platform_id) = platform_id {
            let sql = format!(
                "SELECT COALESCE({file_to_run_expr}, ''), COALESCE({gemus_expr}, '') FROM Games WHERE GA_Id = ? AND platform_id = ?"
            );
            conn.query_row(&sql, [game_id, platform_id], |row| {
                Ok(GameLaunchMetadata {
                    file_to_run: row.get(0)?,
                    gemus: row.get(1)?,
                })
            })
            .optional()
        } else {
            Ok(None)
        }
    } else {
        let sql = format!(
            "SELECT COALESCE({file_to_run_expr}, ''), COALESCE({gemus_expr}, '') FROM Games WHERE GA_Id = ?"
        );
        conn.query_row(&sql, [game_id], |row| {
            Ok(GameLaunchMetadata {
                file_to_run: row.get(0)?,
                gemus: row.get(1)?,
            })
        })
        .optional()
    };

    row.ok().flatten().unwrap_or_default()
}
