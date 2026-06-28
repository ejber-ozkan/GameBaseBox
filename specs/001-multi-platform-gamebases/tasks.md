# Tasks: Multi-Platform GameBase Libraries

**Input**: Design documents from `specs/001-multi-platform-gamebases/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included because the constitution, plan, contracts, and quickstart define acceptance and regression coverage for platform switching, import, launch, and workflow parity.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently after the shared foundation is complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files or depends only on completed earlier phases.
- **[Story]**: Which user story the task supports.
- Every task includes an exact file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared project files and fixtures for platform-aware implementation.

- [X] T001 Create Atari 800 fixture notes and expected sample paths in `specs/001-multi-platform-gamebases/quickstart.md`
- [X] T002 [P] Add platform domain type placeholders in `src/types/platform.ts`
- [X] T003 [P] Add platform fixture data placeholder in `src/lib/platform-capabilities.ts`
- [X] T004 [P] Add frontend platform test scaffold in `src/lib/platform-capabilities.test.ts`
- [X] T005 [P] Add backend platform test scaffold in `src-tauri/src/commands/platforms/tests.rs`
- [X] T006 [P] Add import script fixture scaffold in `scripts/platform_import_config.test.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the platform abstraction, typed contracts, and persistence shape required before any user story can work.

**Critical**: No user story work should begin until this phase is complete.

- [X] T007 Define `PlatformId`, `PlatformProfile`, `PlatformLibraryStatus`, `PlatformFolderSettings`, `PlatformEmulatorProfile`, and `ActivePlatformState` in `src/types/platform.ts`
- [X] T008 Implement C64, Atari 800, and Atari 2600 platform profiles in `src/lib/platform-capabilities.ts`
- [X] T009 [P] Add frontend tests for platform registry defaults and Atari 800 capabilities in `src/lib/platform-capabilities.test.ts`
- [X] T010 Add platform-scoped settings shape and defaults to `src/contexts/SettingsContext.tsx`
- [X] T011 Add migration from flat C64 settings into platform-scoped settings in `src/contexts/SettingsContext.tsx`
- [X] T012 [P] Add settings migration tests in `src/contexts/SettingsContext.test.tsx`
- [X] T013 Add platform models for platform profiles, library status, folder settings, emulator profiles, and active state in `src-tauri/src/models.rs`
- [X] T014 Add backend platform command module registration in `src-tauri/src/commands/mod.rs`
- [X] T015 Create backend platform command module in `src-tauri/src/commands/platforms.rs`
- [X] T016 Add Tauri command wrappers for platform state and settings in `src/lib/tauri-bridge.ts`
- [X] T017 Add platform-aware database path and scope helpers in `src-tauri/src/database.rs`
- [X] T018 Add platform identity columns/tables and compatibility migration helpers in `scripts/sqlite_support_config.js`
- [X] T019 Add platform-aware audit checks for platform schema/index support in `scripts/check_sqlite_support.js`
- [X] T020 [P] Add backend tests for active platform state and platform settings validation in `src-tauri/src/commands/platforms/tests.rs`
- [X] T021 [P] Add script tests for platform import configuration and support objects in `scripts/platform_import_config.test.js`
- [X] T022 Update `src-tauri/src/lib.rs` invoke handler with platform commands from `src-tauri/src/commands/platforms.rs`

**Checkpoint**: Platform profiles, platform-scoped settings, IPC wrappers, and persistence helpers exist and are tested.

---

## Phase 3: User Story 1 - Choose Active Platform (Priority: P1)

**Goal**: Users can choose the active platform, the app restores the last-used imported platform, and unimported platforms route to import.

**Independent Test**: Start with no active platform, choose Atari 800, restart with Atari 800 as last-used, and switch between C64 and Atari 800 from the top menu without restarting.

### Tests for User Story 1

