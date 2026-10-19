# GBBox 0.6.1 Release Notes

GBBox 0.6.1 introduces Phase 1 Multi-Platform Embedded WebAssembly Emulation, bringing in-app browser playback to Atari 2600, ZX Spectrum, Commodore VIC-20, and Commodore 64 platforms alongside enhanced windowed exit controls.

## Highlights

### 🎮 Multi-Platform Embedded WebAssembly Emulation (Phase 1)
- **Atari 2600**: Embedded browser emulation powered by the `stella2014` WebAssembly core.
- **Sinclair ZX Spectrum**: Embedded browser emulation powered by the `fuse` WebAssembly core.
- **Commodore VIC-20**: Embedded browser emulation powered by the `vice_xvic` WebAssembly core.
- **Commodore 64**: Retained embedded browser emulation powered by `vice_x64`.
- **Dynamic Platform Dispatch**: `<WasmPlayer>` and `emulator.html` now dynamically route platform ID, core, and system parameters.

### 🕹️ Exit Controls & Windowed Interface
- **Windowed Emulator Exit Event**: Added `EMULATOR_CLOSED` iframe-to-parent messaging for EmulatorJS UI exit events.
- **Keyboard & Touch Shortcuts**: Added global `Escape` key listener and an overlay `✕ Exit Game [ESC]` control button for windowed mode playback.

### 📋 Platform Manifest & Capabilities
- Updated `platform-manifest.json` capabilities to expose embedded in-app emulation for Atari 2600, ZX Spectrum, VIC-20, and C64.
- Explicitly routed Atari 800 to native desktop launchers (**Altirra** or native **RetroArch `atari800_libretro.dll`**) for full computer disk image (`.atr`, `.xex`) hardware compatibility.

---

## Validation & CI/CD
- **Unit & Integration Testing**: 65 test files / 355 unit tests passed.
- **Code Quality**: Clean lint checks across ESLint and Rust quality gates.
- **Release Automation**: Tag `v0.6.1` triggers GitHub Actions release workflow building Windows installer, Linux AppImage, and macOS DMG bundles.
