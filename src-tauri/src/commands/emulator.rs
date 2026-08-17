use crate::models::{EmulatorProfileTestRequest, LaunchRequest, LaunchResult};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

fn create_launch_temp_dir() -> Result<PathBuf, String> {
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

fn platform_display_name(platform_id: Option<&str>) -> &'static str {
    match platform_id {
        Some("atari800") => "Atari 800",
        Some("atari2600") => "Atari 2600",
        Some("atari5200") => "Atari 5200",
        Some("atari7800") => "Atari 7800",
        Some("zxspectrum") => "ZX Spectrum",
        Some("bbcmicro") => "Acorn BBC Micro",
        Some("amiga") => "Commodore Amiga",
        Some("atarist") => "Atari ST",
        Some("vic20") => "Commodore VIC-20",
        Some("amstradcpc") => "Amstrad CPC",
        Some("apple2gs") => "Apple 2GS",
        Some("pet") => "Commodore PET",
        Some("c128") => "Commodore 128",
        _ => "C64",
    }
}

fn emulator_profile_display_name(profile_id: Option<&str>, is_retroarch: bool) -> &'static str {
    match profile_id {
        Some("altirra-atari800") | Some("altirra-atari5200") => "Altirra",
        Some("spectaculator-zxspectrum") => "Spectaculator",
        Some("beebem-bbcmicro") => "BeebEm",
        Some("winuae-amiga") => "WinUAE / UAE",
        Some("steem-atarist") => "STeem",
        Some("hatari-atarist") => "Hatari",
        Some("vice-c64") | Some("vice-vic20") | Some("vice-pet") | Some("vice-c128") => "VICE",
        Some("kegs-apple2gs") => "KEGS",
        Some("cpce-amstradcpc") => "Caprice32 / CPC++",
        Some(id) if is_retroarch || id.starts_with("retroarch-") => "RetroArch",
        _ => "emulator",
    }
}

fn launch_extensions_for_platform(platform_id: Option<&str>) -> &'static [&'static str] {
    match platform_id {
        Some("atari800") => &[
            "atr", "atx", "xfd", "dcm", "cas", "xex", "com", "bin", "car", "rom",
        ],
        Some("atari2600") => &["a26", "bin", "rom"],
        Some("atari5200") => &["a52", "bin", "rom", "car"],
        Some("atari7800") => &["a78", "bin", "rom"],
        Some("zxspectrum") => &["tzx", "tap", "z80", "sna", "szx", "trd", "dsk"],
        Some("bbcmicro") => &["ssd", "dsd", "adl", "adf", "uef", "rom", "bin"],
        Some("amiga") => &["adf", "adz", "dms", "ipf", "lha", "hdf", "hdz"],
        Some("atarist") => &["st", "msa", "stx", "dim", "ipf"],
        Some("vic20") => &["d64", "t64", "tap", "prg", "crt", "a0", "20", "40", "60"],
        Some("amstradcpc") => &["dsk", "cpr", "sna", "cdt", "tap", "bin"],
        Some("apple2gs") => &["2mg", "dsk", "po", "woz", "nib"],
        Some("pet") => &["prg", "tap", "d64", "t64"],
        Some("c128") => &["d64", "d71", "d81", "t64", "tap", "prg", "crt", "g64", "nib"],
        _ => &["d64", "g64", "t64", "tap", "prg", "crt", "nib"],
    }
}

fn retroarch_core_not_found_message(platform_id: Option<&str>, core_path: &str) -> String {
    match platform_id {
        Some("atari800") => format!("Atari 800 RetroArch core file not found: {}", core_path),
        Some("atari2600") => format!("Atari 2600 RetroArch core file not found: {}", core_path),
        Some("atari5200") => format!("Atari 5200 RetroArch core file not found: {}", core_path),
        Some("atari7800") => format!("Atari 7800 RetroArch core file not found: {}", core_path),
        Some("zxspectrum") => format!("ZX Spectrum RetroArch core file not found: {}", core_path),
        Some("bbcmicro") => format!("Acorn BBC Micro RetroArch core file not found: {}", core_path),
        Some("amiga") => format!("Commodore Amiga RetroArch core file not found: {}", core_path),
        Some("atarist") => format!("Atari ST RetroArch core file not found: {}", core_path),
        Some("vic20") => format!("Commodore VIC-20 RetroArch core file not found: {}", core_path),
        Some("amstradcpc") => format!("Amstrad CPC RetroArch core file not found: {}", core_path),
        Some("apple2gs") => format!("Apple 2GS RetroArch core file not found: {}", core_path),
        Some("pet") => format!("Commodore PET RetroArch core file not found: {}", core_path),
        Some("c128") => format!("Commodore 128 RetroArch core file not found: {}", core_path),
        _ => format!("RetroArch Core file not found: {}", core_path),
    }
}

fn retroarch_core_not_file_message(platform_id: Option<&str>, core_path: &str) -> String {
    match platform_id {
        Some("atari800") => format!("Atari 800 RetroArch core path is not a file: {}", core_path),
        Some("atari2600") => format!("Atari 2600 RetroArch core path is not a file: {}", core_path),
        Some("atari5200") => format!("Atari 5200 RetroArch core path is not a file: {}", core_path),
        Some("atari7800") => format!("Atari 7800 RetroArch core path is not a file: {}", core_path),
        Some("zxspectrum") => format!("ZX Spectrum RetroArch core path is not a file: {}", core_path),
        Some("bbcmicro") => format!("Acorn BBC Micro RetroArch core path is not a file: {}", core_path),
        Some("amiga") => format!("Commodore Amiga RetroArch core path is not a file: {}", core_path),
        Some("atarist") => format!("Atari ST RetroArch core path is not a file: {}", core_path),
        Some("vic20") => format!("Commodore VIC-20 RetroArch core path is not a file: {}", core_path),
        Some("amstradcpc") => format!("Amstrad CPC RetroArch core path is not a file: {}", core_path),
        Some("apple2gs") => format!("Apple 2GS RetroArch core path is not a file: {}", core_path),
        Some("pet") => format!("Commodore PET RetroArch core path is not a file: {}", core_path),
        Some("c128") => format!("Commodore 128 RetroArch core path is not a file: {}", core_path),
        _ => format!("RetroArch Core path is not a file: {}", core_path),
    }
}

fn is_supported_emulator_profile(platform_id: &str, profile_id: &str) -> bool {
    matches!(
        (platform_id, profile_id),
        ("c64", "vice-c64")
            | ("c64", "retroarch-c64")
            | ("atari800", "retroarch-atari800")
            | ("atari800", "altirra-atari800")
            | ("atari2600", "retroarch-atari2600")
            | ("zxspectrum", "retroarch-zxspectrum")
            | ("zxspectrum", "spectaculator-zxspectrum")
            | ("bbcmicro", "retroarch-bbcmicro")
            | ("bbcmicro", "beebem-bbcmicro")
            | ("amiga", "retroarch-amiga")
            | ("amiga", "winuae-amiga")
            | ("atarist", "retroarch-atarist")
            | ("atarist", "steem-atarist")
            | ("atarist", "hatari-atarist")
            | ("vic20", "retroarch-vic20")
            | ("vic20", "vice-vic20")
            | ("amstradcpc", "retroarch-amstradcpc")
            | ("amstradcpc", "cpce-amstradcpc")
            | ("apple2gs", "retroarch-apple2gs")
            | ("apple2gs", "kegs-apple2gs")
            | ("pet", "vice-pet")
            | ("pet", "retroarch-pet")
            | ("c128", "vice-c128")
            | ("c128", "retroarch-c128")
            | ("atari5200", "retroarch-atari5200")
            | ("atari5200", "altirra-atari5200")
            | ("atari7800", "retroarch-atari7800")
    )
}



