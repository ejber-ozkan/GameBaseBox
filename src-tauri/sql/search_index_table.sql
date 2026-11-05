-- GameSearchIndex FTS5 table.
-- Shared by src-tauri/src/database.rs and scripts/convert_csv_to_sqlite.js; changing it
-- requires bumping SCHEMA_VERSION in database.rs.
CREATE VIRTUAL TABLE IF NOT EXISTS GameSearchIndex USING fts5(
    id UNINDEXED,
    platform_id UNINDEXED,
    source_game_id UNINDEXED,
    name,
    developer_name,
    publisher_name,
    musician_name,
    coder_name,
    graphics_name,
    tokenize='porter unicode61 remove_diacritics 2',
    prefix='2,3'
);
