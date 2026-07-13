# GBBox 0.5.2 Release Notes

## Highlights

GBBox 0.5.2 is a patch release that restores local media in packaged Windows builds and modernizes the release pipeline.

- **Production images restored**: Screenshots and other local images now use Tauri asset URLs with the correct Windows WebView2 asset-protocol origin, fixing blank media in installed production builds.
- **Better media diagnostics**: Debug logging now records resolved asset URLs, cache hits, and image load failures to make future path or CSP problems easier to diagnose.
- **Clean React effects**: `ImageSlider` now tracks its current alternative text when reporting missing variants, removing the hook dependency warning.
- **Node 24 release uploads**: Windows, Linux, and macOS assets are attached with the GitHub CLI instead of the deprecated Node 20 release action.

## Validation

The `v0.5.2` tag triggers the GitHub Actions Release Bundles workflow. It runs linting, frontend and backend tests, audit, production build, and end-to-end tests before building and attaching the Windows installer, Linux AppImage, and macOS DMG to the GitHub release.
