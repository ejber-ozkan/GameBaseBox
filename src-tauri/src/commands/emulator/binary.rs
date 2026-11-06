//! Locating the emulator executable from a configured path: a file, a directory, or a
//! macOS .app bundle (with optional companion binaries).

use std::path::{Path, PathBuf};

pub(super) const ALL_POSSIBLE_EXES: &[&str] = &[
    "retroarch.exe",
    "retroarch",
    "RetroArch",
    "x64sc.exe",
    "x64sc",
    "x64.exe",
    "x64",
    "vice",
    "vice.exe",
    "xvic.exe",
    "xvic",
    "x128.exe",
    "x128",
    "xpet.exe",
    "xpet",
    "xplus4.exe",
    "xplus4",
    "xscpu64.exe",
    "xscpu64",
    "x64dtv.exe",
    "x64dtv",
    "altirra64.exe",
    "altirra64",
    "altirra.exe",
    "altirra",
    "spectaculator.exe",
    "spectaculator",
    "beebem.exe",
    "beebem",
    "winuae64.exe",
    "winuae.exe",
    "winuae",
    "fs-uae.exe",
    "fs-uae",
    "FS-UAE",
    "amiberry.exe",
    "amiberry",
    "kegswin.exe",
    "kegswin",
    "kegs.exe",
    "kegs",
    "gsplus.exe",
    "gsplus",
    "hatari.exe",
    "hatari",
    "Hatari",
    "steem.exe",
    "steem",
    "cpce.exe",
    "cpce",
];

pub(super) fn profile_candidate_binaries(
    emulator_profile_id: Option<&str>,
    platform_id: Option<&str>,
) -> &'static [&'static str] {
    match emulator_profile_id {
        Some("vice-c64") => &[
            "x64sc.exe", "x64sc", "x64.exe", "x64", "vice.exe", "vice", "x64dtv.exe", "x64dtv",
        ],
        Some("vice-vic20") => &["xvic.exe", "xvic"],
        Some("vice-c128") => &["x128.exe", "x128"],
        Some("vice-pet") => &["xpet.exe", "xpet"],
        Some(id) if id.starts_with("retroarch-") => &[
            "retroarch.exe", "retroarch", "RetroArch",
        ],
        Some("altirra-atari800") | Some("altirra-atari5200") => &[
            "altirra64.exe", "altirra64", "altirra.exe", "altirra", "Altirra64.exe", "Altirra.exe",
        ],
        Some("spectaculator-zxspectrum") => &[
            "spectaculator.exe", "spectaculator", "Spectaculator.exe",
        ],
        Some("beebem-bbcmicro") => &["beebem.exe", "beebem", "BeeBEm.exe", "BeeBEm"],
        Some("winuae-amiga") => &[
            "winuae64.exe", "winuae.exe", "winuae", "fs-uae.exe", "fs-uae", "FS-UAE", "amiberry.exe", "amiberry",
        ],
        Some("kegs-apple2gs") => &[
            "kegswin.exe", "kegswin", "kegs.exe", "kegs", "gsplus.exe", "gsplus",
        ],
        Some("hatari-atarist") => &["hatari.exe", "hatari", "Hatari"],
        Some("steem-atarist") => &["steem.exe", "steem", "Steem.exe"],
        Some("cpce-amstradcpc") => &["cpce.exe", "cpce"],
        _ => match platform_id {
            Some("c64") => &[
                "x64sc.exe", "x64sc", "x64.exe", "x64", "vice.exe", "vice", "retroarch.exe", "retroarch",
            ],
            Some("vic20") => &["xvic.exe", "xvic", "retroarch.exe", "retroarch"],
            Some("c128") => &["x128.exe", "x128", "retroarch.exe", "retroarch"],
            Some("pet") => &["xpet.exe", "xpet", "retroarch.exe", "retroarch"],
            _ => &[],
        },
    }
}

