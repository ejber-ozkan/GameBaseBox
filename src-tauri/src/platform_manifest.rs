use crate::models::{PlatformCapabilities, PlatformProfile};
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PlatformManifest {
    platforms: Vec<ManifestPlatform>,
}

#[derive(Deserialize)]
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

#[derive(Deserialize)]
struct ManifestMediaCapabilities {
    screenshots: bool,
    photos: bool,
    music: String,
    extras: bool,
    videos: bool,
}

#[derive(Deserialize)]
struct ManifestEmulatorProfile {
    id: String,
    default: Option<bool>,
}

fn manifest() -> Result<PlatformManifest, String> {
    serde_json::from_str(include_str!("../../platform-manifest.json"))
        .map_err(|error| format!("Invalid platform manifest: {error}"))
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
