use super::{
    get_active_platform, get_platform_import_status_sync, get_supported_platforms,
    set_active_platform,
};
use crate::test_helpers::DbEnvGuard;
use rusqlite::Connection;
use tempfile::NamedTempFile;

#[tokio::test(flavor = "current_thread")]
async fn test_get_supported_platforms_includes_atari800_capabilities() {
    let platforms = get_supported_platforms().await.unwrap();
    let atari800 = platforms
        .iter()
        .find(|platform| platform.id == "atari800")
        .expect("Atari 800 profile should exist");

    assert_eq!(atari800.import_status, "notImported");
    assert_eq!(atari800.capabilities.music, "sap");
    assert!(atari800.folder_types.contains(&"games".to_string()));
    assert!(atari800.folder_types.contains(&"music".to_string()));
    assert!(atari800.folder_types.contains(&"photos".to_string()));
    assert!(atari800.folder_types.contains(&"screenshots".to_string()));
    assert!(atari800.folder_types.contains(&"extras".to_string()));
    assert!(atari800
        .supported_emulator_profile_ids
        .contains(&"altirra-atari800".to_string()));
    assert!(atari800
        .capabilities
        .launch_extensions
        .contains(&".xex".to_string()));
}

#[tokio::test(flavor = "current_thread")]
async fn test_get_supported_platforms_includes_importable_atari2600_capabilities() {
    let platforms = get_supported_platforms().await.unwrap();
    let atari2600 = platforms
        .iter()
        .find(|platform| platform.id == "atari2600")
        .expect("Atari 2600 profile should exist");

    assert_eq!(atari2600.status, "available");
    assert_eq!(atari2600.import_status, "notImported");
    assert_eq!(atari2600.default_emulator_profile_id, "retroarch-atari2600");
    assert_eq!(
        atari2600.folder_types,
        vec!["games".to_string(), "screenshots".to_string(), "extras".to_string()]
    );
    assert!(atari2600
        .capabilities
        .launch_extensions
        .contains(&".a26".to_string()));
}

#[tokio::test(flavor = "current_thread")]
async fn test_get_supported_platforms_includes_zxspectrum_capabilities() {
    let platforms = get_supported_platforms().await.unwrap();
    let zxspectrum = platforms
        .iter()
        .find(|platform| platform.id == "zxspectrum")
        .expect("ZX Spectrum profile should exist");

    assert_eq!(zxspectrum.display_name, "ZX Spectrum");
    assert_eq!(zxspectrum.status, "available");
    assert_eq!(zxspectrum.import_status, "notImported");
    assert_eq!(zxspectrum.default_emulator_profile_id, "retroarch-zxspectrum");
    assert_eq!(
        zxspectrum.supported_emulator_profile_ids,
        vec![
            "retroarch-zxspectrum".to_string(),
            "spectaculator-zxspectrum".to_string(),
        ]
    );
    assert_eq!(
        zxspectrum.folder_types,
        vec![
            "extras".to_string(),
            "games".to_string(),
            "screenshots".to_string(),
            "photos".to_string(),
            "music".to_string(),
        ]
    );
    assert_eq!(zxspectrum.capabilities.music, "ay");
    assert!(zxspectrum
        .capabilities
        .launch_extensions
        .contains(&".tzx".to_string()));
}

#[tokio::test(flavor = "current_thread")]
async fn test_get_supported_platforms_includes_bbc_micro_capabilities() {
    let platforms = get_supported_platforms().await.unwrap();
    let bbc = platforms
        .iter()
        .find(|platform| platform.id == "bbcmicro")
        .expect("BBC Micro profile should exist");

    assert_eq!(bbc.display_name, "Acorn BBC Micro");
    assert_eq!(bbc.import_status, "notImported");
    assert_eq!(bbc.default_emulator_profile_id, "retroarch-bbcmicro");
    assert_eq!(
        bbc.supported_emulator_profile_ids,
        vec![
            "retroarch-bbcmicro".to_string(),
            "beebem-bbcmicro".to_string(),
        ]
    );
    assert_eq!(
        bbc.folder_types,
        vec![
            "extras".to_string(),
            "games".to_string(),
            "screenshots".to_string(),
            "music".to_string(),
        ]
    );
    assert_eq!(bbc.capabilities.music, "generic");
    assert!(bbc
        .capabilities
        .launch_extensions
        .contains(&".ssd".to_string()));
}

