use tauri::Manager;
use tauri_plugin_dialog::DialogExt;
use std::process::Command;

#[tauri::command]
pub async fn open_directory_dialog(app: tauri::AppHandle) -> Option<String> {
    app.dialog()
        .file()
        .blocking_pick_folder()
        .map(|p| p.to_string())
}

#[tauri::command]
pub async fn open_file_dialog(app: tauri::AppHandle) -> Option<String> {
    app.dialog()
        .file()
        .add_filter("Executables", &["exe", "app", "bin", "sh"])
        .add_filter("All Files", &["*"])
        .blocking_pick_file()
        .map(|p| p.to_string())
}

#[tauri::command]
pub fn exit_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
pub async fn set_window_mode(
    app: tauri::AppHandle,
    fullscreen: bool,
    width: Option<f64>,
    height: Option<f64>,
) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .or_else(|| app.webview_windows().values().next().cloned())
        .ok_or("No application window found")?;

    if fullscreen {
        window.set_fullscreen(true).map_err(|e| e.to_string())?;
    } else {
        window.set_fullscreen(false).map_err(|e| e.to_string())?;

        if let (Some(w), Some(h)) = (width, height) {
            window
                .set_size(tauri::Size::Logical(tauri::LogicalSize {
                    width: w,
                    height: h,
                }))
                .map_err(|e| e.to_string())?;
            window.center().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[derive(serde::Serialize)]
pub struct WindowSize {
    pub width: f64,
    pub height: f64,
}

#[tauri::command]
pub async fn get_window_size(app: tauri::AppHandle) -> Result<WindowSize, String> {
    let window = app
        .get_webview_window("main")
        .or_else(|| app.webview_windows().values().next().cloned())
        .ok_or("No application window found")?;

    let size = window.inner_size().map_err(|e| e.to_string())?;
    let logical = size.to_logical::<f64>(window.scale_factor().map_err(|e| e.to_string())?);

    Ok(WindowSize {
        width: logical.width,
        height: logical.height,
    })
}

/// Validate that a path is safe to hand to the OS "open" helper.
///
/// Rejects:
///   - URL schemes (http, https, ftp, javascript, data, …) — would silently
///     open a browser or execute script when passed to xdg-open / cmd start
///   - Paths that do not exist on the local filesystem (catches bare executable
///     names, typos, and anything else that isn't a real local file or folder)
///
/// The existence check also acts as a catch-all for anything that slips past
/// the scheme list.
fn validate_open_path(path: &str) -> Result<(), String> {
    let lower = path.to_lowercase();
    for scheme in &[
        "http://",
        "https://",
        "ftp://",
        "ftps://",
        "javascript:",
        "data:",
    ] {
        if lower.starts_with(scheme) {
            return Err(format!(
                "Refusing to open a URL via the system handler: {}",
                path
            ));
        }
    }

    let p = std::path::Path::new(path);
    if !p.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    Ok(())
}

#[tauri::command]
pub async fn open_path_with_system_default(path: String) -> Result<(), String> {
    // open_path_with_system_default is used by ExtrasDetail and useSteamDetailViewModel
    // to open a local extras file (PDF, image, video, audio) with the OS default app.
    // The path is always constructed from settings.extrasPath + extra.path from the DB.
    // We validate before spawning so that a crafted MDB import cannot inject a URL
    // that xdg-open / cmd-start would silently hand to the browser.
    validate_open_path(&path)?;

    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use tempfile::tempdir;

    // -------------------------------------------------------------------------
    // validate_open_path — happy paths
    // -------------------------------------------------------------------------

    #[test]
    fn test_validate_open_path_accepts_existing_file() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("manual.pdf");
        File::create(&file_path).unwrap();
        assert!(validate_open_path(&file_path.to_string_lossy()).is_ok());
    }

    #[test]
    fn test_validate_open_path_accepts_existing_directory() {
        // Directories are valid "open" targets (e.g., open a folder in the file manager)
        let dir = tempdir().unwrap();
        assert!(validate_open_path(&dir.path().to_string_lossy()).is_ok());
    }

    // -------------------------------------------------------------------------
    // validate_open_path — rejections
    // -------------------------------------------------------------------------

    #[test]
    fn test_validate_open_path_rejects_nonexistent_path() {
        let res = validate_open_path("/non/existent/gbbox/extras/manual.pdf");
        assert!(res.is_err());
        let msg = res.unwrap_err();
        assert!(msg.contains("does not exist"), "unexpected message: {}", msg);
    }

    #[test]
    fn test_validate_open_path_rejects_http_url() {
        let res = validate_open_path("http://example.com/evil");
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("Refusing to open a URL"));
    }

    #[test]
    fn test_validate_open_path_rejects_https_url() {
        let res = validate_open_path("https://evil.example.com");
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("Refusing to open a URL"));
    }

    #[test]
    fn test_validate_open_path_rejects_ftp_url() {
        let res = validate_open_path("ftp://files.example.com/rom.d64");
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("Refusing to open a URL"));
    }

    #[test]
    fn test_validate_open_path_rejects_javascript_url() {
        let res = validate_open_path("javascript:alert(1)");
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("Refusing to open a URL"));
    }

    #[test]
    fn test_validate_open_path_rejects_data_url() {
        let res = validate_open_path("data:text/html,<script>alert(1)</script>");
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("Refusing to open a URL"));
    }

    #[test]
    fn test_validate_open_path_scheme_check_is_case_insensitive() {
        let res_upper = validate_open_path("HTTP://example.com");
        assert!(res_upper.is_err(), "uppercase HTTP:// must be rejected");

        let res_mixed = validate_open_path("Https://example.com");
        assert!(res_mixed.is_err(), "mixed-case Https:// must be rejected");
    }
}
