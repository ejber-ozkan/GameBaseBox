<!-- markdownlint-disable MD013 MD032 -->

# Feature Specification: GameBaseBox Public 0.1 Release

**Feature Branch**: `codex/spec-kit-constitution`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Close 001-multi-platform-gamebase and plan a rename to GBBox, long name GameBase Box, built for any GameBase database. Replace 64Box logos/text with GBBox. Mention Atari 800 and Atari 2600 imports, with more to come soon. Create a new public GitHub repo named GameBaseBox without preserving history, update README and GitHub metadata for search/visibility, create version 0.1 in the new repo, update the old repo README to point at the new repo, commit to the new repo, and prepare/build the first 0.1 release with full release notes and attached build artifacts."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rebrand the app identity (Priority: P1)

A user opening the application, README, release page, or repository metadata sees the product as GBBox / GameBase Box rather than 64Box. The product is described as a local-first desktop library for any GameBase database, not only GameBase64.

**Why this priority**: The new public release must not present itself as a Commodore-only project after multi-platform imports landed.

**Independent Test**: Search the app, docs, release text, and metadata for user-facing 64Box branding and confirm remaining references are either old-repo redirect context or historical compatibility notes.

**Acceptance Scenarios**:

1. **Given** a first-time visitor opens the new README, **When** they read the project title and opening section, **Then** they see GBBox / GameBase Box and understand it supports GameBase-style databases.
2. **Given** a user opens the built app, **When** they view splash, title/about/settings/release-facing copy, **Then** the product identity is GBBox and the copy mentions Commodore 64, Atari 800, and Atari 2600 import support.
3. **Given** an asset or icon visibly contains 64Box text, **When** the rebrand is complete, **Then** it is replaced with GBBox branding or intentionally removed.

---

### User Story 2 - Publish a new public repository (Priority: P1)

A developer or retro-library user can find the new public GameBaseBox repository through GitHub search and understand its purpose, supported platforms, current release, and relationship to the old repo.

**Why this priority**: Public discoverability and a clean new project identity are explicit goals for the first GBBox release.

**Independent Test**: Visit the new GitHub repo and verify the name, description, topics, visibility, README, and release/tag state without needing the old repository.

**Acceptance Scenarios**:

1. **Given** the repository has been created, **When** a visitor views GitHub, **Then** the repo is public, named `GameBaseBox`, and uses searchable metadata related to GameBase, retro gaming, Tauri, SQLite, Commodore 64, Atari 800, and Atari 2600.
2. **Given** the old repository remains available, **When** a visitor opens its README, **Then** they are directed to the new GameBaseBox repository.
3. **Given** the new repo intentionally starts without preserving history, **When** its initial commit is inspected, **Then** it contains the GBBox-ready source and docs without the prior commit history.

---

### User Story 3 - Ship version 0.1.0 with release artifacts (Priority: P1)

A user can download the first GBBox release from GitHub, read full release notes, and understand what is included in 0.1.0.

**Why this priority**: The new public repo must launch with a tangible release rather than only source code.

**Independent Test**: Open the GitHub release for `v0.1.0`, read the notes, and download attached build artifacts.

**Acceptance Scenarios**:

1. **Given** the release is complete, **When** a user opens `v0.1.0`, **Then** they see release notes covering the GBBox rename, GameBase Box positioning, supported imports, known limits, validation, and upgrade/migration context.
2. **Given** release artifacts were built successfully, **When** a user views the release assets, **Then** downloadable desktop build artifacts are attached.
3. **Given** source metadata is inspected, **When** package/app/version files are checked, **Then** they consistently report version `0.1.0` for the new GameBaseBox release.

### Edge Cases

- Some strings containing "64" may be platform-specific references to Commodore 64 or GameBase64 and must remain accurate.
- Some internal identifiers may need compatibility names until a future migration; user-facing copy should still be GBBox unless changing an identifier would break existing data.
- Public repository creation, topic updates, tag push, and release creation require authenticated GitHub CLI access.
- Release artifacts may be platform-specific to the build host; release notes must state exactly which artifacts are attached and which platforms are not yet provided.
- Existing untracked or deleted local files unrelated to the rebrand must not be swept into the new release commit.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The old multi-platform spec MUST be treated as complete, and new rebrand/release work MUST be tracked under this feature.
- **FR-002**: User-facing app, documentation, release, and repository copy MUST use "GBBox" as the short name and "GameBase Box" as the long name.
- **FR-003**: The product description MUST state that GameBase Box is built for GameBase-style databases and is not limited to GameBase64.
- **FR-004**: Public-facing copy MUST mention that Commodore 64, Atari 800, and Atari 2600 imports are supported in the first GBBox release, with more platforms coming soon.
- **FR-005**: User-visible "64Box" text and logo usage MUST be replaced with GBBox branding, except where explicitly describing the old repository or historical project name.
- **FR-006**: Version metadata for the new public release MUST be set to `0.1.0`.
- **FR-007**: A new public GitHub repository named `GameBaseBox` MUST be created without preserving existing git history.
- **FR-008**: The new repository MUST include README content that explains purpose, supported platforms, setup/import basics, release status, and project direction.
- **FR-009**: The new repository MUST have GitHub metadata that improves search visibility, including a concise description and relevant topics.
- **FR-010**: The old repository README MUST point users to the new `GameBaseBox` repository.
- **FR-011**: The release process MUST create a `v0.1.0` tag and a GitHub release with full release notes.
- **FR-012**: The `v0.1.0` GitHub release MUST include attached build artifacts generated from the validated release source.
- **FR-013**: The implementation MUST avoid committing unrelated local changes that predate this feature.

### Key Entities

- **Product Identity**: The public product name, long name, tagline, descriptive copy, logo/icon treatment, and release positioning.
- **Repository Publication**: The new public GitHub repository, visibility, description, topics, initial commit, README, and relation to the old repository.
- **Release Version**: The `0.1.0` app/source version, tag, release notes, and attached build artifacts.
- **Old Repository Redirect**: Minimal old-repo documentation that directs visitors to GameBaseBox.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A search of user-facing source and documentation finds no unintended "64Box" branding after the rebrand.
- **SC-002**: A first-time GitHub visitor can identify the product purpose, supported imports, and download path from the new README and release page in under 2 minutes.
- **SC-003**: The new public repository exists as `GameBaseBox`, has at least 8 relevant topics, and has a description that mentions GameBase or GameBase Box.
- **SC-004**: The `v0.1.0` release includes release notes with at least sections for highlights, supported platforms, installation/build artifacts, validation, and known limitations.
- **SC-005**: The release page includes at least one attached build artifact produced from the release source.
- **SC-006**: The old repository README links to the new repository in the first visible section.

## Assumptions

- The new repository slug is exactly `GameBaseBox`.
- The new public repository should start with a clean initial history rather than preserving previous commits.
- Build artifacts should be attached to the GitHub release when locally or CI-built artifacts are available.
- The existing implementation remains the source base for the first GBBox release, but old git history is not pushed to the new repository.
- App data compatibility for existing local users should be preserved unless a later implementation task deliberately changes migration behavior.
