use crate::models::{ActivePlatformState, PlatformImportStatus, PlatformProfile, SetActivePlatformResponse};
use crate::platform_manifest::{find_platform, supported_platforms};
use rusqlite::{Connection, OptionalExtension};

const C64_PLATFORM_ID: &str = "c64";

#[tauri::command]
pub async fn get_supported_platforms() -> Result<Vec<PlatformProfile>, String> {
    supported_platforms()?
        .into_iter()
        .map(|mut platform| {
            let status = get_platform_import_status_sync(&platform.id)?;
            platform.import_status = status.import_status;
            Ok(platform)
        })
        .collect()
}

#[tauri::command]
pub async fn get_active_platform() -> Result<ActivePlatformState, String> {
    Ok(ActivePlatformState {
        active_platform_id: C64_PLATFORM_ID.to_string(),
        last_used_platform_id: Some(C64_PLATFORM_ID.to_string()),
        platform_selection_required: false,
    })
}

#[tauri::command]
pub async fn set_active_platform(platform_id: String) -> Result<SetActivePlatformResponse, String> {
    let platform = find_platform(&platform_id)?
        .ok_or_else(|| format!("Unsupported platform: {platform_id}"))?;
    let requires_import = platform.import_status != "imported";

    Ok(SetActivePlatformResponse {
        active_platform_id: platform.id.clone(),
        requires_import,
        message: if requires_import {
            format!("{} needs to be imported before browsing.", platform.display_name)
        } else {
            format!("{} is ready.", platform.display_name)
        },
    })
}

pub fn get_platform_import_status_sync(platform_id: &str) -> Result<PlatformImportStatus, String> {
    let platform = find_platform(platform_id)?
        .ok_or_else(|| format!("Unsupported platform: {platform_id}"))?;

    if let Ok(conn) = Connection::open(crate::database::get_db_path()) {
        let has_platform_libraries = conn
            .query_row(
                "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'PlatformLibraries' LIMIT 1",
                [],
                |_| Ok(()),
            )
            .optional()
            .map(|row| row.is_some())
            .unwrap_or(false);

        let imported = conn
            .query_row(
                "SELECT import_status, source_mdb_path, game_count, last_import_error
                 FROM PlatformLibraries WHERE platform_id = ?1",
                [&platform.id],
                |row| {
                    Ok(PlatformImportStatus {
                        platform_id: platform.id.clone(),
                        import_status: row.get(0)?,
                        source_mdb_path: row.get(1)?,
                        game_count: row.get::<_, i64>(2)? as usize,
                        last_import_error: row.get(3)?,
                    })
                },
            )
            .optional();

        match imported {
            Ok(Some(status)) => return Ok(status),
            Ok(None) if has_platform_libraries => return Ok(PlatformImportStatus {
                platform_id: platform.id,
                import_status: "notImported".to_string(),
                source_mdb_path: None,
                game_count: 0,
                last_import_error: None,
            }),
            Ok(None) => {}
            Err(error) if error.to_string().contains("no such table") => {}
            Err(error) => return Err(error.to_string()),
        }
    }

    Ok(PlatformImportStatus {
        platform_id: platform.id,
        import_status: platform.import_status,
        source_mdb_path: None,
        game_count: 0,
        last_import_error: None,
    })
}

#[cfg(test)]
#[path = "platforms/tests.rs"]
mod tests;
