use crate::models::DatabaseImportResult;
use rusqlite::{params_from_iter, Connection, OptionalExtension};
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;

const QUERY_SUPPORT_INDEXES: &[(&str, &[&str], &str)] = &[
    (
        "Games",
        &["GA_Id"],
        "CREATE INDEX IF NOT EXISTS idx_games_ga_id ON Games(GA_Id)",
    ),
    (
        "Games",
        &["Name"],
        "CREATE INDEX IF NOT EXISTS idx_games_name_nocase ON Games(Name COLLATE NOCASE)",
    ),
    (
        "Games",
        &["YE_Id"],
        "CREATE INDEX IF NOT EXISTS idx_games_ye_id ON Games(YE_Id)",
    ),
    (
        "Games",
        &["GE_Id"],
        "CREATE INDEX IF NOT EXISTS idx_games_ge_id ON Games(GE_Id)",
    ),
    (
        "Games",
        &["DE_Id"],
        "CREATE INDEX IF NOT EXISTS idx_games_de_id ON Games(DE_Id)",
    ),
    (
        "Games",
        &["PU_Id"],
        "CREATE INDEX IF NOT EXISTS idx_games_pu_id ON Games(PU_Id)",
    ),
    (
        "Games",
        &["MU_Id"],
        "CREATE INDEX IF NOT EXISTS idx_games_mu_id ON Games(MU_Id)",
    ),
    (
        "Games",
        &["LA_Id"],
        "CREATE INDEX IF NOT EXISTS idx_games_la_id ON Games(LA_Id)",
    ),
    (
        "Games",
        &["PR_Id"],
        "CREATE INDEX IF NOT EXISTS idx_games_pr_id ON Games(PR_Id)",
    ),
    (
        "Games",
        &["AR_Id"],
        "CREATE INDEX IF NOT EXISTS idx_games_ar_id ON Games(AR_Id)",
    ),
    (
        "Games",
        &["Classic"],
        "CREATE INDEX IF NOT EXISTS idx_games_classic ON Games(Classic)",
    ),
    (
        "Games",
        &["Adult"],
        "CREATE INDEX IF NOT EXISTS idx_games_adult ON Games(Adult)",
    ),
    (
        "Years",
        &["YE_Id"],
        "CREATE INDEX IF NOT EXISTS idx_years_ye_id ON Years(YE_Id)",
    ),
    (
        "Genres",
        &["GE_Id"],
        "CREATE INDEX IF NOT EXISTS idx_genres_ge_id ON Genres(GE_Id)",
    ),
    (
        "Genres",
        &["PG_Id"],
        "CREATE INDEX IF NOT EXISTS idx_genres_pg_id ON Genres(PG_Id)",
    ),
    (
        "PGenres",
        &["PG_Id"],
        "CREATE INDEX IF NOT EXISTS idx_pgenres_pg_id ON PGenres(PG_Id)",
    ),
    (
        "Developers",
        &["DE_Id"],
        "CREATE INDEX IF NOT EXISTS idx_developers_de_id ON Developers(DE_Id)",
    ),
    (
        "Publishers",
        &["PU_Id"],
        "CREATE INDEX IF NOT EXISTS idx_publishers_pu_id ON Publishers(PU_Id)",
    ),
    (
        "Musicians",
        &["MU_Id"],
        "CREATE INDEX IF NOT EXISTS idx_musicians_mu_id ON Musicians(MU_Id)",
    ),
    (
        "Languages",
        &["LA_Id"],
        "CREATE INDEX IF NOT EXISTS idx_languages_la_id ON Languages(LA_Id)",
    ),
    (
        "Programmers",
        &["PR_Id"],
        "CREATE INDEX IF NOT EXISTS idx_programmers_pr_id ON Programmers(PR_Id)",
    ),
    (
        "Artists",
        &["AR_Id"],
        "CREATE INDEX IF NOT EXISTS idx_artists_ar_id ON Artists(AR_Id)",
    ),
    (
        "Extras",
        &["GA_Id"],
        "CREATE INDEX IF NOT EXISTS idx_extras_ga_id ON Extras(GA_Id)",
    ),
    (
        "Extras",
        &["GA_Id", "DisplayOrder"],
        "CREATE INDEX IF NOT EXISTS idx_extras_ga_id_display_order ON Extras(GA_Id, DisplayOrder)",
    ),
];

const PLATFORM_SCOPED_TABLES: &[(&str, &str)] = &[
    ("Games", "GA_Id"),
    ("Extras", "GA_Id"),
    ("Years", "YE_Id"),
    ("Genres", "GE_Id"),
    ("PGenres", "PG_Id"),
    ("Developers", "DE_Id"),
    ("Publishers", "PU_Id"),
    ("Musicians", "MU_Id"),
    ("Languages", "LA_Id"),
    ("Programmers", "PR_Id"),
    ("Artists", "AR_Id"),
];

const COVER_INDEX_POPULATE_SQL: &str = "
    INSERT OR REPLACE INTO GameCoverIndex (GA_Id, platform_id, cover_path)
    SELECT
        Extras.GA_Id,
        COALESCE(Extras.platform_id, Games.platform_id, 'c64') as platform_id,
        MIN(Extras.Path) as cover_path
    FROM Extras
    LEFT JOIN Games ON Extras.GA_Id = Games.GA_Id
        AND COALESCE(Extras.platform_id, 'c64') = COALESCE(Games.platform_id, 'c64')
    WHERE (
          LOWER(REPLACE(Path, '\\', '/')) LIKE 'cover/%'
          OR LOWER(REPLACE(Path, '\\', '/')) LIKE 'covers/%'
      )
      AND (
          LOWER(Path) LIKE '%.jpg'
          OR LOWER(Path) LIKE '%.jpeg'
          OR LOWER(Path) LIKE '%.png'
          OR LOWER(Path) LIKE '%.webp'
          OR LOWER(Path) LIKE '%.gif'
          OR LOWER(Path) LIKE '%.bmp'
      )
    GROUP BY Extras.GA_Id, COALESCE(Extras.platform_id, Games.platform_id, 'c64')
";

const FTS_INDEX_POPULATE_SQL: &str = "
    INSERT INTO GameSearchIndex (
        id,
        platform_id,
        source_game_id,
        name,
        developer_name,
        publisher_name,
        musician_name,
        coder_name,
        graphics_name
    )
    SELECT
        gv.id,
        gv.platformId,
        gv.sourceGameId,
        gv.name,
        COALESCE(gv.developer_name, ''),
        COALESCE(gv.publisher_name, ''),
        COALESCE(gv.musician_name, ''),
        COALESCE(pr.Programmer, ''),
        COALESCE(ar.Artist, '')
    FROM GameView gv
    JOIN Games g ON gv.id = g.GA_Id AND gv.platformId = g.platform_id
    LEFT JOIN Programmers pr ON g.PR_Id = pr.PR_Id AND pr.platform_id = g.platform_id
    LEFT JOIN Artists ar ON g.AR_Id = ar.AR_Id AND ar.platform_id = g.platform_id
";

const GAME_VIEW_SQL: &str = "
CREATE VIEW GameView AS
SELECT 
    g.platform_id as platformId,
    g.source_game_id as sourceGameId,
    g.GA_Id as id,
    g.Name as name,
    g.Filename as filename,
    CASE WHEN ifnull(g.FileToRun, '') != '' THEN g.FileToRun ELSE g.Filename END as gameFilename,
    g.ScrnshotFilename as screenshotFilename,
    NULL as boxFrontFilename,
    NULL as titlescreenFilename,
    NULL as videoSnapFilename,
    g.SidFilename as sidFilename,
    g.CRC as crc,
    y.Year as year,
    CASE WHEN g.V_PalNTSC = 'P' OR g.V_PalNTSC = 'B' THEN 1 ELSE 0 END as isPal,
    CASE WHEN g.V_PalNTSC = 'N' OR g.V_PalNTSC = 'B' THEN 1 ELSE 0 END as isNtsc,
    CASE WHEN g.V_TrueDriveEmu = '1' THEN 1 ELSE 0 END as trueDriveEmu,
    CASE WHEN g.Classic = 'True' THEN 1 ELSE 0 END as isClassic,
    ifnull(pg.ParentGenre, 'Unknown') as parentGenre,
    ifnull(ge.Genre, 'Unknown') as subGenre,
    de.Developer as developer_name,
    pu.Publisher as publisher_name,
    mu.Musician as musician_name,
    la.Language as languages
