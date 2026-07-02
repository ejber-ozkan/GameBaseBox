use serde::{Deserialize, Serialize};

/// A scanned ROM file found on the local disk
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScannedRom {
    pub path: String,
    pub filename: String,
    pub extension: String,
    pub crc32: String,
    pub size_bytes: u64,
}

/// Result of launching an emulator process
#[derive(Debug, Serialize, Deserialize)]
pub struct LaunchResult {
    pub success: bool,
    pub message: String,
}

/// A path that has been resolved and validated from the media directories
#[derive(Debug, Serialize, Deserialize)]
pub struct ResolvedPath {
    pub exists: bool,
    pub absolute_path: String,
}

/// Launch request from the frontend
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct LaunchRequest {
    pub platform_id: Option<String>,
    pub emulator_profile_id: Option<String>,
    pub emulator_path: String,
    pub rom_path: String,
    pub true_drive_emulation: bool,
    pub is_pal: bool,
    pub game_id: Option<String>,
    pub core_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct EmulatorProfileTestRequest {
    pub platform_id: String,
    pub emulator_profile_id: String,
    pub executable_path: String,
    pub core_path: Option<String>,
}

#[derive(Debug, Deserialize, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GameFilters {
    pub search_query: Option<String>,
    pub letter: Option<String>,
    pub genre: Option<String>,
    pub sub_genre: Option<String>,
    pub favorite_ids: Option<Vec<String>>,
    pub hide_adult: Option<bool>,
    pub is_classic: Option<bool>,
}

/// A row from the SQLite GameView
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GameRow {
    pub id: String,
    pub name: String,
    pub filename: String,
    pub game_filename: Option<String>,
    pub screenshot_filename: Option<String>,
    pub box_front_filename: Option<String>,
    pub cover_path: Option<String>,
    pub titlescreen_filename: Option<String>,
    pub video_snap_filename: Option<String>,
    pub sid_filename: Option<String>,
    pub crc: Option<String>,
    pub year: Option<String>,
    pub is_pal: bool,
    pub is_ntsc: bool,
    pub true_drive_emu: bool,
    pub is_classic: bool,
    pub parent_genre: String,
    pub sub_genre: String,
    pub developer_name: Option<String>,
    pub publisher_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GameDetailRow {
    #[serde(flatten)]
    pub game: GameRow,
    pub musician_name: Option<String>,
    pub musician_photo: Option<String>,
    pub musician_nick: Option<String>,
    pub musician_group: Option<String>,
    pub coder_name: Option<String>,
    pub graphics_name: Option<String>,
    pub version_by: Option<String>,
    pub control: Option<String>,
    pub players_from: Option<String>,
    pub players_to: Option<String>,
    pub players_sim: Option<String>,
    pub comment: Option<String>,
    pub review_rating: Option<String>,
    pub languages: Option<String>,
    pub v_trainers: Option<String>,
    pub v_length: Option<String>,
    pub v_loading_screen: Option<bool>,
    pub v_high_score_saver: Option<bool>,
    pub v_included_docs: Option<bool>,
    pub v_true_drive_emu: Option<bool>,
    pub v_pal_ntsc: Option<String>,
    pub memo: Option<String>,
}

/// A row from the SQLite Extras table
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ExtraRow {
    pub id: String,
    pub name: String,
    pub path: String,
    pub extra_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseBootstrapStatus {
    pub ready: bool,
    pub db_path: String,
    pub reason: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseImportResult {
    pub db_path: String,
    pub exported_tables: usize,
    pub imported_tables: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ImportPlatformDatabaseRequest {
    pub platform_id: String,
    pub mdb_path: String,
    pub folder_settings: PlatformFolderSettings,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlatformDatabaseImportResult {
    pub platform_id: String,
    pub db_path: String,
    pub exported_tables: usize,
    pub imported_tables: usize,
    pub game_count: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum PlatformId {
    C64,
    Atari800,
    Atari2600,
    ZxSpectrum,
    BbcMicro,
    Amiga,
}

impl PlatformId {
    pub fn as_str(&self) -> &'static str {
        match self {
            PlatformId::C64 => "c64",
            PlatformId::Atari800 => "atari800",
            PlatformId::Atari2600 => "atari2600",
            PlatformId::ZxSpectrum => "zxspectrum",
            PlatformId::BbcMicro => "bbcmicro",
            PlatformId::Amiga => "amiga",
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlatformCapabilities {
    pub screenshots: bool,
    pub photos: bool,
    pub music: String,
    pub extras: bool,
    pub videos: bool,
    pub in_app_emulation: bool,
    pub launch_extensions: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlatformProfile {
    pub id: String,
    pub display_name: String,
    pub status: String,
    pub import_status: String,
    pub default_emulator_profile_id: String,
    pub supported_emulator_profile_ids: Vec<String>,
    pub capabilities: PlatformCapabilities,
    pub folder_types: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ActivePlatformState {
    pub active_platform_id: String,
    pub last_used_platform_id: Option<String>,
    pub platform_selection_required: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SetActivePlatformResponse {
    pub active_platform_id: String,
    pub requires_import: bool,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct PlatformFolderSettings {
    pub games_path: String,
    pub music_path: String,
    pub photos_path: String,
    pub screenshots_path: String,
    pub extras_path: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlatformImportStatus {
    pub platform_id: String,
    pub import_status: String,
    pub source_mdb_path: Option<String>,
    pub game_count: usize,
    pub last_import_error: Option<String>,
}
