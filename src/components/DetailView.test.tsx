import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { clearDetailCache, DetailView } from './DetailView';
import { createDefaultPlatformSettingsMap } from '../lib/platform-capabilities';
import type { Game } from '../types/game';

// Mock hooks and contexts
vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      activePlatformId: mockActivePlatformId,
      platformSettings: createDefaultPlatformSettingsMap(),
    },
    resolveMediaPath: (type: string, filename: string) => `/mocked-${type}/${filename}`,
    findAllVariants: vi.fn().mockImplementation(() => Promise.resolve([])),
  }),
}));

vi.mock('../hooks/useFavorites', () => ({
  useFavorites: () => ({
    isFavorite: () => false,
    toggleFavorite: vi.fn(),
  }),
}));

vi.mock('../hooks/useInputMode', () => ({
  useInputMode: () => ({
    showMouse: true,
  }),
}));

vi.mock('../hooks/useGamepad', () => ({
  useGamepad: vi.fn(),
}));

vi.mock('../hooks/usePopupOpenSound', () => ({
  usePopupOpenSound: vi.fn(),
}));

const mockGetDbGameDetail = vi.hoisted(() => vi.fn());

vi.mock('../lib/tauri-bridge', () => ({
  getDbGameDetail: (...args: unknown[]) => mockGetDbGameDetail(...args),
  getGameExtras: vi.fn().mockImplementation(() => Promise.resolve([])),
}));

let mockActivePlatformId = 'c64';

const mockGame: Game = {
  id: 1,
  name: 'Test C64 Game',
  filename: 'test.prg',
  gameFilename: null,
  screenshotFilename: 'test_1.png',
  boxFrontFilename: 'test_box.png',
  coverPath: null,
  titlescreenFilename: null,
  videoSnapFilename: null,
  sidFilename: 'test.sid',
  crc: '12345678',
  year: 1985,
  isPal: true,
  isNtsc: false,
  trueDriveEmu: false,
  isClassic: true,
  parentGenre: 'Arcade',
  subGenre: 'Shooter',
  developer: null,
  publisher: null,
};

describe('DetailView platform capability gating', () => {
  beforeEach(() => {
    mockGetDbGameDetail.mockResolvedValue(null);
    clearDetailCache();
  });

  afterEach(() => {
    cleanup();
  });

  test('reuses cached detail data when the same platform game is reopened', async () => {
    const first = render(<DetailView game={mockGame} onBack={vi.fn()} />);
    await waitFor(() => expect(mockGetDbGameDetail).toHaveBeenCalledTimes(1));
    first.unmount();

    render(<DetailView game={mockGame} onBack={vi.fn()} />);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockGetDbGameDetail).toHaveBeenCalledTimes(1);
  });

  test('renders Soundtrack Module for C64 platform', () => {
    mockActivePlatformId = 'c64';
    render(<DetailView game={mockGame} onBack={vi.fn()} />);
    expect(screen.queryByText('Soundtrack Module')).toBeTruthy();
  });

  test('does not render Soundtrack Module for Atari 2600 platform', () => {
    mockActivePlatformId = 'atari2600';
    render(<DetailView game={mockGame} onBack={vi.fn()} />);
    expect(screen.queryByText('Soundtrack Module')).toBeNull();
  });
});
