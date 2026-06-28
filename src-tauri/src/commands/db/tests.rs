use crate::models::GameFilters;
use rusqlite::{params_from_iter, Connection};
use tempfile::NamedTempFile;

use super::games::build_game_summary_query;
use super::querying::{
    build_fts_match_query, build_game_query, load_game_count_with_fallback,
    load_ordered_game_ids_with_fallback, SearchMode,
};
use super::{
    get_db_game_count, get_db_games, get_game_extras, get_genres, get_secure_setting,
    get_sub_genres, save_secure_setting,
};
use crate::database::init_database;
use crate::test_helpers::DbEnvGuard;

fn sqlite_table_exists(conn: &Connection, table_name: &str) -> bool {
    conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?1)",
        [table_name],
        |row| row.get(0),
    )
    .unwrap()
}

fn create_search_fallback_fixture(conn: &Connection) {
    conn.execute(
        "CREATE TABLE Games (
            platform_id TEXT DEFAULT 'c64',
            GA_Id TEXT,
            Name TEXT,
            MU_Id TEXT,
            PR_Id TEXT,
            AR_Id TEXT,
            CR_Id TEXT,
            DE_Id TEXT,
            Adult TEXT,
            Control TEXT,
            PlayersFrom TEXT,
            PlayersTo TEXT,
            PlayersSim TEXT,
            Comment TEXT,
            ReviewRating TEXT,
            V_Trainers TEXT,
            V_Length TEXT,
            V_LoadingScreen TEXT,
            V_HighScoreSaver TEXT,
            V_IncludedDocs TEXT,
            V_TrueDriveEmu TEXT,
            V_PalNTSC TEXT,
            MemoText TEXT
        )",
        [],
    )
    .unwrap();
    conn.execute(
        "CREATE TABLE GameView (
            platformId TEXT DEFAULT 'c64',
            sourceGameId TEXT,
            id TEXT,
            name TEXT,
            filename TEXT,
            gameFilename TEXT,
            screenshotFilename TEXT,
            boxFrontFilename TEXT,
            titlescreenFilename TEXT,
            videoSnapFilename TEXT,
            sidFilename TEXT,
            crc TEXT,
            year TEXT,
            isPal INTEGER,
            isNtsc INTEGER,
            trueDriveEmu INTEGER,
            isClassic INTEGER,
            parentGenre TEXT,
            subGenre TEXT,
            developer_name TEXT,
            publisher_name TEXT,
            musician_name TEXT,
            languages TEXT
        )",
        [],
    )
    .unwrap();
    conn.execute(
        "CREATE TABLE Musicians (MU_Id TEXT, Photo TEXT, Nick TEXT, Grp TEXT, Musician TEXT)",
        [],
    )
    .unwrap();
    conn.execute("CREATE TABLE Programmers (PR_Id TEXT, Programmer TEXT)", [])
        .unwrap();
    conn.execute("CREATE TABLE Artists (AR_Id TEXT, Artist TEXT)", [])
        .unwrap();
    conn.execute("CREATE TABLE Developers (DE_Id TEXT, Developer TEXT)", [])
        .unwrap();
    conn.execute(
        "CREATE TABLE Extras (platform_id TEXT DEFAULT 'c64', GA_Id TEXT, Path TEXT)",
        [],
    )
    .unwrap();

    conn.execute(
        "INSERT INTO Programmers (PR_Id, Programmer) VALUES (?, ?)",
        ["coder1", "Chris Programmer"],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO Artists (AR_Id, Artist) VALUES (?, ?)",
        ["artist1", "Ejber Ozkan"],
    )
    .unwrap();

    conn.execute(
        "INSERT INTO Games (GA_Id, Name, PR_Id, AR_Id, Adult) VALUES (?, ?, ?, ?, ?)",
        ["1", "Alpha Mission", "coder1", "artist1", "False"],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO Games (GA_Id, Name, Adult) VALUES (?, ?, ?)",
        ["2", "Bubble Bobble", "False"],
    )
    .unwrap();

    conn.execute(
        "INSERT INTO GameView (id, name, filename, parentGenre, subGenre, isPal, isNtsc, trueDriveEmu, isClassic, developer_name, publisher_name, musician_name, languages) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        rusqlite::params!["1", "Alpha Mission", "alpha.d64", "Shoot'em Up", "Vertical", 1, 0, 0, 0, "Studio A", "Pub A", "Musician A", "EN"],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO GameView (id, name, filename, parentGenre, subGenre, isPal, isNtsc, trueDriveEmu, isClassic, developer_name, publisher_name, musician_name, languages) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        rusqlite::params!["2", "Bubble Bobble", "bubble.d64", "Platform", "Arcade", 1, 0, 0, 0, "Studio B", "Pub B", "Musician B", "EN"],
    )
    .unwrap();
}

#[test]
fn test_build_game_query_search_and_favorites() {
    let filters = GameFilters {
        search_query: Some("Ejber".to_string()),
        favorite_ids: Some(vec!["7933".to_string(), "4100".to_string()]),
        ..Default::default()
    };

    let (query, params) = build_game_query("atari800", 25, 10, Some(filters), SearchMode::Fts)
        .expect("query should build");
    assert!(query.contains("gv.platformId = ?"));
    assert!(query.contains("WHERE platform_id = ?"));
    assert!(query.contains("FROM GameSearchIndex"));
    assert!(query.contains("GameSearchIndex MATCH ?"));
    assert!(query.contains("gv.id IN (?,?)"));
    assert_eq!(params.len(), 7);
    assert_eq!(params[0], "atari800");
    assert_eq!(params[1], "atari800");
    assert_eq!(params[2], "Ejber*");
    assert_eq!(params[3], "7933");
    assert_eq!(params[4], "4100");
    assert_eq!(params[5], "25");
    assert_eq!(params[6], "10");
}

