# Contract: Import and Launch Behavior

## Atari 800 Import Contract

### Inputs

- Platform: `atari800`
- MDB source: `Atari 800 v12.mdb` or equivalent user-selected Atari 800 GameBase MDB
- Reference MDB path when available for validation: `E:\Backups\RETRO-BACKUPS\Atari8bit\Atari 800\Atari 800 v12.mdb`
- Required folder settings:
  - Games
  - Music
  - Photos
  - Screenshots

### Behavior

- Import flow is entered when Atari 800 is selected and not yet imported.
- Import validates that the selected MDB exists before export begins.
- Import rejects missing, invalid, or wrong-platform MDB inputs with an Atari 800-specific correction message.
- Import records Atari 800 as the platform scope for generated library data.
- Games, Music, Photos, and Screenshots folder settings are required for Atari 800 import readiness.
- Empty media folders do not block import if the user has configured valid folder paths.
- Import completion makes Atari 800 available in the platform switcher.
- Import failure stores a platform-scoped error and offers correction without affecting C64 data.

### Audit

- Imported Atari 800 data has platform identity.
- Search and game count are limited to Atari 800 when Atari 800 is active.
- Game extras and media paths resolve from Atari 800 folder settings.
- Atari 800 music paths recognize `.sap` files for future playback support.
- C64 import and browsing continue to work after Atari 800 import.

## RetroArch Atari 800 Launch Contract

### Inputs

- Platform: `atari800`
- Emulator profile: RetroArch Atari800
- RetroArch executable path
- Atari800 core path
- Game launch file or generated playlist artifact

### Behavior

- RetroArch is the default Atari 800 emulator profile.
- The core path is required before a RetroArch Atari 800 launch test can pass.
- Multi-file launches use a RetroArch-compatible playlist artifact where applicable.
- Atari 800 RetroArch multi-file launches use `.m3u` playlist artifacts where applicable.
- Temporary launch artifacts are created outside source library folders.
- Failure messages name Atari 800 and the RetroArch profile.

### Acceptance

- Emulator test fails clearly when executable path is missing.
- Emulator test fails clearly when Atari800 core path is missing.
- Launch passes with a valid executable, core path, and representative Atari 800 game file.

## Altirra Launch Contract

### Inputs

- Platform: `atari800`
- Emulator profile: Altirra
- Altirra executable path
- Game launch file or generated launch artifact

### Behavior

- Altirra appears only for Atari 800.
- Altirra path is stored as Atari 800 platform-scoped emulator setting.
- Altirra launch testing validates the executable path before any game launch.
- Altirra launch behavior is separate from RetroArch and does not require a RetroArch core.
- Altirra must launch a representative primary Atari 800 game file in the first implementation slice.
- Advanced multi-file Altirra handling may be planned separately after primary game-file launching works.
- Failure messages name Atari 800 and Altirra.

### Acceptance

- Altirra setting is not shown when C64 is active.
- Altirra test fails clearly when the executable path is missing.
- A configured Altirra profile can launch a representative primary Atari 800 game file.

## C64 Compatibility Contract

- Existing C64 launch behavior remains available.
- VICE `.vfl` behavior remains available for C64.
- RetroArch `.m3u` behavior remains available for C64.
- SID playback remains available for C64 where SID data exists.
- Adding Atari 800 must not change existing C64 browse/search/detail/extras/version workflows.