- [X] T023 [P] [US1] Add unit tests for active platform reducer/state transitions in `src/contexts/SettingsContext.test.tsx`
- [X] T024 [P] [US1] Add Tauri IPC contract tests for `get_supported_platforms`, `get_active_platform`, and `set_active_platform` in `src-tauri/src/commands/platforms/tests.rs`
- [X] T025 [P] [US1] Add Playwright platform selection test in `e2e/platform-selection.spec.ts`

### Implementation for User Story 1

- [X] T026 [US1] Implement `get_supported_platforms`, `get_active_platform`, and `set_active_platform` in `src-tauri/src/commands/platforms.rs`
- [X] T027 [US1] Add frontend wrappers for active platform commands in `src/lib/tauri-bridge.ts`
- [X] T028 [US1] Add active platform state, last-used platform persistence, and selection helpers in `src/contexts/SettingsContext.tsx`
- [X] T029 [US1] Create platform switcher component in `src/components/PlatformSwitcher.tsx`
- [X] T030 [US1] Integrate platform switcher into the top menu/header in `src/components/library/LibraryHeader.tsx`
- [X] T031 [US1] Route unimported selected platforms to setup/import view in `src/app/page.tsx`
- [X] T032 [US1] Preserve active platform behavior in BigBox mode in `src/components/BigBoxView.tsx`
- [X] T033 [US1] Update browser-mode mock platform behavior in `src/lib/tauri-bridge.ts`
- [X] T034 [US1] Update platform selection copy and empty-state messaging in `src/components/setup/DatabaseSetupView.tsx`

**Checkpoint**: User can choose and switch platform context independently of import and launch details.

---

## Phase 4: User Story 2 - Import a Platform Collection (Priority: P1)

**Goal**: Selecting unimported Atari 800 opens an Atari 800 import flow using an Atari 800 MDB and Atari 800 folder settings.

**Independent Test**: Select Atari 800 before import, choose `Atari 800 v12.mdb` or equivalent, set Games/Music/Photos/Screenshots folders, complete import, and enter a browsable Atari 800 library.

### Tests for User Story 2

- [X] T035 [P] [US2] Add Node tests for platform-aware MDB/export/db path arguments in `scripts/db_pipeline.test.js`
- [X] T036 [P] [US2] Add SQLite conversion tests for platform identity and platform-scoped views in `scripts/convert_csv_to_sqlite.test.js`
- [X] T037 [P] [US2] Add Tauri setup command tests for Atari 800 import request validation in `src-tauri/src/commands/setup/tests.rs`
- [X] T038 [P] [US2] Add Playwright Atari 800 import routing test in `e2e/platform-import.spec.ts`

### Implementation for User Story 2

- [X] T039 [US2] Extend `scripts/db_pipeline.js` to accept `--platform`, Atari 800 MDB path, export dir, and SQLite target arguments
- [X] T040 [US2] Extend `scripts/convert_csv_to_sqlite.js` to write platform identity and build platform-scoped library support objects
- [X] T041 [US2] Extend `scripts/check_sqlite_support.js` to audit platform-scoped tables, views, indexes, and search support
- [X] T042 [US2] Add `import_platform_database_from_mdb` request and result models in `src-tauri/src/models.rs`
- [X] T043 [US2] Implement `get_platform_import_status` and `import_platform_database_from_mdb` in `src-tauri/src/commands/setup.rs`
- [X] T044 [US2] Add platform-aware setup wrappers in `src/lib/tauri-bridge.ts`
- [X] T045 [US2] Update `src/components/setup/DatabaseSetupView.tsx` to show Atari 800 MDB selection and Games/Music/Photos/Screenshots folder fields
- [X] T046 [US2] Save Atari 800 import status and folder settings through `src/contexts/SettingsContext.tsx`
- [X] T047 [US2] Scope `get_db_games`, `get_db_game_count`, `get_game_detail`, `get_game_extras`, `get_genres`, and `get_sub_genres` by active platform in `src-tauri/src/commands/db/games.rs`
- [X] T048 [US2] Scope query builder filters by platform in `src-tauri/src/commands/db/querying.rs`
- [X] T049 [US2] Add platform-aware query wrapper parameters in `src/lib/tauri-bridge.ts`

