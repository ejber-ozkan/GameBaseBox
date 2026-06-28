<!-- markdownlint-disable MD013 MD032 -->

# Quickstart: GameBaseBox Public 0.1 Release Validation

## Prerequisites

- GitHub CLI authenticated with permission to create public repositories and releases.
- Local build toolchain for the Tauri desktop app.
- Clean working tree except for intentional rebrand/release changes.

## Validation Commands

```bash
npm run lint
npm run test:frontend
npm run test:backend
npm run build
```

Tauri release build command:

```bash
npm run tauri:build
```

Windows artifacts produced on 2026-06-28:

- `src-tauri/target/release/bundle/msi/GBBox_0.1.0_x64_en-US.msi`
- `src-tauri/target/release/bundle/nsis/GBBox_0.1.0_x64-setup.exe`

The first sandboxed build produced `src-tauri/target/release/gamebasebox.exe` but could not bundle installers because WiX download was blocked. The elevated build completed both installer bundles.

## Branding Audit

```bash
rg -n "64Box|64box|VIC40GameBox|vic40gamebox|GameBase Box|GBBox" .
```

Expected result:
- `GBBox` and `GameBase Box` appear in public identity locations.
- `64Box` appears only in old-repo redirect or historical migration context.
- `GameBase64` and `Commodore 64` remain where platform-specific.

## New Repository Verification

1. Confirm the new public repository exists as `GameBaseBox`.
2. Confirm the repository has a concise GameBase Box description.
3. Confirm topics include GameBase, retro gaming, supported platforms, Tauri, SQLite, and RetroArch terms.
4. Confirm the initial history is clean and starts from the release-ready source.

## Release Verification

1. Confirm version metadata reports `0.1.0`.
2. Confirm tag `v0.1.0` points at the intended release commit.
3. Confirm GitHub release `GBBox 0.1.0` exists.
4. Confirm release notes include highlights, supported imports, attached artifacts, validation, known limitations, and old-repo migration note.
5. Confirm build artifacts are attached and downloadable.

## Old Repository Verification

1. Open the old repository README.
2. Confirm the first visible section directs users to `GameBaseBox`.
3. Confirm the old README does not confuse users into thinking 64Box is the current release name.
