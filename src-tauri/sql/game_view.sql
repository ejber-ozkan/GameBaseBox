-- GameView: one row per game with joined metadata.
-- Shared by src-tauri/src/database.rs and scripts/convert_csv_to_sqlite.js; changing it
-- requires bumping SCHEMA_VERSION in database.rs.
CREATE VIEW GameView AS
SELECT 
    g.platform_id as platformId,
    g.source_game_id as sourceGameId,
    g.GA_Id as id,
    g.Name as name,
    g.Filename as filename,
    CASE WHEN ifnull(g.FileToRun, '') != '' THEN g.FileToRun ELSE g.Filename END as gameFilename,
    g.ScrnshotFilename as screenshotFilename,
    NULL as boxFrontFilename,
    NULL as titlescreenFilename,
    NULL as videoSnapFilename,
    g.SidFilename as sidFilename,
    g.CRC as crc,
    y.Year as year,
    CASE WHEN g.platform_id = 'c64' THEN
        CASE WHEN UPPER(TRIM(COALESCE(g.V_PalNTSC, ''))) IN ('1', '3', '4', 'P', 'B') THEN 1 ELSE 0 END
        ELSE CASE WHEN g.V_PalNTSC IN ('P', 'B') THEN 1 ELSE 0 END END as isPal,
    CASE WHEN g.platform_id = 'c64' THEN
        CASE WHEN UPPER(TRIM(COALESCE(g.V_PalNTSC, ''))) IN ('2', '3', '4', 'N', 'B') THEN 1 ELSE 0 END
        ELSE CASE WHEN g.V_PalNTSC IN ('N', 'B') THEN 1 ELSE 0 END END as isNtsc,
    CASE WHEN g.V_TrueDriveEmu = '1' THEN 1 ELSE 0 END as trueDriveEmu,
    CASE WHEN g.Classic = 'True' THEN 1 ELSE 0 END as isClassic,
    ifnull(pg.ParentGenre, 'Unknown') as parentGenre,
    ifnull(ge.Genre, 'Unknown') as subGenre,
    de.Developer as developer_name,
    pu.Publisher as publisher_name,
    mu.Musician as musician_name,
    la.Language as languages
FROM Games g
LEFT JOIN Years y ON g.YE_Id = y.YE_Id AND y.platform_id = g.platform_id
LEFT JOIN Genres ge ON g.GE_Id = ge.GE_Id AND ge.platform_id = g.platform_id
LEFT JOIN PGenres pg ON ge.PG_Id = pg.PG_Id AND pg.platform_id = g.platform_id
LEFT JOIN Developers de ON g.DE_Id = de.DE_Id AND de.platform_id = g.platform_id
LEFT JOIN Publishers pu ON g.PU_Id = pu.PU_Id AND pu.platform_id = g.platform_id
LEFT JOIN Musicians mu ON g.MU_Id = mu.MU_Id AND mu.platform_id = g.platform_id
LEFT JOIN Languages la ON g.LA_Id = la.LA_Id AND la.platform_id = g.platform_id;
