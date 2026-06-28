import { expect, test, describe } from 'vitest';
import { sortGames } from './sorting';
import { Game } from '../types/game';

const localTestGames: Game[] = [
  {
    id: 1,
    name: 'Archon: The Light and the Dark',
    filename: 'Archon.zip',
    gameFilename: 'Archon(Free Fall Associates)(EA).d64',
    screenshotFilename: 'archon_1.png',
    boxFrontFilename: 'archon_box.jpg',
    titlescreenFilename: 'archon_title.png',
    videoSnapFilename: 'archon_snap.mp4',
    sidFilename: 'archon.sid',
    crc: '1234abcd',
    year: 1983,
    isPal: true,
    isNtsc: true,
    trueDriveEmu: false,
    isClassic: true,
    parentGenre: 'Strategy',
    subGenre: 'Action Strategy',
    developer: { id: 10, name: 'Free Fall Associates' },
    publisher: { id: 20, name: 'Electronic Arts' },
  },
  {
    id: 2,
    name: 'Boulder Dash',
    filename: 'Boulder_Dash.zip',
    gameFilename: 'Boulder Dash(First Star Software).d64',
    screenshotFilename: 'boulder_dash.png',
    boxFrontFilename: 'boulder_dash_box.jpg',
    titlescreenFilename: 'boulder_dash_title.png',
    videoSnapFilename: 'boulder_dash_snap.mp4',
    sidFilename: 'boulder_dash.sid',
    crc: '5678efgh',
    year: 1984,
    isPal: true,
    isNtsc: true,
    trueDriveEmu: false,
    isClassic: true,
    parentGenre: 'Action',
    subGenre: 'Puzzle',
    developer: { id: 11, name: 'First Star Software' },
    publisher: { id: 11, name: 'First Star Software' },
  },
  {
    id: 3,
    name: 'Commando',
    filename: 'Commando.zip',
    gameFilename: 'Commando(Elite Systems).d64',
    screenshotFilename: 'commando.png',
    boxFrontFilename: 'commando_box.jpg',
    titlescreenFilename: 'commando_title.png',
    videoSnapFilename: null,
    sidFilename: 'commando.sid',
    crc: '9999ffff',
    year: 1985,
    isPal: true,
    isNtsc: true,
    trueDriveEmu: false,
    isClassic: true,
    parentGenre: 'Action',
    subGenre: 'Run and Gun',
    developer: { id: 12, name: 'Elite Systems' },
    publisher: { id: 22, name: 'Elite Systems' },
  },
  {
    id: 4,
    name: 'Unknown Game',
    filename: 'unknown.zip',
    gameFilename: null,
    screenshotFilename: null,
    boxFrontFilename: null,
    titlescreenFilename: null,
    videoSnapFilename: null,
    sidFilename: null,
    crc: '00000000',
    year: null,
    isPal: true,
    isNtsc: false,
    trueDriveEmu: true,
    isClassic: false,
    parentGenre: 'Unknown',
    subGenre: 'Internal',
    developer: null,
    publisher: null,
  },
];

describe('sorting logic', () => {
  test('sort by name ascending (alphabetical)', () => {
    const sorted = sortGames(localTestGames, 'name', 'asc');
    expect(sorted[0].name).toBe('Archon: The Light and the Dark');
    expect(sorted[1].name).toBe('Boulder Dash');
  });

  test('sort by name descending', () => {
    const sorted = sortGames(localTestGames, 'name', 'desc');
    expect(sorted[0].name).toBe('Unknown Game');
    expect(sorted[1].name).toBe('Commando');
  });

  test('sort by year (nulls sink to bottom)', () => {
    const sorted = sortGames(localTestGames, 'year', 'asc');
    expect(sorted[0].year).toBe(1983);
    expect(sorted[1].year).toBe(1984);
    expect(sorted[3].year).toBe(null); // sinks
  });
});
