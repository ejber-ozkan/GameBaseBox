//! Apple IIGS: standalone KEGS (config.kegs, slot 5/6/7 mounts, system boot disks for
//! non-bootable games) and RetroArch MAME launcher (.cmd) files for apple2gs/apple2gsr1.

use std::path::{Path, PathBuf};

pub(super) fn is_apple_525_disk(path: &Path) -> bool {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    match ext.as_str() {
        "nib" | "woz" | "do" => true,
        "dsk" => {
            // Standard 5.25" Apple II disk is ~140KB. If file size <= 200KB, treat as 5.25"
            std::fs::metadata(path)
                .map(|m| m.len() <= 200 * 1024)
                .unwrap_or(true)
        }
        _ => false,
    }
}

pub(super) fn is_kegs_hard_drive_image(path: &Path) -> bool {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    if ext == "hdv" {
        return true;
    }
    std::fs::metadata(path)
        .map(|m| m.len() > 2 * 1024 * 1024)
        .unwrap_or(false)
}

pub(super) fn find_kegs_boot_disk(
    emulator_dir: &Path,
    gemus_rom_version: Option<&str>,
) -> Option<PathBuf> {
    let is_rom1 = gemus_rom_version == Some("1");
    let preferred_names: &[&str] = if is_rom1 {
        &[
            "system5.2mg",
            "system5.hdv",
            "system504.2mg",
            "system504.hdv",
            "system6.2mg",
            "system6.hdv",
            "prod 16v1_6.2mg",
            "prod16.2mg",
            "prodos16.2mg",
            "prodos.2mg",
            "boot.2mg",
            "boot.hdv",
            "nucleus01.gz",
            "nucleus01.hdv",
            "nucleus01.2mg",
            "nucleus03.gz",
            "nucleus03.hdv",
        ]
    } else {
        &[
            "system6.2mg",
            "system6.hdv",
            "system601.2mg",
            "system601.hdv",
            "system604.2mg",
            "system604.hdv",
            "system5.2mg",
            "system5.hdv",
            "prod 16v1_6.2mg",
            "prod16.2mg",
            "prodos16.2mg",
            "prodos.2mg",
            "boot.2mg",
            "boot.hdv",
            "nucleus03.gz",
            "nucleus03.hdv",
            "nucleus03.2mg",
            "nucleus01.gz",
            "nucleus01.hdv",
        ]
    };

    if let Ok(entries) = std::fs::read_dir(emulator_dir) {
        let files: Vec<PathBuf> = entries.filter_map(Result::ok).map(|e| e.path()).collect();
        for name in preferred_names {
            if let Some(found) = files.iter().find(|p| {
                p.file_name()
                    .and_then(|n| n.to_str())
                    .is_some_and(|n| n.eq_ignore_ascii_case(name))
            }) {
                return Some(found.clone());
            }
        }
        for file in files {
            if let Some(stem) = file.file_stem().and_then(|s| s.to_str()) {
                let lower = stem.to_lowercase();
                if lower.contains("system") || lower.contains("prod") || lower.contains("nucleus") {
                    let ext = file
                        .extension()
                        .and_then(|e| e.to_str())
                        .unwrap_or("")
                        .to_lowercase();
                    if ["2mg", "hdv", "po", "dsk", "gz"].contains(&ext.as_str()) {
                        return Some(file);
                    }
                }
            }
        }
    }

    for name in preferred_names {
        let candidate = emulator_dir.join(name);
        if candidate.exists() && candidate.is_file() {
            return Some(candidate);
        }
    }

    None
}

