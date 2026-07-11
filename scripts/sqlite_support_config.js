const performanceIndexes = [
  ["Games", "idx_games_ga_id", "CREATE INDEX IF NOT EXISTS idx_games_ga_id ON Games(GA_Id)"],
  ["Games", "idx_games_name_nocase", "CREATE INDEX IF NOT EXISTS idx_games_name_nocase ON Games(Name COLLATE NOCASE)"],
  ["Games", "idx_games_ye_id", "CREATE INDEX IF NOT EXISTS idx_games_ye_id ON Games(YE_Id)"],
  ["Games", "idx_games_ge_id", "CREATE INDEX IF NOT EXISTS idx_games_ge_id ON Games(GE_Id)"],
  ["Games", "idx_games_de_id", "CREATE INDEX IF NOT EXISTS idx_games_de_id ON Games(DE_Id)"],
  ["Games", "idx_games_pu_id", "CREATE INDEX IF NOT EXISTS idx_games_pu_id ON Games(PU_Id)"],
  ["Games", "idx_games_mu_id", "CREATE INDEX IF NOT EXISTS idx_games_mu_id ON Games(MU_Id)"],
  ["Games", "idx_games_la_id", "CREATE INDEX IF NOT EXISTS idx_games_la_id ON Games(LA_Id)"],
  ["Games", "idx_games_pr_id", "CREATE INDEX IF NOT EXISTS idx_games_pr_id ON Games(PR_Id)"],
  ["Games", "idx_games_ar_id", "CREATE INDEX IF NOT EXISTS idx_games_ar_id ON Games(AR_Id)"],
  ["Games", "idx_games_classic", "CREATE INDEX IF NOT EXISTS idx_games_classic ON Games(Classic)"],
  ["Games", "idx_games_adult", "CREATE INDEX IF NOT EXISTS idx_games_adult ON Games(Adult)"],
  ["Games", "idx_games_platform_id", "CREATE INDEX IF NOT EXISTS idx_games_platform_id ON Games(platform_id)"],
  ["Games", "idx_games_platform_source_game_id", "CREATE INDEX IF NOT EXISTS idx_games_platform_source_game_id ON Games(platform_id, source_game_id)"],
  ["Years", "idx_years_ye_id", "CREATE INDEX IF NOT EXISTS idx_years_ye_id ON Years(YE_Id)"],
  ["Genres", "idx_genres_ge_id", "CREATE INDEX IF NOT EXISTS idx_genres_ge_id ON Genres(GE_Id)"],
  ["Genres", "idx_genres_pg_id", "CREATE INDEX IF NOT EXISTS idx_genres_pg_id ON Genres(PG_Id)"],
  ["PGenres", "idx_pgenres_pg_id", "CREATE INDEX IF NOT EXISTS idx_pgenres_pg_id ON PGenres(PG_Id)"],
  ["Developers", "idx_developers_de_id", "CREATE INDEX IF NOT EXISTS idx_developers_de_id ON Developers(DE_Id)"],
  ["Publishers", "idx_publishers_pu_id", "CREATE INDEX IF NOT EXISTS idx_publishers_pu_id ON Publishers(PU_Id)"],
  ["Musicians", "idx_musicians_mu_id", "CREATE INDEX IF NOT EXISTS idx_musicians_mu_id ON Musicians(MU_Id)"],
  ["Languages", "idx_languages_la_id", "CREATE INDEX IF NOT EXISTS idx_languages_la_id ON Languages(LA_Id)"],
  ["Programmers", "idx_programmers_pr_id", "CREATE INDEX IF NOT EXISTS idx_programmers_pr_id ON Programmers(PR_Id)"],
  ["Artists", "idx_artists_ar_id", "CREATE INDEX IF NOT EXISTS idx_artists_ar_id ON Artists(AR_Id)"],
  ["Extras", "idx_extras_ga_id", "CREATE INDEX IF NOT EXISTS idx_extras_ga_id ON Extras(GA_Id)"],
  ["Extras", "idx_extras_ga_id_display_order", "CREATE INDEX IF NOT EXISTS idx_extras_ga_id_display_order ON Extras(GA_Id, DisplayOrder)"],
  ["Extras", "idx_extras_platform_ga_id", "CREATE INDEX IF NOT EXISTS idx_extras_platform_ga_id ON Extras(platform_id, GA_Id)"],
];