FROM Games g
LEFT JOIN Years y ON g.YE_Id = y.YE_Id AND y.platform_id = g.platform_id
LEFT JOIN Genres ge ON g.GE_Id = ge.GE_Id AND ge.platform_id = g.platform_id
LEFT JOIN PGenres pg ON ge.PG_Id = pg.PG_Id AND pg.platform_id = g.platform_id
LEFT JOIN Developers de ON g.DE_Id = de.DE_Id AND de.platform_id = g.platform_id
LEFT JOIN Publishers pu ON g.PU_Id = pu.PU_Id AND pu.platform_id = g.platform_id
LEFT JOIN Musicians mu ON g.MU_Id = mu.MU_Id AND mu.platform_id = g.platform_id
LEFT JOIN Languages la ON g.LA_Id = la.LA_Id AND la.platform_id = g.platform_id;
";

const EMBEDDED_MDB_EXPORT_SCRIPT: &str = r#"
param (
    [Parameter(Mandatory=$true)]
    [string]$DbPath,
    [Parameter(Mandatory=$true)]
    [string]$OutputDir
)

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

$connString = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=$DbPath;"
$conn = New-Object System.Data.OleDb.OleDbConnection($connString)

try {
    $conn.Open()
    $schema = $conn.GetSchema("Tables")
    $tables = $schema | Where-Object { $_.TABLE_TYPE -eq "TABLE" } | Select-Object -ExpandProperty TABLE_NAME

    foreach ($table in $tables) {
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT * FROM [$table]"
        $da = New-Object System.Data.OleDb.OleDbDataAdapter($cmd)
        $dt = New-Object System.Data.DataTable
        $da.Fill($dt) | Out-Null

        $outFile = Join-Path -Path $OutputDir -ChildPath "$table.csv"
        $dt | Export-Csv -Path $outFile -NoTypeInformation -Encoding UTF8
    }
} catch {
    Write-Error "Failed to export MDB tables. Install the Microsoft Access Database Engine if needed.`n$($_.Exception.Message)"
    exit 1
} finally {
    if ($conn.State -eq "Open") {
        $conn.Close()
    }
}
"#;

pub fn get_db_path() -> String {
    std::env::var("VIC40_DB_PATH").unwrap_or_else(|_| {
        if Path::new("../gb64.sqlite").exists() {
            "../gb64.sqlite".to_string()
        } else if Path::new("gb64.sqlite").exists() {
            "gb64.sqlite".to_string()
        } else {
            "../../gb64.sqlite".to_string()
        }
    })
}

pub fn normalize_platform_id(platform_id: Option<&str>) -> Result<String, String> {
    let platform_id = platform_id.unwrap_or("c64");
    match platform_id {
        "c64" | "atari800" | "atari2600" => Ok(platform_id.to_string()),
        _ => Err(format!("Unsupported platform: {platform_id}")),
    }
}

pub fn get_platform_db_scope(platform_id: Option<&str>) -> Result<String, String> {
    normalize_platform_id(platform_id)
}

pub fn get_platform_db_path(platform_id: Option<&str>) -> Result<String, String> {
    let _scope = normalize_platform_id(platform_id)?;
    Ok(get_db_path())
}

fn create_runtime_db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|error: tauri::Error| error.to_string())?;
    fs::create_dir_all(&app_data_dir).map_err(|error| error.to_string())?;
    Ok(app_data_dir.join("gb64.sqlite"))
}

pub fn configure_runtime_db_path(app: &tauri::AppHandle) -> Result<String, String> {
    if let Ok(existing) = std::env::var("VIC40_DB_PATH") {
        return Ok(existing);
    }

    if Path::new("../gb64.sqlite").exists()
        || Path::new("gb64.sqlite").exists()
        || Path::new("../../gb64.sqlite").exists()
    {
        return Ok(get_db_path());
    }

    let runtime_db_path = create_runtime_db_path(app)?;
    let runtime_db_path_string = runtime_db_path.to_string_lossy().to_string();
    std::env::set_var("VIC40_DB_PATH", &runtime_db_path_string);
    Ok(runtime_db_path_string)
}

fn table_exists(conn: &Connection, table_name: &str) -> Result<bool, String> {
    conn.query_row(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?1 LIMIT 1",
        [table_name],
        |_| Ok(()),
    )
    .optional()
    .map(|row| row.is_some())
    .map_err(|e| e.to_string())
}

fn sqlite_object_exists(
    conn: &Connection,
    object_name: &str,
    object_types: &[&str],
) -> Result<bool, String> {
    let placeholders = object_types
        .iter()
        .map(|_| "?")
        .collect::<Vec<_>>()
        .join(",");
    let query =
        format!("SELECT 1 FROM sqlite_master WHERE name = ? AND type IN ({placeholders}) LIMIT 1");

    let mut params = Vec::with_capacity(object_types.len() + 1);
    params.push(object_name.to_string());
    params.extend(object_types.iter().map(|value| (*value).to_string()));

    conn.query_row(&query, params_from_iter(params.iter()), |_| Ok(()))
        .optional()
        .map(|row| row.is_some())
        .map_err(|e| e.to_string())
}

fn table_has_columns(
    conn: &Connection,
    table_name: &str,
    required_columns: &[&str],
) -> Result<bool, String> {
    let columns = table_columns(conn, table_name)?;

    Ok(required_columns
        .iter()
        .all(|required| columns.iter().any(|column| column == required)))
}

fn table_columns(conn: &Connection, table_name: &str) -> Result<Vec<String>, String> {
    table_columns_in_schema(conn, "main", table_name)
}

fn table_columns_in_schema(
    conn: &Connection,
    schema_name: &str,
    table_name: &str,
) -> Result<Vec<String>, String> {
    let quoted_schema = quote_identifier(schema_name)?;
    let quoted_table = quote_identifier(table_name)?;
    let pragma = format!("PRAGMA {quoted_schema}.table_info({quoted_table})");
    let mut stmt = conn.prepare(&pragma).map_err(|e| e.to_string())?;
    let columns = stmt
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(columns)
}

