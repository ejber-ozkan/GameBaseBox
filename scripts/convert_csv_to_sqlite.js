const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const Database = require("better-sqlite3");

const {
  getPlatformImportConfig,
  resolveReferenceMdbPath,
  performanceIndexes,
  requiredPlatformColumns,
  sharedSql,
  supportObjects,
} = require("./sqlite_support_config");

const platformScopedTables = [
  ["Games", "GA_Id"],
  ["Extras", "GA_Id"],
  ["Years", "YE_Id"],
  ["Genres", "GE_Id"],
  ["PGenres", "PG_Id"],
  ["Developers", "DE_Id"],
  ["Publishers", "PU_Id"],
  ["Musicians", "MU_Id"],
  ["Languages", "LA_Id"],
  ["Programmers", "PR_Id"],
  ["Artists", "AR_Id"],
];

function getArgValue(flag, argv = process.argv) {
  const index = argv.indexOf(flag);
  if (index === -1 || index === argv.length - 1) {
    return undefined;
  }

  return argv[index + 1];
}

function resolvePath(flag, envVar, fallbackPath, argv = process.argv, env = process.env) {
  const explicitPath = getArgValue(flag, argv) || env[envVar];
  return path.resolve(explicitPath || fallbackPath);
}

function sqliteObjectExists(db, name, type) {
  return Boolean(
    db.prepare(
      "SELECT 1 FROM sqlite_master WHERE type = ? AND name = ? LIMIT 1"
    ).get(type, name)
  );
}

function tableExists(db, tableName) {
  return Boolean(
    db.prepare(
      "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1"
    ).get(tableName)
  );
}

function tableColumns(db, tableName) {
  if (!tableExists(db, tableName)) {
    return [];
  }

  return db
    .prepare(`PRAGMA table_info('${tableName.replace(/'/g, "''")}')`)
    .all()
    .map((row) => row.name);
}

function createPerformanceIndexes(db) {
  console.log("Creating performance indexes...");
  for (const [tableName, , sql] of performanceIndexes) {
    if (tableExists(db, tableName)) {
      db.exec(sql);
    }
  }
}

function ensureTablePlatformColumns(db, tableName, platformId, sourceIdColumn) {
  if (!tableExists(db, tableName)) {
    return;
  }

  const columns = tableColumns(db, tableName);
  for (const column of requiredPlatformColumns) {
    if (!columns.includes(column)) {
      db.exec(`ALTER TABLE "${tableName}" ADD COLUMN ${column} TEXT`);
    }
  }

  db.prepare(`UPDATE "${tableName}" SET platform_id = ? WHERE platform_id IS NULL OR platform_id = ''`).run(platformId);
  db.exec(`UPDATE "${tableName}" SET source_game_id = "${sourceIdColumn}" WHERE source_game_id IS NULL OR source_game_id = ''`);
}

function ensureGamesPlatformColumns(db, platformId) {
  ensureTablePlatformColumns(db, "Games", platformId, "GA_Id");
}

function ensureExtrasPlatformColumns(db, platformId) {
  ensureTablePlatformColumns(db, "Extras", platformId, "GA_Id");
}

function ensureImportPlatformColumns(db, platformId) {
  for (const [tableName, sourceIdColumn] of platformScopedTables) {
    ensureTablePlatformColumns(db, tableName, platformId, sourceIdColumn);
  }
}

function rebuildPlatformLibraries(db, platformId, platformConfig) {
  console.log("Creating platform library metadata...");
  db.exec(`
    CREATE TABLE IF NOT EXISTS PlatformLibraries (
      platform_id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      import_status TEXT NOT NULL,
      source_mdb_path TEXT,
      game_count INTEGER NOT NULL DEFAULT 0,
      last_import_error TEXT,
      last_imported_at TEXT
    )
  `);

  const gameCount = tableExists(db, "Games")
    ? db.prepare("SELECT COUNT(*) AS count FROM Games WHERE platform_id = ?").get(platformId).count
    : 0;

  db.prepare(`
    INSERT INTO PlatformLibraries (
      platform_id,
      display_name,
      import_status,
      source_mdb_path,
      game_count,
      last_import_error,
      last_imported_at
    )
    VALUES (?, ?, 'imported', ?, ?, NULL, datetime('now'))
    ON CONFLICT(platform_id) DO UPDATE SET
      display_name = excluded.display_name,
      import_status = excluded.import_status,
      source_mdb_path = excluded.source_mdb_path,
      game_count = excluded.game_count,
      last_import_error = excluded.last_import_error,
      last_imported_at = excluded.last_imported_at
  `).run(
    platformId,
    platformConfig.displayName,
    resolveReferenceMdbPath(platformId) || platformConfig.sourceMdbName || null,
    gameCount
  );
}

function rebuildCoverIndex(db) {
  console.log("Creating cover lookup table...");
  db.exec("DROP TABLE IF EXISTS GameCoverIndex");
  db.exec(sharedSql.coverIndexTable);
  db.exec(sharedSql.coverIndexPopulate);
}

