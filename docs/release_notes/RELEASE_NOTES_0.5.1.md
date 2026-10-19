# GBBox 0.5.1 Release Notes

## Highlights

GBBox 0.5.1 is a patch release focused on debug logging capability, filesystem resolution corrections, and frontend media performance caching.

- **Frontend Caching (Performance)**: Implemented request coalescing and frontend path/URL caching for resolved media files and ObjectURLs. This prevents redundant Tauri IPC calls and disk thrashing when rendering or scrolling large game libraries in Grid and List views.
- **Built-in Debug Mode**: Added a debug logging mode (enabled via `--debug`/`-d` CLI flags or the `GAMEBASEBOX_DEBUG=1` environment variable). This logs clear cache hit/miss messages and warnings when images or media fail to resolve on disk.
- **Standardized File Logging**: All debug warnings and application logs are now persistently saved to rolling `main.log` files in the standard operating system directories (`%APPDATA%` on Windows, `~/Library/Logs` on macOS, and `~/.cache` on Linux) to simplify diagnosis of local configuration issues.
- **UNC Path Normalization**: Automatically strips the Windows-specific UNC prefix (`\\?\`) from canonicalized file paths in logs and outputs, making them user-friendly and ready for copy-pasting directly into Windows Explorer.
- **Musician Photo Fallback**: Added a beautiful placeholder silhouette image (`public/images/unknown-musician.png`) that automatically displays on the Game Detail view if a composer's photo is missing on disk or explicitly set to `(Unknown).jpg`.
- **Launch Scripts**: Provided convenience developer scripts (`tauri-dev-debug.bat` for Windows, `tauri-dev-debug.sh` for macOS/Linux) to easily start the app with debug logging active.

## Validation

The `v0.5.1` tag triggers the GitHub Actions Release Bundles workflow, which runs full quality gates (linting, frontend and backend unit tests, and production build checks) before generating the Windows, Linux, and macOS release packages.
