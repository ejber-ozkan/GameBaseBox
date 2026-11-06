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
    let is_retroarch = exe_name.contains("retroarch");
    let is_altirra = request
        .emulator_profile_id
        .as_deref()
        .is_some_and(|profile_id| profile_id == "altirra-atari800")
        || exe_name.contains("altirra");
    let is_spectaculator = request
        .emulator_profile_id
        .as_deref()
        .is_some_and(|profile_id| profile_id == "spectaculator-zxspectrum")
        || exe_name.contains("spectaculator");
    let is_beebem = request
        .emulator_profile_id
        .as_deref()
        .is_some_and(|profile_id| profile_id == "beebem-bbcmicro")
        || exe_name.contains("beebem");
    let is_uae = request
        .emulator_profile_id
        .as_deref()
        .is_some_and(|profile_id| profile_id == "winuae-amiga")
        || exe_name.contains("winuae")
        || exe_name.contains("fs-uae")
        || exe_name.contains("amiberry");
    let is_kegs = request
        .emulator_profile_id
        .as_deref()
        .is_some_and(|profile_id| profile_id == "kegs-apple2gs")
        || exe_name.contains("kegs")
        || exe_name.contains("gsplus");
    let is_hatari = request
        .emulator_profile_id
        .as_deref()
        .is_some_and(|profile_id| profile_id == "hatari-atarist")
        || exe_name.contains("hatari");
    let is_steem = request
        .emulator_profile_id
        .as_deref()
        .is_some_and(|profile_id| profile_id == "steem-atarist")
        || exe_name.contains("steem");

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
    } else if is_altirra {
        if request.is_pal {
            args.push("/pal".to_string());
        } else {
            args.push("/ntsc".to_string());
        }
    } else if !is_retroarch && !is_spectaculator && !is_beebem && !is_uae && !is_kegs && !is_hatari && !is_steem {
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
    let file_to_run = launch_metadata.file_to_run.clone();

    let is_zip = rom
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase()
        == "zip";

    if is_zip {
        let (temp_dir, mut extracted_roms) = with_extraction_session(
            &std::env::temp_dir(), DEFAULT_EXTRACTION_LIMITS, |session| {
                let mut extracted_roms = Vec::new();
                let zip_archives = if platform_id == Some("amiga") {
                    collect_amiga_sibling_disk_archives(&rom)
                } else {
                    vec![rom.clone()]
                };
                for archive_path in zip_archives {
                    extracted_roms.extend(session.extract_archive(&archive_path, &launch_extensions_for_platform(platform_id))?);
                }
                if extracted_roms.is_empty() {
                    return Err(format!(
                        "No compatible {} launch files found inside the ZIP file.",
                        platform_display_name(platform_id)
                    ));
                }
                if platform_id == Some("bbcmicro") && extracted_roms.iter().all(|path| {
                    let ext = path.extension().and_then(|ext| ext.to_str()).unwrap_or("").to_lowercase();
                    matches!(ext.as_str(), "uef" | "csw" | "wav")
                }) {
                    if let Some(companion) = find_bbcmicro_companion_disk_archive(&rom) {
                        extracted_roms.extend(session.extract_archive(&companion, &["ssd", "dsd", "adl", "adf"])?);
                    }
                }
                Ok(extracted_roms)
            },
        )?;

        if platform_id == Some("amiga") {
            extracted_roms.sort_by_key(|path| amiga_disk_sort_key(path));
        } else if platform_id == Some("bbcmicro") {
            extracted_roms.sort_by_key(|path| bbcmicro_media_sort_key(path));
        } else {
            extracted_roms.sort_by_key(|path| natural_disk_sort_key(path));
        }

        let resolved_primary_rom = find_matching_primary_rom(&extracted_roms, &file_to_run)
            .unwrap_or_else(|| extracted_roms.first().unwrap().clone());

        let is_harddisk_atarist = platform_id == Some("atarist")
            && (request.rom_path.to_lowercase().contains("harddisk")
                || request.rom_path.to_lowercase().contains("hdold")
                || request.rom_path.to_lowercase().ends_with(".hd")
                || (!extracted_roms.iter().any(|r| {
                    let ext = r.extension().unwrap_or_default().to_string_lossy().to_lowercase();
                    matches!(ext.as_str(), "st" | "msa" | "stx" | "dim" | "ipf")
                }) && extracted_roms.iter().any(|r| {
                    let ext = r.extension().unwrap_or_default().to_string_lossy().to_lowercase();
                    matches!(ext.as_str(), "tos" | "prg")
                        || r.file_name().unwrap_or_default().to_string_lossy().eq_ignore_ascii_case("desktop.inf")
                })));

        if is_harddisk_atarist {
            let boot_disk = match &request.boot_disk_path {
                Some(path) if !path.trim().is_empty() => {
                    let p = PathBuf::from(path.trim().trim_matches('"').trim_matches('\''));
                    if !p.exists() {
                        return Err(format!("Atari ST boot disk file not found: {}", path));
                    }
                    p
                }
                _ => {
                    return Err("HardDisk games require a boot disk (boot.st). Please configure the boot.st path in Atari ST Settings.".to_string());
                }
            };

            let primary_extract_dir = temp_dir.join(
                rom.file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("archive"),
            );
            let hd_dir = if primary_extract_dir.exists() {
                &primary_extract_dir
            } else {
                &temp_dir
            };

            if is_hatari {
                args.push("--disk-a".to_string());
                args.push(boot_disk.to_string_lossy().to_string());
                args.push("--harddrive".to_string());
                args.push(hd_dir.to_string_lossy().to_string());
                args.push("--boot-hd".to_string());
                args.push("yes".to_string());
            } else if is_retroarch {
                if let Some(cp) = &request.core_path {
                    if !cp.is_empty() {
                        args.push("-L".to_string());
                        args.push(cp.clone());
                    }
                }
                if let Some(parent) = emulator.parent() {
                    let gem_file = prepare_retroarch_hatari_harddisk(parent, hd_dir, &boot_disk)?;
                    args.push(gem_file.to_string_lossy().to_string());
                } else {
                    let gem_file = hd_dir.with_extension("gem");
                    let _ = std::fs::write(&gem_file, b"");
                    args.push(gem_file.to_string_lossy().to_string());
                }
            } else if is_steem {
                args.push(boot_disk.to_string_lossy().to_string());
            } else {
                args.push(resolved_primary_rom.to_string_lossy().to_string());
            }
        } else if is_retroarch {
            if let Some(cp) = &request.core_path {
                if !cp.is_empty() {
                    args.push("-L".to_string());
                    args.push(cp.clone());
                }
            }
            if platform_id == Some("apple2gs") {
                let system_dir = emulator.parent().map(|p| p.join("system"));
                let cmd_path = write_mame_apple2gs_cmd(
                    &temp_dir,
                    &resolved_primary_rom,
                    &extracted_roms,
                    &launch_metadata.gemus,
                    system_dir.as_deref().or_else(|| emulator.parent()),
                )?;
                args.push(cmd_path.to_string_lossy().to_string());
            } else if platform_id == Some("bbcmicro") {
                if is_retroarch_mame_core(request.core_path.as_deref()) {
                    let system_dir = emulator.parent().map(|p| p.join("system"));
                    let cmd_path = write_mame_bbcmicro_cmd(
                        &temp_dir,
                        &resolved_primary_rom,
                        &extracted_roms,
                        &launch_metadata.gemus,
                        system_dir.as_deref().or_else(|| emulator.parent()),
                    )?;
                    args.push(cmd_path.to_string_lossy().to_string());
                } else {
                    args.push(resolved_primary_rom.to_string_lossy().to_string());
                }
            } else if extracted_roms.len() > 1 && !extracted_roms.iter().any(|p| is_amiga_slave(p)) {
                let m3u_path =
                    write_retroarch_m3u(&temp_dir, &resolved_primary_rom, &extracted_roms)?;
                args.push(m3u_path.to_string_lossy().to_string());
            } else {
                args.push(resolved_primary_rom.to_string_lossy().to_string());
            }
        } else if is_altirra {
            push_altirra_rom_args(&mut args, &resolved_primary_rom);
        } else if is_uae {
            push_uae_rom_args(&mut args, &extracted_roms);
            push_uae_gemus_args(&mut args, &launch_metadata.gemus);
        } else if is_kegs {
            prepare_kegs_launch(
                emulator.parent(),
                &mut args,
                &extracted_roms,
                &resolved_primary_rom,
                &launch_metadata.gemus,
            );
        } else if is_spectaculator || is_beebem {
            args.push(resolved_primary_rom.to_string_lossy().to_string());
        } else if is_hatari {
            if extracted_roms.len() > 1 {
                args.push("--disk-a".to_string());
                args.push(resolved_primary_rom.to_string_lossy().to_string());
                if let Some(second) = extracted_roms.iter().find(|p| **p != resolved_primary_rom) {
                    args.push("--disk-b".to_string());
                    args.push(second.to_string_lossy().to_string());
                }
            } else {
                args.push(resolved_primary_rom.to_string_lossy().to_string());
            }
        } else if is_steem {
            args.push(resolved_primary_rom.to_string_lossy().to_string());
        } else {
            args.push("-autostart".to_string());
            args.push(resolved_primary_rom.to_string_lossy().to_string());
            if extracted_roms.len() > 1 {
                let fliplist_path = temp_dir.join(format!(
                    "{}.vfl",
                    resolved_primary_rom
                        .file_stem()
                        .unwrap_or_default()
                        .to_string_lossy()
                ));
                let mut fliplist =
                    std::fs::File::create(&fliplist_path).map_err(|error| format!("Failed to create VICE fliplist '{}': {error}", fliplist_path.display()))?;
                write_vice_fliplist(&mut fliplist, &extracted_roms)
                    .map_err(|error| format!("Failed to write VICE fliplist '{}': {error}", fliplist_path.display()))?;
                args.push("-flipname".to_string());
                args.push(fliplist_path.to_string_lossy().to_string());
            }
        }
    } else {
        let is_harddisk_atarist = platform_id == Some("atarist")
            && (request.rom_path.to_lowercase().contains("harddisk")
                || request.rom_path.to_lowercase().contains("hdold")
                || request.rom_path.to_lowercase().ends_with(".hd"));

        if is_harddisk_atarist {
            let boot_disk = match &request.boot_disk_path {
                Some(path) if !path.trim().is_empty() => {
                    let p = PathBuf::from(path.trim().trim_matches('"').trim_matches('\''));
                    if !p.exists() {
                        return Err(format!("Atari ST boot disk file not found: {}", path));
                    }
                    p
                }
                _ => {
                    return Err("HardDisk games require a boot disk (boot.st). Please configure the boot.st path in Atari ST Settings.".to_string());
                }
            };

            if is_hatari {
                if rom.extension().is_some_and(|e| e.eq_ignore_ascii_case("hd")) {
                    args.push("--acsi".to_string());
                    args.push(rom.to_string_lossy().to_string());
                } else {
                    args.push("--disk-a".to_string());
                    args.push(boot_disk.to_string_lossy().to_string());
                    args.push("--harddrive".to_string());
                    args.push(rom.to_string_lossy().to_string());
                    args.push("--boot-hd".to_string());
                    args.push("yes".to_string());
                }
            } else if is_retroarch {
                if let Some(cp) = &request.core_path {
                    if !cp.is_empty() {
                        args.push("-L".to_string());
                        args.push(cp.clone());
                    }
                }
                let hd_dir = if rom.is_dir() {
                    &rom
                } else {
                    rom.parent().unwrap_or(&rom)
                };
                if let Some(parent) = emulator.parent() {
                    let gem_file = prepare_retroarch_hatari_harddisk(parent, hd_dir, &boot_disk)?;
                    args.push(gem_file.to_string_lossy().to_string());
                } else {
                    let gem_file = hd_dir.with_extension("gem");
                    let _ = std::fs::write(&gem_file, b"");
                    args.push(gem_file.to_string_lossy().to_string());
                }
            } else if is_steem {
                args.push(boot_disk.to_string_lossy().to_string());
            } else {
                args.push(rom.to_string_lossy().to_string());
            }
        } else if is_retroarch {
            if let Some(cp) = &request.core_path {
                if !cp.is_empty() {
                    args.push("-L".to_string());
                    args.push(cp.clone());
                }
            }
            if platform_id == Some("apple2gs") {
                let temp_dir = create_launch_temp_dir()?;
                let system_dir = emulator.parent().map(|p| p.join("system"));
                let cmd_path = write_mame_apple2gs_cmd(
                    &temp_dir,
                    &rom,
                    &[rom.clone()],
                    &launch_metadata.gemus,
                    system_dir.as_deref().or_else(|| emulator.parent()),
                )?;
                args.push(cmd_path.to_string_lossy().to_string());
            } else if platform_id == Some("bbcmicro") {
                if is_retroarch_mame_core(request.core_path.as_deref()) {
                    let temp_dir = create_launch_temp_dir()?;
                    let system_dir = emulator.parent().map(|p| p.join("system"));
                    let cmd_path = write_mame_bbcmicro_cmd(
                        &temp_dir,
                        &rom,
                        &[rom.clone()],
                        &launch_metadata.gemus,
                        system_dir.as_deref().or_else(|| emulator.parent()),
                    )?;
                    args.push(cmd_path.to_string_lossy().to_string());
                } else {
                    args.push(rom.to_string_lossy().to_string());
                }
            } else {
                args.push(rom.to_string_lossy().to_string());
            }
        } else if is_altirra {
            push_altirra_rom_args(&mut args, &rom);
        } else if is_uae {
            push_uae_rom_args(&mut args, &[rom]);
            push_uae_gemus_args(&mut args, &launch_metadata.gemus);
        } else if is_kegs {
            prepare_kegs_launch(
                emulator.parent(),
                &mut args,
                &[rom.clone()],
                &rom,
                &launch_metadata.gemus,
            );
        } else if is_spectaculator || is_beebem || is_hatari || is_steem {
            args.push(rom.to_string_lossy().to_string());
        } else {
            args.push("-autostart".to_string());
            args.push(rom.to_string_lossy().to_string());
        }
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
