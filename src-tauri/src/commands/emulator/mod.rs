//! Launching games in external emulators.
//!
//! `plan_launch` turns a `LaunchRequest` into a command line (resolving the emulator
//! binary, extracting archives, writing playlists/launcher files); `launch_emulator`
//! spawns it. Platform-specific pieces live in the submodules; platform facts come
//! from `platform-manifest.json` via `platform`.

mod amiga;
mod apple2gs;
mod atari;
mod bbcmicro;
mod binary;
mod media;
mod metadata;
mod platform;
#[cfg(test)]
mod tests;

use amiga::*;
use apple2gs::*;
use atari::*;
use bbcmicro::*;
use media::*;
use metadata::*;
use platform::*;

pub(super) use binary::resolve_emulator_binary;

use crate::models::{EmulatorProfileTestRequest, LaunchRequest, LaunchResult};

use super::launch_archive::{with_extraction_session, DEFAULT_EXTRACTION_LIMITS};


use std::path::{Path, PathBuf};

use std::process::Command;

use std::time::{SystemTime, UNIX_EPOCH};

pub(super) fn create_launch_temp_dir() -> Result<PathBuf, String> {
    let base_dir = std::env::temp_dir();
    let process_id = std::process::id();

    for attempt in 0..10 {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| e.to_string())?
            .as_nanos();
        let candidate = base_dir.join(format!(
            "GBBoxTemp-{}-{}-{}",
            process_id, timestamp, attempt
        ));

        match std::fs::create_dir(&candidate) {
            Ok(()) => return Ok(candidate),
            Err(err) if err.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(err) => return Err(err.to_string()),
        }
    }

    Err("Failed to create a unique temporary launch directory".to_string())
}

fn require_existing_file(
    path: &Path,
    not_found_message: impl FnOnce() -> String,
    not_file_message: impl FnOnce() -> String,
) -> Result<(), String> {
    if !path.exists() {
        return Err(not_found_message());
    }

    if !path.is_file() {
        return Err(not_file_message());
    }

    Ok(())
}

fn is_retroarch_profile(profile_id: &str) -> bool {
    profile_id.starts_with("retroarch-")
}

#[tauri::command]
pub async fn test_emulator_profile(
    request: EmulatorProfileTestRequest,
) -> Result<LaunchResult, String> {
    let platform_id = request.platform_id.as_str();
    let emulator_profile_id = request.emulator_profile_id.as_str();
    let platform = Some(platform_id);
    let profile = Some(emulator_profile_id);
    let is_retroarch = is_retroarch_profile(emulator_profile_id);

    if !is_supported_emulator_profile(platform_id, emulator_profile_id) {
        return Ok(LaunchResult {
            success: false,
            message: format!(
                "Unsupported {} emulator profile: {}",
                platform_display_name(platform),
                emulator_profile_id
            ),
        });
    }

    let _resolved_emulator = match resolve_emulator_binary(
        &request.executable_path,
        Some(emulator_profile_id),
        Some(platform_id),
        || {
            format!(
                "{} {} executable path not found: {}",
                platform_display_name(platform),
                emulator_profile_display_name(profile, is_retroarch),
                request.executable_path
            )
        },
    ) {
        Ok(path) => path,
        Err(message) => {
            return Ok(LaunchResult {
                success: false,
                message,
            });
        }
    };

    if is_retroarch {
        let Some(core_path) = request.core_path.as_deref().filter(|path| !path.is_empty()) else {
            return Ok(LaunchResult {
                success: false,
                message: format!(
                    "{} {} core path is required.",
                    platform_display_name(platform),
                    emulator_profile_display_name(profile, true)
                ),
            });
        };

        if let Err(message) = require_existing_file(
            Path::new(core_path),
            || retroarch_core_not_found_message(platform, core_path),
            || retroarch_core_not_file_message(platform, core_path),
        ) {
            return Ok(LaunchResult {
                success: false,
                message,
            });
        }
    }

    Ok(LaunchResult {
        success: true,
        message: format!(
            "{} {} profile is ready.",
            platform_display_name(platform),
            emulator_profile_display_name(profile, is_retroarch)
        ),
    })
}

