use super::*;
use std::io::Write;
use crate::test_helpers::DbPathGuard;

#[test]
fn test_vice_fliplist_preserves_bytes_paths_and_disk_order() {
    let disks = vec![PathBuf::from("/media/Game Disk 1.d64"), PathBuf::from("/media/Savé Disk.d64")];
    let mut output = Vec::new();
    write_vice_fliplist(&mut output, &disks).unwrap();
    assert_eq!(output, "# Vice fliplist file\nUNIT 8\n/media/Game Disk 1.d64\n/media/Savé Disk.d64\n".as_bytes());
}

struct FailingFliplistSink {
    remaining: usize,
    fail_flush: bool,
}

impl Write for FailingFliplistSink {
    fn write(&mut self, bytes: &[u8]) -> std::io::Result<usize> {
        if self.remaining == 0 {
            return Err(std::io::Error::new(std::io::ErrorKind::PermissionDenied, "synthetic fliplist write failure"));
        }
        let written = bytes.len().min(self.remaining);
        self.remaining -= written;
        Ok(written)
    }

    fn flush(&mut self) -> std::io::Result<()> {
        if self.fail_flush {
            Err(std::io::Error::other("synthetic fliplist flush failure"))
        } else {
            Ok(())
        }
    }
}

#[test]
fn test_vice_fliplist_returns_header_unit_and_disk_write_errors() {
    for remaining in [0, 21, 28, 35] {
        let mut sink = FailingFliplistSink { remaining, fail_flush: false };
        let error = write_vice_fliplist(&mut sink, &[PathBuf::from("/media/Game Disk 1.d64")]).unwrap_err();
        assert_eq!(error.kind(), std::io::ErrorKind::PermissionDenied);
        assert!(error.to_string().contains("synthetic fliplist write failure"));
    }
}

#[test]
fn test_vice_fliplist_returns_flush_errors() {
    let mut sink = FailingFliplistSink { remaining: usize::MAX, fail_flush: true };
    let error = write_vice_fliplist(&mut sink, &[]).unwrap_err();
    assert!(error.to_string().contains("synthetic fliplist flush failure"));
}

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
    let _env = DbPathGuard::set(&db_path);
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
    super::super::vice_compat::seed_test_capabilities(target);
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
    let _env = DbPathGuard::set(&db_path);
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
async fn test_launch_emulator_atarist_retroarch_zip_creates_m3u_for_stx_and_msa_disks() {
    let dir = tempdir().unwrap();
    let emulator_path = dir.path().join(if cfg!(windows) {
        "retroarch.exe"
    } else {
        "retroarch"
    });
    copy_test_emulator(&emulator_path);

    let core_path = dir.path().join("hatari_libretro.dll");
    std::fs::write(&core_path, b"core").unwrap();

    // 1. STX preservation disk
    let stx_zip_path = dir.path().join("goldrunner_stx.zip");
    write_zip(&stx_zip_path, &[("Goldrunner.stx", b"stx disk")]);

    let result = launch_emulator(LaunchRequest {
        platform_id: Some("atarist".to_string()),
        emulator_profile_id: Some("retroarch-atarist".to_string()),
        emulator_path: emulator_path.to_string_lossy().to_string(),
        rom_path: stx_zip_path.to_string_lossy().to_string(),
        core_path: Some(core_path.to_string_lossy().to_string()),
        ..Default::default()
    })
    .await
    .unwrap();
    assert!(result.success);

    // 2. MSA compilation disk (Automation / DBUG style)
    let msa_zip_path = dir.path().join("automation_000.zip");
    write_zip(&msa_zip_path, &[("000.msa", b"msa disk")]);

    let result_msa = launch_emulator(LaunchRequest {
        platform_id: Some("atarist".to_string()),
        emulator_profile_id: Some("retroarch-atarist".to_string()),
        emulator_path: emulator_path.to_string_lossy().to_string(),
        rom_path: msa_zip_path.to_string_lossy().to_string(),
        core_path: Some(core_path.to_string_lossy().to_string()),
        ..Default::default()
    })
    .await
    .unwrap();
    assert!(result_msa.success);
}