#[tokio::test(flavor = "current_thread")]
async fn test_get_supported_platforms_includes_amiga_capabilities() {
    let platforms = get_supported_platforms().await.unwrap();
    let amiga = platforms
        .iter()
        .find(|platform| platform.id == "amiga")
        .expect("Amiga profile should exist");

    assert_eq!(amiga.display_name, "Commodore Amiga");
    assert_eq!(amiga.import_status, "notImported");
    assert_eq!(amiga.default_emulator_profile_id, "retroarch-amiga");
    assert_eq!(
        amiga.supported_emulator_profile_ids,
        vec![
            "retroarch-amiga".to_string(),
            "winuae-amiga".to_string(),
        ]
    );
    assert_eq!(
        amiga.folder_types,
        vec![
            "extras".to_string(),
            "games".to_string(),
            "screenshots".to_string(),
            "music".to_string(),
        ]
    );
    assert_eq!(amiga.capabilities.music, "generic");
    assert!(amiga
        .capabilities
        .launch_extensions
        .contains(&".adf".to_string()));
}

#[tokio::test(flavor = "current_thread")]
async fn test_get_supported_platforms_uses_persisted_import_status() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_string_lossy().to_string();
    let _env = DbEnvGuard::set(&db_path);
    let conn = Connection::open(&db_path).unwrap();
    conn.execute(
        "CREATE TABLE PlatformLibraries (
            platform_id TEXT PRIMARY KEY,
            display_name TEXT NOT NULL,
            import_status TEXT NOT NULL,
            source_mdb_path TEXT,
            game_count INTEGER NOT NULL DEFAULT 0,
            last_import_error TEXT,
            last_imported_at TEXT
        )",
        [],
    ).unwrap();
    conn.execute(
        "INSERT INTO PlatformLibraries (platform_id, display_name, import_status, game_count)
         VALUES ('atari800', 'Atari 800', 'imported', 7288)",
        [],
    ).unwrap();

    let atari800 = get_supported_platforms().await.unwrap()
        .into_iter()
        .find(|platform| platform.id == "atari800")
        .unwrap();

    assert_eq!(atari800.import_status, "imported");
}

#[tokio::test(flavor = "current_thread")]
async fn test_get_supported_platforms_includes_atari_st_capabilities() {
    let platforms = get_supported_platforms().await.unwrap();
    let atari_st = platforms
        .iter()
        .find(|platform| platform.id == "atarist")
        .expect("Atari ST profile should exist");

    assert_eq!(atari_st.display_name, "Atari ST");
    assert_eq!(atari_st.import_status, "notImported");
    assert_eq!(atari_st.default_emulator_profile_id, "retroarch-atarist");
    assert_eq!(
        atari_st.supported_emulator_profile_ids,
        vec![
            "retroarch-atarist".to_string(),
            "steem-atarist".to_string(),
            "hatari-atarist".to_string(),
        ]
    );
    assert_eq!(
        atari_st.folder_types,
        vec![
            "extras".to_string(),
            "games".to_string(),
            "screenshots".to_string(),
            "music".to_string(),
        ]
    );
    assert_eq!(atari_st.capabilities.music, "generic");
    assert!(atari_st
        .capabilities
        .launch_extensions
        .contains(&".st".to_string()));
}

