//! App settings stored by the backend (`settings.json` in the app config directory)
//! instead of only in WebView localStorage, and the file-system allow-list derived
//! from them.
//!
//! The frontend owns the settings schema; the backend stores the JSON as-is. Every
//! absolute path in it (library folders, emulator executables, cores, boot disks, ...)
//! becomes an allowed location, and commands that read files, grant asset access,
//! open files or start programs on the frontend's behalf check their paths with
//! [`ensure_allowed_path`]. Until settings have been loaded or saved in this process
//! (first run), nothing is blocked.

use serde_json::Value;
use std::fs;
use std::path::{Component, Path, PathBuf};
use std::sync::{OnceLock, RwLock};
use tauri::Manager;

const SETTINGS_FILE_NAME: &str = "settings.json";

static SETTINGS_PATH: OnceLock<PathBuf> = OnceLock::new();

/// `None` until settings are first loaded or saved in this process.
static ALLOWED_PATHS: RwLock<Option<Vec<String>>> = RwLock::new(None);

#[cfg(test)]
thread_local! {
    /// Per-test allow-list, so parallel tests do not share the global one.
    static TEST_ALLOWED_PATHS: std::cell::RefCell<Option<Vec<String>>> =
        const { std::cell::RefCell::new(None) };
}

fn settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    if let Some(path) = SETTINGS_PATH.get() {
        return Ok(path.clone());
    }
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("Could not resolve the settings directory: {error}"))?;
    Ok(SETTINGS_PATH.get_or_init(|| dir.join(SETTINGS_FILE_NAME)).clone())
}

/// Lexically normalizes a path for comparison: `/` separators, `.`/`..` resolved, no
/// trailing separator, and case-folded on Windows and macOS (case-insensitive by
/// default there). Never touches the file system, so missing paths compare too.
pub(crate) fn normalize_for_comparison(path: &str) -> String {
    let unified = path.trim().trim_matches('"').trim_matches('\'').replace('\\', "/");
    let mut prefix = String::new();
    let mut parts: Vec<String> = Vec::new();
    for component in Path::new(&unified).components() {
        match component {
            Component::Prefix(value) => prefix = value.as_os_str().to_string_lossy().to_string(),
            Component::RootDir => prefix.push('/'),
            Component::CurDir => {}
            Component::ParentDir => {
                parts.pop();
            }
            Component::Normal(value) => parts.push(value.to_string_lossy().to_string()),
        }
    }
    // Windows drive paths written with '/' are not parsed as prefixes on other hosts.
    let joined = format!("{prefix}{}", parts.join("/"));
    if cfg!(any(windows, target_os = "macos")) {
        joined.to_lowercase()
    } else {
        joined
    }
}

fn looks_like_absolute_path(value: &str) -> bool {
    let value = value.trim();
    let bytes = value.as_bytes();
    value.starts_with('/')
        || value.starts_with("\\\\")
        || (bytes.len() >= 3 && bytes[0].is_ascii_alphabetic() && bytes[1] == b':' && (bytes[2] == b'\\' || bytes[2] == b'/'))
}

/// Every absolute path string anywhere in the settings JSON.
pub(crate) fn collect_allowed_paths(settings: &Value) -> Vec<String> {
    fn walk(value: &Value, out: &mut Vec<String>) {
        match value {
            Value::String(text) if looks_like_absolute_path(text) => out.push(normalize_for_comparison(text)),
            Value::Array(items) => items.iter().for_each(|item| walk(item, out)),
            Value::Object(map) => map.values().for_each(|item| walk(item, out)),
            _ => {}
        }
    }
    let mut out = Vec::new();
    walk(settings, &mut out);
    // A bare root ("/", "C:/") would allow the whole disk; never treat it as a location.
    out.retain(|path| !is_root_like(path));
    out.sort();
    out.dedup();
    out
}

fn is_root_like(normalized: &str) -> bool {
    let rest = normalized.trim_start_matches('/');
    let rest = match rest.as_bytes() {
        [drive, b':', ..] if drive.is_ascii_alphabetic() => &rest[2..],
        _ => rest,
    };
    rest.trim_matches('/').is_empty()
}

fn set_allowed_paths(settings: &Value) {
    let paths = collect_allowed_paths(settings);
    if let Ok(mut allowed) = ALLOWED_PATHS.write() {
        *allowed = Some(paths);
    }
}

fn current_allowed_paths() -> Option<Vec<String>> {
    #[cfg(test)]
    {
        TEST_ALLOWED_PATHS.with(|cell| cell.borrow().clone())
    }
    #[cfg(not(test))]
    {
        ALLOWED_PATHS.read().ok().and_then(|allowed| allowed.clone())
    }
}

/// Whether `candidate` is one of `allowed` or inside one of them (component-wise).
pub(crate) fn is_within_allowed(candidate: &str, allowed: &[String]) -> bool {
    let candidate = normalize_for_comparison(candidate);
    allowed.iter().any(|root| {
        candidate == *root
            || candidate
                .strip_prefix(root.as_str())
                .is_some_and(|rest| rest.starts_with('/') || root.ends_with('/'))
    })
}

/// Rejects paths outside the folders and files configured in settings. `what` names
/// the path in the error ("ROM", "emulator", ...).
pub(crate) fn ensure_allowed_path(path: &str, what: &str) -> Result<(), String> {
    let Some(allowed) = current_allowed_paths() else {
        return Ok(());
    };
    if is_within_allowed(path, &allowed) {
        Ok(())
    } else {
        Err(format!(
            "{what} path is outside the folders configured in Settings: {path}"
        ))
    }
}