**Checkpoint**: Atari 800 import produces platform-scoped data and does not disturb C64 import or browsing.

---

## Phase 5: User Story 3 - Configure Platform Launching (Priority: P1)

**Goal**: Users can configure and test Atari 800 launch through RetroArch Atari800 core or Altirra, with C64 launch behavior preserved.

**Independent Test**: Configure RetroArch plus Atari800 core and Altirra for Atari 800, test both profiles, and launch a representative Atari 800 primary game file.

### Tests for User Story 3

- [X] T050 [P] [US3] Add backend tests for Atari 800 launch extension allowlist and launch artifact creation in `src-tauri/src/commands/emulator.rs`
- [X] T051 [P] [US3] Add backend tests for RetroArch Atari800 core validation and Altirra executable validation in `src-tauri/src/commands/emulator.rs`
- [X] T052 [P] [US3] Add frontend settings tests for Atari 800 emulator profile visibility in `src/components/SettingsModal.test.tsx`
- [X] T052a [US3] Replace generic Local Paths settings navigation with imported-platform path pages in `src/components/SettingsModal.tsx`
- [X] T053 [P] [US3] Add Playwright Atari 800 emulator settings test in `e2e/platform-launch-settings.spec.ts`

### Implementation for User Story 3

- [X] T054 [US3] Extend `LaunchRequest` in `src-tauri/src/models.rs` with `platform_id`, `emulator_profile_id`, and platform-aware launch file fields
- [X] T055 [US3] Refactor C64-specific launch extension filtering into platform launch rules in `src-tauri/src/commands/emulator.rs`
- [X] T056 [US3] Add RetroArch Atari800 core argument handling in `src-tauri/src/commands/emulator.rs`
- [X] T057 [US3] Add Altirra executable detection and launch argument handling in `src-tauri/src/commands/emulator.rs`
- [X] T058 [US3] Implement `test_emulator_profile` in `src-tauri/src/commands/emulator.rs`
- [X] T059 [US3] Add `testEmulatorProfile` and platform-aware `launchGame` wrappers in `src/lib/tauri-bridge.ts`
- [X] T060 [US3] Extend `src/components/SettingsModal.tsx` with Atari 800 RetroArch core and Altirra path controls
- [X] T060a [US3] Preserve C64 platform path editing independently of active platform in `src/components/settings/PathsSettingsTab.tsx`
- [X] T061 [US3] Update game launch call sites to pass active platform and emulator profile in `src/components/DetailView.tsx`
- [X] T062 [US3] Preserve C64 VICE and RetroArch compatibility paths in `src-tauri/src/commands/emulator.rs`

**Checkpoint**: Atari 800 has configurable RetroArch and Altirra launch paths, and C64 launch behavior remains compatible.

---

## Phase 6: User Story 4 - Respect Platform-Specific Media and Music (Priority: P2)

**Goal**: Media and music controls reflect active platform capabilities; SID controls remain C64-only unless another platform supports SID.

**Independent Test**: Switch between C64 and Atari 800 and confirm media sections use the active platform folders, while SID-specific controls do not appear for Atari 800 by default.

### Tests for User Story 4

- [x] T063 [P] [US4] Add media capability unit tests in `src/lib/platform-capabilities.test.ts`
- [x] T064 [P] [US4] Add detail view capability tests in `src/components/DetailView.test.tsx`
- [x] T065 [P] [US4] Add visual extras capability tests in `src/components/extras/VisualExtrasBrowser.test.tsx`

### Implementation for User Story 4

