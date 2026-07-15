use crate::database::{
    configure_runtime_db_path, get_db_path, import_mdb_to_sqlite, import_mdb_to_sqlite_for_platform_with_cancellation,
    is_database_ready, normalize_platform_id,
};
use crate::models::{
    DatabaseBootstrapStatus, DatabaseImportResult, ImportPlatformDatabaseRequest,
    PlatformDatabaseImportResult, PlatformImportStatus,
};
use std::path::Path;
use std::collections::HashSet;
use std::sync::{LazyLock, Mutex};
use tauri_plugin_dialog::DialogExt;

static CANCELLED_PLATFORM_IMPORTS: LazyLock<Mutex<HashSet<String>>> =
    LazyLock::new(|| Mutex::new(HashSet::new()));

pub(super) fn request_platform_import_cancellation(job_id: &str) -> Result<(), String> {
    CANCELLED_PLATFORM_IMPORTS
        .lock()
        .map_err(|_| "Platform import cancellation state is unavailable.".to_string())?
        .insert(job_id.to_string());
    Ok(())
}

pub(super) fn is_platform_import_cancelled(job_id: &str) -> Result<bool, String> {
    Ok(CANCELLED_PLATFORM_IMPORTS
        .lock()
        .map_err(|_| "Platform import cancellation state is unavailable.".to_string())?
        .contains(job_id))
}

pub(super) fn clear_platform_import_cancellation(job_id: &str) -> Result<(), String> {
    CANCELLED_PLATFORM_IMPORTS
        .lock()
        .map_err(|_| "Platform import cancellation state is unavailable.".to_string())?
        .remove(job_id);
    Ok(())
}

#[tauri::command]
pub fn cancel_platform_import(job_id: String) -> Result<(), String> {
    request_platform_import_cancellation(&job_id)
}

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
            Some("GameBaseBox database is missing or has not been imported yet.".to_string())
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
    let platform_id = normalize_platform_id(Some(&request.platform_id))?;
    if let Err(err) = validate_platform_import_request(&request) {
        if std::env::var("VIC40_DEBUG_LAUNCH").is_ok() {
            eprintln!("[DEBUG IMPORT ERROR] Validation failed for {}: {}", request.platform_id, err);
        }
        return Err(err);
    }
    let _ = configure_runtime_db_path(&app)?;
    let job_id = request.job_id.as_deref().unwrap_or_default();
    let result = import_mdb_to_sqlite_for_platform_with_cancellation(
        &request.mdb_path,
        &platform_id,
        || {
            if !job_id.is_empty() && is_platform_import_cancelled(job_id)? {
                return Err("Platform import cancelled.".to_string());
            }
            Ok(())
        },
    );
    if !job_id.is_empty() {
        clear_platform_import_cancellation(job_id)?;
    }
    match result {
        Ok(result) => {
            let import_status = crate::commands::platforms::get_platform_import_status_sync(&platform_id)?;
            Ok(PlatformDatabaseImportResult {
                platform_id,
                db_path: result.db_path,
                exported_tables: result.exported_tables,
                imported_tables: result.imported_tables,
                game_count: import_status.game_count,
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
    let platform_id = normalize_platform_id(Some(&request.platform_id))
        .map_err(|error| error.replace("Unsupported platform", "Unsupported platform import"))?;

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

    if platform_id == "atari800" {
        reject_obvious_wrong_platform_mdb(mdb_path)?;
    }

    for folder_type in crate::platform_manifest::required_folder_types(&platform_id)? {
        let (label, folder_path) = required_folder(&request.folder_settings, &folder_type, &platform_id)?;
        validate_existing_folder(label, folder_path)?;
    }

    Ok(())
}

fn required_folder<'a>(
    settings: &'a crate::models::PlatformFolderSettings,
    folder_type: &str,
    platform_id: &str,
) -> Result<(&'static str, &'a str), String> {
    match folder_type {
        "games" => Ok(("Games", &settings.games_path)),
        "music" => Ok(("Music", &settings.music_path)),
        "photos" => Ok((if platform_id == "zxspectrum" { "Musician Photos" } else { "Photos" }, &settings.photos_path)),
        "screenshots" => Ok(("Screenshots", &settings.screenshots_path)),
        "extras" => Ok(("Extras", &settings.extras_path)),
        _ => Err(format!("Unsupported required folder type: {folder_type}")),
    }
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