fn ensure_secure_table_on_connection(conn: &Connection) -> Result<(), String> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS SecureSettings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn ensure_table_platform_columns(
    conn: &Connection,
    table_name: &str,
    source_id_column: &str,
    platform_id: &str,
) -> Result<(), String> {
    if !table_exists(conn, table_name)? {
        return Ok(());
    }

    let quoted_table_name = quote_identifier(table_name)?;
    if !table_has_columns(conn, table_name, &["platform_id"])? {
        let sql = format!("ALTER TABLE {quoted_table_name} ADD COLUMN platform_id TEXT");
        conn.execute(&sql, []).map_err(|e| e.to_string())?;
    }
    if !table_has_columns(conn, table_name, &["source_game_id"])? {
        let sql = format!("ALTER TABLE {quoted_table_name} ADD COLUMN source_game_id TEXT");
        conn.execute(&sql, []).map_err(|e| e.to_string())?;
    }

    let platform_sql = format!(
        "UPDATE {quoted_table_name} SET platform_id = ?1 WHERE platform_id IS NULL OR platform_id = ''"
    );
    conn.execute(&platform_sql, [platform_id])
        .map_err(|e| e.to_string())?;

    if table_has_columns(conn, table_name, &[source_id_column])? {
        let quoted_source_id_column = quote_identifier(source_id_column)?;
        let source_sql = format!(
            "UPDATE {quoted_table_name} SET source_game_id = {quoted_source_id_column} WHERE source_game_id IS NULL OR source_game_id = ''"
        );
        conn.execute(&source_sql, []).map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn infer_legacy_platform_id(
    conn: &Connection,
    fallback_platform_id: &str,
) -> Result<String, String> {
    if !table_exists(conn, "Games")? || !table_has_columns(conn, "Games", &["platform_id"])? {
        return Ok(fallback_platform_id.to_string());
    }

    conn.query_row(
        "SELECT platform_id FROM Games WHERE platform_id IS NOT NULL AND platform_id != '' GROUP BY platform_id HAVING COUNT(*) > 0 LIMIT 1",
        [],
        |row| row.get::<_, String>(0),
    )
    .optional()
    .map(|value| value.unwrap_or_else(|| fallback_platform_id.to_string()))
    .map_err(|error| error.to_string())
}

fn ensure_import_platform_columns(conn: &Connection, platform_id: &str) -> Result<(), String> {
    for (table_name, source_id_column) in PLATFORM_SCOPED_TABLES {
        ensure_table_platform_columns(conn, table_name, source_id_column, platform_id)?;
    }

    Ok(())
}

fn recreate_game_view(conn: &Connection) -> Result<(), String> {
    conn.execute_batch("DROP VIEW IF EXISTS GameView")
        .map_err(|e| e.to_string())?;
    conn.execute_batch(GAME_VIEW_SQL)
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn ensure_game_view(conn: &Connection) -> Result<(), String> {
    if sqlite_object_exists(conn, "GameView", &["table"])?
        && !table_has_columns(conn, "GameView", &["platformId", "sourceGameId"])?
    {
        if !table_has_columns(conn, "GameView", &["platformId"])? {
            conn.execute(
                "ALTER TABLE GameView ADD COLUMN platformId TEXT DEFAULT 'c64'",
                [],
            )
            .map_err(|e| e.to_string())?;
        }
        if !table_has_columns(conn, "GameView", &["sourceGameId"])? {
            conn.execute("ALTER TABLE GameView ADD COLUMN sourceGameId TEXT", [])
                .map_err(|e| e.to_string())?;
        }
        if table_has_columns(conn, "GameView", &["id"])? {
            conn.execute(
                "UPDATE GameView SET sourceGameId = id WHERE sourceGameId IS NULL OR sourceGameId = ''",
                [],
            )
            .map_err(|e| e.to_string())?;
        }
        return Ok(());
    }

    if !sqlite_object_exists(conn, "GameView", &["view"])? {
        return Ok(());
    }

    if table_has_columns(conn, "GameView", &["platformId", "sourceGameId"])? {
        return Ok(());
    }

    if !table_has_columns(
        conn,
        "Games",
        &[
            "platform_id",
            "source_game_id",
            "GA_Id",
            "Name",
            "Filename",
            "FileToRun",
            "ScrnshotFilename",
            "SidFilename",
            "CRC",
        ],
    )? {
        return Ok(());
    }

    recreate_game_view(conn)
}

fn ensure_query_indexes(conn: &Connection) -> Result<(), String> {
    for (table_name, required_columns, index_sql) in QUERY_SUPPORT_INDEXES {
        if table_exists(conn, table_name)? && table_has_columns(conn, table_name, required_columns)?
        {
            conn.execute(index_sql, []).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

fn ensure_cover_index(conn: &Connection) -> Result<(), String> {
    if table_exists(conn, "GameCoverIndex")?
        && !table_has_columns(conn, "GameCoverIndex", &["platform_id"])?
    {
        conn.execute_batch("DROP TABLE IF EXISTS GameCoverIndex")
            .map_err(|e| e.to_string())?;
    }

    conn.execute(
        "CREATE TABLE IF NOT EXISTS GameCoverIndex (
            GA_Id TEXT NOT NULL,
            platform_id TEXT NOT NULL DEFAULT 'c64',
            cover_path TEXT NOT NULL,
            PRIMARY KEY (platform_id, GA_Id)
        )",
        [],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_game_cover_index_platform_ga_id ON GameCoverIndex(platform_id, GA_Id)",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM GameCoverIndex", [])
        .map_err(|e| e.to_string())?;

    if !table_exists(conn, "Extras")? {
        return Ok(());
    }

    conn.execute(COVER_INDEX_POPULATE_SQL, [])
        .map_err(|e| e.to_string())?;

    Ok(())
}

fn rebuild_cover_index(conn: &Connection) -> Result<(), String> {
    conn.execute_batch("DROP TABLE IF EXISTS GameCoverIndex")
        .map_err(|e| e.to_string())?;
    ensure_cover_index(conn)
}

fn ensure_search_index(conn: &Connection) -> Result<(), String> {
    let can_build_search_index = sqlite_object_exists(conn, "GameView", &["view", "table"])?
        && table_has_columns(
            conn,
            "GameView",
            &[
                "platformId",
                "sourceGameId",
                "id",
                "name",
                "developer_name",
                "publisher_name",
                "musician_name",
            ],
        )?
        && table_exists(conn, "Games")?
        && table_has_columns(conn, "Games", &["platform_id", "GA_Id"])?;

    if !can_build_search_index {
        return Ok(());
    }

    if table_exists(conn, "GameSearchIndex")?
        && !table_has_columns(conn, "GameSearchIndex", &["platform_id", "source_game_id"])?
    {
        conn.execute_batch("DROP TABLE IF EXISTS GameSearchIndex")
            .map_err(|e| e.to_string())?;
    }

    conn.execute_batch(
        "
        CREATE VIRTUAL TABLE IF NOT EXISTS GameSearchIndex USING fts5(
            id UNINDEXED,
            platform_id UNINDEXED,
            source_game_id UNINDEXED,
            name,
            developer_name,
            publisher_name,
            musician_name,
            coder_name,
            graphics_name,
            tokenize='porter unicode61 remove_diacritics 2',
            prefix='2,3'
        );
        ",
    )
    .map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM GameSearchIndex", [])
        .map_err(|e| e.to_string())?;
    conn.execute(FTS_INDEX_POPULATE_SQL, [])
        .map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO GameSearchIndex(GameSearchIndex) VALUES('optimize')",
        [],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

fn rebuild_search_index(conn: &Connection) -> Result<(), String> {
    conn.execute_batch("DROP TABLE IF EXISTS GameSearchIndex")
        .map_err(|e| e.to_string())?;
    ensure_search_index(conn)
}

pub fn ensure_query_support_objects(conn: &Connection) -> Result<(), String> {
    let legacy_platform_id = infer_legacy_platform_id(conn, "c64")?;
    ensure_import_platform_columns(conn, &legacy_platform_id)?;
    ensure_game_view(conn)?;
    ensure_query_indexes(conn)?;
    ensure_cover_index(conn)?;
    ensure_search_index(conn)?;
    Ok(())
}

pub fn init_database() -> Result<(), String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    ensure_query_support_objects(&conn)?;
    ensure_secure_table_on_connection(&conn)?;
    Ok(())
}

pub fn is_database_ready() -> Result<bool, String> {
    let db_path = get_db_path();
    if !Path::new(&db_path).exists() {
        return Ok(false);
    }

    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    let has_games = table_exists(&conn, "Games")?;
    let has_view = sqlite_object_exists(&conn, "GameView", &["view"])?;

    if has_games && has_view {
        ensure_query_support_objects(&conn)?;
        ensure_secure_table_on_connection(&conn)?;
        Ok(true)
    } else {
        Ok(false)
    }
}

fn validate_identifier(identifier: &str) -> Result<(), String> {
    if identifier.is_empty()
        || !identifier
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || character == '_')
    {
        return Err(format!("Unsupported identifier: {identifier}"));
    }

    Ok(())
}

fn quote_identifier(identifier: &str) -> Result<String, String> {
    validate_identifier(identifier)?;
    Ok(format!("\"{identifier}\""))
}

fn list_csv_files(export_dir: &Path) -> Result<Vec<PathBuf>, String> {
    let mut files = fs::read_dir(export_dir)
        .map_err(|error| error.to_string())?
        .filter_map(|entry| entry.ok().map(|value| value.path()))
        .filter(|path| path.extension().and_then(|extension| extension.to_str()) == Some("csv"))
        .collect::<Vec<_>>();
    files.sort();
    Ok(files)
}

fn import_single_csv_table(conn: &mut Connection, csv_path: &Path) -> Result<bool, String> {
    let table_name = csv_path
        .file_stem()
        .and_then(|value| value.to_str())
        .ok_or_else(|| format!("Invalid CSV filename: {}", csv_path.display()))?;
    let quoted_table_name = quote_identifier(table_name)?;
    let file =
        fs::File::open(csv_path).map_err(|error| format!("{}: {error}", csv_path.display()))?;
    let mut reader = BufReader::new(file);
    let Some(header_line) = read_csv_record(&mut reader, csv_path)? else {
        return Ok(false);
    };

    let header_values = parse_csv_line(&header_line)
        .into_iter()
        .map(|value| value.trim().trim_start_matches('\u{feff}').to_string())
        .filter(|value| !value.is_empty())
        .collect::<Vec<_>>();

    if header_values.is_empty() {
        return Ok(false);
    }

    for header in &header_values {
        validate_identifier(header)?;
    }

    let drop_sql = format!("DROP TABLE IF EXISTS {quoted_table_name}");
    conn.execute(&drop_sql, [])
        .map_err(|error| error.to_string())?;

    let column_definitions = header_values
        .iter()
        .map(|header| quote_identifier(header).map(|quoted| format!("{quoted} TEXT")))
        .collect::<Result<Vec<_>, _>>()?
        .join(", ");
    let create_sql = format!("CREATE TABLE {quoted_table_name} ({column_definitions})");
    conn.execute(&create_sql, [])
        .map_err(|error| error.to_string())?;

    let quoted_columns = header_values
        .iter()
        .map(|header| quote_identifier(header))
        .collect::<Result<Vec<_>, _>>()?;
    let placeholders = (0..quoted_columns.len())
        .map(|_| "?")
        .collect::<Vec<_>>()
        .join(", ");
    let insert_sql = format!(
        "INSERT INTO {quoted_table_name} ({}) VALUES ({placeholders})",
        quoted_columns.join(", ")
    );

    let transaction = conn.transaction().map_err(|error| error.to_string())?;
    let mut statement = transaction
        .prepare(&insert_sql)
        .map_err(|error| error.to_string())?;
    let mut imported_any_rows = false;

    loop {
        let Some(record) = read_csv_record(&mut reader, csv_path)? else {
            break;
        };

        let values = normalize_record_values(parse_csv_line(&record), header_values.len());
        statement
            .execute(params_from_iter(values.iter()))
            .map_err(|error| error.to_string())?;
        imported_any_rows = true;
    }

    drop(statement);
    transaction.commit().map_err(|error| error.to_string())?;
    Ok(imported_any_rows)
}

fn normalize_record_values(record: Vec<String>, width: usize) -> Vec<String> {
    (0..width)
        .map(|index| record.get(index).cloned().unwrap_or_default())
        .collect()
}

fn read_csv_record<R: BufRead>(
    reader: &mut R,
    source_path: &Path,
) -> Result<Option<String>, String> {
    let mut record = String::new();

    loop {
        let mut line = String::new();
        let bytes_read = reader
            .read_line(&mut line)
            .map_err(|error| format!("{}: {error}", source_path.display()))?;

        if bytes_read == 0 {
            if record.is_empty() {
                return Ok(None);
            }

            return Ok(Some(record));
        }

        record.push_str(&line);

        if !csv_record_has_unclosed_quotes(&record) {
            return Ok(Some(record));
        }
    }
}

fn csv_record_has_unclosed_quotes(record: &str) -> bool {
    let mut in_quotes = false;
    let characters: Vec<char> = record.chars().collect();
    let mut index = 0usize;

    while index < characters.len() {
        if characters[index] == '"' {
            if characters.get(index + 1) == Some(&'"') {
                index += 1;
            } else {
                in_quotes = !in_quotes;
            }
        }

        index += 1;
    }

    in_quotes
}

fn parse_csv_line(line: &str) -> Vec<String> {
    let mut values = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;
    let characters: Vec<char> = line.trim_end_matches(['\r', '\n']).chars().collect();
    let mut index = 0usize;

    while index < characters.len() {
        let character = characters[index];

        if in_quotes {
            if character == '"' {
                if characters.get(index + 1) == Some(&'"') {
                    current.push('"');
                    index += 1;
                } else {
                    in_quotes = false;
                }
            } else {
                current.push(character);
            }
        } else if character == '"' {
            in_quotes = true;
        } else if character == ',' {
            values.push(current.clone());
            current.clear();
        } else {
            current.push(character);
        }

        index += 1;
    }

    values.push(current);
    values
}

fn create_export_directory() -> Result<PathBuf, String> {
    let db_path = PathBuf::from(get_db_path());
    let parent_dir = db_path
        .parent()
        .map(Path::to_path_buf)
        .unwrap_or_else(|| PathBuf::from("."));
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_millis();
    let export_dir = parent_dir.join(format!("gb64_import_{timestamp}"));
    fs::create_dir_all(&export_dir).map_err(|error| error.to_string())?;
    Ok(export_dir)
}

fn write_embedded_export_script(export_dir: &Path) -> Result<PathBuf, String> {
    let script_path = export_dir.join("export_gb64.ps1");
    fs::write(&script_path, EMBEDDED_MDB_EXPORT_SCRIPT).map_err(|error| error.to_string())?;
    Ok(script_path)
}

fn powershell_32_path() -> PathBuf {
    std::env::var_os("SystemRoot")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from(r"C:\Windows"))
        .join("SysWOW64")
        .join("WindowsPowerShell")
        .join("v1.0")
        .join("powershell.exe")
}

fn export_mdb_to_csv(mdb_path: &Path, export_dir: &Path) -> Result<usize, String> {
    if !cfg!(target_os = "windows") {
        return Err("MDB import is only supported on Windows builds.".to_string());
    }

    let script_path = write_embedded_export_script(export_dir)?;
    let powershell_path = powershell_32_path();

    if !powershell_path.exists() {
        return Err(format!(
            "32-bit PowerShell was not found at {}",
            powershell_path.display()
        ));
    }

    let output = Command::new(&powershell_path)
        .arg("-ExecutionPolicy")
        .arg("Bypass")
        .arg("-File")
        .arg(&script_path)
        .arg("-DbPath")
        .arg(mdb_path)
        .arg("-OutputDir")
        .arg(export_dir)
        .output()
        .map_err(|error| error.to_string())?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        return Err(format!(
            "MDB export failed. Ensure the Microsoft Access Database Engine is installed.\n{}\n{}",
            stderr.trim(),
            stdout.trim()
        ));
    }

    list_csv_files(export_dir).map(|files| files.len())
}

fn sqlite_sidecar_paths(path: &Path) -> Vec<PathBuf> {
    let base = path.to_string_lossy();
    vec![
        PathBuf::from(base.as_ref()),
        PathBuf::from(format!("{base}-wal")),
        PathBuf::from(format!("{base}-shm")),
    ]
}

fn remove_sqlite_artifacts(path: &Path) -> Result<(), String> {
    for artifact in sqlite_sidecar_paths(path) {
        if artifact.exists() {
            fs::remove_file(&artifact).map_err(|error| error.to_string())?;
        }
    }

    Ok(())
}

fn create_import_temp_db_path(db_path: &Path) -> Result<PathBuf, String> {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_millis();
    let file_name = db_path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("gb64.sqlite");
    Ok(db_path.with_file_name(format!("{file_name}.importing.{timestamp}")))
}

fn table_exists_in_schema(
    conn: &Connection,
    schema_name: &str,
    table_name: &str,
) -> Result<bool, String> {
    validate_identifier(schema_name)?;
    conn.query_row(
        &format!(
            "SELECT 1 FROM {schema_name}.sqlite_master WHERE type = 'table' AND name = ?1 LIMIT 1"
        ),
        [table_name],
        |_| Ok(()),
    )
    .optional()
    .map(|row| row.is_some())
    .map_err(|error| error.to_string())
}

fn importable_table_names(conn: &Connection, schema_name: &str) -> Result<Vec<String>, String> {
    validate_identifier(schema_name)?;
    let sql = format!(
        "SELECT name FROM {schema_name}.sqlite_master
         WHERE type = 'table'
           AND name NOT LIKE 'sqlite_%'
           AND name != 'SecureSettings'
           AND name != 'PlatformLibraries'
           AND name != 'GameCoverIndex'
           AND name NOT LIKE 'GameSearchIndex%'
         ORDER BY name"
    );
    let mut stmt = conn.prepare(&sql).map_err(|error| error.to_string())?;
    let table_names = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|error| error.to_string())?
        .map(|table_name| {
            let table_name = table_name.map_err(|error| error.to_string())?;
            validate_identifier(&table_name)?;
            Ok(table_name)
        })
        .collect::<Result<Vec<_>, String>>()?;
    Ok(table_names)
}

fn ensure_schema_table_platform_column(
    conn: &Connection,
    schema_name: &str,
    table_name: &str,
    platform_id: &str,
) -> Result<(), String> {
    let columns = table_columns_in_schema(conn, schema_name, table_name)?;
    let quoted_schema = quote_identifier(schema_name)?;
    let quoted_table = quote_identifier(table_name)?;
    let qualified_table = format!("{quoted_schema}.{quoted_table}");

    if !columns.iter().any(|column| column == "platform_id") {
        conn.execute(
            &format!("ALTER TABLE {qualified_table} ADD COLUMN platform_id TEXT"),
            [],
        )
        .map_err(|error| error.to_string())?;
    }

    conn.execute(
        &format!(
            "UPDATE {qualified_table} SET platform_id = ?1 WHERE platform_id IS NULL OR platform_id = ''"
        ),
        [platform_id],
    )
    .map_err(|error| error.to_string())?;

    Ok(())
}

fn ensure_imported_table_columns(
    conn: &Connection,
    schema_name: &str,
    table_name: &str,
    platform_id: &str,
) -> Result<(), String> {
    if let Some((_, source_id_column)) = PLATFORM_SCOPED_TABLES
        .iter()
        .find(|(scoped_table, _)| *scoped_table == table_name)
    {
        if schema_name == "main" {
            ensure_table_platform_columns(conn, table_name, source_id_column, platform_id)?;
        } else {
            ensure_schema_table_platform_column(conn, schema_name, table_name, platform_id)?;
            let columns = table_columns_in_schema(conn, schema_name, table_name)?;
            let quoted_schema = quote_identifier(schema_name)?;
            let quoted_table = quote_identifier(table_name)?;
            let qualified_table = format!("{quoted_schema}.{quoted_table}");

            if !columns.iter().any(|column| column == "source_game_id") {
                conn.execute(
                    &format!("ALTER TABLE {qualified_table} ADD COLUMN source_game_id TEXT"),
                    [],
                )
                .map_err(|error| error.to_string())?;
            }

            if columns.iter().any(|column| column == source_id_column) {
                let quoted_source_id_column = quote_identifier(source_id_column)?;
                conn.execute(
                    &format!(
                        "UPDATE {qualified_table} SET source_game_id = {quoted_source_id_column} WHERE source_game_id IS NULL OR source_game_id = ''"
                    ),
                    [],
                )
                .map_err(|error| error.to_string())?;
            }
        }
    } else {
        ensure_schema_table_platform_column(conn, schema_name, table_name, platform_id)?;
    }

    Ok(())
}

fn ensure_live_table_matches_import(
    conn: &Connection,
    table_name: &str,
    legacy_platform_id: &str,
) -> Result<(), String> {
    let quoted_table = quote_identifier(table_name)?;
    if !table_exists_in_schema(conn, "main", table_name)? {
        conn.execute(
            &format!(
                "CREATE TABLE {quoted_table} AS SELECT * FROM imported.{quoted_table} WHERE 0"
            ),
            [],
        )
        .map_err(|error| error.to_string())?;
    }

    ensure_imported_table_columns(conn, "main", table_name, legacy_platform_id)?;

    let live_columns = table_columns_in_schema(conn, "main", table_name)?;
    let imported_columns = table_columns_in_schema(conn, "imported", table_name)?;
    for column in imported_columns {
        if !live_columns
            .iter()
            .any(|live_column| live_column == &column)
        {
            let quoted_column = quote_identifier(&column)?;
            conn.execute(
                &format!("ALTER TABLE {quoted_table} ADD COLUMN {quoted_column} TEXT"),
                [],
            )
            .map_err(|error| error.to_string())?;
        }
    }

    Ok(())
}

fn merge_imported_table(
    conn: &Connection,
    table_name: &str,
    platform_id: &str,
) -> Result<(), String> {
    let quoted_table = quote_identifier(table_name)?;
    let live_columns = table_columns_in_schema(conn, "main", table_name)?;
    let imported_columns = table_columns_in_schema(conn, "imported", table_name)?;

    conn.execute(
        &format!("DELETE FROM {quoted_table} WHERE platform_id = ?1"),
        [platform_id],
    )
    .map_err(|error| error.to_string())?;

    let insert_columns = live_columns
        .iter()
        .map(|column| quote_identifier(column))
        .collect::<Result<Vec<_>, _>>()?;
    let select_columns = live_columns
        .iter()
        .map(|column| {
            let quoted_column = quote_identifier(column)?;
            if imported_columns.iter().any(|imported| imported == column) {
                Ok(quoted_column)
            } else {
                Ok(format!("NULL AS {quoted_column}"))
            }
        })
        .collect::<Result<Vec<_>, String>>()?;

    conn.execute(
        &format!(
            "INSERT INTO {quoted_table} ({}) SELECT {} FROM imported.{quoted_table}",
            insert_columns.join(", "),
            select_columns.join(", ")
        ),
        [],
    )
    .map_err(|error| error.to_string())?;

    Ok(())
}

fn platform_display_name(platform_id: &str) -> &str {
    match platform_id {
        "c64" => "Commodore 64",
        "atari800" => "Atari 800",
        "atari2600" => "Atari 2600",
        _ => platform_id,
    }
}

fn refresh_platform_libraries(conn: &Connection) -> Result<(), String> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS PlatformLibraries (
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
    .map_err(|error| error.to_string())?;

    if !table_exists(conn, "Games")? || !table_has_columns(conn, "Games", &["platform_id"])? {
        return Ok(());
    }

    let platform_counts = conn
        .prepare("SELECT platform_id, COUNT(*) FROM Games GROUP BY platform_id")
        .map_err(|error| error.to_string())?
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        })
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())?;

    for (platform_id, game_count) in platform_counts {
        conn.execute(
            "INSERT INTO PlatformLibraries (
                platform_id,
                display_name,
                import_status,
                source_mdb_path,
                game_count,
                last_import_error,
                last_imported_at
            )
            VALUES (?1, ?2, 'imported', NULL, ?3, NULL, datetime('now'))
            ON CONFLICT(platform_id) DO UPDATE SET
                display_name = excluded.display_name,
                import_status = excluded.import_status,
                game_count = excluded.game_count,
                last_import_error = excluded.last_import_error,
                last_imported_at = excluded.last_imported_at",
            rusqlite::params![
                &platform_id,
                platform_display_name(&platform_id),
                game_count
            ],
        )
        .map_err(|error| error.to_string())?;
    }

    Ok(())
}

