# Feature Specification: Multi-Platform GameBase Libraries

**Feature Branch**: `codex/spec-kit-constitution`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "Originally, this project's frontend was focused on Commodore 64 gamebase, but there are many others, we will add Atari 800, Atari 2600, and others. We can't assume what emulator the user will have locally. Retroarch will be a default for all, the equivalent C64 JavaScript emulator might not exist for other platforms, music may not be in the .sid format (so turned off or different for different platform). Launching files will be different from Commodore 64, m3u should work on RetroArch, but for other external emulators, we may need new ways to test and launch. Each new platform will have an MDB file to convert, and the folder structures are expected to be the same. We need a way for users to choose which platform to launch into if they haven't already (assuming they start up with the last-used platform). If they are choosing a platform that has not been imported yet, we need the import screen to import for that platform We need an option and design in the top menus to flip to another platform. For that to work, the local database needs to have a per-platform-level schema."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose Active Platform (Priority: P1)

A user with more than one GameBase collection can choose which platform library they want to browse, including Commodore 64, Atari 800, Atari 2600, and future supported GameBase platforms. On startup, the app resumes the user's last-used platform when it is still available. If no platform has been selected before, the app asks the user to choose a platform before entering the library.

**Why this priority**: Platform choice is the entry point for every other multi-platform behavior. Users cannot browse, import, configure, or launch the correct collection until the active platform is clear.

**Independent Test**: Can be tested by starting the app with multiple configured platforms, selecting a non-Commodore platform, restarting, and confirming the same platform opens by default.

**Acceptance Scenarios**:

1. **Given** the user has already selected Atari 800 as their last-used platform, **When** the app starts, **Then** the Atari 800 library context is active without requiring a new choice.
2. **Given** the user has no last-used platform, **When** the app starts, **Then** the user is prompted to choose from supported platforms before browsing games.
3. **Given** the user is browsing one platform, **When** they use the top menu platform switcher to choose another imported platform, **Then** the app changes to that platform's library, settings, and launch context.

---

### User Story 2 - Import a Platform Collection (Priority: P1)

A user can import a GameBase collection for a selected platform from that platform's MDB file and expected folder structure. If the user chooses a platform that has not been imported yet, the app takes them to an import flow for that platform instead of showing an empty or broken library.

**Why this priority**: New platform support depends on reliable per-platform onboarding. Users need to understand what is missing and complete the import before browsing or launching games.

**Independent Test**: Can be tested by selecting Atari 2600 before it has been imported and verifying that the import flow is clearly scoped to Atari 2600 and produces a browsable Atari 2600 library after completion.

**Acceptance Scenarios**:

1. **Given** Atari 2600 is supported but not imported, **When** the user selects Atari 2600 from platform choice, **Then** the app opens the Atari 2600 import flow.
2. **Given** a user imports a platform collection from a valid MDB and matching folders, **When** the import completes, **Then** that platform becomes available to browse and can be selected later.
3. **Given** an import fails because required source data is missing or invalid, **When** the error is shown, **Then** it names the selected platform and gives the user a clear path to correct the import inputs.

---

### User Story 3 - Configure Platform Launching (Priority: P1)

A user can launch games from any imported platform using an emulator choice that makes sense for that platform. RetroArch is available as the default emulator option for every platform, but users may configure other external emulators where supported. The app does not assume that a platform-specific JavaScript emulator exists.

**Why this priority**: Launching games is the core promise of the app. Multi-platform support must handle different emulator availability and launch formats without breaking existing Commodore 64 behavior.

**Independent Test**: Can be tested by configuring RetroArch for C64, Atari 800, and Atari 2600, then launching a representative game from each imported platform.

**Acceptance Scenarios**:

1. **Given** an imported platform has no platform-specific in-app emulator, **When** the user opens launch settings, **Then** RetroArch is offered as the default launch path and in-app emulation is not presented as available.
2. **Given** a platform supports an external emulator other than RetroArch, **When** the user configures that emulator, **Then** the app can test whether the configured launch path is usable for that platform.
3. **Given** a game requires a multi-file playlist or launch artifact, **When** the user launches with RetroArch, **Then** the app creates a platform-appropriate launch artifact and reports any failure clearly.

---

### User Story 4 - Respect Platform-Specific Media and Music (Priority: P2)

A user browsing different platforms sees only the media and playback features that apply to the active platform. Commodore 64 SID music remains available for C64 where configured, while other platforms can disable music or use a different supported music format in the future.

**Why this priority**: Platform differences should feel intentional rather than broken. Users should not see SID-specific controls on platforms where SID music is irrelevant.

