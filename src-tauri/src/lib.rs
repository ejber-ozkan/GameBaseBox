pub mod commands;
pub mod database;
pub mod models;
pub mod platform_manifest;
pub mod security;

/// Shared test utilities - only compiled with `cfg(test)`.
/// Provides a single process-wide mutex so that all test modules
/// serialise their `VIC40_DB_PATH` env-var mutations, preventing
/// parallel test threads from corrupting each other or the production DB.
#[cfg(test)]
pub mod test_helpers {
    use std::sync::Mutex;

    /// Process-wide mutex serialising every test that touches `VIC40_DB_PATH`.
    pub static DB_ENV_MUTEX: Mutex<()> = Mutex::new(());

    /// RAII guard: acquires `DB_ENV_MUTEX`, sets `VIC40_DB_PATH`, restores on drop.
    pub struct DbEnvGuard {
        _lock: std::sync::MutexGuard<'static, ()>,
        previous: Option<std::ffi::OsString>,
    }

    impl DbEnvGuard {
        pub fn set(path: &str) -> Self {
            let lock = DB_ENV_MUTEX.lock().unwrap_or_else(|e| e.into_inner());
            let previous = std::env::var_os("VIC40_DB_PATH");
            std::env::set_var("VIC40_DB_PATH", path);
            DbEnvGuard {
                _lock: lock,
                previous,
            }
        }
    }

    impl Drop for DbEnvGuard {
        fn drop(&mut self) {
            if let Some(previous) = &self.previous {
                std::env::set_var("VIC40_DB_PATH", previous);
            } else {
                std::env::remove_var("VIC40_DB_PATH");
            }
        }
    }
}

use std::sync::OnceLock;

static DEBUG_MODE: OnceLock<bool> = OnceLock::new();

pub fn init_debug_mode() {
    // Check CLI args for --debug / -d / --verbose / -v
    let from_args = std::env::args().any(|arg| {
        arg == "--debug" || arg == "-d" || arg == "--verbose" || arg == "-v"
    });
    // Also honour the GAMEBASEBOX_DEBUG environment variable (set by the debug launch scripts).
    // This is simpler than fighting tauri-dev's argument-forwarding quirks.
    let from_env = std::env::var("GAMEBASEBOX_DEBUG")
        .map(|v| matches!(v.as_str(), "1" | "true" | "yes"))
        .unwrap_or(false);
    let debug = from_args || from_env;
    let _ = DEBUG_MODE.set(debug);
    if debug {
        let source = if from_env { "GAMEBASEBOX_DEBUG env var" } else { "CLI flag" };
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
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::files::scan_rom_directory,
            commands::emulator::launch_emulator,
            commands::emulator::test_emulator_profile,
            commands::files::download_media_asset,
            commands::files::read_file_bytes,
            commands::files::resolve_media_path,
            commands::files::find_all_media_variants,
            commands::system::open_directory_dialog,
            commands::system::open_file_dialog,
            commands::system::allow_asset_path,
            commands::system::open_path_with_system_default,
            commands::system::exit_app,
            commands::system::set_window_mode,
            commands::system::get_window_size,
            commands::db::get_db_games,
            commands::db::get_game_detail,
            commands::db::get_db_game_count,
            commands::db::get_genres,
            commands::db::get_sub_genres,
            commands::db::get_game_extras,
            commands::db::save_secure_setting,
            commands::db::get_secure_setting,
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
        .setup(|app| {
            let db_path = database::configure_runtime_db_path(app.handle());
            if is_debug_mode() {
                println!("[DEBUG] Database path configured: {:?}", db_path);
            }
            let _ = database::init_database();
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
