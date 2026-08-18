# CLAUDE.md - Instructions for Claude Code / Anthropic Agents

Refer to [AGENTS.md](AGENTS.md) for full architectural guidelines and standards.

## Mandatory Quality Gates (Run before every commit/release)
- `npm run lint`
- `npm run test:frontend`
- `npm run test:backend`
- `npm run build`
- `npm run test:e2e`

## Key Rules
- Normalize all backslashes (`\`) for cross-platform compatibility.
- Apple IIGS KEGS uses `config.kegs`; RetroArch MAME core uses `.cmd` scripts with `-rompath`.
- Always order Disk 1 first in multi-disk playlists (`.m3u` / `.vfl` / `.cmd`).
- Guard debug logs so standard emulator launches remain silent.
