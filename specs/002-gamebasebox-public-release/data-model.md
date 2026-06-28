<!-- markdownlint-disable MD013 MD032 -->

# Data Model: GameBaseBox Public 0.1 Release

## ProductIdentity

Represents the public-facing product name and positioning.

**Fields**:
- `shortName`: `GBBox`
- `longName`: `GameBase Box`
- `tagline`: Describes the app as built for GameBase-style databases.
- `supportedImports`: Commodore 64, Atari 800, Atari 2600.
- `futureSupportMessage`: More GameBase platforms coming soon.

**Validation Rules**:
- User-facing branding must use GBBox or GameBase Box.
- 64Box may appear only in old-repo redirect or historical context.
- GameBase64/Commodore 64 references are allowed when describing the C64 platform.

## RepositoryPublication

Represents the new public GitHub repository.

**Fields**:
- `owner`: Current GitHub account or organization used by the authenticated CLI.
- `name`: `GameBaseBox`
- `visibility`: Public.
- `historyPolicy`: Clean initial history.
- `description`: Concise GameBase Box / retro library description.
- `topics`: Search tags for GameBase, retro gaming, supported platforms, Tauri, and SQLite.

**Validation Rules**:
- Repository is public.
- Repository name is exactly `GameBaseBox`.
- Initial public history does not include prior repository commits.
- README is useful without relying on the old repository.

## ReleaseVersion

Represents the first public GBBox release.

**Fields**:
- `version`: `0.1.0`
- `tag`: `v0.1.0`
- `releaseTitle`: `GBBox 0.1.0`
- `releaseNotes`: Highlights, supported imports, installation/build artifacts, validation, known limitations.
- `assets`: Built release artifacts attached to GitHub release.

**Validation Rules**:
- Source metadata reports `0.1.0`.
- Git tag and GitHub release use `v0.1.0`.
- Attached artifacts are generated from the release source.
- Release notes identify which platforms/artifacts are available.

## OldRepositoryRedirect

Represents the old repository landing page after the new repo exists.

**Fields**:
- `oldRepoReadmeNotice`: First-section redirect to the new GameBaseBox repository.
- `newRepoUrl`: Public URL for `GameBaseBox`.
- `legacyNameContext`: Brief explanation that 64Box has become GBBox / GameBase Box.

**Validation Rules**:
- The redirect appears before normal legacy README content.
- The link target is the actual new repo URL.
