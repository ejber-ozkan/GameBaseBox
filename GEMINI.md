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
- **Codebase Architecture & Questions via Graphify**: Always consult the Graphify knowledge graph (`graphify-out/graph.json` / `graphify query` / NetworkX graph traversal) when investigating codebase architecture, component relationships, or answering structural questions.
- **Direct SQLite Database Access**: When inspecting or querying the SQLite database (`gb64.sqlite` / `gamebasebox.db`), always use direct SQLite tools / CLI (`sqlite3 <db-path> "<query>"`) or dedicated database skills rather than writing temporary Python scripts.


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

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
