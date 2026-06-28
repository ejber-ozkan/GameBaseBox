# GBBox 0.1.0 Release Notes

## Highlights

- 64Box is now **GBBox**, short for **GameBase Box**.
- GBBox is positioned as a local-first desktop frontend for GameBase-style retro game libraries.
- The first public GBBox release supports imports for Commodore 64, Atari 800, and Atari 2600.
- Platform-scoped paths, import status, emulator settings, favorites, and navigation state keep each imported library separate.

## Supported Imports

- **Commodore 64 / GameBase64**: Baseline support with VICE, RetroArch, in-app EmulatorJS/VICE, SID playback, extras, screenshots, and GameBase64 metadata.
- **Atari 800**: Atari 800 v12-compatible GameBase MDB imports with Games, Music, Photos, Screenshots, and Extras paths. Launch settings support RetroArch Atari800 and Altirra.
- **Atari 2600**: Atari 2600 GameBase MDB imports with Games, Screenshots, and Extras paths. Launch settings use RetroArch and an Atari 2600 core.

More GameBase platforms are planned.

## Installation and Artifacts

Download attached build artifacts from the GitHub release page. Artifact names should use GBBox/GameBaseBox branding where the platform packaging format allows it.

If only one platform artifact is attached, that means the first public release was built on that host platform. Additional platform artifacts can be added once their build environments are available.

## Validation

The release source should be validated with:

```bash
npm run lint
npm run test:frontend
npm run test:backend
npm run build
```

The release build should also run the project Tauri build command and attach the resulting files from `src-tauri/target/release/bundle/`.

## Known Limitations

- Database files, ROMs, screenshots, music, extras, and other GameBase media are not included.
- Atari platform coverage starts with Atari 800 and Atari 2600 import support; more GameBase profiles are expected later.
- Existing local C64/GameBase64 paths remain platform-specific and are intentionally not renamed.

## Migration from 64Box

GBBox is the continuation of 64Box under a platform-neutral name. Existing local libraries and settings should remain local and user-controlled. The old repository now points users to the new public `GameBaseBox` repository.
