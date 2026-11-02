import { describe, expect, it } from 'vitest';
import { DatabaseSync as Database } from 'node:sqlite';
import { rebuildGameView } from '../../scripts/convert_csv_to_sqlite.js';

describe('CSV import C64 region decoding', () => {
  it('decodes C64 numeric regions while preserving other platforms', () => {
    const db = new Database(':memory:');
    try {
      db.exec(`CREATE TABLE Games (platform_id TEXT, source_game_id TEXT, GA_Id TEXT, Name TEXT,
        Filename TEXT, FileToRun TEXT, ScrnshotFilename TEXT, SidFilename TEXT, CRC TEXT,
        V_PalNTSC TEXT, V_TrueDriveEmu TEXT, Classic TEXT, YE_Id TEXT, GE_Id TEXT, DE_Id TEXT, PU_Id TEXT, MU_Id TEXT, LA_Id TEXT);
        CREATE TABLE Years (YE_Id TEXT, platform_id TEXT, Year TEXT);
        CREATE TABLE Genres (GE_Id TEXT, platform_id TEXT, PG_Id TEXT, Genre TEXT);
        CREATE TABLE PGenres (PG_Id TEXT, platform_id TEXT, ParentGenre TEXT);
        CREATE TABLE Developers (DE_Id TEXT, platform_id TEXT, Developer TEXT);
        CREATE TABLE Publishers (PU_Id TEXT, platform_id TEXT, Publisher TEXT);
        CREATE TABLE Musicians (MU_Id TEXT, platform_id TEXT, Musician TEXT);
        CREATE TABLE Languages (LA_Id TEXT, platform_id TEXT, Language TEXT);`);
      rebuildGameView(db);
      for (const [code, isPal, isNtsc] of [['1', 1, 0], ['2', 0, 1], ['3', 1, 1], ['4', 1, 1], [' p ', 1, 0], ['N', 0, 1], ['B', 1, 1], ['0', 0, 0], [null, 0, 0]]) {
        db.exec('DELETE FROM Games');
        db.prepare('INSERT INTO Games (platform_id, V_PalNTSC) VALUES (?, ?)').run('c64', code);
        expect(db.prepare('SELECT isPal,isNtsc FROM GameView').get()).toEqual({ isPal, isNtsc });
      }
      db.prepare('INSERT INTO Games (platform_id,V_PalNTSC) VALUES (?,?)').run('atari800', '1');
      expect(db.prepare("SELECT isPal,isNtsc FROM GameView WHERE platformId='atari800'").get()).toEqual({ isPal: 0, isNtsc: 0 });
    } finally { db.close(); }
  });
});
