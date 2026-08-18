# GameBaseBox Project Instructions & Rules

## Pre-Release & Pre-Commit Quality Gates

Before committing changes, bumping versions, creating release tags, or pushing to remote, **ALWAYS run the full local quality gate suite** to ensure nothing gets stale or broken:

1. **Linting & React Compiler Checks**:
   ```bash
   npm run lint
   ```
2. **Frontend Unit & Integration Tests** (Vitest):
   ```bash
   npm run test:frontend
   ```
3. **Backend Unit Tests** (Cargo):
   ```bash
   npm run test:backend
   ```
4. **Next.js Production Build / Static Export**:
   ```bash
   npm run build
   ```
5. **Playwright E2E Smoke Tests** (Chromium):
   ```bash
   npm run test:e2e
   ```

## Key Architectural Guidelines

- **Cross-Platform Path Handling**: Always normalize Windows-style backslashes (`\`) before path manipulation so logic works identically on Windows, Linux, and macOS.
- **Apple IIGS Launches**:
  - Standalone KEGS: uses `config.kegs` and mounts boot disk in Slot 5 Drive 1 / Slot 7 for non-bootable games (`boot=no` or missing ProDOS root).
  - RetroArch MAME: generates `.cmd` launcher files targeting `apple2gs` (or `apple2gsr1`) with `-rompath` and 3.5" (`-flop3`/`-flop4`) / 5.25" (`-flop1`/`-flop2`) drive parameters.
- **Multi-Disk Order**: Always ensure Disk 1 / Main Game is prioritized at the top of playlists (`.m3u` / `.vfl` / `.cmd`) ahead of character, course, or save disks.
- **Debug Mode Guard**: Keep `--verbose` and log files guarded so normal emulator launches remain silent.
