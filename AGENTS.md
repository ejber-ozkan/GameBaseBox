# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd prime` for full workflow context.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work atomically
bd close <id>         # Complete work
bd dolt push          # Push beads data to remote
```

## Codebase Navigation with Graphify

This project maintains a codebase knowledge graph in `graphify-out/` to optimize context retrieval and save tokens.

- **Check Graph First**: Before performing grep searches or reading entire files for codebase architecture questions, query the graph via:
  ```bash
  graphify query "<question>"
  ```
- **Find Relationships**: To trace dependency paths between two modules, run:
  ```bash
  graphify path "<Source>" "<Target>"
  ```
- **Explain Concepts**: To get a plain-language summary of a concept or file, run:
  ```bash
  graphify explain "<concept>"
  ```
- **Keep Graph Updated**: After making code changes, run `graphify update .` to update the AST structure in the graph.

### Windows Codex sandbox note

The uv-managed Graphify launcher lives under the user profile. Codex's workspace sandbox can block the launcher's tool/cache paths and report `uv trampoline failed to canonicalize script path` even when the local installation is healthy. If that exact error occurs in Codex, rerun the same `graphify` command with elevated/unsandboxed execution. Do not reinstall Graphify unless `graphify --version` also fails in a normal unsandboxed PowerShell session.

## Local Tauri WebView Debugging

Both development launchers, `tauri-dev.bat` and `tauri-dev-debug.bat`, expose the active Tauri WebView DevTools protocol on **`127.0.0.1:9222`**. The endpoint is loopback-only, is not included in production builds, and disappears when the development app closes.

Use it when source inspection is insufficient and the running native window must be diagnosed:

```powershell
Invoke-RestMethod http://127.0.0.1:9222/json
```

This returns the current WebView's CDP endpoint. Agents may attach with Playwright/CDP to inspect the real DOM, computed styles, console output, and screenshots. Prefer direct native-WebView verification for Tauri-only rendering bugs, and do not change the debugging address away from `127.0.0.1` without explicit user approval.

## Non-Interactive Shell Commands

**ALWAYS use non-interactive flags** with file operations to avoid hanging on confirmation prompts.

Shell commands like `cp`, `mv`, and `rm` may be aliased to include `-i` (interactive) mode on some systems, causing the agent to hang indefinitely waiting for y/n input.

**Use these forms instead:**
```bash
# Force overwrite without prompting
cp -f source dest           # NOT: cp source dest
mv -f source dest           # NOT: mv source dest
rm -f file                  # NOT: rm file

# For recursive operations
rm -rf directory            # NOT: rm -r directory
cp -rf source dest          # NOT: cp -r source dest
```

**Other commands that may prompt:**
- `scp` - use `-o BatchMode=yes` for non-interactive
- `ssh` - use `-o BatchMode=yes` to fail instead of prompting
- `apt-get` - use `-y` flag
- `brew` - use `HOMEBREW_NO_AUTO_UPDATE=1` env var

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

## Ejber's Ways of working

## Theme Surface Consistency

When changing a theme, implement and QA-check the change in both the windowed library and fullscreen BigBox view. Treat those surfaces as one theme contract: rails, colors/effects, typography, focus/navigation, and available content sections must not diverge.
it must work in any resolution in bigbox or windowed 720p, 1080p, 1440p, and 4K. Gracefully rescale.

1. Ask, don't assume. If something is unclear, ask before writing a single line. Never make silent assumptions about intent, architecture, or requirements. When running unattended, pick the most reasonable interpretation, proceed, and record the assumption rather than blocking
2. Implement the simplest solution for simple problems, better solutions for harder problems. Do not over-engineer or add flexibility that isn't needed yet
3. Don't touch unrelated code but please do surface bad code or design smells you discover with me so we can address them as a separate issue
4. Flag uncertainty explicitly. If you're unsure about something, see point 1 above. If it makes sense to do so, conduct a small, localised and low-risk experiment and bring the hypothesis and results to me to discuss. Confidence without certainty causes more damage than admitting a gap
5. I'm always open to ideas on better ways to do things. Please don't hesitate to suggest a better way, or one that has long lasting impact over a tactical change
