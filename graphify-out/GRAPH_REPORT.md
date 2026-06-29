# Graph Report - GameBaseBox  (2026-06-29)

## Corpus Check
- 162 files · ~99,538 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1545 nodes · 2937 edges · 105 communities (95 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a22f79e5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Detail View Layout & Navigation|Detail View Layout & Navigation]]
- [[_COMMUNITY_Core Architecture & Requirements|Core Architecture & Requirements]]
- [[_COMMUNITY_AI Agent Workflows & Task Tracking|AI Agent Workflows & Task Tracking]]
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
- [[_COMMUNITY_Component 22|Component 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Component 24|Component 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Component 26|Component 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Component 28|Component 28]]
- [[_COMMUNITY_Component 29|Component 29]]
- [[_COMMUNITY_Component 30|Component 30]]
- [[_COMMUNITY_Component 31|Component 31]]
- [[_COMMUNITY_Component 32|Component 32]]
- [[_COMMUNITY_Component 33|Component 33]]
- [[_COMMUNITY_Component 34|Component 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Component 36|Component 36]]
- [[_COMMUNITY_Component 37|Component 37]]
- [[_COMMUNITY_Component 38|Component 38]]
- [[_COMMUNITY_Component 39|Component 39]]
- [[_COMMUNITY_Component 40|Component 40]]
- [[_COMMUNITY_Component 41|Component 41]]
- [[_COMMUNITY_Component 42|Component 42]]
- [[_COMMUNITY_Component 43|Component 43]]
- [[_COMMUNITY_Component 44|Component 44]]
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
- [[_COMMUNITY_Component 80|Component 80]]
- [[_COMMUNITY_Component 81|Component 81]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Component 91|Component 91]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Component 96|Component 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Component 128|Component 128]]
- [[_COMMUNITY_Component 142|Component 142]]

