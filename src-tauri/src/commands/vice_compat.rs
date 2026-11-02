use std::collections::BTreeSet;
use std::collections::HashMap;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant, SystemTime};

#[derive(Clone, Debug)]
pub struct Capabilities {
    pub switches: BTreeSet<String>,
    pub version: String,
}

impl Capabilities {
    pub fn launch_args(&self, executable: &Path, args: &[String]) -> Result<Vec<String>, String> {
        let mut args = self.adapt(args)?;
        let parent = executable.parent().unwrap_or(Path::new("."));
        let directories = [
            parent.join("C64"),
            parent.join("../C64"),
            parent.join("../share/vice/C64"),
            PathBuf::from("/usr/share/vice/C64"),
            PathBuf::from("/usr/local/share/vice/C64"),
        ];
        for (modern, legacy) in [
            ("kernal-901227-03.bin", "kernal"),
            ("chargen-901225-01.bin", "chargen"),
        ] {
            for arg in &mut args {
                if arg != modern {
                    continue;
                }
                let file = directories
                    .iter()
                    .flat_map(|dir| [dir.join(modern), dir.join(legacy)])
                    .find(|p| p.is_file());
                if let Some(file) = file {
                    *arg = file.to_string_lossy().replace('\\', "/");
                } else if !self.switches.contains("-drive8truedrive") {
                    *arg = legacy.into();
                }
            }
        }
        Ok(args)
    }
    pub fn from_help(help: &str) -> Result<Self, String> {
        let switches: BTreeSet<String> = help
            .split_whitespace()
            .map(|token| token.trim_matches([',', ';', ':']).to_string())
            .filter(|token| token.starts_with(['-', '+']))
            .collect();
        if !switches.contains("-pal") || !switches.contains("-ntsc") {
            return Err("The selected emulator did not report C64 VICE command-line options. Select the actual x64/x64sc executable; wrappers must forward -help.".into());
        }
        Ok(Self {
            switches,
            version: "Version not reported".into(),
        })
    }

    pub fn adapt(&self, args: &[String]) -> Result<Vec<String>, String> {
        let mut result = Vec::new();
        for arg in args {
            let mapped = if arg.starts_with(['-', '+']) && arg.contains("truedrive") {
                if self.switches.contains(arg) {
                    Some(arg.clone())
                } else if self.switches.contains(&format!("{}truedrive", &arg[..1])) {
                    Some(format!("{}truedrive", &arg[..1]))
                } else {
                    return Err(
                        "This VICE build does not advertise the required true-drive switch".into(),
                    );
                }
            } else if let Some(device) = arg.get(1..).and_then(|s| s.strip_prefix("trapdevice")) {
                if self.switches.contains(arg) {
                    Some(arg.clone())
                } else {
                    let per_device = format!("{}virtualdev{device}", &arg[..1]);
                    let legacy = format!("{}virtualdev", &arg[..1]);
                    if self.switches.contains(&per_device) {
                        Some(per_device)
                    } else if self.switches.contains(&legacy) {
                        Some(legacy)
                    } else if self
                        .switches
                        .iter()
                        .any(|s| s.contains("virtualdev") || s.contains("trapdevice"))
                    {
                        None
                    } else {
                        return Err(
                            "This VICE build does not advertise virtual-device switches".into()
                        );
                    }
                }
            } else {
                if arg.starts_with(['-', '+']) && !self.switches.contains(arg) {
                    return Err(format!(
                        "This VICE build does not support the required C64 option {arg}"
                    ));
                }
                Some(arg.clone())
            };
            if let Some(mapped) = mapped {
                if !result.contains(&mapped) || !mapped.starts_with(['-', '+']) {
                    result.push(mapped);
                }
            }
        }
        Ok(result)
    }
}

type Cache = HashMap<PathBuf, (u64, Option<SystemTime>, Capabilities)>;
static CACHE: OnceLock<Mutex<Cache>> = OnceLock::new();

