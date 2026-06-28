<!-- markdownlint-disable MD013 -->

# Tasks: GameBaseBox Public 0.1 Release

**Input**: Design documents from `specs/002-gamebasebox-public-release/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included because this feature changes public identity, app metadata, repository publication, release packaging, and docs.

## Phase 1: Spec Closure and Audit

- [X] T001 Confirm `specs/001-multi-platform-gamebases/tasks.md` is complete and add any final completion note needed in `specs/001-multi-platform-gamebases/quickstart.md`
- [X] T002 Audit tracked files for `64Box`, `64box`, `VIC40GameBox`, `vic40gamebox`, old app titles, and visible logo references
- [X] T003 Identify branding assets that visibly contain 64Box and record replacement targets

## Phase 2: Product Rebrand

- [X] T004 Update app/package/product metadata to GBBox/GameBase Box and version `0.1.0`
- [X] T005 Update Tauri bundle/product metadata and icon/title references for GBBox
- [X] T006 Replace user-facing app copy in `src/` with GBBox/GameBase Box wording
- [X] T007 Replace public/static logo or icon assets that contain 64Box branding
- [X] T008 Update `.specify/memory/constitution.md` from 64Box governance wording to GBBox/GameBase Box wording
- [X] T009 Update docs that describe the current product identity and supported imports

## Phase 3: README and Repository Content

- [X] T010 Rewrite the new repository README around GBBox/GameBase Box, supported imports, setup, and roadmap
- [X] T011 Add old-repository README redirect copy pointing users to the new GameBaseBox repo
- [X] T012 Prepare release notes source text for `v0.1.0`
- [X] T013 Verify branding search has no unintended 64Box references

## Phase 4: Validation and Build Artifacts

- [X] T014 Run `npm run lint`
- [X] T015 Run `npm run test:frontend`
- [X] T016 Run `npm run test:backend`
- [X] T017 Run `npm run build`
- [X] T018 Build Tauri release artifacts and record artifact paths
- [X] T019 Verify built artifacts use GBBox/GameBaseBox branding where packaging allows

## Phase 5: New Public Repository and Release

- [ ] T020 Create public GitHub repository `GameBaseBox`
- [ ] T021 Populate `GameBaseBox` with clean initial history from release-ready source
- [ ] T022 Configure GitHub repo description and topics for search visibility
- [ ] T023 Push the release-ready source to the new repository
- [ ] T024 Create and push tag `v0.1.0`
- [ ] T025 Create GitHub release `GBBox 0.1.0` with full release notes
- [ ] T026 Attach built release artifacts to `v0.1.0`
- [ ] T027 Verify the new repo, release notes, tag, and attached artifacts from GitHub

## Phase 6: Old Repo Redirect and Close-Out

- [ ] T028 Commit and push the old repository README redirect if it is maintained separately from the new clean-history repo
- [X] T029 Run `graphify update .` after source/doc changes
- [ ] T030 Close beads issues, run `bd dolt push`, push all relevant git remotes, and verify clean status
