# GBBox 0.2.0 Release Notes

## Highlights

- Added **ZX Spectrum** as a supported GameBase platform.
- The ZX Spectrum importer calls out both **GameBaseZX** and **SpeccyMania** and targets Sinclair ZX Spectrum v6-compatible MDBs.
- Added ZX Spectrum setup folders for Extras, Games, Screenshots, Musician Photos, and Music.
- RetroArch is the default ZX Spectrum emulator profile, with Spectaculator available as a secondary external emulator option.
- Fixed the first-run import handoff so the library browser reloads when the newly imported platform becomes available.

## Supported Imports

- **Commodore 64 / GameBase64**: VICE, RetroArch, in-app EmulatorJS/VICE, SID playback, extras, screenshots, and GameBase64 metadata.
- **Atari 800**: Atari 800 v12-compatible GameBase MDB imports with Games, Music, Photos, Screenshots, and Extras paths. Launch settings support RetroArch Atari800 and Altirra.
- **Atari 2600**: Atari 2600 GameBase MDB imports with Games, Screenshots, and Extras paths. Launch settings use RetroArch and an Atari 2600 core.
- **ZX Spectrum / GameBaseZX / SpeccyMania**: Sinclair ZX Spectrum v6-compatible GameBase MDB imports with Extras, Games, Screenshots, Musician Photos, and Music paths. Launch settings support RetroArch and Spectaculator.

## Known Limitations

- Database files, ROMs, screenshots, music, extras, and other GameBase media are not included.
- ZX Spectrum `.ay` files are recognized as music media, but in-app JavaScript/WebAudio playback is not enabled yet.
- Windows local MDB export still requires the Microsoft Access Database Engine / ACE provider.

## Validation

The release source was prepared to pass:

```bash
npm run lint
npm run test:frontend
npm run test:backend
npm run build
```

Release bundles should be produced with:

```bash
npm run tauri:build
```

The GitHub release should attach the resulting `GBBox-*` platform artifacts.