#[test]
fn test_build_fts_match_query_sanitizes_terms() {
    assert_eq!(
        build_fts_match_query("Zak McKracken"),
        Some("Zak* AND McKracken*".to_string())
    );
    assert_eq!(
        build_fts_match_query("I, Ball"),
        Some("I* AND Ball*".to_string())
    );
    assert_eq!(build_fts_match_query("!!!"), None);
}

#[test]
fn test_build_game_query_invalid_fts_input_matches_nothing() {
    let filters = GameFilters {
        search_query: Some("!!!".to_string()),
        ..Default::default()
    };

    let (query, params) =
        build_game_query("c64", 10, 0, Some(filters), SearchMode::Fts).expect("query should build");
    assert!(query.contains("AND 1=0"));
    assert_eq!(
        params,
        vec!["c64".to_string(), "10".to_string(), "0".to_string()]
    );
}

#[test]
fn test_build_game_query_empty_favorites_short_circuit() {
    let filters = GameFilters {
        favorite_ids: Some(vec![]),
        ..Default::default()
    };

    assert!(build_game_query("c64", 10, 0, Some(filters), SearchMode::Fts).is_none());
}

#[test]
fn test_build_game_query_like_fallback_uses_legacy_predicates() {
    let filters = GameFilters {
        search_query: Some("Ejber".to_string()),
        ..Default::default()
    };

    let (query, params) = build_game_query("c64", 10, 0, Some(filters), SearchMode::Like)
        .expect("query should build");
    assert!(query.contains("LOWER(gv.name) LIKE ?"));
    assert!(query.contains("LOWER(COALESCE(ar.Artist, '')) LIKE ?"));
    assert_eq!(params.len(), 9);
    assert_eq!(params[0], "c64");
    assert_eq!(params[1], "%ejber%");
}

#[test]
fn test_build_game_summary_query_preserves_requested_id_order_in_sql() {
    let conn = Connection::open_in_memory().unwrap();
    conn.execute(
        "CREATE TABLE Games (
            platform_id TEXT DEFAULT 'c64',
            GA_Id TEXT,
            Name TEXT,
            MU_Id TEXT,
            PR_Id TEXT,
            AR_Id TEXT,
            Adult TEXT,
            Control TEXT,
            PlayersFrom TEXT,
            PlayersTo TEXT,
            PlayersSim TEXT,
            Comment TEXT,
            ReviewRating TEXT,
            V_Trainers TEXT,
            V_Length TEXT,
            V_LoadingScreen TEXT,
            V_HighScoreSaver TEXT,
            V_IncludedDocs TEXT,
            V_TrueDriveEmu TEXT,
            V_PalNTSC TEXT,
            MemoText TEXT
        )",
        [],
    )
    .unwrap();
    conn.execute(
        "CREATE TABLE GameView (
            platformId TEXT DEFAULT 'c64',
            sourceGameId TEXT,
            id TEXT,
            name TEXT,
            filename TEXT,
            gameFilename TEXT,
            screenshotFilename TEXT,
            boxFrontFilename TEXT,
            titlescreenFilename TEXT,
            videoSnapFilename TEXT,
            sidFilename TEXT,
            crc TEXT,
            year TEXT,
            isPal INTEGER,
            isNtsc INTEGER,
            trueDriveEmu INTEGER,
            isClassic INTEGER,
            parentGenre TEXT,
            subGenre TEXT,
            developer_name TEXT,
            publisher_name TEXT,
            musician_name TEXT,
            languages TEXT
        )",
        [],
    )
    .unwrap();
    conn.execute(
        "CREATE TABLE Musicians (MU_Id TEXT, Photo TEXT, Nick TEXT, Grp TEXT)",
        [],
    )
    .unwrap();
    conn.execute("CREATE TABLE Programmers (PR_Id TEXT, Programmer TEXT)", [])
        .unwrap();
    conn.execute("CREATE TABLE Artists (AR_Id TEXT, Artist TEXT)", [])
        .unwrap();

    conn.execute(
        "INSERT INTO Games (GA_Id, Name, Adult) VALUES (?, ?, ?)",
        ["1", "Zulu Game", "False"],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO Games (GA_Id, Name, Adult) VALUES (?, ?, ?)",
        ["2", "Alpha Game", "False"],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO GameView (id, name, filename, isPal, isNtsc, trueDriveEmu, isClassic, parentGenre, subGenre)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        rusqlite::params!["1", "Zulu Game", "zulu.d64", 1, 0, 0, 0, "Action", "Arcade"],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO GameView (id, name, filename, isPal, isNtsc, trueDriveEmu, isClassic, parentGenre, subGenre)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        rusqlite::params!["2", "Alpha Game", "alpha.d64", 1, 0, 0, 0, "Action", "Arcade"],
    )
    .unwrap();

    let ordered_ids = vec!["2".to_string(), "1".to_string()];
    let (query, params) = build_game_summary_query("c64", &ordered_ids, false);
    let mut stmt = conn.prepare(&query).unwrap();
    let game_ids = stmt
        .query_map(params_from_iter(params), |row| row.get::<_, String>("id"))
        .unwrap()
        .collect::<Result<Vec<_>, _>>()
        .unwrap();

    assert_eq!(game_ids, ordered_ids);
}

#[tokio::test(flavor = "current_thread")]
async fn test_secure_settings_roundtrip() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_string_lossy().to_string();
    let _env = DbEnvGuard::set(&db_path);

    save_secure_setting("test_key".to_string(), "test_password".to_string())
        .await
        .expect("Failed to save");
    let val = get_secure_setting("test_key".to_string())
        .await
        .expect("Failed to get");

    assert_eq!(val, Some("test_password".to_string()));

    let missing = get_secure_setting("unknown".to_string())
        .await
        .expect("Failed to get unknown");
    assert!(missing.is_none());
}

