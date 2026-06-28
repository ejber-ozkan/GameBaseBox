# Implementation Plan: Multi-Platform GameBase Libraries

**Branch**: `codex/spec-kit-constitution` | **Date**: 2026-06-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-multi-platform-gamebases/spec.md`

## Summary

Add Atari 800 as the first non-Commodore platform while creating the reusable
platform model needed for Atari 2600 and future GameBase libraries. The first
slice keeps all existing browse/search/scroll/detail/extras/version workflows
intact, but scopes data, settings, import state, emulator choices, and media
capabilities by active platform.

Atari 800 support will import `Atari 800 v12.mdb` or an equivalent Atari 800
v12-compatible GameBase MDB. A known local reference path is
`E:\Backups\RETRO-BACKUPS\Atari8bit\Atari 800\Atari 800 v12.mdb` when available
for validation. Atari 800 setup requires folder settings for Games, Music,
Photos, and Screenshots, supports `.sap` as the Atari music file type for future
playback, supports RetroArch with the Atari800 core as the default launch path,
and adds Altirra as a required Atari 800 external emulator option for executable
validation and primary game-file launching.

## Technical Context

**Language/Version**: TypeScript with React 19 and Next.js 16 frontend; Rust/Tauri 2 desktop backend; Node.js import scripts.

**Primary Dependencies**: Tauri 2 IPC and shell/fs/dialog plugins, React/Next UI, better-sqlite3 import tooling, rusqlite backend access, RetroArch external emulator, Altirra external emulator for Atari 800.

**Storage**: Local SQLite database plus local user settings. Current implementation has one `gb64.sqlite` and flat `gb64_settings`; this feature introduces platform-scoped library metadata, import status, media roots, emulator profiles, and active/last-used platform state.

**Testing**: `npm run test:frontend`, `npm run test:backend`, focused import/audit script tests, and Playwright coverage for platform selection, import routing, settings, and preserved browsing workflows.

**Target Platform**: Desktop app on Windows, macOS, and Linux, with Atari 800 launch support focused on RetroArch cross-platform behavior and Altirra on platforms where Altirra is available.

**Project Type**: Tauri desktop game-library frontend with local database import and external process launch.

**Performance Goals**: Platform switching completes in under 10 seconds; library search/favorites remain platform-scoped in all tested same-title cases; existing browse/search/scroll/detail/extras/version flows remain responsive for thousands of games.

**Constraints**: Local-first operation; no cloud dependency; platform-specific features must not leak across platforms; C64 compatibility must remain intact; generated launch artifacts must be temporary and distinguishable from source library files; platform switcher/import/settings flows follow the existing Commodore 64 keyboard and gamepad conventions.

**Scale/Scope**: First implementation slice supports Commodore 64 plus Atari 800 as imported platform libraries, with model and UI affordances prepared for Atari 2600 and later GameBase platforms.

**Migration**: Existing flat Commodore 64 settings migrate into the C64 platform settings namespace on first run, preserving paths, emulator choices, favorites, recently played state, last selected game, focused index, view mode, and BigBox focus state.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Multi-Platform GameBase Core**: PASS. Plan introduces platform-scoped concepts and uses Atari 800 as the first non-C64 implementation, avoiding duplicated browsing/search/settings stacks.
- **Local-First Library Ownership**: PASS. All imports, paths, databases, emulator settings, and generated launch artifacts remain local and user-controlled.
- **Fast Browsing and Controller-Grade UX**: PASS. Existing browsing, search, scrolling, detail, extras, versions, favorites, and back-navigation workflows are explicit acceptance targets for every platform.
- **Emulator Launch Contracts Are Sacred**: PASS. Plan creates explicit RetroArch Atari800 and Altirra launch contracts, with validation and platform-specific file handling.
- **Tested, Typed, and Traceable Change**: PASS. Plan includes typed platform data contracts, Tauri IPC contract updates, import/query tests, launch tests, and Playwright workflow checks. Beads issue `VIC40GameBase64-jnn` tracks this planning work.

## Project Structure

### Documentation (this feature)

```text
specs/001-multi-platform-gamebases/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── platform-ui-contract.md
│   ├── tauri-ipc-contract.md
│   └── import-launch-contract.md
└── tasks.md              # Created by /speckit-tasks, not this planning step
```

### Source Code (repository root)

```text
src/
├── app/
│   └── page.tsx                         # Preserve library shell behavior under active platform
├── components/
│   ├── SettingsModal.tsx                # Add platform-scoped Atari 800 paths and emulator settings
│   ├── setup/DatabaseSetupView.tsx      # Route unimported selected platforms to platform import
│   ├── BigBoxView.tsx                   # Preserve fullscreen workflows under active platform
│   └── detail/                          # Preserve game detail/version/extras behavior
├── contexts/
│   └── SettingsContext.tsx              # Add active platform and platform-scoped settings state
├── hooks/
│   ├── useLibraryBrowserState.ts        # Preserve browsing/search/scroll state per platform
│   └── useBigBoxLibraryData.ts          # Scope data loading by active platform
├── lib/
│   ├── tauri-bridge.ts                  # Add typed platform/import/launch IPC wrappers
│   ├── library-navigation.ts            # Preserve workflow invariants
│   └── platform-capabilities.ts         # New platform registry/capability helpers
└── types/
    ├── game.ts                          # Add platform-aware game/media fields without breaking UI
    └── platform.ts                      # New platform/library/emulator types

