//! Characterization tests for emulator launch argument assembly.
//!
//! Each case builds a temporary tree of fake emulator binaries, ROMs and ZIP archives,
//! asks `plan_launch` for the command line (nothing is spawned) and compares the
//! normalized arguments, plus the contents of any playlist/launcher/config files the
//! plan wrote, with `test-fixtures/launch_plans.json`.
//!
//! Regenerate the fixture only for an intended behaviour change:
//! `UPDATE_LAUNCH_PLAN_FIXTURES=1 cargo test launch_plan_fixtures`

use super::emulator::plan_launch;
use crate::models::LaunchRequest;
use std::collections::BTreeMap;
use std::io::Write;
use std::path::{Path, PathBuf};

const FIXTURE: &str = concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/test-fixtures/launch_plans.json"
);

enum Rom {
    File(&'static str),
    Dir(&'static str, &'static [&'static str]),
    Zip(&'static str, &'static [&'static str]),
}

struct Case {
    name: &'static str,
    platform: &'static str,
    profile: &'static str,
    emulator: &'static str,
    rom: Rom,
    extra_zips: &'static [(&'static str, &'static [&'static str])],
    core: Option<&'static str>,
    boot_disk: bool,
    pal: bool,
    true_drive: bool,
}

const fn case(
    name: &'static str,
    platform: &'static str,
    profile: &'static str,
    emulator: &'static str,
    rom: Rom,
) -> Case {
    Case {
        name,
        platform,
        profile,
        emulator,
        rom,
        extra_zips: &[],
        core: None,
        boot_disk: false,
        pal: true,
        true_drive: false,
    }
}

fn cases() -> Vec<Case> {
    let mame = Some("mame_libretro.so");
    vec![
        Case {
            true_drive: true,
            pal: false,
            ..case(
                "vic20-vice-direct-ntsc-truedrive",
                "vic20",
                "vice-vic20",
                "xvic",
                Rom::File("Game.prg"),
            )
        },
        case(
            "vic20-vice-zip-two-disks-fliplist",
            "vic20",
            "vice-vic20",
            "xvic",
            Rom::Zip(
                "Game.zip",
                &["Game (Disk 2).d64", "Game (Disk 1).d64", "readme.txt"],
            ),
        ),
        case(
            "c128-vice-direct",
            "c128",
            "vice-c128",
            "x128",
            Rom::File("Game.d71"),
        ),
        case(
            "pet-vice-direct",
            "pet",
            "vice-pet",
            "xpet",
            Rom::File("Game.prg"),
        ),
        case(
            "atari800-altirra-atr",
            "atari800",
            "altirra-atari800",
            "Altirra64.exe",
            Rom::File("Game.atr"),
        ),
        Case {
            pal: false,
            ..case(
                "atari800-altirra-zip-cart-ntsc",
                "atari800",
                "altirra-atari800",
                "Altirra64.exe",
                Rom::Zip("Game.zip", &["Game.car"]),
            )
        },
        Case {
            core: Some("atari800_libretro.so"),
            ..case(
                "atari800-retroarch-zip",
                "atari800",
                "retroarch-atari800",
                "retroarch",
                Rom::Zip("Game.zip", &["Game.xex"]),
            )
        },
        case(
            "atari5200-altirra-zip",
            "atari5200",
            "altirra-atari5200",
            "Altirra64.exe",
            Rom::Zip("Game.zip", &["Game.a52"]),
        ),
        Case {
            core: Some("prosystem_libretro.so"),
            ..case(
                "atari7800-retroarch-direct",
                "atari7800",
                "retroarch-atari7800",
                "retroarch",
                Rom::File("Game.a78"),
            )
        },
        case(
            "zxspectrum-spectaculator",
            "zxspectrum",
            "spectaculator-zxspectrum",
            "Spectaculator.exe",
            Rom::File("Game.tzx"),
        ),
        case(
            "bbcmicro-beebem-direct",
            "bbcmicro",
            "beebem-bbcmicro",
            "BeebEm.exe",
            Rom::File("Game.ssd"),
        ),
        Case {
            core: mame,
            ..case(
                "bbcmicro-retroarch-mame-zip",
                "bbcmicro",
                "retroarch-bbcmicro",
                "retroarch",
                Rom::Zip("Game.zip", &["Game.ssd", "Game (Side B).ssd", "notes.txt"]),
            )
        },
        Case {
            core: Some("b2_libretro.so"),
            ..case(
                "bbcmicro-retroarch-b2-direct",
                "bbcmicro",
                "retroarch-bbcmicro",
                "retroarch",
                Rom::File("Game.ssd"),
            )
        },
        Case {
            core: mame,
            ..case(
                "bbcmicro-retroarch-mame-direct",
                "bbcmicro",
                "retroarch-bbcmicro",
                "retroarch",
                Rom::File("Game.ssd"),
            )
        },
        Case {
            extra_zips: &[("Game_disk.zip", &["Game.ssd"])],
            core: mame,
            ..case(
                "bbcmicro-retroarch-uef-zip-with-companion-disk",
                "bbcmicro",
                "retroarch-bbcmicro",
                "retroarch",
                Rom::Zip("Game.zip", &["Game.uef"]),
            )
        },
        Case {
            extra_zips: &[("Game_Disk2.zip", &["Game Disk2.adf"])],
            ..case(
                "amiga-winuae-zip-sibling-disks",
                "amiga",
                "winuae-amiga",
                "winuae.exe",
                Rom::Zip("Game_Disk1.zip", &["Game Disk1.adf"]),
            )
        },
        case(
            "amiga-winuae-whdload",
            "amiga",
            "winuae-amiga",
            "winuae.exe",
            Rom::Zip("Game.zip", &["Game/Game.slave", "Game/data.dat"]),
        ),
        Case {
            core: Some("puae_libretro.so"),
            ..case(
                "amiga-retroarch-zip-multi-disk-m3u",
                "amiga",
                "retroarch-amiga",
                "retroarch",
                Rom::Zip("Game.zip", &["Game Disk2.adf", "Game Disk1.adf"]),
            )
        },
        case(
            "apple2gs-kegs-direct-2mg",
            "apple2gs",
            "kegs-apple2gs",
            "kegs",
            Rom::File("Game.2mg"),
        ),
        case(
            "apple2gs-kegs-zip-525",
            "apple2gs",
            "kegs-apple2gs",
            "kegs",
            Rom::Zip("Game.zip", &["Game Side A.dsk", "Game Side B.dsk"]),
        ),
        Case {
            core: mame,
            ..case(
                "apple2gs-retroarch-mame-direct",
                "apple2gs",
                "retroarch-apple2gs",
                "retroarch",
                Rom::File("Game.po"),
            )
        },
        Case {
            core: mame,
            ..case(
                "apple2gs-retroarch-mame-zip",
                "apple2gs",
                "retroarch-apple2gs",
                "retroarch",
                Rom::Zip("Game.zip", &["Game Disk 1.2mg", "Game Disk 2.2mg"]),
            )
        },
        case(
            "atarist-hatari-direct",
            "atarist",
            "hatari-atarist",
            "hatari",
            Rom::File("Game.st"),
        ),
        case(
            "atarist-hatari-zip-two-disks",
            "atarist",
            "hatari-atarist",
            "hatari",
            Rom::Zip("Game.zip", &["Game Disk 2.st", "Game Disk 1.st"]),
        ),
        case(
            "atarist-steem-direct",
            "atarist",
            "steem-atarist",
            "Steem.exe",
            Rom::File("Game.msa"),
        ),
        Case {
            core: Some("hatari_libretro.so"),
            ..case(
                "atarist-retroarch-zip-m3u",
                "atarist",
                "retroarch-atarist",
                "retroarch",
                Rom::Zip("Game.zip", &["Game Disk 1.stx", "Game Disk 2.msa"]),
            )
        },
        Case {
            boot_disk: true,
            ..case(
                "atarist-hatari-harddisk-acsi-image",
                "atarist",
                "hatari-atarist",
                "hatari",
                Rom::File("HardDisk/Game.hd"),
            )
        },
        Case {
            boot_disk: true,
            ..case(
                "atarist-hatari-harddisk-directory",
                "atarist",
                "hatari-atarist",
                "hatari",
                Rom::Dir("HardDisk/Game", &["GAME.PRG"]),
            )
        },
        Case {
            boot_disk: true,
            core: Some("hatari_libretro.so"),
            ..case(
                "atarist-retroarch-harddisk-directory",
                "atarist",
                "retroarch-atarist",
                "retroarch",
                Rom::Dir("HardDisk/Game", &["GAME.PRG"]),
            )
        },
        Case {
            boot_disk: true,
            ..case(
                "atarist-hatari-harddisk-zip",
                "atarist",
                "hatari-atarist",
                "hatari",
                Rom::Zip("Game.zip", &["Game/GAME.PRG", "Game/DESKTOP.INF"]),
            )
        },
        Case {
            boot_disk: true,
            ..case(
                "atarist-steem-harddisk-zip",
                "atarist",
                "steem-atarist",
                "Steem.exe",
                Rom::Zip("Game.zip", &["Game/GAME.PRG"]),
            )
        },
        case(
            "amstradcpc-cpce-direct",
            "amstradcpc",
            "cpce-amstradcpc",
            "cap32",
            Rom::File("Game.dsk"),
        ),
    ]
}

fn write_zip(path: &Path, entries: &[&str]) {
    std::fs::create_dir_all(path.parent().unwrap()).unwrap();
    let mut zip = zip::ZipWriter::new(std::fs::File::create(path).unwrap());
    for entry in entries {
        zip.start_file(*entry, zip::write::SimpleFileOptions::default())
            .unwrap();
        zip.write_all(format!("content of {entry}").as_bytes())
            .unwrap();
    }
    zip.finish().unwrap();
}

fn touch(path: &Path, contents: &str) {
    std::fs::create_dir_all(path.parent().unwrap()).unwrap();
    std::fs::write(path, contents).unwrap();
}

/// Replaces the case root and per-launch temporary directories with stable tokens, so
/// the fixture is identical on Windows, macOS and Linux and between runs.
struct Normalizer {
    root: String,
    temp: String,
}

fn slashes(value: &str) -> String {
    value.replace('\\', "/").replace('\r', "")
}

impl Normalizer {
    fn new(root: &Path) -> Self {
        Self {
            root: slashes(&root.to_string_lossy())
                .trim_end_matches('/')
                .to_string(),
            temp: slashes(&std::env::temp_dir().to_string_lossy())
                .trim_end_matches('/')
                .to_string(),
        }
    }

    fn text(&self, value: &str) -> String {
        let mut text = slashes(value).replace(&self.root, "<ROOT>");
        // Per-launch session directories: <temp>/<random name>/... -> <TMP>/...
        let marker = format!("{}/", self.temp);
        while let Some(start) = text.find(&marker) {
            let after = start + marker.len();
            let end = text[after..]
                .find(|c: char| c == '/' || c.is_whitespace() || c == '"' || c == ',' || c == ';')
                .map(|offset| after + offset)
                .unwrap_or(text.len());
            text.replace_range(start..end, "<TMP>");
        }
        // MAME -rompath lists are ';'-separated on Windows and ':'-separated elsewhere.
        text.replace(";<ROOT>", ":<ROOT>")
            .replace(";<TMP>", ":<TMP>")
    }
}

fn run_case(case: &Case) -> serde_json::Value {
    let root_dir = tempfile::tempdir().unwrap();
    let root = root_dir.path().to_path_buf();
    let emulator_dir = root.join("emu");
    let emulator = emulator_dir.join(case.emulator);
    touch(&emulator, "#!/bin/sh\n");
    std::fs::create_dir_all(emulator_dir.join("system")).unwrap();

    let roms = root.join("roms");
    let rom_path: PathBuf = match &case.rom {
        Rom::File(name) => {
            let path = roms.join(name);
            touch(&path, "rom");
            path
        }
        Rom::Dir(name, files) => {
            let path = roms.join(name);
            for file in *files {
                touch(&path.join(file), "rom");
            }
            path
        }
        Rom::Zip(name, entries) => {
            let path = roms.join(name);
            write_zip(&path, entries);
            path
        }
    };
    for (name, entries) in case.extra_zips {
        write_zip(&roms.join(name), entries);
    }
    let core = case.core.map(|core| {
        let path = root.join("cores").join(core);
        touch(&path, "core");
        path.to_string_lossy().to_string()
    });
    let boot_disk = case.boot_disk.then(|| {
        let path = root.join("boot.st");
        touch(&path, "boot");
        path.to_string_lossy().to_string()
    });

    let request = LaunchRequest {
        c64: None,
        platform_id: Some(case.platform.to_string()),
        emulator_profile_id: Some(case.profile.to_string()),
        emulator_path: emulator.to_string_lossy().to_string(),
        rom_path: rom_path.to_string_lossy().to_string(),
        true_drive_emulation: case.true_drive,
        is_pal: case.pal,
        game_id: None,
        core_path: core,
        boot_disk_path: boot_disk,
    };

    let normalizer = Normalizer::new(&root);

    match plan_launch(&request) {
        Ok(plan) => {
            let mut written = BTreeMap::new();
            for arg in &plan.args {
                let path = Path::new(arg);
                let is_generated = matches!(
                    path.extension()
                        .and_then(|ext| ext.to_str())
                        .map(str::to_ascii_lowercase)
                        .as_deref(),
                    Some("m3u" | "vfl" | "cmd" | "gem" | "cfg")
                );
                if is_generated && path.is_file() {
                    let contents = std::fs::read_to_string(path).unwrap_or_default();
                    written.insert(normalizer.text(arg), normalizer.text(&contents));
                }
            }
            for config in ["config.kegs", "hatari.cfg"] {
                let path = emulator_dir.join(config);
                if path.is_file() {
                    written.insert(
                        normalizer.text(&path.to_string_lossy()),
                        normalizer.text(&std::fs::read_to_string(path).unwrap_or_default()),
                    );
                }
            }
            serde_json::json!({
                "emulator": normalizer.text(&plan.emulator.to_string_lossy()),
                "args": plan.args.iter().map(|arg| normalizer.text(arg)).collect::<Vec<_>>(),
                "files": written,
            })
        }
        Err(error) => serde_json::json!({ "error": normalizer.text(&error) }),
    }
}

#[test]
fn launch_plan_fixtures() {
    let actual: BTreeMap<String, serde_json::Value> = cases()
        .iter()
        .map(|case| (case.name.to_string(), run_case(case)))
        .collect();

    if std::env::var_os("UPDATE_LAUNCH_PLAN_FIXTURES").is_some() {
        std::fs::create_dir_all(Path::new(FIXTURE).parent().unwrap()).unwrap();
        std::fs::write(
            FIXTURE,
            serde_json::to_string_pretty(&actual).unwrap() + "\n",
        )
        .unwrap();
        return;
    }

    let expected: BTreeMap<String, serde_json::Value> = serde_json::from_str(
        &std::fs::read_to_string(FIXTURE).expect("launch plan fixture exists"),
    )
    .expect("launch plan fixture is valid JSON");
    assert_eq!(
        expected.keys().collect::<Vec<_>>(),
        actual.keys().collect::<Vec<_>>(),
        "launch plan cases changed; regenerate the fixture"
    );
    for (name, expected_plan) in &expected {
        assert_eq!(
            &actual[name], expected_plan,
            "launch plan changed for case {name}"
        );
    }
}
