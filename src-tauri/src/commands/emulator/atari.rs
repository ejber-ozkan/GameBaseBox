//! Atari 8-bit (Altirra arguments) and Atari ST (floppy and hard-disk launches for
//! Hatari, STeem and the RetroArch Hatari core).

use super::{path_arg, push_retroarch_core, EmulatorFamily};
use crate::models::LaunchRequest;
use std::path::{Path, PathBuf};

pub(super) fn push_altirra_rom_args(args: &mut Vec<String>, rom_path: &Path) {
    let ext = rom_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    let rom_str = rom_path.to_string_lossy().to_string();

    match ext.as_str() {
        "atr" | "atx" | "xfd" | "dcm" => {
            args.push("/disk".to_string());
            args.push(rom_str);
        }
        "cas" => {
            args.push("/tape".to_string());
            args.push(rom_str);
            args.push("/casautoboot".to_string());
        }
        "bin" | "car" | "rom" => {
            args.push("/cart".to_string());
            args.push(rom_str);
        }
        "xex" | "com" => {
            args.push("/run".to_string());
            args.push(rom_str);
        }
        "bas" => {
            args.push("/runbas".to_string());
            args.push(rom_str);
        }
        _ => {
            args.push(rom_str);
        }
    }
}

pub(super) fn prepare_retroarch_hatari_harddisk(
    parent: &Path,
    hd_dir: &Path,
    boot_disk: &Path,
) -> Result<PathBuf, String> {
    let system_dir = parent.join("system");
    let hatari_dir = system_dir.join("hatari");
    std::fs::create_dir_all(&hatari_dir).map_err(|e| e.to_string())?;

    // Copy boot.st to all locations searched by hatari libretro core
    let _ = std::fs::copy(boot_disk, hatari_dir.join("BOOT.ST"));
    let _ = std::fs::copy(boot_disk, hatari_dir.join("boot.st"));
    let _ = std::fs::copy(boot_disk, system_dir.join("BOOT.ST"));
    let _ = std::fs::copy(boot_disk, system_dir.join("boot.st"));

    // Write hatari.cfg in both system/hatari and system
    let cfg_content = format!(
        "[HardDisk]\nbUseHardDiskDirectory = TRUE\nbBootFromHardDisk = TRUE\nszHardDiskDirectory = {}\nnGemdosDrive = 0\n\n[Floppy]\nszDiskAFileName = {}\nEnableDriveA = TRUE\nFastBoot = TRUE\n",
        hd_dir.to_string_lossy().replace('\\', "/"),
        boot_disk.to_string_lossy().replace('\\', "/")
    );
    let _ = std::fs::write(hatari_dir.join("hatari.cfg"), &cfg_content);
    let _ = std::fs::write(system_dir.join("hatari.cfg"), &cfg_content);

    // Update retroarch-core-options.cfg and Hatari.opt to enable hatari_autoload_config and hatari_boot_hd
    let options_paths = [
        parent.join("retroarch-core-options.cfg"),
        parent.join("config").join("Hatari").join("Hatari.opt"),
    ];
    for opt_path in &options_paths {
        if opt_path.exists() {
            if let Ok(content) = std::fs::read_to_string(opt_path) {
                let mut lines: Vec<String> = content.lines().map(|s| s.to_string()).collect();
                let mut autoload_found = false;
                let mut boot_hd_found = false;
                for line in &mut lines {
                    if line.trim().starts_with("hatari_autoload_config") {
                        *line = "hatari_autoload_config = \"true\"".to_string();
                        autoload_found = true;
                    } else if line.trim().starts_with("hatari_boot_hd") {
                        *line = "hatari_boot_hd = \"true\"".to_string();
                        boot_hd_found = true;
                    }
                }
                if !autoload_found {
                    lines.push("hatari_autoload_config = \"true\"".to_string());
                }
                if !boot_hd_found {
                    lines.push("hatari_boot_hd = \"true\"".to_string());
                }
                let _ = std::fs::write(opt_path, lines.join("\n"));
            }
        }
    }

    // Create dummy .gem launcher file pointing to hd_dir
    let gem_file = hd_dir.with_extension("gem");
    std::fs::write(&gem_file, b"").map_err(|e| e.to_string())?;

    Ok(gem_file)
}