fn is_retroarch_profile(profile_id: &str) -> bool {
    profile_id.starts_with("retroarch-")
}

fn push_altirra_rom_args(args: &mut Vec<String>, rom_path: &Path) {
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

fn find_matching_primary_rom(extracted_roms: &[PathBuf], file_to_run: &str) -> Option<PathBuf> {
    if file_to_run.is_empty() {
        return None;
    }
    let target_filename = Path::new(file_to_run)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(file_to_run)
        .to_lowercase();
    let target_path_normalized = file_to_run.replace('\\', "/").to_lowercase();

    // 1. Try matching full relative path suffix
    for r in extracted_roms {
        let r_str = r.to_string_lossy().replace('\\', "/").to_lowercase();
        if r_str.ends_with(&target_path_normalized) {
            return Some(r.clone());
        }
    }

    // 2. Try matching filename (case-insensitive)
    for r in extracted_roms {
        if let Some(n) = r.file_name().and_then(|n| n.to_str()) {
            if n.to_lowercase() == target_filename {
                return Some(r.clone());
            }
        }
    }

    None
}

fn natural_disk_sort_key(path: &Path) -> (u32, u32, String) {
    let name = path
        .file_stem()
        .and_then(|name| name.to_str())
        .unwrap_or("")
        .to_lowercase();

    // Prioritize main game / boot / disk 1 over addon / character / save disks
    let is_secondary_or_save = name.contains("character")
        || name.contains("save")
        || name.contains("course")
        || name.contains("car ")
        || name.contains("scenery")
        || name.contains("data");

    let priority = if is_secondary_or_save { 2 } else { 1 };

    // Extract disk / side number
    let mut disk_num = u32::MAX;
    for token in ["disk ", "disk_", "disk", "d", "side ", "side_", "side"] {
        if let Some((_, rest)) = name.rsplit_once(token) {
            let num_str: String = rest.chars().take_while(|c| c.is_ascii_digit()).collect();
            if let Ok(n) = num_str.parse::<u32>() {
                disk_num = n;
                break;
            } else if let Some(c) = rest.chars().next() {
                if ('a'..='d').contains(&c) {
                    disk_num = (c as u32) - ('a' as u32) + 1;
                    break;
                }
            }
        }
    }

    (priority, disk_num, name)
}

fn amiga_disk_sort_key(path: &Path) -> (u32, String) {
    let name = path
        .file_stem()
        .and_then(|name| name.to_str())
        .unwrap_or("")
        .to_lowercase();
    let disk_number = name
        .rsplit_once("_disk")
        .and_then(|(_, suffix)| suffix.parse::<u32>().ok())
        .unwrap_or(u32::MAX);

    (disk_number, name)
}

fn collect_amiga_sibling_disk_archives(rom_path: &Path) -> Vec<PathBuf> {
    let is_amiga_disk_zip = rom_path
        .file_stem()
        .and_then(|name| name.to_str())
        .and_then(|name| {
            name.to_lowercase()
                .rsplit_once("_disk")
                .map(|(prefix, suffix)| {
                    (!prefix.is_empty() && suffix.parse::<u32>().is_ok())
                        .then(|| prefix.to_string())
                })
        })
        .flatten();

    let Some(prefix) = is_amiga_disk_zip else {
        return vec![rom_path.to_path_buf()];
    };
    let Some(parent) = rom_path.parent() else {
        return vec![rom_path.to_path_buf()];
    };

    let mut archives: Vec<PathBuf> = match std::fs::read_dir(parent) {
        Ok(entries) => entries
            .filter_map(Result::ok)
            .map(|entry| entry.path())
            .filter(|path| {
                path.extension()
                    .and_then(|ext| ext.to_str())
                    .is_some_and(|ext| ext.eq_ignore_ascii_case("zip"))
                    && path
                        .file_stem()
                        .and_then(|name| name.to_str())
                        .map(|name| {
                            let lower = name.to_lowercase();
                            lower
                                .strip_prefix(&format!("{prefix}_disk"))
                                .is_some_and(|suffix| suffix.parse::<u32>().is_ok())
                        })
                        .unwrap_or(false)
            })
            .collect(),
        Err(_) => vec![rom_path.to_path_buf()],
    };

    archives.sort_by_key(|path| amiga_disk_sort_key(path));
    if archives.is_empty() {
        vec![rom_path.to_path_buf()]
    } else {
        archives
    }
}

fn push_uae_rom_args(args: &mut Vec<String>, rom_files: &[PathBuf]) {
    args.push("-G".to_string());

    if rom_files.is_empty() {
        return;
    }

    for (index, rom_file) in rom_files.iter().take(4).enumerate() {
        args.push(format!("-{index}"));
        args.push(rom_file.to_string_lossy().to_string());
    }

    if rom_files.len() > 1 {
        let disk_swapper = rom_files
            .iter()
            .map(|rom_file| rom_file.to_string_lossy().to_string())
            .collect::<Vec<_>>()
            .join(",");
        args.push(format!("-diskswapper={disk_swapper}"));
    }
}

fn push_uae_gemus_args(args: &mut Vec<String>, gemus: &str) {
    for line in gemus.lines() {
        let option = line.trim();
        if option.is_empty() || option.starts_with(';') || option.starts_with('#') {
            continue;
        }
        let Some((key, value)) = option.split_once('=') else {
            continue;
        };
        let key = key.trim();
        if key.is_empty() {
            continue;
        }
        let normalized_option = format!("{}={}", key.to_lowercase(), value.trim());

        args.push("-s".to_string());
        args.push(normalized_option);
    }
}

fn is_apple_525_disk(path: &Path) -> bool {
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

fn is_kegs_hard_drive_image(path: &Path) -> bool {
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

fn find_kegs_boot_disk(emulator_dir: &Path, gemus_rom_version: Option<&str>) -> Option<PathBuf> {
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

fn is_apple_disk_self_bootable(path: &Path) -> bool {
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
        return root_dir.windows(6).any(|w| w.eq_ignore_ascii_case(b"PRODOS"))
            || root_dir.windows(3).any(|w| w.eq_ignore_ascii_case(b"SOS"));
    }

    true
}

fn prepare_kegs_launch(
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

    let (s5d1_disk, s5d2_disk, s6d1_disk, s6d2_disk, s7d1_disk) = if let Some(ref boot) = boot_disk {
        if is_kegs_hard_drive_image(boot) {
            // Hard drive boot image: goes into s7d1, game goes into primary floppy slot
            let s5_1 = if !is_525 { Some(primary_str.clone()) } else { None };
            let s5_2 = if !is_525 { secondary_str.clone() } else { None };
            let s6_1 = if is_525 { Some(primary_str.clone()) } else { None };
            let s6_2 = if is_525 { secondary_str.clone() } else { None };
            (s5_1, s5_2, s6_1, s6_2, Some(boot.to_string_lossy().to_string()))
        } else {
            // Floppy boot disk (e.g. system5.2mg, prod 16v1_6.2mg):
            // Boot floppy goes into s5d1, game disk goes into s5d2 (or s6d1 for 5.25" game)
            let s5_1 = Some(boot.to_string_lossy().to_string());
            let s5_2 = if !is_525 { Some(primary_str.clone()) } else { None };
            let s6_1 = if is_525 { Some(primary_str.clone()) } else { None };
            let s6_2 = if is_525 { secondary_str.clone() } else { None };
            (s5_1, s5_2, s6_1, s6_2, None)
        }
    } else {
        // Standard game: game goes into s5d1 or s6d1, s7d1 is cleared
        let s5_1 = if !is_525 { Some(primary_str.clone()) } else { None };
        let s5_2 = if !is_525 { secondary_str.clone() } else { None };
        let s6_1 = if is_525 { Some(primary_str.clone()) } else { None };
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

#[derive(Default)]
struct GameLaunchMetadata {
    file_to_run: String,
    gemus: String,
}

fn games_table_has_column(conn: &rusqlite::Connection, column_name: &str) -> bool {
    let Ok(mut stmt) = conn.prepare("PRAGMA table_info(Games)") else {
        return false;
    };
    let Ok(columns) = stmt.query_map([], |row| row.get::<_, String>(1)) else {
        return false;
    };

    let has_column = columns
        .filter_map(Result::ok)
        .any(|column| column.eq_ignore_ascii_case(column_name));
    has_column
}

fn load_game_launch_metadata(
    game_id: Option<&str>,
    platform_id: Option<&str>,
) -> GameLaunchMetadata {
    let Some(game_id) = game_id else {
        return GameLaunchMetadata::default();
    };

    use crate::database::get_db_path;
    use rusqlite::{Connection, OptionalExtension};

    let Ok(conn) = Connection::open(get_db_path()) else {
        return GameLaunchMetadata::default();
    };

    let has_file_to_run = games_table_has_column(&conn, "FileToRun");
    let has_gemus = games_table_has_column(&conn, "Gemus");
    if !has_file_to_run && !has_gemus {
        return GameLaunchMetadata::default();
    }

    let file_to_run_expr = if has_file_to_run { "FileToRun" } else { "''" };
    let gemus_expr = if has_gemus { "Gemus" } else { "''" };
    let has_platform_id = games_table_has_column(&conn, "platform_id");

    let row = if has_platform_id {
        if let Some(platform_id) = platform_id {
            let sql = format!(
                "SELECT COALESCE({file_to_run_expr}, ''), COALESCE({gemus_expr}, '') FROM Games WHERE GA_Id = ? AND platform_id = ?"
            );
            conn.query_row(&sql, [game_id, platform_id], |row| {
                Ok(GameLaunchMetadata {
                    file_to_run: row.get(0)?,
                    gemus: row.get(1)?,
                })
            })
            .optional()
        } else {
            Ok(None)
        }
    } else {
        let sql = format!(
            "SELECT COALESCE({file_to_run_expr}, ''), COALESCE({gemus_expr}, '') FROM Games WHERE GA_Id = ?"
        );
        conn.query_row(&sql, [game_id], |row| {
            Ok(GameLaunchMetadata {
                file_to_run: row.get(0)?,
                gemus: row.get(1)?,
            })
        })
        .optional()
    };

    row.ok().flatten().unwrap_or_default()
}

fn write_retroarch_m3u(
    temp_dir: &Path,
    resolved_primary_rom: &Path,
    rom_files: &[PathBuf],
) -> Result<PathBuf, String> {
    let m3u_path = temp_dir.join(format!(
        "{}.m3u",
        resolved_primary_rom
            .file_stem()
            .unwrap_or_default()
            .to_string_lossy()
    ));
    let mut m3u = std::fs::File::create(&m3u_path).map_err(|e| e.to_string())?;
    writeln!(m3u, "{}", resolved_primary_rom.to_string_lossy()).map_err(|e| e.to_string())?;
    for rom_file in rom_files {
        if *rom_file != resolved_primary_rom {
            writeln!(m3u, "{}", rom_file.to_string_lossy()).map_err(|e| e.to_string())?;
        }
    }
    Ok(m3u_path)
}

fn write_mame_apple2gs_cmd(
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
    for fallback in [Path::new("F:/RETRO/Mac2"), Path::new("C:/RETRO/Mac2"), Path::new("F:/RETRO/kegs")] {
        if fallback.exists() {
            candidate_dirs.push(fallback.to_path_buf());
        }
    }

    let boot_disk = if needs_boot_disk {
        candidate_dirs.iter().find_map(|dir| find_kegs_boot_disk(dir, rom_ver))
    } else {
        None
    };

    let mut cmd_line = format!("{}", machine);

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

    if let Err(message) = require_existing_file(
        Path::new(&request.executable_path),
        || {
            format!(
                "{} {} executable path not found: {}",
                platform_display_name(platform),
                emulator_profile_display_name(profile, is_retroarch),
                request.executable_path
            )
        },
        || {
            format!(
                "{} {} executable path is not a file: {}",
                platform_display_name(platform),
                emulator_profile_display_name(profile, is_retroarch),
                request.executable_path
            )
        },
    ) {
        return Ok(LaunchResult {
            success: false,
            message,
        });
    }

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

#[tauri::command]
pub async fn launch_emulator(request: LaunchRequest) -> Result<LaunchResult, String> {
    let mut emulator = PathBuf::from(&request.emulator_path);
    let platform_id = request.platform_id.as_deref();
    require_existing_file(
        &emulator,
        || {
            format!(
                "{} {} executable path not found: {}",
                platform_display_name(platform_id),
                emulator_profile_display_name(request.emulator_profile_id.as_deref(), false),
                request.emulator_path
            )
        },
        || {
            format!(
                "{} {} executable path is not a file: {}",
                platform_display_name(platform_id),
                emulator_profile_display_name(request.emulator_profile_id.as_deref(), false),
                request.emulator_path
            )
        },
    )
    .or_else(|err| if emulator.is_dir() { Ok(()) } else { Err(err) })?;

    if emulator.is_dir() {
        let possible_exes = [
            "retroarch.exe",
            "retroarch",
            "x64sc.exe",
            "x64sc",
            "x64.exe",
            "x64",
            "vice",
            "x64dtv.exe",
            "xpet.exe",
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
            "amiberry.exe",
            "amiberry",
            "kegswin.exe",
            "kegswin",
            "kegs.exe",
            "kegs",
            "gsplus.exe",
            "gsplus",
        ];
        let mut found = false;
        for exe in possible_exes {
            let p = emulator.join(exe);
            if p.exists() && p.is_file() {
                emulator = p;
                found = true;
                break;
            }
        }
        if !found {
            return Err(format!(
                "No supported emulator binary found in directory: {}",
                request.emulator_path
            ));
        }
    }

    let rom = PathBuf::from(&request.rom_path);
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
    if is_altirra {
        if request.is_pal {
            args.push("/pal".to_string());
        } else {
            args.push("/ntsc".to_string());
        }
    } else if !is_retroarch && !is_spectaculator && !is_beebem && !is_uae && !is_kegs {
        if request.true_drive_emulation {
            args.push("-truedrive".to_string());
        }
        if !request.is_pal {
            args.push("-ntsc".to_string());
        }
    }

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
        let temp_dir = create_launch_temp_dir()?;

        let mut extracted_roms = Vec::new();
        let zip_archives = if platform_id == Some("amiga") {
            collect_amiga_sibling_disk_archives(&rom)
        } else {
            vec![rom.clone()]
        };

        for archive_path in zip_archives {
            let file = std::fs::File::open(&archive_path).map_err(|e| e.to_string())?;
            let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
            let archive_stem = archive_path
                .file_stem()
                .and_then(|stem| stem.to_str())
                .unwrap_or("archive");
            let archive_extract_dir = temp_dir.join(archive_stem);

            for i in 0..archive.len() {
                let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
                let outpath = archive_extract_dir.join(file.mangled_name());
                if (&*file.name()).ends_with('/') {
                    std::fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
                } else {
                    if let Some(p) = outpath.parent() {
                        if !p.exists() {
                            std::fs::create_dir_all(&p).map_err(|e| e.to_string())?;
                        }
                    }
                    let mut outfile = std::fs::File::create(&outpath).map_err(|e| e.to_string())?;
                    std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;

                    let ext = outpath
                        .extension()
                        .and_then(|e| e.to_str())
                        .unwrap_or("")
                        .to_lowercase();
                    if launch_extensions_for_platform(platform_id).contains(&ext.as_str()) {
                        extracted_roms.push(outpath.clone());
                    }
                }
            }
        }

        if extracted_roms.is_empty() {
            return Err(format!(
                "No compatible {} launch files found inside the ZIP file.",
                platform_display_name(platform_id)
            ));
        }

        if platform_id == Some("amiga") {
            extracted_roms.sort_by_key(|path| amiga_disk_sort_key(path));
        } else {
            extracted_roms.sort_by_key(|path| natural_disk_sort_key(path));
        }

        let resolved_primary_rom = find_matching_primary_rom(&extracted_roms, &file_to_run)
            .unwrap_or_else(|| extracted_roms.first().unwrap().clone());

        if is_retroarch {
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
            } else if extracted_roms.len() > 1 {
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
                    std::fs::File::create(&fliplist_path).map_err(|e| e.to_string())?;
                writeln!(fliplist, "# Vice fliplist file").unwrap();
                writeln!(fliplist, "UNIT 8").unwrap();
                for rom_file in &extracted_roms {
                    writeln!(fliplist, "{}", rom_file.to_string_lossy()).unwrap();
                }
                args.push("-flipname".to_string());
                args.push(fliplist_path.to_string_lossy().to_string());
            }
        }
    } else {
        if is_retroarch {
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
        } else if is_spectaculator || is_beebem {
            args.push(rom.to_string_lossy().to_string());
        } else {
            args.push("-autostart".to_string());
            args.push(rom.to_string_lossy().to_string());
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

    if is_debug {
        println!("[GameBaseBox Launch] Emulator: {}", emulator.to_string_lossy());
        println!("[GameBaseBox Launch] Switches: {:?}", args);
    }

    let mut cmd = Command::new(&emulator);

    if let Some(parent) = emulator.parent() {
        cmd.current_dir(parent);
    }

    match cmd
        .args(&args)
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
    {
        Ok(_) => Ok(LaunchResult {
            success: true,
            message: format!("Launched {} successfully", exe_name),
        }),
        Err(e) => Err(format!("Failed to launch emulator: {}", e)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_helpers::DbEnvGuard;

    #[test]
    fn test_altirra_rom_args_extension_mapping() {
        let test_cases = vec![
            ("game.atr", vec!["/disk", "game.atr"]),
            ("game.atx", vec!["/disk", "game.atx"]),
            ("game.xfd", vec!["/disk", "game.xfd"]),
            ("game.dcm", vec!["/disk", "game.dcm"]),
            ("game.cas", vec!["/tape", "game.cas", "/casautoboot"]),
            ("game.bin", vec!["/cart", "game.bin"]),
            ("game.car", vec!["/cart", "game.car"]),
            ("game.rom", vec!["/cart", "game.rom"]),
            ("game.xex", vec!["/run", "game.xex"]),
            ("game.com", vec!["/run", "game.com"]),
            ("game.bas", vec!["/runbas", "game.bas"]),
            ("game.txt", vec!["game.txt"]),
        ];

        for (filename, expected) in test_cases {
            let mut args = Vec::new();
            let path = Path::new(filename);
            push_altirra_rom_args(&mut args, &path);
            let expected_strs: Vec<String> = expected.iter().map(|s| s.to_string()).collect();
            assert_eq!(args, expected_strs, "Failed for {}", filename);
        }
    }

    #[test]
    fn test_amiga_sibling_disk_zips_are_collected_in_disk_order() {
        let dir = tempdir().unwrap();
        let disk_1 = dir.path().join("D-Generation (AGA)_Disk1.zip");
        let disk_2 = dir.path().join("D-Generation (AGA)_Disk2.zip");
        let unrelated = dir.path().join("D-Generation (AGA) Manual.zip");
        std::fs::write(&disk_1, b"disk1").unwrap();
        std::fs::write(&disk_2, b"disk2").unwrap();
        std::fs::write(&unrelated, b"manual").unwrap();

        let archives = collect_amiga_sibling_disk_archives(&disk_1);

        assert_eq!(archives, vec![disk_1, disk_2]);
    }

    #[test]
    fn test_winuae_uses_drive_args_and_disk_swapper_for_multiple_disks() {
        let disks = vec![
            PathBuf::from("D:/Temp/D-Generation (AGA)_Disk1.adf"),
            PathBuf::from("D:/Temp/D-Generation (AGA)_Disk2.adf"),
        ];
        let mut args = Vec::new();

        push_uae_rom_args(&mut args, &disks);

        assert_eq!(
            args,
            vec![
                "-G".to_string(),
                "-0".to_string(),
                "D:/Temp/D-Generation (AGA)_Disk1.adf".to_string(),
                "-1".to_string(),
                "D:/Temp/D-Generation (AGA)_Disk2.adf".to_string(),
                "-diskswapper=D:/Temp/D-Generation (AGA)_Disk1.adf,D:/Temp/D-Generation (AGA)_Disk2.adf".to_string(),
            ]
        );
    }

    #[test]
    fn test_winuae_gemus_lines_are_passed_as_lowercase_s_options() {
        let gemus = "\n kickstart_rom=v1.3\r\nnr_floppies=2\nfloppy0type=0\n\n; comment\n";
        let mut args = Vec::new();

        push_uae_gemus_args(&mut args, gemus);

        assert_eq!(
            args,
            vec![
                "-s".to_string(),
                "kickstart_rom=v1.3".to_string(),
                "-s".to_string(),
                "nr_floppies=2".to_string(),
                "-s".to_string(),
                "floppy0type=0".to_string(),
            ]
        );
    }

    #[test]
    fn test_winuae_gemus_normalizes_option_names_without_lowercasing_values() {
        let mut args = Vec::new();

        push_uae_gemus_args(&mut args, "Kickstart_Rom_File=C:/ROMs/Kick31.rom");

        assert_eq!(
            args,
            vec![
                "-s".to_string(),
                "kickstart_rom_file=C:/ROMs/Kick31.rom".to_string(),
            ]
        );
    }

    #[test]
    fn test_kegs_slot5_disk_mapping_and_config_generation() {
        let dir = tempdir().unwrap();
        let disk1 = dir.path().join("Gauntlet.2mg");
        std::fs::write(&disk1, b"disk1").unwrap();

        // Write existing config.kegs with hard drive in s7d1
        let config_file = dir.path().join("config.kegs");
        std::fs::write(&config_file, "s7d1 = NUCLEUS03.gz\r\ns5d1 = xmas_demo.gz\r\n").unwrap();

        let mut args = Vec::new();
        prepare_kegs_launch(
            Some(dir.path()),
            &mut args,
            &[disk1.clone()],
            &disk1,
            "",
        );

        assert_eq!(
            args,
            vec![
                format!("-s5d1={}", disk1.to_string_lossy()),
                "-s5d2=".to_string(),
                "-s6d1=".to_string(),
                "-s6d2=".to_string(),
                "-s7d1=".to_string(),
            ]
        );

        let config_content = std::fs::read_to_string(&config_file).unwrap();
        assert!(config_content.contains(&format!("s5d1 = {}", disk1.to_string_lossy())));
        assert!(config_content.contains("s7d1 = "));
        assert!(!config_content.contains("NUCLEUS03.gz"));
    }

    #[test]
    fn test_kegs_mounts_floppy_system_disk_when_gemus_has_boot_no() {
        let dir = tempdir().unwrap();
        let disk1 = dir.path().join("DejaVu_Disk1.2mg");
        let sys5 = dir.path().join("system5.2mg");
        std::fs::write(&disk1, b"disk1").unwrap();
        std::fs::write(&sys5, &[0u8; 819200]).unwrap(); // standard 800KB 3.5" disk

        let config_file = dir.path().join("config.kegs");
        std::fs::write(&config_file, "s7d1 = \r\ns5d1 = \r\n").unwrap();

        let mut args = Vec::new();
        prepare_kegs_launch(
            Some(dir.path()),
            &mut args,
            &[disk1.clone()],
            &disk1,
            "boot=no\r\nrom=1",
        );

        assert_eq!(
            args,
            vec![
                format!("-s5d1={}", sys5.to_string_lossy()),
                format!("-s5d2={}", disk1.to_string_lossy()),
                "-s6d1=".to_string(),
                "-s6d2=".to_string(),
                "-s7d1=".to_string(),
            ]
        );

        let config_content = std::fs::read_to_string(&config_file).unwrap();
        assert!(config_content.contains(&format!("s5d1 = {}", sys5.to_string_lossy())));
        assert!(config_content.contains(&format!("s5d2 = {}", disk1.to_string_lossy())));
        assert!(config_content.contains("s7d1 = "));
        assert!(config_content.contains("g_rom_version = 1"));
    }

    #[test]
    fn test_kegs_mounts_hard_drive_boot_disk_when_gemus_has_boot_no() {
        let dir = tempdir().unwrap();
        let disk1 = dir.path().join("DejaVu_Disk1.2mg");
        let sys6_hdv = dir.path().join("system6.hdv");
        std::fs::write(&disk1, b"disk1").unwrap();
        std::fs::write(&sys6_hdv, b"system6_hdd").unwrap();

        let config_file = dir.path().join("config.kegs");
        std::fs::write(&config_file, "s7d1 = \r\ns5d1 = \r\n").unwrap();

        let mut args = Vec::new();
        prepare_kegs_launch(
            Some(dir.path()),
            &mut args,
            &[disk1.clone()],
            &disk1,
            "boot=no\r\nrom=3",
        );

        assert_eq!(
            args,
            vec![
                format!("-s5d1={}", disk1.to_string_lossy()),
                "-s5d2=".to_string(),
                "-s6d1=".to_string(),
                "-s6d2=".to_string(),
                format!("-s7d1={}", sys6_hdv.to_string_lossy()),
            ]
        );

        let config_content = std::fs::read_to_string(&config_file).unwrap();
        assert!(config_content.contains(&format!("s5d1 = {}", disk1.to_string_lossy())));
        assert!(config_content.contains(&format!("s7d1 = {}", sys6_hdv.to_string_lossy())));
        assert!(config_content.contains("g_rom_version = 3"));
    }

    #[test]
    fn test_kegs_mounts_system_disk_when_disk_lacks_prodos_even_if_gemus_empty() {
        let dir = tempdir().unwrap();
        let disk1 = dir.path().join("BardsTale2.2mg");
        let sys5 = dir.path().join("system5.2mg");
        // Create an 800KB disk without "PRODOS" in its root directory
        let mut non_boot_disk = vec![0u8; 819200];
        non_boot_disk[0..4].copy_from_slice(b"2IMG");
        std::fs::write(&disk1, &non_boot_disk).unwrap();
        std::fs::write(&sys5, &[0u8; 819200]).unwrap();

        let config_file = dir.path().join("config.kegs");
        std::fs::write(&config_file, "s7d1 = \r\ns5d1 = \r\n").unwrap();

        let mut args = Vec::new();
        // gemus is empty string (like in the DB for Bard's Tale 2)
        prepare_kegs_launch(
            Some(dir.path()),
            &mut args,
            &[disk1.clone()],
            &disk1,
            "",
        );

        assert_eq!(
            args,
            vec![
                format!("-s5d1={}", sys5.to_string_lossy()),
                format!("-s5d2={}", disk1.to_string_lossy()),
                "-s6d1=".to_string(),
                "-s6d2=".to_string(),
                "-s7d1=".to_string(),
            ]
        );

        let config_content = std::fs::read_to_string(&config_file).unwrap();
        assert!(config_content.contains(&format!("s5d1 = {}", sys5.to_string_lossy())));
        assert!(config_content.contains(&format!("s5d2 = {}", disk1.to_string_lossy())));
    }

    #[test]
    fn test_kegs_slot6_mapping_for_525_disks() {
        let dir = tempdir().unwrap();
        let disk1 = dir.path().join("Game.dsk");
        std::fs::write(&disk1, &[0u8; 143360]).unwrap(); // standard 140KB 5.25" disk

        let mut args = Vec::new();
        prepare_kegs_launch(
            Some(dir.path()),
            &mut args,
            &[disk1.clone()],
            &disk1,
            "",
        );

        assert_eq!(
            args,
            vec![
                "-s5d1=".to_string(),
                "-s5d2=".to_string(),
                format!("-s6d1={}", disk1.to_string_lossy()),
                "-s6d2=".to_string(),
                "-s7d1=".to_string(),
            ]
        );

        let config_file = dir.path().join("config.kegs");
        let config_content = std::fs::read_to_string(config_file).unwrap();
        assert!(config_content.contains(&format!("s6d1 = {}", disk1.to_string_lossy())));
    }

    #[test]
    fn test_launch_metadata_loads_platform_scoped_gemus() {
        let temp_db = NamedTempFile::new().unwrap();
        let db_path = temp_db.path().to_string_lossy().to_string();
        let _env = DbEnvGuard::set(&db_path);
        let conn = Connection::open(temp_db.path()).unwrap();
        conn.execute(
            "CREATE TABLE Games (GA_Id TEXT, platform_id TEXT, FileToRun TEXT, Gemus TEXT)",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO Games (GA_Id, platform_id, FileToRun, Gemus) VALUES (?, ?, ?, ?)",
            ["1", "c64", "c64.d64", "chipmem_size=1"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO Games (GA_Id, platform_id, FileToRun, Gemus) VALUES (?, ?, ?, ?)",
            ["1", "amiga", "amiga.adf", "cpu_model=68020\nchipmem_size=4"],
        )
        .unwrap();

        let metadata = load_game_launch_metadata(Some("1"), Some("amiga"));

        assert_eq!(metadata.file_to_run, "amiga.adf");
        assert_eq!(metadata.gemus, "cpu_model=68020\nchipmem_size=4");
    }

    #[test]
    fn test_retroarch_m3u_lists_extracted_amiga_disks_in_order() {
        let dir = tempdir().unwrap();
        let disk_1 = dir.path().join("D-Generation (AGA)_Disk1.adf");
        let disk_2 = dir.path().join("D-Generation (AGA)_Disk2.adf");
        std::fs::write(&disk_1, b"disk1").unwrap();
        std::fs::write(&disk_2, b"disk2").unwrap();

        let m3u_path =
            write_retroarch_m3u(dir.path(), &disk_1, &[disk_1.clone(), disk_2.clone()]).unwrap();

        let contents = std::fs::read_to_string(m3u_path).unwrap();
        assert_eq!(
            contents,
            format!(
                "{}\n{}\n",
                disk_1.to_string_lossy(),
                disk_2.to_string_lossy()
            )
        );
    }
    use rusqlite::Connection;
    use tempfile::{tempdir, NamedTempFile};
    use zip::write::FileOptions;

    fn system_shell_executable() -> PathBuf {
        if cfg!(windows) {
            PathBuf::from(
                std::env::var("ComSpec")
                    .unwrap_or_else(|_| "C:\\Windows\\System32\\cmd.exe".to_string()),
            )
        } else {
            PathBuf::from("/bin/sh")
        }
    }

    fn copy_test_emulator(target: &Path) {
        std::fs::copy(system_shell_executable(), target).unwrap();
    }

    fn write_zip(zip_path: &Path, files: &[(&str, &[u8])]) {
        let file = std::fs::File::create(zip_path).unwrap();
        let mut zip = zip::ZipWriter::new(file);
        let options = FileOptions::default();

        for (name, contents) in files {
            zip.start_file(*name, options).unwrap();
            zip.write_all(contents).unwrap();
        }

        zip.finish().unwrap();
    }

    #[tokio::test]
    async fn test_launch_emulator_non_existent() {
        let req = LaunchRequest {
            emulator_path: "/non/existent/path".to_string(),
            rom_path: "/non/existent/rom".to_string(),
            true_drive_emulation: false,
            is_pal: true,
            game_id: None,
            core_path: None,
            ..Default::default()
        };
        let res = launch_emulator(req).await;
        assert!(res.is_err());
    }

    #[tokio::test]
    async fn test_launch_emulator_invalid_zip() {
        let dir = tempdir().unwrap();
        let rom_path = dir.path().join("game.zip");
        std::fs::write(&rom_path, b"not-a-zip").unwrap();

        // Mock emulator path
        let emu_path = dir.path().join("vice.exe");
        std::fs::write(&emu_path, b"dummy").unwrap();

        let req = LaunchRequest {
            emulator_path: emu_path.to_string_lossy().to_string(),
            rom_path: rom_path.to_string_lossy().to_string(),
            ..Default::default()
        };
        let res = launch_emulator(req).await;
        assert!(res.is_err());
        assert!(res.unwrap_err().to_lowercase().contains("zip"));
    }

    #[tokio::test]
    async fn test_is_retroarch_detection() {
        let vice = PathBuf::from("C:\\VICE\\x64sc.exe");
        let retro = PathBuf::from("F:\\RETRO\\retroarch.exe");

        let exe_vice = vice
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_lowercase();
        let exe_retro = retro
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_lowercase();

        assert!(!exe_vice.contains("retroarch"));
        assert!(exe_retro.contains("retroarch"));
    }

    #[tokio::test]
    async fn test_launch_emulator_directory_and_non_zip_success() {
        let dir = tempdir().unwrap();
        let emulator_dir = dir.path().join("emulator");
        std::fs::create_dir_all(&emulator_dir).unwrap();
        let emulator_path = emulator_dir.join(if cfg!(windows) { "x64sc.exe" } else { "x64sc" });
        copy_test_emulator(&emulator_path);

        let rom_path = dir.path().join("game.d64");
        std::fs::write(&rom_path, b"dummy rom").unwrap();

        let request = LaunchRequest {
            emulator_path: emulator_dir.to_string_lossy().to_string(),
            rom_path: rom_path.to_string_lossy().to_string(),
            true_drive_emulation: true,
            is_pal: false,
            ..Default::default()
        };

        let result = launch_emulator(request).await.unwrap();
        assert!(result.success);
        assert!(result.message.to_lowercase().contains("x64sc"));
    }

    #[tokio::test]
    async fn test_launch_emulator_retroarch_missing_core() {
        let dir = tempdir().unwrap();
        let emulator_path = dir.path().join(if cfg!(windows) {
            "retroarch.exe"
        } else {
            "retroarch"
        });
        copy_test_emulator(&emulator_path);

        let rom_path = dir.path().join("game.d64");
        std::fs::write(&rom_path, b"dummy rom").unwrap();

        let request = LaunchRequest {
            emulator_path: emulator_path.to_string_lossy().to_string(),
            rom_path: rom_path.to_string_lossy().to_string(),
            core_path: Some(dir.path().join("missing.dll").to_string_lossy().to_string()),
            ..Default::default()
        };

        let result = launch_emulator(request).await;
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .contains("RetroArch Core file not found"));
    }

    #[tokio::test]
    async fn test_launch_emulator_retroarch_core_directory_rejected() {
        let dir = tempdir().unwrap();
        let emulator_path = dir.path().join(if cfg!(windows) {
            "retroarch.exe"
        } else {
            "retroarch"
        });
        copy_test_emulator(&emulator_path);

        let rom_path = dir.path().join("game.d64");
        std::fs::write(&rom_path, b"dummy rom").unwrap();

        let core_dir = dir.path().join("cores");
        std::fs::create_dir(&core_dir).unwrap();

        let request = LaunchRequest {
            emulator_path: emulator_path.to_string_lossy().to_string(),
            rom_path: rom_path.to_string_lossy().to_string(),
            core_path: Some(core_dir.to_string_lossy().to_string()),
            ..Default::default()
        };

        let result = launch_emulator(request).await;
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .contains("RetroArch Core path is not a file"));
    }

    #[test]
    fn test_write_mame_apple2gs_cmd_for_floppies_and_boot_disks() {
        let dir = tempdir().unwrap();
        let disk1 = dir.path().join("DejaVu_Disk1.2mg");
        let disk2 = dir.path().join("DejaVu_Disk2.2mg");
        let sys5 = dir.path().join("system5.2mg");
        std::fs::write(&disk1, b"disk1").unwrap();
        std::fs::write(&disk2, b"disk2").unwrap();
        std::fs::write(&sys5, &[0u8; 819200]).unwrap();

        // 1. Boot=no with System floppy -> flop3 = system5, flop4 = disk1
        let cmd_path = write_mame_apple2gs_cmd(
            dir.path(),
            &disk1,
            &[disk1.clone(), disk2.clone()],
            "boot=no\r\nrom=1",
            Some(dir.path()),
        )
        .unwrap();

        let content = std::fs::read_to_string(cmd_path).unwrap();
        assert!(content.starts_with("apple2gsr1"));
        assert!(content.contains(&format!("-rompath \"{}\"", dir.path().to_string_lossy())));
        assert!(content.contains(&format!("-flop3 \"{}\"", sys5.to_string_lossy())));
        assert!(content.contains(&format!("-flop4 \"{}\"", disk1.to_string_lossy())));

        // 2. Standard 5.25" disk -> flop1 = game, flop2 = disk2
        let dsk1 = dir.path().join("Game_SideA.dsk");
        let dsk2 = dir.path().join("Game_SideB.dsk");
        std::fs::write(&dsk1, &[0u8; 143360]).unwrap();
        std::fs::write(&dsk2, &[0u8; 143360]).unwrap();

        let cmd_path525 = write_mame_apple2gs_cmd(
            dir.path(),
            &dsk1,
            &[dsk1.clone(), dsk2.clone()],
            "",
            None,
        )
        .unwrap();

        let content525 = std::fs::read_to_string(cmd_path525).unwrap();
        assert!(content525.starts_with("apple2gs"));
        assert!(content525.contains(&format!("-flop1 \"{}\"", dsk1.to_string_lossy())));
        assert!(content525.contains(&format!("-flop2 \"{}\"", dsk2.to_string_lossy())));
    }

    #[test]
    fn test_find_matching_primary_rom_with_directory_prefix() {
        let roms = vec![
            PathBuf::from("temp/Bard's Tale II (Character Disk).2mg"),
            PathBuf::from("temp/The Bard's Tale 2/Bard's Tale II.2mg"),
        ];

        let matched = find_matching_primary_rom(&roms, "The Bard's Tale 2\\Bard's Tale II.2mg");
        assert_eq!(
            matched,
            Some(PathBuf::from("temp/The Bard's Tale 2/Bard's Tale II.2mg"))
        );

        let matched_by_filename =
            find_matching_primary_rom(&roms, "Subfolder\\Bard's Tale II.2mg");
        assert_eq!(
            matched_by_filename,
            Some(PathBuf::from("temp/The Bard's Tale 2/Bard's Tale II.2mg"))
        );
    }

    #[test]
    fn test_natural_disk_sort_key_prioritizes_main_disk_over_character_and_addon_disks() {
        let mut disks = vec![
            PathBuf::from("Test Drive II (Course Disk).2mg"),
            PathBuf::from("Test Drive II.2mg"),
            PathBuf::from("Test Drive II (Car Disk).2mg"),
        ];
        disks.sort_by_key(|p| natural_disk_sort_key(p));

        assert_eq!(
            disks,
            vec![
                PathBuf::from("Test Drive II.2mg"),
                PathBuf::from("Test Drive II (Car Disk).2mg"),
                PathBuf::from("Test Drive II (Course Disk).2mg"),
            ]
        );
    }

    #[tokio::test]
    async fn test_launch_emulator_zip_prefers_file_to_run() {
        let dir = tempdir().unwrap();
        let emulator_path = dir
            .path()
            .join(if cfg!(windows) { "x64sc.exe" } else { "x64sc" });
        copy_test_emulator(&emulator_path);

        let zip_path = dir.path().join("collection.zip");
        write_zip(&zip_path, &[("disk1.d64", b"disk1"), ("boot.prg", b"boot")]);

        let temp_db = NamedTempFile::new().unwrap();
        let db_path = temp_db.path().to_string_lossy().to_string();
        let _env = DbEnvGuard::set(&db_path);
        let conn = Connection::open(temp_db.path()).unwrap();
        conn.execute("CREATE TABLE Games (GA_Id TEXT, FileToRun TEXT)", [])
            .unwrap();
        conn.execute(
            "INSERT INTO Games (GA_Id, FileToRun) VALUES (?, ?)",
            ["123", "boot.prg"],
        )
        .unwrap();

        let request = LaunchRequest {
            emulator_path: emulator_path.to_string_lossy().to_string(),
            rom_path: zip_path.to_string_lossy().to_string(),
            game_id: Some("123".to_string()),
            ..Default::default()
        };

        let result = launch_emulator(request).await.unwrap();
        assert!(result.success);
    }

    #[tokio::test]
    async fn test_launch_emulator_rom_directory_rejected() {
        let dir = tempdir().unwrap();
        let emulator_path = dir
            .path()
            .join(if cfg!(windows) { "x64sc.exe" } else { "x64sc" });
        copy_test_emulator(&emulator_path);

        let rom_dir = dir.path().join("roms");
        std::fs::create_dir(&rom_dir).unwrap();

        let request = LaunchRequest {
            emulator_path: emulator_path.to_string_lossy().to_string(),
            rom_path: rom_dir.to_string_lossy().to_string(),
            ..Default::default()
        };

        let result = launch_emulator(request).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("ROM path is not a file"));
    }

    #[tokio::test]
    async fn test_launch_emulator_retroarch_zip_success() {
        let dir = tempdir().unwrap();
        let emulator_path = dir.path().join(if cfg!(windows) {
            "retroarch.exe"
        } else {
            "retroarch"
        });
        copy_test_emulator(&emulator_path);

        let core_path = dir.path().join("vice_libretro.dll");
        std::fs::write(&core_path, b"core").unwrap();

        let zip_path = dir.path().join("multi.zip");
        write_zip(
            &zip_path,
            &[("disk1.d64", b"disk1"), ("disk2.d64", b"disk2")],
        );

        let request = LaunchRequest {
            emulator_path: emulator_path.to_string_lossy().to_string(),
            rom_path: zip_path.to_string_lossy().to_string(),
            core_path: Some(core_path.to_string_lossy().to_string()),
            ..Default::default()
        };

        let result = launch_emulator(request).await.unwrap();
        assert!(result.success);
        assert!(result.message.to_lowercase().contains("retroarch"));
    }

    #[tokio::test]
    async fn test_launch_emulator_zip_does_not_delete_shared_temp_directory() {
        let shared_temp_dir = std::env::temp_dir().join("GBBoxTemp");
        let _ = std::fs::remove_dir_all(&shared_temp_dir);
        std::fs::create_dir_all(&shared_temp_dir).unwrap();
        let sentinel = shared_temp_dir.join("keep.txt");
        std::fs::write(&sentinel, b"keep").unwrap();

        let dir = tempdir().unwrap();
        let emulator_path = dir
            .path()
            .join(if cfg!(windows) { "x64sc.exe" } else { "x64sc" });
        copy_test_emulator(&emulator_path);

        let zip_path = dir.path().join("collection.zip");
        write_zip(
            &zip_path,
            &[("disk1.d64", b"disk1"), ("disk2.d64", b"disk2")],
        );

        let request = LaunchRequest {
            emulator_path: emulator_path.to_string_lossy().to_string(),
            rom_path: zip_path.to_string_lossy().to_string(),
            ..Default::default()
        };

        let result = launch_emulator(request).await.unwrap();
        assert!(result.success);
        assert!(sentinel.exists());

        let _ = std::fs::remove_dir_all(&shared_temp_dir);
    }

    #[tokio::test]
    async fn test_launch_emulator_atari800_retroarch_zip_success() {
        let dir = tempdir().unwrap();
        let emulator_path = dir.path().join(if cfg!(windows) {
            "retroarch.exe"
        } else {
            "retroarch"
        });
        copy_test_emulator(&emulator_path);

        let core_path = dir.path().join("atari800_libretro.dll");
        std::fs::write(&core_path, b"core").unwrap();

        let zip_path = dir.path().join("atari800.zip");
        write_zip(
            &zip_path,
            &[("disk1.atr", b"disk1"), ("disk2.xex", b"disk2")],
        );

        let request = LaunchRequest {
            platform_id: Some("atari800".to_string()),
            emulator_profile_id: Some("retroarch-atari800".to_string()),
            emulator_path: emulator_path.to_string_lossy().to_string(),
            rom_path: zip_path.to_string_lossy().to_string(),
            core_path: Some(core_path.to_string_lossy().to_string()),
            ..Default::default()
        };

        let result = launch_emulator(request).await.unwrap();
        assert!(result.success);
    }

    #[tokio::test]
    async fn test_launch_emulator_atarist_retroarch_zip_creates_m3u_for_multiple_st_disks() {
        let temp_dir = std::env::temp_dir();
        let existing_launch_dirs = std::fs::read_dir(&temp_dir)
            .unwrap()
            .filter_map(Result::ok)
            .map(|entry| entry.path())
            .collect::<std::collections::HashSet<_>>();
        let dir = tempdir().unwrap();
        let emulator_path = dir.path().join(if cfg!(windows) {
            "retroarch.exe"
        } else {
            "retroarch"
        });
        copy_test_emulator(&emulator_path);

        let core_path = dir.path().join("hatari_libretro.dll");
        std::fs::write(&core_path, b"core").unwrap();

        let zip_path = dir.path().join("leander.zip");
        write_zip(
            &zip_path,
            &[
                ("Leander Disk 1.st", b"disk1"),
                ("Leander Disk 2.st", b"disk2"),
            ],
        );

        let result = launch_emulator(LaunchRequest {
            platform_id: Some("atarist".to_string()),
            emulator_profile_id: Some("retroarch-atarist".to_string()),
            emulator_path: emulator_path.to_string_lossy().to_string(),
            rom_path: zip_path.to_string_lossy().to_string(),
            core_path: Some(core_path.to_string_lossy().to_string()),
            ..Default::default()
        })
        .await
        .unwrap();

        assert!(result.success);
        let launch_dir = std::fs::read_dir(temp_dir)
            .unwrap()
            .filter_map(Result::ok)
            .map(|entry| entry.path())
            .find(|path| {
                !existing_launch_dirs.contains(path)
                    && path.is_dir()
                    && path
                        .file_name()
                        .is_some_and(|name| name.to_string_lossy().starts_with("GBBoxTemp-"))
                    && path.join("Leander Disk 1.m3u").exists()
            })
            .unwrap();
        let m3u_path = launch_dir.join("Leander Disk 1.m3u");
        assert_eq!(
            std::fs::read_to_string(&m3u_path).unwrap(),
            format!(
                "{}\n{}\n",
                launch_dir
                    .join("leander")
                    .join("Leander Disk 1.st")
                    .to_string_lossy(),
                m3u_path
                    .parent()
                    .unwrap()
                    .join("leander")
                    .join("Leander Disk 2.st")
                    .to_string_lossy()
            )
        );
    }

    #[tokio::test]
    async fn test_launch_emulator_atari800_zip_accepts_tape_and_cart_formats() {
        let dir = tempdir().unwrap();
        let emulator_path = dir.path().join(if cfg!(windows) {
            "retroarch.exe"
        } else {
            "retroarch"
        });
        copy_test_emulator(&emulator_path);

        let core_path = dir.path().join("atari800_libretro.dll");
        std::fs::write(&core_path, b"core").unwrap();

        let zip_path = dir.path().join("atari800-tape-cart.zip");
        write_zip(&zip_path, &[("cassette.cas", b"tape")]);

        let request = LaunchRequest {
            platform_id: Some("atari800".to_string()),
            emulator_profile_id: Some("retroarch-atari800".to_string()),
            emulator_path: emulator_path.to_string_lossy().to_string(),
            rom_path: zip_path.to_string_lossy().to_string(),
            core_path: Some(core_path.to_string_lossy().to_string()),
            ..Default::default()
        };

        let result = launch_emulator(request).await.unwrap();
        assert!(result.success);
    }

    #[tokio::test]
    async fn test_launch_emulator_atari800_retroarch_missing_core_names_platform_and_profile() {
        let dir = tempdir().unwrap();
        let emulator_path = dir.path().join(if cfg!(windows) {
            "retroarch.exe"
        } else {
            "retroarch"
        });
        copy_test_emulator(&emulator_path);

        let rom_path = dir.path().join("game.atr");
        std::fs::write(&rom_path, b"dummy rom").unwrap();

        let request = LaunchRequest {
            platform_id: Some("atari800".to_string()),
            emulator_profile_id: Some("retroarch-atari800".to_string()),
            emulator_path: emulator_path.to_string_lossy().to_string(),
            rom_path: rom_path.to_string_lossy().to_string(),
            core_path: Some(dir.path().join("missing.dll").to_string_lossy().to_string()),
            ..Default::default()
        };

        let error = launch_emulator(request).await.unwrap_err();
        assert!(error.contains("Atari 800 RetroArch"));
    }

    #[tokio::test]
    async fn test_launch_emulator_atari800_altirra_missing_executable_names_platform_and_profile() {
        let dir = tempdir().unwrap();
        let rom_path = dir.path().join("game.atr");
        std::fs::write(&rom_path, b"dummy rom").unwrap();

        let request = LaunchRequest {
            platform_id: Some("atari800".to_string()),
            emulator_profile_id: Some("altirra-atari800".to_string()),
            emulator_path: dir
                .path()
                .join("missing-altirra.exe")
                .to_string_lossy()
                .to_string(),
            rom_path: rom_path.to_string_lossy().to_string(),
            ..Default::default()
        };

        let error = launch_emulator(request).await.unwrap_err();
        assert!(error.contains("Atari 800 Altirra"));
    }

    #[tokio::test]
    async fn test_emulator_profile_atari800_retroarch_success() {
        let dir = tempdir().unwrap();
        let emulator_path = dir.path().join(if cfg!(windows) {
            "retroarch.exe"
        } else {
            "retroarch"
        });
        copy_test_emulator(&emulator_path);
        let core_path = dir.path().join("atari800_libretro.dll");
        std::fs::write(&core_path, b"core").unwrap();

        let request = EmulatorProfileTestRequest {
            platform_id: "atari800".to_string(),
            emulator_profile_id: "retroarch-atari800".to_string(),
            executable_path: emulator_path.to_string_lossy().to_string(),
            core_path: Some(core_path.to_string_lossy().to_string()),
        };

        let result = test_emulator_profile(request).await.unwrap();
        assert!(result.success);
        assert!(result.message.contains("Atari 800 RetroArch"));
    }

    #[tokio::test]
    async fn test_emulator_profile_atari800_retroarch_requires_core() {
        let dir = tempdir().unwrap();
        let emulator_path = dir.path().join(if cfg!(windows) {
            "retroarch.exe"
        } else {
            "retroarch"
        });
        copy_test_emulator(&emulator_path);

        let request = EmulatorProfileTestRequest {
            platform_id: "atari800".to_string(),
            emulator_profile_id: "retroarch-atari800".to_string(),
            executable_path: emulator_path.to_string_lossy().to_string(),
            core_path: None,
        };

        let result = test_emulator_profile(request).await.unwrap();
        assert!(!result.success);
        assert!(result
            .message
            .contains("Atari 800 RetroArch core path is required"));
    }

    #[tokio::test]
    async fn test_emulator_profile_zxspectrum_retroarch_requires_core() {
        let dir = tempdir().unwrap();
        let emulator_path = dir.path().join(if cfg!(windows) {
            "retroarch.exe"
        } else {
            "retroarch"
        });
        copy_test_emulator(&emulator_path);

        let request = EmulatorProfileTestRequest {
            platform_id: "zxspectrum".to_string(),
            emulator_profile_id: "retroarch-zxspectrum".to_string(),
            executable_path: emulator_path.to_string_lossy().to_string(),
            core_path: None,
        };

        let result = test_emulator_profile(request).await.unwrap();
        assert!(!result.success);
        assert!(result
            .message
            .contains("ZX Spectrum RetroArch core path is required"));
    }

    #[tokio::test]
    async fn test_emulator_profile_zxspectrum_spectaculator_success() {
        let dir = tempdir().unwrap();
        let emulator_path = dir.path().join(if cfg!(windows) {
            "Spectaculator.exe"
        } else {
            "spectaculator"
        });
        copy_test_emulator(&emulator_path);

        let request = EmulatorProfileTestRequest {
            platform_id: "zxspectrum".to_string(),
            emulator_profile_id: "spectaculator-zxspectrum".to_string(),
            executable_path: emulator_path.to_string_lossy().to_string(),
            core_path: None,
        };

        let result = test_emulator_profile(request).await.unwrap();
        assert!(result.success);
        assert!(result
            .message
            .contains("ZX Spectrum Spectaculator profile is ready"));
    }

    #[tokio::test]
    async fn test_emulator_profile_c64_vice_preserves_legacy_success() {
        let dir = tempdir().unwrap();
        let emulator_path = dir
            .path()
            .join(if cfg!(windows) { "x64sc.exe" } else { "x64sc" });
        copy_test_emulator(&emulator_path);

        let request = EmulatorProfileTestRequest {
            platform_id: "c64".to_string(),
            emulator_profile_id: "vice-c64".to_string(),
            executable_path: emulator_path.to_string_lossy().to_string(),
            core_path: None,
        };

        let result = test_emulator_profile(request).await.unwrap();
        assert!(result.success);
        assert!(result.message.contains("C64 VICE"));
    }
}