#[tokio::test(flavor = "current_thread")]
async fn test_get_genres() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_string_lossy().to_string();
    let _env = DbEnvGuard::set(&db_path);

    {
        let conn = Connection::open(&db_path).unwrap();
        conn.execute(
            "CREATE TABLE GameView (platformId TEXT DEFAULT 'c64', parentGenre TEXT)",
            [],
        )
        .unwrap();
        conn.execute("INSERT INTO GameView (parentGenre) VALUES (?)", ["Action"])
            .unwrap();
        conn.execute("INSERT INTO GameView (parentGenre) VALUES (?)", ["Puzzle"])
            .unwrap();
        conn.execute("INSERT INTO GameView (parentGenre) VALUES (?)", [""])
            .unwrap();
    }

    let genres = get_genres(None).await.expect("Failed to get genres");
    assert_eq!(genres.len(), 2);
    assert!(genres.contains(&"Action".to_string()));
    assert!(genres.contains(&"Puzzle".to_string()));

    let conn = Connection::open(&db_path).unwrap();
    assert!(!sqlite_table_exists(&conn, "GameCoverIndex"));
    assert!(!sqlite_table_exists(&conn, "GameSearchIndex"));
}

#[tokio::test(flavor = "current_thread")]
async fn test_get_sub_genres() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_string_lossy().to_string();
    let _env = DbEnvGuard::set(&db_path);

    {
        let conn = Connection::open(&db_path).unwrap();
        conn.execute("CREATE TABLE GameView (platformId TEXT DEFAULT 'c64', parentGenre TEXT, subGenre TEXT)", [])
            .unwrap();
        conn.execute(
            "INSERT INTO GameView (parentGenre, subGenre) VALUES (?, ?)",
            ["Platform", "Arcade"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO GameView (parentGenre, subGenre) VALUES (?, ?)",
            ["Platform", "Collect'em Up"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO GameView (parentGenre, subGenre) VALUES (?, ?)",
            ["Shoot'em Up", "Vertical"],
        )
        .unwrap();
    }

    let platform_sub_genres = get_sub_genres(Some("Platform".to_string()), None)
        .await
        .expect("Failed to get sub-genres");
    assert_eq!(platform_sub_genres.len(), 2);
    assert!(platform_sub_genres.contains(&"Arcade".to_string()));
    assert!(platform_sub_genres.contains(&"Collect'em Up".to_string()));

    let no_filter_sub_genres = get_sub_genres(None, None)
        .await
        .expect("Failed to get sub-genres without a genre");
    assert!(no_filter_sub_genres.is_empty());
}

#[tokio::test(flavor = "current_thread")]
async fn test_get_game_extras() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_string_lossy().to_string();
    let _env = DbEnvGuard::set(&db_path);

    {
        let conn = Connection::open(&db_path).unwrap();
        conn.execute(
            "CREATE TABLE Games (platform_id TEXT DEFAULT 'c64', GA_Id TEXT, Name TEXT, Adult TEXT)",
            [],
        )
        .unwrap();
        conn.execute(
            "CREATE TABLE Extras (platform_id TEXT DEFAULT 'c64', GA_Id TEXT, EX_Id TEXT, Name TEXT, Path TEXT, Type TEXT, DisplayOrder INTEGER)",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO Games (GA_Id, Name, Adult) VALUES (?, ?, ?)",
            ["game1", "Extra Game", "False"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO Extras (GA_Id, EX_Id, Name, Path, Type, DisplayOrder) VALUES (?, ?, ?, ?, ?, ?)",
            rusqlite::params!["game1", "ex1", "Manual", "extras/manual.pdf", "doc", 1],
        )
        .unwrap();
    }

    let extras = get_game_extras("game1".to_string(), None)
        .await
        .expect("Failed to get extras");
    assert_eq!(extras.len(), 1);
    assert_eq!(extras[0].name, "Manual");
}

#[tokio::test(flavor = "current_thread")]
async fn test_platform_scoped_queries_do_not_mix_duplicate_source_ids() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_string_lossy().to_string();
    let _env = DbEnvGuard::set(&db_path);

    {
        let conn = Connection::open(&db_path).unwrap();
        conn.execute(
            "CREATE TABLE Games (
                platform_id TEXT,
                GA_Id TEXT,
                Name TEXT,
                MU_Id TEXT,
                PR_Id TEXT,
                AR_Id TEXT,
                Adult TEXT,
                Control TEXT,
                PlayersFrom TEXT,
                PlayersTo TEXT,
                PlayersSim TEXT,
                Comment TEXT,
                ReviewRating TEXT,
                V_Trainers TEXT,
                V_Length TEXT,
                V_LoadingScreen TEXT,
                V_HighScoreSaver TEXT,
                V_IncludedDocs TEXT,
                V_TrueDriveEmu TEXT,
                V_PalNTSC TEXT,
                MemoText TEXT
            )",
            [],
        )
        .unwrap();
        conn.execute(
            "CREATE TABLE GameView (
                platformId TEXT,
                sourceGameId TEXT,
                id TEXT,
                name TEXT,
                filename TEXT,
                gameFilename TEXT,
                screenshotFilename TEXT,
                boxFrontFilename TEXT,
                titlescreenFilename TEXT,
                videoSnapFilename TEXT,
                sidFilename TEXT,
                crc TEXT,
                year TEXT,
                isPal INTEGER,
                isNtsc INTEGER,
                trueDriveEmu INTEGER,
                isClassic INTEGER,
                parentGenre TEXT,
                subGenre TEXT,
                developer_name TEXT,
                publisher_name TEXT,
                musician_name TEXT,
                languages TEXT
            )",
            [],
        )
        .unwrap();
        conn.execute(
            "CREATE TABLE Musicians (MU_Id TEXT, Photo TEXT, Nick TEXT, Grp TEXT, Musician TEXT)",
            [],
        )
        .unwrap();
        conn.execute("CREATE TABLE Programmers (PR_Id TEXT, Programmer TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Artists (AR_Id TEXT, Artist TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Extras (platform_id TEXT, GA_Id TEXT, EX_Id TEXT, Name TEXT, Path TEXT, Type TEXT, DisplayOrder INTEGER)", []).unwrap();

        for (platform_id, game_name, genre, extra_name) in [
            ("c64", "C64 Duplicate", "Action", "C64 Manual"),
            ("atari800", "Atari Duplicate", "Arcade", "Atari Manual"),
        ] {
            conn.execute(
                "INSERT INTO Games (platform_id, GA_Id, Name, Adult) VALUES (?, ?, ?, ?)",
                rusqlite::params![platform_id, "1", game_name, "False"],
            )
            .unwrap();
            conn.execute(
                "INSERT INTO GameView (platformId, sourceGameId, id, name, filename, isPal, isNtsc, trueDriveEmu, isClassic, parentGenre, subGenre)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                rusqlite::params![platform_id, "1", "1", game_name, "game.bin", 1, 0, 0, 0, genre, "Launchable"],
            )
            .unwrap();
            conn.execute(
                "INSERT INTO Extras (platform_id, GA_Id, EX_Id, Name, Path, Type, DisplayOrder) VALUES (?, ?, ?, ?, ?, ?, ?)",
                rusqlite::params![platform_id, "1", format!("{platform_id}-extra"), extra_name, "extras/manual.pdf", "doc", 1],
            )
            .unwrap();
        }
    }

    let atari_games = get_db_games(Some(10), Some(0), None, Some("atari800".to_string()))
        .await
        .expect("atari games should load");
    assert_eq!(atari_games.len(), 1);
    assert_eq!(atari_games[0].name, "Atari Duplicate");

    let atari_count = get_db_game_count(None, Some("atari800".to_string()))
        .await
        .expect("atari count should load");
    assert_eq!(atari_count, 1);

    let atari_genres = get_genres(Some("atari800".to_string()))
        .await
        .expect("atari genres should load");
    assert_eq!(atari_genres, vec!["Arcade".to_string()]);

    let atari_extras = get_game_extras("1".to_string(), Some("atari800".to_string()))
        .await
        .expect("atari extras should load");
    assert_eq!(atari_extras.len(), 1);
    assert_eq!(atari_extras[0].name, "Atari Manual");
}