fn resolve_existing_rom_path(rom_path_str: &str) -> PathBuf {
    let clean_str = rom_path_str.trim().trim_matches('"').trim_matches('\'');
    let direct = PathBuf::from(clean_str);
    if direct.exists() {
        return direct;
    }

    let normalized = clean_str.replace('\\', "/");
    let normalized_path = PathBuf::from(&normalized);
    if normalized_path.exists() {
        return normalized_path;
    }

    // 1. Check if inserting "Extras" before subfolders (WHDLoad, SPS, Disks, HardDisk, STX, etc.) resolves to an existing file
    for candidate_folder in [
        "WHDLoad", "whdload", "SPS", "sps", "Disks", "disks", "Tapes", "tapes", "Carts",
        "carts", "HardDisk", "harddisk", "STX", "stx", "HDOLD", "hdold",
    ] {
        let pattern = format!("/{candidate_folder}/");
        if let Some((base, rest)) = normalized.split_once(&pattern) {
            let candidate_with_extras =
                PathBuf::from(format!("{base}/Extras/{candidate_folder}/{rest}"));
            if candidate_with_extras.exists() {
                return candidate_with_extras;
            }
        }
    }

    // 2. Check if removing "/Extras/" resolves to an existing file
    if normalized.contains("/Extras/") || normalized.contains("/extras/") {
        let candidate_without_extras = PathBuf::from(
            normalized
                .replace("/Extras/", "/")
                .replace("/extras/", "/"),
        );
        if candidate_without_extras.exists() {
            return candidate_without_extras;
        }
    }

    direct
}

#[tauri::command]
pub async fn launch_emulator(request: LaunchRequest) -> Result<LaunchResult, String> {
    // Archive extraction, launcher-file writes and process spawning are blocking work.
    crate::database::run_blocking("Emulator launch", move || launch_emulator_blocking(request)).await
}

/// Everything needed to start an emulator: the resolved binary and its arguments. Built
/// without spawning anything, so launch argument assembly is testable on its own.
#[derive(Debug)]
pub(crate) struct LaunchPlan {
    pub emulator: PathBuf,
    pub args: Vec<String>,
    pub exe_name: String,
    pub warnings: Vec<String>,
}

fn launch_emulator_blocking(request: LaunchRequest) -> Result<LaunchResult, String> {
    let plan = plan_launch(&request)?;

    let is_debug = crate::is_debug_mode() || std::env::var("VIC40_DEBUG_LAUNCH").is_ok();
    if is_debug {
        println!("[GameBaseBox Launch] Emulator: {}", plan.emulator.to_string_lossy());
        println!("[GameBaseBox Launch] Switches: {:?}", plan.args);
    }

    let mut cmd = Command::new(&plan.emulator);

    if let Some(parent) = plan.emulator.parent() {
        cmd.current_dir(parent);
    }

    match cmd
        .args(&plan.args)
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
    {
        Ok(_) => Ok(LaunchResult {
            success: true,
            message: {
                let mut message = format!("Launched {} successfully", plan.exe_name);
                for warning in &plan.warnings {
                    message.push_str(&format!("\n{warning}"));
                }
                message
            },
        }),
        Err(e) => Err(format!("Failed to launch emulator: {}", e)),
    }
}

/// Which emulator family the configured binary/profile is. Detection keeps the
/// historical rules: RetroArch by executable name only, the others by profile id or
/// executable name.
#[derive(Debug, Clone, Copy, Default)]
struct EmulatorFamily {
    retroarch: bool,
    altirra: bool,
    spectaculator: bool,
    beebem: bool,
    uae: bool,
    kegs: bool,
    hatari: bool,
    steem: bool,
}

impl EmulatorFamily {
    fn detect(profile_id: Option<&str>, exe_name: &str) -> Self {
        let profile_is = |id: &str| profile_id == Some(id);
        Self {
            retroarch: exe_name.contains("retroarch"),
            altirra: profile_is("altirra-atari800") || exe_name.contains("altirra"),
            spectaculator: profile_is("spectaculator-zxspectrum") || exe_name.contains("spectaculator"),
            beebem: profile_is("beebem-bbcmicro") || exe_name.contains("beebem"),
            uae: profile_is("winuae-amiga")
                || exe_name.contains("winuae")
                || exe_name.contains("fs-uae")
                || exe_name.contains("amiberry"),
            kegs: profile_is("kegs-apple2gs") || exe_name.contains("kegs") || exe_name.contains("gsplus"),
            hatari: profile_is("hatari-atarist") || exe_name.contains("hatari"),
            steem: profile_is("steem-atarist") || exe_name.contains("steem"),
        }
    }

