# GitHub Copilot Instructions for GameBaseBox

Refer to AGENTS.md for full codebase guidelines.

## Mandatory Quality Gates
Before proposing or committing code changes:
- `npm run lint`
- `npm run test:frontend`
- `npm run test:backend`
- `npm run build`
- `npm run test:e2e`

## Core Guidelines
- Always normalize backslashes (`\`) for cross-platform compatibility across Windows, Linux, and macOS.
- KEGS uses `config.kegs`; RetroArch MAME core uses `.cmd` launcher files with `-rompath`.
- In multi-disk games, Disk 1 / Main Game is always mounted first.
- Keep `--verbose` guarded by debug flags so normal launches remain silent.
