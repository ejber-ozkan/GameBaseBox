# Research: Multi-Platform GameBase Libraries

## Decision: Platform Registry With Scoped Library State

**Decision**: Represent Commodore 64, Atari 800, Atari 2600, and future systems as platform profiles in a registry. Each profile declares identity, display label, import expectations, media folder types, music capability, emulator profiles, launch file extensions, and feature availability.

**Rationale**: The current app has C64 assumptions spread through settings, query models, launch handling, SID playback, and import defaults. A registry makes platform differences explicit while preserving one shared browsing and detail experience.

**Alternatives considered**:

- Duplicate UI and backend flows per platform. Rejected because it would drift quickly and violate the requirement that browsing/search/detail/extras/version workflows remain the same.
- Add Atari 800 conditionals directly where needed. Rejected because Atari 2600 and later platforms would multiply special cases.

## Decision: Atari 800 as the First Non-C64 Implementation Slice

**Decision**: Plan the first implementation slice around Atari 800, with Atari 2600 remaining represented in the platform model but not fully implemented by this slice.

**Rationale**: The user provided concrete Atari 800 details: `Atari 800 v12.mdb` or equivalent, a known local reference path at `E:\Backups\RETRO-BACKUPS\Atari8bit\Atari 800\Atari 800 v12.mdb`, RetroArch Atari800 core, Altirra, and required folder settings for Games, Music, Photos, and Screenshots. This gives enough specificity to prove the platform abstraction without boiling the ocean.

**Alternatives considered**:

- Implement Atari 800 and Atari 2600 simultaneously. Rejected because emulator, media, and file handling differences should be validated on one non-C64 platform before expanding.
- Only create an abstract platform model. Rejected because the abstraction needs a real platform acceptance target.

## Decision: RetroArch Default, Altirra Platform-Specific External Emulator

**Decision**: Add RetroArch as the default Atari 800 emulator profile using the Atari800 core, and add Altirra as an Atari 800-specific external emulator profile with its own path setting, executable validation, and primary game-file launch support in the first implementation slice.

**Rationale**: RetroArch gives the app a consistent default emulator story across platforms. Altirra is a strong Atari 800-specific option but should not appear as a global emulator for other platforms.

**Alternatives considered**:

- Require Altirra for Atari 800. Rejected because the spec says the app cannot assume which local emulator the user has.
- Only support RetroArch. Rejected because the user explicitly requested Altirra as an external emulator option.

## Decision: Platform-Scoped Settings Instead of More Flat Settings

**Decision**: Introduce platform-scoped settings for media roots, emulator paths, core paths, preferred emulator, import status, and per-platform navigation state. Atari 800 settings require Games, Music, Photos, Screenshots, RetroArch path/core, and Altirra path. Existing flat C64 settings migrate into the C64 platform namespace on first run.

**Rationale**: Current settings are flat and C64-shaped (`screenshotsPath`, `soundsPath`, `musicianPhotosPath`, `romsPath`, `emulatorPath`, `retroarchCorePath`). Adding more flat fields would not scale to Atari 2600 or later platforms and would risk leaking settings between platforms.

**Alternatives considered**:

- Keep existing flat settings and prefix Atari settings. Rejected because it is a short-term patch that makes platform switching harder to reason about.
- Store all settings only in SQLite immediately. Rejected for first slice because current app already uses localStorage plus secure settings; migration can be incremental as long as the typed shape is platform-scoped.

## Decision: Platform-Aware Import Pipeline With One Active Library Database

**Decision**: Extend the import pipeline to accept platform ID, MDB path, export directory, and target database/library identity. For the first slice, support importing Atari 800 from `Atari 800 v12.mdb`, the known local reference path when available, or an equivalent Atari 800 v12-compatible user-selected MDB into platform-scoped SQLite structures while preserving current C64 import compatibility.

**Rationale**: GameBase MDB exports are expected to have broadly similar folder/table structures, but the app needs platform identity in imported rows, views, indexes, and import status. Import must be repeatable and auditable per platform.

**Alternatives considered**:

- Maintain separate SQLite files per platform. Still possible later, but rejected for first plan because current query surfaces expect one database path and platform-scoped tables/views can preserve workflow consistency more directly.
- Rewrite import from scratch. Rejected because current export/import/audit scripts already encode useful GameBase behavior.

## Decision: Platform-Aware Launch Artifacts

**Decision**: Replace C64-only launch handling with platform profile launch rules. RetroArch can receive a platform core and a ROM/playlist artifact. Altirra receives Atari 800-compatible file inputs. C64 retains VICE `.vfl` and RetroArch `.m3u` behavior.

**Rationale**: Current launcher filters zip contents for C64 extensions and applies VICE flags to all non-RetroArch emulators. Atari 800 needs different compatible extensions and Altirra launch behavior.

**Alternatives considered**:

- Reuse C64 launch filtering for Atari 800. Rejected because the file extensions and emulator arguments are different.
- Treat all external emulators as raw file launchers. Rejected because multi-file games and emulator-specific flags still need explicit contracts and tests.

## Decision: Capability-Driven Media and Music UI

**Decision**: Make media and music controls driven by platform capabilities. C64 continues to expose SID where available. Atari 800 starts with required Music, Photos, and Screenshots folder settings, recognizes `.sap` as the Atari music file extension for future playback support, and does not expose SID-specific UI.

**Rationale**: The user explicitly noted that other platforms may not have SID music and may have different media types. Hiding unsupported features is less confusing than showing disabled C64 controls everywhere.

**Alternatives considered**:

- Keep SID controls globally visible. Rejected because it makes non-C64 platforms feel broken.
- Remove all music controls outside C64 forever. Rejected because future platforms may support different music formats.

## Decision: Workflow Parity Is an Acceptance Target

**Decision**: Treat existing browse, search, scroll, detail, extras, version selection, favorites, and back-navigation workflows as cross-platform acceptance tests.

**Rationale**: The user explicitly requested the rest of the app behave exactly the same regardless of selected platform. This must be tested as an invariant, not assumed.

**Alternatives considered**:

- Validate only platform selection/import/launch. Rejected because it would miss regressions in the core library experience.