    /// No other family matched: VICE-style command line (-autostart, -ntsc, ...).
    fn is_vice_like(&self) -> bool {
        !(self.retroarch
            || self.altirra
            || self.spectaculator
            || self.beebem
            || self.uae
            || self.kegs
            || self.hatari
            || self.steem)
    }
}

/// The files a launch hands to the emulator: the primary file and, for multi-disk
/// games, every disk in playlist order (Disk 1 / main game first).
struct LaunchMedia {
    primary: PathBuf,
    files: Vec<PathBuf>,
    /// Session directory of an extracted archive; direct launches create one on demand.
    session_dir: Option<PathBuf>,
}

impl LaunchMedia {
    fn session_dir(&self) -> Result<PathBuf, String> {
        match &self.session_dir {
            Some(dir) => Ok(dir.clone()),
            None => create_launch_temp_dir(),
        }
    }
}

/// Extracts a ZIP launch into a session directory and orders its launch files.
fn extract_launch_media(rom: &Path, platform_id: Option<&str>, file_to_run: &str) -> Result<LaunchMedia, String> {
    let (session_dir, mut files) = with_extraction_session(
        &std::env::temp_dir(), DEFAULT_EXTRACTION_LIMITS, |session| {
            let mut extracted = Vec::new();
            let archives = if platform_id == Some("amiga") {
                collect_amiga_sibling_disk_archives(rom)
            } else {
                vec![rom.to_path_buf()]
            };
            for archive in archives {
                extracted.extend(session.extract_archive(&archive, &launch_extensions_for_platform(platform_id))?);
            }
            if extracted.is_empty() {
                return Err(format!(
                    "No compatible {} launch files found inside the ZIP file.",
                    platform_display_name(platform_id)
                ));
            }
            if platform_id == Some("bbcmicro") && extracted.iter().all(|path| {
                let ext = path.extension().and_then(|ext| ext.to_str()).unwrap_or("").to_lowercase();
                matches!(ext.as_str(), "uef" | "csw" | "wav")
            }) {
                if let Some(companion) = find_bbcmicro_companion_disk_archive(rom) {
                    extracted.extend(session.extract_archive(&companion, &["ssd", "dsd", "adl", "adf"])?);
                }
            }
            Ok(extracted)
        },
    )?;

    match platform_id {
        Some("amiga") => files.sort_by_key(|path| amiga_disk_sort_key(path)),
        Some("bbcmicro") => files.sort_by_key(|path| bbcmicro_media_sort_key(path)),
        _ => files.sort_by_key(|path| natural_disk_sort_key(path)),
    }

    let primary = find_matching_primary_rom(&files, file_to_run).unwrap_or_else(|| files[0].clone());
    Ok(LaunchMedia { primary, files, session_dir: Some(session_dir) })
}

fn push_retroarch_core(args: &mut Vec<String>, core_path: Option<&str>) {
    if let Some(core) = core_path.filter(|core| !core.is_empty()) {
        args.push("-L".to_string());
        args.push(core.to_string());
    }
}

fn path_arg(path: &Path) -> String {
    path.to_string_lossy().to_string()
}