pub(super) fn is_apple_disk_self_bootable(path: &Path) -> bool {
    let Ok(data) = std::fs::read(path) else {
        return true;
    };
    if data.len() < 2048 {
        return true;
    }

    let mut data_offset = 0;
    if data.starts_with(b"2IMG") && data.len() >= 0x1c {
        data_offset = u32::from_le_bytes([data[0x18], data[0x19], data[0x1a], data[0x1b]]) as usize;
    }

    // ProDOS volume root directory is at Block 2 (1024 bytes from data_offset)
    let root_offset = data_offset + 1024;
    if data.len() >= root_offset + 1024 {
        let root_dir = &data[root_offset..root_offset + 1024];
        // If "PRODOS" or "SOS" is found in the root directory, it has the system kernel and is bootable
        return root_dir
            .windows(6)
            .any(|w| w.eq_ignore_ascii_case(b"PRODOS"))
            || root_dir.windows(3).any(|w| w.eq_ignore_ascii_case(b"SOS"));
    }

    true
}

pub(super) fn prepare_kegs_launch(
    emulator_dir: Option<&Path>,
    args: &mut Vec<String>,
    rom_files: &[PathBuf],
    primary_rom: &Path,
    gemus: &str,
) {
    let is_525 = is_apple_525_disk(primary_rom);
    let primary_str = primary_rom.to_string_lossy().to_string();
    let secondary_str = rom_files
        .iter()
        .find(|f| *f != primary_rom)
        .map(|f| f.to_string_lossy().to_string());

    // Check GEMUS for boot=no and rom=...
    let mut is_boot_no = false;
    let mut gemus_rom_version: Option<&str> = None;
    for line in gemus.lines() {
        let trimmed = line.trim();
        if let Some((k, v)) = trimmed.split_once('=') {
            let key = k.trim();
            let val = v.trim();
            if key.eq_ignore_ascii_case("boot") && val.eq_ignore_ascii_case("no") {
                is_boot_no = true;
            } else if key.eq_ignore_ascii_case("rom") {
                gemus_rom_version = Some(val);
            }
        }
    }

    let needs_boot_disk = is_boot_no || (!is_525 && !is_apple_disk_self_bootable(primary_rom));

    let boot_disk = if needs_boot_disk {
        emulator_dir.and_then(|dir| find_kegs_boot_disk(dir, gemus_rom_version))
    } else {
        None
    };

    let (s5d1_disk, s5d2_disk, s6d1_disk, s6d2_disk, s7d1_disk) = if let Some(ref boot) = boot_disk
    {
        if is_kegs_hard_drive_image(boot) {
            // Hard drive boot image: goes into s7d1, game goes into primary floppy slot
            let s5_1 = if !is_525 {
                Some(primary_str.clone())
            } else {
                None
            };
            let s5_2 = if !is_525 { secondary_str.clone() } else { None };
            let s6_1 = if is_525 {
                Some(primary_str.clone())
            } else {
                None
            };
            let s6_2 = if is_525 { secondary_str.clone() } else { None };
            (
                s5_1,
                s5_2,
                s6_1,
                s6_2,
                Some(boot.to_string_lossy().to_string()),
            )
        } else {
            // Floppy boot disk (e.g. system5.2mg, prod 16v1_6.2mg):
            // Boot floppy goes into s5d1, game disk goes into s5d2 (or s6d1 for 5.25" game)
            let s5_1 = Some(boot.to_string_lossy().to_string());
            let s5_2 = if !is_525 {
                Some(primary_str.clone())
            } else {
                None
            };
            let s6_1 = if is_525 {
                Some(primary_str.clone())
            } else {
                None
            };
            let s6_2 = if is_525 { secondary_str.clone() } else { None };
            (s5_1, s5_2, s6_1, s6_2, None)
        }
    } else {
        // Standard game: game goes into s5d1 or s6d1, s7d1 is cleared
        let s5_1 = if !is_525 {
            Some(primary_str.clone())
        } else {
            None
        };
        let s5_2 = if !is_525 { secondary_str.clone() } else { None };
        let s6_1 = if is_525 {
            Some(primary_str.clone())
        } else {
            None
        };
        let s6_2 = if is_525 { secondary_str.clone() } else { None };
        (s5_1, s5_2, s6_1, s6_2, None)
    };

    // 1. Add command line switches (supported by KEGS 1.33+ and GSplus)
    if let Some(ref d) = s5d1_disk {
        args.push(format!("-s5d1={}", d));
    } else {
        args.push("-s5d1=".to_string());
    }
    if let Some(ref d) = s5d2_disk {
        args.push(format!("-s5d2={}", d));
    } else {
        args.push("-s5d2=".to_string());
    }
    if let Some(ref d) = s6d1_disk {
        args.push(format!("-s6d1={}", d));
    } else {
        args.push("-s6d1=".to_string());
    }
    if let Some(ref d) = s6d2_disk {
        args.push(format!("-s6d2={}", d));
    } else {
        args.push("-s6d2=".to_string());
    }
    if let Some(ref d) = s7d1_disk {
        args.push(format!("-s7d1={}", d));
    } else {
        args.push("-s7d1=".to_string());
    }

    // 2. Also update / write config.kegs in emulator directory for compatibility with KEGS 0.91/Win32
    if let Some(dir) = emulator_dir {
        let config_path = dir.join("config.kegs");
        let mut lines: Vec<String> = if config_path.exists() {
            std::fs::read_to_string(&config_path)
                .unwrap_or_default()
                .lines()
                .map(|s| s.to_string())
                .collect()
        } else {
            Vec::new()
        };

        let mut set_s5d1 = false;
        let mut set_s5d2 = false;
        let mut set_s6d1 = false;
        let mut set_s6d2 = false;
        let mut set_s7d1 = false;
        let mut set_rom_ver = false;

        for line in lines.iter_mut() {
            let trimmed = line.trim();
            let lower = trimmed.to_lowercase();
            if lower.starts_with("s5d1 ") || lower.starts_with("s5d1=") || lower == "s5d1" {
                *line = format!("s5d1 = {}", s5d1_disk.as_deref().unwrap_or(""));
                set_s5d1 = true;
            } else if lower.starts_with("s5d2 ") || lower.starts_with("s5d2=") || lower == "s5d2" {
                *line = format!("s5d2 = {}", s5d2_disk.as_deref().unwrap_or(""));
                set_s5d2 = true;
            } else if lower.starts_with("s6d1 ") || lower.starts_with("s6d1=") || lower == "s6d1" {
                *line = format!("s6d1 = {}", s6d1_disk.as_deref().unwrap_or(""));
                set_s6d1 = true;
            } else if lower.starts_with("s6d2 ") || lower.starts_with("s6d2=") || lower == "s6d2" {
                *line = format!("s6d2 = {}", s6d2_disk.as_deref().unwrap_or(""));
                set_s6d2 = true;
            } else if lower.starts_with("s7d1 ") || lower.starts_with("s7d1=") || lower == "s7d1" {
                *line = format!("s7d1 = {}", s7d1_disk.as_deref().unwrap_or(""));
                set_s7d1 = true;
            } else if lower.starts_with("s7d") {
                let slot_name = lower
                    .split_whitespace()
                    .next()
                    .unwrap_or("s7d2")
                    .split('=')
                    .next()
                    .unwrap_or("s7d2");
                *line = format!("{} = ", slot_name);
            } else if lower.starts_with("g_rom_version") {
                if let Some(rom_ver) = gemus_rom_version {
                    *line = format!("g_rom_version = {}", rom_ver);
                    set_rom_ver = true;
                }
            }
        }

        if !set_s5d1 {
            lines.push(format!("s5d1 = {}", s5d1_disk.as_deref().unwrap_or("")));
        }
        if !set_s5d2 {
            lines.push(format!("s5d2 = {}", s5d2_disk.as_deref().unwrap_or("")));
        }
        if !set_s6d1 {
            lines.push(format!("s6d1 = {}", s6d1_disk.as_deref().unwrap_or("")));
        }
        if !set_s6d2 {
            lines.push(format!("s6d2 = {}", s6d2_disk.as_deref().unwrap_or("")));
        }
        if !set_s7d1 {
            lines.push(format!("s7d1 = {}", s7d1_disk.as_deref().unwrap_or("")));
        }
        if let Some(rom_ver) = gemus_rom_version {
            if !set_rom_ver {
                lines.push(format!("g_rom_version = {}", rom_ver));
            }
        }

        let content = lines.join("\r\n");
        let _ = std::fs::write(&config_path, content);
    }
}