src-tauri/
├── src/
│   ├── models.rs                        # Add platform, library, emulator, launch request models
│   ├── database.rs                      # Resolve DB/library paths by platform
│   └── commands/
│       ├── db/                          # Scope queries/import status by platform
│       ├── emulator.rs                  # Add platform-aware RetroArch/Altirra launch contracts
│       └── setup.rs                     # Add platform-specific import entry points
└── Cargo.toml

scripts/
├── db_pipeline.js                       # Accept platform, MDB, export dir, and SQLite target
├── convert_csv_to_sqlite.js             # Preserve GameBase import while adding platform identity
└── check_sqlite_support.js              # Audit platform-scoped schema/index support

e2e/
└── *.spec.ts                            # Platform selection/import/settings/workflow acceptance
```

**Structure Decision**: Keep the existing Tauri desktop architecture. Add a platform domain layer and platform-scoped persistence while reusing the current UI shell, hooks, query wrappers, and launch command boundaries.

## Phase 0: Research Summary

See [research.md](./research.md). Key decisions:

- Use a platform registry plus platform-scoped library state instead of cloning the app per platform.
- Make Atari 800 the first non-C64 slice with RetroArch Atari800 core and Altirra.
- Extend import tooling to accept a platform and MDB path, starting with `Atari 800 v12.mdb`.
- Add required platform-specific media folders for Atari 800: Games, Music, Photos, and Screenshots.
- Add platform-aware launch artifacts and extension allowlists instead of C64-only ROM handling.
- Preserve per-platform last selected game, focused index, scroll position, view mode, last BigBox rail, and last BigBox game.

## Phase 1: Design Summary

See [data-model.md](./data-model.md), [contracts/platform-ui-contract.md](./contracts/platform-ui-contract.md), [contracts/tauri-ipc-contract.md](./contracts/tauri-ipc-contract.md), [contracts/import-launch-contract.md](./contracts/import-launch-contract.md), and [quickstart.md](./quickstart.md).

Post-design constitution check remains PASS:

- Platform-specific Atari 800 decisions are represented as data/capabilities, not hard-coded UI forks.
- The existing C64 path remains a platform profile and compatibility baseline.
- Launch contracts document RetroArch Atari800 and Altirra behavior before implementation.
- Validation includes workflow parity across browse/search/scroll/detail/extras/version flows.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
