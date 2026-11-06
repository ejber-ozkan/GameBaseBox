//! Atari 8-bit (Altirra arguments) and Atari ST (RetroArch Hatari hard-disk setup).

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
