const fs = require("fs");
const path = require("path");

// Schema objects shared with the app (src-tauri/src/database.rs). Edit the files in
// src-tauri/sql/ and bump SCHEMA_VERSION in database.rs; never copy SQL into scripts.
const sharedSqlDir = path.join(__dirname, "..", "src-tauri", "sql");

function readSharedSql(fileName) {
  return fs.readFileSync(path.join(sharedSqlDir, fileName), "utf8");
}

const performanceIndexes = JSON.parse(readSharedSql("query_indexes.json")).indexes.map(
  ({ table, name, sql }) => [table, name, sql],
);

const sharedSql = {
  gameView: readSharedSql("game_view.sql"),
  coverIndexTable: readSharedSql("cover_index_table.sql"),
  coverIndexPopulate: readSharedSql("cover_index_populate.sql"),
  searchIndexTable: readSharedSql("search_index_table.sql"),
  searchIndexPopulate: readSharedSql("search_index_populate.sql"),
};

const supportObjects = [
  { name: "GameView", type: "view" },
  { name: "GameCoverIndex", type: "table" },
  { name: "idx_game_cover_index_platform_ga_id", type: "index" },
  { name: "GameSearchIndex", type: "table" },
  { name: "PlatformLibraries", type: "table" },
];

const requiredPlatformColumns = ["platform_id", "source_game_id"];

const platformManifest = require("../platform-manifest.json");

// Machine-specific MDB locations live in platform-paths.local.json (git-ignored), never in the manifest.
const localPathsFile = path.join(__dirname, "..", "platform-paths.local.json");

function loadLocalPaths(file = localPathsFile) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")).referenceMdbPaths ?? {};
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw new Error(`Could not read ${file}: ${error.message}`);
  }
}

function resolveReferenceMdbPath(platformId, localPaths = loadLocalPaths()) {
  const config = getPlatformImportConfig(platformId);
  return localPaths[config.platformId] || null;
}

const folderKeyByType = {
  games: "gamesPath",
  music: "musicPath",
  photos: "photosPath",
  screenshots: "screenshotsPath",
  extras: "extrasPath",
};

const musicExtensionsByCapability = {
  sid: [".sid"],
  sap: [".sap"],
  ay: [".ay"],
};

const platformImportConfigs = Object.fromEntries(
  platformManifest.platforms.map((platform) => [
    platform.id,
    {
      platformId: platform.id,
      displayName: platform.displayName,
      status: platform.status,
      defaultImported: platform.defaultImported,
      sourceMdbName: platform.sourceMdbName,
      ...(platform.referenceMdbPath ? { referenceMdbPath: platform.referenceMdbPath } : {}),
      aliases: platform.aliases,
      requiredFolders: platform.requiredFolderTypes.map((folderType) => folderKeyByType[folderType]),
      musicExtensions: musicExtensionsByCapability[platform.mediaCapabilities.music] ?? [],
      launchExtensions: platform.launchExtensions,
    },
  ]),
);

function normalizePlatformConfigKey(platformId = "c64") {
  return String(platformId)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const platformConfigAliases = Object.fromEntries(
  Object.values(platformImportConfigs).flatMap((config) => [
    [normalizePlatformConfigKey(config.platformId), config.platformId],
    [normalizePlatformConfigKey(config.displayName), config.platformId],
    ...(config.aliases ?? []).map((alias) => [normalizePlatformConfigKey(alias), config.platformId]),
  ]),
);

function getPlatformImportConfig(platformId = "c64") {
  const canonicalPlatformId = platformConfigAliases[normalizePlatformConfigKey(platformId)] ?? platformId;
  const config = platformImportConfigs[canonicalPlatformId];
  if (!config) {
    throw new Error(`Unsupported platform: ${platformId}`);
  }
  return config;
}

module.exports = {
  performanceIndexes,
  sharedSql,
  supportObjects,
  requiredPlatformColumns,
  platformImportConfigs,
  getPlatformImportConfig,
  loadLocalPaths,
  resolveReferenceMdbPath,
};
