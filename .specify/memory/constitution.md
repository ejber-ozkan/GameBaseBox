# GBBox Constitution

## Core Principles

### I. Multi-Platform GameBase Core
GBBox, short for GameBase Box, is a local-first frontend for GameBase-style game libraries. The current
application supports the GameBase64 Commodore 64 collection plus Atari imports, but all new
domain work MUST avoid hard-coding Commodore-only assumptions unless the feature
is explicitly scoped as a C64 compatibility layer. Specs and plans that touch
games, metadata, media, extras, launch paths, search, or import MUST identify
which concepts are platform-neutral and which are platform-specific.

Game library features MUST model the catalog, platform/system, game entry,
release/version, media asset, extra, soundtrack, emulator profile, and launch
artifact as separable concepts. Existing GB64 fields may remain supported, but
new designs SHOULD make it possible to add additional GameBase collections
without duplicating the whole browsing, search, settings, or launch stack.

### II. Local-First Library Ownership
The user owns their databases, ROMs, media, emulator paths, and generated launch
files. GBBox MUST continue to work as a desktop app over local files with no
required cloud service. Features MUST preserve explicit user-selected paths,
avoid silently moving or deleting collection content, and make generated
temporary files distinguishable from source library files.

Database import and library maintenance work MUST be repeatable, auditable, and
recoverable. Conversions from Access/CSV/other GameBase exports into SQLite
MUST document source assumptions, expected indexes, generated tables, and any
migration behavior that runs at app startup.

### III. Fast Browsing and Controller-Grade UX
The primary experience is a polished game-library browser that works in both
windowed desktop mode and BigBox/fullscreen mode. Features MUST protect fast
search, alphabet navigation, gallery browsing, and detail-page interaction for
keyboard and gamepad users. Any UI change that affects navigation MUST specify
focus behavior, back/escape behavior, and independent verification for windowed
and BigBox flows.

Large collections are normal. Plans that alter library queries, filtering,
sorting, image/media resolution, or scrolling MUST include performance goals and
tests or measurements that represent thousands of games and rich media
collections. The UI should feel immediate even when the backing catalog is
large.

### IV. Emulator Launch Contracts Are Sacred
Launching a game is a contract between the catalog metadata, local files, the
selected emulator profile, and the user. Features that touch launch behavior
MUST define the launch contract: inputs, generated files, emulator command,
working directory, cleanup policy, and error reporting. Multi-disk and
multi-file games MUST remain first-class, including generated VICE `.vfl` and
RetroArch `.m3u` playlists where applicable.

WASM/emulator-in-app support and native emulator support MUST remain separate
capabilities with clear fallback behavior. Platform-specific emulation details
belong behind typed service boundaries rather than scattered through UI
components.

### V. Tested, Typed, and Traceable Change
Implementation plans MUST keep TypeScript, React, Rust/Tauri, and SQLite
boundaries explicit. Shared data shapes crossing the Tauri IPC boundary MUST be
typed and tested from both sides when behavior changes. Query and import logic
MUST have focused tests for schema changes, search behavior, path handling, and
edge cases in legacy metadata.

Specs MUST be converted into beads issues before implementation work begins.
Each meaningful implementation slice MUST be represented in beads, claimed
before work starts, and closed only after the relevant quality gates pass.
Spec-kit artifacts explain what and why; beads tracks execution state and
handoff.

## Technical Standards

The default architecture is a Next.js/React frontend in `src/`, a Tauri/Rust
desktop backend in `src-tauri/`, SQLite databases generated or maintained by
scripts in `scripts/`, and static runtime assets in `public/`. New features
SHOULD fit these boundaries before introducing new top-level systems.

SQLite is the authoritative local metadata store for browsable libraries.
Schema changes MUST include migration or compatibility behavior, expected index
updates, and audit steps. Search changes MUST account for FTS/search index
behavior and platform-specific metadata differences.

Frontend components MUST follow the existing library-browser interaction model:
settings are explicit, media loading has graceful fallbacks, and reusable logic
lives in hooks or `src/lib/` when it is not purely presentational. Tauri commands
MUST validate paths and inputs before file-system or process-launch operations.

Generated, vendored, cache, and large media/database artifacts MUST stay out of
spec context unless a feature explicitly targets them. Use Graphify for
architecture lookup when `graphify-out/` is present, and update the graph after
substantive code changes.

## Spec-Kit and Beads Workflow

Every new feature starts with a spec-kit specification that states user
scenarios, platform scope, data entities, success criteria, and assumptions.
Plans MUST include a constitution check covering the principles above before
research/design proceeds.

Beads is the execution tracker. Create or link beads issues for implementation
work, claim the active issue, record follow-up work as beads issues instead of
markdown TODOs, and close issues with a reason when completed. Spec-kit files
are the durable product/technical intent; beads is the current state of work.

Quality gates for code changes are, at minimum, the relevant subset of:
`npm run lint`, `npm run test:frontend`, `npm run test:backend`,
`npm run build`, database import/audit scripts, and Playwright flows when the
change affects end-to-end UI behavior. If a gate cannot run, the handoff MUST
state why and what risk remains.

## Governance

This constitution governs future specs, plans, and implementation decisions for
GBBox. It supersedes informal preferences when they conflict with these
principles. Amendments require an explicit update to this file, a short reason
in the commit or beads issue, and a review of affected spec-kit templates or
active specs.

Backward compatibility with existing GameBase64 users is required unless a spec
explicitly proposes a migration path and rollback plan. Multi-platform GameBase
support is the forward direction, so new work must either advance it or clearly
explain why it is intentionally C64-only.

**Version**: 1.0.0 | **Ratified**: 2026-06-27 | **Last Amended**: 2026-06-27