/// Content arguments for every emulator family except the Atari ST hard-disk case.
fn push_content_args(
    args: &mut Vec<String>,
    family: EmulatorFamily,
    request: &LaunchRequest,
    emulator: &Path,
    media: &LaunchMedia,
    gemus: &str,
) -> Result<(), String> {
    let platform_id = request.platform_id.as_deref();
    let primary = &media.primary;

    if family.retroarch {
        push_retroarch_core(args, request.core_path.as_deref());
        let system_dir = emulator.parent().map(|parent| parent.join("system"));
        let mame_system_dir = system_dir.as_deref().or_else(|| emulator.parent());
        if platform_id == Some("apple2gs") {
            let cmd = write_mame_apple2gs_cmd(&media.session_dir()?, primary, &media.files, gemus, mame_system_dir)?;
            args.push(path_arg(&cmd));
        } else if platform_id == Some("bbcmicro") {
            if is_retroarch_mame_core(request.core_path.as_deref()) {
                let cmd = write_mame_bbcmicro_cmd(&media.session_dir()?, primary, &media.files, gemus, mame_system_dir)?;
                args.push(path_arg(&cmd));
            } else {
                args.push(path_arg(primary));
            }
        } else if media.files.len() > 1 && !media.files.iter().any(|path| is_amiga_slave(path)) {
            let m3u = write_retroarch_m3u(&media.session_dir()?, primary, &media.files)?;
            args.push(path_arg(&m3u));
        } else {
            args.push(path_arg(primary));
        }
    } else if family.altirra {
        push_altirra_rom_args(args, primary);
    } else if family.uae {
        push_uae_rom_args(args, &media.files);
        push_uae_gemus_args(args, gemus);
    } else if family.kegs {
        prepare_kegs_launch(emulator.parent(), args, &media.files, primary, gemus);
    } else if family.hatari && media.files.len() > 1 {
        args.push("--disk-a".to_string());
        args.push(path_arg(primary));
        if let Some(second) = media.files.iter().find(|path| *path != primary) {
            args.push("--disk-b".to_string());
            args.push(path_arg(second));
        }
    } else if family.spectaculator || family.beebem || family.hatari || family.steem {
        args.push(path_arg(primary));
    } else {
        args.push("-autostart".to_string());
        args.push(path_arg(primary));
        if media.files.len() > 1 {
            let session_dir = media.session_dir()?;
            let fliplist_path = session_dir.join(format!(
                "{}.vfl",
                primary.file_stem().unwrap_or_default().to_string_lossy()
            ));
            let mut fliplist = std::fs::File::create(&fliplist_path)
                .map_err(|error| format!("Failed to create VICE fliplist '{}': {error}", fliplist_path.display()))?;
            write_vice_fliplist(&mut fliplist, &media.files)
                .map_err(|error| format!("Failed to write VICE fliplist '{}': {error}", fliplist_path.display()))?;
            args.push("-flipname".to_string());
            args.push(path_arg(&fliplist_path));
        }
    }
    Ok(())
}

