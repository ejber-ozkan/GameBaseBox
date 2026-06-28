# Contract: Tauri IPC Surface

## Purpose

Define the desktop command surface needed for platform-scoped libraries, imports, settings, and launches.

## Platform Commands

### `get_supported_platforms`

Returns all platform profiles known to the app.

**Response**

- `id`
- `displayName`
- `status`
- `importStatus`
- `defaultEmulatorProfileId`
- `capabilities`
- `folderTypes`

### `get_active_platform`

Returns active and last-used platform state.

**Response**

- `activePlatformId`
- `lastUsedPlatformId`
- `platformSelectionRequired`

### `set_active_platform`

Sets the active platform or returns an import-required response.

**Request**

- `platformId`

**Response**

- `activePlatformId`
- `requiresImport`
- `message`

## Import Commands

### `get_platform_import_status`

Returns import readiness for one platform.

**Request**

- `platformId`

**Response**

- `platformId`
- `importStatus`
- `sourceMdbPath`
- `gameCount`
- `lastImportError`

### `import_platform_database_from_mdb`

Imports a platform-specific MDB into the local platform-scoped library.

**Request**

- `platformId`
- `mdbPath`
- `folderSettings`

**Atari 800 Folder Settings**

- `gamesPath`
- `musicPath`
- `photosPath`
- `screenshotsPath`

All four Atari 800 folder settings are required before the platform is import-ready.
The `musicPath` may contain `.sap` files. The `photosPath` is for photo/media
artwork distinct from screenshots.

**Response**

- `platformId`
- `dbPath`
- `exportedTables`
- `importedTables`
- `gameCount`

## Query Commands

Existing game query commands must become platform-aware. Requests either include
`platformId` or default to the active platform.

### Platform-Aware Query Inputs

- `get_db_games`
- `get_db_game_count`
- `get_game_detail`
- `get_game_extras`
- `get_genres`
- `get_sub_genres`

**Request Addition**

- `platformId`: Optional; defaults to active platform.

**Response Rule**

Responses contain only records for the requested or active platform.

## Settings Commands

### `save_platform_settings`

Saves platform-scoped folder and emulator settings.

**Request**

- `platformId`
- `folderSettings`
- `emulatorSettings`
- `navigationState` when persisting per-platform selected game, focus, view mode, and BigBox state

### `get_platform_settings`

Loads platform-scoped settings.

**Request**

- `platformId`

**Response**

- `folderSettings`
- `emulatorSettings`
- `mediaCapabilities`
- `navigationState`

## Launch Commands

### `test_emulator_profile`

Validates an emulator profile for a platform without launching a game.

**Request**

- `platformId`
- `emulatorProfileId`
- `executablePath`
- `corePath` for RetroArch profiles

**Response**

- `success`
- `message`

### `launch_game`

Launches a game using a platform-specific emulator profile.

**Request**

- `platformId`
- `gameId`
- `emulatorProfileId`
- `executablePath`
- `corePath` for RetroArch profiles
- `launchFilePath` or resolved game file candidate

**Response**

- `success`
- `message`
- `artifactPath` when a temporary launch artifact was created

## Compatibility

- Current C64 commands may remain as wrappers during migration.
- New commands must return platform-specific errors.
- Existing frontend workflows should not need to know platform-specific launch details beyond capabilities and selected platform.
- Existing flat C64 settings and navigation state must be migratable into platform-scoped settings without data loss.