fn merge_imported_database(
    temp_db_path: &Path,
    live_db_path: &Path,
    platform_id: &str,
) -> Result<(), String> {
    let conn = Connection::open(live_db_path).map_err(|error| error.to_string())?;
    conn.execute_batch("PRAGMA journal_mode = WAL;")
        .map_err(|error| error.to_string())?;
    conn.execute(
        "ATTACH DATABASE ?1 AS imported",
        [temp_db_path.to_string_lossy().as_ref()],
    )
    .map_err(|error| error.to_string())?;

    let merge_result = (|| -> Result<(), String> {
        let legacy_platform_id = infer_legacy_platform_id(&conn, platform_id)?;
        let table_names = importable_table_names(&conn, "imported")?;
        conn.execute_batch("BEGIN IMMEDIATE")
            .map_err(|error| error.to_string())?;

        for table_name in &table_names {
            ensure_imported_table_columns(&conn, "imported", table_name, platform_id)?;
            ensure_live_table_matches_import(&conn, table_name, &legacy_platform_id)?;
            merge_imported_table(&conn, table_name, platform_id)?;
        }

        recreate_game_view(&conn)?;
        ensure_query_indexes(&conn)?;
        rebuild_cover_index(&conn)?;
        rebuild_search_index(&conn)?;
        ensure_secure_table_on_connection(&conn)?;
        refresh_platform_libraries(&conn)?;

        conn.execute_batch("COMMIT")
            .map_err(|error| error.to_string())?;
        Ok(())
    })();

    if merge_result.is_err() {
        let _ = conn.execute_batch("ROLLBACK");
    }
    conn.execute("DETACH DATABASE imported", [])
        .map_err(|error| error.to_string())?;
    merge_result
}

