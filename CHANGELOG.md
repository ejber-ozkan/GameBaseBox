# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.5.3] - 2026-07-14

### Changed
- Refreshed the checked-in Graphify knowledge graph to remove stale nodes from deleted specification and architecture files while preserving current semantic documentation.
- Documented the Windows Codex sandbox behavior for uv-managed Graphify commands so future tooling checks distinguish sandbox access restrictions from a broken local installation.
- Bumped package, Tauri, Cargo, lockfile, and root version metadata to `0.5.3`.

### Fixed
- Fixed SID tunes failing to play in packaged Windows, Linux, and macOS builds by allowing jsSID to load generated `blob:` URLs through the shared Tauri content security policy.
- Preserved and regression-tested the HVSC scrape fallback when a SID tune is absent from both the configured local music folder and scraped-media folder.

## [0.5.2] - 2026-07-13

### Changed
- Replaced the deprecated Node 20 GitHub release action with the GitHub CLI available on Node 24-hosted runners.
- Bumped package, Tauri, Cargo, lockfile, and root version metadata to `0.5.2`.

### Fixed
- Fixed screenshots and other local images appearing blank in Windows production builds by using Tauri asset URLs with the correct asset-protocol CSP origin.
- Fixed the `ImageSlider` missing React effect dependency warning and kept missing-image diagnostics aligned with the current game title.

## [0.5.1] - 2026-07-13

### Added
- Added built-in debug logging mode (enabled via `--debug`/`-d` flags or `GAMEBASEBOX_DEBUG=1` environment variable) to diagnose media resolution issues.
- Added persistent file logging so application logs are saved to a standard rolling `main.log` file in the user's application data/cache directory.
- Added a fallback silhouette image (`public/images/unknown-musician.png`) on the Game Detail view if a musician's photo is missing on disk or named `(Unknown).jpg`.
- Added developer launch scripts `tauri-dev-debug.bat` and `tauri-dev-debug.sh` for starting the app in debug mode.

### Changed
- Bumped package, Tauri, Cargo, lockfile, and root version metadata to `0.5.1`.

