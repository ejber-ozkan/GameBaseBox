# GBBox 0.6.5 Release Notes

GBBox 0.6.5 brings comprehensive **Commodore Amiga** platform enhancements, featuring on-demand **WHDLoad** and **SPS** game scraping from Archive.org with real-time download progress badges, seamless **RetroArch (PUAE core)** multi-disk swapping and WHDLoad integration, automatic **WinUAE** hardware and chipset profiling from GameBase GEMUS scripts, and customizable download target folder settings across all 33 supported languages.

## What's New in 0.6.5

### 1. RetroArch Amiga & WHDLoad Integration ("It Just Works!")
- **Plug-and-Play RetroArch (PUAE Core) Support**: Launching multi-disk ADF/IPF games and WHDLoad installed games in RetroArch with the PUAE core is completely seamless.
- **Automated Disk Swapping & M3U Playlists**: GBBox automatically extracts multi-disk sibling archives in exact disk order (Disk 1 / Main Disk prioritized) and builds clean `.m3u` playlists on the fly for RetroArch's disk control interface.
- **Automatic Model & Chipset Detection**: PUAE automatically detects Amiga 1200 AGA vs Amiga 500 OCS/ECS hardware requirements directly from ROM headers and disk titles.

### 2. Standalone WinUAE Hardware & GEMUS Auto-Configuration
- **Dynamic GEMUS Parsing**: WinUAE launches automatically parse every per-game hardware setting from the GameBase Amiga database (including CPU model `68020`, chipset `AGA`/`OCS`, `chipset_compatible=A1200`, Kickstart version `v3.1`, Chip RAM `4MB`, Fast RAM, and floppy drive count).
- **Direct Command-Line Injection**: Injects all configuration entries as `-s <key>=<value>` parameters, configuring WinUAE without requiring manual emulator configuration profiles.

### 3. On-Demand Amiga WHDLoad & SPS Downloader (Archive.org)
- **Smart Archive.org Resolver**: Automatically matches missing WHDLoad and SPS files against public Archive.org repositories by exact name, SPS numeric code bracket matching (e.g. `[0002]`), and game prefix.
- **Micro Percentage Download Badges**: Compact percentage indicators (`⏳ 45%` / `DL 45%`) directly inside the file panels across all themes (Arcade, Commodore 64/128 Retro-Futuristic, Cyberpunk CRT) and view modes (Windowed & BigBox).
- **Asynchronous Background Processing**: Downloads continue in the background when navigating between games and pages; the `⬇ GET` button automatically clears the instant the download completes.
- **Robust Download Streamer**: Equipped with proper User-Agent headers, 10-hop redirect handling, 300s timeouts, and exponential backoff retries to handle Archive.org CDN load gracefully.

### 4. Amiga Download Target Preference
- Added a dedicated setting under **Settings > Platform Paths > Amiga** allowing users to choose where on-demand files are stored:
  - **Extras Folder (Permanent)** *(Default)*: Saves files directly into the Amiga `Extras/WHDLoad` or `Extras/SPS` directory.
  - **Temp Folder (No Overwrite)**: Saves files into a temporary cache directory without modifying existing library files.
- Fully translated across all 33 supported languages.