fn import_csv_directory_to_sqlite(export_dir: &Path, platform_id: &str) -> Result<usize, String> {
    let platform_id = normalize_platform_id(Some(platform_id))?;
    let live_db_path = PathBuf::from(get_db_path());
    let temp_db_path = create_import_temp_db_path(&live_db_path)?;
    remove_sqlite_artifacts(&temp_db_path)?;

    let mut conn = Connection::open(&temp_db_path).map_err(|error| error.to_string())?;
    conn.execute_batch("PRAGMA journal_mode = WAL;")
        .map_err(|error| error.to_string())?;

    let import_result = (|| -> Result<usize, String> {
        let csv_files = list_csv_files(export_dir)?;
        if csv_files.is_empty() {
            return Err("No CSV files were exported from the MDB.".to_string());
        }

        let mut imported_tables = 0usize;
        for csv_file in csv_files {
            if import_single_csv_table(&mut conn, &csv_file)? {
                imported_tables += 1;
            }
        }

        ensure_import_platform_columns(&conn, &platform_id)?;
        recreate_game_view(&conn)?;
        ensure_query_indexes(&conn)?;
        rebuild_cover_index(&conn)?;
        rebuild_search_index(&conn)?;
        ensure_secure_table_on_connection(&conn)?;

        Ok(imported_tables)
    })();

    drop(conn);
    let imported_tables = match import_result {
        Ok(imported_tables) => imported_tables,
        Err(error) => {
            let _ = remove_sqlite_artifacts(&temp_db_path);
            return Err(error);
        }
    };

    merge_imported_database(&temp_db_path, &live_db_path, &platform_id)?;
    remove_sqlite_artifacts(&temp_db_path)?;

    Ok(imported_tables)
}

