const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const {
  performanceIndexes,
  requiredPlatformColumns,
  supportObjects,
} = require("./sqlite_support_config");

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function resolveDbPath() {
  const explicitPath = getArgValue("--db") || process.env.GB64_SQLITE_PATH;
  return path.resolve(explicitPath || path.join(__dirname, "..", "gb64.sqlite"));
}

function resolvePlatformId() {
  return getArgValue("--platform") || process.env.GAMEBASE_PLATFORM_ID || "c64";
}

function sqliteObjectExists(db, name, type) {
  return Boolean(
    db.prepare(
      "SELECT 1 FROM sqlite_master WHERE type = ? AND name = ? LIMIT 1"
    ).get(type, name)
  );
}

function tableExists(db, tableName) {
  return sqliteObjectExists(db, tableName, "table");
}

function listMissingIndexes(db) {
  const missing = [];

  for (const [tableName, indexName] of performanceIndexes) {
    if (!tableExists(db, tableName)) {
      continue;
    }

    if (!sqliteObjectExists(db, indexName, "index")) {
      missing.push(indexName);
    }
  }

  return missing;
}

function listMissingSupportObjects(db) {
  return supportObjects
    .filter(({ name, type }) => !sqliteObjectExists(db, name, type))
    .map(({ name, type }) => `${name} (${type})`);
}

function listFtsShadowTables(db) {
  return db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name GLOB 'GameSearchIndex_*' ORDER BY name"
    )
    .all()
    .map((row) => row.name);
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

function listMissingPlatformColumns(db) {
  if (!tableExists(db, "Games")) {
    return [];
  }

  const columns = tableColumns(db, "Games");
  return requiredPlatformColumns.filter((column) => !columns.includes(column));
}

function auditSqliteSupport(dbPath, platformId = "c64") {
  if (!fs.existsSync(dbPath)) {
    throw new Error(`SQLite database not found at ${dbPath}`);
  }

  const db = new Database(dbPath, { readonly: true });

  try {
    const missingIndexes = listMissingIndexes(db);
    const missingSupportObjects = listMissingSupportObjects(db);
    const missingPlatformColumns = listMissingPlatformColumns(db);
    const shadowTables = listFtsShadowTables(db);

    console.log(`Auditing SQLite support objects in ${dbPath}`);
    console.log(`Platform scope: ${platformId}`);
    console.log(`Expected performance indexes: ${performanceIndexes.length}`);
    console.log(`Expected support objects: ${supportObjects.length}`);
    console.log(`Expected platform identity columns: ${requiredPlatformColumns.join(", ")}`);
    console.log(`FTS shadow tables detected: ${shadowTables.length}`);

    if (shadowTables.length > 0) {
      console.log(`FTS shadow tables: ${shadowTables.join(", ")}`);
    }

    if (
      missingIndexes.length === 0 &&
      missingSupportObjects.length === 0 &&
      missingPlatformColumns.length === 0
    ) {
      console.log("[OK] All expected indexes and support objects are present.");
      return {
        missingIndexes,
        missingSupportObjects,
        missingPlatformColumns,
        shadowTables,
      };
    }

    const messages = [];

    if (missingIndexes.length > 0) {
      messages.push(`Missing indexes: ${missingIndexes.join(", ")}`);
    }

    if (missingSupportObjects.length > 0) {
      messages.push(`Missing support objects: ${missingSupportObjects.join(", ")}`);
    }

    if (missingPlatformColumns.length > 0) {
      messages.push(`Missing platform identity columns on Games: ${missingPlatformColumns.join(", ")}`);
    }

    throw new Error(messages.join("\n"));
  } finally {
    db.close();
  }
}

function main() {
  try {
    auditSqliteSupport(resolveDbPath(), resolvePlatformId());
  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  auditSqliteSupport,
  listMissingPlatformColumns,
  listMissingSupportObjects,
  listMissingIndexes,
  tableColumns,
};
