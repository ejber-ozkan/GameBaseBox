# Graph Report - GameBaseBox  (2026-07-18)

## Corpus Check
- 160 files · ~121,767 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1705 nodes · 3537 edges · 98 communities (89 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 70 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1574c900`
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
- [[_COMMUNITY_Component 91|Component 91]]
- [[_COMMUNITY_Component 96|Component 96]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 107|Community 107]]
- [[_COMMUNITY_Community 113|Community 113]]
- [[_COMMUNITY_Component 128|Component 128]]

## God Nodes (most connected - your core abstractions)
1. `String` - 51 edges
2. `namedColors` - 51 edges
3. `Result` - 48 edges
4. `namedColors` - 48 edges
5. `namedColors` - 48 edges
6. `namedColors` - 48 edges
7. `useSettings()` - 40 edges
8. `isTauri()` - 40 edges
9. `Game` - 39 edges
10. `launch_emulator()` - 31 edges

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

## Communities (98 total, 9 thin omitted)

### Community 0 - "Detail View Layout & Navigation"
Cohesion: 0.13
Nodes (19): buildPersonnel(), buildVersions(), clampTextLines(), formatVersionLabel(), getArchiveNotes(), getMusicGlyph(), getPlayerLabel(), getPlayersDetailLabel() (+11 more)

### Community 1 - "Core Architecture & Requirements"
Cohesion: 0.22
Nodes (9): EmulatorJS vice_x64 Core, Project 64Box Requirements, SID Player Requirements, SQLite Database Requirements, Tauri Desktop Wrapper Requirements, WASM Emulation Requirements, EmulatorJS Localization, WASM Emulator Iframe (+1 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (15): getRequiredPlatformFolderKeys(), Home(), LibraryApp(), SetupFolderKey, AlphabetJumpBar(), AlphabetJumpBarProps, LETTERS, AppLaunchSplash() (+7 more)

### Community 3 - "WASM Emulator Core & Localization"
Cohesion: 0.07
Nodes (52): build_game_detail_query(), build_game_summary_query(), get_db_game_count(), get_db_game_count_blocking(), get_db_games(), get_db_games_blocking(), get_game_detail(), get_game_detail_blocking() (+44 more)

### Community 4 - "Database & Performance Paradigms"
Cohesion: 0.11
Nodes (75): R, cleanup_export_directory(), configure_runtime_db_path(), create_export_directory(), create_import_temp_db_path(), create_runtime_db_path(), csv_record_has_unclosed_quotes(), ensure_cover_index() (+67 more)

### Community 6 - "Component 6"
Cohesion: 0.10
Nodes (48): cancel_platform_import(), clear_platform_import_cancellation(), get_database_bootstrap_status(), get_platform_import_status(), import_database_from_mdb(), import_platform_database_from_mdb(), is_platform_import_cancelled(), open_mdb_file_dialog() (+40 more)

### Community 7 - "Component 7"
Cohesion: 0.20
Nodes (12): allocateTracks(), buildDetailLayoutSpec(), clamp(), DetailDesignViewport, DetailResolutionTier, DetailTierDefinition, DetailViewportSnapshot, resolveDetailDesignViewport() (+4 more)

### Community 8 - "Component 8"
Cohesion: 0.13
Nodes (36): clean_unc_prefix(), download_media_asset(), find_all_media_variants(), find_case_insensitive_file(), get_candidate_paths(), read_file_bytes(), resolve_media_child_path(), resolve_media_path() (+28 more)

### Community 9 - "Community 9"
Cohesion: 0.29
Nodes (10): areMenuSoundEffectsEnabled(), audioCache, canPlayUiSoundEffects(), getAudioElement(), getNextRotatingUiSoundEffect(), getUiSoundEffectUrl(), playRotatingUiSoundEffect(), playRotatingUiSoundEffectAndWait() (+2 more)

### Community 10 - "Component 10"
Cohesion: 0.09
Nodes (59): amiga_disk_sort_key(), collect_amiga_sibling_disk_archives(), copy_test_emulator(), create_launch_temp_dir(), emulator_profile_display_name(), GameLaunchMetadata, games_table_has_column(), is_retroarch_profile() (+51 more)

### Community 11 - "Component 11"
Cohesion: 0.05
Nodes (36): Acorn BBC Micro, Alternative: environment variable, Atari 2600, Atari 800, BigBox Letter Jump, BigBox Rails, BigBox Search, Building the SQLite Database (+28 more)

### Community 12 - "Component 12"
Cohesion: 0.15
Nodes (25): allow_asset_path(), exit_app(), get_window_size(), log_debug_message_command(), open_directory_dialog(), open_file_dialog(), open_path_with_system_default(), open_validated_path() (+17 more)

### Community 13 - "Component 13"
Cohesion: 0.16
Nodes (16): ExtrasBigscreenNavigation, ExtrasDetailProps, ImageWithFallback(), AUDIO_EXTENSIONS, isAudioExtra(), isVideoExtra(), ResolvedExtraMedia(), VIDEO_EXTENSIONS (+8 more)

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
Cohesion: 0.29
Nodes (9): calculateDownNavigation(), calculateLeftNavigation(), calculateRightNavigation(), calculateUpNavigation(), NavigationParams, NavigationResult, NavigationState, KeyEventLike (+1 more)

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
Cohesion: 0.13
Nodes (21): DETAIL_CONFIG, detailCache, DetailFullscreenMedia, DetailFullscreenRequest, DetailLayoutProps, DetailView(), DetailViewProps, getCachedGameDetail() (+13 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (20): BigBoxExitPrompt(), BigBoxExitPromptProps, ExitPromptFocus, ControllerSearchKeyboard(), ControllerSearchKeyboardProps, KEYBOARD_ROWS, KeyboardAction, KeyboardKey (+12 more)

### Community 24 - "Component 24"
Cohesion: 0.50
Nodes (3): GBBox 0.4.1 Release Notes, Highlights, Validation

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (14): BigBoxTileMediaProps, COVER_CACHE, getCoverUrl(), SCREENSHOT_CACHE, ImageWithFallbackProps, MusicianPhotoProps, getResolvedCoverArtUrl(), findAllMediaVariants() (+6 more)

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
Cohesion: 0.08
Nodes (24): defaultPlatformSettings, defaultSettings, LEGACY_PATH_FIELDS, migratePlatformSettings(), PlatformImportStatusSnapshot, SECURE_FIELDS, SettingsContext, createDefaultPlatformFolders() (+16 more)

### Community 32 - "Component 32"
Cohesion: 0.04
Nodes (48): background, error, error_container, inverse_on_surface, inverse_primary, inverse_surface, on_background, on_error (+40 more)

### Community 33 - "Component 33"
Cohesion: 0.25
Nodes (6): FOLDERS, fs, NODE_MODULES, path, PUBLIC_EMU, ROOT

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (18): folderKeyByType, getManifestPlatformProfile(), getPlatformLaunchCapabilities(), getRequiredPlatformFolderKeys(), LaunchProvider, LaunchRuntime, ManifestEmulatorProfile, ManifestPlatformProfile (+10 more)

### Community 35 - "Community 35"
Cohesion: 0.10
Nodes (41): ArchiveItem, ArchiveSearchResponse, archive_download_url(), archive_download_urls_percent_encode_identifiers_and_filenames(), archive_search_pattern(), archive_search_token(), ArchiveFile, ArchiveItem (+33 more)

### Community 36 - "Component 36"
Cohesion: 0.33
Nodes (5): description, identifier, permissions, $schema, windows

### Community 37 - "Component 37"
Cohesion: 0.22
Nodes (8): engines, node, name, overrides, esbuild, postcss, private, version

### Community 38 - "Community 38"
Cohesion: 0.10
Nodes (20): MusicianPhoto(), Props, StatusRow(), DetailGameTitle(), DetailGameTitleProps, OUTLINED_TITLE_STYLE, DetailTitleBanner(), DetailTitleBannerProps (+12 more)

### Community 44 - "Community 44"
Cohesion: 0.04
Nodes (48): background, error, error_container, inverse_on_surface, inverse_primary, inverse_surface, on_background, on_error (+40 more)

### Community 46 - "Component 46"
Cohesion: 0.20
Nodes (9): Drop, MutexGuard, OsString, DbEnvGuard, init_debug_mode(), is_debug_mode(), run(), Option (+1 more)

### Community 53 - "Community 53"
Cohesion: 0.08
Nodes (44): ActivePlatformState, get_active_platform(), get_platform_import_status_sync(), get_supported_platforms(), set_active_platform(), ManifestEmulatorProfile, ManifestMediaCapabilities, ManifestPlatform (+36 more)

### Community 54 - "Community 54"
Cohesion: 0.40
Nodes (4): Amiga GameBase CSV Export, D-Generation Evidence, Exported Tables, Relevant Schema Notes

### Community 55 - "Community 55"
Cohesion: 0.50
Nodes (3): GBBox 0.5.3 Release Notes, Highlights, Validation

### Community 56 - "Community 56"
Cohesion: 0.13
Nodes (17): BigBoxFooter(), BigBoxSessionState, BigBoxView(), WasmPlayer(), WasmPlayerProps, useBigBoxLibraryData(), useBigBoxNavigation(), useBigBoxScrollSync() (+9 more)

### Community 57 - "Community 57"
Cohesion: 0.15
Nodes (19): HeaderZone, SettingsView(), SettingsViewProps, useTheme(), AboutSettingsTab(), AboutSettingsTabProps, ContentSettingsTab(), MaintenanceSettingsTab() (+11 more)

### Community 58 - "Community 58"
Cohesion: 0.40
Nodes (4): GBBox 0.5.0 Release Notes, Highlights, Security and delivery, Validation

### Community 59 - "Community 59"
Cohesion: 0.50
Nodes (4): tauri-dev-debug.sh script, frontend_ready(), GAMEBASEBOX_DEBUG, PATH

### Community 60 - "Community 60"
Cohesion: 0.19
Nodes (11): ExtrasDetail(), PLATFORM_EMULATOR_PROFILES, supportsEmbeddedEmulation(), buildLaunchRequest(), buildPlatformAssetPath(), getPlatformLaunchSettings(), LaunchSource, PlatformLaunchSettings (+3 more)

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
Cohesion: 0.17
Nodes (11): Agent Instructions, Beads Issue Tracker, Codebase Navigation with Graphify, Ejber's Ways of working, Non-Interactive Shell Commands, Quick Reference, Quick Reference, Rules (+3 more)

### Community 66 - "Community 66"
Cohesion: 0.16
Nodes (14): BigBoxAlphabetRail(), BigBoxAlphabetRailProps, BigBoxTileMedia(), getTargetVisibleCards(), HorizontalRail(), HorizontalRailProps, BigBoxRailCategory, buildFullscreenLayoutMetrics() (+6 more)

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
Cohesion: 0.14
Nodes (15): MusicPlayer(), MusicPlayerProps, isNativePath(), resolvePlayableSapUrl(), SapPlayer(), SapPlayerProps, SapPlayerRuntime, SapRuntimeConstructor (+7 more)

### Community 72 - "Community 72"
Cohesion: 0.21
Nodes (12): ThemeContext, ThemeContextType, arcadeVoidTheme, c64EditionTheme, cyberpunkCrtTheme, applyTheme(), BUILT_IN_THEMES, Theme (+4 more)

### Community 73 - "Community 73"
Cohesion: 0.31
Nodes (7): formatCount(), ListView(), ListViewProps, getThemeListPresentation(), presentations, sharedColumns, ThemeListPresentation

### Community 74 - "Community 74"
Cohesion: 0.14
Nodes (13): 1. Project Vision, 2. Core Architectural Principles, 3. Established Themes, 4. Key Screen Specifications, 5. Technical Requirements (Summary), 6. Current Status, Arcade Void & Neon Acrylic, C64 Edition (+5 more)

### Community 75 - "Community 75"
Cohesion: 0.31
Nodes (9): AppearanceSettingsTab(), AppearanceSettingsTabProps, ContentSettingsTabProps, PathsSettingsTabProps, ScrapersSettingsTabProps, ThemedToggle(), ThemedToggleProps, ContentNavProps (+1 more)

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
Cohesion: 0.20
Nodes (8): mockGames, LETTER_RAIL_CACHE, getDbGameCount(), getDbGameDetail(), getDbGames(), getGameExtras(), getGenres(), getSubGenres()

### Community 81 - "Community 81"
Cohesion: 0.17
Nodes (16): DOC_EXT, DOC_FOLDERS, GAME_EXT, GAME_FOLDERS, getExtraExtension(), getExtraLaunchLabel(), getExtraSourceLabel(), IMG_EXT (+8 more)

### Community 86 - "Community 86"
Cohesion: 0.22
Nodes (7): metadata, ThemeDecorator(), ThemeDecoratorProps, ERROR_SOUNDS, UiSoundRuntime(), SettingsProvider(), ThemeProvider()

### Community 87 - "Community 87"
Cohesion: 0.09
Nodes (30): BigBoxHeader(), BigBoxHeaderProps, BigBoxViewProps, PlatformSwitcher(), PlatformSwitcherProps, Settings, SettingsContextType, BIGBOX_LETTERS (+22 more)

### Community 88 - "Community 88"
Cohesion: 0.33
Nodes (5): DatabaseSetupView(), DatabaseSetupViewProps, folderLabels, RequiredPlatformFolderKey, PlatformFolderSettings

### Community 91 - "Component 91"
Cohesion: 0.22
Nodes (7): ScreenScraperApiResponse, ScreenScraperGameResponse, ScreenScraperLocalizedName, ScreenScraperMedia, ScreenScraperMediaResponse, ScreenScraperResult, ScreenScraperSynopsis

### Community 96 - "Component 96"
Cohesion: 0.08
Nodes (50): ActivePlatformStateResponse, assetUrlCache, cancelPlatformImport(), convertExtraVideo(), DatabaseBootstrapStatus, DatabaseImportResult, downloadArchiveExtraVideo(), downloadMediaAsset() (+42 more)

### Community 103 - "Community 103"
Cohesion: 0.50
Nodes (3): GBBox 0.3.1 Release Notes, Highlights, Validation

### Community 104 - "Community 104"
Cohesion: 0.10
Nodes (20): GridView(), GridViewProps, ImageSlider(), ImageSliderProps, ScrapeButtonProps, C64EditionGrid(), C64EditionGridProps, WindowGameListSection() (+12 more)

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
- **656 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+651 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_db_path()` connect `Database & Performance Paradigms` to `Component 10`, `WASM Emulator Core & Localization`, `Component 6`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `useSettings()` connect `Community 22` to `Detail View Layout & Navigation`, `Community 2`, `Community 66`, `Community 38`, `Community 71`, `Community 104`, `Community 72`, `Component 13`, `Community 31`, `Community 86`, `Community 56`, `Community 25`, `Community 88`, `Community 60`, `Community 57`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `open_db_connection()` connect `WASM Emulator Core & Localization` to `Database & Performance Paradigms`, `Component 15`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _656 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Detail View Layout & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.12962962962962962 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1383399209486166 - nodes in this community are weakly interconnected._
- **Should `WASM Emulator Core & Localization` be split into smaller, more focused modules?**
  _Cohesion score 0.07347915242652085 - nodes in this community are weakly interconnected._