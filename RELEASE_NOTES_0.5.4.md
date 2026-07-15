# GBBox 0.5.4 Release Notes

## Highlights

GBBox 0.5.4 makes legacy Extras videos practical across packaged Windows, Linux, and macOS builds while preserving users' existing AVI collections.

- **Three playback paths for legacy videos**: GBBox can play a compatible MP4 inside the interface, retain and open the original AVI in the operating system's registered player, or create an MP4 sidecar when FFmpeg is available.
- **Archive.org retrieval in the Extras interface**: Matching C64 Gamevideoarchive videos can be downloaded directly as compatible MP4 derivatives, with percentage, transfer-speed, and remaining-time feedback during the download.
- **Reliable download and conversion state**: Completed media is detected immediately, stale download actions disappear, compatible videos autoplay, and completion messaging remains brief.
- **Working fullscreen playback**: Fullscreen now targets the real media container and preserves usable video controls.
- **Valid interactive markup**: Video previews and thumbnail actions no longer create nested buttons, eliminating the associated React hydration errors.
- **Native external-player launch**: Windows no longer relies on `cmd start`, fixing `The request is not supported. (os error 50)` while keeping the same system-default-player behavior on Linux and macOS.

## Validation

The `v0.5.4` tag triggers the GitHub Actions Release Bundles workflow. It runs linting, frontend and backend tests, audit, production build, and end-to-end tests before building and attaching the Windows installer, Linux AppImage, and macOS DMG to the GitHub release.