pub(super) fn resolve_app_bundle(
    app_bundle: &Path,
    emulator_profile_id: Option<&str>,
    platform_id: Option<&str>,
) -> Option<PathBuf> {
    let bundle_stem = app_bundle
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("");

    // 1. Companion bin directory in parent folder (e.g. VICE distribution layout on macOS:
    //    parent folder contains x64sc.app and bin/x64sc launcher script)
    if let Some(parent) = app_bundle.parent() {
        let bin_dir = parent.join("bin");
        if bin_dir.is_dir() {
            let stem_candidate = bin_dir.join(bundle_stem);
            if stem_candidate.is_file() {
                return Some(stem_candidate);
            }
            for exe in profile_candidate_binaries(emulator_profile_id, platform_id) {
                let candidate = bin_dir.join(exe);
                if candidate.is_file() {
                    return Some(candidate);
                }
            }
            for exe in ALL_POSSIBLE_EXES {
                let candidate = bin_dir.join(exe);
                if candidate.is_file() {
                    return Some(candidate);
                }
            }
        }
    }

    // 2. Contents/MacOS in the .app bundle
    let macos_dir = app_bundle.join("Contents").join("MacOS");
    if macos_dir.is_dir() {
        if let Ok(entries) = std::fs::read_dir(&macos_dir) {
            let mut files: Vec<PathBuf> = entries
                .flatten()
                .map(|e| e.path())
                .filter(|p| p.is_file())
                .collect();
            files.sort();

            if let Some(matching) = files.iter().find(|p| {
                p.file_stem()
                    .and_then(|s| s.to_str())
                    .is_some_and(|s| s.eq_ignore_ascii_case(bundle_stem))
            }) {
                return Some(matching.clone());
            }

            for exe in profile_candidate_binaries(emulator_profile_id, platform_id) {
                let clean_exe = exe.strip_suffix(".exe").unwrap_or(exe);
                if let Some(matching) = files.iter().find(|p| {
                    p.file_name()
                        .and_then(|s| s.to_str())
                        .is_some_and(|s| s.eq_ignore_ascii_case(clean_exe) || s.eq_ignore_ascii_case(exe))
                }) {
                    return Some(matching.clone());
                }
            }

            for exe in ALL_POSSIBLE_EXES {
                let clean_exe = exe.strip_suffix(".exe").unwrap_or(exe);
                if let Some(matching) = files.iter().find(|p| {
                    p.file_name()
                        .and_then(|s| s.to_str())
                        .is_some_and(|s| s.eq_ignore_ascii_case(clean_exe) || s.eq_ignore_ascii_case(exe))
                }) {
                    return Some(matching.clone());
                }
            }

            if let Some(first) = files.into_iter().next() {
                return Some(first);
            }
        }
    }

    // 3. Contents/Resources/bin in the .app bundle (VICE internal layout if VICE.app is selected)
    let res_bin = app_bundle.join("Contents").join("Resources").join("bin");
    if res_bin.is_dir() {
        if let Ok(entries) = std::fs::read_dir(&res_bin) {
            let mut files: Vec<PathBuf> = entries
                .flatten()
                .map(|e| e.path())
                .filter(|p| p.is_file())
                .collect();
            files.sort();

            for exe in profile_candidate_binaries(emulator_profile_id, platform_id) {
                let clean_exe = exe.strip_suffix(".exe").unwrap_or(exe);
                if let Some(matching) = files.iter().find(|p| {
                    p.file_name()
                        .and_then(|s| s.to_str())
                        .is_some_and(|s| s.eq_ignore_ascii_case(clean_exe) || s.eq_ignore_ascii_case(exe))
                }) {
                    return Some(matching.clone());
                }
            }

            for exe in ALL_POSSIBLE_EXES {
                let clean_exe = exe.strip_suffix(".exe").unwrap_or(exe);
                if let Some(matching) = files.iter().find(|p| {
                    p.file_name()
                        .and_then(|s| s.to_str())
                        .is_some_and(|s| s.eq_ignore_ascii_case(clean_exe) || s.eq_ignore_ascii_case(exe))
                }) {
                    return Some(matching.clone());
                }
            }
        }
    }

    None
}

