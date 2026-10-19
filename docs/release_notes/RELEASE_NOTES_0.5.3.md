# GBBox 0.5.3 Release Notes

## Highlights

GBBox 0.5.3 is a patch release that restores SID music playback in packaged desktop builds and strengthens the repository's Graphify maintenance workflow.

- **Packaged SID playback restored**: SID tunes now play in installed Windows builds and the equivalent Linux and macOS bundles. The shared Tauri content security policy now permits jsSID to load the generated `blob:` URLs used for local SID bytes.
- **HVSC fallback preserved**: When a SID file is missing from both the configured music folder and scraped-media folder, GBBox still offers the HVSC scrape action, stores the downloaded tune, and enables playback.
- **Packaging regression coverage**: Automated tests now protect the packaged-app CSP requirement and the complete missing-local-SID scrape flow.
- **Current Graphify knowledge graph**: Stale nodes from deleted specification and architecture files were removed, current sources were re-clustered, and the Windows Codex sandbox behavior for uv-managed Graphify commands is documented.

## Validation

The `v0.5.3` tag triggers the GitHub Actions Release Bundles workflow. It runs linting, frontend and backend tests, audit, production build, and end-to-end tests before building and attaching the Windows installer, Linux AppImage, and macOS DMG to the GitHub release.
