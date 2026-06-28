use crate::models::{
    ActivePlatformState, PlatformCapabilities, PlatformImportStatus, PlatformProfile,
    SetActivePlatformResponse,
};
use rusqlite::{Connection, OptionalExtension};

const C64_PLATFORM_ID: &str = "c64";
const ATARI800_PLATFORM_ID: &str = "atari800";
const ATARI2600_PLATFORM_ID: &str = "atari2600";

fn c64_profile() -> PlatformProfile {
    PlatformProfile {
        id: C64_PLATFORM_ID.to_string(),
        display_name: "Commodore 64".to_string(),
        status: "available".to_string(),
        import_status: "imported".to_string(),
        default_emulator_profile_id: "vice-c64".to_string(),
        supported_emulator_profile_ids: vec!["vice-c64".to_string(), "retroarch-c64".to_string()],
        capabilities: PlatformCapabilities {
            screenshots: true,
            photos: true,
            music: "sid".to_string(),
            extras: true,
            videos: true,
            in_app_emulation: true,
            launch_extensions: vec![
                ".d64", ".t64", ".tap", ".prg", ".crt", ".g64", ".zip", ".7z", ".m3u", ".vfl",
            ]
            .into_iter()
            .map(String::from)
            .collect(),
        },
        folder_types: vec![
            "games",
            "music",
            "photos",
            "screenshots",
            "extras",
            "boxArt",
            "videos",
        ]
        .into_iter()
        .map(String::from)
        .collect(),
    }
}

fn atari800_profile() -> PlatformProfile {
    PlatformProfile {
        id: ATARI800_PLATFORM_ID.to_string(),
        display_name: "Atari 800".to_string(),
        status: "available".to_string(),
        import_status: "notImported".to_string(),
        default_emulator_profile_id: "retroarch-atari800".to_string(),
        supported_emulator_profile_ids: vec![
            "retroarch-atari800".to_string(),
            "altirra-atari800".to_string(),
        ],
        capabilities: PlatformCapabilities {
            screenshots: true,
            photos: true,
            music: "sap".to_string(),
            extras: true,
            videos: false,
            in_app_emulation: false,
            launch_extensions: vec![
                ".atr", ".xfd", ".atx", ".cas", ".car", ".rom", ".bin", ".xex", ".com", ".m3u",
                ".zip", ".7z",
            ]
            .into_iter()
            .map(String::from)
            .collect(),
        },
        folder_types: vec!["games", "music", "photos", "screenshots"]
            .into_iter()
            .map(String::from)
            .collect(),
    }
}

fn atari2600_profile() -> PlatformProfile {
    PlatformProfile {
        id: ATARI2600_PLATFORM_ID.to_string(),
        display_name: "Atari 2600".to_string(),
        status: "available".to_string(),
        import_status: "notImported".to_string(),
        default_emulator_profile_id: "retroarch-atari2600".to_string(),
        supported_emulator_profile_ids: vec!["retroarch-atari2600".to_string()],
        capabilities: PlatformCapabilities {
            screenshots: true,
            photos: false,
            music: "none".to_string(),
            extras: true,
            videos: false,
            in_app_emulation: false,
            launch_extensions: vec![".a26", ".bin", ".rom", ".zip", ".7z"]
                .into_iter()
                .map(String::from)
                .collect(),
        },
        folder_types: vec!["games", "screenshots", "extras"]
            .into_iter()
            .map(String::from)
            .collect(),
    }
}

fn supported_platforms() -> Vec<PlatformProfile> {
    vec![c64_profile(), atari800_profile(), atari2600_profile()]
}

fn find_platform(platform_id: &str) -> Option<PlatformProfile> {
    supported_platforms()
        .into_iter()
        .find(|platform| platform.id == platform_id)
}

#[tauri::command]
pub async fn get_supported_platforms() -> Result<Vec<PlatformProfile>, String> {
    Ok(supported_platforms())
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
    let platform = find_platform(&platform_id)
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
    let platform = find_platform(platform_id)
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
                "SELECT
                    import_status,
                    source_mdb_path,
                    game_count,
                    last_import_error
                 FROM PlatformLibraries
                 WHERE platform_id = ?1",
                [platform_id],
                |row| {
                    Ok(PlatformImportStatus {
                        platform_id: platform_id.to_string(),
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
            Ok(None) if has_platform_libraries => {
                return Ok(PlatformImportStatus {
                    platform_id: platform.id,
                    import_status: "notImported".to_string(),
                    source_mdb_path: None,
                    game_count: 0,
                    last_import_error: None,
                });
            }
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
