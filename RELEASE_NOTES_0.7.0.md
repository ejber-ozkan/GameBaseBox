# GBBox 0.7.0 Candidate

This candidate improves library correctness, database importing and keyboard navigation while retaining the existing desktop architecture and emulator integrations.

## Changes

- Preserve rooted and network paths when resolving game and media files.
- Keep contributor credits and filtered results isolated to the selected platform.
- Ignore obsolete library requests, preserve paged browsing after returning from details, and sort the complete result set before paging.
- Refresh cached library data after reimport and avoid loading inactive presentation data.
- Import GameBase MDB files on Linux and macOS through installed `mdbtools`, with discovery guidance and staged import cleanup. Windows retains its existing Access export tooling.
- Bound archive extraction by member count and streamed bytes, reject duplicate output paths and clean failed launch attempts. Successful extracted sessions remain available for writable game media.
- Make library sorting and game titles accessible through native keyboard controls and prevent fullscreen arrow keys from moving selection twice.
- Retire unused library and detail implementations after adding coverage to the active views.
- Update selected JavaScript and Rust dependencies and verify complete platform bundles and checksums before release publication.

## Candidate limitations

Windows and macOS manual checks were reported by the maintainer before the final dependency updates. Ubuntu native testing was waived; automated builds and browser tests do not replace packaged native testing. Detailed hardware, emulator and upgrade coverage remains incomplete.

Dependency advisories and bundled-asset provenance review remain open. This candidate does not claim a clean audit or completed license review. The Rust crate remains MIT and the root GPL license is unchanged.

## Upgrade and rollback

Quit GBBox and all emulators before testing. Back up the complete existing app profile, including its database and browser-backed settings, and retain a separate copy of any writable extracted game media. Test the candidate with an isolated profile copy. Keep the existing OS account and credential-store entries available; encrypted settings can depend on them.

For rollback, quit the candidate, reinstall the previous version and restore the untouched pre-upgrade profile copy. Do not point an older version at the candidate's modified profile. Source libraries are not a substitute for a profile backup, and a profile copy does not include OS credential-store entries.

Candidate preparation does not publish a release. Distribution filenames remain `GBBox-Windows-x64-Setup.exe`, `GBBox-Linux.AppImage` and `GBBox-macOS.dmg`.
