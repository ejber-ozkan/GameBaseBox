# GBBox 0.6.3 Release Notes

GBBox 0.6.3 introduces complete multilingual and internationalization (i18n) support across the entire frontend application, supporting 33 languages (including all 24 European Union official languages, Turkish with authentic retro gaming vocabulary, and Arabic with RTL layout support).

## What's New in 0.6.3

### 🌐 Complete Multilingual UI (33 Languages)
- **High-Performance i18n Architecture**: Lightweight React context-based internationalization engine offering zero layout shift, synchronous `O(1)` dictionary lookups, and sub-100ms response across tens of thousands of continuous queries.
- **Full Coverage of Official EU Languages**: Bulgarian, Croatian, Czech, Danish, Dutch, English, Estonian, Finnish, French, German, Greek, Hungarian, Irish, Italian, Latvian, Lithuanian, Maltese, Polish, Portuguese, Romanian, Slovak, Slovenian, Spanish, and Swedish.
- **Expanded Global Locales**: Turkish, Arabic, Simplified Chinese, Traditional Chinese, Japanese, Korean, Russian, Ukrainian, and Indonesian.
- **RTL & Document Sync**: Dynamic document attribute updates (`lang`, `dir="rtl"` / `dir="ltr"`) for right-to-left scripts like Arabic.

### 🎨 Theme & View Localization
- **All Themes Localized**: Full translation parity across **C64 Edition**, **Cyberpunk CRT**, **Arcade Void**, and **Desktop Windowed Mode**.
- **Game Details & Bento Panels**: Launch buttons (`🚀 Launch Emulator`, `🎮 Play Browser`), function key tabs (`[F1] Files`, `[F3] Info`, `[F5] Credits`), metadata sidebars, technical status flags, musician / SID player controls, and alternative version selectors.
- **Library Shelves & Search**: Shelf headers (`Recent`, `Favorites`, `Classics`), database indicators, quick search placeholders, item counts, and genre / sub-genre selection modals.
- **First Run Setup Page**: Platform setup wizard, MDB file chooser, database builder actions, optional folder path mappings, step explanation panels, and folder validation warnings.
- **Settings Modal**: Appearance language dropdown, platform folder path configurations, emulator executables and core path selectors, display settings, input bindings, content filters, and maintenance utilities.
- **BigBox & Controller Navigation**: Gamepad HUD prompts, BigBox exit prompts, and virtual on-screen controller keyboard.

### 🧪 Quality & Test Coverage
- **100% Test Pass Rate**: 68 test files and 485 automated unit/integration tests passing.
- Dedicated UI localization test suite verifying vocabulary accuracy, theme rendering, and dictionary performance.