#[tokio::test]
async fn test_launch_emulator_atarist_harddisk_requires_boot_disk() {
    let dir = tempdir().unwrap();
    let emulator_path = dir.path().join(if cfg!(windows) {
        "hatari.exe"
    } else {
        "hatari"
    });
    copy_test_emulator(&emulator_path);

    let hd_zip = dir.path().join("AFTERBUR.ZIP");
    write_zip(&hd_zip, &[("DESKTOP.INF", b"inf"), ("RUNME.TOS", b"tos")]);

    // Launch without boot_disk_path
    let err = launch_emulator(LaunchRequest {
        platform_id: Some("atarist".to_string()),
        emulator_profile_id: Some("hatari-atarist".to_string()),
        emulator_path: emulator_path.to_string_lossy().to_string(),
        rom_path: hd_zip.to_string_lossy().to_string(),
        boot_disk_path: None,
        ..Default::default()
    })
    .await
    .unwrap_err();

    assert!(err.contains("boot.st"));
}

#[tokio::test]
async fn test_launch_emulator_atarist_harddisk_launches_with_boot_disk() {
    let dir = tempdir().unwrap();
    let emulator_path = dir.path().join(if cfg!(windows) {
        "hatari.exe"
    } else {
        "hatari"
    });
    copy_test_emulator(&emulator_path);

    let boot_disk = dir.path().join("boot.st");
    std::fs::write(&boot_disk, b"boot disk image").unwrap();

    let hd_zip = dir.path().join("AFTERBUR.ZIP");
    write_zip(&hd_zip, &[("DESKTOP.INF", b"inf"), ("RUNME.TOS", b"tos")]);

    let result = launch_emulator(LaunchRequest {
        platform_id: Some("atarist".to_string()),
        emulator_profile_id: Some("hatari-atarist".to_string()),
        emulator_path: emulator_path.to_string_lossy().to_string(),
        rom_path: hd_zip.to_string_lossy().to_string(),
        boot_disk_path: Some(boot_disk.to_string_lossy().to_string()),
        ..Default::default()
    })
    .await
    .unwrap();

    assert!(result.success);
}

