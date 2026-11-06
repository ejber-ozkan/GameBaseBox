use crate::models::{PlatformCapabilities, PlatformProfile};
use serde::Deserialize;
use std::sync::LazyLock;

#[derive(Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct PlatformManifest {
    platforms: Vec<ManifestPlatform>,
}

#[derive(Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ManifestPlatform {
    id: String,
    aliases: Vec<String>,
    display_name: String,
    status: String,
    default_imported: bool,
    required_folder_types: Vec<String>,
    folder_types: Vec<String>,
    media_capabilities: ManifestMediaCapabilities,
    in_app_emulation: bool,
    launch_extensions: Vec<String>,
    emulator_profiles: Vec<ManifestEmulatorProfile>,
}

#[derive(Deserialize, Clone)]
struct ManifestMediaCapabilities {
    screenshots: bool,
    photos: bool,
    music: String,
    extras: bool,
    videos: bool,
}

#[derive(Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ManifestEmulatorProfile {
    id: String,
    display_name: String,
    emulator_type: String,
    default: Option<bool>,
}

/// Parsed once per process; the manifest is compiled into the binary.
static MANIFEST: LazyLock<Result<PlatformManifest, String>> = LazyLock::new(|| {
    serde_json::from_str(include_str!("../../platform-manifest.json"))
        .map_err(|error| format!("Invalid platform manifest: {error}"))
});

fn manifest() -> Result<PlatformManifest, String> {
    MANIFEST.clone()
}

fn manifest_ref() -> Option<&'static PlatformManifest> {
    MANIFEST.as_ref().ok()
}

fn platform_entry(platform_id: &str) -> Option<&'static ManifestPlatform> {
    manifest_ref()?.platforms.iter().find(|platform| platform.id == platform_id)
}

/// Display name from the manifest, e.g. "Commodore Amiga".
pub fn display_name(platform_id: &str) -> Option<&'static str> {
    platform_entry(platform_id).map(|platform| platform.display_name.as_str())
}

/// Whether `profile_id` is one of the platform's emulator profiles.
pub fn supports_emulator_profile(platform_id: &str, profile_id: &str) -> bool {
    platform_entry(platform_id)
        .is_some_and(|platform| platform.emulator_profiles.iter().any(|profile| profile.id == profile_id))
}

/// Short emulator name for messages: "RetroArch" and "VICE" for those families,
/// otherwise the profile's display name (e.g. "Altirra", "WinUAE / UAE").
pub fn emulator_profile_short_name(profile_id: &str) -> Option<&'static str> {
    manifest_ref()?
        .platforms
        .iter()
        .flat_map(|platform| platform.emulator_profiles.iter())
        .find(|profile| profile.id == profile_id)
        .map(|profile| match profile.emulator_type.as_str() {
            "retroarch" => "RetroArch",
            "vice" => "VICE",
            _ => profile.display_name.as_str(),
        })
}

/// File extensions (lowercase, without the dot) to take out of a ZIP when launching:
/// the platform's launch extensions minus containers and playlists, which are never
/// handed to an emulator from inside an archive.
pub fn archive_member_extensions(platform_id: &str) -> Vec<&'static str> {
    const CONTAINERS: &[&str] = &["zip", "7z", "m3u", "vfl"];
    platform_entry(platform_id)
        .map(|platform| {
            platform
                .launch_extensions
                .iter()
                .map(|extension| extension.trim_start_matches('.'))
                .filter(|extension| !CONTAINERS.contains(extension))
                .collect()
        })
        .unwrap_or_default()
}

fn normalized_key(value: &str) -> String {
    value
        .trim()
        .chars()
        .filter(|value| value.is_ascii_alphanumeric())
        .flat_map(char::to_lowercase)
        .collect()
}

pub fn normalize_platform_id(value: &str) -> Option<String> {
    let key = normalized_key(value);
    manifest().ok()?.platforms.into_iter().find_map(|platform| {
        let matches = std::iter::once(platform.id.as_str())
            .chain(std::iter::once(platform.display_name.as_str()))
            .chain(platform.aliases.iter().map(String::as_str))
            .any(|candidate| normalized_key(candidate) == key);
        matches.then_some(platform.id)
    })
}

pub fn supported_platforms() -> Result<Vec<PlatformProfile>, String> {
    manifest()?.platforms.into_iter().map(|platform| {
        let default_emulator_profile_id = platform
            .emulator_profiles
            .iter()
            .find(|profile| profile.default.unwrap_or(false))
            .or_else(|| platform.emulator_profiles.first())
            .ok_or_else(|| format!("{} has no emulator profile", platform.id))?
            .id
            .clone();

        Ok(PlatformProfile {
            id: platform.id,
            display_name: platform.display_name,
            status: platform.status,
            import_status: if platform.default_imported { "imported" } else { "notImported" }.to_string(),
            default_emulator_profile_id,
            supported_emulator_profile_ids: platform
                .emulator_profiles
                .into_iter()
                .map(|profile| profile.id)
                .collect(),
            capabilities: PlatformCapabilities {
                screenshots: platform.media_capabilities.screenshots,
                photos: platform.media_capabilities.photos,
                music: platform.media_capabilities.music,
                extras: platform.media_capabilities.extras,
                videos: platform.media_capabilities.videos,
                in_app_emulation: platform.in_app_emulation,
                launch_extensions: platform.launch_extensions,
            },
            folder_types: platform.folder_types,
        })
    }).collect()
}

pub fn required_folder_types(platform_id: &str) -> Result<Vec<String>, String> {
    let canonical_platform_id = normalize_platform_id(platform_id)
        .ok_or_else(|| format!("Unsupported platform: {platform_id}"))?;
    manifest()?.platforms.into_iter()
        .find(|platform| platform.id == canonical_platform_id)
        .map(|platform| platform.required_folder_types)
        .ok_or_else(|| format!("Unsupported platform: {platform_id}"))
}

pub fn find_platform(platform_id: &str) -> Result<Option<PlatformProfile>, String> {
    let canonical_platform_id = normalize_platform_id(platform_id).unwrap_or_else(|| platform_id.to_string());
    Ok(supported_platforms()?.into_iter().find(|platform| platform.id == canonical_platform_id))
}