function rebuildGameView(db) {
  db.exec("DROP VIEW IF EXISTS GameView");
  db.exec(sharedSql.gameView);
}

function rebuildSearchIndex(db) {
  console.log("Creating full-text search index...");
  db.exec("DROP TABLE IF EXISTS GameSearchIndex");
  db.exec(sharedSql.searchIndexTable);
  db.exec(sharedSql.searchIndexPopulate);
  db.exec("INSERT INTO GameSearchIndex(GameSearchIndex) VALUES('optimize')");
}

function optimizeDatabase(db) {
  console.log("Running ANALYZE and PRAGMA optimize...");
  db.exec("ANALYZE");
  db.pragma("optimize");
}

function verifySupportObjects(db) {
  const missingIndexes = [];
  for (const [tableName, indexName] of performanceIndexes) {
    if (!tableExists(db, tableName)) {
      continue;
    }

    if (!sqliteObjectExists(db, indexName, "index")) {
      missingIndexes.push(indexName);
    }
  }

  const missingSupportObjects = supportObjects
    .filter(({ name, type }) => !sqliteObjectExists(db, name, type))
    .map(({ name, type }) => `${name} (${type})`);

  if (missingIndexes.length > 0 || missingSupportObjects.length > 0) {
    const messages = [];
    if (missingIndexes.length > 0) {
      messages.push(`Missing indexes: ${missingIndexes.join(", ")}`);
    }
    if (missingSupportObjects.length > 0) {
      messages.push(`Missing support objects: ${missingSupportObjects.join(", ")}`);
    }
    throw new Error(messages.join("\n"));
  }
}

function importCsvFiles(db, outputDir) {
  if (!fs.existsSync(outputDir)) {
    throw new Error(`CSV export directory was not found: ${outputDir}`);
  }

  const csvFiles = fs
    .readdirSync(outputDir)
    .filter((fileName) => fileName.endsWith(".csv"))
    .sort();

  console.log(`Found ${csvFiles.length} CSV files to import.`);

  for (const file of csvFiles) {
    const tableName = path.basename(file, ".csv");
    const csvFile = path.join(outputDir, file);

    console.log(`Importing ${tableName}...`);

    const fileContent = fs.readFileSync(csvFile, "utf8");
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
    });

    if (records.length === 0) {
      console.warn(`Skipping ${tableName}, no records found.`);
      continue;
    }

    db.exec(`DROP TABLE IF EXISTS "${tableName}"`);

    const columns = Object.keys(records[0]);
    const colsDef = columns.map((columnName) => `"${columnName}" TEXT`).join(", ");

    db.exec(`CREATE TABLE "${tableName}" (${colsDef})`);

    const insertSql = `INSERT INTO "${tableName}" (${columns
      .map((columnName) => `"${columnName}"`)
      .join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
    const stmt = db.prepare(insertSql);

    const insertMany = db.transaction((rows) => {
      for (const row of rows) {
        stmt.run(columns.map((columnName) => row[columnName] || ""));
      }
    });

    try {
      insertMany(records);
      console.log(`Successfully imported ${records.length} records into ${tableName}.`);
    } catch (error) {
      console.error(`Error importing ${tableName}:`, error.message);
      throw error;
    }
  }

  return csvFiles.length;
}

function convertCsvToSqlite({ inputDir, dbPath, platformId = "c64" }) {
  const platformConfig = getPlatformImportConfig(platformId);

  console.log(`Importing CSV files from ${inputDir}`);
  console.log(`Connecting to database at ${dbPath}...`);
  console.log(`Platform: ${platformId}`);

  const db = new Database(dbPath);

  try {
    db.pragma("journal_mode = WAL");
    const importedFiles = importCsvFiles(db, inputDir);

    console.log("Creating optimized views...");
    ensureImportPlatformColumns(db, platformId);
    createPerformanceIndexes(db);
    rebuildPlatformLibraries(db, platformId, platformConfig);
    if (tableExists(db, "Extras")) {
      rebuildCoverIndex(db);
    }

    rebuildGameView(db);
    rebuildSearchIndex(db);
    optimizeDatabase(db);
    verifySupportObjects(db);

    console.log(`Success! Database updated at ${dbPath}`);
    return { dbPath, importedFiles, platformId };
  } finally {
    db.close();
  }
}

function main(argv = process.argv, env = process.env) {
  const inputDir = resolvePath("--input-dir", "GB64_EXPORT_DIR", path.join(__dirname, "../gb64_export"), argv, env);
  const dbPath = resolvePath("--db", "GB64_SQLITE_PATH", path.join(__dirname, "../gb64.sqlite"), argv, env);
  const platformId = getArgValue("--platform", argv) || env.GAMEBASE_PLATFORM_ID || "c64";
  convertCsvToSqlite({ inputDir, dbPath, platformId });
}

if (require.main === module) {
  main();
}

module.exports = {
  rebuildGameView,
  convertCsvToSqlite,
  ensureExtrasPlatformColumns,
  ensureGamesPlatformColumns,
  ensureTablePlatformColumns,
  getArgValue,
  rebuildSearchIndex,
  rebuildPlatformLibraries,
  resolvePath,
};