#[tokio::test(flavor = "current_thread")]
async fn test_init_database_repairs_stale_game_view_without_platform_id() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_string_lossy().to_string();
    let _env = DbEnvGuard::set(&db_path);

    {
        let conn = Connection::open(&db_path).unwrap();
        conn.execute(
            "CREATE TABLE Games (
                platform_id TEXT,
                source_game_id TEXT,
                GA_Id TEXT,
                Name TEXT,
                Filename TEXT,
                FileToRun TEXT,
                ScrnshotFilename TEXT,
                SidFilename TEXT,
                CRC TEXT,
                YE_Id TEXT,
                GE_Id TEXT,
                DE_Id TEXT,
                PU_Id TEXT,
                MU_Id TEXT,
                LA_Id TEXT,
                PR_Id TEXT,
                AR_Id TEXT,
                V_PalNTSC TEXT,
                V_TrueDriveEmu TEXT,
                Classic TEXT,
                Adult TEXT,
                Control TEXT,
                PlayersFrom TEXT,
                PlayersTo TEXT,
                PlayersSim TEXT,
                Comment TEXT,
                ReviewRating TEXT,
                V_Trainers TEXT,
                V_Length TEXT,
                V_LoadingScreen TEXT,
                V_HighScoreSaver TEXT,
                V_IncludedDocs TEXT
            )",
            [],
        )
        .unwrap();
        conn.execute(
            "CREATE VIEW GameView AS
             SELECT
               GA_Id as id,
               Name as name,
               Filename as filename,
               Filename as gameFilename,
               ScrnshotFilename as screenshotFilename,
               NULL as boxFrontFilename,
               NULL as titlescreenFilename,
               NULL as videoSnapFilename,
               SidFilename as sidFilename,
               CRC as crc,
               NULL as year,
               1 as isPal,
               0 as isNtsc,
               0 as trueDriveEmu,
               0 as isClassic,
               'Action' as parentGenre,
               'Arcade' as subGenre,
               '' as developer_name,
               '' as publisher_name,
               '' as musician_name,
               'EN' as languages
             FROM Games",
            [],
        )
        .unwrap();
        conn.execute("CREATE TABLE Years (YE_Id TEXT, Year TEXT)", [])
            .unwrap();
        conn.execute(
            "CREATE TABLE Genres (GE_Id TEXT, Genre TEXT, PG_Id TEXT)",
            [],
        )
        .unwrap();
        conn.execute("CREATE TABLE PGenres (PG_Id TEXT, ParentGenre TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Developers (DE_Id TEXT, Developer TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Publishers (PU_Id TEXT, Publisher TEXT)", [])
            .unwrap();
        conn.execute(
            "CREATE TABLE Musicians (MU_Id TEXT, Photo TEXT, Nick TEXT, Grp TEXT, Musician TEXT)",
            [],
        )
        .unwrap();
        conn.execute("CREATE TABLE Languages (LA_Id TEXT, Language TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Programmers (PR_Id TEXT, Programmer TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Artists (AR_Id TEXT, Artist TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Extras (platform_id TEXT, GA_Id TEXT, EX_Id TEXT, Name TEXT, Path TEXT, Type TEXT, DisplayOrder INTEGER)", []).unwrap();

        for (platform_id, game_name) in [("c64", "C64 Duplicate"), ("atari800", "Atari Duplicate")]
        {
            conn.execute(
                "INSERT INTO Games (platform_id, source_game_id, GA_Id, Name, Filename, Classic, Adult)
                 VALUES (?, ?, ?, ?, ?, ?, ?)",
                rusqlite::params![platform_id, "1", "1", game_name, "game.bin", "False", "False"],
            )
            .unwrap();
        }
    }

    init_database().expect("database initialization should repair stale support objects");

    let atari_games = get_db_games(Some(10), Some(0), None, Some("atari800".to_string()))
        .await
        .expect("atari games should load after repair");
    assert_eq!(atari_games.len(), 1);
    assert_eq!(atari_games[0].name, "Atari Duplicate");
}