pub(super) fn write_mame_apple2gs_cmd(
    temp_dir: &Path,
    primary_rom: &Path,
    rom_files: &[PathBuf],
    gemus: &str,
    system_dir: Option<&Path>,
) -> Result<PathBuf, String> {
    let is_525 = is_apple_525_disk(primary_rom);
    let primary_str = primary_rom.to_string_lossy();
    let secondary = rom_files.iter().find(|f| *f != primary_rom);

    // Check GEMUS for rom version (apple2gs vs apple2gsr1) and boot=no
    let mut is_boot_no = false;
    let mut rom_ver: Option<&str> = None;
    for line in gemus.lines() {
        let trimmed = line.trim();
        if let Some((k, v)) = trimmed.split_once('=') {
            let key = k.trim();
            let val = v.trim();
            if key.eq_ignore_ascii_case("boot") && val.eq_ignore_ascii_case("no") {
                is_boot_no = true;
            } else if key.eq_ignore_ascii_case("rom") {
                rom_ver = Some(val);
            }
        }
    }

    let machine = match rom_ver {
        Some("1") => "apple2gsr1",
        Some("0") => "apple2gsr0",
        _ => "apple2gs",
    };

    let needs_boot_disk = is_boot_no || (!is_525 && !is_apple_disk_self_bootable(primary_rom));
    let mut candidate_dirs: Vec<PathBuf> = Vec::new();
    if let Some(sys) = system_dir {
        candidate_dirs.push(sys.to_path_buf());
        candidate_dirs.push(sys.join("mame"));
        if let Some(parent) = sys.parent() {
            candidate_dirs.push(parent.to_path_buf());
        }
    }
    for fallback in [
        Path::new("F:/RETRO/Mac2"),
        Path::new("C:/RETRO/Mac2"),
        Path::new("F:/RETRO/kegs"),
    ] {
        if fallback.exists() {
            candidate_dirs.push(fallback.to_path_buf());
        }
    }

    let boot_disk = if needs_boot_disk {
        candidate_dirs
            .iter()
            .find_map(|dir| find_kegs_boot_disk(dir, rom_ver))
    } else {
        None
    };

    let mut cmd_line = machine.to_string();

    if let Some(sys) = system_dir {
        cmd_line.push_str(&format!(" -rompath \"{}\"", sys.to_string_lossy()));
    }

    if let Some(ref boot) = boot_disk {
        if is_kegs_hard_drive_image(boot) {
            cmd_line.push_str(&format!(" -hard1 \"{}\"", boot.to_string_lossy()));
            if !is_525 {
                cmd_line.push_str(&format!(" -flop3 \"{}\"", primary_str));
                if let Some(sec) = secondary {
                    cmd_line.push_str(&format!(" -flop4 \"{}\"", sec.to_string_lossy()));
                }
            } else {
                cmd_line.push_str(&format!(" -flop1 \"{}\"", primary_str));
                if let Some(sec) = secondary {
                    cmd_line.push_str(&format!(" -flop2 \"{}\"", sec.to_string_lossy()));
                }
            }
        } else {
            // Floppy boot disk in flop3, game in flop4
            cmd_line.push_str(&format!(" -flop3 \"{}\"", boot.to_string_lossy()));
            if !is_525 {
                cmd_line.push_str(&format!(" -flop4 \"{}\"", primary_str));
            } else {
                cmd_line.push_str(&format!(" -flop1 \"{}\"", primary_str));
            }
        }
    } else if is_525 {
        cmd_line.push_str(&format!(" -flop1 \"{}\"", primary_str));
        if let Some(sec) = secondary {
            cmd_line.push_str(&format!(" -flop2 \"{}\"", sec.to_string_lossy()));
        }
    } else {
        cmd_line.push_str(&format!(" -flop3 \"{}\"", primary_str));
        if let Some(sec) = secondary {
            cmd_line.push_str(&format!(" -flop4 \"{}\"", sec.to_string_lossy()));
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
