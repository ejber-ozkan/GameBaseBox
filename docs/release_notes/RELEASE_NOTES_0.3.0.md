# GBBox 0.3.0 Release Notes

## Highlights

- Added **Acorn BBC Micro** and **Commodore Amiga** as supported GameBase import platforms.
- Added platform setup for BBC Micro and Amiga using the shared GameBase folder shape: Extras, Games, Screenshots, and Music.
- RetroArch is the default launch profile for both new platforms.
- Added BeebEm as the BBC Micro external emulator option.
- Added WinUAE / UAE-style Amiga external launch support, with WinUAE on Windows and equivalents such as FS-UAE or Amiberry on Linux/macOS.
- Added subtle rotating platform backgrounds for the windowed grid and list views using the images in `docs/images/backgrounds`.
- Fixed Amiga multi-disk launch packaging so `_Disk1.zip`, `_Disk2.zip`, and other sibling disk archives are temporarily extracted together before launch.

## Amiga Multi-Disk Launching

- RetroArch now receives an `.m3u` built from the extracted disk image files, not just the selected zip archive.
- WinUAE / UAE launches now attach the first extracted disks with `-0`, `-1`, `-2`, and `-3` drive switches where available.
- WinUAE / UAE launches also preload all extracted disks through `-diskswapper=...` so additional disks are available through the emulator disk swapper.
- This covers GameBase Amiga records where the database points at a `*_Disk1.zip` file while emulator metadata, such as `nr_floppies=2`, indicates a multi-disk game.

## Supported Imports

- **Commodore 64 / GameBase64**: VICE, RetroArch, in-app EmulatorJS/VICE, SID playback, extras, screenshots, and GameBase64 metadata.
- **Atari 800**: Atari 800 v12-compatible GameBase MDB imports with Games, Music, Photos, Screenshots, and Extras paths. Launch settings support RetroArch Atari800 and Altirra.
- **Atari 2600**: Atari 2600 GameBase MDB imports with Games, Screenshots, and Extras paths. Launch settings use RetroArch and an Atari 2600 core.
- **ZX Spectrum / GameBaseZX / SpeccyMania**: Sinclair ZX Spectrum v6-compatible GameBase MDB imports with Extras, Games, Screenshots, Musician Photos, and Music paths. Launch settings support RetroArch and Spectaculator.
- **Acorn BBC Micro**: GameBase MDB imports with Extras, Games, Screenshots, and Music paths. Launch settings support RetroArch and BeebEm.
- **Commodore Amiga**: GameBase MDB imports with Extras, Games, Screenshots, and Music paths. Launch settings support RetroArch and WinUAE / UAE-style external emulators.

## Known Limitations

- Database files, ROMs, screenshots, music, extras, and other GameBase media are not included.
- ZX Spectrum `.ay` files and Amiga music files are recognized as media, but in-app JavaScript/WebAudio playback still needs a dedicated player evaluation.
- Windows local MDB export still requires the Microsoft Access Database Engine / ACE provider.
- Amiga sibling-disk detection expects conventional `_DiskN.zip` naming beside the selected archive.

## Validation

The release source was prepared to pass:

```bash
npm run lint
npm run test:frontend
npm run test:backend
npm run build
```

Release bundles are produced by the GitHub Actions `Release Bundles` workflow when the `v0.3.0` tag is pushed.
