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
        Some("zxspectrum") => "ZX Spectrum",
        Some("bbcmicro") => "Acorn BBC Micro",
        Some("amiga") => "Commodore Amiga",
        _ => "C64",
    }
}

fn emulator_profile_display_name(profile_id: Option<&str>, is_retroarch: bool) -> &'static str {
    match profile_id {
        Some("altirra-atari800") => "Altirra",
        Some("spectaculator-zxspectrum") => "Spectaculator",
        Some("beebem-bbcmicro") => "BeebEm",
        Some("winuae-amiga") => "WinUAE / UAE",
        Some("retroarch-atari800") if is_retroarch => "RetroArch",
        Some("retroarch-zxspectrum") if is_retroarch => "RetroArch",
        Some("retroarch-bbcmicro") if is_retroarch => "RetroArch",
        Some("retroarch-amiga") if is_retroarch => "RetroArch",
        Some("retroarch-c64") if is_retroarch => "RetroArch",
        Some("vice-c64") => "VICE",
        _ if is_retroarch => "RetroArch",
        _ => "emulator",
    }
}

fn launch_extensions_for_platform(platform_id: Option<&str>) -> &'static [&'static str] {
    match platform_id {
        Some("atari800") => &[
            "atr", "atx", "xfd", "dcm", "cas", "xex", "com", "bin", "car", "rom",
        ],
        Some("zxspectrum") => &["tzx", "tap", "z80", "sna", "szx", "trd", "dsk"],
        Some("bbcmicro") => &["ssd", "dsd", "adl", "adf", "uef", "rom", "bin"],
        Some("amiga") => &["adf", "adz", "dms", "ipf", "lha", "hdf", "hdz"],
        _ => &["d64", "g64", "t64", "tap", "prg", "crt", "nib"],
    }
}

fn retroarch_core_not_found_message(platform_id: Option<&str>, core_path: &str) -> String {
    match platform_id {
        Some("atari800") => format!("Atari 800 RetroArch core file not found: {}", core_path),
        Some("zxspectrum") => format!("ZX Spectrum RetroArch core file not found: {}", core_path),
        Some("bbcmicro") => format!(
            "Acorn BBC Micro RetroArch core file not found: {}",
            core_path
        ),
        Some("amiga") => format!(
            "Commodore Amiga RetroArch core file not found: {}",
            core_path
        ),
        _ => format!("RetroArch Core file not found: {}", core_path),
    }
}

fn retroarch_core_not_file_message(platform_id: Option<&str>, core_path: &str) -> String {
    match platform_id {
        Some("atari800") => format!("Atari 800 RetroArch core path is not a file: {}", core_path),
        Some("zxspectrum") => format!(
            "ZX Spectrum RetroArch core path is not a file: {}",
            core_path
        ),
        Some("bbcmicro") => format!(
            "Acorn BBC Micro RetroArch core path is not a file: {}",
            core_path
        ),
        Some("amiga") => format!(
            "Commodore Amiga RetroArch core path is not a file: {}",
            core_path
        ),
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
    } else if !is_retroarch && !is_spectaculator && !is_beebem && !is_uae {
        if request.true_drive_emulation {
            args.push("-truedrive".to_string());
        }
        if !request.is_pal {
            args.push("-ntsc".to_string());
        }
    }

    let mut file_to_run = String::new();
    if let Some(gid) = &request.game_id {
        use crate::database::get_db_path;
        use rusqlite::Connection;
        if let Ok(conn) = Connection::open(get_db_path()) {
            if let Ok(mut stmt) = conn.prepare("SELECT FileToRun FROM Games WHERE GA_Id = ?") {
                if let Ok(ftr) = stmt.query_row([gid], |row| row.get::<_, String>(0)) {
                    file_to_run = ftr;
                }
            }
        }
    }

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
            extracted_roms.sort();
        }
        let mut primary_rom = None;
        if !file_to_run.is_empty() {
            let target = file_to_run.to_lowercase();
            for r in &extracted_roms {
                if let Some(n) = r.file_name().and_then(|n| n.to_str()) {
                    if n.to_lowercase() == target {
                        primary_rom = Some(r.clone());
                        break;
                    }
                }
            }
        }
        let resolved_primary_rom =
            primary_rom.unwrap_or_else(|| extracted_roms.first().unwrap().clone());

        if is_retroarch {
            if let Some(cp) = &request.core_path {
                if !cp.is_empty() {
                    args.push("-L".to_string());
                    args.push(cp.clone());
                }
            }
            if extracted_roms.len() > 1 {
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
            args.push(rom.to_string_lossy().to_string());
        } else if is_altirra {
            push_altirra_rom_args(&mut args, &rom);
        } else if is_uae {
            push_uae_rom_args(&mut args, &[rom]);
        } else if is_spectaculator || is_beebem {
            args.push(rom.to_string_lossy().to_string());
        } else {
            args.push("-autostart".to_string());
            args.push(rom.to_string_lossy().to_string());
        }
    }

    if std::env::var("VIC40_DEBUG_LAUNCH").is_ok() {
        println!("[DEBUG LAUNCH] Emulator: {}", emulator.to_string_lossy());
        println!("[DEBUG LAUNCH] Switches: {:?}", args);
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
                "-0".to_string(),
                "D:/Temp/D-Generation (AGA)_Disk1.adf".to_string(),
                "-1".to_string(),
                "D:/Temp/D-Generation (AGA)_Disk2.adf".to_string(),
                "-diskswapper=D:/Temp/D-Generation (AGA)_Disk1.adf,D:/Temp/D-Generation (AGA)_Disk2.adf".to_string(),
            ]
        );
    }

    #[test]
    fn test_retroarch_m3u_lists_extracted_amiga_disks_in_order() {
        let dir = tempdir().unwrap();
        let disk_1 = dir.path().join("D-Generation (AGA)_Disk1.adf");
        let disk_2 = dir.path().join("D-Generation (AGA)_Disk2.adf");
        std::fs::write(&disk_1, b"disk1").unwrap();
        std::fs::write(&disk_2, b"disk2").unwrap();

        let m3u_path = write_retroarch_m3u(dir.path(), &disk_1, &[disk_1.clone(), disk_2.clone()])
            .unwrap();

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
