use super::validate_platform_import_request;
use crate::models::{ImportPlatformDatabaseRequest, PlatformFolderSettings};
use std::fs;
use tempfile::tempdir;

fn request_with_paths(
    platform_id: &str,
    mdb_path: String,
    folder_settings: PlatformFolderSettings,
) -> ImportPlatformDatabaseRequest {
    ImportPlatformDatabaseRequest {
        platform_id: platform_id.to_string(),
        mdb_path,
        folder_settings,
    }
}

fn create_atari_folder_settings(root: &std::path::Path) -> PlatformFolderSettings {
    let games = root.join("Games");
    let music = root.join("Music");
    let photos = root.join("Photos");
    let screenshots = root.join("Screenshots");
    let extras = root.join("Extras");

    fs::create_dir_all(&games).unwrap();
    fs::create_dir_all(&music).unwrap();
    fs::create_dir_all(&photos).unwrap();
    fs::create_dir_all(&screenshots).unwrap();
    fs::create_dir_all(&extras).unwrap();

    PlatformFolderSettings {
        games_path: games.to_string_lossy().to_string(),
        music_path: music.to_string_lossy().to_string(),
        photos_path: photos.to_string_lossy().to_string(),
        screenshots_path: screenshots.to_string_lossy().to_string(),
        extras_path: extras.to_string_lossy().to_string(),
    }
}

fn create_atari2600_folder_settings(root: &std::path::Path) -> PlatformFolderSettings {
    let games = root.join("Games");
    let screenshots = root.join("Screenshots");
    let extras = root.join("Extras");

    fs::create_dir_all(&games).unwrap();
    fs::create_dir_all(&screenshots).unwrap();
    fs::create_dir_all(&extras).unwrap();

    PlatformFolderSettings {
        games_path: games.to_string_lossy().to_string(),
        music_path: String::new(),
        photos_path: String::new(),
        screenshots_path: screenshots.to_string_lossy().to_string(),
        extras_path: extras.to_string_lossy().to_string(),
    }
}

#[test]
fn validates_atari800_import_request_with_required_folders() {
    let temp = tempdir().unwrap();
    let mdb_path = temp.path().join("Atari 800 v12.mdb");
    fs::write(&mdb_path, b"test").unwrap();
    let request = request_with_paths(
        "atari800",
        mdb_path.to_string_lossy().to_string(),
        create_atari_folder_settings(temp.path()),
    );

    assert!(validate_platform_import_request(&request).is_ok());
}

#[test]
fn rejects_atari800_import_request_missing_required_folder() {
    let temp = tempdir().unwrap();
    let mdb_path = temp.path().join("Atari 800 v12.mdb");
    fs::write(&mdb_path, b"test").unwrap();
    let mut folders = create_atari_folder_settings(temp.path());
    folders.music_path = temp
        .path()
        .join("MissingMusic")
        .to_string_lossy()
        .to_string();
    let request = request_with_paths("atari800", mdb_path.to_string_lossy().to_string(), folders);

    let error = validate_platform_import_request(&request).unwrap_err();
    assert!(error.contains("Music folder does not exist"));
}

#[test]
fn rejects_atari800_import_request_missing_extras_folder() {
    let temp = tempdir().unwrap();
    let mdb_path = temp.path().join("Atari 800 v12.mdb");
    fs::write(&mdb_path, b"test").unwrap();
    let mut folders = create_atari_folder_settings(temp.path());
    folders.extras_path = temp
        .path()
        .join("MissingExtras")
        .to_string_lossy()
        .to_string();
    let request = request_with_paths("atari800", mdb_path.to_string_lossy().to_string(), folders);

    let error = validate_platform_import_request(&request).unwrap_err();
    assert!(error.contains("Extras folder does not exist"));
}

#[test]
fn rejects_obvious_c64_mdb_for_atari800_import() {
    let temp = tempdir().unwrap();
    let mdb_path = temp.path().join("GBC_v19.mdb");
    fs::write(&mdb_path, b"test").unwrap();
    let request = request_with_paths(
        "atari800",
        mdb_path.to_string_lossy().to_string(),
        create_atari_folder_settings(temp.path()),
    );

    let error = validate_platform_import_request(&request).unwrap_err();
    assert!(error.contains("Commodore 64 database"));
}

#[test]
fn validates_atari2600_import_request_with_required_folders() {
    let temp = tempdir().unwrap();
    let mdb_path = temp.path().join("Atari 2600.mdb");
    fs::write(&mdb_path, b"test").unwrap();
    let request = request_with_paths(
        "atari2600",
        mdb_path.to_string_lossy().to_string(),
        create_atari2600_folder_settings(temp.path()),
    );

    assert!(validate_platform_import_request(&request).is_ok());
}

#[test]
fn rejects_atari2600_import_request_missing_screenshots_folder() {
    let temp = tempdir().unwrap();
    let mdb_path = temp.path().join("Atari 2600.mdb");
    fs::write(&mdb_path, b"test").unwrap();
    let mut folders = create_atari2600_folder_settings(temp.path());
    folders.screenshots_path = temp
        .path()
        .join("MissingScreenshots")
        .to_string_lossy()
        .to_string();
    let request = request_with_paths("atari2600", mdb_path.to_string_lossy().to_string(), folders);

    let error = validate_platform_import_request(&request).unwrap_err();
    assert!(error.contains("Screenshots folder does not exist"));
}