**Independent Test**: Can be tested by switching between Commodore 64 and Atari 800 and confirming that music controls, extras, and media sections reflect each platform's imported content and capabilities.

**Acceptance Scenarios**:

1. **Given** the active platform does not support SID music, **When** the user opens a game detail page, **Then** SID-specific playback controls are hidden or replaced with platform-appropriate media behavior.
2. **Given** a platform has manuals, maps, screenshots, or other extras in the expected folder structure, **When** the user opens a game detail page, **Then** those extras are shown under that platform's library context.
3. **Given** a platform has no supported music playback, **When** the user browses games, **Then** music absence is treated as normal and not as an error.

---

### User Story 5 - Keep Platform Data Separate While Preserving App Workflows (Priority: P2)

A user can import and browse multiple platforms without one platform's games, media paths, favorites, launch settings, or search results leaking into another. Each platform has its own library state while the rest of the app continues to work the same way: browsing, searching, scrolling, opening game details, selecting extras, choosing versions, and returning from detail views should feel consistent regardless of the active platform.

**Why this priority**: Multi-platform collections can only scale if platform data is separated cleanly and users can trust that switching platforms changes the library context without relearning the app.

**Independent Test**: Can be tested by importing two platforms with overlapping game names, marking favorites and setting paths in each, then verifying each platform retains its own results and settings while the same browse, search, scroll, detail, extras, and version-selection flows remain available.

**Acceptance Scenarios**:

1. **Given** two imported platforms contain games with the same title, **When** the user searches within one platform, **Then** results are limited to the active platform unless the user intentionally chooses a cross-platform view.
2. **Given** the user changes launch settings for Atari 800, **When** they switch back to Commodore 64, **Then** Commodore 64 launch settings remain unchanged.
3. **Given** the user marks a game as favorite on Atari 2600, **When** they switch to Atari 800, **Then** that favorite does not appear in the Atari 800 favorites list unless the same platform entry was favorited there.
4. **Given** the user switches from Commodore 64 to another imported platform, **When** they browse, search, scroll, open details, view extras, or select versions, **Then** those workflows behave consistently with the existing app experience for the active platform's content.

### Edge Cases

- The last-used platform was removed, reset, or is no longer supported.
- A supported platform is selected before its collection has been imported.
- The user selects an invalid, missing, or wrong-platform MDB for Atari 800 import.
- The user cancels Atari 800 import and later returns to complete it.
- Atari 800 import fails and the user retries with corrected MDB and folder paths.
- A platform import succeeds but optional media folders are missing.
- Two platforms contain identical or near-identical game titles.
- RetroArch is not installed or its configured executable is no longer valid.
- A non-RetroArch emulator needs launch inputs that differ from the current Commodore 64 behavior.
- A platform has no supported music playback format.
- A game has multiple disks, tapes, carts, or files that need platform-specific launch handling.
- A user cancels platform selection or import before completion.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support multiple GameBase-style platforms, with Commodore 64 retained and Atari 800 and Atari 2600 included as initial non-Commodore targets.
- **FR-002**: The system MUST store and display an active platform for the current session.
- **FR-003**: The system MUST remember the last-used platform and restore it on startup when that platform remains available.
- **FR-004**: The system MUST prompt the user to choose a platform when no valid last-used platform exists.
- **FR-005**: Users MUST be able to switch platforms from a top-level menu while using the app.
- **FR-006**: When a user selects a supported platform that has not been imported, the system MUST send the user to an import flow scoped to that platform.
- **FR-007**: Each supported platform MUST have an import path for a platform-specific MDB file and the expected GameBase folder structure.
- **FR-008**: Imported catalog data, media paths, launch settings, favorites, and platform capabilities MUST be scoped by platform.
- **FR-009**: Search, filtering, alphabet navigation, and game detail views MUST default to the active platform's library.
- **FR-010**: The system MUST prevent platform-specific features from appearing as available when the active platform does not support them.
- **FR-011**: Browsing, searching, scrolling, game detail viewing, extras selection, version selection, favorites, and return/navigation flows MUST remain functionally consistent regardless of the active platform.
- **FR-012**: RetroArch MUST be available as the default emulator option for every supported platform.
- **FR-013**: The system MUST allow platform-specific external emulator options without assuming users have those emulators installed.
- **FR-014**: The system MUST provide a way to test whether a configured emulator can launch games for the selected platform.
- **FR-015**: Launch behavior MUST handle platform-specific file and playlist needs, including RetroArch-compatible multi-file playlists where applicable.
- **FR-016**: Existing Commodore 64 launch behavior, including native emulator and in-app emulation capabilities, MUST remain available for imported C64 collections.
- **FR-017**: Music and soundtrack features MUST be platform-capability driven, with SID playback limited to platforms and libraries that support SID content.
- **FR-018**: The system MUST show clear, platform-specific error messages when import, media discovery, emulator testing, or launch fails.
- **FR-019**: The system MUST support future GameBase platforms without requiring a separate copy of the whole browsing, search, import, or settings experience for each platform.
- **FR-020**: Atari 800 import MUST accept `Atari 800 v12.mdb` or an equivalent Atari 800 v12-compatible GameBase MDB, with the known local reference path `E:\Backups\RETRO-BACKUPS\Atari8bit\Atari 800\Atari 800 v12.mdb` available for validation when present.
- **FR-021**: Atari 800 setup MUST require Games, Music, Photos, and Screenshots folder settings.
- **FR-022**: Atari 800 music capability MUST recognize `.sap` as the platform music file type for future playback support.
- **FR-023**: Atari 800 platform switcher, import, and settings interactions MUST follow the same keyboard/gamepad interaction conventions as the existing Commodore 64 settings flows.
- **FR-024**: Existing flat Commodore 64 settings MUST migrate into C64 platform-scoped settings without losing user paths, emulator choices, or browsing state.
- **FR-025**: Altirra support for Atari 800 MUST include executable validation and real primary game-file launching in the first implementation slice.
- **FR-026**: The settings menu MUST show platform path pages only for imported platforms, label them by platform (for example, "C64 Platform Paths" and "Atari 800 Platform Paths"), and MUST NOT use a single generic "Local Paths" page for platform-scoped paths.

