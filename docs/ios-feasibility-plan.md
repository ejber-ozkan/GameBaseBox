# GBBox iPad/iOS feasibility plan

## Recommendation

An iPad version is feasible, but it should be a self-contained GBBox library
and embedded-emulation app. It cannot use the desktop model of starting an
arbitrary configured emulator executable while GBBox remains the active front
end.

On iPad, offer only a bundled embedded core once the platform has passed
performance, firmware, licence and format validation. Keep the desktop
external-emulator choice unchanged.

## Product model

| Target | Provider | Experience |
| --- | --- | --- |
| Windows, macOS, Linux | External emulator; optional embedded support | Retain the existing emulator choice. |
| iPad C64 first spike | Bundled C64 core | One **Play** action. |
| iPad new 8-bit platform | Bundled core after validation | Play only when the core is shipped and approved. |
| iPad Amiga / Atari ST | Not in the first release | Do not advertise support until media, memory and firmware work is proven. |
| Companion-app hand-off | URL or document hand-off | Secondary action only; GBBox cannot remain the integrated front end. |

Apple allows retro console and PC emulator apps, but the app remains
responsible for legal compliance and offered content. It must also remain
self-contained: do not download executable emulators or cores after review.
See [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).

## Architecture direction

```text
Shared React library UI + platform/database contracts
                    |
          target capability resolver
             /                  \
desktop external launch     iOS bundled core
desktop configured paths    iOS app-container storage
```

Resolve launch capability by both platform and target. For example, C64 desktop
can offer external and embedded providers; C64 iPad should offer embedded only;
Amiga iPad remains unavailable until a tested bundled core exists.

## iOS storage and import

Replace configured folders and absolute paths with an **Import to GBBox
Library** flow:

1. Use the document picker for one or more ROM/archive files.
2. Validate extension, archive contents, size and hash.
3. Copy accepted files into GBBox-managed app storage.
4. Store relative paths and content metadata in SQLite.
5. Keep save states, screenshots and backups in app-managed storage.

Document-picker URLs are security scoped. Imported documents are temporary
until copied into the app container; access must be correctly scoped and
coordinated. See [UIDocumentPickerViewController](https://developer.apple.com/documentation/uikit/uidocumentpickerviewcontroller).

## Delivery stages

### 1. C64 iPad spike

- Initialise the Tauri iOS target on macOS and build on an iPad simulator and
  physical device.
- Make external launch unavailable on iOS and hide executable/core path fields.
- Test existing C64 EmulatorJS/WASM with representative media, touch and a
  physical controller.
- Measure startup, frame pacing, audio latency, memory and lifecycle recovery.

**Gate:** retain web/WASM only if it works on the oldest supported iPad;
otherwise build a narrow native core plugin.

### 2. Mobile storage and launch service

- Implement document-picker import and app-container storage.
- Add a target-specific launch service; desktop retains process launch while
  iOS uses a bundled core only.
- Avoid the current full byte-array Rust-to-JavaScript-to-iframe transfer for
  larger disk images.

### 3. Mobile quality and submission

- Support controller mapping, touch controls, audio interruptions, suspend and
  resume, rotation and accessibility.
- Audit core licences, firmware/BIOS needs, artwork rights and sample content.
- Prepare App Review notes, privacy disclosures and a lawful reviewer flow.

### 4. Platform expansion

Admit one platform at a time only after its format, core, controller,
save-state, performance and rights checks pass. Begin with smaller 8-bit
systems; leave Amiga and Atari ST until their higher-risk workflows are proven.

## References

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple document picker](https://developer.apple.com/documentation/uikit/uidocumentpickerviewcontroller)
- [Tauri mobile prerequisites](https://v2.tauri.app/start/prerequisites/)
- [Tauri mobile plugins](https://v2.tauri.app/develop/plugins/develop-mobile/)