#[tokio::test(flavor = "current_thread")]
async fn test_get_supported_platforms_includes_vic20_capabilities() {
    let platforms = get_supported_platforms().await.unwrap();
    let vic20 = platforms
        .iter()
        .find(|platform| platform.id == "vic20")
        .expect("VIC-20 profile should exist");

    assert_eq!(vic20.display_name, "Commodore VIC-20");
    assert_eq!(vic20.import_status, "notImported");
    assert_eq!(vic20.default_emulator_profile_id, "retroarch-vic20");
    assert_eq!(
        vic20.supported_emulator_profile_ids,
        vec!["retroarch-vic20".to_string(), "vice-vic20".to_string()]
    );
    assert_eq!(
        vic20.folder_types,
        vec![
            "extras".to_string(),
            "games".to_string(),
            "screenshots".to_string(),
            "music".to_string(),
        ]
    );
    assert_eq!(vic20.capabilities.music, "generic");
    assert!(vic20
        .capabilities
        .launch_extensions
        .contains(&".prg".to_string()));
}

#[tokio::test(flavor = "current_thread")]
async fn test_active_platform_defaults_to_c64() {
    let active = get_active_platform().await.unwrap();

    assert_eq!(active.active_platform_id, "c64");
    assert_eq!(active.last_used_platform_id, Some("c64".to_string()));
    assert!(!active.platform_selection_required);
}

#[tokio::test(flavor = "current_thread")]
async fn test_set_active_platform_routes_unimported_atari800_to_import() {
    let response = set_active_platform("atari800".to_string()).await.unwrap();

    assert_eq!(response.active_platform_id, "atari800");
    assert!(response.requires_import);
    assert!(response.message.contains("imported"));
}

#[test]
fn test_platform_import_status_is_platform_scoped() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_string_lossy().to_string();
    let _env = DbEnvGuard::set(&db_path);

    let status = get_platform_import_status_sync("atari800").unwrap();

    assert_eq!(status.platform_id, "atari800");
    assert_eq!(status.import_status, "notImported");
    assert_eq!(status.game_count, 0);
}

#[test]
fn test_platform_import_status_reads_imported_sqlite_library() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_string_lossy().to_string();
    let _env = DbEnvGuard::set(&db_path);

    {
        let conn = Connection::open(&db_path).unwrap();
        conn.execute(
            "CREATE TABLE PlatformLibraries (
                platform_id TEXT PRIMARY KEY,
                display_name TEXT NOT NULL,
                import_status TEXT NOT NULL,
                source_mdb_path TEXT,
                game_count INTEGER NOT NULL DEFAULT 0,
                last_import_error TEXT,
                last_imported_at TEXT
            )",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO PlatformLibraries (
                platform_id,
                display_name,
                import_status,
                source_mdb_path,
                game_count,
                last_import_error,
                last_imported_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, NULL, datetime('now'))",
            rusqlite::params![
                "atari800",
                "Atari 800",
                "imported",
                "E:/Atari/Atari 800 v12.mdb",
                7288,
            ],
        )
        .unwrap();
    }

    let status = get_platform_import_status_sync("atari800").unwrap();

    assert_eq!(status.platform_id, "atari800");
    assert_eq!(status.import_status, "imported");
    assert_eq!(status.game_count, 7288);
    assert_eq!(
        status.source_mdb_path,
        Some("E:/Atari/Atari 800 v12.mdb".to_string())
    );
}

#[test]
fn test_platform_import_status_treats_missing_library_row_as_not_imported() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_string_lossy().to_string();
    let _env = DbEnvGuard::set(&db_path);

    {
        let conn = Connection::open(&db_path).unwrap();
        conn.execute(
            "CREATE TABLE PlatformLibraries (
                platform_id TEXT PRIMARY KEY,
                display_name TEXT NOT NULL,
                import_status TEXT NOT NULL,
                source_mdb_path TEXT,
                game_count INTEGER NOT NULL DEFAULT 0,
                last_import_error TEXT,
                last_imported_at TEXT
            )",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO PlatformLibraries (
                platform_id,
                display_name,
                import_status,
                source_mdb_path,
                game_count,
                last_import_error,
                last_imported_at
            ) VALUES (?1, ?2, ?3, NULL, ?4, NULL, datetime('now'))",
            rusqlite::params!["atari800", "Atari 800", "imported", 7288],
        )
        .unwrap();
    }

    let status = get_platform_import_status_sync("c64").unwrap();

    assert_eq!(status.platform_id, "c64");
    assert_eq!(status.import_status, "notImported");
    assert_eq!(status.game_count, 0);
}
