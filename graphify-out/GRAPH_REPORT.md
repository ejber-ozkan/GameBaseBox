# Graph Report - GameBaseBox  (2026-08-15)

## Corpus Check
- 171 files · ~142,443 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1770 nodes · 3838 edges · 101 communities (92 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 71 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `082af267`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Detail View Layout & Navigation|Detail View Layout & Navigation]]
- [[_COMMUNITY_Core Architecture & Requirements|Core Architecture & Requirements]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_WASM Emulator Core & Localization|WASM Emulator Core & Localization]]
- [[_COMMUNITY_Database & Performance Paradigms|Database & Performance Paradigms]]
- [[_COMMUNITY_Media Extras & Asset Structuring|Media Extras & Asset Structuring]]
- [[_COMMUNITY_Component 6|Component 6]]
- [[_COMMUNITY_Component 7|Component 7]]
- [[_COMMUNITY_Component 8|Component 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Component 10|Component 10]]
- [[_COMMUNITY_Component 11|Component 11]]
- [[_COMMUNITY_Component 12|Component 12]]
- [[_COMMUNITY_Component 13|Component 13]]
- [[_COMMUNITY_Component 14|Component 14]]
- [[_COMMUNITY_Component 15|Component 15]]
- [[_COMMUNITY_Component 16|Component 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Component 18|Component 18]]
- [[_COMMUNITY_Component 19|Component 19]]
- [[_COMMUNITY_Component 20|Component 20]]
- [[_COMMUNITY_Component 21|Component 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Component 24|Component 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Component 26|Component 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Component 28|Component 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Component 30|Component 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Component 32|Component 32]]
- [[_COMMUNITY_Component 33|Component 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Component 36|Component 36]]
- [[_COMMUNITY_Component 37|Component 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Component 39|Component 39]]
- [[_COMMUNITY_Component 40|Component 40]]
- [[_COMMUNITY_Component 41|Component 41]]
- [[_COMMUNITY_Component 42|Component 42]]
- [[_COMMUNITY_Component 43|Component 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Component 45|Component 45]]
- [[_COMMUNITY_Component 46|Component 46]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Component 67|Component 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Component 91|Component 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Component 96|Component 96]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 107|Community 107]]
- [[_COMMUNITY_Community 113|Community 113]]
- [[_COMMUNITY_Component 128|Component 128]]