### Key Entities *(include if feature involves data)*

- **Platform**: A supported game system or family, such as Commodore 64, Atari 800, or Atari 2600; defines display name, import availability, media capabilities, music capabilities, and launch capabilities.
- **Platform Library**: The user's imported catalog and local configuration for one platform; includes import status, source MDB, media roots, library paths, and platform-specific settings.
- **Game Entry**: A browsable game record that belongs to exactly one platform library and may include metadata, versions, files, media, extras, and launch options.
- **Emulator Profile**: A user-configured launch option for one or more platforms; includes whether it is the default option, whether it can be tested, and what platforms it supports.
- **Launch Artifact**: A generated or selected item used to start a game, such as a playlist, extracted temporary file, or platform-specific launch input.
- **Media Capability**: A platform-level declaration of which media experiences are available, such as screenshots, manuals, videos, extras, SID music, or future music formats.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can select a supported platform and reach the correct import flow in under 60 seconds.
- **SC-002**: A returning user with an imported last-used platform reaches that platform's library without extra selection steps on at least 95% of app starts.
- **SC-003**: Users can switch between two imported platforms from the top menu in under 10 seconds without restarting the app.
- **SC-004**: Search and favorites results are limited to the active platform in 100% of tested same-title cross-platform cases.
- **SC-005**: RetroArch launch configuration can be completed and tested for Commodore 64, Atari 800, and Atari 2600 during acceptance testing.
- **SC-006**: Platform-specific unavailable features, such as SID playback on non-SID platforms, are hidden or clearly disabled in 100% of tested non-supporting platform views.
- **SC-007**: Import failures, emulator test failures, and launch failures identify the affected platform and next user action in 100% of tested failure cases.
- **SC-008**: Existing browse, search, scroll, detail, extras, version-selection, and back-navigation workflows pass acceptance testing for each initial supported platform.
- **SC-009**: Atari 800 setup accepts the reference `Atari 800 v12.mdb` path when available and rejects missing or wrong-platform MDB inputs with a platform-specific correction message.
- **SC-010**: Atari 800 setup records Games, Music, Photos, and Screenshots folder settings before the platform is considered import-ready.

## Assumptions

- Atari 800 and Atari 2600 are the first additional platforms after Commodore 64.
- Additional GameBase platforms will provide platform-specific MDB files and use broadly similar folder structures for games, screenshots, box art, videos, music, and extras.
- RetroArch is the baseline emulator option for every supported platform, but users may choose other external emulators when a platform profile supports them.
- In-app JavaScript or WASM emulation is optional per platform and should only be shown where an actual supported emulator exists.
- Cross-platform search is out of scope for the first version; the default browsing context is one active platform at a time.
- The app may keep Commodore 64-specific compatibility behavior while new features introduce platform-neutral concepts around it.
- The Atari 800 v12 reference MDB may exist locally at `E:\Backups\RETRO-BACKUPS\Atari8bit\Atari 800\Atari 800 v12.mdb`; the implementation must still allow the user to choose an equivalent Atari 800 v12-compatible MDB from another path.
- Atari 800 Photos means platform photo/media artwork distinct from gameplay/title screenshots; Screenshots means gameplay/title screenshots.
