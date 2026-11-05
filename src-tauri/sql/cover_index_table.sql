-- GameCoverIndex table and lookup index.
-- Shared by src-tauri/src/database.rs and scripts/convert_csv_to_sqlite.js; changing it
-- requires bumping SCHEMA_VERSION in database.rs.
CREATE TABLE IF NOT EXISTS GameCoverIndex (
    GA_Id TEXT NOT NULL,
    platform_id TEXT NOT NULL DEFAULT 'c64',
    cover_path TEXT NOT NULL,
    PRIMARY KEY (platform_id, GA_Id)
);
CREATE INDEX IF NOT EXISTS idx_game_cover_index_platform_ga_id ON GameCoverIndex(platform_id, GA_Id);
