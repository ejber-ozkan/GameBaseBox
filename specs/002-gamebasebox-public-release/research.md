<!-- markdownlint-disable MD013 MD032 -->

# Research: GameBaseBox Public 0.1 Release

## Decision: Use GBBox / GameBase Box as public identity

**Rationale**: The product now supports more than Commodore 64. GBBox keeps continuity with the old name while the long name explains the platform-neutral GameBase focus.

**Alternatives considered**:
- Keep 64Box: rejected because it misrepresents Atari 800 and Atari 2600 import support.
- Use only GameBase Box: rejected because GBBox is shorter for UI, icons, and release titles.

## Decision: Publish new repository as GameBaseBox with clean history

**Rationale**: The user explicitly chose the `GameBaseBox` slug and said there is no need to preserve history. A clean initial commit gives the public repo a clear launch point for `v0.1.0`.

**Alternatives considered**:
- Preserve git history: rejected by user preference.
- Rename the existing remote in place: rejected because the user wants a new repo and old repo redirect.

## Decision: Attach built artifacts to v0.1.0

**Rationale**: The release should be usable from GitHub, not only buildable from source. The release notes must state exactly which artifacts were built.

**Alternatives considered**:
- Source-only release: rejected by user preference.
- Delay release artifacts to CI: possible later, but the first release should attach locally or CI-produced artifacts once available.

## Decision: Preserve existing local data compatibility

**Rationale**: This feature is branding, repository, and release work. Changing settings/database identifiers would increase risk and should only happen when needed for visible product identity or packaging.

**Alternatives considered**:
- Rename every internal identifier immediately: rejected because it could break app data, bundle identity, or migration behavior without user value for 0.1.

## Decision: Keep platform support claims factual

**Rationale**: The app currently supports C64, Atari 800, and Atari 2600 imports. Marketing should say more platforms are coming soon without naming unsupported platforms as if they already work.

**Alternatives considered**:
- Broadly claim "any GameBase database" without qualification: rejected because the current import profiles are still platform-specific.