pub(super) fn probe(executable: &Path, option: &str) -> Result<String, String> {
    let directory = super::emulator::create_launch_temp_dir()?;
    let stdout_path = directory.join("stdout.txt");
    let stderr_path = directory.join("stderr.txt");
    let result = (|| {
        let output = std::fs::File::create(&stdout_path).map_err(|e| e.to_string())?;
        let errors = std::fs::File::create(&stderr_path).map_err(|e| e.to_string())?;
        let mut command = Command::new(executable);
        command
            .arg(option)
            .stdin(Stdio::null())
            .stdout(Stdio::from(output))
            .stderr(Stdio::from(errors));
        if let Some(parent) = executable.parent() {
            command.current_dir(parent);
        }
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            command.creation_flags(0x08000000);
        }
        let mut child = command
            .spawn()
            .map_err(|e| format!("Could not check VICE compatibility: {e}"))?;
        let start = Instant::now();
        let mut timed_out = false;
        loop {
            if child.try_wait().map_err(|e| e.to_string())?.is_some() {
                break;
            }
            if start.elapsed() > Duration::from_secs(5) {
                let _ = child.kill();
                let _ = child.wait();
                timed_out = true;
                break;
            }
            std::thread::sleep(Duration::from_millis(20));
        }
        if timed_out {
            return Err("VICE compatibility check timed out. Select the actual x64/x64sc executable rather than a launcher.".into());
        }
        let mut output = Vec::new();
        let mut errors = Vec::new();
        std::fs::File::open(&stdout_path)
            .map_err(|e| e.to_string())?
            .take(256 * 1024)
            .read_to_end(&mut output)
            .map_err(|e| e.to_string())?;
        std::fs::File::open(&stderr_path)
            .map_err(|e| e.to_string())?
            .take(256 * 1024)
            .read_to_end(&mut errors)
            .map_err(|e| e.to_string())?;
        Ok(format!(
            "{}\n{}",
            String::from_utf8_lossy(&output),
            String::from_utf8_lossy(&errors)
        ))
    })();
    let _ = std::fs::remove_file(stdout_path);
    let _ = std::fs::remove_file(stderr_path);
    let _ = std::fs::remove_dir(directory);
    result
}