## God Nodes (most connected - your core abstractions)
1. `String` - 49 edges
2. `Result` - 46 edges
3. `Game` - 37 edges
4. `useSettings()` - 36 edges
5. `isTauri()` - 33 edges
6. `launch_emulator()` - 25 edges
7. `Connection` - 25 edges
8. `import_csv_directory_to_sqlite()` - 24 edges
9. `invoke()` - 24 edges
10. `useGamepad()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `test_init_database_repairs_stale_game_view_without_platform_id()` --calls--> `init_database()`  [INFERRED]
  src-tauri/src/commands/db/tests.rs → src-tauri/src/database.rs
- `Claude Agent Instructions` --references--> `Beads Issue Tracker`  [EXTRACTED]
  CLAUDE.md → AGENTS.md
- `Tauri Bridge API` --references--> `Tauri Desktop Wrapper Requirements`  [INFERRED]
  docs/architecture-review.md → GB64_Modern_Frontend_Requirements.md
- `WASM Emulator Iframe` --implements--> `WASM Emulation Requirements`  [INFERRED]
  public/emulator.html → GB64_Modern_Frontend_Requirements.md
- `Summary/Detail Payload Paradigm` --references--> `SQLite Database Requirements`  [INFERRED]
  docs/architecture-review.md → GB64_Modern_Frontend_Requirements.md

## Import Cycles
- 1-file cycle: `src-tauri/src/commands/db/games.rs -> src-tauri/src/commands/db/games.rs`
- 1-file cycle: `src-tauri/src/commands/db/querying.rs -> src-tauri/src/commands/db/querying.rs`
- 1-file cycle: `src-tauri/src/commands/emulator.rs -> src-tauri/src/commands/emulator.rs`
- 1-file cycle: `src-tauri/src/commands/files.rs -> src-tauri/src/commands/files.rs`
- 1-file cycle: `src-tauri/src/commands/setup.rs -> src-tauri/src/commands/setup.rs`
- 1-file cycle: `src-tauri/src/database.rs -> src-tauri/src/database.rs`

## Hyperedges (group relationships)
- **Beads Issue Tracking and Git Workflow** — agents_beads_issue_tracker, agents_session_completion_workflow, claude_agent_instructions [EXTRACTED 1.00]
- **Offline C64 WASM Emulation Flow** — gb64_modern_frontend_requirements_wasm_emulation, public_emulator_wasm_iframe, cores_readme_emulatorjs_core [EXTRACTED 1.00]

## Communities (105 total, 10 thin omitted)

### Community 0 - "Detail View Layout & Navigation"
Cohesion: 0.10
Nodes (23): DetailFullscreenRequest, cleanMetadataValue(), getGameStudios(), getPrimaryStudioLabel(), UNKNOWN_VALUES, getNeonArchiveDetailStyle(), NEON_ARCHIVE_DETAIL_STYLES, NeonArchiveDetailStyle (+15 more)

### Community 1 - "Core Architecture & Requirements"
Cohesion: 0.17
Nodes (12): EmulatorJS vice_x64 Core, Summary/Detail Payload Paradigm, Tauri Bridge API, Project 64Box Requirements, SID Player Requirements, SQLite Database Requirements, Tauri Desktop Wrapper Requirements, WASM Emulation Requirements (+4 more)

### Community 2 - "AI Agent Workflows & Task Tracking"
Cohesion: 0.17
Nodes (11): Agent Instructions, Beads Issue Tracker, Codebase Navigation with Graphify, Ejber's Ways of working, Non-Interactive Shell Commands, Quick Reference, Quick Reference, Rules (+3 more)

### Community 3 - "WASM Emulator Core & Localization"
Cohesion: 0.07
Nodes (48): build_game_detail_query(), build_game_summary_query(), get_db_game_count(), get_db_games(), get_game_detail(), get_game_extras(), get_genres(), get_sub_genres() (+40 more)

### Community 4 - "Database & Performance Paradigms"
Cohesion: 0.11
Nodes (72): R, cleanup_export_directory(), configure_runtime_db_path(), create_export_directory(), create_import_temp_db_path(), create_runtime_db_path(), csv_record_has_unclosed_quotes(), ensure_cover_index() (+64 more)

### Community 5 - "Media Extras & Asset Structuring"
Cohesion: 0.13
Nodes (21): BigBoxViewProps, Settings, UseBigBoxLibraryDataProps, LibraryViewMode, LETTERS, UseLibraryShellInputProps, getLibraryColumnCount(), getNextLetterJump() (+13 more)

### Community 6 - "Component 6"
Cohesion: 0.13
Nodes (31): get_database_bootstrap_status(), get_platform_import_status(), import_database_from_mdb(), import_platform_database_from_mdb(), open_mdb_file_dialog(), reject_obvious_wrong_platform_mdb(), validate_existing_folder(), validate_platform_import_request() (+23 more)

### Community 7 - "Component 7"
Cohesion: 0.20
Nodes (12): allocateTracks(), buildDetailLayoutSpec(), clamp(), DetailDesignViewport, DetailResolutionTier, DetailTierDefinition, DetailViewportSnapshot, resolveDetailDesignViewport() (+4 more)

### Community 8 - "Component 8"
Cohesion: 0.14
Nodes (29): download_media_asset(), find_all_media_variants(), read_file_bytes(), resolve_media_child_path(), resolve_media_path(), sanitize_relative_media_path(), scan_rom_directory(), split_variant_stem() (+21 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (12): Assumptions, Edge Cases, Feature Specification: GameBaseBox Public 0.1 Release, Functional Requirements, Key Entities, Measurable Outcomes, Requirements *(mandatory)*, Success Criteria *(mandatory)* (+4 more)

### Community 10 - "Component 10"
Cohesion: 0.12
Nodes (42): copy_test_emulator(), create_launch_temp_dir(), emulator_profile_display_name(), is_retroarch_profile(), is_supported_emulator_profile(), launch_emulator(), launch_extensions_for_platform(), platform_display_name() (+34 more)

### Community 11 - "Component 11"
Cohesion: 0.07
Nodes (28): Atari 2600, Atari 800, BigBox Letter Jump, BigBox Rails, BigBox Search, Building the SQLite Database, Commodore 64, Controller (+20 more)

### Community 12 - "Component 12"
Cohesion: 0.19
Nodes (19): exit_app(), get_window_size(), open_directory_dialog(), open_file_dialog(), open_path_with_system_default(), set_window_mode(), test_validate_open_path_rejects_data_url(), test_validate_open_path_rejects_ftp_url() (+11 more)

### Community 13 - "Component 13"
Cohesion: 0.29
Nodes (9): calculateDownNavigation(), calculateLeftNavigation(), calculateRightNavigation(), calculateUpNavigation(), NavigationParams, NavigationResult, NavigationState, KeyEventLike (+1 more)

### Community 14 - "Component 14"
Cohesion: 0.08
Nodes (49): convertCsvToSqlite(), createPerformanceIndexes(), Database, ensureExtrasPlatformColumns(), ensureGamesPlatformColumns(), ensureImportPlatformColumns(), ensureTablePlatformColumns(), fs (+41 more)

### Community 15 - "Component 15"
Cohesion: 0.21
Nodes (19): get_secure_setting(), save_secure_setting(), decrypt_legacy_value(), decrypt_value(), encrypt_value(), encrypt_value_with_legacy_fixed_iv(), get_encryption_key(), test_decrypt_supports_legacy_fixed_iv_ciphertext() (+11 more)

### Community 16 - "Component 16"
Cohesion: 0.10
Nodes (20): app, security, windows, enable, scope, build, beforeBuildCommand, beforeDevCommand (+12 more)

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (10): Complexity Tracking, Constitution Check, Documentation (this feature), Implementation Plan: GameBaseBox Public 0.1 Release, Phase 0: Research Summary, Phase 1: Design Summary, Project Structure, Source Code (repository root) (+2 more)

### Community 18 - "Component 18"
Cohesion: 0.10
Nodes (21): devDependencies, better-sqlite3, csv-parse, eslint, eslint-config-next, happy-dom, jsdom, @playwright/test (+13 more)

### Community 19 - "Component 19"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 20 - "Component 20"
Cohesion: 0.12
Nodes (17): scripts, build, coverage:backend, coverage:frontend, db:audit, db:convert, db:import, dev (+9 more)

### Community 21 - "Component 21"
Cohesion: 0.29
Nodes (16): get_db_game_count(), get_db_games(), get_game_detail(), get_game_extras(), get_genres(), get_secure_setting(), get_sub_genres(), save_secure_setting() (+8 more)

### Community 22 - "Component 22"
Cohesion: 0.06
Nodes (30): Dependencies & Execution Order, Format: `[ID] [P?] [Story] Description`, Implementation for User Story 1, Implementation for User Story 2, Implementation for User Story 3, Implementation for User Story 4, Implementation for User Story 5, Implementation Strategy (+22 more)

### Community 23 - "Community 23"
Cohesion: 0.10
Nodes (23): BigBoxExitPrompt(), BigBoxExitPromptProps, ExitPromptFocus, ControllerSearchKeyboard(), ControllerSearchKeyboardProps, KEYBOARD_ROWS, KeyboardAction, KeyboardKey (+15 more)

### Community 24 - "Component 24"
Cohesion: 0.11
Nodes (20): DetailLayoutProps, ExtrasDetail(), MusicianPhoto(), Props, StatusRow(), DetailGameTitle(), DetailGameTitleProps, OUTLINED_TITLE_STYLE (+12 more)

### Community 25 - "Community 25"
Cohesion: 0.29
Nodes (10): areMenuSoundEffectsEnabled(), audioCache, canPlayUiSoundEffects(), getAudioElement(), getNextRotatingUiSoundEffect(), getUiSoundEffectUrl(), playRotatingUiSoundEffect(), playRotatingUiSoundEffectAndWait() (+2 more)

### Community 27 - "Community 27"
Cohesion: 0.25
Nodes (7): Branding Audit, New Repository Verification, Old Repository Verification, Prerequisites, Quickstart: GameBaseBox Public 0.1 Release Validation, Release Verification, Validation Commands

### Community 28 - "Component 28"
Cohesion: 0.17
Nodes (24): ActivePlatformState, DatabaseBootstrapStatus, DatabaseImportResult, EmulatorProfileTestRequest, ExtraRow, GameDetailRow, GameFilters, GameRow (+16 more)

### Community 29 - "Component 29"
Cohesion: 0.12
Nodes (12): metadata, ERROR_SOUNDS, UiSoundRuntime(), defaultSettings, migratePlatformSettings(), PlatformImportStatusSnapshot, SECURE_FIELDS, SettingsContext (+4 more)

### Community 30 - "Component 30"
Cohesion: 0.22
Nodes (9): dependencies, next, react, react-dom, @tauri-apps/api, @tauri-apps/plugin-dialog, @tauri-apps/plugin-fs, @tauri-apps/plugin-log (+1 more)

### Community 31 - "Component 31"
Cohesion: 0.20
Nodes (9): Architecture Overview, Beads Issue Tracker, Build & Test, Conventions & Patterns, graphify, Project Instructions for AI Agents, Quick Reference, Rules (+1 more)

### Community 32 - "Component 32"
Cohesion: 0.25
Nodes (7): Phase 1: Spec Closure and Audit, Phase 2: Product Rebrand, Phase 3: README and Repository Content, Phase 4: Validation and Build Artifacts, Phase 5: New Public Repository and Release, Phase 6: Old Repo Redirect and Close-Out, Tasks: GameBaseBox Public 0.1 Release

### Community 33 - "Component 33"
Cohesion: 0.25
Nodes (6): FOLDERS, fs, NODE_MODULES, path, PUBLIC_EMU, ROOT

### Community 34 - "Component 34"
Cohesion: 0.17
Nodes (16): DOC_EXT, DOC_FOLDERS, GAME_EXT, GAME_FOLDERS, getExtraExtension(), getExtraLaunchLabel(), getExtraSourceLabel(), IMG_EXT (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.14
Nodes (15): ListView(), ListViewProps, ScrapeButtonProps, mockGames, getDbGameDetail(), getGameExtras(), WindowGameListSection(), WindowGameListSectionProps (+7 more)

### Community 36 - "Component 36"
Cohesion: 0.33
Nodes (5): description, identifier, permissions, $schema, windows

### Community 37 - "Component 37"
Cohesion: 0.22
Nodes (8): engines, node, name, overrides, esbuild, postcss, private, version

### Community 38 - "Component 38"
Cohesion: 0.22
Nodes (13): ExtrasBigscreenNavigation, ExtrasDetailProps, AUDIO_EXTENSIONS, isAudioExtra(), isVideoExtra(), ResolvedExtraMedia(), VIDEO_EXTENSIONS, VisualExtraThumb() (+5 more)

### Community 44 - "Component 44"
Cohesion: 0.07
Nodes (26): Dependencies & Execution Order, Format: `[ID] [P?] [Story] Description`, Implementation for User Story 1, Implementation for User Story 2, Implementation for User Story 3, Implementation Strategy, Incremental Delivery, MVP First (User Story 1 Only) (+18 more)

### Community 46 - "Component 46"
Cohesion: 0.20
Nodes (6): Drop, MutexGuard, OsString, DbEnvGuard, Option, Self

### Community 53 - "Community 53"
Cohesion: 0.14
Nodes (24): ActivePlatformState, atari2600_profile(), atari800_profile(), c64_profile(), find_platform(), get_active_platform(), get_platform_import_status_sync(), get_supported_platforms() (+16 more)

### Community 54 - "Community 54"
Cohesion: 0.14
Nodes (14): DatabaseSetupView(), DatabaseSetupViewProps, folderLabels, RequiredPlatformFolderKey, ActivePlatformState, PlatformEmulatorProfile, PlatformEmulatorSettings, PlatformEmulatorType (+6 more)

### Community 55 - "Community 55"
Cohesion: 0.11
Nodes (18): Compatibility, Contract: Tauri IPC Surface, `get_active_platform`, `get_platform_import_status`, `get_platform_settings`, `get_supported_platforms`, Import Commands, `import_platform_database_from_mdb` (+10 more)

### Community 56 - "Community 56"
Cohesion: 0.13
Nodes (14): Assumptions, Edge Cases, Feature Specification: Multi-Platform GameBase Libraries, Functional Requirements, Key Entities *(include if feature involves data)*, Measurable Outcomes, Requirements *(mandatory)*, Success Criteria *(mandatory)* (+6 more)

### Community 57 - "Community 57"
Cohesion: 0.13
Nodes (14): Acceptance, Acceptance, Altirra Launch Contract, Atari 800 Import Contract, Audit, Behavior, Behavior, Behavior (+6 more)

### Community 58 - "Community 58"
Cohesion: 0.13
Nodes (14): files, .agents/skills/speckit-analyze/SKILL.md, .agents/skills/speckit-checklist/SKILL.md, .agents/skills/speckit-clarify/SKILL.md, .agents/skills/speckit-constitution/SKILL.md, .agents/skills/speckit-converge/SKILL.md, .agents/skills/speckit-implement/SKILL.md, .agents/skills/speckit-plan/SKILL.md (+6 more)

### Community 59 - "Community 59"
Cohesion: 0.13
Nodes (14): files, .specify/scripts/powershell/check-prerequisites.ps1, .specify/scripts/powershell/common.ps1, .specify/scripts/powershell/create-new-feature.ps1, .specify/scripts/powershell/setup-plan.ps1, .specify/scripts/powershell/setup-tasks.ps1, .specify/templates/checklist-template.md, .specify/templates/constitution-template.md (+6 more)

### Community 60 - "Community 60"
Cohesion: 0.10
Nodes (33): getRequiredPlatformFolderKeys(), Home(), LibraryApp(), REQUIRED_PLATFORM_FOLDER_KEYS, SetupFolderKey, AlphabetJumpBar(), AlphabetJumpBarProps, LETTERS (+25 more)

### Community 61 - "Community 61"
Cohesion: 0.15
Nodes (14): WasmPlayer(), WasmPlayerProps, DetailNavigationHook, PLATFORM_EMULATOR_PROFILES, supportsEmbeddedEmulation(), buildLaunchRequest(), buildPlatformAssetPath(), getPlatformLaunchSettings() (+6 more)

### Community 62 - "Community 62"
Cohesion: 0.22
Nodes (10): Find-SpecifyRoot(), Format-SpecKitCommand(), Get-CurrentBranch(), Get-FeaturePathsEnv(), Get-InvokeSeparator(), Get-Python3Command(), Get-RepoRoot(), Resolve-SpecifyInitDir() (+2 more)

### Community 63 - "Community 63"
Cohesion: 0.13
Nodes (14): Closure Note, Fixture Notes, Phase 8 Validation Record, Prerequisites, Quickstart: Validate Multi-Platform GameBase Libraries, Recommended Commands, Setup, Validate Altirra (+6 more)

### Community 64 - "Community 64"
Cohesion: 0.15
Nodes (12): Assumptions, Edge Cases, Feature Specification: [FEATURE NAME], Functional Requirements, Key Entities *(include if feature involves data)*, Measurable Outcomes, Requirements *(mandatory)*, Success Criteria *(mandatory)* (+4 more)

### Community 65 - "Community 65"
Cohesion: 0.17
Nodes (11): Acceptance Criteria Quality, Ambiguities & Conflicts, Dependencies & Assumptions, Edge Case Coverage, Non-Functional Requirements, Notes, Platform Readiness Checklist: Multi-Platform GameBase Libraries, Requirement Clarity (+3 more)

### Community 66 - "Community 66"
Cohesion: 0.18
Nodes (10): Complexity Tracking, Constitution Check, Documentation (this feature), Implementation Plan: Multi-Platform GameBase Libraries, Phase 0: Research Summary, Phase 1: Design Summary, Project Structure, Source Code (repository root) (+2 more)

### Community 67 - "Component 67"
Cohesion: 0.47
Nodes (4): EmuMoviesSearchResult, getVideoSnapUrl(), loginEmuMovies(), searchEmuMovies()

### Community 68 - "Community 68"
Cohesion: 0.25
Nodes (7): GBBox 0.1.0 Release Notes, Highlights, Installation and Artifacts, Known Limitations, Migration from 64Box, Supported Imports, Validation

### Community 69 - "Community 69"
Cohesion: 0.18
Nodes (10): Core Principles, GBBox Constitution, Governance, I. Multi-Platform GameBase Core, II. Local-First Library Ownership, III. Fast Browsing and Controller-Grade UX, IV. Emulator Launch Contracts Are Sacred, Spec-Kit and Beads Workflow (+2 more)

### Community 70 - "Community 70"
Cohesion: 0.18
Nodes (10): Core Principles, Governance, [PRINCIPLE_1_NAME], [PRINCIPLE_2_NAME], [PRINCIPLE_3_NAME], [PRINCIPLE_4_NAME], [PRINCIPLE_5_NAME], [PROJECT_NAME] Constitution (+2 more)

### Community 71 - "Community 71"
Cohesion: 0.20
Nodes (9): Active Platform State, Data Model: Multi-Platform GameBase Libraries, Emulator Profile, Game Entry, Launch Artifact, Media Capability, Platform, Platform Folder Settings (+1 more)

### Community 72 - "Community 72"
Cohesion: 0.20
Nodes (9): Decision: Atari 800 as the First Non-C64 Implementation Slice, Decision: Capability-Driven Media and Music UI, Decision: Platform-Aware Import Pipeline With One Active Library Database, Decision: Platform-Aware Launch Artifacts, Decision: Platform Registry With Scoped Library State, Decision: Platform-Scoped Settings Instead of More Flat Settings, Decision: RetroArch Default, Altirra Platform-Specific External Emulator, Decision: Workflow Parity Is an Acceptance Target (+1 more)

### Community 73 - "Community 73"
Cohesion: 0.29
Nodes (6): Decision: Attach built artifacts to v0.1.0, Decision: Keep platform support claims factual, Decision: Preserve existing local data compatibility, Decision: Publish new repository as GameBaseBox with clean history, Decision: Use GBBox / GameBase Box as public identity, Research: GameBaseBox Public 0.1 Release

### Community 74 - "Community 74"
Cohesion: 0.20
Nodes (9): invoke_separator, script, default_integration, installed_integrations, integration, integration_settings, codex, integration_state_schema (+1 more)

### Community 75 - "Community 75"
Cohesion: 0.20
Nodes (9): schema_version, description, installed_at, name, source, updated_at, version, workflows (+1 more)

### Community 76 - "Community 76"
Cohesion: 0.22
Nodes (8): Complexity Tracking, Constitution Check, Documentation (this feature), Implementation Plan: [FEATURE], Project Structure, Source Code (repository root), Summary, Technical Context

### Community 77 - "Community 77"
Cohesion: 0.25
Nodes (7): Contract: Platform UI Behavior, Error Behavior, Platform Selection, Platform-Specific Capability Display, Purpose, Top Menu Platform Switcher, Workflow Parity

### Community 78 - "Community 78"
Cohesion: 0.25
Nodes (7): ai, ai_skills, feature_numbering, here, integration, script, speckit_version

### Community 79 - "Community 79"
Cohesion: 0.29
Nodes (6): Coding Agent Context Extension, Commands, Configuration, Disable, Requirements, Why an extension?

### Community 80 - "Component 80"
Cohesion: 0.33
Nodes (5): Data Model: GameBaseBox Public 0.1 Release, OldRepositoryRedirect, ProductIdentity, ReleaseVersion, RepositoryPublication

### Community 81 - "Component 81"
Cohesion: 0.33
Nodes (5): Specification Quality Checklist: Multi-Platform GameBase Libraries, Content Quality, Feature Readiness, Notes, Requirement Completeness

### Community 83 - "Community 83"
Cohesion: 0.33
Nodes (5): Specification Quality Checklist: GameBaseBox Public 0.1 Release, Content Quality, Feature Readiness, Notes, Requirement Completeness

### Community 84 - "Community 84"
Cohesion: 0.40
Nodes (4): [Category 1], [Category 2], [CHECKLIST TYPE] Checklist: [FEATURE NAME], Notes

### Community 85 - "Community 85"
Cohesion: 0.50
Nodes (3): Behavior, Execution, Update Coding Agent Context

### Community 91 - "Component 91"
Cohesion: 0.22
Nodes (7): ScreenScraperApiResponse, ScreenScraperGameResponse, ScreenScraperLocalizedName, ScreenScraperMedia, ScreenScraperMediaResponse, ScreenScraperResult, ScreenScraperSynopsis

### Community 93 - "Community 93"
Cohesion: 0.11
Nodes (18): BigBoxAlphabetRail(), BigBoxAlphabetRailProps, BigBoxTileMedia(), BigBoxTileMediaProps, COVER_CACHE, SCREENSHOT_CACHE, getTargetVisibleCards(), HorizontalRail() (+10 more)

### Community 94 - "Community 94"
Cohesion: 0.33
Nodes (5): Release Contract, Release Notes Sections, Required Artifact Behavior, Verification, Version

### Community 95 - "Community 95"
Cohesion: 0.21
Nodes (10): BigBoxFooter(), BigBoxFooterProps, BigBoxSessionState, BigBoxView(), useBigBoxLibraryData(), useBigBoxNavigation(), useBigBoxScrollSync(), UseBigBoxScrollSyncProps (+2 more)

### Community 96 - "Component 96"
Cohesion: 0.06
Nodes (57): getCoverUrl(), MusicianPhotoProps, isNativePath(), resolvePlayableSapUrl(), SapPlayer(), SapPlayerProps, SapPlayerRuntime, SapRuntimeConstructor (+49 more)

### Community 97 - "Community 97"
Cohesion: 0.33
Nodes (5): New Repository, Old Repository Redirect, Recommended Topics, Repository Publication Contract, Verification

### Community 98 - "Community 98"
Cohesion: 0.22
Nodes (7): createDefaultPlatformFolders(), createDefaultPlatformLibraryStatus(), createDefaultPlatformNavigation(), createDefaultPlatformSettings(), EMBEDDED_EMULATION_PLATFORM_IDS, getPlatformProfile(), PlatformNavigationState

### Community 99 - "Community 99"
Cohesion: 0.40
Nodes (4): Branding Contract, Replacement Rules, Required Public Identity, Verification

### Community 100 - "Community 100"
Cohesion: 0.27
Nodes (8): BigBoxHeader(), BigBoxHeaderProps, PlatformSwitcher(), PlatformSwitcherProps, SettingsContextType, BIGBOX_LETTERS, SUPPORTED_PLATFORMS, PlatformId

### Community 101 - "Community 101"
Cohesion: 0.32
Nodes (5): LETTER_RAIL_CACHE, getDbGameCount(), getDbGames(), getGenres(), getSubGenres()

### Community 103 - "Community 103"
Cohesion: 0.25
Nodes (7): MusicPlayer(), MusicPlayerProps, SidPlayer(), SidPlayerProps, SidPlayerRuntime, SidRuntimeConstructor, Window

### Community 128 - "Component 128"
Cohesion: 0.33
Nodes (4): TheGamesDBGameLookupResponse, TheGamesDBImage, TheGamesDBImageLookupResponse, TheGamesDBResult

### Community 142 - "Component 142"
Cohesion: 0.12
Nodes (24): HeaderZone, SettingsViewProps, AboutSettingsTab(), AboutSettingsTabProps, AppearanceSettingsTab(), AppearanceSettingsTabProps, ContentSettingsTab(), ContentSettingsTabProps (+16 more)

## Knowledge Gaps
- **604 isolated node(s):** `update-agent-context.sh script`, `feature_directory`, `ai`, `ai_skills`, `feature_numbering` (+599 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_db_path()` connect `Database & Performance Paradigms` to `Component 10`, `WASM Emulator Core & Localization`, `Component 6`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `launch_emulator()` connect `Component 10` to `Database & Performance Paradigms`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `open_db_connection()` connect `WASM Emulator Core & Localization` to `Database & Performance Paradigms`, `Component 15`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `update-agent-context.sh script`, `feature_directory`, `ai` to the rest of the system?**
  _605 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Detail View Layout & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.10160427807486631 - nodes in this community are weakly interconnected._
- **Should `WASM Emulator Core & Localization` be split into smaller, more focused modules?**
  _Cohesion score 0.0684931506849315 - nodes in this community are weakly interconnected._
- **Should `Database & Performance Paradigms` be split into smaller, more focused modules?**
  _Cohesion score 0.11322011322011322 - nodes in this community are weakly interconnected._