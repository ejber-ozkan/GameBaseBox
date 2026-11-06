use tauri::Emitter;

pub mod commands;
pub mod database;
pub mod models;
pub mod platform_manifest;

use std::sync::OnceLock;

static DEBUG_MODE: OnceLock<bool> = OnceLock::new();

#[cfg(target_os = "windows")]
extern "system" {
    fn AttachConsole(dwProcessId: u32) -> i32;
    fn FreeConsole() -> i32;
    fn SetStdHandle(nStdHandle: u32, hHandle: *mut std::ffi::c_void) -> i32;
}

pub fn init_debug_mode() {
    // Check CLI args for --debug / -d / --verbose / -v
    let from_args = std::env::args()
        .any(|arg| arg == "--debug" || arg == "-d" || arg == "--verbose" || arg == "-v");
    // Also honour the GAMEBASEBOX_DEBUG environment variable (set by the debug launch scripts).
    // This is simpler than fighting tauri-dev's argument-forwarding quirks.
    let from_env = std::env::var("GAMEBASEBOX_DEBUG")
        .map(|v| matches!(v.as_str(), "1" | "true" | "yes"))
        .unwrap_or(false);
    let debug = from_args || from_env;
    let _ = DEBUG_MODE.set(debug);
    if debug {
        #[cfg(target_os = "windows")]
        unsafe {
            let _ = FreeConsole();
            if AttachConsole(0xffff_ffff) != 0 {
                use std::fs::OpenOptions;
                use std::os::windows::io::AsRawHandle;
                if let Ok(file) = OpenOptions::new().write(true).open("CONOUT$") {
                    let handle = file.as_raw_handle();
                    SetStdHandle(0xffff_fff5, handle); // STD_OUTPUT_HANDLE
                    SetStdHandle(0xffff_fff4, handle); // STD_ERROR_HANDLE
                }
            }
        }

        let source = if from_env {
            "GAMEBASEBOX_DEBUG env var"
        } else {
            "CLI flag"
        };
        println!("[DEBUG] Debug logging enabled via {}.", source);
    }
}

pub fn is_debug_mode() -> bool {
    *DEBUG_MODE.get().unwrap_or(&false)
}

use tauri::Manager;

// ---------------------------------------------------------------------------
// Application entry point
// ---------------------------------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    init_debug_mode();
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("main".to_string()),
                    }),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview),
                ])
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::files::scan_rom_directory,
            commands::emulator::launch_emulator,
            commands::emulator::test_emulator_profile,
            commands::c64::get_c64_launch_settings,
            commands::vice_compat::check_c64_vice,
            commands::files::download_media_asset,
            commands::files::read_file_bytes,
            commands::files::resolve_media_path,
            commands::files::find_all_media_variants,
            commands::video::resolve_extra_video,
            commands::video::convert_extra_video,
            commands::video::download_archive_extra_video,
            commands::system::open_directory_dialog,
            commands::system::open_file_dialog,
            commands::system::open_retroarch_core_file_dialog,
            commands::system::allow_asset_path,
            commands::system::open_path_with_system_default,
            commands::system::exit_app,
            commands::system::set_window_mode,
            commands::system::is_window_fullscreen,
            commands::system::get_window_size,
            commands::db::get_db_games,
            commands::db::get_game_detail,
            commands::db::get_db_game_count,
            commands::db::get_genres,
            commands::db::get_sub_genres,
            commands::db::get_game_extras,
            commands::settings::load_settings,
            commands::settings::save_settings,
            commands::setup::open_mdb_file_dialog,
            commands::setup::get_database_bootstrap_status,
            commands::setup::import_database_from_mdb,
            commands::setup::get_platform_import_status,
            commands::setup::import_platform_database_from_mdb,
            commands::setup::cancel_platform_import,
            commands::platforms::get_supported_platforms,
            commands::platforms::get_active_platform,
            commands::platforms::set_active_platform,
            commands::system::is_debug_mode_command,
            commands::system::log_debug_message_command,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Resized(_) = event {
                if let Ok(is_fs) = window.is_fullscreen() {
                    let _ = window.emit("window-fullscreen-changed", is_fs);
                }
            }
        })
        .setup(|app| {
            match database::configure_runtime_db_path(app.handle()) {
                Ok(db_path) => {
                    if is_debug_mode() {
                        println!("[DEBUG] Database path configured: {:?}", db_path);
                    }
                }
                Err(error) => log::error!("Could not configure the database path: {error}"),
            }
            // Schema checks run off the main thread so a first-launch upgrade of a large
            // library never delays the window. Failures are logged; the setup screen
            // reports them again through get_database_bootstrap_status.
            std::thread::spawn(|| {
                if let Err(error) = database::init_database() {
                    log::error!("Database startup check failed: {error}");
                }
            });
            if let Some(window) = app.get_webview_window("main") {
                if let Some(icon) = app.default_window_icon().cloned() {
                    let _ = window.set_icon(icon);
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running GBBox");
}

/// Shared test utilities - only compiled with `cfg(test)`.
#[cfg(test)]
pub mod test_helpers {
    use std::path::PathBuf;

    /// RAII guard that points `database::get_db_path()` at a test database for the
    /// current thread only, restoring the previous value on drop. Because the path is
    /// thread-local, tests with their own databases can run in parallel.
    pub struct DbPathGuard {
        previous: Option<PathBuf>,
    }

    impl DbPathGuard {
        pub fn set(path: &str) -> Self {
            let previous =
                crate::database::TEST_DB_PATH.with(|cell| cell.replace(Some(PathBuf::from(path))));
            DbPathGuard { previous }
        }
    }

    impl Drop for DbPathGuard {
        fn drop(&mut self) {
            let previous = self.previous.take();
            crate::database::TEST_DB_PATH.with(|cell| {
                *cell.borrow_mut() = previous;
            });
        }
    }
}
