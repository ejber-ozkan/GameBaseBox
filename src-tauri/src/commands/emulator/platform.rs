//! Platform facts used while launching, read from `platform-manifest.json` (the single
//! source of truth) instead of per-platform match tables.

use crate::platform_manifest;

/// The platform used when a request names none or an unknown one (legacy C64 callers).
const DEFAULT_PLATFORM: &str = "c64";

fn known_platform(platform_id: Option<&str>) -> Option<&str> {
    platform_id.filter(|id| platform_manifest::display_name(id).is_some())
}

/// Name used in launch messages. C64 keeps its short historical name.
pub(super) fn platform_display_name(platform_id: Option<&str>) -> &'static str {
    match known_platform(platform_id) {
        Some(DEFAULT_PLATFORM) | None => "C64",
        Some(id) => platform_manifest::display_name(id).unwrap_or("C64"),
    }
}

pub(super) fn emulator_profile_display_name(
    profile_id: Option<&str>,
    is_retroarch: bool,
) -> &'static str {
    let Some(profile_id) = profile_id else {
        return "emulator";
    };
    if let Some(name) = platform_manifest::emulator_profile_short_name(profile_id) {
        return name;
    }
    if is_retroarch || profile_id.starts_with("retroarch-") {
        "RetroArch"
    } else {
        "emulator"
    }
}

/// Extensions extracted from a ZIP for this platform (see
/// `platform_manifest::archive_member_extensions`).
pub(super) fn launch_extensions_for_platform(platform_id: Option<&str>) -> Vec<&'static str> {
    platform_manifest::archive_member_extensions(
        known_platform(platform_id).unwrap_or(DEFAULT_PLATFORM),
    )
}

fn retroarch_core_platform_prefix(platform_id: Option<&str>) -> Option<&'static str> {
    match known_platform(platform_id) {
        Some(DEFAULT_PLATFORM) | None => None,
        Some(id) => platform_manifest::display_name(id),
    }
}

pub(super) fn retroarch_core_not_found_message(
    platform_id: Option<&str>,
    core_path: &str,
) -> String {
    match retroarch_core_platform_prefix(platform_id) {
        Some(name) => format!("{name} RetroArch core file not found: {core_path}"),
        None => format!("RetroArch Core file not found: {core_path}"),
    }
}

pub(super) fn retroarch_core_not_file_message(
    platform_id: Option<&str>,
    core_path: &str,
) -> String {
    match retroarch_core_platform_prefix(platform_id) {
        Some(name) => format!("{name} RetroArch core path is not a file: {core_path}"),
        None => format!("RetroArch Core path is not a file: {core_path}"),
    }
}

pub(super) fn is_supported_emulator_profile(platform_id: &str, profile_id: &str) -> bool {
    platform_manifest::supports_emulator_profile(platform_id, profile_id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn names_and_messages_match_the_previous_hard_coded_tables() {
        assert_eq!(platform_display_name(None), "C64");
        assert_eq!(platform_display_name(Some("c64")), "C64");
        assert_eq!(platform_display_name(Some("unknown")), "C64");
        assert_eq!(platform_display_name(Some("amiga")), "Commodore Amiga");
        assert_eq!(platform_display_name(Some("bbcmicro")), "Acorn BBC Micro");

        assert_eq!(
            emulator_profile_display_name(Some("altirra-atari5200"), false),
            "Altirra"
        );
        assert_eq!(
            emulator_profile_display_name(Some("altirra-atari800"), true),
            "Altirra"
        );
        assert_eq!(
            emulator_profile_display_name(Some("vice-pet"), false),
            "VICE"
        );
        assert_eq!(
            emulator_profile_display_name(Some("winuae-amiga"), false),
            "WinUAE / UAE"
        );
        assert_eq!(
            emulator_profile_display_name(Some("cpce-amstradcpc"), false),
            "Caprice32 / CPC++"
        );
        assert_eq!(
            emulator_profile_display_name(Some("retroarch-c64"), false),
            "RetroArch"
        );
        assert_eq!(
            emulator_profile_display_name(Some("custom"), true),
            "RetroArch"
        );
        assert_eq!(
            emulator_profile_display_name(Some("custom"), false),
            "emulator"
        );
        assert_eq!(emulator_profile_display_name(None, true), "emulator");

        assert_eq!(
            retroarch_core_not_found_message(Some("atari7800"), "core.so"),
            "Atari 7800 RetroArch core file not found: core.so"
        );
        assert_eq!(
            retroarch_core_not_file_message(None, "core.so"),
            "RetroArch Core path is not a file: core.so"
        );
        assert!(is_supported_emulator_profile(
            "atari7800",
            "retroarch-atari7800"
        ));
        assert!(!is_supported_emulator_profile("atari7800", "vice-c64"));
    }

    #[test]
    fn archive_extensions_match_the_previous_hard_coded_lists() {
        let mut c64 = launch_extensions_for_platform(None);
        c64.sort_unstable();
        assert_eq!(c64, ["crt", "d64", "g64", "nib", "prg", "t64", "tap"]);
        let mut amiga = launch_extensions_for_platform(Some("amiga"));
        amiga.sort_unstable();
        assert_eq!(
            amiga,
            ["adf", "adz", "dms", "hdf", "hdz", "ipf", "lha", "slave"]
        );
        let mut atari800 = launch_extensions_for_platform(Some("atari800"));
        atari800.sort_unstable();
        assert_eq!(
            atari800,
            ["atr", "atx", "bin", "car", "cas", "com", "dcm", "rom", "xex", "xfd"]
        );
    }
}
