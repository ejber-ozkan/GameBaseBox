Product Requirements Document: Modern Gamebase64 Frontend

1. Project Overview

Name: GBBox / GameBase Box
Goal: Create a modern, fast, and visually rich cross-platform frontend for GameBase-style databases, with GameBase64 (GB64) as the compatibility baseline. It must replicate core features of the original Windows-only GameBase frontend while using modern UI/UX paradigms and running across desktop platforms.

2. Target Platforms & Proposed Tech Stack

To achieve cross-platform compatibility (Windows, macOS, Linux, iOS), the following technology stack is highly recommended for the AI agents:

Frontend Framework: React (Next.js) or Vue (Nuxt) using TypeScript.

Styling: Tailwind CSS (for fast, responsive, modern UI components).

Desktop Wrapper (Win/Mac/Linux): Tauri (Rust-based, much lighter than Electron, allows native file system access and executing local emulators like VICE).

Mobile Wrapper (iOS/Android): Capacitor or Progressive Web App (PWA).

Database: SQLite (local offline support) + JSON/API layer for web.

In-App Emulation (Crucial for iOS/Web): WebAssembly (WASM) compiled VICE or similar JS-based C64 emulator.

Desktop Emulation: Native bridging to local emulator executables (VICE, CCS64).

Testing Suite: Vitest (for blazing fast Unit and Component testing) and Playwright (for cross-browser and cross-platform End-to-End testing).

3. Core Feature Requirements

3.1. Database & Metadata Management (The GB64 Core)

Data Ingestion: Ability to parse and import the official Gamebase64 Microsoft Access/SQLite database files or a converted JSON equivalent.

Comprehensive Metadata: Support for all GB64 fields:

Title, Year, Publisher, Developer/Programmer, Musician.

Genre, Sub-genre, Language, Cracker/Release Group.

Control type (Joystick Port 1/2, Keyboard, Mouse, Lightpen).

SID model requirement (6581 vs 8580), Video Standard (PAL/NTSC).

Game views (Top-down, Isometric, Side-scrolling).

3.2. Media & Asset Management

Asset Linking: Automatically map database entries to standard GB64 media folders.

Custom Media Paths (GB64 Packs): Provide UI settings for users to explicitly point the app to specific folders where they have downloaded official community media packs, including:

GB64 Screenshots Pack: (e.g., v19 pack containing over 52,000 C64 screenshots).

GB64 Musician Photos: Photos provided by composers.c64.org to be displayed when browsing games or playing SIDs.

GB64 Classic Game Sounds: Custom UI/sound effect packs placed in a /sounds directory to replace default frontend audio.

Built-in Scraper & EmuMovies Integration: * Allow users to download missing box art, screenshots, and metadata on demand directly within the app (similar to EmulationStation's scraper).

Implement an EmuMovies API integration where users can authenticate with their EmuMovies account to automatically download short video snaps (MP4/WebM) for the games.

Supported Media Types:

Screenshots (Gameplay and Title Screen).

Box Art (Front, Back, Media labels).

Music (Integrated SID player for .sid files).

Documents (PDF manuals, text files, maps, walk-throughs).

Video Snaps (Gameplay clips triggered on hover/selection).

3.3. UI / UX Design (The LaunchBox Experience)

Responsive Layouts: Adaptive design that scales from a 4K TV to an iPhone screen.

View Modes:

Grid View: Large box art/screenshots with clean typography.

List View: High-density table for power users to sort by any metadata column.

Detail View: A rich page for a selected game showing all metadata, a gallery of images, embedded SID player, and play buttons.

Themes: Dark mode (default, arcade style) and Light mode.

Performance: Virtualized lists/grids to ensure smooth scrolling even with 30,000+ entries.

3.4. Search, Filtering & Discovery

Global Search: Instant, fuzzy-search by title.

Advanced Filtering (Faceted Search): Allow users to stack filters (e.g., "Year: 1985" + "Genre: Platformer" + "Musician: Rob Hubbard").

Smart Playlists/Collections: Auto-generated lists (e.g., "Top 100", "Latest Additions", "Games by System 3").

User Data: Favorites, 1-5 Star Ratings, Play Counts, and Last Played dates.

3.5. ROM Management & Linking

Auto-Scanning: Scan a user's local directory for .d64, .t64, .tap, .prg, .crt files.

CRC/Filename Matching: Match local files against the GB64 database hashes/filenames to automatically link ROMs to database entries.

Multi-disk Handling: UI to manage multi-disk games (Disk 1 Side A, Disk 1 Side B, etc.) and pass correct parameters to emulators.

3.6. Emulator Integration (The Execution Layer)

Desktop Mode (Tauri):

Configure paths to external emulators (e.g., x64sc.exe).

Pass command-line arguments based on GB64 metadata (e.g., forcing True Drive Emulation, setting specific RAM expansions, auto-loading cartridges).

Web/iOS Mode (WASM):

Since iOS cannot launch external desktop apps, the app must include a built-in WASM C64 emulator.

Clicking "Play" on iOS loads the ROM directly into the browser/canvas window with on-screen touch controls or bluetooth gamepad support.

4. Phase 1 Minimum Viable Product (MVP) for Antigravity

When assigning this to AI agents, instruct them to build in the following sequence, strictly adhering to Test-Driven Development (TDD) or writing tests concurrently:

Phase 1 (Data, UI & Test Foundation): Initialize a Next.js/React project alongside Vitest and Playwright. Implement a mock JSON database of 50 C64 games. Build the Grid, List, and Detail views. Testing Requirement: Write unit tests for data parsing/sorting logic and E2E tests verifying that all views render correctly across desktop and mobile viewports.

Phase 2 (Media, Audio & Scraping Foundation): Integrate image loading (box art, screens, composer photos) and build a web-based SID player using a library like jsidplay2 or a compiled WASM SID engine. Add the settings UI for users to define their local media paths (Screenshots, Sounds, Musician Photos). Testing Requirement: Add component tests for image fallbacks/lazy loading, unit tests verifying the SID player state, and tests for the custom path resolving logic.

Phase 3 (Desktop Native & System Tests): Wrap the Next.js app in Tauri. Implement local file system scanning to find .d64 files. Implement the command-line execution to launch x64sc (VICE) on Windows/Mac. Implement the EmuMovies API integration for downloading video snaps. Testing Requirement: Write integration tests mocking the file system to ensure the scanner correctly links .d64 files to the database using CRC hashes.

Phase 4 (Web Emulation & E2E Validation): Integrate a WASM C64 emulator component for embedded play on platforms where native execution is unavailable. Testing Requirement: Implement automated E2E tests verifying the emulator canvas loads, accepts ROM data, and registers basic keyboard/touch inputs without crashing.