fn cleanup_export_directory(export_dir: &Path) {
    let _ = fs::remove_dir_all(export_dir);
}

pub fn import_mdb_to_sqlite(mdb_path: &str) -> Result<DatabaseImportResult, String> {
    import_mdb_to_sqlite_for_platform(mdb_path, "c64")
}

pub fn import_mdb_to_sqlite_for_platform(
    mdb_path: &str,
    platform_id: &str,
) -> Result<DatabaseImportResult, String> {
    let platform_id = normalize_platform_id(Some(platform_id))?;
    let mdb_path = PathBuf::from(mdb_path);
    if !mdb_path.exists() {
        return Err(format!("MDB file was not found: {}", mdb_path.display()));
    }

    let extension = mdb_path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();
    if extension != "mdb" {
        return Err("Selected file must be a .mdb database.".to_string());
    }

    let export_dir = create_export_directory()?;
    let export_result = export_mdb_to_csv(&mdb_path, &export_dir);
    let import_result = export_result.and_then(|exported_tables| {
        import_csv_directory_to_sqlite(&export_dir, &platform_id)
            .map(|imported_tables| (exported_tables, imported_tables))
    });
    cleanup_export_directory(&export_dir);

    let (exported_tables, imported_tables) = import_result?;
    Ok(DatabaseImportResult {
        db_path: get_db_path(),
        exported_tables,
        imported_tables,
    })
}