### Fixed
- Fixed frontend media path and ObjectURL resolution caching to prevent redundant backend Tauri IPC calls and disk thrashing during library navigation.
- Fixed log output formatting on Windows by automatically stripping the UNC prefix (`\\?\`) from canonicalized disk paths for easy copying to Windows Explorer.

## [0.5.0] - 2026-07-12

### Added
- Added a canonical platform manifest and shared import workflow across setup surfaces.
- Added platform-scoped persisted media access, tighter Tauri capabilities/CSP, OS-keychain encryption, and mandatory PR/release quality gates.

### Changed
- Dramatically improved library responsiveness with 120-item append paging, deferred off-screen media work, concurrent shelf loading, and background SQLite workers.

### Fixed
- Fixed long windowed library browsing, platform backgrounds, SID media lookup, Extras website links, and asset access for configured media folders.

## [0.4.1] - 2026-07-03

### Fixed
- Fixed VIC-20 platform imports so the backend conversion path accepts the canonical `vic20` platform ID.
- Normalized user-facing VIC-20 names such as `VIC-20`, `VIC 20`, and `Commodore VIC-20` to the same canonical platform.
- Updated the VIC-20 import helper metadata to recognize the real `Vic20_v03.mdb` source filename.

### Changed
- Bumped package, Tauri, Cargo, lockfile, and root version metadata to `0.4.1`.
- Removed the dated `graphify-out/2026-06-28` backup snapshot from Git and ignored future dated Graphify backup folders.

## [0.4.0] - 2026-07-03

### Added
- Added Atari ST and Commodore VIC-20 as importable GameBase platforms with Extras, Games, Screenshots, and Music folder setup.
- Added Atari ST emulator profiles for RetroArch, STeem, and Hatari.
- Added Commodore VIC-20 emulator profiles for RetroArch and VICE.
- Added platform-specific windowed library backgrounds for Atari ST and VIC-20 using the images in `docs/images/backgrounds`.
- Added release notes for the GBBox 0.4.0 release.

### Changed
- Bumped package, Tauri, Cargo, lockfile, and root version metadata to `0.4.0`.

## [0.3.1] - 2026-07-02

### Changed
- Increased the windowed grid and list platform background image visibility by about 20% while keeping the existing overlay treatment.
- Bumped package, Tauri, Cargo, lockfile, and root version metadata to `0.3.1`.

## [0.3.0] - 2026-07-02

### Added
- Added Acorn BBC Micro and Commodore Amiga GameBase import options with Extras, Games, Screenshots, and Music folder setup.
- Added RetroArch defaults plus BeebEm and WinUAE/UAE external emulator profiles for BBC Micro and Amiga.
- Added subtle rotating library backgrounds for windowed grid/list views using the images in `docs/images/backgrounds`.
- Added release notes for the GBBox 0.3.0 release and linked all current public release notes from the README.

### Changed
- Bumped package, Tauri, Cargo, lockfile, and root version metadata to `0.3.0`.
- Updated the GitHub Actions release workflow to use the matching `RELEASE_NOTES_<version>.md` file as the GitHub release body.

### Fixed
- Fixed Commodore Amiga multi-disk launch packaging so sibling `_DiskN.zip` archives are temporarily extracted together before RetroArch `.m3u` generation.
- Fixed WinUAE/UAE launches for multi-disk Amiga games by attaching extracted disks with drive switches and preloading the Disk Swapper list.
- Ignored local MDB CSV export dumps under `exports/` so inspection files stay out of Git history.

## [0.2.0] - 2026-07-01

### Added
- Added ZX Spectrum import support for GameBaseZX / SpeccyMania-compatible Sinclair ZX Spectrum v6 MDBs.
- Added ZX Spectrum folder setup for Extras, Games, Screenshots, Musician Photos, and Music, with `.ay` music media tracked for future playback evaluation.
- Added ZX Spectrum emulator profiles with RetroArch as the default and Spectaculator as the secondary external emulator option.
- Added release notes for the GBBox 0.2.0 release.

### Changed
- Updated release workflow asset names from legacy `64Box-*` names to the public `GBBox-*` download names.
- Bumped package, Tauri, Cargo, and root version metadata to `0.2.0`.

### Fixed
- Fixed the first-run import transition so the library browser refreshes when an active platform changes from not imported to imported.

## [0.1.0] - 2026-06-28

### Added
- Launched the GameBaseBox public release plan under the new **GBBox** short name and **GameBase Box** long name.
- Documented first-release import support for Commodore 64, Atari 800, and Atari 2600, with more GameBase platforms coming soon.
- Added `RELEASE_NOTES_0.1.0.md` for the first public GBBox release.

### Changed
- Rebranded public-facing app metadata, README copy, and app chrome from 64Box to GBBox.
- Reset public release version metadata to `0.1.0` for the clean-history `GameBaseBox` repository.

## [0.7.0] - 2026-04-19

### Added
- Created comprehensive architecture documentation (`docs/architecture-review.md`) outlining the Summary vs Detail payload paradigm, mathematical coordinate-based navigation, and the isolated SQLite query-builder architecture.
- Added comprehensive E2E validation gating built on Playwright to ensure seamless testing across BigBox, searching, and detail overlays.

### Changed
- Dramatically reduced high-volume Tauri-Javascript payload overhead by restructuring the database pipeline. The `Game` interface now lazily omits exhaustive properties (like musician mapping, control flags) during list hydration and eagerly fetches them through the new `getDbGameDetail` invocation only upon user selection.
- Refactored `useBigBoxNavigation` by extracting massive switch/case blocks into pure, mathematically deterministic focal calculations (`navigation-math.ts`).
- Decoupled `ExtrasDetail.tsx` into concise semantic components (`ResolvedExtraMedia.tsx`, `VisualExtrasBrowser.tsx`) terminating deeply nested component leaks in canvas generation.
- Hardened Rust database interactions by replacing monolithic global states with localized SQLite parameter-bind utilities within `src-tauri/src/commands/db/querying.rs`, explicitly thwarting SQL injection avenues without compromising query composability.
- Consolidated disparate Extras mapping algorithms within the React application, purging `steam-extras.ts` in favor of a universal `extras.ts` abstraction.

### Fixed
- Fixed sequential table locks during automated backend testing by properly structuring `cargo test` boundaries against local SQLite instances.
- Fixed React hydration mismatches on initialization by carefully guarding `localStorage` lookups behind environment checks and safely deferring application UI overlay rendering.

## [0.6] - 2026-03-29
- Added a root `VERSION` file to act as the central release-version source for future packaging and release work.
- Added DPI-aware fullscreen detail diagnostics showing native resolution, viewport, layout tier, and resolved design surface.
- Added inline extras-video support in the big-screen extras browser, including fullscreen playback and thumbnail badges for video items.
- Added direct native path opening for local media files so windowed-mode video extras can launch in the OS default player.
- Added platform download badges for Windows, Linux, and macOS to the README release section.

### Changed
- Rebuilt the fullscreen 64Box detail view around deterministic 16:9 layout tiers from `1280x720` through `3840x2160`, replacing heuristic transform-fit behavior.
- Unified single-game detail pages onto the responsive 64Box theme and removed the older alternate detail themes from active use.
- Reworked detail-page panel composition so metadata moves into the hero area, `Credits` uses a compact list layout, and the right sidebar prioritizes alternatives, soundtrack, version details, and credits.
- Refined alternative-version selection with icon-first navigation, per-game persistence, and launch behavior that respects the selected version.
- Updated BigBox header controls so search, genre chips, sub-genre chips, and `#-Z` jump buttons share a consistent pill-style focus treatment.
- Restyled detail-view launch buttons with tighter 64Box-themed controls and scalable iconography.
- Updated README screenshots/documentation for the current windowed and fullscreen browsing experience.
- Bumped surfaced app versioning to `0.6.0`.

### Fixed
- Fixed `Recent Games` so only actually launched titles are recorded instead of games merely opened in detail view.
- Fixed fullscreen/detail navigation so controller and keyboard traversal now reaches play buttons, screenshots, box art, alternative versions, soundtrack, and extras more logically.
- Fixed 4K/TV fullscreen detail behavior under Windows display scaling by separating native resolution, CSS viewport size, and layout design tiers.
- Fixed repeated fullscreen clipping/overlap issues across screenshots, box art, lower panels, right sidebar panels, and extras gallery layouts.
- Fixed extras-gallery focus styling so the main extras panel no longer overhangs the right sidebar while focused.
- Fixed box-art fullscreen opening so the box-art panel enlarges the actual artwork instead of the screenshot.
- Fixed unstable detail `useEffect` dependency handling that was triggering the “final argument passed to useEffect changed size” runtime error.
- Fixed windowed-mode media opening for local extras files by routing them through the system default application instead of URL-scoped shell validation.

## [0.5] - 2026-03-21

### Added
- Added contextual sub-genre filtering to both windowed browsing and BigBox, including database queries for distinct sub-genres and filtered result counts.
- Added shared detail-title banner artwork so available cover or box art can fill the top hero area across all single-game themes.
- Added a reusable `More...` sub-genre picker for cases where a selected genre has too many sub-genres to fit comfortably in one header row.
- Added a BigBox `LT` controller shortcut and footer hint so players can jump back to the top menu from anywhere in the library.

### Changed
- Reworked detail headers to prefer stretched banner artwork with stronger readability treatment for overlaid title text.
- Updated BigBox and windowed browsing so active search or genre filters surface `GAMES FOUND` counts instead of the unfiltered library total.
- Refined README feature wording to better describe fullscreen mode, enhanced search, and the import/setup flow.
- Updated surfaced app versioning to `0.5.0`.

### Fixed
- Fixed BigBox/controller navigation friction when large sub-genre sets overflow the header by routing the full list through a dedicated picker.
- Fixed repeated state-update loops in BigBox data loading and input-mode handling that could trigger `Maximum update depth exceeded` console errors.
- Fixed gamepad hook lint/runtime hygiene by moving handler ref synchronization out of render and adding the missing left-trigger mapping.

## [0.4] - 2026-03-20

### Added
- Added a packaged first-run database setup flow so shipped builds can prompt for `GBC_v19.mdb`, export it, build SQLite, and continue into the app without a developer-only import step.
- Added GitHub Actions release automation for Linux and macOS tag builds while keeping Windows release bundling available as a local/manual path to save private Actions minutes.
- Added more aggressive BigBox performance controls for rapid letter jumping, including delayed alphabet rail loading, rail caching, and deferred tile media mounting.

### Changed
- Moved the public release workflow to local Windows bundling plus GitHub-hosted Linux/macOS release builds.
- Reworked windowed browsing to better match BigBox with branded header treatment, recent/favorites/classics sections, and cleaner list-mode separation.
- Split responsive windowed detail layouts from fullscreen detail layouts so fullscreen theme changes no longer spill into window mode.
- Improved Steam fullscreen extras gallery behavior with capped internal scrolling, left/right fullscreen image browsing, and contained artwork previews.
- Updated surfaced app versioning to `0.4.0`.

### Fixed
- Fixed BigBox horizontal rail looping so wraparound on classics/recent/favorites rails no longer loses the focus ring or resets rail focus unexpectedly.
- Fixed BigBox grid scrolling so long alphabet sections keep the focused tile in a more visible middle band.
- Fixed multiple BigBox return-state issues when backing out of detail views so search, filters, rail position, and focused game are preserved more reliably.
- Fixed fullscreen detail extras-gallery navigation so the highlighted item scrolls inside the gallery box and exits the region more naturally.
- Fixed Steam/fullscreen extras artwork cropping by switching gallery cards to contained previews and resizing the gallery viewport to full visible rows.

## [0.3] - 2026-03-15

### Added
- Added a controller search keyboard overlay for BigBox fullscreen search, with live filtering and `B` to close without clearing the current query.
- Added fullscreen BigBox UI sound effects, including launch, navigation, search/filter, detail-open, popup, view-switch, and rotating close cues.
- Added a startup splash overlay using `c64days-wallpaper.png` and the `64Box` marque, shown on both windowed and BigBox launch.
- Added shared detail-title rendering so all single-game themes now show trophy flanks around the game title.

### Changed
- Reworked windowed library mode to better match BigBox browsing, including branded header treatment, genre chips under search, and dedicated recent/favorites/classics shelves.
- Split windowed single-game detail into responsive layouts across all themes, while keeping fullscreen/BigBox detail behavior separate.
- Refined BigBox fullscreen exit handling so controller `B` opens a confirmation dialog, optionally persists “don’t ask again”, and waits for the close cue before quitting.
- Updated surfaced app versioning to `0.3.0`.

### Fixed
- Fixed popup open sounds so conditionally mounted dialogs like the BigBox exit prompt now correctly play rotating popup audio on first open.
- Fixed missing trophy styling on detail titles across fullscreen and windowed themes.
- Fixed several windowed-library inconsistencies, including list-mode shelf separation, settings-button labeling, and window-only rail behavior.

## [0.2] - 2026-03-14

### Added
- Split major frontend hotspots into focused hooks and subcomponents for BigBox, Steam detail, settings, and the library shell.
- Added architecture review notes documenting new component and hook boundaries.
- Added explicit SQLite support indexes, persisted `GameCoverIndex`, and FTS5-backed `GameSearchIndex`.
- Added backend fallback so older databases without `GameSearchIndex` still search through the legacy `LIKE` path instead of failing.
- Added frontend and backend tests for new navigation, helper, and database support logic.

### Changed
- Reworked game list loading to fetch ordered IDs first and hydrate detail rows separately, removing wide-row sorting from the hot path.
- Updated the database import flow so fresh MDB/CSV imports create indexes, cover lookup, and FTS support objects automatically.
- Updated runtime DB initialization so older local databases self-heal support tables and indexes on app startup.
- Normalized surfaced app versioning to `0.2.0`.
- Expanded Windows setup docs with the official Microsoft Access Database Engine download link.

### Fixed
- Fixed search failures on older local databases where `GameSearchIndex` was missing.
- Fixed remaining database hot paths around cover lookup and search latency.
- Fixed root local backup file handling by ignoring `gb64.sqlite.bk`.

## [0.1] - 2026-03-14

### Added
- BigBox-style fullscreen browsing mode with larger rails and favorites integration.
- Cover-first media flow for tiles and detail pages.
- Favorites toggling via controller `Y` and keyboard `F` across library, BigBox, and detail views.
- README screenshots, shortcut documentation, and GB64 attribution.
- Settings `About & Credits` updates, including GB64 acknowledgement and Tiger Heli shortcut.

### Changed
- Reworked single-game detail navigation for controller and keyboard.
- Split detail extras into launchable variants and separate gallery media tabs.
- Improved Steam-style detail layout, play button positioning, and media presentation.
- Expanded search to include graphics and additional credit metadata.
- Updated rail subtitle fallback to prefer publisher, then developer, then `Unknown`.

### Fixed
- BigBox rail alignment and section jump positioning.
- Up/down traversal between letter sections and rails.
- Fullscreen media sizing for tall covers and extra artwork.
- Main game launch fallback for titles with missing `gameFilename` but valid primary ROM paths.