pub(crate) fn plan_launch(request: &LaunchRequest) -> Result<LaunchPlan, String> {
    let platform_id = request.platform_id.as_deref();
    let emulator = resolve_emulator_binary(
        &request.emulator_path,
        request.emulator_profile_id.as_deref(),
        platform_id,
        || {
            format!(
                "{} {} executable path not found: {}",
                platform_display_name(platform_id),
                emulator_profile_display_name(request.emulator_profile_id.as_deref(), false),
                request.emulator_path
            )
        },
    )?;

    let rom = resolve_existing_rom_path(&request.rom_path);
    require_existing_file(
        &rom,
        || format!("ROM file not found: {}", request.rom_path),
        || format!("ROM path is not a file: {}", request.rom_path),
    )?;

    let exe_name = emulator
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_lowercase();
    let family = EmulatorFamily::detect(request.emulator_profile_id.as_deref(), &exe_name);
    let is_retroarch = family.retroarch;

    if is_retroarch {
        if let Some(cp) = &request.core_path {
            if !cp.is_empty() {
                require_existing_file(
                    Path::new(cp),
                    || retroarch_core_not_found_message(platform_id, cp),
                    || retroarch_core_not_file_message(platform_id, cp),
                )?;
            }
        }
    }

    // Region / drive switches come first on the command line.
    let mut args: Vec<String> = Vec::new();
    let is_c64 = platform_id.unwrap_or("c64") == "c64";
    let c64_layers = request.c64.clone().unwrap_or_default();
    let c64_settings = if is_c64 {
        let metadata = if request.game_id.is_some() {
            super::c64::load_metadata(request.game_id.as_deref())
        } else {
            // Keep callers without a database game ID compatible with the legacy API.
            super::c64::Metadata {
                region: if request.is_pal { "P" } else { "N" }.into(),
                true_drive: if request.true_drive_emulation { "1" } else { "0" }.into(),
                ..Default::default()
            }
        };
        Some(super::c64::resolve(&metadata, &c64_layers)?)
    } else { None };
    if let Some(settings) = &c64_settings {
        if !is_retroarch {
            args.extend(super::c64::vice_args(settings, &c64_layers)?);
        }
    } else if family.altirra {
        args.push(if request.is_pal { "/pal" } else { "/ntsc" }.to_string());
    } else if family.is_vice_like() {
        if request.true_drive_emulation {
            args.push("-truedrive".to_string());
        }
        if !request.is_pal {
            args.push("-ntsc".to_string());
        }
    }

    let c64_option_count = args.len();
    let launch_metadata =
        load_game_launch_metadata(request.game_id.as_deref(), request.platform_id.as_deref());

    let is_zip = rom
        .extension()
        .and_then(|e| e.to_str())
        .is_some_and(|extension| extension.eq_ignore_ascii_case("zip"));

    let media = if is_zip {
        extract_launch_media(&rom, platform_id, &launch_metadata.file_to_run)?
    } else {
        LaunchMedia { primary: rom.clone(), files: vec![rom.clone()], session_dir: None }
    };

    let st_hard_disk = if platform_id != Some("atarist") {
        None
    } else if let Some(session_dir) = media.session_dir.as_ref().filter(|_| is_atarist_harddisk_archive(&request.rom_path, &media.files)) {
        let named_dir = session_dir.join(rom.file_stem().and_then(|stem| stem.to_str()).unwrap_or("archive"));
        let drive = if named_dir.exists() { named_dir } else { session_dir.clone() };
        Some(StHardDisk {
            boot_disk: atarist_boot_disk(request)?,
            hatari_drive: drive.clone(),
            retroarch_drive: drive,
            acsi_image: None,
            fallback: media.primary.clone(),
        })
    } else if media.session_dir.is_none() && is_atarist_harddisk_name(&request.rom_path) {
        Some(StHardDisk {
            boot_disk: atarist_boot_disk(request)?,
            hatari_drive: rom.clone(),
            retroarch_drive: if rom.is_dir() { rom.clone() } else { rom.parent().unwrap_or(&rom).to_path_buf() },
            acsi_image: rom.extension().is_some_and(|ext| ext.eq_ignore_ascii_case("hd")).then(|| rom.clone()),
            fallback: rom.clone(),
        })
    } else {
        None
    };

    match &st_hard_disk {
        Some(disk) => push_atarist_harddisk_args(&mut args, family, request, &emulator, disk)?,
        None => push_content_args(&mut args, family, request, &emulator, &media, &launch_metadata.gemus)?,
    }

    if !is_retroarch && c64_settings.is_some() {
        // Validate/extract content before executing the emulator's help probe.
        let content_args = args.split_off(c64_option_count);
        args = super::vice_compat::detect(&emulator)?.launch_args(&emulator, &args)?;
        args.extend(content_args);
    }
    if is_retroarch {
        if let Some(settings) = &c64_settings {
            let content = args.pop().ok_or("C64 launch is missing content")?;
            let session = create_launch_temp_dir()?;
            let (content, fragment) = super::c64::prepare_retroarch(
                &session, &emulator, Path::new(request.core_path.as_deref().unwrap_or("")),
                Path::new(&content), settings, &c64_layers,
            )?;
            if let Some(config) = c64_layers.retroarch_config.as_deref().filter(|config| !config.trim().is_empty()) {
                args.extend(["--config".into(), config.replace('\\', "/")]);
            }
            args.extend([content.to_string_lossy().to_string(), "--appendconfig".into(), fragment.to_string_lossy().to_string()]);
        }
    }

    let is_debug = crate::is_debug_mode() || std::env::var("VIC40_DEBUG_LAUNCH").is_ok();

    if is_retroarch && is_debug {
        if let Some(parent) = emulator.parent() {
            let log_path = parent.join("retroarch_debug.log");
            args.push("--verbose".to_string());
            args.push("--log-file".to_string());
            args.push(log_path.to_string_lossy().to_string());
        }
    }

    Ok(LaunchPlan {
        emulator,
        args,
        exe_name,
        warnings: c64_settings.map(|settings| settings.warnings).unwrap_or_default(),
    })
}