- [x] T066 [US4] Add platform media capability helpers in `src/lib/platform-capabilities.ts`
- [x] T067 [US4] Update `resolveMediaPath` and `findAllVariants` to use active platform folder settings in `src/contexts/SettingsContext.tsx`
- [x] T068 [US4] Hide SID-specific controls for non-SID platforms in `src/components/SidPlayer.tsx`
- [x] T069 [US4] Gate detail media sections by platform capabilities in `src/components/DetailView.tsx`
- [x] T070 [US4] Resolve Atari 800 Photos and Screenshots in `src/components/ImageWithFallback.tsx`
- [x] T071 [US4] Scope extras media resolution by active platform in `src/components/extras/ResolvedExtraMedia.tsx`

**Checkpoint**: Platform media capability differences are visible only where intended and do not break shared detail/extras workflows.

---

## Phase 7: User Story 5 - Keep Platform Data Separate While Preserving App Workflows (Priority: P2)

**Goal**: Search, favorites, scroll state, detail navigation, extras, versions, and BigBox workflows behave the same while data remains scoped by platform.

**Independent Test**: Import or mock C64 and Atari 800 with overlapping titles, mark favorites, search, scroll, open details, view extras/versions, switch platforms, and verify no data leaks between platforms.

### Tests for User Story 5

- [x] T072 [P] [US5] Add platform-scoped favorites tests in `src/contexts/SettingsContext.test.tsx`
- [x] T073 [P] [US5] Add platform-aware library browser state tests in `src/hooks/useLibraryBrowserState.test.tsx`
- [x] T074 [P] [US5] Add platform-aware BigBox data tests in `src/hooks/useBigBoxLibraryData.test.ts`
- [x] T075 [P] [US5] Add Playwright workflow parity test in `e2e/platform-workflow-parity.spec.ts`

### Implementation for User Story 5

- [x] T076 [US5] Scope favorites, recently played, last selected game, last focused index, and last view mode by platform in `src/contexts/SettingsContext.tsx`
- [x] T077 [US5] Pass active platform through library browser data loading in `src/hooks/useLibraryBrowserState.ts`
- [x] T078 [US5] Pass active platform through BigBox library data loading in `src/hooks/useBigBoxLibraryData.ts`
- [x] T079 [US5] Preserve platform-scoped scroll and alphabet navigation in `src/hooks/useBigBoxScrollSync.ts`
- [x] T080 [US5] Ensure grid/list rendering remains platform-agnostic in `src/components/GridView.tsx`
- [x] T081 [US5] Ensure list rendering remains platform-agnostic in `src/components/ListView.tsx`
- [x] T082 [US5] Ensure extras and version selection receive platform-scoped game detail data in `src/components/ExtrasDetail.tsx`
- [x] T083 [US5] Update mock data and browser-mode fallbacks for C64 and Atari 800 in `src/data/mockGames.ts`

**Checkpoint**: Platform context changes data source and capabilities, not the core library workflows.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation, and cleanup across all stories.

- [X] T084 [P] Update README platform setup notes for Atari 800 in `README.md`
- [X] T085 [P] Update architecture review notes for platform-scoped libraries in `docs/architecture-review.md`
- [X] T086 [P] Update Graphify after implementation using `graphify-out/GRAPH_REPORT.md`
- [X] T087 Run frontend test suite and record result in `specs/001-multi-platform-gamebases/quickstart.md`
- [X] T088 Run backend test suite and record result in `specs/001-multi-platform-gamebases/quickstart.md`
- [X] T089 Run lint and build validation and record result in `specs/001-multi-platform-gamebases/quickstart.md`
- [X] T090 Run Playwright platform validation and record result in `specs/001-multi-platform-gamebases/quickstart.md`
- [X] T091 Review `specs/001-multi-platform-gamebases/checklists/platform-readiness.md` and either resolve or explicitly defer every open checklist concern in `specs/001-multi-platform-gamebases/tasks.md`

