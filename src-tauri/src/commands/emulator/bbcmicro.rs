//! Acorn BBC Micro: disk/tape ordering, companion disk archives and RetroArch MAME
//! launcher (.cmd) files.

use std::path::{Path, PathBuf};

pub(super) fn bbcmicro_media_sort_key(path: &Path) -> (u32, u32, String) {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    let name = path
        .file_stem()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_lowercase();

    // Prioritize formats:
    // 0: Standard DFS floppy disks (ssd, dsd)
    // 1: ADFS disks (adl, adf, img)
    // 2: Cassette tape images (uef, csw, wav)
    // 3: Cartridges / ROMs (rom, bin)
    // 4: Other
    let ext_priority = match ext.as_str() {
        "ssd" | "dsd" => 0,
        "adl" | "adf" | "img" => 1,
        "uef" | "csw" | "wav" => 2,
        "rom" | "bin" => 3,
        _ => 4,
    };

    let is_secondary = name.contains("save")
        || name.contains("data")
        || name.contains("side 2")
        || name.contains("side_2")
        || name.contains("side2")
        || name.contains("disk 2")
        || name.contains("disk_2")
        || name.contains("disk2");
    let secondary_penalty = if is_secondary { 1 } else { 0 };

    let mut disk_num = 1u32;
    for token in ["disk ", "disk_", "disk", "d", "side ", "side_", "side"] {
        if let Some((_, rest)) = name.rsplit_once(token) {
            let num_str: String = rest.chars().take_while(|c| c.is_ascii_digit()).collect();
            if let Ok(n) = num_str.parse::<u32>() {
                disk_num = n;
                break;
            }
        }
    }

    (ext_priority * 10 + secondary_penalty, disk_num, name)
}

pub(super) fn find_bbcmicro_companion_disk_archive(rom_path: &Path) -> Option<PathBuf> {
    let normalized = rom_path.to_string_lossy().replace('\\', "/");
    let (base, rest) = normalized.split_once("/Games/")?;
    let stem = Path::new(rest).file_stem()?.to_str()?;

    // 1. Direct match in Extras/Disks/<rest>
    let candidate1 = PathBuf::from(format!("{base}/Extras/Disks/{rest}"));
    if candidate1.exists() {
        return Some(candidate1);
    }

    // 2. Cleaned _RUN match in Extras/Disks/<dir_prefix>/<cleaned_stem>.zip
    let cleaned_stem = stem.replace("_RUN_", "_").replace("_RUN", "");
    if let Some((dir_prefix, _)) = rest.rsplit_once('/') {
        let candidate2 = PathBuf::from(format!("{base}/Extras/Disks/{dir_prefix}/{cleaned_stem}.zip"));
        if candidate2.exists() {
            return Some(candidate2);
        }
    } else {
        let candidate2 = PathBuf::from(format!("{base}/Extras/Disks/{cleaned_stem}.zip"));
        if candidate2.exists() {
            return Some(candidate2);
        }
    }

    // 3. Haven Disks match in Extras/Haven Disks/<snake_stem>.zip
    let snake_stem = cleaned_stem.to_lowercase().replace('-', "_");
    let candidate3 = PathBuf::from(format!("{base}/Extras/Haven Disks/{snake_stem}.zip"));
    if candidate3.exists() {
        return Some(candidate3);
    }

    None
}

pub(super) fn is_retroarch_mame_core(core_path: Option<&str>) -> bool {
    core_path
        .map(|c| {
            let cl = c.to_lowercase();
            cl.contains("mame") || cl.contains("mess")
        })
        .unwrap_or(false)
}

pub(super) fn get_bbcmicro_disk_boot_command(disk_path: &Path, is_disk_cat: bool) -> String {
    if is_disk_cat {
        return "*CAT\\n".to_string();
    }
    // Read DFS sector 1 byte 6 (offset 262)
    if let Ok(mut file) = std::fs::File::open(disk_path) {
        use std::io::Read;
        let mut buf = [0u8; 512];
        if file.read_exact(&mut buf).is_ok() {
            let opt = (buf[262] >> 4) & 3;
            // Check if $.!BOOT exists
            let num_files = (buf[261] / 8) as usize;
            let has_boot = (0..num_files).any(|i| {
                let entry = &buf[8 + i * 8..8 + (i + 1) * 8];
                let name = std::str::from_utf8(&entry[..7]).unwrap_or("");
                name.trim().eq_ignore_ascii_case("!BOOT")
            });

            if has_boot {
                match opt {
                    2 => return "*RUN !BOOT\\n".to_string(),
                    1 => return "*LOAD !BOOT\\n".to_string(),
                    _ => return "*EXEC !BOOT\\n".to_string(),
                }
            }
        }
    }

    "*EXEC !BOOT\\n".to_string()
}

