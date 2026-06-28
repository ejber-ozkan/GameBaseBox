# Quickstart: Validate Multi-Platform GameBase Libraries

## Prerequisites

- Existing C64 library still imports and browses.
- Atari 800 GameBase MDB available as `Atari 800 v12.mdb` or equivalent. The known local reference path is `E:\Backups\RETRO-BACKUPS\Atari8bit\Atari 800\Atari 800 v12.mdb` when available.
- Atari 800 required folder roots available:
  - Games
  - Music
  - Photos
  - Screenshots
- RetroArch installed with the Atari800 core available.
- Altirra available on a supported local system when validating Altirra behavior.

## Fixture Notes

- Atari 800 reference MDB: `E:\Backups\RETRO-BACKUPS\Atari8bit\Atari 800\Atari 800 v12.mdb`.
- Atari 800 expected folder names: `Games`, `Music`, `Photos`, and `Screenshots`.
- Atari 800 music fixture files may use `.sap`; they are recognized for future playback but do not enable SID UI.
- Atari 800 launch fixture files should include at least one representative primary file such as `.atr` or `.xex`, and a multi-file `.m3u` case for RetroArch.

## Setup

1. Start from a clean app state or a state with only C64 imported.
2. Open the app.
3. Confirm the active platform is C64 when C64 is the last-used imported platform.
4. Open the top menu platform switcher.
5. Select Atari 800.

Expected result: If Atari 800 is not imported, the app routes to the Atari 800 import flow.

## Validate Atari 800 Import

1. In the Atari 800 import flow, choose `Atari 800 v12.mdb` or equivalent.
2. Set Atari 800 folders:
   - Games
   - Music (`.sap` files are recognized for future Atari music playback support)
   - Photos (Atari photo/media artwork, distinct from gameplay/title screenshots)
   - Screenshots (gameplay/title screenshots)
3. Start import.
4. Wait for import completion.
5. Enter the Atari 800 library.

Expected result: Atari 800 appears as an imported platform, game count is non-zero for a valid import, all four Atari 800 folder settings are recorded, and C64 remains available.

## Validate Platform Switching

1. Browse Atari 800.
2. Switch to C64 from the top menu.
3. Switch back to Atari 800.
4. Restart the app.

Expected result: Switching does not require restart, and the app restores the last-used imported platform on startup.

## Validate Workflow Parity

Run these checks for C64 and Atari 800:

1. Browse grid view.
2. Browse list view.
3. Search by title.
4. Filter by genre/subgenre where metadata exists.
5. Scroll through a large result set.
6. Use alphabet navigation.
7. Open game details.
8. View screenshots/photos/media where configured.
9. Select extras where data exists.
10. Select versions/variants where data exists.
11. Toggle favorite.
12. Return from detail view to the prior browsing position.
13. Repeat core navigation in BigBox/fullscreen mode.

Expected result: Workflows behave consistently across platforms, while content remains scoped to the active platform.

## Validate RetroArch Atari 800

1. Open Atari 800 launch settings.
2. Select RetroArch Atari800 as preferred emulator.
3. Set RetroArch executable path.
4. Set Atari800 core path.
5. Run emulator profile test.
6. Launch a representative Atari 800 game.

Expected result: Test passes with valid paths, launch starts through RetroArch, and failures name Atari 800 and RetroArch when paths are invalid.

## Validate Altirra

1. Open Atari 800 launch settings.
2. Select Altirra.
3. Set Altirra executable path.
4. Run emulator profile test.
5. Launch a representative primary Atari 800 game file.
6. Switch to C64 settings.

Expected result: Altirra appears for Atari 800, does not require a RetroArch core, launches a representative primary Atari 800 game file, and does not appear as a C64 emulator setting.

## Validate Platform Isolation

1. Mark an Atari 800 game as favorite.
2. Search for a title that also exists in C64, if available.
3. Switch to C64.
4. Review favorites and search results.
5. Switch back to Atari 800.

Expected result: Favorites, search results, media paths, launch settings, and selected emulator remain scoped to each platform.

## Validate C64 Settings Migration

1. Start with existing Commodore 64 paths and emulator settings saved in the older flat settings shape.
2. Open the app after platform-scoped settings are available.
3. Select Commodore 64.
4. Review paths, emulator choices, favorites, recently played, selected game, focused index, view mode, and BigBox focus state.

Expected result: Existing C64 settings and navigation state are preserved under the C64 platform settings without data loss.

## Recommended Commands

```bash
npm run lint
npm run test:frontend
npm run test:backend
npm run build
```

Run Playwright coverage for platform selection, import routing, settings, and workflow parity once implementation exists.

## Phase 8 Validation Record

Recorded on 2026-06-28 for branch `codex/spec-kit-constitution`.

| Check | Command | Result |
|-------|---------|--------|
| Frontend unit tests | `npm run test:frontend` | PASS: 32 files, 168 tests |
| Backend Rust tests | `npm run test:backend` | PASS: 91 tests, serial backend run |
| Lint | `npm run lint` | PASS |
| Production build | `npm run build` | PASS |
| Playwright platform validation | `npx playwright test --project=chromium` | PASS: 7 Chromium tests |
| Full configured Playwright suite | `npm run test:e2e` | BLOCKED locally: Chromium launch required unsandboxed execution, and the configured `mobile-safari` project could not run because WebKit was not installed at `C:\Users\ejber\AppData\Local\ms-playwright\webkit-2248\Playwright.exe` |

The Chromium Playwright validation covers platform selection, Atari 800 import routing, C64 platform path settings persistence, and Atari 800 launch-settings visibility for RetroArch Atari800 and Altirra.

## Closure Note

This spec is complete as of 2026-06-28. Atari 800 import support is complete, Atari 2600 import support has been enabled in the same platform-scoped flow, and public release/rebrand work continues in `specs/002-gamebasebox-public-release/`.