#[tokio::test(flavor = "current_thread")]
async fn test_get_db_games() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_string_lossy().to_string();
    let _env = DbEnvGuard::set(&db_path);

    {
        let conn = Connection::open(&db_path).unwrap();
        conn.execute("CREATE TABLE Games (platform_id TEXT DEFAULT 'c64', GA_Id TEXT, Name TEXT, MU_Id TEXT, PR_Id TEXT, AR_Id TEXT, CR_Id TEXT, DE_Id TEXT, Adult TEXT, Control TEXT, PlayersFrom TEXT, PlayersTo TEXT, PlayersSim TEXT, Comment TEXT, ReviewRating TEXT, V_Trainers TEXT, V_Length TEXT, V_LoadingScreen TEXT, V_HighScoreSaver TEXT, V_IncludedDocs TEXT, V_TrueDriveEmu TEXT, V_PalNTSC TEXT, MemoText TEXT)", []).unwrap();
        conn.execute("CREATE TABLE GameView (platformId TEXT DEFAULT 'c64', sourceGameId TEXT, id TEXT, name TEXT, filename TEXT, gameFilename TEXT, screenshotFilename TEXT, boxFrontFilename TEXT, titlescreenFilename TEXT, videoSnapFilename TEXT, sidFilename TEXT, crc TEXT, year TEXT, isPal INTEGER, isNtsc INTEGER, trueDriveEmu INTEGER, isClassic INTEGER, parentGenre TEXT, subGenre TEXT, developer_name TEXT, publisher_name TEXT, musician_name TEXT, languages TEXT)", []).unwrap();
        conn.execute(
            "CREATE TABLE Musicians (MU_Id TEXT, Photo TEXT, Nick TEXT, Grp TEXT, Musician TEXT)",
            [],
        )
        .unwrap();
        conn.execute("CREATE TABLE Programmers (PR_Id TEXT, Programmer TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Artists (AR_Id TEXT, Artist TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Developers (DE_Id TEXT, Developer TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Extras (GA_Id TEXT, Path TEXT)", [])
            .unwrap();

        conn.execute(
            "INSERT INTO Artists (AR_Id, Artist) VALUES (?, ?)",
            ["gfx1", "Ejber Ozkan"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO Programmers (PR_Id, Programmer) VALUES (?, ?)",
            ["coder1", "Chris Programmer"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO Games (GA_Id, Name, AR_Id, PR_Id, Adult) VALUES (?, ?, ?, ?, ?)",
            ["1", "Maniac Mansion", "gfx1", "coder1", "False"],
        )
        .unwrap();
        conn.execute("INSERT INTO GameView (id, name, filename, parentGenre, subGenre, isPal, isNtsc, trueDriveEmu, isClassic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params!["1", "Maniac Mansion", "maniac.d64", "Action", "Adventure", 1, 0, 0, 1]).unwrap();
    }

    let games = get_db_games(Some(10), Some(0), None, None)
        .await
        .expect("Failed basic fetch");
    assert_eq!(games.len(), 1);
    assert_eq!(games[0].name, "Maniac Mansion");

    let filters_m = GameFilters {
        letter: Some("M".to_string()),
        ..Default::default()
    };
    let res_m = get_db_games(Some(10), Some(0), Some(filters_m), None)
        .await
        .unwrap();
    assert_eq!(res_m.len(), 1);

    let filters_z = GameFilters {
        letter: Some("Z".to_string()),
        ..Default::default()
    };
    let res_z = get_db_games(Some(10), Some(0), Some(filters_z), None)
        .await
        .unwrap();
    assert_eq!(res_z.len(), 0);

    let filters_sq = GameFilters {
        search_query: Some("Maniac".to_string()),
        ..Default::default()
    };
    let res_sq = get_db_games(Some(10), Some(0), Some(filters_sq), None)
        .await
        .unwrap();
    assert_eq!(res_sq.len(), 1);

    let filters_graphics = GameFilters {
        search_query: Some("Ejber".to_string()),
        ..Default::default()
    };
    let res_graphics = get_db_games(Some(10), Some(0), Some(filters_graphics), None)
        .await
        .unwrap();
    assert_eq!(res_graphics.len(), 1);

    let filters_programmer = GameFilters {
        search_query: Some("Programmer".to_string()),
        ..Default::default()
    };
    let res_programmer = get_db_games(Some(10), Some(0), Some(filters_programmer), None)
        .await
        .unwrap();
    assert_eq!(res_programmer.len(), 1);

    let filters_adult = GameFilters {
        hide_adult: Some(true),
        ..Default::default()
    };
    let res_adult = get_db_games(Some(10), Some(0), Some(filters_adult), None)
        .await
        .unwrap();
    assert_eq!(res_adult.len(), 1);

    let filters_sub_genre = GameFilters {
        genre: Some("Action".to_string()),
        sub_genre: Some("Adventure".to_string()),
        ..Default::default()
    };
    let res_sub_genre = get_db_games(Some(10), Some(0), Some(filters_sub_genre), None)
        .await
        .unwrap();
    assert_eq!(res_sub_genre.len(), 1);

    let conn = Connection::open(&db_path).unwrap();
    assert!(!sqlite_table_exists(&conn, "GameCoverIndex"));
    assert!(!sqlite_table_exists(&conn, "GameSearchIndex"));
}

#[tokio::test(flavor = "current_thread")]
async fn test_get_db_games_symbol_filter() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_string_lossy().to_string();
    let _env = DbEnvGuard::set(&db_path);

    {
        let conn = Connection::open(&db_path).unwrap();
        conn.execute("CREATE TABLE Games (platform_id TEXT DEFAULT 'c64', GA_Id TEXT, Name TEXT, MU_Id TEXT, PR_Id TEXT, AR_Id TEXT, CR_Id TEXT, DE_Id TEXT, Adult TEXT, Control TEXT, PlayersFrom TEXT, PlayersTo TEXT, PlayersSim TEXT, Comment TEXT, ReviewRating TEXT, V_Trainers TEXT, V_Length TEXT, V_LoadingScreen TEXT, V_HighScoreSaver TEXT, V_IncludedDocs TEXT, V_TrueDriveEmu TEXT, V_PalNTSC TEXT, MemoText TEXT)", []).unwrap();
        conn.execute("CREATE TABLE GameView (platformId TEXT DEFAULT 'c64', sourceGameId TEXT, id TEXT, name TEXT, filename TEXT, gameFilename TEXT, screenshotFilename TEXT, boxFrontFilename TEXT, titlescreenFilename TEXT, videoSnapFilename TEXT, sidFilename TEXT, crc TEXT, year TEXT, isPal INTEGER, isNtsc INTEGER, trueDriveEmu INTEGER, isClassic INTEGER, parentGenre TEXT, subGenre TEXT, developer_name TEXT, publisher_name TEXT, musician_name TEXT, languages TEXT)", []).unwrap();
        conn.execute(
            "CREATE TABLE Musicians (MU_Id TEXT, Photo TEXT, Nick TEXT, Grp TEXT, Musician TEXT)",
            [],
        )
        .unwrap();
        conn.execute("CREATE TABLE Programmers (PR_Id TEXT, Programmer TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Artists (AR_Id TEXT, Artist TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Developers (DE_Id TEXT, Developer TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Extras (GA_Id TEXT, Path TEXT)", [])
            .unwrap();

        conn.execute(
            "INSERT INTO Games (GA_Id, Name, Adult) VALUES (?, ?, ?)",
            ["1", "1942", "False"],
        )
        .unwrap();
        conn.execute("INSERT INTO GameView (id, name, filename, parentGenre, subGenre, isPal, isNtsc, trueDriveEmu, isClassic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params!["1", "1942", "1942.d64", "Action", "Shooter", 1, 0, 0, 1]).unwrap();
    }

    let filters = GameFilters {
        letter: Some("#".to_string()),
        ..Default::default()
    };
    let res = get_db_games(Some(10), Some(0), Some(filters), None)
        .await
        .unwrap();
    assert_eq!(res.len(), 1);
    assert_eq!(res[0].name, "1942");
}

#[tokio::test(flavor = "current_thread")]
async fn test_get_db_games_pagination() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_string_lossy().to_string();
    let _env = DbEnvGuard::set(&db_path);

    {
        let conn = Connection::open(&db_path).unwrap();
        conn.execute("CREATE TABLE Games (platform_id TEXT DEFAULT 'c64', GA_Id TEXT, Name TEXT, MU_Id TEXT, PR_Id TEXT, AR_Id TEXT, CR_Id TEXT, DE_Id TEXT, Adult TEXT, Control TEXT, PlayersFrom TEXT, PlayersTo TEXT, PlayersSim TEXT, Comment TEXT, ReviewRating TEXT, V_Trainers TEXT, V_Length TEXT, V_LoadingScreen TEXT, V_HighScoreSaver TEXT, V_IncludedDocs TEXT, V_TrueDriveEmu TEXT, V_PalNTSC TEXT, MemoText TEXT)", []).unwrap();
        conn.execute("CREATE TABLE GameView (platformId TEXT DEFAULT 'c64', sourceGameId TEXT, id TEXT, name TEXT, filename TEXT, gameFilename TEXT, screenshotFilename TEXT, boxFrontFilename TEXT, titlescreenFilename TEXT, videoSnapFilename TEXT, sidFilename TEXT, crc TEXT, year TEXT, isPal INTEGER, isNtsc INTEGER, trueDriveEmu INTEGER, isClassic INTEGER, parentGenre TEXT, subGenre TEXT, developer_name TEXT, publisher_name HEX, musician_name TEXT, languages TEXT)", []).unwrap();
        conn.execute(
            "CREATE TABLE Musicians (MU_Id TEXT, Photo TEXT, Nick TEXT, Grp TEXT, Musician TEXT)",
            [],
        )
        .unwrap();
        conn.execute("CREATE TABLE Programmers (PR_Id TEXT, Programmer TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Artists (AR_Id TEXT, Artist TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Developers (DE_Id TEXT, Developer TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Extras (GA_Id TEXT, Path TEXT)", [])
            .unwrap();

        for i in 1..=5 {
            let id = i.to_string();
            conn.execute(
                "INSERT INTO Games (GA_Id, Name, Adult) VALUES (?, ?, ?)",
                [&id, &format!("Game {}", i), "False"],
            )
            .unwrap();
            conn.execute("INSERT INTO GameView (id, name, filename, parentGenre, subGenre, isPal, isNtsc, trueDriveEmu, isClassic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                rusqlite::params![&id, format!("Game {}", i), format!("game{}.d64", i), "Action", "Adventure", 1, 0, 0, 1]).unwrap();
        }
    }

    let page1 = get_db_games(Some(2), Some(0), None, None).await.unwrap();
    assert_eq!(page1.len(), 2);
    assert_eq!(page1[0].name, "Game 1");

    let page2 = get_db_games(Some(2), Some(2), None, None).await.unwrap();
    assert_eq!(page2.len(), 2);
    assert_eq!(page2[0].name, "Game 3");

    let page3 = get_db_games(Some(2), Some(4), None, None).await.unwrap();
    assert_eq!(page3.len(), 1);
    assert_eq!(page3[0].name, "Game 5");
}

#[tokio::test(flavor = "current_thread")]
async fn test_get_db_game_count() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_string_lossy().to_string();
    let _env = DbEnvGuard::set(&db_path);

    {
        let conn = Connection::open(&db_path).unwrap();
        conn.execute("CREATE TABLE Games (platform_id TEXT DEFAULT 'c64', GA_Id TEXT, Name TEXT, MU_Id TEXT, PR_Id TEXT, AR_Id TEXT, CR_Id TEXT, DE_Id TEXT, Adult TEXT, Control TEXT, PlayersFrom TEXT, PlayersTo TEXT, PlayersSim TEXT, Comment TEXT, ReviewRating TEXT, V_Trainers TEXT, V_Length TEXT, V_LoadingScreen TEXT, V_HighScoreSaver TEXT, V_IncludedDocs TEXT, V_TrueDriveEmu TEXT, V_PalNTSC TEXT, MemoText TEXT)", []).unwrap();
        conn.execute("CREATE TABLE GameView (platformId TEXT DEFAULT 'c64', sourceGameId TEXT, id TEXT, name TEXT, filename TEXT, gameFilename TEXT, screenshotFilename TEXT, boxFrontFilename TEXT, titlescreenFilename TEXT, videoSnapFilename TEXT, sidFilename TEXT, crc TEXT, year TEXT, isPal INTEGER, isNtsc INTEGER, trueDriveEmu INTEGER, isClassic INTEGER, parentGenre TEXT, subGenre TEXT, developer_name TEXT, publisher_name TEXT, musician_name TEXT, languages TEXT)", []).unwrap();
        conn.execute(
            "CREATE TABLE Musicians (MU_Id TEXT, Photo TEXT, Nick TEXT, Grp TEXT, Musician TEXT)",
            [],
        )
        .unwrap();
        conn.execute("CREATE TABLE Programmers (PR_Id TEXT, Programmer TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Artists (AR_Id TEXT, Artist TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Developers (DE_Id TEXT, Developer TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Extras (GA_Id TEXT, Path TEXT)", [])
            .unwrap();

        conn.execute(
            "INSERT INTO Games (GA_Id, Name, Adult) VALUES (?, ?, ?)",
            ["1", "Alpha Mission", "False"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO Games (GA_Id, Name, Adult) VALUES (?, ?, ?)",
            ["2", "Bubble Bobble", "False"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO Games (GA_Id, Name, Adult) VALUES (?, ?, ?)",
            ["3", "California Games", "False"],
        )
        .unwrap();

        conn.execute("INSERT INTO GameView (id, name, filename, parentGenre, subGenre, isPal, isNtsc, trueDriveEmu, isClassic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params!["1", "Alpha Mission", "alpha.d64", "Shoot'em Up", "Vertical", 1, 0, 0, 0]).unwrap();
        conn.execute("INSERT INTO GameView (id, name, filename, parentGenre, subGenre, isPal, isNtsc, trueDriveEmu, isClassic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params!["2", "Bubble Bobble", "bubble.d64", "Platform", "Arcade", 1, 0, 0, 0]).unwrap();
        conn.execute("INSERT INTO GameView (id, name, filename, parentGenre, subGenre, isPal, isNtsc, trueDriveEmu, isClassic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params!["3", "California Games", "california.d64", "Sports", "Misc", 1, 0, 0, 0]).unwrap();
    }

    let total = get_db_game_count(None, None).await.unwrap();
    assert_eq!(total, 3);

    let genre_filtered = get_db_game_count(
        Some(GameFilters {
            genre: Some("Platform".to_string()),
            ..Default::default()
        }),
        None,
    )
    .await
    .unwrap();
    assert_eq!(genre_filtered, 1);

    let search_filtered = get_db_game_count(
        Some(GameFilters {
            search_query: Some("California".to_string()),
            ..Default::default()
        }),
        None,
    )
    .await
    .unwrap();
    assert_eq!(search_filtered, 1);

    let sub_genre_filtered = get_db_game_count(
        Some(GameFilters {
            genre: Some("Platform".to_string()),
            sub_genre: Some("Arcade".to_string()),
            ..Default::default()
        }),
        None,
    )
    .await
    .unwrap();
    assert_eq!(sub_genre_filtered, 1);
}

#[test]
fn test_load_ordered_game_ids_falls_back_to_like_when_search_index_missing() {
    let conn = Connection::open_in_memory().unwrap();
    create_search_fallback_fixture(&conn);

    let ids = load_ordered_game_ids_with_fallback(
        &conn,
        "c64",
        10,
        0,
        Some(GameFilters {
            search_query: Some("Programmer".to_string()),
            ..Default::default()
        }),
    )
    .expect("LIKE fallback should succeed when FTS table is missing");

    assert_eq!(ids, vec!["1".to_string()]);
}

#[test]
fn test_load_game_count_falls_back_to_like_when_search_index_missing() {
    let conn = Connection::open_in_memory().unwrap();
    create_search_fallback_fixture(&conn);

    let count = load_game_count_with_fallback(
        &conn,
        "c64",
        Some(GameFilters {
            search_query: Some("Ejber".to_string()),
            ..Default::default()
        }),
    )
    .expect("LIKE fallback count should succeed when FTS table is missing");

    assert_eq!(count, 1);
}

#[test]
fn test_load_ordered_game_ids_deduplicates_repeated_game_view_rows() {
    let conn = Connection::open_in_memory().unwrap();
    create_search_fallback_fixture(&conn);

    conn.execute(
        "INSERT INTO GameView (id, name, filename, parentGenre, subGenre, isPal, isNtsc, trueDriveEmu, isClassic, developer_name, publisher_name, musician_name, languages) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        rusqlite::params!["1", "Alpha Mission", "alpha-alt.d64", "Shoot'em Up", "Vertical", 1, 0, 0, 0, "Studio A", "Pub A", "Musician A", "EN"],
    )
    .unwrap();

    let ids =
        load_ordered_game_ids_with_fallback(&conn, "c64", 10, 0, None).expect("ids should load");

    assert_eq!(ids, vec!["1".to_string(), "2".to_string()]);
}

#[tokio::test(flavor = "current_thread")]
async fn test_get_db_games_deduplicates_repeated_game_view_rows() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_string_lossy().to_string();
    let _env = DbEnvGuard::set(&db_path);

    {
        let conn = Connection::open(&db_path).unwrap();
        create_search_fallback_fixture(&conn);
        conn.execute(
            "INSERT INTO GameView (id, name, filename, parentGenre, subGenre, isPal, isNtsc, trueDriveEmu, isClassic, developer_name, publisher_name, musician_name, languages) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params!["1", "Alpha Mission", "alpha-duplicate.d64", "Shoot'em Up", "Vertical", 1, 0, 0, 0, "Studio A", "Pub A", "Musician A", "EN"],
        )
        .unwrap();
    }

    let games = get_db_games(Some(10), Some(0), None, None)
        .await
        .expect("games should load");
    assert_eq!(
        games.iter().map(|game| game.id.clone()).collect::<Vec<_>>(),
        vec!["1".to_string(), "2".to_string()]
    );

    let total = get_db_game_count(None, None)
        .await
        .expect("game count should load");
    assert_eq!(total, 2);
}

#[tokio::test(flavor = "current_thread")]
async fn test_get_db_games_preserves_filtered_id_order_after_detail_hydration() {
    let temp_db = NamedTempFile::new().unwrap();
    let db_path = temp_db.path().to_string_lossy().to_string();
    let _env = DbEnvGuard::set(&db_path);

    {
        let conn = Connection::open(&db_path).unwrap();
        conn.execute("CREATE TABLE Games (platform_id TEXT DEFAULT 'c64', GA_Id TEXT, Name TEXT, MU_Id TEXT, PR_Id TEXT, AR_Id TEXT, CR_Id TEXT, DE_Id TEXT, Adult TEXT, Control TEXT, PlayersFrom TEXT, PlayersTo TEXT, PlayersSim TEXT, Comment TEXT, ReviewRating TEXT, V_Trainers TEXT, V_Length TEXT, V_LoadingScreen TEXT, V_HighScoreSaver TEXT, V_IncludedDocs TEXT, V_TrueDriveEmu TEXT, V_PalNTSC TEXT, MemoText TEXT)", []).unwrap();
        conn.execute("CREATE TABLE GameView (platformId TEXT DEFAULT 'c64', sourceGameId TEXT, id TEXT, name TEXT, filename TEXT, gameFilename TEXT, screenshotFilename TEXT, boxFrontFilename TEXT, titlescreenFilename TEXT, videoSnapFilename TEXT, sidFilename TEXT, crc TEXT, year TEXT, isPal INTEGER, isNtsc INTEGER, trueDriveEmu INTEGER, isClassic INTEGER, parentGenre TEXT, subGenre TEXT, developer_name TEXT, publisher_name TEXT, musician_name TEXT, languages TEXT)", []).unwrap();
        conn.execute(
            "CREATE TABLE Musicians (MU_Id TEXT, Photo TEXT, Nick TEXT, Grp TEXT, Musician TEXT)",
            [],
        )
        .unwrap();
        conn.execute("CREATE TABLE Programmers (PR_Id TEXT, Programmer TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Artists (AR_Id TEXT, Artist TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Developers (DE_Id TEXT, Developer TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Extras (GA_Id TEXT, Path TEXT)", [])
            .unwrap();

        conn.execute(
            "INSERT INTO Games (GA_Id, Name, Adult) VALUES (?, ?, ?)",
            ["1", "Zulu Game", "False"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO Games (GA_Id, Name, Adult) VALUES (?, ?, ?)",
            ["2", "Alpha Game", "False"],
        )
        .unwrap();

        conn.execute("INSERT INTO GameView (id, name, filename, parentGenre, subGenre, isPal, isNtsc, trueDriveEmu, isClassic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params!["1", "Zulu Game", "zulu.d64", "Action", "Arcade", 1, 0, 0, 0]).unwrap();
        conn.execute("INSERT INTO GameView (id, name, filename, parentGenre, subGenre, isPal, isNtsc, trueDriveEmu, isClassic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params!["2", "Alpha Game", "alpha.d64", "Action", "Arcade", 1, 0, 0, 0]).unwrap();
    }

    let games = get_db_games(Some(10), Some(0), None, None)
        .await
        .expect("ordered results should load");

    assert_eq!(
        games.iter().map(|game| game.id.clone()).collect::<Vec<_>>(),
        vec!["2".to_string(), "1".to_string()]
    );
}
