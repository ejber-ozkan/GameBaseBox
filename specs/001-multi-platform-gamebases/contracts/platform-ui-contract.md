# Contract: Platform UI Behavior

## Purpose

Define the user-facing behavior required when multiple GameBase platforms are available.

## Platform Selection

- On startup, if a valid last-used imported platform exists, the app opens that platform.
- If no valid imported platform exists, the app shows a platform choice before the library browser.
- Selecting an imported platform enters the normal library browser for that platform.
- Selecting an unimported supported platform opens the import flow for that platform.

## Top Menu Platform Switcher

- The top menu exposes the active platform and a way to switch to another supported platform.
- Imported platforms are selectable for browsing.
- Unimported platforms are selectable but route to their import flow.
- Switching platforms must not require an app restart.
- The switcher follows the same keyboard and gamepad navigation conventions as existing Commodore 64 settings and menu controls.

## Workflow Parity

The following workflows must remain functionally consistent for every imported platform:

- Browse grid and list views.
- Search by text.
- Filter by genre/subgenre where metadata exists.
- Scroll and alphabet navigation.
- Open and close game detail views.
- View screenshots/photos/media where configured.
- Select extras where imported data exists.
- Select game versions/variants where imported data exists.
- Toggle favorites scoped to the active platform.
- Return/back navigation from details and overlays.
- BigBox/fullscreen navigation with keyboard and gamepad.

## Platform-Specific Capability Display

- C64 SID controls appear only for C64 or other platforms that explicitly support SID.
- Atari 800 must not show SID-specific controls by default.
- Settings must show platform path pages only for imported platforms, using labels such as "C64 Platform Paths" and "Atari 800 Platform Paths".
- Settings must not expose a single generic "Local Paths" page for platform-scoped folder and emulator paths.
- Atari 800 settings expose Games, Music, Photos, and Screenshots folders.
- Atari 800 recognizes `.sap` music files as the platform music type for future playback support.
- Atari 800 Photos means photo/media artwork distinct from gameplay/title screenshots.
- Atari 800 launch settings expose RetroArch Atari800 core and Altirra.
- Unsupported features are hidden or clearly unavailable; absence of a music format is not an error.

## Error Behavior

- Import errors name the selected platform.
- Emulator configuration errors name the selected platform and emulator profile.
- Launch errors name the platform, emulator profile, and next user action when possible.
- Missing optional media folders do not block browsing.