#[tokio::test]
async fn test_launch_emulator_atarist_harddisk_retroarch_launches_with_gem_and_boot_disk() {
    let dir = tempdir().unwrap();
    let emulator_path = dir.path().join(if cfg!(windows) {
        "retroarch.exe"
    } else {
        "retroarch"
    });
    copy_test_emulator(&emulator_path);

    let core_path = dir.path().join("hatari_libretro.dll");
    std::fs::write(&core_path, b"core").unwrap();

    // Create an existing retroarch-core-options.cfg
    let opt_path = dir.path().join("retroarch-core-options.cfg");
    std::fs::write(&opt_path, "hatari_autoload_config = \"false\"\n").unwrap();

    let boot_disk = dir.path().join("boot.st");
    std::fs::write(&boot_disk, b"boot disk image").unwrap();

    let hd_zip = dir.path().join("AFTERBUR.ZIP");
    write_zip(&hd_zip, &[("DESKTOP.INF", b"inf"), ("RUNME.TOS", b"tos")]);

    let result = launch_emulator(LaunchRequest {
        platform_id: Some("atarist".to_string()),
        emulator_profile_id: Some("retroarch-atarist".to_string()),
        emulator_path: emulator_path.to_string_lossy().to_string(),
        core_path: Some(core_path.to_string_lossy().to_string()),
        rom_path: hd_zip.to_string_lossy().to_string(),
        boot_disk_path: Some(boot_disk.to_string_lossy().to_string()),
        ..Default::default()
    })
    .await
    .unwrap();

    assert!(result.success);

    // Verify that system/hatari/BOOT.ST was created
    let system_hatari_boot = dir.path().join("system").join("hatari").join("BOOT.ST");
    assert!(system_hatari_boot.exists());

    // Verify that system/hatari/hatari.cfg was created
    let system_hatari_cfg = dir.path().join("system").join("hatari").join("hatari.cfg");
    assert!(system_hatari_cfg.exists());
    let cfg_content = std::fs::read_to_string(&system_hatari_cfg).unwrap();
    assert!(cfg_content.contains("bBootFromHardDisk = TRUE"));
    assert!(cfg_content.contains("bUseHardDiskDirectory = TRUE"));

    // Verify that retroarch-core-options.cfg was updated
    let opt_content = std::fs::read_to_string(&opt_path).unwrap();
    assert!(opt_content.contains("hatari_autoload_config = \"true\""));
    assert!(opt_content.contains("hatari_boot_hd = \"true\""));
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

#[test]
fn test_amiga_disk_sort_key_prioritizes_whdload_slaves() {
    let slave = PathBuf::from("C:/Turrican2/Turrican2.Slave");
    let info = PathBuf::from("C:/Turrican2/Turrican2.info");
    let disk1 = PathBuf::from("C:/Turrican2/Turrican2_Disk1.adf");

    let slave_key = amiga_disk_sort_key(&slave);
    let disk1_key = amiga_disk_sort_key(&disk1);
    let info_key = amiga_disk_sort_key(&info);

    assert!(slave_key < disk1_key);
    assert!(slave_key < info_key);
}

#[test]
fn test_push_uae_rom_args_mounts_whdload_slave_directory() {
    let mut args = Vec::new();
    let slave = PathBuf::from("C:/Games/Turrican2/Turrican2.Slave");
    push_uae_rom_args(&mut args, &[slave]);

    assert!(args.contains(&"-G".to_string()));
    assert!(args.iter().any(|arg| arg.contains("filesystem2=rw,DH1:DH1:")));
    assert!(args.iter().any(|arg| arg.contains("filesystem=rw,DH1:")));
}

#[test]
fn test_resolve_existing_rom_path_finds_extras_subfolder() {
    let temp = tempdir().unwrap();
    let extras_whd = temp.path().join("Extras").join("WHDLoad").join("T");
    std::fs::create_dir_all(&extras_whd).unwrap();
    let zip_file = extras_whd.join("Turrican2.zip");
    std::fs::write(&zip_file, b"test zip").unwrap();

    // Path missing the "Extras" segment
    let missing_extras_path = temp
        .path()
        .join("WHDLoad")
        .join("T")
        .join("Turrican2.zip");
    let resolved = resolve_existing_rom_path(&missing_extras_path.to_string_lossy());

    assert_eq!(resolved, zip_file);
}

#[test]
fn test_resolve_existing_rom_path_finds_atarist_extras_subfolder() {
    let temp = tempdir().unwrap();
    let extras_stx = temp.path().join("Extras").join("STX");
    std::fs::create_dir_all(&extras_stx).unwrap();
    let zip_file = extras_stx.join("Goldrunner.zip");
    std::fs::write(&zip_file, b"test zip").unwrap();

    let missing_extras_path = temp.path().join("STX").join("Goldrunner.zip");
    let resolved = resolve_existing_rom_path(&missing_extras_path.to_string_lossy());
    assert_eq!(resolved, zip_file);

    let extras_hd = temp.path().join("Extras").join("HardDisk");
    std::fs::create_dir_all(&extras_hd).unwrap();
    let hd_zip = extras_hd.join("GOLDRUNR.ZIP");
    std::fs::write(&hd_zip, b"hd zip").unwrap();

    let missing_hd_path = temp.path().join("HardDisk").join("GOLDRUNR.ZIP");
    let resolved_hd = resolve_existing_rom_path(&missing_hd_path.to_string_lossy());
    assert_eq!(resolved_hd, hd_zip);
}

#[test]
fn test_bbcmicro_media_sort_key_prioritizes_ssd_over_uef_and_secondary_disks() {
    let mut files = vec![
        PathBuf::from("ChuckieEgg_B_Tape.uef"),
        PathBuf::from("ChuckieEgg_B_Disk2.ssd"),
        PathBuf::from("ChuckieEgg_B_Disk1.ssd"),
        PathBuf::from("ChuckieEgg_B_Cart.rom"),
    ];

    files.sort_by_key(|p| bbcmicro_media_sort_key(p));

    assert_eq!(
        files,
        vec![
            PathBuf::from("ChuckieEgg_B_Disk1.ssd"),
            PathBuf::from("ChuckieEgg_B_Disk2.ssd"),
            PathBuf::from("ChuckieEgg_B_Tape.uef"),
            PathBuf::from("ChuckieEgg_B_Cart.rom"),
        ]
    );
}

#[test]
fn test_write_mame_bbcmicro_cmd_floppy_disk_and_multi_disk() {
    let dir = tempdir().unwrap();
    let disk1 = dir.path().join("ChuckieEgg_Disk1.ssd");
    let disk2 = dir.path().join("ChuckieEgg_Disk2.ssd");
    std::fs::write(&disk1, b"disk1").unwrap();
    std::fs::write(&disk2, b"disk2").unwrap();

    let cmd_path = write_mame_bbcmicro_cmd(
        dir.path(),
        &disk1,
        &[disk1.clone(), disk2.clone()],
        "",
        Some(dir.path()),
    )
    .unwrap();

    let content = std::fs::read_to_string(cmd_path).unwrap();
    assert!(content.starts_with("bbcb"));
    assert!(content.contains(&format!("-rompath \"{}\"", dir.path().to_string_lossy().replace('\\', "/"))));
    assert!(content.contains("-autoboot_delay 2"));
    assert!(content.contains("-autoboot_command \"*EXEC !BOOT\\n\""));
    assert!(content.contains(&format!("-flop1 \"{}\"", disk1.to_string_lossy().replace('\\', "/"))));
    assert!(content.contains(&format!("-flop2 \"{}\"", disk2.to_string_lossy().replace('\\', "/"))));
}

#[test]
fn test_write_mame_bbcmicro_cmd_cassette_uef() {
    let dir = tempdir().unwrap();
    let tape = dir.path().join("AticAtac_RUN_B.hq.uef");
    std::fs::write(&tape, b"tape").unwrap();

    let cmd_path = write_mame_bbcmicro_cmd(
        dir.path(),
        &tape,
        &[tape.clone()],
        "",
        None,
    )
    .unwrap();

    let content = std::fs::read_to_string(cmd_path).unwrap();
    assert!(content.starts_with("bbcb"));
    assert!(content.contains("-autoboot_delay 2"));
    assert!(content.contains("-autoboot_command \"*TAPE\\nPAGE=&E00\\n*RUN\\n\""));
    assert!(content.contains(&format!("-cass \"{}\"", tape.to_string_lossy().replace('\\', "/"))));
}

#[test]
fn test_write_mame_bbcmicro_cmd_electron_gemus() {
    let dir = tempdir().unwrap();
    let tape = dir.path().join("ChuckieEgg_E.uef");
    std::fs::write(&tape, b"tape").unwrap();

    let cmd_path = write_mame_bbcmicro_cmd(
        dir.path(),
        &tape,
        &[tape.clone()],
        "emu=ElectrEm\r\ntape=normal",
        None,
    )
    .unwrap();

    let content = std::fs::read_to_string(cmd_path).unwrap();
    assert!(content.starts_with("electron"));
    assert!(content.contains("-autoboot_delay 2"));
    assert!(content.contains("-autoboot_command \"*TAPE\\n*RUN\\n\""));
    assert!(content.contains(&format!("-cass \"{}\"", tape.to_string_lossy().replace('\\', "/"))));
}

#[test]
fn test_write_mame_bbcmicro_cmd_model_master_and_disk_cat() {
    let dir = tempdir().unwrap();
    let disk = dir.path().join("Game.dsd");
    std::fs::write(&disk, b"disk").unwrap();

    let cmd_path = write_mame_bbcmicro_cmd(
        dir.path(),
        &disk,
        &[disk.clone()],
        "model=05\r\ndisk=cat",
        None,
    )
    .unwrap();

    let content = std::fs::read_to_string(cmd_path).unwrap();
    assert!(content.starts_with("bbcm"));
    assert!(content.contains("-autoboot_delay 2"));
    assert!(content.contains("-autoboot_command \"*CAT\\n\""));
    assert!(content.contains(&format!("-flop1 \"{}\"", disk.to_string_lossy().replace('\\', "/"))));
}

#[tokio::test]
async fn test_launch_emulator_bbcmicro_retroarch_zip_creates_cmd_and_ignores_txt() {
    let dir = tempdir().unwrap();
    let emulator_path = dir.path().join(if cfg!(windows) {
        "retroarch.exe"
    } else {
        "retroarch"
    });
    copy_test_emulator(&emulator_path);

    let core_path = dir.path().join("mame_libretro.dll");
    std::fs::write(&core_path, b"core").unwrap();

    let zip_path = dir.path().join("ChuckieEgg_B.zip");
    write_zip(
        &zip_path,
        &[
            ("ChuckieEgg_B.ssd", b"disk data"),
            ("Instructions.txt", b"text notes"),
            ("Readme.nfo", b"nfo notes"),
        ],
    );

    let request = LaunchRequest {
        platform_id: Some("bbcmicro".to_string()),
        emulator_profile_id: Some("retroarch-bbcmicro".to_string()),
        emulator_path: emulator_path.to_string_lossy().to_string(),
        rom_path: zip_path.to_string_lossy().to_string(),
        core_path: Some(core_path.to_string_lossy().to_string()),
        ..Default::default()
    };

    let result = launch_emulator(request).await.unwrap();
    assert!(result.success);
}

#[tokio::test]
async fn test_launch_emulator_bbcmicro_retroarch_b2_core_passes_rom_directly() {
    let dir = tempdir().unwrap();
    let emulator_path = dir.path().join(if cfg!(windows) {
        "retroarch.exe"
    } else {
        "retroarch"
    });
    copy_test_emulator(&emulator_path);

    let core_path = dir.path().join("b2_libretro.dll");
    std::fs::write(&core_path, b"core").unwrap();

    let zip_path = dir.path().join("AticAtac_RUN_B.zip");
    write_zip(
        &zip_path,
        &[
            ("AticAtac_RUN_B.hq.uef", b"tape data"),
            ("Instructions.txt", b"text notes"),
        ],
    );

    let request = LaunchRequest {
        platform_id: Some("bbcmicro".to_string()),
        emulator_profile_id: Some("retroarch-bbcmicro".to_string()),
        emulator_path: emulator_path.to_string_lossy().to_string(),
        rom_path: zip_path.to_string_lossy().to_string(),
        core_path: Some(core_path.to_string_lossy().to_string()),
        ..Default::default()
    };

    let result = launch_emulator(request).await.unwrap();
    assert!(result.success);
    assert!(!is_retroarch_mame_core(Some("b2_libretro.dll")));
}

#[tokio::test]
async fn test_bbcmicro_companion_disk_resolution() {
    let dir = tempdir().unwrap();
    let games_dir = dir.path().join("Games").join("A");
    let extras_disks_dir = dir.path().join("Extras").join("Disks").join("A");
    std::fs::create_dir_all(&games_dir).unwrap();
    std::fs::create_dir_all(&extras_disks_dir).unwrap();

    let tape_zip = games_dir.join("AticAtac_RUN_B.zip");
    write_zip(
        &tape_zip,
        &[("AticAtac_RUN_B.hq.uef", b"tape data")],
    );

    let disk_zip = extras_disks_dir.join("AticAtac_B.zip");
    write_zip(
        &disk_zip,
        &[("AticAtac.ssd", b"disk data")],
    );

    let companion = find_bbcmicro_companion_disk_archive(&tape_zip);
    assert_eq!(companion, Some(disk_zip));
}

#[test]
fn test_resolve_emulator_binary_app_bundle_with_companion_bin() {
    let dir = tempdir().unwrap();
    let app_dir = dir.path().join("x64sc.app");
    let bin_dir = dir.path().join("bin");
    std::fs::create_dir_all(&app_dir).unwrap();
    std::fs::create_dir_all(&bin_dir).unwrap();

    let companion_bin = bin_dir.join("x64sc");
    std::fs::write(&companion_bin, b"launcher").unwrap();

    let resolved = resolve_emulator_binary(
        &app_dir.to_string_lossy(),
        Some("vice-c64"),
        Some("c64"),
        || "not found".to_string(),
    ).unwrap();

    assert_eq!(resolved, companion_bin);
}

#[test]
fn test_resolve_emulator_binary_standalone_app_bundle() {
    let dir = tempdir().unwrap();
    let app_dir = dir.path().join("RetroArch.app");
    let macos_dir = app_dir.join("Contents").join("MacOS");
    std::fs::create_dir_all(&macos_dir).unwrap();

    let macos_binary = macos_dir.join("RetroArch");
    std::fs::write(&macos_binary, b"binary").unwrap();

    let resolved = resolve_emulator_binary(
        &app_dir.to_string_lossy(),
        Some("retroarch-c64"),
        Some("c64"),
        || "not found".to_string(),
    ).unwrap();

    assert_eq!(resolved, macos_binary);
}

#[test]
fn test_resolve_emulator_binary_parent_directory_with_bin() {
    let dir = tempdir().unwrap();
    let vice_dir = dir.path().join("vice-arm64-gtk3-3.9");
    let bin_dir = vice_dir.join("bin");
    std::fs::create_dir_all(&bin_dir).unwrap();

    let binary = bin_dir.join("x64sc");
    std::fs::write(&binary, b"launcher").unwrap();

    let resolved = resolve_emulator_binary(
        &vice_dir.to_string_lossy(),
        Some("vice-c64"),
        Some("c64"),
        || "not found".to_string(),
    ).unwrap();

    assert_eq!(resolved, binary);
}

#[test]
fn test_resolve_emulator_binary_directory_with_app_bundle() {
    let dir = tempdir().unwrap();
    let parent_dir = dir.path().join("emulators");
    let app_dir = parent_dir.join("RetroArch.app");
    let macos_dir = app_dir.join("Contents").join("MacOS");
    std::fs::create_dir_all(&macos_dir).unwrap();

    let macos_binary = macos_dir.join("RetroArch");
    std::fs::write(&macos_binary, b"binary").unwrap();

    let resolved = resolve_emulator_binary(
        &parent_dir.to_string_lossy(),
        Some("retroarch-c64"),
        Some("c64"),
        || "not found".to_string(),
    ).unwrap();

    assert_eq!(resolved, macos_binary);
}

#[test]
fn test_resolve_emulator_binary_direct_file_and_quotes() {
    let dir = tempdir().unwrap();
    let binary_path = dir.path().join("x64sc.exe");
    std::fs::write(&binary_path, b"exe").unwrap();

    // Direct path
    let resolved = resolve_emulator_binary(
        &binary_path.to_string_lossy(),
        Some("vice-c64"),
        Some("c64"),
        || "not found".to_string(),
    ).unwrap();
    assert_eq!(resolved, binary_path);

    // Quoted path
    let quoted = format!("\"{}\"", binary_path.to_string_lossy());
    let resolved_quoted = resolve_emulator_binary(
        &quoted,
        Some("vice-c64"),
        Some("c64"),
        || "not found".to_string(),
    ).unwrap();
    assert_eq!(resolved_quoted, binary_path);
}

#[test]
fn test_resolve_emulator_binary_not_found_and_empty_dir() {
    let err = resolve_emulator_binary(
        "/does/not/exist/at/all",
        Some("vice-c64"),
        Some("c64"),
        || "Path not found custom".to_string(),
    ).unwrap_err();
    assert_eq!(err, "Path not found custom");

    let dir = tempdir().unwrap();
    let empty_dir = dir.path().join("empty");
    std::fs::create_dir_all(&empty_dir).unwrap();

    let err_dir = resolve_emulator_binary(
        &empty_dir.to_string_lossy(),
        Some("vice-c64"),
        Some("c64"),
        || "not found".to_string(),
    ).unwrap_err();
    assert!(err_dir.contains("No supported emulator binary found in directory"));
}

#[tokio::test]
async fn test_emulator_profile_c64_vice_supports_app_bundle() {
    let dir = tempdir().unwrap();
    let app_dir = dir.path().join("x64sc.app");
    let bin_dir = dir.path().join("bin");
    std::fs::create_dir_all(&app_dir).unwrap();
    std::fs::create_dir_all(&bin_dir).unwrap();

    let companion_bin = bin_dir.join("x64sc");
    copy_test_emulator(&companion_bin);

    let request = EmulatorProfileTestRequest {
        platform_id: "c64".to_string(),
        emulator_profile_id: "vice-c64".to_string(),
        executable_path: app_dir.to_string_lossy().to_string(),
        core_path: None,
    };

    let result = test_emulator_profile(request).await.unwrap();
    assert!(result.success);
    assert!(result.message.contains("C64 VICE"));
}

#[tokio::test]
async fn test_launch_emulator_supports_app_bundle_with_companion_bin() {
    let dir = tempdir().unwrap();
    let app_dir = dir.path().join("x64sc.app");
    let bin_dir = dir.path().join("bin");
    std::fs::create_dir_all(&app_dir).unwrap();
    std::fs::create_dir_all(&bin_dir).unwrap();

    let companion_bin = bin_dir.join("x64sc");
    copy_test_emulator(&companion_bin);

    let rom_path = dir.path().join("game.d64");
    std::fs::write(&rom_path, b"dummy rom").unwrap();

    let request = LaunchRequest {
        platform_id: Some("c64".to_string()),
        emulator_profile_id: Some("vice-c64".to_string()),
        emulator_path: app_dir.to_string_lossy().to_string(),
        rom_path: rom_path.to_string_lossy().to_string(),
        true_drive_emulation: true,
        is_pal: false,
        ..Default::default()
    };

    let result = launch_emulator(request).await.unwrap();
    assert!(result.success);
    assert!(result.message.to_lowercase().contains("x64sc"));
}

#[tokio::test(flavor = "current_thread")]
async fn test_launch_emulator_rejects_paths_outside_configured_settings() {
    let dir = tempfile::tempdir().unwrap();
    let emulator = dir.path().join("emu").join("hatari");
    let games = dir.path().join("games");
    let outside = dir.path().join("elsewhere");
    for folder in [emulator.parent().unwrap(), games.as_path(), outside.as_path()] {
        std::fs::create_dir_all(folder).unwrap();
    }
    std::fs::write(&emulator, b"#!/bin/sh\n").unwrap();
    std::fs::write(games.join("Game.st"), b"rom").unwrap();
    std::fs::write(outside.join("Other.st"), b"rom").unwrap();

    let _allowed = crate::commands::settings::AllowedPathsGuard::set(&serde_json::json!({
        "platformSettings": { "atarist": {
            "folders": { "gamesPath": games.to_string_lossy() },
            "emulator": { "executablePaths": { "hatari-atarist": emulator.to_string_lossy() } }
        } }
    }));
    let request = |rom: PathBuf| LaunchRequest {
        platform_id: Some("atarist".into()),
        emulator_profile_id: Some("hatari-atarist".into()),
        emulator_path: emulator.to_string_lossy().to_string(),
        rom_path: rom.to_string_lossy().to_string(),
        ..Default::default()
    };

    let error = launch_emulator(request(outside.join("Other.st"))).await.unwrap_err();
    assert!(error.contains("outside the folders configured in Settings"), "{error}");
    assert!(plan_launch(&request(games.join("Game.st"))).is_ok());
}