**Phase 8 notes**: `platform-readiness.md` has 38/38 checklist items complete, so there are no open readiness concerns to resolve or defer. Chromium Playwright validation passed; the full configured Playwright run remains locally blocked until WebKit is installed for the `mobile-safari` project.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories.
- **US1 Choose Active Platform (Phase 3)**: Depends on Foundational.
- **US2 Import Platform Collection (Phase 4)**: Depends on Foundational and uses US1 routing, but can be implemented with direct setup entry points.
- **US3 Configure Platform Launching (Phase 5)**: Depends on Foundational and benefits from US2 game file resolution.
- **US4 Platform Media/Music (Phase 6)**: Depends on Foundational and can proceed after US1 active platform state exists.
- **US5 Workflow Parity/Data Isolation (Phase 7)**: Depends on Foundational and should be finalized after US1-US4 integration points exist.
- **Polish (Phase 8)**: Depends on selected story scope completion.

### User Story Dependencies

- **US1 (P1)**: MVP entry point; no story dependency after Foundational.
- **US2 (P1)**: Requires platform identity and import routing from US1 for full user flow.
- **US3 (P1)**: Requires platform profiles and settings; can be developed alongside US2 with mocked Atari 800 game files.
- **US4 (P2)**: Requires platform capabilities and active platform state.
- **US5 (P2)**: Requires platform-scoped settings, queries, and workflow integration from prior stories.

### Parallel Opportunities

- T002-T006 can run in parallel after T001.
- T009, T012, T020, and T021 can run in parallel once their target files exist.
- US1 test tasks T023-T025 can run in parallel.
- US2 test tasks T035-T038 can run in parallel.
- US3 test tasks T050-T053 can run in parallel.
- US4 test tasks T063-T065 can run in parallel.
- US5 test tasks T072-T075 can run in parallel.
- Documentation tasks T084-T086 can run in parallel after implementation behavior is known.

---

## Parallel Example: User Story 2

```bash
# Parallel test/scaffold tasks for Atari 800 import
Task: "T035 Add Node tests for platform-aware MDB/export/db path arguments in scripts/db_pipeline.test.js"
Task: "T036 Add SQLite conversion tests for platform identity and platform-scoped views in scripts/convert_csv_to_sqlite.test.js"
Task: "T037 Add Tauri setup command tests for Atari 800 import request validation in src-tauri/src/commands/setup/tests.rs"
Task: "T038 Add Playwright Atari 800 import routing test in e2e/platform-import.spec.ts"
```

## Parallel Example: User Story 3

```bash
# Parallel test/scaffold tasks for Atari 800 launch
Task: "T050 Add backend tests for Atari 800 launch extension allowlist and launch artifact creation in src-tauri/src/commands/emulator.rs"
Task: "T051 Add backend tests for RetroArch Atari800 core validation and Altirra executable validation in src-tauri/src/commands/emulator.rs"
Task: "T052 Add frontend settings tests for Atari 800 emulator profile visibility in src/components/SettingsModal.test.tsx"
Task: "T053 Add Playwright Atari 800 emulator settings test in e2e/platform-launch-settings.spec.ts"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 so the app can choose active platform and route unimported platforms.
3. Complete the smallest US2 slice that imports or mocks Atari 800 platform status enough to enter Atari 800 context.
4. Stop and validate startup, platform switching, and unimported Atari 800 routing.

### Incremental Delivery

1. Platform foundation and active platform state.
2. Atari 800 import flow and platform-scoped query behavior.
3. Atari 800 RetroArch and Altirra launch settings.
4. Platform media/music capability display.
5. Workflow parity and platform isolation hardening.

### Validation Gates

- After US1: platform selection and startup restore pass.
- After US2: Atari 800 import and scoped query pass.
- After US3: RetroArch Atari800 and Altirra profile tests pass without regressing C64 launch.
- After US4: SID and media capability display is correct across C64 and Atari 800.
- After US5: quickstart workflow parity checks pass for C64 and Atari 800.
