# GBBox 0.6.0 Release Notes

## Highlights

GBBox 0.6.0 introduces dynamic modular themes, a unified library view layout, and extensive visual and navigation refinements to deliver a highly customizable and unified interface.

- **Dynamic Modular Themes Engine**: Choose between three distinct visual aesthetics—**Arcade Void**, **Cyberpunk CRT**, and **C64 Edition**—powered by Tailwind CSS v4 custom properties, slot-based decorator overlays, and persistent appearance settings.
- **Unified Library Interface**: Consolidates separate windowed and fullscreen BigBox components into a single `UnifiedLibraryView` and a consolidated `useUnifiedLibraryNavigation` hook that seamlessly handles both 2D spatial keyboard traversal and controller gamepads.
- **Responsive Bento Detail View**: Replaced separate detail panels with a responsive "Bento-box" style game detail view that adapts layout sizing and components dynamically, and scales cleanly between 720p, 1080p, 1440p, and 4K displays.
- **Themed Settings Modal**: Redesigned tab layouts, styling, and navigation with support for full 2D spatial keyboard/gamepad navigation. Includes a retro physical F1-F7 navigation key easter egg for the C64 theme.
- **Retro WebGL Enhancements**: Authentic retro shader effects, rotating backgrounds, raster-loader stripe animations, blinking cursor blocks, and grid image effects (like reverse-grayscale on hover for Cyberpunk CRT).
- **Embedded Sound Integration**: Upgraded Extras view with a sidebar layout, custom soundtrack player (SID/SAP) styling, and automatic playback silencing when launching games or emulators.
- **Tauri DevTools Debugging**: Developer builds now expose the Chrome DevTools CDP on loopback port `127.0.0.1:9222` for easy native DOM and console inspection.

## Validation

The `v0.6.0` tag triggers the GitHub Actions Release Bundles workflow. It runs linting, frontend and backend tests, audit, production build, and end-to-end tests before building and attaching the Windows installer, Linux AppImage, and macOS DMG to the GitHub release.
