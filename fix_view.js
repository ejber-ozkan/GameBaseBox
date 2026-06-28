const Database = require('better-sqlite3');
const db = new Database('gb64.sqlite');

try {
    console.log('--- Fixing GameView ---');
    db.exec(`
        DROP VIEW IF EXISTS GameView;
        CREATE VIEW GameView AS SELECT
            g.GA_Id as id,
            g.Name as name,
            g.Filename as filename,
            g.FileToRun as gameFilename,
            g.ScrnshotFilename as screenshotFilename,
            NULL as boxFrontFilename,
            NULL as titlescreenFilename,
            NULL as videoSnapFilename,
            g.SidFilename as sidFilename,
            g.CRC as crc,
            y.Year as year,
            CASE WHEN g.V_PalNTSC = 'P' OR g.V_PalNTSC = 'B' THEN 1 ELSE 0 END as isPal,
            CASE WHEN g.V_PalNTSC = 'N' OR g.V_PalNTSC = 'B' THEN 1 ELSE 0 END as isNtsc,
            CASE WHEN g.V_TrueDriveEmu = '1' THEN 1 ELSE 0 END as trueDriveEmu,
            CASE WHEN g.Classic = 'True' THEN 1 ELSE 0 END as isClassic,
            ifnull(pg.ParentGenre, 'Unknown') as parentGenre,
            ifnull(ge.Genre, 'Unknown') as subGenre,
            de.Developer as developer_name,
            pu.Publisher as publisher_name,
            mu.Musician as musician_name,
            la.Language as languages
        FROM Games g
        LEFT JOIN Years y ON g.YE_Id = y.YE_Id
        LEFT JOIN Genres ge ON g.GE_Id = ge.GE_Id
        LEFT JOIN PGenres pg ON ge.PG_Id = pg.PG_Id
        LEFT JOIN Developers de ON g.DE_Id = de.DE_Id
        LEFT JOIN Publishers pu ON g.PU_Id = pu.PU_Id
        LEFT JOIN Musicians mu ON g.MU_Id = mu.MU_Id
        LEFT JOIN Languages la ON g.LA_Id = la.LA_Id
    `);
    console.log('GameView updated successfully.');

    const classicCount = db.prepare("SELECT COUNT(*) as count FROM GameView WHERE isClassic = 1").get();
    console.log(`Verified Classic Games in View: ${classicCount.count}`);

} catch (err) {
    console.error('Error fixing view:', err);
} finally {
    db.close();
}
