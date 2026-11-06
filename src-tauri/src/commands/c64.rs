use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Region {
    Pal,
    Ntsc,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Rom {
    Standard,
    Swedish,
    Danish,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Overrides {
    pub region: Option<Region>,
    pub true_drive: Option<bool>,
    pub virtual_devices: Option<bool>,
    pub reu: Option<u32>,
    pub rom: Option<Rom>,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", default)]
pub struct RomFiles {
    pub kernal: String,
    pub chargen: String,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Layers {
    pub global: Overrides,
    pub game: Overrides,
    pub swedish: RomFiles,
    pub danish: RomFiles,
    pub retroarch_config: Option<String>,
}

#[derive(Debug, Default)]
pub struct Metadata {
    pub region: String,
    pub true_drive: String,
    pub gemus: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Value<T: Serialize> {
    pub value: Option<T>,
    pub source: &'static str,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Resolved {
    pub region: Value<Region>,
    pub true_drive: Value<bool>,
    pub virtual_devices: Value<bool>,
    pub reu: Value<u32>,
    pub rom: Value<Rom>,
    pub warnings: Vec<String>,
}

fn region(value: &str) -> Option<Region> {
    match value.trim().to_ascii_uppercase().as_str() {
        "1" | "3" | "4" | "P" | "B" => Some(Region::Pal),
        "2" | "N" => Some(Region::Ntsc),
        _ => None,
    }
}

fn boolean(value: &str) -> Option<bool> {
    match value.trim().to_ascii_lowercase().as_str() {
        "1" | "yes" | "true" => Some(true),
        "0" | "no" | "false" => Some(false),
        _ => None,
    }
}

fn valid_reu(value: u32) -> bool {
    matches!(
        value,
        0 | 128 | 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384
    )
}

fn choose<T: Copy + Serialize>(
    game: Option<T>,
    global: Option<T>,
    gemus: Option<T>,
    database: Option<T>,
) -> Value<T> {
    for (value, source) in [
        (game, "Game override"),
        (global, "Global override"),
        (gemus, "GEMUS"),
        (database, "Database"),
    ] {
        if value.is_some() {
            return Value { value, source };
        }
    }
    Value {
        value: None,
        source: "Emulator default",
    }
}

pub fn resolve(metadata: &Metadata, layers: &Layers) -> Result<Resolved, String> {
    for overrides in [&layers.global, &layers.game] {
        if overrides.reu.is_some_and(|size| !valid_reu(size)) {
            return Err("C64 REU size is not supported".into());
        }
    }
    let mut gemus = Overrides::default();
    let mut warnings = Vec::new();
    for line in metadata
        .gemus
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty() && !line.starts_with([';', '#']))
    {
        let Some((key, value)) = line.split_once('=') else {
            warnings.push(format!("Unrecognised GEMUS instruction: {line}"));
            continue;
        };
        let key = key.trim().to_ascii_lowercase();
        let value = value.trim();
        let supported = match key.as_str() {
            "vtde" => {
                gemus.true_drive = boolean(value);
                gemus.true_drive.is_some()
            }
            "vyde" => {
                gemus.virtual_devices = boolean(value);
                gemus.virtual_devices.is_some()
            }
            "reu" => {
                gemus.reu = value.parse::<u32>().ok().filter(|size| valid_reu(*size));
                gemus.reu.is_some()
            }
            "rom" => {
                gemus.rom = match value.to_ascii_lowercase().as_str() {
                    "swe" => Some(Rom::Swedish),
                    "dan" => Some(Rom::Danish),
                    "std" | "standard" => Some(Rom::Standard),
                    _ => None,
                };
                gemus.rom.is_some()
            }
            "msg" => {
                warnings.push(value.to_string());
                true
            }
            _ => false,
        };
        if !supported {
            warnings.push(format!("GEMUS instruction not applied: {line}"));
        }
    }
    let true_drive = choose(
        layers.game.true_drive,
        layers.global.true_drive,
        gemus.true_drive,
        boolean(&metadata.true_drive),
    );
    let mut virtual_devices = choose(
        layers.game.virtual_devices,
        layers.global.virtual_devices,
        gemus.virtual_devices,
        None,
    );
    if virtual_devices.value.is_none() {
        if let Some(enabled) = true_drive.value {
            virtual_devices = Value {
                value: Some(!enabled),
                source: "Derived from true-drive",
            };
        }
    }
    if true_drive.value == Some(false) && virtual_devices.value == Some(false) {
        warnings.push("True-drive emulation and virtual device traps are both disabled; disk games may not load.".into());
    }
    Ok(Resolved {
        region: choose(
            layers.game.region,
            layers.global.region,
            gemus.region,
            region(&metadata.region),
        ),
        true_drive,
        virtual_devices,
        reu: choose(layers.game.reu, layers.global.reu, gemus.reu, None),
        rom: choose(layers.game.rom, layers.global.rom, gemus.rom, None),
        warnings,
    })
}

pub fn vice_args(settings: &Resolved, layers: &Layers) -> Result<Vec<String>, String> {
    let mut args = Vec::new();
    if let Some(region) = settings.region.value {
        args.push(
            match region {
                Region::Pal => "-pal",
                Region::Ntsc => "-ntsc",
            }
            .into(),
        );
    }
    if let Some(enabled) = settings.true_drive.value {
        for drive in [8, 9] {
            args.push(format!(
                "{}drive{drive}truedrive",
                if enabled { "-" } else { "+" }
            ));
        }
    }
    if let Some(enabled) = settings.virtual_devices.value {
        for device in [1, 2, 4, 5, 6, 7, 8, 9, 10, 11] {
            args.push(format!(
                "{}trapdevice{device}",
                if enabled { "-" } else { "+" }
            ));
        }
    }
    if let Some(size) = settings.reu.value {
        args.push(if size == 0 { "+reu" } else { "-reu" }.into());
        if size != 0 {
            args.extend(["-reusize".into(), size.to_string()]);
        }
    }
    if let Some(rom) = settings.rom.value {
        let files = match rom {
            Rom::Swedish => &layers.swedish,
            Rom::Danish => &layers.danish,
            Rom::Standard => {
                args.extend([
                    "-kernal".into(),
                    "kernal-901227-03.bin".into(),
                    "-chargen".into(),
                    "chargen-901225-01.bin".into(),
                ]);
                return Ok(args);
            }
        };
        for (switch, file) in [("-kernal", &files.kernal), ("-chargen", &files.chargen)] {
            if file.trim().is_empty() || !Path::new(&file.replace('\\', "/")).is_file() {
                return Err(format!("C64 {rom:?} ROM requires existing Kernal and character ROM files. Select both in C64 Settings, or override ROM selection for this game."));
            }
            let path = PathBuf::from(file.replace('\\', "/"));
            let path = if path.is_absolute() {
                path
            } else {
                std::env::current_dir()
                    .map_err(|e| e.to_string())?
                    .join(path)
            };
            args.extend([switch.into(), path.to_string_lossy().replace('\\', "/")]);
        }
    }
    Ok(args)
}

fn metadata_from_connection(
    conn: &rusqlite::Connection,
    game_id: &str,
) -> rusqlite::Result<Metadata> {
    use rusqlite::OptionalExtension;
    let mut stmt = conn.prepare("PRAGMA table_info(Games)")?;
    let columns = stmt
        .query_map([], |row| row.get::<_, String>(1))?
        .collect::<Result<Vec<_>, _>>()?;
    let expression = |column: &str| {
        if columns.iter().any(|c| c.eq_ignore_ascii_case(column)) {
            format!("COALESCE({column}, '')")
        } else {
            "''".into()
        }
    };
    let scope = if columns.iter().any(|c| c == "platform_id") {
        " AND platform_id='c64'"
    } else {
        ""
    };
    let sql = format!(
        "SELECT {}, {}, {} FROM Games WHERE GA_Id=?1{scope}",
        expression("V_PalNTSC"),
        expression("V_TrueDriveEmu"),
        expression("Gemus")
    );
    Ok(conn
        .query_row(&sql, [game_id], |row| {
            Ok(Metadata {
                region: row.get(0)?,
                true_drive: row.get(1)?,
                gemus: row.get(2)?,
            })
        })
        .optional()?
        .unwrap_or_default())
}

pub fn load_metadata(game_id: Option<&str>) -> Metadata {
    let Some(game_id) = game_id else {
        return Metadata::default();
    };
    let Ok(conn) = rusqlite::Connection::open_with_flags(
        crate::database::get_db_path(),
        rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY,
    ) else {
        return Metadata::default();
    };
    metadata_from_connection(&conn, game_id).unwrap_or_default()
}

fn config_value(text: &str, key: &str) -> Option<String> {
    text.lines()
        .filter_map(|line| {
            let (name, value) = line.trim().split_once('=')?;
            if name.trim() != key {
                return None;
            }
            let value = value.trim();
            Some(if let Some(quoted) = value.strip_prefix('"') {
                quoted.split('"').next().unwrap_or("").to_string()
            } else {
                value.split('#').next().unwrap_or("").trim().to_string()
            })
        })
        .next_back()
}

fn replace_option(text: &mut String, key: &str, value: &str) {
    *text = text
        .lines()
        .filter(|line| {
            line.split_once('=')
                .is_none_or(|(name, _)| name.trim() != key)
        })
        .map(|line| format!("{line}\n"))
        .collect();
    text.push_str(&format!("{key} = \"{value}\"\n"));
}

fn retroarch_options(settings: &Resolved, existing: &str) -> String {
    let mut text = existing.to_string();
    if settings.rom.value == Some(Rom::Standard) {
        replace_option(&mut text, "vice_read_vicerc", "disabled");
        replace_option(&mut text, "vice_jiffydos", "disabled");
    }
    if let Some(region) = settings.region.value {
        let old = config_value(existing, "vice_c64_model").unwrap_or_default();
        let model = ["C64C", "C64SX", "PET64"]
            .into_iter()
            .find(|model| old.starts_with(model))
            .unwrap_or("C64");
        replace_option(
            &mut text,
            "vice_c64_model",
            &format!(
                "{model} {}",
                if region == Region::Pal { "PAL" } else { "NTSC" }
            ),
        );
    }
    for (key, value) in [
        ("vice_drive_true_emulation", settings.true_drive.value),
        ("vice_virtual_device_traps", settings.virtual_devices.value),
    ] {
        if let Some(enabled) = value {
            replace_option(&mut text, key, if enabled { "enabled" } else { "disabled" });
        }
    }
    if let Some(size) = settings.reu.value {
        replace_option(
            &mut text,
            "vice_ram_expansion_unit",
            &if size == 0 {
                "none".into()
            } else {
                format!("{size}kB")
            },
        );
    }
    text
}

fn config_path(value: &str, base: &Path) -> PathBuf {
    let normalized = value.replace('\\', "/");
    if let Some(suffix) = normalized.strip_prefix(":/") {
        return base.join(suffix);
    }
    let path = PathBuf::from(&normalized);
    if let Some(suffix) = normalized.strip_prefix("~/") {
        if let Some(home) = std::env::var_os("HOME").or_else(|| std::env::var_os("USERPROFILE")) {
            return PathBuf::from(home).join(suffix);
        }
    }
    if path.is_absolute() {
        path
    } else {
        base.join(path)
    }
}

fn find_retroarch_config(emulator: &Path, layers: &Layers) -> Result<Option<PathBuf>, String> {
    if let Some(config) = layers
        .retroarch_config
        .as_deref()
        .filter(|s| !s.trim().is_empty())
    {
        let config = PathBuf::from(config.replace('\\', "/"));
        if !config.is_file() {
            return Err("The configured RetroArch configuration file does not exist".into());
        }
        return Ok(Some(config));
    }
    let mut candidates = vec![emulator
        .parent()
        .unwrap_or(Path::new("."))
        .join("retroarch.cfg")];
    if let Some(appdata) = std::env::var_os("APPDATA") {
        candidates.push(PathBuf::from(appdata).join("RetroArch/retroarch.cfg"));
    }
    if let Some(config) = std::env::var_os("XDG_CONFIG_HOME") {
        candidates.push(PathBuf::from(config).join("retroarch/retroarch.cfg"));
    }
    if let Some(home) = std::env::var_os("HOME") {
        candidates.push(PathBuf::from(&home).join(".config/retroarch/retroarch.cfg"));
        candidates.push(
            PathBuf::from(home).join("Library/Application Support/RetroArch/config/retroarch.cfg"),
        );
    }
    Ok(candidates.into_iter().find(|p| p.is_file()))
}

fn quote_command(value: &str) -> Result<String, String> {
    if value.contains(['"', '\n', '\r', '\0']) {
        return Err("A C64 launch path contains unsupported quotes or control characters".into());
    }
    Ok(format!("\"{}\"", value.replace('\\', "/")))
}

pub fn prepare_retroarch(
    dir: &Path,
    emulator: &Path,
    core: &Path,
    content: &Path,
    settings: &Resolved,
    layers: &Layers,
) -> Result<(PathBuf, PathBuf), String> {
    let config_path = find_retroarch_config(emulator, layers)?;
    let config = config_path
        .as_ref()
        .map(std::fs::read_to_string)
        .transpose()
        .map_err(|e| e.to_string())?
        .unwrap_or_default();
    let base = config_path
        .as_deref()
        .and_then(Path::parent)
        .or_else(|| emulator.parent())
        .unwrap_or(Path::new("."));
    let options_path = config_value(&config, "core_options_path")
        .filter(|s| !s.is_empty())
        .map(|s| self::config_path(&s, base))
        .unwrap_or_else(|| base.join("retroarch-core-options.cfg"));
    let mut existing = if options_path.is_file() {
        std::fs::read_to_string(&options_path).map_err(|e| e.to_string())?
    } else {
        String::new()
    };
    let core_name = if core
        .to_string_lossy()
        .to_ascii_lowercase()
        .contains("x64sc")
    {
        "VICE x64sc"
    } else {
        "VICE x64"
    };
    let config_directory = config_value(&config, "rgui_config_directory")
        .filter(|s| !s.is_empty())
        .map(|s| self::config_path(&s, base))
        .unwrap_or_else(|| base.join("config"));
    let core_options = config_directory
        .join(core_name)
        .join(format!("{core_name}.opt"));
    if config_value(&config, "global_core_options").as_deref() != Some("true")
        && core_options.is_file()
    {
        existing.push('\n');
        existing.push_str(&std::fs::read_to_string(core_options).map_err(|e| e.to_string())?);
    }
    let options = dir.join("c64-core-options.cfg");
    std::fs::write(&options, retroarch_options(settings, &existing)).map_err(|e| e.to_string())?;
    let fragment = dir.join("c64-launch.cfg");
    std::fs::write(&fragment, format!("core_options_path = {}\nglobal_core_options = \"true\"\ngame_specific_options = \"false\"\nauto_overrides_enable = \"false\"\nconfig_save_on_exit = \"false\"\n", quote_command(&options.to_string_lossy())?)).map_err(|e| e.to_string())?;
    let content = if matches!(settings.rom.value, Some(Rom::Swedish | Rom::Danish)) {
        // The VICE core accepts a command file for custom system ROMs. Region,
        // drive and REU also use core options so later core updates agree.
        let command = dir
            .join(content.file_name().unwrap_or(std::ffi::OsStr::new("game")))
            .with_extension("cmd");
        let mut args = vice_args(settings, layers)?;
        // Drive/trap core options work across libretro VICE versions.
        args.retain(|arg| {
            !(arg.starts_with(['-', '+'])
                && (arg.contains("truedrive")
                    || arg
                        .get(1..)
                        .is_some_and(|arg| arg.starts_with("trapdevice"))))
        });
        let primary = if content.extension().is_some_and(|e| e == "m3u") {
            std::fs::read_to_string(content)
                .map_err(|e| e.to_string())?
                .lines()
                .find(|line| !line.trim().is_empty() && !line.starts_with('#'))
                .map(|s| config_path_for_playlist(s, content))
                .unwrap_or_else(|| content.to_path_buf())
        } else {
            content.to_path_buf()
        };
        args.extend(["-autostart".into(), primary.to_string_lossy().to_string()]);
        if primary != content {
            args.push(content.to_string_lossy().to_string());
        }
        let text = args
            .iter()
            .map(|arg| quote_command(arg))
            .collect::<Result<Vec<_>, _>>()?
            .join(" ");
        std::fs::write(&command, text).map_err(|e| e.to_string())?;
        command
    } else {
        content.to_path_buf()
    };
    Ok((content, fragment))
}

fn config_path_for_playlist(value: &str, playlist: &Path) -> PathBuf {
    config_path(value, playlist.parent().unwrap_or(Path::new(".")))
}

#[tauri::command]
pub fn get_c64_launch_settings(game_id: String, layers: Layers) -> Result<Resolved, String> {
    let mut settings = resolve(&load_metadata(Some(&game_id)), &layers)?;
    if let Err(error) = vice_args(&settings, &layers) {
        settings.warnings.push(error);
    }
    Ok(settings)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn regions_decode_numeric_legacy_and_unknown_without_ntsc_fallback() {
        for (code, expected) in [
            ("1", Some(Region::Pal)),
            ("2", Some(Region::Ntsc)),
            ("3", Some(Region::Pal)),
            ("4", Some(Region::Pal)),
            (" p ", Some(Region::Pal)),
            ("N", Some(Region::Ntsc)),
            ("B", Some(Region::Pal)),
            ("0", None),
            ("", None),
            ("garbage", None),
        ] {
            let resolved = resolve(
                &Metadata {
                    region: code.into(),
                    ..Default::default()
                },
                &Layers::default(),
            )
            .unwrap();
            assert_eq!(resolved.region.value, expected, "{code:?}");
        }
    }

    #[test]
    fn game_overrides_global_then_gemus_then_database_per_setting() {
        let metadata = Metadata {
            region: "1".into(),
            true_drive: "1".into(),
            gemus: "vtde=no\r\nreu=512\nvyde=yes".into(),
        };
        let mut layers = Layers::default();
        let base = resolve(&metadata, &layers).unwrap();
        assert_eq!(
            (base.true_drive.value, base.true_drive.source),
            (Some(false), "GEMUS")
        );
        assert_eq!(base.reu.value, Some(512));
        assert_eq!(base.virtual_devices.value, Some(true));
        layers.global.region = Some(Region::Ntsc);
        layers.global.true_drive = Some(true);
        layers.game.true_drive = Some(false);
        let settings = resolve(&metadata, &layers).unwrap();
        assert_eq!(
            (settings.region.value, settings.region.source),
            (Some(Region::Ntsc), "Global override")
        );
        assert_eq!(
            (settings.true_drive.value, settings.true_drive.source),
            (Some(false), "Game override")
        );
        assert_eq!(settings.reu.source, "GEMUS");
    }

    #[test]
    fn invalid_gemus_is_reported_and_never_becomes_arguments() {
        let metadata = Metadata { gemus: "vtde=maybe\nreu=999\nrom=../../../evil\nmsg=Use VICE\nvicename=-ntsc\nunknown=-warp".into(), ..Default::default() };
        let settings = resolve(&metadata, &Layers::default()).unwrap();
        assert_eq!(settings.region.value, None);
        assert_eq!(settings.true_drive.value, None);
        assert_eq!(settings.reu.value, None);
        assert_eq!(settings.rom.value, None);
        assert!(!settings.warnings.is_empty());
        assert!(vice_args(&settings, &Layers::default()).unwrap().is_empty());
    }

    #[test]
    fn vice_explicit_pal_and_disabled_true_drive_replace_saved_settings() {
        let metadata = Metadata {
            region: "3".into(),
            true_drive: "0".into(),
            ..Default::default()
        };
        let settings = resolve(&metadata, &Layers::default()).unwrap();
        let args = vice_args(&settings, &Layers::default()).unwrap();
        assert_eq!(&args[..3], ["-pal", "+drive8truedrive", "+drive9truedrive"]);
        assert!(args.contains(&"-trapdevice8".to_string()));
    }

    #[test]
    fn disabling_true_drive_automatically_enables_fast_virtual_device_loading() {
        let settings = resolve(
            &Metadata {
                true_drive: "0".into(),
                ..Default::default()
            },
            &Layers::default(),
        )
        .unwrap();
        assert_eq!(settings.virtual_devices.value, Some(true));
        assert_eq!(settings.virtual_devices.source, "Derived from true-drive");
    }

    #[test]
    fn rom_command_keeps_content_name_so_games_do_not_share_save_names() {
        let directory = tempfile::tempdir().unwrap();
        let config = directory.path().join("retroarch.cfg");
        std::fs::write(&config, "").unwrap();
        let mut layers = Layers {
            retroarch_config: Some(config.to_string_lossy().into()),
            ..Default::default()
        };
        layers.game.rom = Some(Rom::Swedish);
        let kernal = directory.path().join("kernal.bin");
        let chargen = directory.path().join("chargen.bin");
        std::fs::write(&kernal, "rom").unwrap();
        std::fs::write(&chargen, "rom").unwrap();
        layers.swedish = RomFiles {
            kernal: kernal.to_string_lossy().into(),
            chargen: chargen.to_string_lossy().into(),
        };
        let settings = resolve(&Metadata::default(), &layers).unwrap();
        let (command, _) = prepare_retroarch(
            directory.path(),
            Path::new("retroarch.exe"),
            Path::new("vice_x64sc_libretro.dll"),
            Path::new("distinct-game.d64"),
            &settings,
            &layers,
        )
        .unwrap();
        assert_eq!(command.file_stem().unwrap(), "distinct-game");
    }

    #[test]
    fn standard_rom_uses_core_defaults_without_relative_external_rom_files() {
        let directory = tempfile::tempdir().unwrap();
        let config = directory.path().join("retroarch.cfg");
        std::fs::write(&config, "").unwrap();
        let mut layers = Layers {
            retroarch_config: Some(config.to_string_lossy().into()),
            ..Default::default()
        };
        layers.game.rom = Some(Rom::Standard);
        let settings = resolve(&Metadata::default(), &layers).unwrap();
        let content = Path::new("game.d64");
        let (actual, _) = prepare_retroarch(
            directory.path(),
            Path::new("retroarch.exe"),
            Path::new("vice_x64sc_libretro.dll"),
            content,
            &settings,
            &layers,
        )
        .unwrap();
        assert_eq!(actual, content);
        let options =
            std::fs::read_to_string(directory.path().join("c64-core-options.cfg")).unwrap();
        assert!(options.contains("vice_read_vicerc = \"disabled\""));
        assert!(options.contains("vice_jiffydos = \"disabled\""));
    }

    #[test]
    fn rom_requirements_need_files_and_reu_is_validated() {
        let metadata = Metadata {
            gemus: "rom=swe\nreu=512".into(),
            ..Default::default()
        };
        let settings = resolve(&metadata, &Layers::default()).unwrap();
        assert_eq!(settings.rom.value, Some(Rom::Swedish));
        assert!(vice_args(&settings, &Layers::default())
            .unwrap_err()
            .contains("Swedish"));
        let mut layers = Layers::default();
        layers.game.reu = Some(999);
        assert!(resolve(&metadata, &layers).is_err());
    }

    #[test]
    fn retroarch_options_keep_unrelated_preferences_and_force_known_settings() {
        let settings = resolve(
            &Metadata {
                region: "3".into(),
                true_drive: "0".into(),
                gemus: "reu=512\nvyde=no".into(),
            },
            &Layers::default(),
        )
        .unwrap();
        let options = retroarch_options(&settings, "vice_c64_model = \"C64C NTSC auto\"\nvice_sid_engine = \"ReSID\"\nvice_drive_true_emulation = \"enabled\"\n");
        assert!(options.contains("vice_c64_model = \"C64C PAL\""));
        assert!(options.contains("vice_sid_engine = \"ReSID\""));
        assert!(options.contains("vice_drive_true_emulation = \"disabled\""));
        assert!(options.contains("vice_ram_expansion_unit = \"512kB\""));
        assert!(options.contains("vice_virtual_device_traps = \"disabled\""));
    }

    #[test]
    fn retroarch_configuration_is_isolated_and_unique_for_each_launch() {
        let original = tempfile::tempdir().unwrap();
        let session = tempfile::tempdir().unwrap();
        let config = original.path().join("retroarch.cfg");
        let options = original.path().join("retroarch-core-options.cfg");
        std::fs::write(&config, "config_save_on_exit = \"true\"\n").unwrap();
        std::fs::write(&options, "vice_sid_engine = \"ReSID\"\n").unwrap();
        let settings = resolve(
            &Metadata {
                region: "2".into(),
                ..Default::default()
            },
            &Layers::default(),
        )
        .unwrap();
        let (content, appended) = prepare_retroarch(
            session.path(),
            &original.path().join("retroarch.exe"),
            Path::new("vice_x64sc_libretro.dll"),
            Path::new("game.m3u"),
            &settings,
            &Layers::default(),
        )
        .unwrap();
        assert_eq!(content, Path::new("game.m3u"));
        assert!(appended.starts_with(session.path()));
        let fragment = std::fs::read_to_string(appended).unwrap();
        assert!(fragment.contains("config_save_on_exit = \"false\""));
        assert!(fragment.contains("game_specific_options = \"false\""));
        assert!(fragment.contains("global_core_options = \"true\""));
        let generated =
            std::fs::read_to_string(session.path().join("c64-core-options.cfg")).unwrap();
        assert!(generated.contains("C64 NTSC"));
        assert!(generated.contains("ReSID"));
        assert_eq!(
            std::fs::read_to_string(options).unwrap(),
            "vice_sid_engine = \"ReSID\"\n"
        );
        assert_eq!(
            std::fs::read_to_string(config).unwrap(),
            "config_save_on_exit = \"true\"\n"
        );
    }

    #[test]
    fn metadata_is_scoped_to_c64_and_supports_legacy_columns() {
        let conn = rusqlite::Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "CREATE TABLE Games (GA_Id TEXT,platform_id TEXT,V_PalNTSC TEXT,Gemus TEXT);
            INSERT INTO Games VALUES ('2813','atari800','2','vtde=yes');
            INSERT INTO Games VALUES ('2813','c64','3','vtde=no');",
        )
        .unwrap();
        let settings = resolve(
            &metadata_from_connection(&conn, "2813").unwrap(),
            &Layers::default(),
        )
        .unwrap();
        assert_eq!(settings.region.value, Some(Region::Pal));
        assert_eq!(settings.true_drive.value, Some(false));
        assert_eq!(settings.true_drive.source, "GEMUS");
        assert_eq!(
            metadata_from_connection(&conn, "missing").unwrap().region,
            ""
        );
    }

    #[test]
    fn virtual_device_overrides_use_supported_vice_trap_switches() {
        let settings = resolve(
            &Metadata {
                gemus: "vyde=no".into(),
                ..Default::default()
            },
            &Layers::default(),
        )
        .unwrap();
        let args = vice_args(&settings, &Layers::default()).unwrap();
        assert!(args.contains(&"+trapdevice8".to_string()));
        assert!(args.contains(&"+trapdevice1".to_string()));
        assert!(!args.iter().any(|arg| arg.contains("virtualdev")));
    }
}
