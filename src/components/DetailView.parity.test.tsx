import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearDetailCache, DetailView } from './DetailView';
import { defaultSettings } from '../contexts/SettingsContext';
import { BUILT_IN_THEMES } from '../themes';
import { createDefaultPlatformSettingsMap } from '../lib/platform-capabilities';
import { mockGames } from '../data/mockGames';
import { createPortal } from 'react-dom';
import type { Extra, Game } from '../types/game';

const boundary = vi.hoisted(() => ({
  launch: vi.fn(), markAsPlayed: vi.fn(), toggleFavorite: vi.fn(), extras: vi.fn(),
}));
let currentSettings = { ...defaultSettings, platformSettings: createDefaultPlatformSettingsMap() };

vi.mock('../contexts/SettingsContext', async (importOriginal) => ({
  ...await importOriginal<typeof import('../contexts/SettingsContext')>(),
  useSettings: () => ({ settings: currentSettings, markAsPlayed: boundary.markAsPlayed,
    resolveMediaPath: (type: string, filename: string) => `/fixture/${type}/${filename}`,
    findAllVariants: async () => [],
  }),
}));
vi.mock('../contexts/ThemeContext', () => ({ useTheme: () => ({
  theme: BUILT_IN_THEMES.find((theme) => theme.id === currentSettings.themeId)!,
}) }));
vi.mock('../hooks/useFavorites', () => ({ useFavorites: () => ({ isFavorite: () => false, toggleFavorite: boundary.toggleFavorite }) }));
vi.mock('../hooks/useInputMode', () => ({ useInputMode: () => ({ showMouse: true }) }));
vi.mock('../hooks/useGamepad', () => ({ useGamepad: vi.fn() }));
vi.mock('../hooks/usePopupOpenSound', () => ({ usePopupOpenSound: vi.fn() }));
vi.mock('../lib/ui-sound-effects', () => ({ playUiSoundEffect: vi.fn() }));
vi.mock('../lib/tauri-bridge', () => ({
  getDbGameDetail: async () => null, getGameExtras: boundary.extras,
  launchEmulator: boundary.launch, isTauri: () => false, isDebugMode: async () => false,
}));
vi.mock('./ImageSlider', () => ({ ImageSlider: ({ filename, alt }: { filename: string; alt: string }) =>
  <div role="img" aria-label={alt} data-testid="fixture-image" data-filename={filename} /> }));
vi.mock('./ImageWithFallback', () => ({ ImageWithFallback: ({ alt }: { alt: string }) => <div role="img" aria-label={alt} /> }));
vi.mock('./MusicianPhoto', () => ({ MusicianPhoto: ({ musicianName }: { musicianName: string }) => <span>{musicianName}</span> }));
vi.mock('./MusicPlayer', () => ({ MusicPlayer: () => <button id="sid-play-btn">Play fixture soundtrack</button> }));
vi.mock('./WasmPlayer', () => ({ WasmPlayer: ({ onClose }: { onClose: () => void }) =>
  createPortal(<div data-testid="fixture-embedded-player"><button onClick={onClose}>Close fixture emulator</button></div>, document.body) }));
vi.mock('./detail/C64ShaderBackground', () => ({ C64ShaderBackground: () => null }));
vi.mock('./ExtrasDetail', () => ({ ExtrasDetail: ({ extras }: { extras: Extra[] }) =>
  <output data-testid="fixture-extras">{extras.map((extra) => extra.path).join('|')}</output> }));

