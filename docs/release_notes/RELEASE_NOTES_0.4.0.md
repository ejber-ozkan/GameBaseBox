# GBBox 0.4.0 Release Notes

## Highlights

- Added Atari ST as an importable platform with Extras, Games, Screenshots, and Music folder setup.
- Added Commodore VIC-20 as an importable platform with the same folder setup flow as the other retro platforms.
- Added RetroArch support for both platforms, plus STeem and Hatari external emulator options for Atari ST and VICE for VIC-20.
- Added Atari ST and VIC-20 windowed library backgrounds from `docs/images/backgrounds`.

## Validation

The release source was prepared to pass:

```bash
npm run lint
npm run test:frontend
npm run test:backend
npm run build
```

Release bundles are produced by the GitHub Actions `Release Bundles` workflow when the `v0.4.0` tag is pushed.