/// Atari ST hard-disk games boot from a configured boot.st and mount a GEMDOS folder.
pub(super) struct StHardDisk {
    pub(super) boot_disk: PathBuf,
    /// Folder (or image) given to Hatari's --harddrive.
    pub(super) hatari_drive: PathBuf,
    /// Folder the RetroArch Hatari core mounts through a generated .gem file.
    pub(super) retroarch_drive: PathBuf,
    /// A raw ACSI image (`.hd`) launched with Hatari's --acsi instead.
    pub(super) acsi_image: Option<PathBuf>,
    /// What other emulators are given.
    pub(super) fallback: PathBuf,
}

pub(super) fn is_atarist_harddisk_name(rom_path: &str) -> bool {
    let lower = rom_path.to_lowercase();
    lower.contains("harddisk") || lower.contains("hdold") || lower.ends_with(".hd")
}

/// An extracted archive is a hard-disk game when it is named like one, or when it has
/// no floppy images but has TOS programs or a DESKTOP.INF.
pub(super) fn is_atarist_harddisk_archive(rom_path: &str, files: &[PathBuf]) -> bool {
    let extension = |path: &PathBuf| path.extension().unwrap_or_default().to_string_lossy().to_lowercase();
    is_atarist_harddisk_name(rom_path)
        || (!files.iter().any(|path| matches!(extension(path).as_str(), "st" | "msa" | "stx" | "dim" | "ipf"))
            && files.iter().any(|path| {
                matches!(extension(path).as_str(), "tos" | "prg")
                    || path.file_name().unwrap_or_default().to_string_lossy().eq_ignore_ascii_case("desktop.inf")
            }))
}

pub(super) fn atarist_boot_disk(request: &LaunchRequest) -> Result<PathBuf, String> {
    match &request.boot_disk_path {
        Some(path) if !path.trim().is_empty() => {
            let boot_disk = PathBuf::from(path.trim().trim_matches('"').trim_matches('\''));
            if !boot_disk.exists() {
                return Err(format!("Atari ST boot disk file not found: {}", path));
            }
            Ok(boot_disk)
        }
        _ => Err("HardDisk games require a boot disk (boot.st). Please configure the boot.st path in Atari ST Settings.".to_string()),
    }
}

pub(super) fn push_atarist_harddisk_args(
    args: &mut Vec<String>,
    family: EmulatorFamily,
    request: &LaunchRequest,
    emulator: &Path,
    disk: &StHardDisk,
) -> Result<(), String> {
    // Hatari is checked before RetroArch here, unlike the general dispatch.
    if family.hatari {
        if let Some(image) = &disk.acsi_image {
            args.push("--acsi".to_string());
            args.push(path_arg(image));
        } else {
            args.push("--disk-a".to_string());
            args.push(path_arg(&disk.boot_disk));
            args.push("--harddrive".to_string());
            args.push(path_arg(&disk.hatari_drive));
            args.push("--boot-hd".to_string());
            args.push("yes".to_string());
        }
    } else if family.retroarch {
        push_retroarch_core(args, request.core_path.as_deref());
        let gem_file = match emulator.parent() {
            Some(parent) => prepare_retroarch_hatari_harddisk(parent, &disk.retroarch_drive, &disk.boot_disk)?,
            None => {
                let gem_file = disk.retroarch_drive.with_extension("gem");
                let _ = std::fs::write(&gem_file, b"");
                gem_file
            }
        };
        args.push(path_arg(&gem_file));
    } else if family.steem {
        args.push(path_arg(&disk.boot_disk));
    } else {
        args.push(path_arg(&disk.fallback));
    }
    Ok(())
}
