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


<!-- BEGIN BEADS INTEGRATION v:1 profile:full hash:f65d5d33 -->
## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Dolt-powered version control with native sync
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**

```bash
bd ready --json
```

**Create new issues:**

```bash
bd create "Issue title" --description="Detailed context" -t bug|feature|task -p 0-4 --json
bd create "Issue title" --description="What this issue is about" -p 1 --deps discovered-from:bd-123 --json
```

**Claim and update:**

```bash
bd update <id> --claim --json
bd update bd-42 --priority 1 --json
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task atomically**: `bd update <id> --claim`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" --description="Details about what was found" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`

### Quality
- Use `--acceptance` and `--design` fields when creating issues
- Use `--validate` to check description completeness

### Lifecycle
- `bd defer <id>` / `bd supersede <id>` for issue management
- `bd stale` / `bd orphans` / `bd lint` for hygiene
- `bd human <id>` to flag for human decisions
- `bd formula list` / `bd mol pour <name>` for structured workflows

### Auto-Sync

bd automatically syncs via Dolt:

- Each write auto-commits to Dolt history
- Use `bd dolt push`/`bd dolt pull` for remote sync
- No manual export/import needed!

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems

For more details, see README.md and docs/QUICKSTART.md.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

<!-- END BEADS INTEGRATION -->
