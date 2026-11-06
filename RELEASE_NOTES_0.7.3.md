# GBBox 0.7.3

This maintenance release makes startup, browsing and imports faster and more
responsive, fixes the game details page overflowing the window, and tightens which
files the app will read or launch.

## Fixes

- The game details page now fits the window in every theme. On Windows the extras
  screenshot could sit below the fold and the whole page had to be scrolled.
- Database imports no longer freeze the window, and **Cancel** now works while an
  import is running.
- Picking a random game no longer disturbs the library rails, and in list view it
  no longer loads the whole library to reach a game far down the list.
- Command-line dev scripts no longer break on messages containing parentheses.

## Performance

- Normal startups skip rebuilding the cover index; the database check runs in the
  background instead of delaying the window.
- Database connections are reused, and large libraries load their game lists in
  batches.
- Libraries converted with older `db:convert` runs lose two indexes that made the
  library query slow on large databases. This happens automatically on first start.
- Music previews use less memory: tracks are passed to the player directly and only
  the most recent 48 are kept.
- Platform background images are much smaller (about 2 MB in total instead of 36 MB),
  so the installer and the first library view are lighter.

## Settings and security

- Settings are now saved in `settings.json` in the app's configuration folder, as
  well as in the browser storage used previously. Existing settings are migrated on
  first start.
- The app only reads files, opens folders and launches programs inside the folders
  and paths you have set in Settings. If something stops opening after the upgrade,
  check that its folder is configured under **Platform Paths**.
- Archive handling uses an up-to-date ZIP library.

## Upgrade and rollback

Quit GBBox and emulators before upgrading, and keep a backup of your application
profile and database. No database reimport is required. To roll back, reinstall
0.7.2; it keeps reading the settings stored in browser storage and rebuilds the
cover index on each start as before.

Distribution filenames remain `GBBox-Windows-x64-Setup.exe`, `GBBox-Linux.AppImage`
and `GBBox-macOS.dmg`. Bundle builds generate SHA-256 checksums for verification.
