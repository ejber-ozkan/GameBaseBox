-- Fills the GameSearchIndex FTS5 table from GameView.
-- Shared by src-tauri/src/database.rs and scripts/convert_csv_to_sqlite.js; changing it
-- requires bumping SCHEMA_VERSION in database.rs.
INSERT INTO GameSearchIndex (
        id,
        platform_id,
        source_game_id,
        name,
        developer_name,
        publisher_name,
        musician_name,
        coder_name,
        graphics_name
    )
    SELECT
        gv.id,
        gv.platformId,
        gv.sourceGameId,
        gv.name,
        COALESCE(gv.developer_name, ''),
        COALESCE(gv.publisher_name, ''),
        COALESCE(gv.musician_name, ''),
        COALESCE(pr.Programmer, ''),
        COALESCE(ar.Artist, '')
    FROM GameView gv
    JOIN Games g ON gv.id = g.GA_Id AND gv.platformId = g.platform_id
    LEFT JOIN Programmers pr ON g.PR_Id = pr.PR_Id AND pr.platform_id = g.platform_id
    LEFT JOIN Artists ar ON g.AR_Id = ar.AR_Id AND ar.platform_id = g.platform_id
