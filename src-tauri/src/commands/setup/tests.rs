use super::{clear_platform_import_cancellation, is_platform_import_cancelled, request_platform_import_cancellation, validate_platform_import_request};
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
        job_id: None,
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

fn create_zxspectrum_folder_settings(root: &std::path::Path) -> PlatformFolderSettings {
    let extras = root.join("Extras");
    let games = root.join("Games");
    let screenshots = root.join("Screenshots");
    let musician_photos = root.join("Musician Photos");
    let music = root.join("Music");

    fs::create_dir_all(&extras).unwrap();
    fs::create_dir_all(&games).unwrap();
    fs::create_dir_all(&screenshots).unwrap();
    fs::create_dir_all(&musician_photos).unwrap();
    fs::create_dir_all(&music).unwrap();

    PlatformFolderSettings {
        games_path: games.to_string_lossy().to_string(),
        music_path: music.to_string_lossy().to_string(),
        photos_path: musician_photos.to_string_lossy().to_string(),
        screenshots_path: screenshots.to_string_lossy().to_string(),
        extras_path: extras.to_string_lossy().to_string(),
    }
}

fn create_four_folder_settings(root: &std::path::Path) -> PlatformFolderSettings {
    let extras = root.join("Extras");
    let games = root.join("Games");
    let screenshots = root.join("Screenshots");
    let music = root.join("Music");

    fs::create_dir_all(&extras).unwrap();
    fs::create_dir_all(&games).unwrap();
    fs::create_dir_all(&screenshots).unwrap();
    fs::create_dir_all(&music).unwrap();

    PlatformFolderSettings {
        games_path: games.to_string_lossy().to_string(),
        music_path: music.to_string_lossy().to_string(),
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

#[test]
fn validates_zxspectrum_import_request_with_required_folders() {
    let temp = tempdir().unwrap();
    let mdb_path = temp.path().join("Sinclair ZX Spectrum v6.mdb");
    fs::write(&mdb_path, b"test").unwrap();
    let request = request_with_paths(
        "zxspectrum",
        mdb_path.to_string_lossy().to_string(),
        create_zxspectrum_folder_settings(temp.path()),
    );

    assert!(validate_platform_import_request(&request).is_ok());
}

#[test]
fn rejects_zxspectrum_import_request_missing_musician_photos_folder() {
    let temp = tempdir().unwrap();
    let mdb_path = temp.path().join("Sinclair ZX Spectrum v6.mdb");
    fs::write(&mdb_path, b"test").unwrap();
    let mut folders = create_zxspectrum_folder_settings(temp.path());
    folders.photos_path = temp
        .path()
        .join("Missing Musician Photos")
        .to_string_lossy()
        .to_string();
    let request = request_with_paths("zxspectrum", mdb_path.to_string_lossy().to_string(), folders);

    let error = validate_platform_import_request(&request).unwrap_err();
    assert!(error.contains("Musician Photos folder does not exist"));
}

#[test]
fn validates_bbc_micro_import_request_with_required_folders() {
    let temp = tempdir().unwrap();
    let mdb_path = temp.path().join("BBC Micro.mdb");
    fs::write(&mdb_path, b"test").unwrap();
    let request = request_with_paths(
        "bbcmicro",
        mdb_path.to_string_lossy().to_string(),
        create_four_folder_settings(temp.path()),
    );

    assert!(validate_platform_import_request(&request).is_ok());
}

#[test]
fn validates_amiga_import_request_with_required_folders() {
    let temp = tempdir().unwrap();
    let mdb_path = temp.path().join("Commodore Amiga.mdb");
    fs::write(&mdb_path, b"test").unwrap();
    let request = request_with_paths(
        "amiga",
        mdb_path.to_string_lossy().to_string(),
        create_four_folder_settings(temp.path()),
    );

    assert!(validate_platform_import_request(&request).is_ok());
}

#[test]
fn platform_import_cancellation_is_scoped_to_its_job() {
    let job_id = "test-platform-import-job";
    request_platform_import_cancellation(job_id).unwrap();

    assert!(is_platform_import_cancelled(job_id).unwrap());
    assert!(!is_platform_import_cancelled("another-platform-import-job").unwrap());

    clear_platform_import_cancellation(job_id).unwrap();
    assert!(!is_platform_import_cancelled(job_id).unwrap());
}

#[test]
fn validates_atari_st_import_request_with_required_folders() {
    let temp = tempdir().unwrap();
    let mdb_path = temp.path().join("Atari ST.mdb");
    fs::write(&mdb_path, b"test").unwrap();
    let request = request_with_paths(
        "atarist",
        mdb_path.to_string_lossy().to_string(),
        create_four_folder_settings(temp.path()),
    );

    assert!(validate_platform_import_request(&request).is_ok());
}

#[test]
fn validates_vic20_import_request_with_required_folders() {
    let temp = tempdir().unwrap();
    let mdb_path = temp.path().join("Commodore VIC-20.mdb");
    fs::write(&mdb_path, b"test").unwrap();
    let request = request_with_paths(
        "vic20",
        mdb_path.to_string_lossy().to_string(),
        create_four_folder_settings(temp.path()),
    );

    assert!(validate_platform_import_request(&request).is_ok());
}

#[test]
fn validates_commodore_vic20_import_alias_with_required_folders() {
    let temp = tempdir().unwrap();
    let mdb_path = temp.path().join("Vic20_v03.mdb");
    fs::write(&mdb_path, b"test").unwrap();
    let request = request_with_paths(
        "Commodore VIC-20",
        mdb_path.to_string_lossy().to_string(),
        create_four_folder_settings(temp.path()),
    );

    assert!(validate_platform_import_request(&request).is_ok());
}

#[test]
fn rejects_bbc_micro_import_request_missing_music_folder() {
    let temp = tempdir().unwrap();
    let mdb_path = temp.path().join("BBC Micro.mdb");
    fs::write(&mdb_path, b"test").unwrap();
    let mut folders = create_four_folder_settings(temp.path());
    folders.music_path = temp
        .path()
        .join("MissingMusic")
        .to_string_lossy()
        .to_string();
    let request = request_with_paths("bbcmicro", mdb_path.to_string_lossy().to_string(), folders);

    let error = validate_platform_import_request(&request).unwrap_err();
    assert!(error.contains("Music folder does not exist"));
}
