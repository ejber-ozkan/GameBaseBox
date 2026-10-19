# GBBox 0.6.7 Release Notes

GBBox 0.6.7 brings comprehensive enhancements to the **Atari ST** platform, featuring native **Hatari Libretro GEMDOS hard disk booting** with automatic `BOOT.ST` staging and core configuration, dedicated **boot disk path selection** with proactive user guidance, complete **extras browser visibility** across all themes, and enhanced **D-Bug compilation disk search alias resolution**.

## What's New in 0.6.7

### 1. Native Hatari Libretro GEMDOS Hard Disk Emulation
- **Native `.gem` Content Launcher**: Generates a launcher descriptor that triggers Hatari libretro's GEMDOS hard drive mounting mechanism, passing extracted hard drive folders directly to the core as GEMDOS drive C:.
- **Automatic `BOOT.ST` Staging**: Automatically copies the user's configured `boot.st` disk image to `<retroarch>/system/hatari/BOOT.ST`, `boot.st`, and `<retroarch>/system/BOOT.ST`, satisfying the core's internal boot disk requirements.
- **Core Option & Configuration Synchronization**: Automatically configures `hatari_autoload_config = "true"` and `hatari_boot_hd = "true"` in `retroarch-core-options.cfg` and `Hatari.opt`, and writes custom `hatari.cfg` profiles enabling `bUseHardDiskDirectory` and `bBootFromHardDisk`.
- **Desktop Auto-Run Execution**: Reliably executes autorun directives (such as `DESKTOP.INF` auto-executing `RUNME.TOS` in games like Afterburner) without requiring manual TOS desktop mouse navigation.

### 2. Atari ST Boot Disk Path Settings & Launch Guard
- **Dedicated File Selector in Settings**: Added a native file picker under **Settings > Platform Paths > Atari ST** allowing users to select their local `boot.st` disk image.
- **Proactive Missing Boot Disk Warnings**: Displays localized warnings when launching HardDisk games without a configured `boot.st`, preventing emulator errors before they occur.
- **Multi-Lingual Coverage**: Added descriptive guidance text and warning dialogs across all 33 supported locales.

### 3. Full Extras Browser Visibility & Uncapped Galleries
- **Atari ST Database Scoping**: Cleanly categorizes Atari ST database extras into visual media (Diskscans, Boxscans, Adverts) and document media (Instructions, Cheats, Reviews).
- **Uncapped Thumbnail Grids**: Removed display limits on the extras thumbnail gallery across windowed and fullscreen themes, adding smooth vertical scroll navigation.
- **Alternative Versions Refinement**: Ensured disk scans and media files appear in the Extras panel rather than masquerading as playable game alternatives.

### 4. D-Bug & Automation Compilation Disk Search
- **Automatic D-Bug Alias Expansion**: Full-text search and fallback SQL queries now seamlessly expand `dbug` search queries to match hyphenated `[D-Bug]` titles (e.g. searching `dbug 001` or `dbug` finds all 325 D-Bug compilation disks).
- **Compilation Content Indexing**: Enhanced query handling to surface multi-game compilation disks (including both `[D-Bug]` and `[Automation]`) effortlessly.

### 5. Multi-Emulator Stability Guards
- Prevented VICE emulator flags from bleeding into Atari ST emulator profiles (Hatari and Steem).
- Guarded emulator log and debug parameters behind active debug modes for clean, silent launches.