## God Nodes (most connected - your core abstractions)
1. `String` - 52 edges
2. `namedColors` - 51 edges
3. `Result` - 48 edges
4. `namedColors` - 48 edges
5. `namedColors` - 48 edges
6. `namedColors` - 48 edges
7. `Game` - 45 edges
8. `isTauri()` - 43 edges
9. `useSettings()` - 41 edges
10. `useTheme()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `test_init_database_repairs_stale_game_view_without_platform_id()` --calls--> `init_database()`  [INFERRED]
  src-tauri/src/commands/db/tests.rs → src-tauri/src/database.rs
- `WASM Emulator Iframe` --implements--> `WASM Emulation Requirements`  [INFERRED]
  public/emulator.html → GB64_Modern_Frontend_Requirements.md
- `jsSID Player Test` --implements--> `SID Player Requirements`  [INFERRED]
  public/test.html → GB64_Modern_Frontend_Requirements.md
- `test_build_game_summary_query_preserves_requested_id_order_in_sql()` --calls--> `build_game_summary_query()`  [INFERRED]
  src-tauri/src/commands/db/tests.rs → src-tauri/src/commands/db/games.rs
- `test_build_game_query_invalid_fts_input_matches_nothing()` --calls--> `build_game_query()`  [INFERRED]
  src-tauri/src/commands/db/tests.rs → src-tauri/src/commands/db/querying.rs

## Import Cycles
- 1-file cycle: `src-tauri/src/commands/db/games.rs -> src-tauri/src/commands/db/games.rs`
- 1-file cycle: `src-tauri/src/commands/db/querying.rs -> src-tauri/src/commands/db/querying.rs`
- 1-file cycle: `src-tauri/src/commands/emulator.rs -> src-tauri/src/commands/emulator.rs`
- 1-file cycle: `src-tauri/src/commands/files.rs -> src-tauri/src/commands/files.rs`
- 1-file cycle: `src-tauri/src/commands/setup.rs -> src-tauri/src/commands/setup.rs`
- 1-file cycle: `src-tauri/src/commands/video.rs -> src-tauri/src/commands/video.rs`
- 1-file cycle: `src-tauri/src/database.rs -> src-tauri/src/database.rs`

## Hyperedges (group relationships)
- **Offline C64 WASM Emulation Flow** — gb64_modern_frontend_requirements_wasm_emulation, public_emulator_wasm_iframe, cores_readme_emulatorjs_core [EXTRACTED 1.00]

## Communities (101 total, 9 thin omitted)

### Community 0 - "Detail View Layout & Navigation"
Cohesion: 0.11
Nodes (21): DetailFullscreenRequest, C64ShaderBackground(), buildPersonnel(), buildVersions(), clampTextLines(), formatVersionLabel(), getArchiveNotes(), getMusicGlyph() (+13 more)

### Community 1 - "Core Architecture & Requirements"
Cohesion: 0.22
Nodes (9): EmulatorJS vice_x64 Core, Project 64Box Requirements, SID Player Requirements, SQLite Database Requirements, Tauri Desktop Wrapper Requirements, WASM Emulation Requirements, EmulatorJS Localization, WASM Emulator Iframe (+1 more)

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (18): getRequiredPlatformFolderKeys(), Home(), ImportedLibraryContent(), LibraryApp(), SetupFolderKey, AlphabetJumpBar(), AlphabetJumpBarProps, LETTERS (+10 more)

### Community 3 - "WASM Emulator Core & Localization"
Cohesion: 0.07
Nodes (52): build_game_detail_query(), build_game_summary_query(), get_db_game_count(), get_db_game_count_blocking(), get_db_games(), get_db_games_blocking(), get_game_detail(), get_game_detail_blocking() (+44 more)

### Community 4 - "Database & Performance Paradigms"
Cohesion: 0.11
Nodes (77): R, cleanup_export_directory(), configure_runtime_db_path(), create_export_directory(), create_import_temp_db_path(), create_runtime_db_path(), csv_record_has_unclosed_quotes(), ensure_cover_index() (+69 more)

### Community 6 - "Component 6"
Cohesion: 0.10
Nodes (48): cancel_platform_import(), clear_platform_import_cancellation(), folder_by_type(), get_database_bootstrap_status(), get_platform_import_status(), import_database_from_mdb(), import_platform_database_from_mdb(), is_platform_import_cancelled() (+40 more)

### Community 7 - "Component 7"
Cohesion: 0.12
Nodes (18): buildFullscreenLayoutMetrics(), clamp(), DEFAULT_VIEWPORT, resolveDensityMode(), ResolvedFullscreenDensity, ViewportSnapshot, allocateTracks(), buildDetailLayoutSpec() (+10 more)

### Community 8 - "Component 8"
Cohesion: 0.13
Nodes (36): clean_unc_prefix(), download_media_asset(), find_all_media_variants(), find_case_insensitive_file(), get_candidate_paths(), read_file_bytes(), resolve_media_child_path(), resolve_media_path() (+28 more)

### Community 9 - "Community 9"
Cohesion: 0.29
Nodes (10): areMenuSoundEffectsEnabled(), audioCache, canPlayUiSoundEffects(), getAudioElement(), getNextRotatingUiSoundEffect(), getUiSoundEffectUrl(), playRotatingUiSoundEffect(), playRotatingUiSoundEffectAndWait() (+2 more)

### Community 10 - "Component 10"
Cohesion: 0.09
Nodes (60): amiga_disk_sort_key(), collect_amiga_sibling_disk_archives(), copy_test_emulator(), create_launch_temp_dir(), emulator_profile_display_name(), GameLaunchMetadata, games_table_has_column(), is_retroarch_profile() (+52 more)

### Community 11 - "Component 11"
Cohesion: 0.05
Nodes (40): Acorn BBC Micro, Alternative: environment variable, Atari 2600, Atari 800, BigBox Letter Jump, BigBox Rails, BigBox Rails (C64 Edition Theme), BigBox Search (+32 more)

### Community 12 - "Component 12"
Cohesion: 0.14
Nodes (27): allow_asset_path(), exit_app(), get_window_size(), log_debug_message_command(), open_directory_dialog(), open_file_dialog(), open_path_with_system_default(), open_retroarch_core_file_dialog() (+19 more)

### Community 13 - "Component 13"
Cohesion: 0.17
Nodes (15): ExtrasBigscreenNavigation, ExtrasDetailProps, isAudioExtra(), VisualExtraThumb(), VisualExtrasBrowser(), DetailNavigationHook, DetailNavProps, DetailZone (+7 more)

### Community 14 - "Component 14"
Cohesion: 0.07
Nodes (55): convertCsvToSqlite(), createPerformanceIndexes(), Database, ensureExtrasPlatformColumns(), ensureGamesPlatformColumns(), ensureImportPlatformColumns(), ensureTablePlatformColumns(), fs (+47 more)

### Community 15 - "Component 15"
Cohesion: 0.22
Nodes (21): get_secure_setting(), save_secure_setting(), decrypt_legacy_value(), decrypt_value(), encrypt_value(), encrypt_value_with_legacy_fixed_iv(), get_encryption_key(), get_legacy_encryption_key() (+13 more)

### Community 16 - "Component 16"
Cohesion: 0.10
Nodes (20): app, security, windows, enable, scope, build, beforeBuildCommand, beforeDevCommand (+12 more)

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (23): calculateDownNavigation(), calculateLeftNavigation(), calculateRightNavigation(), calculateUpNavigation(), NavigationParams, NavigationResult, NavigationState, BIGBOX_LETTERS (+15 more)

### Community 18 - "Component 18"
Cohesion: 0.10
Nodes (21): devDependencies, better-sqlite3, csv-parse, eslint, eslint-config-next, happy-dom, jsdom, @playwright/test (+13 more)

### Community 19 - "Component 19"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 20 - "Component 20"
Cohesion: 0.11
Nodes (18): scripts, build, coverage:backend, coverage:frontend, db:audit, db:convert, db:import, dev (+10 more)

### Community 21 - "Component 21"
Cohesion: 0.29
Nodes (16): get_db_game_count(), get_db_games(), get_game_detail(), get_game_extras(), get_genres(), get_secure_setting(), get_sub_genres(), save_secure_setting() (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (20): BigBoxHeader(), BigBoxHeaderProps, BigBoxViewProps, PlatformSwitcher(), PlatformSwitcherProps, UnifiedLibraryViewProps, Settings, UseBigBoxLibraryDataProps (+12 more)

### Community 23 - "Community 23"
Cohesion: 0.10
Nodes (22): BigBoxExitPrompt(), BigBoxExitPromptProps, ExitPromptFocus, ControllerSearchKeyboard(), ControllerSearchKeyboardProps, KEYBOARD_ROWS, KeyboardAction, KeyboardKey (+14 more)

### Community 24 - "Component 24"
Cohesion: 0.50
Nodes (3): GBBox 0.4.1 Release Notes, Highlights, Validation

### Community 25 - "Community 25"
Cohesion: 0.05
Nodes (46): defaultPlatformSettings, defaultSettings, LEGACY_PATH_FIELDS, migratePlatformSettings(), PlatformImportStatusSnapshot, SECURE_FIELDS, SettingsContext, SettingsContextType (+38 more)

### Community 27 - "Community 27"
Cohesion: 0.04
Nodes (51): background, error, error_container, inverse_on_surface, inverse_primary, inverse_surface, on_background, on_error (+43 more)

### Community 28 - "Component 28"
Cohesion: 0.17
Nodes (24): ActivePlatformState, DatabaseBootstrapStatus, DatabaseImportResult, EmulatorProfileTestRequest, ExtraRow, GameDetailRow, GameFilters, GameRow (+16 more)

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (11): 1. C64 iPad spike, 2. Mobile storage and launch service, 3. Mobile quality and submission, 4. Platform expansion, Architecture direction, Delivery stages, GBBox iPad/iOS feasibility plan, iOS storage and import (+3 more)

### Community 30 - "Component 30"
Cohesion: 0.20
Nodes (10): dependencies, next, playwright, react, react-dom, @tauri-apps/api, @tauri-apps/plugin-dialog, @tauri-apps/plugin-fs (+2 more)

### Community 31 - "Community 31"
Cohesion: 0.16
Nodes (18): AboutSettingsTab(), AboutSettingsTabProps, AppearanceSettingsTab(), AppearanceSettingsTabProps, ContentSettingsTab(), ContentSettingsTabProps, DisplaySettingsTab(), DisplaySettingsTabProps (+10 more)

### Community 32 - "Component 32"
Cohesion: 0.04
Nodes (48): background, error, error_container, inverse_on_surface, inverse_primary, inverse_surface, on_background, on_error (+40 more)

### Community 33 - "Component 33"
Cohesion: 0.25
Nodes (6): FOLDERS, fs, NODE_MODULES, path, PUBLIC_EMU, ROOT

### Community 34 - "Community 34"
Cohesion: 0.11
Nodes (24): BigBoxSessionState, BigBoxView(), getC64NavigationRails(), formatCount(), ListView(), BigBoxSessionState, UnifiedLibraryView(), useBigBoxLibraryData() (+16 more)

### Community 35 - "Community 35"
Cohesion: 0.10
Nodes (41): ArchiveItem, ArchiveSearchResponse, archive_download_url(), archive_download_urls_percent_encode_identifiers_and_filenames(), archive_search_pattern(), archive_search_token(), ArchiveFile, ArchiveItem (+33 more)

### Community 36 - "Component 36"
Cohesion: 0.33
Nodes (5): description, identifier, permissions, $schema, windows

### Community 37 - "Component 37"
Cohesion: 0.20
Nodes (14): BigBoxTileMediaProps, COVER_CACHE, getCoverUrl(), SCREENSHOT_CACHE, ImageWithFallback(), ImageWithFallbackProps, getResolvedCoverArtUrl(), findAllMediaVariants() (+6 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (12): BigBoxAlphabetRail(), BigBoxAlphabetRailProps, BigBoxTileMedia(), DetailLayoutProps, getTargetVisibleCards(), HorizontalRail(), HorizontalRailProps, BigBoxRailCategory (+4 more)

### Community 44 - "Community 44"
Cohesion: 0.04
Nodes (48): background, error, error_container, inverse_on_surface, inverse_primary, inverse_surface, on_background, on_error (+40 more)

### Community 46 - "Component 46"
Cohesion: 0.20
Nodes (9): Drop, MutexGuard, OsString, DbEnvGuard, init_debug_mode(), is_debug_mode(), run(), Option (+1 more)

### Community 53 - "Community 53"
Cohesion: 0.08
Nodes (45): ActivePlatformState, get_active_platform(), get_platform_import_status_sync(), get_supported_platforms(), set_active_platform(), ManifestEmulatorProfile, ManifestMediaCapabilities, ManifestPlatform (+37 more)

### Community 54 - "Community 54"
Cohesion: 0.40
Nodes (4): Amiga GameBase CSV Export, D-Generation Evidence, Exported Tables, Relevant Schema Notes

### Community 55 - "Community 55"
Cohesion: 0.50
Nodes (3): GBBox 0.5.3 Release Notes, Highlights, Validation

### Community 56 - "Community 56"
Cohesion: 0.17
Nodes (17): HeaderZone, SettingsView(), SettingsViewProps, useTheme(), PLATFORM_PROFILES, MaintenanceSettingsTab(), PathRow(), PathsSettingsTab() (+9 more)

### Community 57 - "Community 57"
Cohesion: 0.22
Nodes (7): metadata, ThemeDecorator(), ThemeDecoratorProps, ERROR_SOUNDS, UiSoundRuntime(), SettingsProvider(), ThemeProvider()

### Community 58 - "Community 58"
Cohesion: 0.40
Nodes (4): GBBox 0.5.0 Release Notes, Highlights, Security and delivery, Validation

### Community 59 - "Community 59"
Cohesion: 0.50
Nodes (4): tauri-dev-debug.sh script, frontend_ready(), GAMEBASEBOX_DEBUG, PATH

### Community 60 - "Community 60"
Cohesion: 0.18
Nodes (10): engines, node, name, overrides, brace-expansion, esbuild, postcss, sharp (+2 more)

### Community 61 - "Community 61"
Cohesion: 0.50
Nodes (3): GBBox 0.5.4 Release Notes, Highlights, Validation

### Community 62 - "Community 62"
Cohesion: 0.50
Nodes (3): GBBox 0.5.1 Release Notes, Highlights, Validation

### Community 63 - "Community 63"
Cohesion: 0.50
Nodes (3): GBBox 0.5.2 Release Notes, Highlights, Validation

### Community 64 - "Community 64"
Cohesion: 0.67
Nodes (3): tauri-dev.sh script, frontend_ready(), PATH

### Community 65 - "Community 65"
Cohesion: 0.18
Nodes (22): convertExtraVideo(), downloadArchiveExtraVideo(), exitApp(), getActivePlatform(), getDatabaseBootstrapStatus(), getPlatformImportStatus(), getSecureSetting(), getSupportedPlatforms() (+14 more)

### Community 66 - "Community 66"
Cohesion: 0.39
Nodes (5): BigBoxFooter(), BigBoxFooterProps, GamepadControlHint, GamepadViewContext, useGamepadControls()

### Community 67 - "Component 67"
Cohesion: 0.47
Nodes (4): EmuMoviesSearchResult, getVideoSnapUrl(), loginEmuMovies(), searchEmuMovies()

### Community 68 - "Community 68"
Cohesion: 0.25
Nodes (7): GBBox 0.1.0 Release Notes, Highlights, Installation and Artifacts, Known Limitations, Migration from 64Box, Supported Imports, Validation

### Community 69 - "Community 69"
Cohesion: 0.20
Nodes (9): Architecture Overview, Beads Issue Tracker, Build & Test, Conventions & Patterns, graphify, Project Instructions for AI Agents, Quick Reference, Rules (+1 more)

### Community 70 - "Community 70"
Cohesion: 0.04
Nodes (48): background, error, error_container, inverse_on_surface, inverse_primary, inverse_surface, on_background, on_error (+40 more)

### Community 71 - "Community 71"
Cohesion: 0.10
Nodes (25): MusicianPhoto(), MusicianPhotoProps, MusicPlayer(), MusicPlayerProps, SidPlayer(), Props, StatusRow(), useSettings() (+17 more)

### Community 72 - "Community 72"
Cohesion: 0.25
Nodes (7): getCachedGameDetail(), mockGames, getDbGameCount(), getDbGameDetail(), getDbGames(), getGameExtras(), getSubGenres()

### Community 73 - "Community 73"
Cohesion: 0.15
Nodes (13): ExtrasDetail(), PLATFORM_CORE_MAP, WasmPlayer(), WasmPlayerProps, PLATFORM_EMULATOR_PROFILES, buildLaunchRequest(), buildPlatformAssetPath(), getPlatformLaunchSettings() (+5 more)

### Community 74 - "Community 74"
Cohesion: 0.14
Nodes (13): 1. Project Vision, 2. Core Architectural Principles, 3. Established Themes, 4. Key Screen Specifications, 5. Technical Requirements (Summary), 6. Current Status, Arcade Void & Neon Acrylic, C64 Edition (+5 more)

### Community 75 - "Community 75"
Cohesion: 0.18
Nodes (8): AUDIO_EXTENSIONS, isVideoExtra(), ResolvedExtraMedia(), VIDEO_EXTENSIONS, buildExtraAssetPath(), ExtraVideoDownloadProgress, ExtraVideoResolution, listenExtraVideoDownloadProgress()

### Community 76 - "Community 76"
Cohesion: 0.18
Nodes (10): displayName, styleGuidelines, theme, bodyFont, colorMode, customColor, font, headlineFont (+2 more)

### Community 77 - "Community 77"
Cohesion: 0.20
Nodes (9): displayName, styleGuidelines, theme, bodyFont, colorMode, customColor, font, headlineFont (+1 more)

### Community 78 - "Community 78"
Cohesion: 0.20
Nodes (9): displayName, styleGuidelines, theme, bodyFont, colorMode, customColor, font, headlineFont (+1 more)

### Community 79 - "Community 79"
Cohesion: 0.20
Nodes (9): displayName, styleGuidelines, theme, bodyFont, colorMode, customColor, font, headlineFont (+1 more)

### Community 80 - "Community 80"
Cohesion: 0.08
Nodes (24): detailCache, DetailFullscreenMedia, DetailViewProps, GridViewProps, ImageSlider(), ImageSliderProps, ListViewProps, ScrapeButtonProps (+16 more)

### Community 81 - "Community 81"
Cohesion: 0.29
Nodes (7): isNativePath(), resolvePlayableSapUrl(), SapPlayer(), SapPlayerProps, SapPlayerRuntime, SapRuntimeConstructor, Window

### Community 86 - "Community 86"
Cohesion: 0.17
Nodes (16): DOC_EXT, DOC_FOLDERS, GAME_EXT, GAME_FOLDERS, getExtraExtension(), getExtraLaunchLabel(), getExtraSourceLabel(), IMG_EXT (+8 more)

### Community 87 - "Community 87"
Cohesion: 0.13
Nodes (20): ThemeContext, ThemeContextType, DatabaseSetupView(), folderLabels, RequiredPlatformFolderKey, arcadeVoidTheme, c64EditionTheme, cyberpunkCrtTheme (+12 more)

### Community 88 - "Community 88"
Cohesion: 0.50
Nodes (3): GBBox 0.6.0 Release Notes, Highlights, Validation

### Community 90 - "Community 90"
Cohesion: 0.33
Nodes (5): SidPlayerProps, SidPlayerRuntime, SidRuntimeConstructor, Window, downloadMediaAsset()

### Community 91 - "Component 91"
Cohesion: 0.22
Nodes (7): ScreenScraperApiResponse, ScreenScraperGameResponse, ScreenScraperLocalizedName, ScreenScraperMedia, ScreenScraperMediaResponse, ScreenScraperResult, ScreenScraperSynopsis

### Community 92 - "Community 92"
Cohesion: 0.25
Nodes (4): PlatformImportJobState, cancelPlatformImport(), importPlatformDatabaseFromMdb(), PlatformDatabaseImportResult

### Community 93 - "Community 93"
Cohesion: 0.29
Nodes (6): 🕹️ Exit Controls & Windowed Interface, GBBox 0.6.1 Release Notes, Highlights, 🎮 Multi-Platform Embedded WebAssembly Emulation (Phase 1), 📋 Platform Manifest & Capabilities, Validation & CI/CD

### Community 94 - "Community 94"
Cohesion: 0.22
Nodes (8): 🎮 6 New GameBase Platforms Added, 📋 Active Platform Dropdown: Imported-First & Obvious Unimported Indicator, 🐛 Emulation Routing Fix, ⚙️ Enhanced Settings Management, GBBox 0.6.2 Release Notes, 🖼️ Platform Backgrounds & Theme Customization, 🧪 Verification & Reliability, What's New in 0.6.2

### Community 96 - "Component 96"
Cohesion: 0.08
Nodes (25): ActivePlatformStateResponse, assetUrlCache, DatabaseBootstrapStatus, DatabaseImportResult, EmulatorProfileTestRequest, ExtraVideoActionResult, findAllMediaVariantsCache, joinLocalMediaPath() (+17 more)

### Community 103 - "Community 103"
Cohesion: 0.50
Nodes (3): GBBox 0.3.1 Release Notes, Highlights, Validation

### Community 105 - "Community 105"
Cohesion: 0.33
Nodes (5): GBBox 0.2.0 Release Notes, Highlights, Known Limitations, Supported Imports, Validation

### Community 107 - "Community 107"
Cohesion: 0.29
Nodes (6): Amiga Multi-Disk Launching, GBBox 0.3.0 Release Notes, Highlights, Known Limitations, Supported Imports, Validation

### Community 113 - "Community 113"
Cohesion: 0.50
Nodes (3): GBBox 0.4.0 Release Notes, Highlights, Validation

### Community 128 - "Component 128"
Cohesion: 0.33
Nodes (4): TheGamesDBGameLookupResponse, TheGamesDBImage, TheGamesDBImageLookupResponse, TheGamesDBResult

## Knowledge Gaps
- **671 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+666 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Component 18` to `Community 60`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `get_db_path()` connect `Database & Performance Paradigms` to `Component 10`, `WASM Emulator Core & Localization`, `Component 6`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `PlatformId` connect `Community 22` to `Detail View Layout & Navigation`, `Community 2`, `Community 34`, `Community 71`, `Community 86`, `Community 56`, `Community 25`, `Community 92`, `Community 31`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _671 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Detail View Layout & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.11397849462365592 - nodes in this community are weakly interconnected._
- **Should `WASM Emulator Core & Localization` be split into smaller, more focused modules?**
  _Cohesion score 0.07347915242652085 - nodes in this community are weakly interconnected._
- **Should `Database & Performance Paradigms` be split into smaller, more focused modules?**
  _Cohesion score 0.11049074346165148 - nodes in this community are weakly interconnected._