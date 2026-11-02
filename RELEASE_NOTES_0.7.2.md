# GBBox 0.7.2

This patch fixes C64 games incorrectly launching in NTSC mode and adds consistent
per-game configuration for standalone VICE and RetroArch's VICE C64 cores.

## Fixes

- Correctly interpret GameBase64's numeric PAL/NTSC codes, alongside legacy letter
  codes. Games compatible with both regions prefer PAL; unknown values retain the
  emulator default. Existing imports are updated without another database import.
- Apply explicit region and true-drive settings to VICE. Automatic virtual-device
  traps provide fast disk loading when true-drive emulation is disabled.
- Detect the selected VICE executable's supported switches, including legacy global
  switches and newer per-drive and trap-device switches. This supports differences
  between older and newer emulator builds without assuming a version from the OS.
- Apply resolved C64 settings to RetroArch through separate launch configuration
  files, without rewriting its normal configuration or core-options files.
- Interpret supported C64 GEMUS true-drive, virtual-device, REU and ROM requirements.
  Unsupported instructions and informational messages are surfaced for review.

## Settings

- **Settings → C64 Platform Paths** now includes global region, true-drive,
  virtual-device, REU and ROM overrides, plus **Check VICE compatibility**.
- **Emulation settings** on each C64 game's detail screen provides per-game
  overrides, effective values and their sources, and **Reset overrides**.
- Each setting uses this precedence: game override, global override, supported
  GEMUS instruction, database field, then emulator default.
- Overrides are saved separately from imported GameBase data and survive reimports.
  Keyboard and gamepad controls are supported.
- Advanced settings accept user-supplied Swedish/Danish Kernal and character ROMs,
  and an optional RetroArch configuration path for nonstandard installations.

See [C64 emulation settings](docs/C64_EMULATION.md) for setup details.

## Validation and limitations

Windows native checks covered VICE 2.4, VICE 3.10 and RetroArch. Flimbo's Quest was
checked through its rendered disk intro in PAL, with its two-disk playlist recognised
by RetroArch. The C64 changes were also tested successfully on macOS.

Native Linux emulation and a complete gameplay/audio playthrough were not verified.
These settings apply to desktop C64 launches; embedded play and other platforms
retain their existing configuration behavior. Localized ROM images are not bundled
or downloaded and must be supplied by the user.

## Upgrade and rollback

Quit GBBox and emulators before upgrading, and retain a backup of your application
profile and database. No database reimport is required. To roll back, reinstall
0.7.1; that version does not apply the new overrides and retains the previous C64
region behavior.

Distribution filenames remain `GBBox-Windows-x64-Setup.exe`, `GBBox-Linux.AppImage`
and `GBBox-macOS.dmg`. Bundle builds generate SHA-256 checksums for verification.
