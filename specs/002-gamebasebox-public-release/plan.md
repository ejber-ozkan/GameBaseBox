<!-- markdownlint-disable MD013 MD060 -->

# Implementation Plan: GameBaseBox Public 0.1 Release

**Branch**: `codex/spec-kit-constitution` | **Date**: 2026-06-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-gamebasebox-public-release/spec.md`

## Summary

Rename the public product from 64Box to GBBox / GameBase Box, reposition it as a local-first desktop app for GameBase-style databases, publish a new public `GameBaseBox` GitHub repository with clean history, and ship `v0.1.0` with release notes and attached build artifacts.

The implementation should preserve existing app functionality and data compatibility while changing public identity, docs, metadata, versioning, repo publication, and release packaging.

## Technical Context

**Language/Version**: TypeScript with React 19 and Next.js 16 frontend; Rust/Tauri 2 desktop backend; Node.js tooling; GitHub CLI for repository and release operations.

**Primary Dependencies**: Tauri 2 app metadata and bundling, Next.js app shell, package/Cargo metadata, existing icon/logo assets, GitHub CLI, npm/Cargo build toolchain.

**Storage**: Local SQLite and local app settings remain unchanged. This feature should not migrate user library data unless branding strings are stored in settings and need harmless display updates.

**Testing**: `npm run lint`, `npm run test:frontend`, `npm run test:backend`, `npm run build`, Tauri build/release artifact build, branding search checks, GitHub release verification.

**Target Platform**: Desktop app on Windows/macOS/Linux, with release artifacts attached for the platforms that can be built in the release environment.

**Project Type**: Tauri desktop game-library application with public GitHub distribution.

**Performance Goals**: No browsing, import, search, launch, or settings performance regressions; release build completes successfully in the local release environment.

**Constraints**: Preserve local-first behavior, avoid unrelated local changes, avoid breaking existing user data, and do not push old git history to the new public repository.

**Scale/Scope**: Rebrand and release only. No new platform import capability beyond documenting current Commodore 64, Atari 800, and Atari 2600 support.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Multi-Platform GameBase Core**: PASS. The rebrand explicitly supports the completed multi-platform direction and removes Commodore-only public positioning.
- **Local-First Library Ownership**: PASS. No cloud dependency or user-data migration is introduced; repo/release publication is distribution-only.
- **Fast Browsing and Controller-Grade UX**: PASS. UI text/branding changes must preserve existing app flows and include regression gates.
- **Emulator Launch Contracts Are Sacred**: PASS. Launch behavior is out of scope except release notes documenting current support.
- **Tested, Typed, and Traceable Change**: PASS. Beads issue `VIC40GameBase64-l3t` tracks planning; implementation tasks include automated gates, branding audit, build, release artifact verification, and graph update.

## Project Structure

### Documentation (this feature)

```text
specs/002-gamebasebox-public-release/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── branding-contract.md
│   ├── repository-contract.md
│   └── release-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
README.md                         # New GBBox README, old-repo redirect variant during publication
package.json                      # Product/version metadata
src/                              # User-facing app copy and references
src-tauri/
├── Cargo.toml                    # Rust package version/name metadata
├── tauri.conf.json               # App product name, identifier, bundle/icon metadata
└── icons/                        # GBBox icon assets
public/                           # Visible logo/static assets
docs/                             # Supporting docs that mention product identity
.specify/memory/constitution.md   # Governance text rebrand from 64Box to GBBox
AGENTS.md                         # Active Spec Kit plan pointer
```

**Structure Decision**: Keep the existing app structure and change identity, documentation, release metadata, and assets in place before copying the release-ready tree into a clean-history `GameBaseBox` repository.

## Phase 0: Research Summary

See [research.md](./research.md). Key decisions:

- Use `GBBox` as the short product name and `GameBase Box` as the expanded name.
- Create the new public repository as `GameBaseBox` with clean history.
- Attach build artifacts to the `v0.1.0` release when built.
- Preserve existing runtime data compatibility; this is not a schema or import feature.
- Treat C64/GameBase64 references as valid only when they refer to supported platform content or the old project/repository.

## Phase 1: Design Summary

See [data-model.md](./data-model.md) and [contracts/](./contracts/).

The rebrand is split into four contracts: product identity, repository publication, release publication, and old-repo redirect. The implementation must satisfy all four before release.

Post-design constitution check remains PASS:

- Public copy advances the platform-neutral GameBase direction.
- Local-first behavior and existing settings/database compatibility remain untouched.
- Release validation includes normal app quality gates plus packaging and GitHub checks.
- Beads tasks track each implementation slice.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
