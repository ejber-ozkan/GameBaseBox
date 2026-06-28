<!-- markdownlint-disable MD013 -->

# Release Contract

## Version

- App/source version: `0.1.0`
- Git tag: `v0.1.0`
- GitHub release title: `GBBox 0.1.0`

## Release Notes Sections

- Highlights
- Supported imports
- Installation or attached artifacts
- Validation performed
- Known limitations
- Migration from 64Box / old repository

## Required Artifact Behavior

- Build artifacts must be attached when built.
- Release notes must name the platform and file type for each attached artifact.
- If only one host platform can be built, release notes must say that other platform builds are not yet attached.

## Verification

- `gh release view v0.1.0` shows release notes and attached assets.
- Release assets were generated from the same source commit as the tag.
- Downloaded artifact names include GBBox/GameBaseBox branding where packaging allows.
