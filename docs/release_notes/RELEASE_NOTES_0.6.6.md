# GBBox 0.6.6 Release Notes

GBBox 0.6.6 introduces seamless **Acorn BBC Micro & Electron** multi-emulator launching and automation, supporting both **RetroArch (B2 and MAME cores)** and standalone **BeebEm**, dynamic autoboot command typing with hardware delay synchronization, automatic companion disk image discovery for cassette games, and localized emulator guidance cards across all 33 supported languages.

## What's New in 0.6.6

### 1. Dual RetroArch Core Support (B2 & MAME)
- **Plug-and-Play RetroArch B2 Core (2_libretro.dll)**: Floppy disk images (.ssd and .dsd) boot instantly without requiring external BIOS files or softlist setups.
- **Hardware-Accurate MAME Core (mame_libretro.dll)**: Full hardware simulation supporting the BBC Micro Model B (bcb), BBC Master 128 (bcm), and Acorn Electron (lectron).
- **Dynamic .cmd Launcher Generation**: Generates clean launch command files on the fly with cross-platform slash normalization, multi-directory -rompath resolution, and media attachments.

### 2. Intelligent Hardware Autoboot Automation
- **2-Second Initialization Delay**: Injects -autoboot_delay 2 to allow the emulated BBC Micro/Electron ROMs and DFS filesystem to settle before typing commands into the prompt.
- **DFS Disk Boot Option Parsing**: Inspects the DFS sector 1 header byte 262 to determine whether a disk boots via *EXEC !BOOT, *RUN !BOOT, *LOAD !BOOT, or *CAT (honoring disk=cat GEMUS tags).
- **Cassette Tape Boot Sequences**: Automatically passes *TAPE
PAGE=&E00
*RUN
 for BBC Model B / Master (reclaiming RAM under DFS) and *TAPE
*RUN
 for Acorn Electron.
- **Optimized Parameter Placement**: Commands and delays are positioned before media arguments (-flop1 / -cass) so MAME parses all switches cleanly without file path confusion.

### 3. Automatic Companion Disk Image Resolution
- **Transparent Tape-to-Disk Upgrades**: When a user selects a tape-based game (.uef), GBBox automatically inspects the Extras/Disks/ and Extras/Haven Disks/ directories for corresponding .ssd / .dsd disk archives.
- **Instant Extraction & Priority**: Automatically extracts and prioritizes the companion disk image over tape media for faster loading and zero manual file hunting.

### 4. Standalone BeebEm (eebem-bbcmicro) Integration
- Direct native support for standalone BeebEm with automatic command line mounting and autostart typing for both disk and tape archives.

### 5. Multi-Lingual Settings & In-App Documentation
- Localized setup cards under **Settings > Platform Paths > BBC Micro** explaining BIOS file placement (bcb.zip, bc_acorn8271.zip, saa5050.zip) for MAME libretro and plug-and-play B2 core usage, fully translated across all 33 supported languages.

### 6. Codebase Architecture & Agent Quality Governance
- Standardized persistent agent rules in AGENTS.md and GEMINI.md mandating Graphify knowledge graph queries and direct SQLite CLI tools for all architectural investigations.
