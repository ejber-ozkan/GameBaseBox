# GameBaseBox Universal Agent Instructions

This document provides standardized instructions for all AI coding agents (Antigravity, Cursor, Claude Code, GitHub Copilot, Windsurf, Cline, Roo Code, Aider, Devin, etc.).

---

## 1. Mandatory Pre-Commit & Pre-Release Quality Gates

Before committing code, tagging versions, creating releases, or pushing to remote, **ALWAYS run the full local quality gate suite** to prevent regressions:

```bash
# 1. Linting & React Compiler checks
npm run lint

# 2. Frontend Unit & Integration Tests (Vitest)
npm run test:frontend

# 3. Backend Unit Tests (Cargo)
npm run test:backend

# 4. Next.js Production Build / Static Export
npm run build

# 5. Playwright E2E Smoke Tests (Chromium)
npm run test:e2e
```

---

## 2. Core Architectural & Codebase Rules

### Cross-Platform Path Handling
- Always normalize Windows-style backslashes (`\`) to forward slashes (`/`) before manipulating paths or parsing database `FileToRun` entries so logic works identically on Windows, Linux, and macOS.

### Multi-Emulator Architecture
- **Apple IIGS Launches**:
  - **Standalone KEGS**: Uses `config.kegs` and mounts system boot disks into Slot 5 Drive 1 (`s5d1`) / Slot 7 (`s7d1`) for non-bootable games (`boot=no` or missing ProDOS root).
  - **RetroArch (MAME Core)**: Generates temporary `.cmd` launcher files targeting the `apple2gs` (or `apple2gsr1`) driver with `-rompath` and 3.5" (`-flop3`/`-flop4`) / 5.25" (`-flop1`/`-flop2`) virtual drive parameters.
- **Multi-Disk Order**:
  - Always ensure Disk 1 / Main Game is prioritized at the top of playlists (`.m3u` / `.vfl` / `.cmd`) ahead of character, course, or save disks.
- **Debug Mode Guard**:
  - Keep emulator `--verbose` flags and verbose command line logging guarded by debug flags (`--debug`, `-d`, `GAMEBASEBOX_DEBUG=1`) so standard emulator launches remain silent.