fn read_settings_file(path: &Path) -> Result<Option<Value>, String> {
    match fs::read_to_string(path) {
        Ok(text) => serde_json::from_str(&text)
            .map(Some)
            .map_err(|error| format!("Settings file is not valid JSON ({}): {error}", path.display())),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(format!("Could not read settings ({}): {error}", path.display())),
    }
}

/// Writes through a temporary file and a rename, so a crash never leaves a truncated file.
fn write_settings_file(path: &Path, settings: &Value) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("Could not create {}: {error}", parent.display()))?;
    }
    let text = serde_json::to_string_pretty(settings).map_err(|error| error.to_string())?;
    let temporary = path.with_extension("json.tmp");
    fs::write(&temporary, text).map_err(|error| format!("Could not write {}: {error}", temporary.display()))?;
    fs::rename(&temporary, path).map_err(|error| format!("Could not replace {}: {error}", path.display()))
}

#[tauri::command]
pub async fn load_settings(app: tauri::AppHandle) -> Result<Option<Value>, String> {
    let path = settings_path(&app)?;
    crate::database::run_blocking("Settings load", move || {
        let settings = read_settings_file(&path)?;
        if let Some(settings) = &settings {
            set_allowed_paths(settings);
        }
        Ok(settings)
    })
    .await
}

#[tauri::command]
pub async fn save_settings(app: tauri::AppHandle, settings: Value) -> Result<(), String> {
    if !settings.is_object() {
        return Err("Settings must be a JSON object.".to_string());
    }
    let path = settings_path(&app)?;
    set_allowed_paths(&settings);
    crate::database::run_blocking("Settings save", move || write_settings_file(&path, &settings)).await
}

#[cfg(test)]
pub(crate) struct AllowedPathsGuard(Option<Vec<String>>);

#[cfg(test)]
impl AllowedPathsGuard {
    /// Installs an allow-list for the current test thread.
    pub(crate) fn set(settings: &Value) -> Self {
        let previous = TEST_ALLOWED_PATHS.with(|cell| cell.replace(Some(collect_allowed_paths(settings))));
        Self(previous)
    }
}

#[cfg(test)]
impl Drop for AllowedPathsGuard {
    fn drop(&mut self) {
        let previous = self.0.take();
        TEST_ALLOWED_PATHS.with(|cell| *cell.borrow_mut() = previous);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn settings() -> Value {
        json!({
            "themeId": "c64-edition",
            "platformSettings": {
                "c64": {
                    "folders": { "gamesPath": "D:\\GB64\\Games", "musicPath": "/Users/me/C64Music/", "extrasPath": "" },
                    "emulator": { "executablePaths": { "vice-c64": "C:/VICE/x64sc.exe" }, "corePaths": {} }
                }
            },
            "notAPath": "C64",
            "lastFocusedIndex": 3
        })
    }

    #[test]
    fn bare_roots_are_never_allowed_locations() {
        let paths = collect_allowed_paths(&json!({ "a": "/", "b": "C:\\", "c": "D:/", "d": "/data" }));
        assert_eq!(paths, vec![normalize_for_comparison("/data")]);
    }

    #[test]
    fn collects_every_absolute_path_and_ignores_other_strings() {
        let paths = collect_allowed_paths(&settings());
        assert_eq!(paths.len(), 3, "{paths:?}");
        assert!(paths.iter().all(|path| !path.ends_with('/') && !path.contains('\\')));
    }

    #[test]
    fn allows_configured_folders_and_files_only() {
        let allowed = collect_allowed_paths(&settings());
        assert!(is_within_allowed("D:/GB64/Games/A/Archon.zip", &allowed));
        assert!(is_within_allowed("D:\\GB64\\Games", &allowed));
        assert!(is_within_allowed("/Users/me/C64Music/Hubbard/Commando.sid", &allowed));
        assert!(is_within_allowed("C:\\VICE\\x64sc.exe", &allowed));

        assert!(!is_within_allowed("C:/VICE/other.exe", &allowed));
        assert!(!is_within_allowed("D:/GB64/GamesExtra/evil.zip", &allowed), "prefix must match whole components");
        assert!(!is_within_allowed("D:/GB64/Games/../../Windows/system32/cmd.exe", &allowed));
        assert!(!is_within_allowed("/etc/passwd", &allowed));
    }

    #[test]
    fn case_folding_follows_the_host_file_system() {
        let allowed = collect_allowed_paths(&settings());
        let different_case = is_within_allowed("d:/gb64/games/a.zip", &allowed);
        assert_eq!(different_case, cfg!(any(windows, target_os = "macos")));
    }

    #[test]
    fn nothing_is_blocked_before_settings_exist_then_paths_are_checked() {
        assert!(ensure_allowed_path("/anything", "ROM").is_ok());
        let _guard = AllowedPathsGuard::set(&settings());
        assert!(ensure_allowed_path("D:/GB64/Games/x.d64", "ROM").is_ok());
        let error = ensure_allowed_path("/etc/passwd", "ROM").unwrap_err();
        assert!(error.contains("outside the folders configured in Settings"), "{error}");
    }

    #[test]
    fn settings_file_round_trips_atomically() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("config").join(SETTINGS_FILE_NAME);
        assert_eq!(read_settings_file(&path).unwrap(), None);
        write_settings_file(&path, &settings()).unwrap();
        assert_eq!(read_settings_file(&path).unwrap(), Some(settings()));
        assert!(!path.with_extension("json.tmp").exists());

        std::fs::write(&path, "{ not json").unwrap();
        assert!(read_settings_file(&path).unwrap_err().contains("not valid JSON"));
    }
}