pub(super) fn write_mame_bbcmicro_cmd(
    temp_dir: &Path,
    primary_rom: &Path,
    rom_files: &[PathBuf],
    gemus: &str,
    system_dir: Option<&Path>,
) -> Result<PathBuf, String> {
    let primary_str = primary_rom.to_string_lossy().replace('\\', "/");
    let secondary = rom_files.iter().find(|f| *f != primary_rom);

    // Parse GEMUS for machine model and disk commands
    let mut is_electron = false;
    let mut model: Option<&str> = None;
    let mut is_disk_cat = false;

    for line in gemus.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("emu=") {
            let val = trimmed.trim_start_matches("emu=").trim();
            if val.eq_ignore_ascii_case("ElectrEm") || val.eq_ignore_ascii_case("Elkulator") {
                is_electron = true;
            }
        } else if trimmed.starts_with("model=") {
            model = Some(trimmed.trim_start_matches("model=").trim());
        } else if trimmed.starts_with("disk=") {
            let val = trimmed.trim_start_matches("disk=").trim();
            if val.eq_ignore_ascii_case("cat") {
                is_disk_cat = true;
            }
        }
    }

    let ext = primary_rom
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or_default()
        .to_lowercase();
    let is_tape = matches!(ext.as_str(), "uef" | "csw" | "wav");
    let is_cart = matches!(ext.as_str(), "rom" | "bin");

    let machine = if is_electron {
        "electron"
    } else {
        match model {
            Some("05") | Some("06") => "bbcm",
            Some("04") => "bbcbp",
            _ => "bbcb",
        }
    };

    let mut cmd_line = format!("{}", machine);

    if let Some(sys) = system_dir {
        let sys_lossy = sys.to_string_lossy().replace('\\', "/");
        let mame_dir = sys.join("mame");
        let mame_roms = sys.join("mame").join("roms");
        let sys_roms = sys.join("roms");
        let mut paths = vec![sys_lossy];
        if mame_dir.exists() {
            paths.push(mame_dir.to_string_lossy().replace('\\', "/"));
        }
        if mame_roms.exists() {
            paths.push(mame_roms.to_string_lossy().replace('\\', "/"));
        }
        if sys_roms.exists() {
            paths.push(sys_roms.to_string_lossy().replace('\\', "/"));
        }
        let separator = if cfg!(windows) { ";" } else { ":" };
        cmd_line.push_str(&format!(" -rompath \"{}\"", paths.join(separator)));
    }

    if is_tape {
        cmd_line.push_str(" -autoboot_delay 2");
        if is_electron {
            cmd_line.push_str(" -autoboot_command \"*TAPE\\n*RUN\\n\"");
        } else {
            cmd_line.push_str(" -autoboot_command \"*TAPE\\nPAGE=&E00\\n*RUN\\n\"");
        }
        cmd_line.push_str(&format!(" -cass \"{}\"", primary_str));
    } else if is_cart {
        cmd_line.push_str(&format!(" -cart1 \"{}\"", primary_str));
    } else {
        // Floppy disk (ssd, dsd, adl, adf, img)
        let boot_cmd = get_bbcmicro_disk_boot_command(primary_rom, is_disk_cat);
        cmd_line.push_str(" -autoboot_delay 2");
        cmd_line.push_str(&format!(" -autoboot_command \"{}\"", boot_cmd));
        cmd_line.push_str(&format!(" -flop1 \"{}\"", primary_str));
        if let Some(sec) = secondary {
            let sec_str = sec.to_string_lossy().replace('\\', "/");
            cmd_line.push_str(&format!(" -flop2 \"{}\"", sec_str));
        }
    }

    let cmd_file_path = temp_dir.join(format!(
        "{}.cmd",
        primary_rom
            .file_stem()
            .unwrap_or_default()
            .to_string_lossy()
    ));

    std::fs::write(&cmd_file_path, &cmd_line).map_err(|e| e.to_string())?;
    Ok(cmd_file_path)
}
