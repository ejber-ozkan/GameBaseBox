# GBBox 0.7.0

This release improves library correctness, database importing and keyboard navigation while retaining the existing desktop architecture and emulator integrations.

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
- Fix the Linux AppImage icon link so it works away from the build machine, and validate packaged icons, desktop entries and launch files in CI.
- Add a saved sound-set choice in Theme & UI settings, with synthesized retro cues alongside the original samples.
- Refresh the README with animated demos and remove the unused bundled Asterix SID test page and music file.

## Validation and known limitations

Windows and macOS manual checks were reported by the maintainer before the final dependency updates. Ubuntu native testing was waived; Linux AppImage structure and desktop metadata were validated separately. Automated builds and browser tests do not replace packaged native testing. Detailed hardware, emulator and upgrade coverage remains incomplete.

Dependency advisories and bundled-asset provenance review remain open. This release does not claim a clean audit or completed license review. The Rust crate remains MIT and the root GPL license is unchanged.

## Upgrade and rollback

Quit GBBox and all emulators before upgrading. Back up the complete existing app profile, including its database and browser-backed settings, and retain a separate copy of any writable extracted game media. Test the upgrade with an isolated profile copy. Keep the existing OS account and credential-store entries available; encrypted settings can depend on them.

For rollback, quit GBBox, reinstall the previous version and restore the untouched pre-upgrade profile copy. Do not point an older version at the upgraded profile. Source libraries are not a substitute for a profile backup, and a profile copy does not include OS credential-store entries.

Distribution filenames remain `GBBox-Windows-x64-Setup.exe`, `GBBox-Linux.AppImage` and `GBBox-macOS.dmg`. The release includes SHA-256 checksums for download verification.
