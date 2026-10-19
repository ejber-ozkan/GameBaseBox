# GBBox 0.4.1 Release Notes

## Highlights

- Fixed VIC-20 imports failing with `Unsupported platform: vic20` during backend database conversion.
- Made VIC-20 platform naming more forgiving: `vic20`, `VIC-20`, `VIC 20`, and `Commodore VIC-20` all resolve to the same platform.
- Updated VIC-20 import metadata to match the real `Vic20_v03.mdb` source filename.
- Removed the dated `graphify-out/2026-06-28` backup snapshot from Git and ignored future dated Graphify backup folders.

## Validation

The release source was prepared to pass:

```bash
npm run lint
npm run test:frontend
npm run test:backend
npm run build
```

Release bundles are produced by the GitHub Actions `Release Bundles` workflow when the `v0.4.1` tag is pushed.
