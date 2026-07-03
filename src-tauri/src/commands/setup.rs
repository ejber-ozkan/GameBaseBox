use crate::database::{
    configure_runtime_db_path, get_db_path, import_mdb_to_sqlite, import_mdb_to_sqlite_for_platform,
    is_database_ready,
};
use crate::models::{
    DatabaseBootstrapStatus, DatabaseImportResult, ImportPlatformDatabaseRequest,
    PlatformDatabaseImportResult, PlatformImportStatus,
};
use std::path::Path;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub async fn open_mdb_file_dialog(app: tauri::AppHandle) -> Option<String> {
    app.dialog()
        .file()
        .add_filter("GameBase MDB", &["mdb"])
        .add_filter("All Files", &["*"])
        .blocking_pick_file()
        .map(|path| path.to_string())
}

#[tauri::command]
pub fn get_database_bootstrap_status(
    app: tauri::AppHandle,
) -> Result<DatabaseBootstrapStatus, String> {
    let _ = configure_runtime_db_path(&app)?;
    let db_path = get_db_path();
    let ready = is_database_ready()?;
    Ok(DatabaseBootstrapStatus {
        ready,
        db_path,
        reason: if ready {
            None
        } else {
            Some("GB64 database is missing or has not been imported yet.".to_string())
        },
    })
}

#[tauri::command]
pub fn import_database_from_mdb(
    app: tauri::AppHandle,
    mdb_path: String,
) -> Result<DatabaseImportResult, String> {
    let _ = configure_runtime_db_path(&app)?;
    match import_mdb_to_sqlite(&mdb_path) {
        Ok(res) => Ok(res),
        Err(err) => {
            if std::env::var("VIC40_DEBUG_LAUNCH").is_ok() {
                eprintln!("[DEBUG IMPORT ERROR] Failed to import database: {}", err);
            }
            Err(err)
        }
    }
}

#[tauri::command]
pub fn get_platform_import_status(platform_id: String) -> Result<PlatformImportStatus, String> {
    crate::commands::platforms::get_platform_import_status_sync(&platform_id)
}

#[tauri::command]
pub fn import_platform_database_from_mdb(
    app: tauri::AppHandle,
    request: ImportPlatformDatabaseRequest,
) -> Result<PlatformDatabaseImportResult, String> {
    if let Err(err) = validate_platform_import_request(&request) {
        if std::env::var("VIC40_DEBUG_LAUNCH").is_ok() {
            eprintln!("[DEBUG IMPORT ERROR] Validation failed for {}: {}", request.platform_id, err);
        }
        return Err(err);
    }
    let _ = configure_runtime_db_path(&app)?;
    match import_mdb_to_sqlite_for_platform(&request.mdb_path, &request.platform_id) {
        Ok(result) => {
            Ok(PlatformDatabaseImportResult {
                platform_id: request.platform_id,
                db_path: result.db_path,
                exported_tables: result.exported_tables,
                imported_tables: result.imported_tables,
                game_count: 0,
            })
        }
        Err(err) => {
            if std::env::var("VIC40_DEBUG_LAUNCH").is_ok() {
                eprintln!("[DEBUG IMPORT ERROR] Failed to import platform database for {}: {}", request.platform_id, err);
            }
            Err(err)
        }
    }
}

pub(super) fn validate_platform_import_request(
    request: &ImportPlatformDatabaseRequest,
) -> Result<(), String> {
    match request.platform_id.as_str() {
        "c64" | "atari800" | "atari2600" | "zxspectrum" | "bbcmicro" | "amiga"
        | "atarist" | "vic20" => {}
        other => return Err(format!("Unsupported platform import: {other}")),
    }

    let mdb_path = Path::new(&request.mdb_path);
    if !mdb_path.exists() {
        return Err(format!("MDB file not found: {}", request.mdb_path));
    }

    if mdb_path
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| !value.eq_ignore_ascii_case("mdb"))
        .unwrap_or(true)
    {
        return Err("Selected database must be an MDB file.".to_string());
    }

    match request.platform_id.as_str() {
        "atari800" => {
            reject_obvious_wrong_platform_mdb(mdb_path)?;
            validate_existing_folder("Games", &request.folder_settings.games_path)?;
            validate_existing_folder("Music", &request.folder_settings.music_path)?;
            validate_existing_folder("Photos", &request.folder_settings.photos_path)?;
            validate_existing_folder("Screenshots", &request.folder_settings.screenshots_path)?;
            validate_existing_folder("Extras", &request.folder_settings.extras_path)?;
        }
        "atari2600" => {
            validate_existing_folder("Games", &request.folder_settings.games_path)?;
            validate_existing_folder("Screenshots", &request.folder_settings.screenshots_path)?;
            validate_existing_folder("Extras", &request.folder_settings.extras_path)?;
        }
        "zxspectrum" => {
            validate_existing_folder("Extras", &request.folder_settings.extras_path)?;
            validate_existing_folder("Games", &request.folder_settings.games_path)?;
            validate_existing_folder("Screenshots", &request.folder_settings.screenshots_path)?;
            validate_existing_folder("Musician Photos", &request.folder_settings.photos_path)?;
            validate_existing_folder("Music", &request.folder_settings.music_path)?;
        }
        "bbcmicro" | "amiga" | "atarist" | "vic20" => {
            validate_existing_folder("Extras", &request.folder_settings.extras_path)?;
            validate_existing_folder("Games", &request.folder_settings.games_path)?;
            validate_existing_folder("Screenshots", &request.folder_settings.screenshots_path)?;
            validate_existing_folder("Music", &request.folder_settings.music_path)?;
        }
        _ => {}
    }

    Ok(())
}

fn validate_existing_folder(label: &str, folder_path: &str) -> Result<(), String> {
    if folder_path.trim().is_empty() {
        return Err(format!("{label} folder is required."));
    }

    let path = Path::new(folder_path);
    if !path.is_dir() {
        return Err(format!("{label} folder does not exist: {folder_path}"));
    }

    Ok(())
}

fn reject_obvious_wrong_platform_mdb(mdb_path: &Path) -> Result<(), String> {
    let file_name = mdb_path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();

    let obvious_c64_markers = ["gb64", "gamebase64", "gbc_v", "commodore"];
    if obvious_c64_markers
        .iter()
        .any(|marker| file_name.contains(marker))
    {
        return Err(
            "The selected MDB looks like a Commodore 64 database, not Atari 800.".to_string(),
        );
    }

    Ok(())
}

#[cfg(test)]
#[path = "setup/tests.rs"]
mod tests;
