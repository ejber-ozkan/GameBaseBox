# C64 desktop emulation settings

GameBaseBox reads each C64 game's PAL/NTSC and true-drive fields, plus supported
GEMUS instructions. Numeric and legacy letter region codes are supported. Games
marked compatible with both regions prefer PAL; unknown regions keep the emulator
default. Existing imported databases are upgraded without another import.

## Overrides

Open **Settings → C64 Platform Paths** for global defaults. On a game's detail
screen, choose **Emulation settings** for per-game overrides and the effective
value/source of each setting. Changes there save automatically. **Reset overrides**
restores inheritance for that game.

Each setting is resolved independently in this order:

1. Per-game override
2. Global override
3. Supported GEMUS instruction
4. Database field
5. Emulator default

Region, true-drive emulation, virtual device traps, REU size and ROM selection can
be overridden. Global overrides can conflict with a game's requirements; leave
them on **Automatic from database** unless you intend to force a setting. Overrides
are stored with app preferences, separately from imported GameBase data, so database
reimports preserve them. These controls affect desktop VICE and RetroArch's VICE
C64 cores, not embedded play or other platforms.

## VICE versions

GameBaseBox inspects the selected executable's `-help` output rather than choosing
switches from its operating system or assuming a version number. Legacy global
drive/virtual-device switches, per-drive switches, and newer trap-device switches
are translated to the advertised equivalents. Detection is cached until the binary
changes. **Check VICE compatibility** reports the version when the build exposes
it, and the detected switch styles. Select the actual `x64` or `x64sc` executable,
its installation folder, or its macOS application bundle. A wrapper must forward
`-help` and terminate normally.

Saved VICE preferences do not override explicit GameBaseBox launch settings.

## GEMUS and ROM files

Supported instructions are `vtde=yes/no`, `vyde=yes/no`, `reu=<size in KB>` and
`rom=swe/dan/standard`. Messages are shown as information. Emulator-specific filename
hints and unknown instructions are reported rather than executed as command-line
arguments. GEMUS takes precedence over the equivalent ordinary database field.

Swedish or Danish ROM requirements need your own Kernal and character ROM files.
Choose them under **Advanced C64 ROM and RetroArch settings**. Missing required
files produce a launch error. A per-game ROM override can select standard ROMs.
ROM images are not supplied or downloaded.

With automatic virtual-device settings, disabling true-drive enables virtual
device traps for fast loading; enabling true-drive disables those traps. An
explicit virtual-device override still wins. Disabling both is allowed but can
prevent disk games from loading.

## RetroArch preferences

GameBaseBox generates separate launch configuration and core-options files. It
copies existing global/core options and replaces the settings it resolves for the
game, without rewriting the original files. Configuration saving is disabled for
that launch. For a nonstandard RetroArch installation, select its `retroarch.cfg`
under Advanced settings. VICE C64 fast and accurate cores are supported.