const game: Game = {
  ...mockGames[0], name: 'Parity Fixture', filename: 'Games/primary.d64',
  screenshotFilename: 'gameplay.png', titlescreenFilename: 'title.png', videoSnapFilename: 'clip.mp4',
  boxFrontFilename: 'box.png', sidFilename: 'soundtrack.sid',
  musician: { id: 21, name: 'Fixture Musician', photoPath: null, group: null, nick: 'Fixture Nick' },
  coderName: 'Fixture Programmer', graphicsName: 'Fixture Artist',
  versionBy: 'Fixture Release', vLength: '123', vTrainers: '2', vPalNtsc: 'PAL',
  vLoadingScreen: true, vHighScoreSaver: true, vIncludedDocs: true, vTrueDriveEmu: false,
  comment: 'Fixture archive notes',
};
const extras: Extra[] = [
  { id: 'manual', name: 'Fixture Manual', path: 'Docs/manual.pdf', type: 'doc' },
  { id: 'variant', name: 'Fixture Alternate Disk', path: 'Disks/alternate.d64', type: 'game' },
];
const cases = ['arcade-void', 'c64-edition', 'cyberpunk-crt'].flatMap((themeId) =>
  [false, true].map((isFullscreen) => ({ themeId, isFullscreen })));

describe('active unified detail preservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearDetailCache();
    localStorage.clear();
    currentSettings = { ...defaultSettings, platformSettings: createDefaultPlatformSettingsMap() };
    currentSettings.platformSettings.c64.folders.gamesPath = '/fixture/Games';
    currentSettings.platformSettings.c64.folders.extrasPath = '/fixture/Extras';
    currentSettings.platformSettings.c64.folders.screenshotsPath = '/fixture/Screenshots';
    currentSettings.platformSettings.c64.emulator.executablePaths['vice-c64'] = '/fixture/vice';
    boundary.extras.mockResolvedValue(extras);
    boundary.launch.mockResolvedValue({ success: true, message: 'Fixture launch' });
  });
  afterEach(cleanup);

  it.each(cases)('retains media, extras, play and focus actions in $themeId fullscreen=$isFullscreen', async ({ themeId, isFullscreen }) => {
    currentSettings = { ...currentSettings, themeId, isFullscreen };
    const onBack = vi.fn();
    render(<DetailView game={game} onBack={onBack} />);
    await waitFor(() => expect(boundary.extras).toHaveBeenCalledWith(game.id, 'c64'));
    expect(screen.getAllByRole('heading', { name: /Parity Fixture/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Play fixture soundtrack' })).toBeTruthy();
    expect(screen.getAllByText('Fixture Alternate Disk').length).toBeGreaterThan(0);

    // The real detail navigation starts on play and invokes the active layout's action.
    fireEvent.keyDown(window, { key: 'Enter' });
    await waitFor(() => expect(boundary.launch).toHaveBeenCalledOnce());
    await act(async () => {});
    expect(boundary.launch).toHaveBeenCalledWith(expect.objectContaining({ platform_id: 'c64', game_id: game.id.toString() }));
    const embeddedPlay = document.getElementById('play-browser-btn');
    expect(embeddedPlay).toBeTruthy();
    fireEvent.click(embeddedPlay!);
    expect(await screen.findByTestId('fixture-embedded-player')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close fixture emulator' }));
    fireEvent.keyDown(window, { key: 'f' });
    expect(boundary.toggleFavorite).toHaveBeenCalledExactlyOnceWith(game.id.toString());

    // C64 uses image previews where the other themes show labeled media tabs.
    const titleScreen = screen.queryByRole('button', { name: /^Title Screen/ }) ??
      screen.getAllByTestId('fixture-image').find((node) => node.getAttribute('data-filename') === 'title.png')?.closest('button');
    expect(titleScreen).toBeTruthy();
    fireEvent.mouseMove(window);
    fireEvent.mouseEnter(titleScreen!);
    fireEvent.click(titleScreen!);
    fireEvent.keyDown(window, { key: 'Enter' });
    const modal = document.querySelector('[data-detail-modal="open"]');
    expect(modal).toBeTruthy();
    expect(modal?.querySelector('[data-filename]')?.getAttribute('data-filename')).toBe('title.png');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.querySelector('[data-detail-modal="open"]')).toBeNull();
    expect(onBack).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /^Extras/ }));
    expect(screen.getByTestId('fixture-extras').textContent).toBe('Docs/manual.pdf');
    fireEvent.click(screen.getByRole('button', { name: /Credits/i }));
    expect(screen.getAllByText('Fixture Musician').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fixture Programmer').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fixture Artist').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Library' }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