const supportObjects = [
  { name: "GameView", type: "view" },
  { name: "GameCoverIndex", type: "table" },
  { name: "idx_game_cover_index_platform_ga_id", type: "index" },
  { name: "GameSearchIndex", type: "table" },
  { name: "PlatformLibraries", type: "table" },
];

const requiredPlatformColumns = ["platform_id", "source_game_id"];

const platformManifest = require("../platform-manifest.json");

// Retained as an explicit migration reference until the next release removes it.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const legacyPlatformImportConfigs = {
  c64: {
    platformId: "c64",
    displayName: "Commodore 64",
    status: "available",
    defaultImported: true,
    sourceMdbName: "GBC_v19.mdb",
    requiredFolders: ["gamesPath", "musicPath", "photosPath", "screenshotsPath", "extrasPath"],
    musicExtensions: [".sid"],
    launchExtensions: [".d64", ".t64", ".tap", ".prg", ".crt", ".g64", ".zip", ".7z", ".m3u", ".vfl"],
  },
  atari800: {
    platformId: "atari800",
    displayName: "Atari 800",
    status: "available",
    defaultImported: false,
    sourceMdbName: "Atari 800 v12.mdb",
    referenceMdbPath: "E:\\Backups\\RETRO-BACKUPS\\Atari8bit\\Atari 800\\Atari 800 v12.mdb",
    requiredFolders: ["gamesPath", "musicPath", "photosPath", "screenshotsPath"],
    musicExtensions: [".sap"],
    launchExtensions: [".atr", ".xfd", ".atx", ".cas", ".car", ".rom", ".bin", ".xex", ".com", ".m3u", ".zip", ".7z"],
  },
  atari2600: {
    platformId: "atari2600",
    displayName: "Atari 2600",
    status: "available",
    defaultImported: false,
    sourceMdbName: "Atari 2600.mdb",
    requiredFolders: ["gamesPath", "screenshotsPath", "extrasPath"],
    musicExtensions: [],
    launchExtensions: [".a26", ".bin", ".rom", ".zip", ".7z"],
  },
  zxspectrum: {
    platformId: "zxspectrum",
    displayName: "ZX Spectrum",
    status: "available",
    defaultImported: false,
    sourceMdbName: "Sinclair ZX Spectrum v6.mdb",
    referenceMdbPath: "E:\\Backups\\RETRO-BACKUPS\\ZXSpectrum\\Sinclair ZX Spectrum v6\\Sinclair ZX Spectrum v6.mdb",
    aliases: ["GameBaseZX", "SpeccyMania"],
    requiredFolders: ["extrasPath", "gamesPath", "screenshotsPath", "photosPath", "musicPath"],
    musicExtensions: [".ay"],
    launchExtensions: [".tzx", ".tap", ".z80", ".sna", ".szx", ".trd", ".dsk", ".zip", ".7z"],
  },
  atarist: {
    platformId: "atarist",
    displayName: "Atari ST",
    status: "available",
    defaultImported: false,
    sourceMdbName: "Atari ST.mdb",
    requiredFolders: ["extrasPath", "gamesPath", "screenshotsPath", "musicPath"],
    musicExtensions: [],
    launchExtensions: [".st", ".msa", ".stx", ".dim", ".ipf", ".m3u", ".zip", ".7z"],
  },
  vic20: {
    platformId: "vic20",
    displayName: "Commodore VIC-20",
    status: "available",
    defaultImported: false,
    sourceMdbName: "Vic20_v03.mdb",
    aliases: ["VIC-20", "VIC 20", "Commodore VIC-20", "Commodore VIC 20", "GameBase VIC-20"],
    requiredFolders: ["extrasPath", "gamesPath", "screenshotsPath", "musicPath"],
    musicExtensions: [],
    launchExtensions: [".d64", ".t64", ".tap", ".prg", ".crt", ".a0", ".20", ".40", ".60", ".zip", ".7z"],
  },
};

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
  supportObjects,
  requiredPlatformColumns,
  platformImportConfigs,
  getPlatformImportConfig,
};
