# GBBox 0.7.1

This patch release delivers macOS compatibility and stability fixes, including app bundle emulator resolution, file picker enhancements, cross-platform path normalization, window state refinements, and streamlined build scripts.

## Changes

- Support selecting macOS App Bundles (`.app`) directly across emulator profiles, resolving bundled executables in `Contents/MacOS` and companion `bin/` launcher directories (supporting official VICE and RetroArch macOS distributions).
- Update native file dialog filters on macOS to explicitly expose `.app` bundles alongside traditional binaries.
- Normalize Windows backslashes (`\`) across media resolution, variant detection, and asset loading so partitioned GameBase databases and assets load seamlessly on macOS and Linux.
- Prevent redundant fullscreen state toggles and window resizing flickers on macOS with the new `is_window_fullscreen` IPC query and state checks.
- Add macOS/Linux convenience scripts (`tauri-build.sh`, `tauri-clean.sh`, `tauri-dev.sh`, `tauri-dev-debug.sh`) with dependency pre-flight checks and cross-platform launcher test coverage.
- Improve SID player controls, state management, and settings tab decoupling.

## Validation and known limitations

Automated frontend, backend, and build launcher suites pass on macOS. Cross-platform bundle compilation and integrity validation are executed in GitHub Actions. Users running on macOS should ensure emulator `.app` bundles have execution permissions granted by macOS Gatekeeper / Security settings if downloaded outside the Mac App Store.

## Upgrade and rollback

Quit GBBox and all emulators before upgrading. Standard profile data and imported databases remain compatible with 0.7.0. To roll back, reinstall GBBox 0.7.0.

Distribution filenames remain `GBBox-Windows-x64-Setup.exe`, `GBBox-Linux.AppImage` and `GBBox-macOS.dmg`. The release includes SHA-256 checksums for download verification.