pub fn detect(executable: &Path) -> Result<Capabilities, String> {
    let metadata = executable.metadata().map_err(|e| e.to_string())?;
    let signature = (metadata.len(), metadata.modified().ok());
    let cache = CACHE.get_or_init(|| Mutex::new(HashMap::new()));
    if let Some(capabilities) = cache.lock().ok().and_then(|cache| {
        cache
            .get(executable)
            .filter(|(size, modified, _)| (*size, *modified) == signature)
            .map(|(_, _, capabilities)| capabilities.clone())
    }) {
        return Ok(capabilities);
    }
    let mut capabilities = Capabilities::from_help(&probe(executable, "-help")?)?;
    if let Some(version) = capabilities
        .switches
        .contains("-version")
        .then(|| probe(executable, "-version").ok())
        .flatten()
    {
        if let Some(line) = version.lines().find(|line| {
            line.contains("VICE") && (line.contains("x64") || line.contains("version"))
        }) {
            capabilities.version = line.trim().to_string();
        }
    }
    if let Ok(mut cache) = cache.lock() {
        cache.insert(
            executable.to_path_buf(),
            (signature.0, signature.1, capabilities.clone()),
        );
    }
    Ok(capabilities)
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ViceInfo {
    version: String,
    drive_switches: &'static str,
    virtual_device_switches: &'static str,
}

#[tauri::command]
pub async fn check_c64_vice(executable_path: String) -> Result<ViceInfo, String> {
    let executable = super::emulator::resolve_emulator_binary(
        &executable_path,
        Some("vice-c64"),
        Some("c64"),
        || "VICE executable was not found".into(),
    )?;
    let capabilities = detect(&executable)?;
    Ok(ViceInfo {
        version: capabilities.version,
        drive_switches: if capabilities.switches.contains("-drive8truedrive") {
            "Per-drive"
        } else {
            "Legacy global"
        },
        virtual_device_switches: if capabilities.switches.contains("-trapdevice8") {
            "Per-device traps"
        } else if capabilities.switches.contains("-virtualdev8") {
            "Per-device"
        } else {
            "Legacy global"
        },
    })
}

#[cfg(test)]
pub fn seed_test_capabilities(executable: &Path) {
    let metadata = executable.metadata().unwrap();
    let mut switches = String::from("-pal -ntsc -kernal -chargen -reu +reu -reusize ");
    for drive in [8, 9] {
        switches.push_str(&format!("-drive{drive}truedrive +drive{drive}truedrive "));
    }
    for device in [1, 2, 4, 5, 6, 7, 8, 9, 10, 11] {
        switches.push_str(&format!("-trapdevice{device} +trapdevice{device} "));
    }
    CACHE
        .get_or_init(|| Mutex::new(HashMap::new()))
        .lock()
        .unwrap()
        .insert(
            executable.to_path_buf(),
            (
                metadata.len(),
                metadata.modified().ok(),
                Capabilities::from_help(&switches).unwrap(),
            ),
        );
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn old_vice_uses_global_drive_and_virtual_device_switches() {
        let capabilities = Capabilities::from_help(
            "-pal\n-ntsc\n-truedrive\n+truedrive\n-virtualdev\n+virtualdev\n",
        )
        .unwrap();
        let args = [
            "-pal",
            "+drive8truedrive",
            "+drive9truedrive",
            "-trapdevice1",
            "-trapdevice8",
            "-trapdevice9",
        ]
        .map(String::from);
        assert_eq!(
            capabilities.adapt(&args).unwrap(),
            ["-pal", "+truedrive", "-virtualdev"]
        );
    }

    #[test]
    fn intermediate_vice_uses_per_device_virtualdev_switches() {
        let capabilities = Capabilities::from_help("-pal -ntsc -drive8truedrive +drive8truedrive -drive9truedrive +drive9truedrive -virtualdev8 +virtualdev8 -virtualdev9 +virtualdev9").unwrap();
        let args = [
            "-ntsc",
            "-drive8truedrive",
            "-drive9truedrive",
            "+trapdevice8",
            "+trapdevice9",
        ]
        .map(String::from);
        assert_eq!(
            capabilities.adapt(&args).unwrap(),
            [
                "-ntsc",
                "-drive8truedrive",
                "-drive9truedrive",
                "+virtualdev8",
                "+virtualdev9"
            ]
        );
    }

    #[test]
    fn modern_vice_uses_advertised_trap_and_drive_switches() {
        let help = "-pal -ntsc -drive8truedrive +drive8truedrive -drive9truedrive +drive9truedrive -trapdevice8 +trapdevice8";
        let capabilities = Capabilities::from_help(help).unwrap();
        let args = ["-pal", "-drive8truedrive", "+trapdevice8"].map(String::from);
        assert_eq!(capabilities.adapt(&args).unwrap(), args);
    }

    #[test]
    fn unrecognised_help_does_not_guess_a_version() {
        assert!(Capabilities::from_help("another emulator: --help").is_err());
    }

    #[test]
    fn rom_paths_are_not_mistaken_for_switch_names() {
        let capabilities = Capabilities::from_help("-pal -ntsc -kernal").unwrap();
        let args = ["-kernal", "/roms/truedrive-kernal.bin"].map(String::from);
        assert_eq!(capabilities.adapt(&args).unwrap(), args);
    }

    #[test]
    fn standard_rom_selection_supports_legacy_rom_filenames() {
        let directory = tempfile::tempdir().unwrap();
        let roms = directory.path().join("C64");
        std::fs::create_dir(&roms).unwrap();
        std::fs::write(roms.join("kernal"), "rom").unwrap();
        let capabilities = Capabilities::from_help("-pal -ntsc -kernal").unwrap();
        let args = ["-kernal", "kernal-901227-03.bin"].map(String::from);
        let actual = capabilities
            .launch_args(&directory.path().join("x64"), &args)
            .unwrap();
        assert_eq!(
            actual[1],
            roms.join("kernal").to_string_lossy().replace('\\', "/")
        );
    }
}