pub fn init_secure_table() -> Result<(), String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    ensure_secure_table_on_connection(&conn)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_helpers::DbEnvGuard;
    use tempfile::{tempdir, NamedTempFile};

    #[test]
    fn test_init_secure_table() {
        let temp_db = NamedTempFile::new().unwrap();
        let db_path = temp_db.path().to_string_lossy().to_string();
        let _env = DbEnvGuard::set(&db_path);

        init_secure_table().expect("Failed to init table");

        let conn = Connection::open(&db_path).unwrap();
        let mut stmt = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='SecureSettings'")
            .unwrap();
        let exists: bool = stmt.exists([]).unwrap();
        assert!(exists);
    }

    #[test]
    fn test_get_db_path_prefers_environment_variable() {
        let _env = DbEnvGuard::set("custom.sqlite");
        assert_eq!(get_db_path(), "custom.sqlite");
    }

    #[test]
    fn test_platform_db_helpers_default_to_c64_and_validate_platforms() {
        let _env = DbEnvGuard::set("custom.sqlite");

        assert_eq!(get_platform_db_scope(None).unwrap(), "c64");
        assert_eq!(get_platform_db_scope(Some("atari800")).unwrap(), "atari800");
        assert_eq!(get_platform_db_path(Some("c64")).unwrap(), "custom.sqlite");
        assert!(get_platform_db_scope(Some("amiga")).is_err());
    }

    #[test]
    fn test_get_db_path_falls_back_to_local_files() {
        let _guard = crate::test_helpers::DB_ENV_MUTEX
            .lock()
            .unwrap_or_else(|e| e.into_inner());
        // Ensure VIC40_DB_PATH is unset so we exercise the fallback logic
        let saved = std::env::var("VIC40_DB_PATH").ok();
        std::env::remove_var("VIC40_DB_PATH");

        let temp_dir = tempdir().unwrap();
        let original_dir = std::env::current_dir().unwrap();
        let child_dir = temp_dir.path().join("workspace");
        std::fs::create_dir_all(&child_dir).unwrap();
        std::env::set_current_dir(&child_dir).unwrap();

        std::fs::write("gb64.sqlite", b"db").unwrap();
        assert_eq!(get_db_path(), "gb64.sqlite");

        std::fs::remove_file("gb64.sqlite").unwrap();
        std::fs::write("../gb64.sqlite", b"db").unwrap();
        assert_eq!(get_db_path(), "../gb64.sqlite");

        std::env::set_current_dir(original_dir).unwrap();
        if let Some(v) = saved {
            std::env::set_var("VIC40_DB_PATH", v);
        }
    }

    #[test]
    fn test_init_database_creates_cover_index_and_query_indexes() {
        let temp_db = NamedTempFile::new().unwrap();
        let db_path = temp_db.path().to_string_lossy().to_string();
        let _env = DbEnvGuard::set(&db_path);

        let conn = Connection::open(&db_path).unwrap();
        conn.execute("CREATE TABLE Games (GA_Id TEXT, Name TEXT, GE_Id TEXT, PR_Id TEXT, AR_Id TEXT, MU_Id TEXT, DE_Id TEXT, PU_Id TEXT, LA_Id TEXT, YE_Id TEXT, Classic TEXT, Adult TEXT, platform_id TEXT, source_game_id TEXT)", []).unwrap();
        conn.execute(
            "CREATE TABLE GameView (id TEXT, platformId TEXT, sourceGameId TEXT, name TEXT, developer_name TEXT, publisher_name TEXT, musician_name TEXT)",
            [],
        )
        .unwrap();
        conn.execute("CREATE TABLE Programmers (PR_Id TEXT, Programmer TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Artists (AR_Id TEXT, Artist TEXT)", [])
            .unwrap();
        conn.execute(
            "CREATE TABLE Extras (GA_Id TEXT, Path TEXT, DisplayOrder TEXT, platform_id TEXT, source_game_id TEXT)",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO Extras (GA_Id, Path, DisplayOrder, platform_id, source_game_id) VALUES (?1, ?2, ?3, ?4, ?5)",
            ["1", "Covers/Test Cover.png", "1", "atari800", "1"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO Programmers (PR_Id, Programmer) VALUES (?1, ?2)",
            ["pr1", "Chris Yates"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO Artists (AR_Id, Artist) VALUES (?1, ?2)",
            ["ar1", "Ejber Ozkan"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO Games (GA_Id, Name, PR_Id, AR_Id, platform_id, source_game_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            ["1", "Tiger Heli", "pr1", "ar1", "atari800", "1"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO GameView (id, platformId, sourceGameId, name, developer_name, publisher_name, musician_name) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            ["1", "atari800", "1", "Tiger Heli", "SEUCK", "", ""],
        )
        .unwrap();
        drop(conn);

        init_database().expect("init_database should succeed");

        let conn = Connection::open(&db_path).unwrap();
        let cover: String = conn
            .query_row(
                "SELECT cover_path FROM GameCoverIndex WHERE platform_id = ?1 AND GA_Id = ?2",
                ["atari800", "1"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(cover, "Covers/Test Cover.png");

        let games_indexes: Vec<String> = conn
            .prepare("PRAGMA index_list('Games')")
            .unwrap()
            .query_map([], |row| row.get(1))
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .unwrap();
        assert!(games_indexes.contains(&"idx_games_ga_id".to_string()));
        assert!(games_indexes.contains(&"idx_games_name_nocase".to_string()));

        let search_hit: String = conn
            .query_row(
                "SELECT id FROM GameSearchIndex WHERE GameSearchIndex MATCH ?1 LIMIT 1",
                ["ejber*"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(search_hit, "1");
    }

    #[test]
    fn test_init_database_refreshes_stale_support_indexes() {
        let temp_db = NamedTempFile::new().unwrap();
        let db_path = temp_db.path().to_string_lossy().to_string();
        let _env = DbEnvGuard::set(&db_path);

        let conn = Connection::open(&db_path).unwrap();
        conn.execute("CREATE TABLE Games (GA_Id TEXT, Name TEXT, GE_Id TEXT, PR_Id TEXT, AR_Id TEXT, MU_Id TEXT, DE_Id TEXT, PU_Id TEXT, LA_Id TEXT, YE_Id TEXT, Classic TEXT, Adult TEXT, platform_id TEXT, source_game_id TEXT)", []).unwrap();
        conn.execute(
            "CREATE TABLE GameView (id TEXT, platformId TEXT, sourceGameId TEXT, name TEXT, developer_name TEXT, publisher_name TEXT, musician_name TEXT)",
            [],
        )
        .unwrap();
        conn.execute("CREATE TABLE Programmers (PR_Id TEXT, Programmer TEXT)", [])
            .unwrap();
        conn.execute("CREATE TABLE Artists (AR_Id TEXT, Artist TEXT)", [])
            .unwrap();
        conn.execute(
            "CREATE TABLE Extras (GA_Id TEXT, Path TEXT, DisplayOrder TEXT, platform_id TEXT, source_game_id TEXT)",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO Extras (GA_Id, Path, DisplayOrder, platform_id, source_game_id) VALUES (?1, ?2, ?3, ?4, ?5)",
            ["1", "Covers/Fresh Cover.png", "1", "atari800", "1"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO Programmers (PR_Id, Programmer) VALUES (?1, ?2)",
            ["pr1", "Chris Yates"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO Artists (AR_Id, Artist) VALUES (?1, ?2)",
            ["ar1", "Ejber Ozkan"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO Games (GA_Id, Name, PR_Id, AR_Id, platform_id, source_game_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            ["1", "Tiger Heli", "pr1", "ar1", "atari800", "1"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO GameView (id, platformId, sourceGameId, name, developer_name, publisher_name, musician_name) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            ["1", "atari800", "1", "Tiger Heli", "SEUCK", "", ""],
        )
        .unwrap();

        conn.execute(
            "CREATE TABLE GameCoverIndex (GA_Id TEXT PRIMARY KEY, cover_path TEXT NOT NULL)",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO GameCoverIndex (GA_Id, cover_path) VALUES (?1, ?2)",
            ["1", "Cover/Stale Cover.png"],
        )
        .unwrap();

        conn.execute_batch(
            "
            CREATE VIRTUAL TABLE GameSearchIndex USING fts5(
                id UNINDEXED,
                name,
                developer_name,
                publisher_name,
                musician_name,
                coder_name,
                graphics_name,
                tokenize='porter unicode61 remove_diacritics 2',
                prefix='2,3'
            );
            ",
        )
        .unwrap();
        conn.execute(
            "INSERT INTO GameSearchIndex (id, name, developer_name, publisher_name, musician_name, coder_name, graphics_name)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params!["1", "Tiger Heli", "SEUCK", "", "", "", ""],
        )
        .unwrap();
        drop(conn);

        init_database().expect("init_database should refresh stale support objects");

        let conn = Connection::open(&db_path).unwrap();
        let cover: String = conn
            .query_row(
                "SELECT cover_path FROM GameCoverIndex WHERE platform_id = ?1 AND GA_Id = ?2",
                ["atari800", "1"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(cover, "Covers/Fresh Cover.png");

        let search_hit: String = conn
            .query_row(
                "SELECT id FROM GameSearchIndex WHERE GameSearchIndex MATCH ?1 LIMIT 1",
                ["ejber*"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(search_hit, "1");
    }

    #[test]
    fn test_is_database_ready_returns_false_without_base_tables() {
        let temp_db = NamedTempFile::new().unwrap();
        let db_path = temp_db.path().to_string_lossy().to_string();
        let _env = DbEnvGuard::set(&db_path);

        assert!(!is_database_ready().unwrap());
    }

    #[test]
    fn test_import_csv_directory_to_sqlite_builds_ready_database() {
        let temp_db = NamedTempFile::new().unwrap();
        let db_path = temp_db.path().to_string_lossy().to_string();
        let _env = DbEnvGuard::set(&db_path);

        let export_dir = tempdir().unwrap();
        let tables = [
            ("Games.csv", "GA_Id,Name,Filename,FileToRun,ScrnshotFilename,SidFilename,CRC,YE_Id,GE_Id,DE_Id,PU_Id,MU_Id,LA_Id,PR_Id,AR_Id,V_PalNTSC,V_TrueDriveEmu,Classic,Adult\n1,Tiger Heli,tiger.zip,,tiger.png,tiger.sid,abc,1,1,1,1,1,1,1,1,P,1,True,False\n"),
            ("Years.csv", "YE_Id,Year\n1,1988\n"),
            ("Genres.csv", "GE_Id,Genre,PG_Id\n1,Shoot'em Up,1\n"),
            ("PGenres.csv", "PG_Id,ParentGenre\n1,Arcade\n"),
            ("Developers.csv", "DE_Id,Developer\n1,SEUCK\n"),
            ("Publishers.csv", "PU_Id,Publisher\n1,Firebird\n"),
            ("Musicians.csv", "MU_Id,Musician,Photo,Nick,Grp\n1,Rob Hubbard,photo.jpg,Hub,Group\n"),
            ("Languages.csv", "LA_Id,Language\n1,English\n"),
            ("Programmers.csv", "PR_Id,Programmer\n1,Chris Yates\n"),
            ("Artists.csv", "AR_Id,Artist\n1,Ejber Ozkan\n"),
            ("Extras.csv", "GA_Id,DisplayOrder,Path\n1,1,Cover/Test Cover.png\n"),
        ];

        for (filename, contents) in tables {
            fs::write(export_dir.path().join(filename), contents).unwrap();
        }

        let imported_tables = import_csv_directory_to_sqlite(export_dir.path(), "c64").unwrap();
        assert_eq!(imported_tables, 11);
        assert!(is_database_ready().unwrap());

        let conn = Connection::open(&db_path).unwrap();
        let search_hit: String = conn
            .query_row(
                "SELECT id FROM GameSearchIndex WHERE GameSearchIndex MATCH ?1 LIMIT 1",
                ["ejber*"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(search_hit, "1");
    }

    #[test]
    fn test_import_csv_directory_to_sqlite_preserves_requested_platform_scope() {
        let temp_db = NamedTempFile::new().unwrap();
        let db_path = temp_db.path().to_string_lossy().to_string();
        let _env = DbEnvGuard::set(&db_path);

        let export_dir = tempdir().unwrap();
        let tables = [
            ("Games.csv", "GA_Id,Name,Filename,FileToRun,ScrnshotFilename,SidFilename,CRC,YE_Id,GE_Id,DE_Id,PU_Id,MU_Id,LA_Id,PR_Id,AR_Id,V_PalNTSC,V_TrueDriveEmu,Classic,Adult\n1,Airstrike,airstrike.xex,,airstrike.png,,abc,1,1,1,1,1,1,1,1,N,0,False,False\n"),
            ("Years.csv", "YE_Id,Year\n1,1982\n"),
            ("Genres.csv", "GE_Id,Genre,PG_Id\n1,Shooter,1\n"),
            ("PGenres.csv", "PG_Id,ParentGenre\n1,Action\n"),
            ("Developers.csv", "DE_Id,Developer\n1,Atari Studio\n"),
            ("Publishers.csv", "PU_Id,Publisher\n1,Atari\n"),
            ("Musicians.csv", "MU_Id,Musician,Photo,Nick,Grp\n1,,,,\n"),
            ("Languages.csv", "LA_Id,Language\n1,English\n"),
            ("Programmers.csv", "PR_Id,Programmer\n1,Atari Coder\n"),
            ("Artists.csv", "AR_Id,Artist\n1,Atari Artist\n"),
            ("Extras.csv", "GA_Id,DisplayOrder,Path\n1,1,Cover/Airstrike.png\n"),
        ];

        for (filename, contents) in tables {
            fs::write(export_dir.path().join(filename), contents).unwrap();
        }

        let imported_tables =
            import_csv_directory_to_sqlite(export_dir.path(), "atari800").unwrap();
        assert_eq!(imported_tables, 11);

        let conn = Connection::open(&db_path).unwrap();
        let game_platform: String = conn
            .query_row(
                "SELECT platform_id FROM Games WHERE GA_Id = ?1",
                ["1"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(game_platform, "atari800");

        let view_platform: String = conn
            .query_row(
                "SELECT platformId FROM GameView WHERE id = ?1",
                ["1"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(view_platform, "atari800");

        let search_platform: String = conn
            .query_row(
                "SELECT platform_id FROM GameSearchIndex WHERE GameSearchIndex MATCH ?1 LIMIT 1",
                ["airstrike*"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(search_platform, "atari800");
    }

    #[test]
    fn test_import_csv_directory_to_sqlite_merges_platforms_without_replacing_existing_library() {
        let temp_db = NamedTempFile::new().unwrap();
        let db_path = temp_db.path().to_string_lossy().to_string();
        let _env = DbEnvGuard::set(&db_path);

        let c64_export_dir = tempdir().unwrap();
        let c64_tables = [
            ("Games.csv", "GA_Id,Name,Filename,FileToRun,ScrnshotFilename,SidFilename,CRC,YE_Id,GE_Id,DE_Id,PU_Id,MU_Id,LA_Id,PR_Id,AR_Id,V_PalNTSC,V_TrueDriveEmu,Classic,Adult\n1,Tiger Heli,tiger.zip,,tiger.png,tiger.sid,abc,1,1,1,1,1,1,1,1,P,1,True,False\n"),
            ("Years.csv", "YE_Id,Year\n1,1988\n"),
            ("Genres.csv", "GE_Id,Genre,PG_Id\n1,Shoot'em Up,1\n"),
            ("PGenres.csv", "PG_Id,ParentGenre\n1,Arcade\n"),
            ("Developers.csv", "DE_Id,Developer\n1,SEUCK\n"),
            ("Publishers.csv", "PU_Id,Publisher\n1,Firebird\n"),
            ("Musicians.csv", "MU_Id,Musician,Photo,Nick,Grp\n1,Rob Hubbard,photo.jpg,Hub,Group\n"),
            ("Languages.csv", "LA_Id,Language\n1,English\n"),
            ("Programmers.csv", "PR_Id,Programmer\n1,Chris Yates\n"),
            ("Artists.csv", "AR_Id,Artist\n1,Ejber Ozkan\n"),
            ("Extras.csv", "GA_Id,DisplayOrder,Path\n1,1,Cover/Tiger Heli.png\n"),
        ];
        for (filename, contents) in c64_tables {
            fs::write(c64_export_dir.path().join(filename), contents).unwrap();
        }

        let atari_export_dir = tempdir().unwrap();
        let atari_tables = [
            ("Games.csv", "GA_Id,Name,Filename,FileToRun,ScrnshotFilename,SidFilename,CRC,YE_Id,GE_Id,DE_Id,PU_Id,MU_Id,LA_Id,PR_Id,AR_Id,V_PalNTSC,V_TrueDriveEmu,Classic,Adult\n1,Airstrike,airstrike.xex,,airstrike.png,,def,1,1,1,1,1,1,1,1,N,0,False,False\n"),
            ("Years.csv", "YE_Id,Year\n1,1982\n"),
            ("Genres.csv", "GE_Id,Genre,PG_Id\n1,Shooter,1\n"),
            ("PGenres.csv", "PG_Id,ParentGenre\n1,Action\n"),
            ("Developers.csv", "DE_Id,Developer\n1,Atari Studio\n"),
            ("Publishers.csv", "PU_Id,Publisher\n1,Atari\n"),
            ("Musicians.csv", "MU_Id,Musician,Photo,Nick,Grp\n1,,,,\n"),
            ("Languages.csv", "LA_Id,Language\n1,English\n"),
            ("Programmers.csv", "PR_Id,Programmer\n1,Atari Coder\n"),
            ("Artists.csv", "AR_Id,Artist\n1,Atari Artist\n"),
            ("Extras.csv", "GA_Id,DisplayOrder,Path\n1,1,Cover/Airstrike.png\n"),
        ];
        for (filename, contents) in atari_tables {
            fs::write(atari_export_dir.path().join(filename), contents).unwrap();
        }

        import_csv_directory_to_sqlite(c64_export_dir.path(), "c64").unwrap();
        import_csv_directory_to_sqlite(atari_export_dir.path(), "atari800").unwrap();

        let conn = Connection::open(&db_path).unwrap();
        let c64_games: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM Games WHERE platform_id = ?1",
                ["c64"],
                |row| row.get(0),
            )
            .unwrap();
        let atari_games: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM Games WHERE platform_id = ?1",
                ["atari800"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(c64_games, 1);
        assert_eq!(atari_games, 1);

        let imported_platforms = conn
            .prepare("SELECT platform_id, game_count FROM PlatformLibraries ORDER BY platform_id")
            .unwrap()
            .query_map([], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
            })
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .unwrap();
        assert_eq!(
            imported_platforms,
            vec![("atari800".to_string(), 1), ("c64".to_string(), 1)]
        );

        let c64_developer: String = conn
            .query_row(
                "SELECT developer_name FROM GameView WHERE platformId = ?1 AND id = ?2",
                ["c64", "1"],
                |row| row.get(0),
            )
            .unwrap();
        let atari_developer: String = conn
            .query_row(
                "SELECT developer_name FROM GameView WHERE platformId = ?1 AND id = ?2",
                ["atari800", "1"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(c64_developer, "SEUCK");
        assert_eq!(atari_developer, "Atari Studio");

        let c64_search_platform: String = conn
            .query_row(
                "SELECT platform_id FROM GameSearchIndex WHERE GameSearchIndex MATCH ?1 AND platform_id = ?2 LIMIT 1",
                ["tiger*", "c64"],
                |row| row.get(0),
            )
            .unwrap();
        let atari_search_platform: String = conn
            .query_row(
                "SELECT platform_id FROM GameSearchIndex WHERE GameSearchIndex MATCH ?1 AND platform_id = ?2 LIMIT 1",
                ["airstrike*", "atari800"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(c64_search_platform, "c64");
        assert_eq!(atari_search_platform, "atari800");
    }

    #[test]
    fn test_parse_csv_line_handles_quotes_and_commas() {
        let parsed = parse_csv_line("\"Tiger, Heli\",1988,\"Ejber \"\"Ozkan\"\"\"");
        assert_eq!(
            parsed,
            vec![
                "Tiger, Heli".to_string(),
                "1988".to_string(),
                "Ejber \"Ozkan\"".to_string(),
            ]
        );
    }

    #[test]
    fn test_import_single_csv_table_preserves_multiline_quoted_fields() {
        let temp_db = NamedTempFile::new().unwrap();
        let mut conn = Connection::open(temp_db.path()).unwrap();
        let export_dir = tempdir().unwrap();
        let csv_path = export_dir.path().join("Notes.csv");

        fs::write(
            &csv_path,
            concat!(
                "GA_Id,Name,Comment\n",
                "1,\"Tiger Heli\",\"Line one\n",
                "Line two\"\n",
            ),
        )
        .unwrap();

        let imported = import_single_csv_table(&mut conn, &csv_path).unwrap();
        assert!(imported);

        let row_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM \"Notes\"", [], |row| row.get(0))
            .unwrap();
        assert_eq!(row_count, 1);

        let (id, name, comment): (String, String, String) = conn
            .query_row(
                "SELECT \"GA_Id\", \"Name\", \"Comment\" FROM \"Notes\"",
                [],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .unwrap();
        assert_eq!(id, "1");
        assert_eq!(name, "Tiger Heli");
        assert_eq!(comment, "Line one\nLine two");
    }

    #[test]
    fn test_import_csv_directory_to_sqlite_is_atomic_on_failure() {
        let temp_db = NamedTempFile::new().unwrap();
        let db_path = temp_db.path().to_string_lossy().to_string();
        let _env = DbEnvGuard::set(&db_path);

        {
            let conn = Connection::open(&db_path).unwrap();
            conn.execute("CREATE TABLE Marker (value TEXT)", [])
                .unwrap();
            conn.execute("INSERT INTO Marker (value) VALUES (?1)", ["before"])
                .unwrap();
        }

        let export_dir = tempdir().unwrap();
        fs::write(export_dir.path().join("Alpha.csv"), "Name\nTiger Heli\n").unwrap();
        fs::write(export_dir.path().join("Broken.csv"), "bad-header\nvalue\n").unwrap();

        let error = import_csv_directory_to_sqlite(export_dir.path(), "c64")
            .expect_err("import should fail when a CSV header contains an unsupported identifier");
        assert!(error.contains("Unsupported identifier"));

        let conn = Connection::open(&db_path).unwrap();
        let marker: String = conn
            .query_row("SELECT value FROM Marker", [], |row| row.get(0))
            .unwrap();
        assert_eq!(marker, "before");

        let alpha_exists: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'Alpha')",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(!alpha_exists);
    }
}
