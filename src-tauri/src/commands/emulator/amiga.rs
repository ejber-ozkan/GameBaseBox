//! Commodore Amiga: WHDLoad slaves, multi-disk ordering across sibling ZIPs, and
//! WinUAE / FS-UAE / Amiberry arguments.

use std::path::{Path, PathBuf};

pub(super) fn is_amiga_slave(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .is_some_and(|ext| ext.eq_ignore_ascii_case("slave"))
}

pub(super) fn amiga_disk_sort_key(path: &Path) -> (u32, String) {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    let name = path
        .file_stem()
        .and_then(|name| name.to_str())
        .unwrap_or("")
        .to_lowercase();

    // Prioritize .slave files (priority 0) over floppy disks (priority 1)
    let priority = if ext == "slave" { 0 } else { 1 };

    let disk_number =
        if name.contains("disk1") || name.contains("disk 1") || name.contains("disk_1") {
            1
        } else if let Some((_, rest)) = name.rsplit_once("_disk") {
            rest.parse::<u32>().unwrap_or(999)
        } else {
            999
        };

    (priority * 1000 + disk_number, name)
}

pub(super) fn collect_amiga_sibling_disk_archives(rom_path: &Path) -> Vec<PathBuf> {
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

pub(super) fn push_uae_rom_args(args: &mut Vec<String>, rom_files: &[PathBuf]) {
    args.push("-G".to_string());

    if rom_files.is_empty() {
        return;
    }

    if let Some(slave_path) = rom_files.iter().find(|p| is_amiga_slave(p)) {
        if let Some(parent_dir) = slave_path.parent() {
            args.push("-s".to_string());
            args.push(format!(
                "filesystem2=rw,DH1:DH1:{},0",
                parent_dir.to_string_lossy()
            ));
            args.push("-s".to_string());
            args.push(format!(
                "filesystem=rw,DH1:{}",
                parent_dir.to_string_lossy()
            ));
        }
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

pub(super) fn push_uae_gemus_args(args: &mut Vec<String>, gemus: &str) {
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
