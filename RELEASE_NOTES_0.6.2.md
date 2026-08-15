# GBBox 0.6.2 Release Notes

GBBox 0.6.2 adds 6 new retro GameBase platform collections, fixes embedded emulation routing, improves active platform dropdown navigation with imported-first grouping, and expands compatibility across the board, bringing the total supported GameBase platforms to 14.

## What's New in 0.6.2

### 🎮 6 New GameBase Platforms Added
- **Commodore 128** (`c128`):
  - Full compatibility with *GameBase C128* databases (`C128.mdb`, 273 titles verified).
  - Emulators: VICE C128 (`x128.exe`) and RetroArch VICE x128 (`vice_x128_libretro`).
  - Media support: Games, Screenshots, Musician Photos, Extras, and SID music.
- **Amstrad CPC** (`amstradcpc`):
  - Full compatibility with *AmstradMania v7+* databases (over 5,700+ titles verified).
  - Emulators: Caprice32 / CPC++ and RetroArch Caprice32 (`cap32_libretro`).
  - Media support: Games, Screenshots, Musician Photos, Extras, and AY chip music.
- **Apple 2GS** (`apple2gs`):
  - Compatibility with Apple 2GS GameBase collection from archive.org (296 titles verified).
  - Emulators: KEGS and RetroArch MAME (`mame_libretro`).
  - Media support: Games, Screenshots, Musician Photos, Extras, and Music.
- **Commodore PET** (`pet`):
  - Compatibility with *PET GameBase v3.1* (700 titles verified).
  - Emulators: VICE xpet (`xpet.exe`) and RetroArch VICE xpet (`vice_xpet_libretro`).
  - Media support: Games, Screenshots, and Extras.
- **Atari 5200** (`atari5200`):
  - Compatibility with Atari 5200 GameBase databases (95 titles verified).
  - Desktop emulation support with Altirra and RetroArch (`a5200_libretro`).
  - Media support: Games, Screenshots, Extras, and Photos.
- **Atari 7800** (`atari7800`):
  - Compatibility with Atari 7800 GameBase databases (62 titles verified).
  - Desktop emulation support with RetroArch ProSystem (`prosystem_libretro`).
  - Media support: Games, Screenshots, and Extras.

### 📋 Active Platform Dropdown: Imported-First & Obvious Unimported Indicator
- Dropdown lists now dynamically sort and partition GameBases:
  - **Imported GameBases** appear at the very top of the list under `<optgroup label="Imported GameBases">`.
  - **Unimported GameBases** appear under `<optgroup label="Not Imported">` with explicit `(Not Imported)` indicators on every unimported option.
- Available across all themes in both BigBox and Windowed modes, as well as database setup.

### 🐛 Emulation Routing Fix
- Fixed an issue where launching Atari 5200 (and Atari 7800) games attempted embedded WASM emulation and fell back to the C64 core.
- Configured native external desktop emulation (Altirra / RetroArch) for Atari 5200 and Atari 7800.

### 🖼️ Platform Backgrounds & Theme Customization
- Added high-resolution platform-themed backgrounds for all new platforms in `docs/images/backgrounds/` and `public/docs/images/backgrounds/`.
- Dynamic background pools adapt immediately upon switching active platform.

### ⚙️ Enhanced Settings Management
- Expanded the Settings Modal to provide customized paths and emulator selectors for all 14 platforms.
- Native folder and file browsing for executables, ROMs, screenshots, extras, photos, and cores.

### 🧪 Verification & Reliability
- 100% verified MDB schema compatibility with Jet OLEDB extraction.
- Full suite of 362 frontend unit tests and 139 Rust backend tests passing.
