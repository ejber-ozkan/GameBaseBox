//! Choosing the primary file among extracted launch files and writing multi-disk
//! playlists (VICE fliplists, RetroArch .m3u). Disk 1 / the main game always comes first.

use std::io::Write;
use std::path::{Path, PathBuf};

pub(super) fn find_matching_primary_rom(
    extracted_roms: &[PathBuf],
    file_to_run: &str,
) -> Option<PathBuf> {
    if file_to_run.is_empty() {
        return None;
    }
    let normalized = file_to_run.replace('\\', "/");
    let target_filename = normalized
        .rsplit('/')
        .next()
        .unwrap_or(&normalized)
        .to_lowercase();
    let target_path_normalized = normalized.to_lowercase();

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

pub(super) fn natural_disk_sort_key(path: &Path) -> (u32, u32, String) {
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

pub(super) fn write_vice_fliplist(
    writer: &mut impl Write,
    rom_files: &[PathBuf],
) -> std::io::Result<()> {
    writeln!(writer, "# Vice fliplist file")?;
    writeln!(writer, "UNIT 8")?;
    for rom_file in rom_files {
        writeln!(writer, "{}", rom_file.to_string_lossy())?;
    }
    writer.flush()
}

pub(super) fn write_retroarch_m3u(
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