pub(super) fn resolve_directory(
    dir: &Path,
    emulator_profile_id: Option<&str>,
    platform_id: Option<&str>,
) -> Option<PathBuf> {
    // 1. Direct candidate files in dir (Windows / Linux / flat directories)
    for exe in profile_candidate_binaries(emulator_profile_id, platform_id) {
        let p = dir.join(exe);
        if p.is_file() {
            return Some(p);
        }
    }
    for exe in ALL_POSSIBLE_EXES {
        let p = dir.join(exe);
        if p.is_file() {
            return Some(p);
        }
    }

    // 2. Look in dir/bin (e.g. vice-arm64-gtk3-3.9/bin, /usr/local/bin, /opt/vice/bin)
    let bin_dir = dir.join("bin");
    if bin_dir.is_dir() {
        for exe in profile_candidate_binaries(emulator_profile_id, platform_id) {
            let p = bin_dir.join(exe);
            if p.is_file() {
                return Some(p);
            }
        }
        for exe in ALL_POSSIBLE_EXES {
            let p = bin_dir.join(exe);
            if p.is_file() {
                return Some(p);
            }
        }
    }

    // 3. Look for .app bundles in dir (e.g. vice-arm64-gtk3-3.9/x64sc.app, /Applications/RetroArch.app)
    if let Ok(entries) = std::fs::read_dir(dir) {
        let app_bundles: Vec<PathBuf> = entries
            .flatten()
            .map(|e| e.path())
            .filter(|p| {
                p.is_dir()
                    && p.extension()
                        .and_then(|ext| ext.to_str())
                        .is_some_and(|ext| ext.eq_ignore_ascii_case("app"))
            })
            .collect();

        let candidates = profile_candidate_binaries(emulator_profile_id, platform_id);
        for app in &app_bundles {
            let stem = app.file_stem().and_then(|s| s.to_str()).unwrap_or("");
            if candidates.iter().any(|c| stem.eq_ignore_ascii_case(c.strip_suffix(".exe").unwrap_or(c))) {
                if let Some(resolved) = resolve_app_bundle(app, emulator_profile_id, platform_id) {
                    return Some(resolved);
                }
            }
        }

        for app in &app_bundles {
            let stem = app.file_stem().and_then(|s| s.to_str()).unwrap_or("");
            if ALL_POSSIBLE_EXES.iter().any(|c| stem.eq_ignore_ascii_case(c.strip_suffix(".exe").unwrap_or(c))) {
                if let Some(resolved) = resolve_app_bundle(app, emulator_profile_id, platform_id) {
                    return Some(resolved);
                }
            }
        }

        for app in &app_bundles {
            if let Some(resolved) = resolve_app_bundle(app, emulator_profile_id, platform_id) {
                return Some(resolved);
            }
        }
    }

    None
}

pub(in crate::commands) fn resolve_emulator_binary(
    raw_path_str: &str,
    emulator_profile_id: Option<&str>,
    platform_id: Option<&str>,
    not_found: impl FnOnce() -> String,
) -> Result<PathBuf, String> {
    let clean_str = raw_path_str.trim().trim_matches('"').trim_matches('\'');
    let raw_path = PathBuf::from(clean_str);

    if !raw_path.exists() {
        return Err(not_found());
    }

    if raw_path.is_file() {
        return Ok(raw_path);
    }

    if raw_path.is_dir() {
        let is_app_bundle = raw_path
            .extension()
            .and_then(|ext| ext.to_str())
            .is_some_and(|ext| ext.eq_ignore_ascii_case("app"))
            || raw_path.join("Contents/MacOS").is_dir();

        if is_app_bundle {
            if let Some(resolved) = resolve_app_bundle(&raw_path, emulator_profile_id, platform_id) {
                return Ok(resolved);
            }
        } else if let Some(resolved) = resolve_directory(&raw_path, emulator_profile_id, platform_id) {
            return Ok(resolved);
        }

        return Err(format!(
            "No supported emulator binary found in directory: {}",
            raw_path.display()
        ));
    }

    Err(not_found())
}
