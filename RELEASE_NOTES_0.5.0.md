# GBBox 0.5.0 Release Notes

## Highlights

GBBox 0.5.0 is a major desktop-quality release focused on performance, scale, and reliability.

- Library browsing is dramatically faster on large collections: games load in responsive 120-item pages, off-screen media is deferred, shelves load concurrently, and SQLite read work no longer blocks the UI.
- Platform support and setup are more reliable through a shared manifest and import workflow.
- BigBox and windowed libraries now use clearer platform backgrounds, while scrolling through large C64 libraries is stable with mouse and keyboard.
- SID music now checks configured Music and Scraped Media locations before offering HVSC download.
- Extras links correctly open websites externally; visual Extras and existing local media folders remain accessible through tightened asset permissions.

## Security and delivery

- Tauri filesystem and shell exposure is reduced, media asset access is scoped to configured folders, and media downloads require HTTPS with size limits.
- Secure settings now use a random per-install key stored in the operating-system keychain, with automatic migration of existing encrypted values.
- Pull requests and release builds run linting, frontend/backend tests, audit, production build, and browser smoke tests before packaging.

## Validation

The `v0.5.0` tag triggers the GitHub Actions Release Bundles workflow, which produces Windows, Linux, and macOS artifacts after the required quality gates pass.
