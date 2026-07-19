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
      platformSettings: {
        ...createDefaultPlatformSettingsMap(),
        c64: {
          ...createDefaultPlatformSettingsMap().c64,
          folders: {
            ...createDefaultPlatformSettingsMap().c64.folders,
            screenshotsPath: mockScreenshotsPath,
          },
        },
      },
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

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      id: mockThemeId,
      displayName: 'Arcade Void & Neon Acrylic',
      colors: {
        primary: '#8aebff',
        primaryContainer: '#0e3038',
        secondary: '#a855f7',
        tertiary: '#eab308',
        surface: '#141A21',
        background: '#0a0c10',
        outline: '#1f2937',
        outlineVariant: '#374151',
        text: '#ffffff',
        textMuted: '#9ca3af',
      },
      typography: {
        sans: '"Manrope", sans-serif',
        mono: 'monospace',
      },
      borderRadius: {
        sm: '2px',
        md: '4px',
        lg: '8px',
        xl: '12px',
      },
      effects: {
        scanlines: false,
        outerBorder: false,
        ambientGlow: true,
        steppedBorders: false,
        blinkingCursor: false,
      },
    },
  }),
}));

const mockGetDbGameDetail = vi.hoisted(() => vi.fn());

vi.mock('../lib/tauri-bridge', () => ({
  getDbGameDetail: (...args: unknown[]) => mockGetDbGameDetail(...args),
  getGameExtras: vi.fn().mockImplementation(() => Promise.resolve([])),
  isDebugMode: vi.fn().mockResolvedValue(false),
  isTauri: () => false,
}));

let mockActivePlatformId = 'c64';
let mockThemeId = 'arcade-void';
let mockScreenshotsPath = '';

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
    mockActivePlatformId = 'c64';
    mockThemeId = 'arcade-void';
    mockScreenshotsPath = '';
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

  test('renders publisher and developer separated by a pipe under the game title', async () => {
    mockActivePlatformId = 'c64';
    const gameWithStudios: Game = {
      ...mockGame,
      publisher: { id: 1, name: 'Origin Systems' },
      developer: { id: 2, name: 'MicroProse' },
    };
    render(<DetailView game={gameWithStudios} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Origin Systems | MicroProse')).toBeTruthy();
    });
  });

  test('renders Unknown under the game title if developer and publisher are missing', async () => {
    mockActivePlatformId = 'c64';
    render(<DetailView game={mockGame} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getAllByText('Unknown').length).toBeGreaterThan(0);
    });
  });

  test('uses C64 box art as the title panel background', async () => {
    mockThemeId = 'c64-edition';
    mockScreenshotsPath = 'D:/boxart';

    render(<DetailView game={mockGame} onBack={vi.fn()} />);

    const titlePanel = await screen.findByTestId('c64-detail-title-panel');
    expect(titlePanel.querySelector('img')?.getAttribute('src')).toBe('D:/boxart/test_box.png');
  });
});
