# GBBox 0.6.4 Release Notes

GBBox 0.6.4 delivers comprehensive **Apple IIGS** multi-emulator enhancements with full support for both **KEGS** and **RetroArch (MAME core)**, intelligent multi-disk ordering, automated GS/OS & ProDOS boot disk injection, localized in-app setup instructions, and refreshed documentation and web portals.

## What's New in 0.6.4

### 1. Apple IIGS Dual Emulator Support (KEGS & RetroArch MAME Core)
- **RetroArch MAME Core Integration**: Automatically generates temporary `.cmd` launcher files with proper machine driver selection (`apple2gs` vs `apple2gsr1`), `-rompath` resolution for the `apple2gs.zip` BIOS, and 3.5" (`-flop3`/`-flop4`) and 5.25" (`-flop1`/`-flop2`) virtual floppy drive assignments.
- **Standalone KEGS Integration**: Automatic configuration generation (`config.kegs`), Slot 5/6 drive mapping, and hard drive Slot 7 handling.

### 2. Automatic Non-Booting Disk Detection & OS Injection
- Automatically detects games marked `boot=no` or disks missing the ProDOS root system file (e.g. *Déjà Vu*, *The Bard's Tale II*, *Shadowgate*).
- Mounts a system boot disk (`system5.2mg`, `system6.2mg`, `System.Disk.po`, `ProDOS 16v1_6.2mg`, or `.hdv`) into Drive 1 and the game disk into Drive 2, searching across emulator directories, RetroArch `system/` folders, and configured paths.

### 3. Natural Multi-Disk Ordering & Primary Disk Matching
- Enhanced multi-disk archive extraction and playlist generation to ensure Disk 1 / Main Game disks always mount first, prioritizing over character, course, and addon disks.
- Improved database `FileToRun` path matching to seamlessly handle relative folder prefixes.

### 4. In-App Localized Setup Guidance
- Added a localized guidance card directly inside **Settings > Platform Paths > Apple 2GS** explaining ROM and boot disk setup across all 33 supported languages.

### 5. Website & Documentation Updates
- Updated `README.md` and the official GitHub Pages site (https://ejber-ozkan.github.io/GameBaseBox/) with the complete table of supported platforms and 33-language internationalization features.

### 6. Clean Debug Launcher Mode
- RetroArch verbose logging (`--verbose` and `--log-file`) and console command line prints are guarded to activate only when GameBaseBox is run with `--debug`, `-d`, or `GAMEBASEBOX_DEBUG=1`.
