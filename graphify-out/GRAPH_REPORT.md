# Graph Report - GameBaseBox  (2026-08-16)

## Corpus Check
- 201 files · ~157,779 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1427 nodes · 3727 edges · 68 communities (61 shown, 7 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 63

## God Nodes (most connected - your core abstractions)
1. `useTranslation()` - 58 edges
2. `Game` - 45 edges
3. `useSettings()` - 43 edges
4. `isTauri()` - 43 edges
5. `useTheme()` - 35 edges
6. `launch_emulator()` - 31 edges
7. `invoke()` - 30 edges
8. `UnifiedDetailLayout()` - 28 edges
9. `PlatformId` - 27 edges
10. `useGamepad()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `test_build_game_summary_query_preserves_requested_id_order_in_sql()` --calls--> `build_game_summary_query()`  [INFERRED]
  src-tauri/src/commands/db/tests.rs → src-tauri/src/commands/db/games.rs
- `test_init_database_repairs_stale_game_view_without_platform_id()` --calls--> `init_database()`  [INFERRED]
  src-tauri/src/commands/db/tests.rs → src-tauri/src/database.rs
- `get_db_games_blocking()` --calls--> `load_ordered_game_ids_with_fallback()`  [INFERRED]
  src-tauri/src/commands/db/games.rs → src-tauri/src/commands/db/querying.rs
- `get_db_game_count_blocking()` --calls--> `load_game_count_with_fallback()`  [INFERRED]
  src-tauri/src/commands/db/games.rs → src-tauri/src/commands/db/querying.rs
- `test_build_game_query_invalid_fts_input_matches_nothing()` --calls--> `build_game_query()`  [INFERRED]
  src-tauri/src/commands/db/tests.rs → src-tauri/src/commands/db/querying.rs

## Import Cycles
- None detected.

## Communities (68 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (77): R, cleanup_export_directory(), configure_runtime_db_path(), create_export_directory(), create_import_temp_db_path(), create_runtime_db_path(), csv_record_has_unclosed_quotes(), ensure_cover_index() (+69 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (60): EmulatorProfileTestRequest, FnOnce, LaunchRequest, LaunchResult, amiga_disk_sort_key(), collect_amiga_sibling_disk_archives(), copy_test_emulator(), create_launch_temp_dir() (+52 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (58): Row, build_game_detail_query(), build_game_summary_query(), get_db_game_count(), get_db_game_count_blocking(), get_db_games(), get_db_games_blocking(), get_game_detail() (+50 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (55): convertCsvToSqlite(), createPerformanceIndexes(), Database, ensureExtrasPlatformColumns(), ensureGamesPlatformColumns(), ensureImportPlatformColumns(), ensureTablePlatformColumns(), fs (+47 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (28): apply_game_filters(), build_fts_match_query(), build_game_count_query(), build_game_query(), GameQueryBuilder, load_game_count_with_fallback(), load_ordered_game_ids_with_fallback(), Connection (+20 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (46): DatabaseBootstrapStatus, PlatformDatabaseImportResult, cancel_platform_import(), clear_platform_import_cancellation(), folder_by_type(), get_database_bootstrap_status(), get_platform_import_status(), import_database_from_mdb() (+38 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (35): detailCache, DetailFullscreenMedia, DetailFullscreenRequest, DetailLayoutProps, DetailView(), DetailViewProps, getCachedGameDetail(), GridView() (+27 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (39): archive_download_url(), archive_download_urls_percent_encode_identifiers_and_filenames(), archive_search_pattern(), archive_search_token(), ArchiveFile, ArchiveItem, ArchiveMetadata, ArchiveSearchEnvelope (+31 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (37): ATARI800_REFERENCE_MDB_PATH, createDefaultPlatformFolders(), createDefaultPlatformLibraryStatus(), createDefaultPlatformNavigation(), createDefaultPlatformSettings(), EMBEDDED_EMULATION_PLATFORM_IDS, getPlatformProfile(), PLATFORM_EMULATOR_PROFILES (+29 more)

### Community 9 - "Community 9"
Cohesion: 0.10
Nodes (41): ActivePlatformState, ManifestEmulatorProfile, SetActivePlatformResponse, get_active_platform(), get_platform_import_status_sync(), get_supported_platforms(), PlatformImportStatus, PlatformProfile (+33 more)

### Community 10 - "Community 10"
Cohesion: 0.05
Nodes (41): better-sqlite3, csv-parse, eslint, eslint-config-next, happy-dom, jsdom, devDependencies, better-sqlite3 (+33 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (29): AlphabetJumpBar(), AlphabetJumpBarProps, LETTERS, BigBoxSessionState, BigBoxView(), getC64NavigationRails(), ERROR_SOUNDS, UiSoundRuntime() (+21 more)

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (36): ResolvedPath, ScannedRom, clean_unc_prefix(), download_media_asset(), find_all_media_variants(), find_case_insensitive_file(), get_candidate_paths(), read_file_bytes() (+28 more)

### Community 13 - "Community 13"
Cohesion: 0.10
Nodes (24): DetailGameTitle(), DetailGameTitleProps, OUTLINED_TITLE_STYLE, DetailTitleBanner(), DetailTitleBannerProps, ImageSlider(), ImageSliderProps, MusicianPhoto() (+16 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (27): calculateDownNavigation(), calculateLeftNavigation(), calculateRightNavigation(), calculateUpNavigation(), NavigationParams, NavigationResult, NavigationState, BIGBOX_LETTERS (+19 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (27): allow_asset_path(), exit_app(), get_window_size(), log_debug_message_command(), open_directory_dialog(), open_file_dialog(), open_path_with_system_default(), open_retroarch_core_file_dialog() (+19 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (25): ImportedLibraryContent(), loadSubGenres(), SetupFolderKey, AppLaunchSplash(), BigBoxSessionState, getAlphabetRailCacheKey(), getFlatLibraryLoadLimit(), LETTER_RAIL_CACHE (+17 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (26): AboutSettingsTab(), AboutSettingsTabProps, AppearanceSettingsTab(), ContentSettingsTab(), DisplaySettingsTab(), InteractionSettingsTab(), MaintenanceSettingsTab(), MediaSettingsTab() (+18 more)

### Community 18 - "Community 18"
Cohesion: 0.13
Nodes (25): BigBoxHeader(), BigBoxHeaderProps, BigBoxViewProps, LibraryHeader(), LibraryHeaderProps, MusicPlayerProps, PlatformSwitcher(), PlatformSwitcherProps (+17 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (23): C64ShaderBackground(), buildPersonnel(), buildVersions(), clampTextLines(), formatVersionLabel(), getArchiveNotes(), getMusicGlyph(), getPlayerLabel() (+15 more)

### Community 20 - "Community 20"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (21): formatCount(), ListView(), ListViewProps, ThemeContextType, getC64ViewingPath(), getCyberpunkViewingPath(), arcadeVoidTheme, c64EditionTheme (+13 more)

### Community 22 - "Community 22"
Cohesion: 0.07
Nodes (26): $APPLOCALDATA/**/*, icons/128x128@2x.png, icons/128x128.png, icons/32x32.png, icons/icon.icns, icons/icon.ico, app, security (+18 more)

### Community 23 - "Community 23"
Cohesion: 0.12
Nodes (21): BigBoxExitPrompt(), BigBoxExitPromptProps, ExitPromptFocus, ControllerSearchKeyboard(), ControllerSearchKeyboardProps, KEYBOARD_ROWS, KeyboardAction, KeyboardKey (+13 more)

### Community 24 - "Community 24"
Cohesion: 0.08
Nodes (23): ActivePlatformStateResponse, assetUrlCache, DatabaseBootstrapStatus, DatabaseImportResult, EmulatorProfileTestRequest, ExtraVideoActionResult, findAllMediaVariantsCache, launchEmulator() (+15 more)

### Community 25 - "Community 25"
Cohesion: 0.21
Nodes (21): get_secure_setting(), Option, Result, String, save_secure_setting(), decrypt_legacy_value(), decrypt_value(), encrypt_value() (+13 more)

### Community 26 - "Community 26"
Cohesion: 0.17
Nodes (16): BigBoxAlphabetRail(), BigBoxAlphabetRailProps, getTargetVisibleCards(), HorizontalRail(), HorizontalRailProps, BigBoxRailCategory, buildFullscreenLayoutMetrics(), clamp() (+8 more)

### Community 27 - "Community 27"
Cohesion: 0.11
Nodes (19): next, dependencies, next, playwright, react, react-dom, @tauri-apps/api, @tauri-apps/plugin-dialog (+11 more)

### Community 28 - "Community 28"
Cohesion: 0.22
Nodes (19): getRequiredPlatformFolderKeys(), Home(), LibraryApp(), downloadMediaAsset(), getActivePlatform(), getDatabaseBootstrapStatus(), getPlatformImportStatus(), getWindowSize() (+11 more)

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (11): AppearanceSettingsTabProps, ContentSettingsTabProps, DisplaySettingsTabProps, InteractionSettingsTabProps, MediaSettingsTabProps, PathsSettingsTabProps, ScrapersSettingsTabProps, ThemedToggle() (+3 more)

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (17): applyPlatformImportStatuses(), defaultPlatformSettings, defaultSettings, isPlatformImportStatus(), LEGACY_PATH_FIELDS, migratePlatformSettings(), PlatformImportStatusSnapshot, resolveStartupPlatformId() (+9 more)

### Community 31 - "Community 31"
Cohesion: 0.11
Nodes (18): scripts, build, coverage:backend, coverage:frontend, db:audit, db:convert, db:import, dev (+10 more)

### Community 32 - "Community 32"
Cohesion: 0.16
Nodes (16): DOC_EXT, DOC_FOLDERS, GAME_EXT, GAME_FOLDERS, getExtraExtension(), getExtraLaunchLabel(), getExtraSourceLabel(), IMG_EXT (+8 more)

### Community 33 - "Community 33"
Cohesion: 0.19
Nodes (16): AUDIO_EXTENSIONS, formatBytes(), formatTimeRemaining(), isVideoExtra(), normalizeVideoPath(), ResolvedExtraMedia(), VIDEO_EXTENSIONS, buildExtraAssetPath() (+8 more)

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (14): isAudioExtra(), VisualExtraThumb(), VisualExtrasBrowser(), ExtrasBigscreenNavigation, ExtrasDetailProps, PlayButtonProps, DetailNavigationHook, DetailNavProps (+6 more)

### Community 35 - "Community 35"
Cohesion: 0.21
Nodes (13): detectSystemLanguage(), flatDictionaries, I18nContext, I18nContextType, I18nProvider(), rawDictionaries, DEFAULT_LANGUAGE, normalizeLanguageCode() (+5 more)

### Community 36 - "Community 36"
Cohesion: 0.17
Nodes (14): BigBoxTileMedia(), loadMedia(), BigBoxTileMediaProps, COVER_CACHE, getCoverUrl(), getScreenshotUrls(), normalizePath(), SCREENSHOT_CACHE (+6 more)

### Community 37 - "Community 37"
Cohesion: 0.27
Nodes (10): ExtrasDetail(), PlayButton(), PlayLaunchTarget, supportsEmbeddedEmulation(), buildLaunchRequest(), buildPlatformAssetPath(), getPlatformLaunchSettings(), LaunchSource (+2 more)

### Community 38 - "Community 38"
Cohesion: 0.21
Nodes (12): allocateTracks(), buildDetailLayoutSpec(), clamp(), DetailDesignViewport, DetailResolutionTier, DetailTierDefinition, DetailViewportSnapshot, resolveDetailDesignViewport() (+4 more)

### Community 39 - "Community 39"
Cohesion: 0.37
Nodes (11): VisualExtraCard(), loadVariants(), ImageWithFallback(), resolveSource(), ImageWithFallbackProps, findAllMediaVariants(), getAssetUrl(), getMediaUrl() (+3 more)

### Community 40 - "Community 40"
Cohesion: 0.17
Nodes (11): engines, node, name, overrides, brace-expansion, esbuild, nanoid, postcss (+3 more)

### Community 41 - "Community 41"
Cohesion: 0.22
Nodes (9): Drop, MutexGuard, OsString, DbEnvGuard, init_debug_mode(), is_debug_mode(), Option, Self (+1 more)

### Community 42 - "Community 42"
Cohesion: 0.29
Nodes (6): metadata, ThemeDecorator(), ThemeDecoratorProps, ThemeContext, ThemeProvider(), applyTheme()

### Community 43 - "Community 43"
Cohesion: 0.22
Nodes (8): core:default, log:default, main, description, identifier, permissions, $schema, windows

### Community 44 - "Community 44"
Cohesion: 0.28
Nodes (8): isNativePath(), resolvePlayableSapUrl(), SapPlayer(), handleToggle(), SapPlayerProps, SapPlayerRuntime, SapRuntimeConstructor, Window

### Community 45 - "Community 45"
Cohesion: 0.36
Nodes (8): buildImportedPlatformSettings(), createPlatformImportJobId(), getMissingRequiredFolderKey(), PlatformImportJobState, usePlatformImport(), cancelPlatformImport(), importPlatformDatabaseFromMdb(), PlatformDatabaseImportResult

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (7): ScreenScraperApiResponse, ScreenScraperGameResponse, ScreenScraperLocalizedName, ScreenScraperMedia, ScreenScraperMediaResponse, ScreenScraperResult, ScreenScraperSynopsis

### Community 47 - "Community 47"
Cohesion: 0.43
Nodes (6): BigBoxFooter(), BigBoxFooterProps, GamepadControlHint, GamepadViewContext, getGamepadControls(), useGamepadControls()

### Community 48 - "Community 48"
Cohesion: 0.38
Nodes (4): EmuMoviesSearchResult, getVideoSnapUrl(), loginEmuMovies(), searchEmuMovies()

### Community 49 - "Community 49"
Cohesion: 0.29
Nodes (6): SidPlayer(), checkLocalScrape(), SidPlayerProps, SidPlayerRuntime, SidRuntimeConstructor, Window

### Community 50 - "Community 50"
Cohesion: 0.29
Nodes (4): PLATFORM_CORE_MAP, WasmPlayer(), init(), WasmPlayerProps

### Community 51 - "Community 51"
Cohesion: 0.47
Nodes (5): DatabaseSetupView(), DatabaseSetupViewProps, getThemeIdForPlatform(), RequiredPlatformFolderKey, PlatformFolderSettings

### Community 52 - "Community 52"
Cohesion: 0.33
Nodes (4): TheGamesDBGameLookupResponse, TheGamesDBImage, TheGamesDBImageLookupResponse, TheGamesDBResult

### Community 53 - "Community 53"
Cohesion: 0.50
Nodes (4): frontend_ready(), GAMEBASEBOX_DEBUG, PATH, tauri-dev-debug.sh script

### Community 54 - "Community 54"
Cohesion: 0.67
Nodes (3): frontend_ready(), PATH, tauri-dev.sh script

## Knowledge Gaps
- **303 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+298 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Community 10` to `Community 40`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `get_db_path()` connect `Community 0` to `Community 1`, `Community 2`, `Community 5`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `useTranslation()` connect `Community 17` to `Community 34`, `Community 35`, `Community 37`, `Community 6`, `Community 11`, `Community 13`, `Community 47`, `Community 18`, `Community 19`, `Community 51`, `Community 21`, `Community 23`, `Community 29`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _303 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.10154905335628227 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08778424114225278 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09571655208884189 - nodes in this community are weakly interconnected._