import { expect, test, describe, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { SidPlayer } from './SidPlayer';
import { downloadMediaAsset, resolveMediaPath } from '../lib/tauri-bridge';

// Mock useSettings
vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      scrapedMediaPath: '/media/scraped',
      activePlatformId: 'c64',
      platformSettings: {
        c64: {
          folders: {
            musicPath: '/media/local-music',
          },
        },
      },
    },
    markAsPlayed: vi.fn(),
    resolveMediaPath: vi.fn()
  })
}));

let mockThemeId = 'default';

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: { id: mockThemeId },
    setTheme: vi.fn(),
    availableThemes: []
  })
}));

// Mock tauri-bridge
vi.mock('../lib/tauri-bridge', () => ({
  downloadMediaAsset: vi.fn(),
  resolveMediaPath: vi.fn(),
  getMediaUrl: vi.fn().mockImplementation((path) => Promise.resolve(`blob:${path}`)),
  isDebugMode: vi.fn().mockResolvedValue(false),
}));

describe('SidPlayer Component', () => {

  beforeEach(() => {
    vi.mocked(resolveMediaPath).mockResolvedValue({ exists: false, absolute_path: '' });
    vi.mocked(downloadMediaAsset).mockResolvedValue({
      exists: true,
      absolute_path: '/media/scraped/MUSICIANS/B/Beben_Wally/Hammerfist.sid',
    });

    function MockSidPlayer(this: { loadstart: ReturnType<typeof vi.fn>; setvolume: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> }) {
      this.loadstart = vi.fn();
      this.setvolume = vi.fn();
      this.pause = vi.fn();
    }

    vi.stubGlobal('jsSID', MockSidPlayer);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    if (typeof window !== 'undefined') {
      delete window.SIDplayer;
    }
  });

  test('renders "No SID track available" when filename is null', () => {
    render(<SidPlayer filename={null} />);
    expect(screen.getByText('No SID track available')).not.toBeNull();
  });

  test('renders player UI correctly when filename exists', () => {
    render(<SidPlayer filename="test.sid" audioUrl="/audio/test.sid" />);
    expect(screen.getByText(/test\.sid/i)).not.toBeNull();
    expect(screen.getByText('STOPPED')).not.toBeNull();
  });

  test('toggles play state properly upon clicking play button', async () => {
    render(<SidPlayer filename="test.sid" audioUrl="/audio/test.sid" />);
    const playBtn = screen.getByTestId('play-button');

    // Default state
    expect(screen.getByText('STOPPED')).not.toBeNull();

    // Interact
    await act(async () => {
      fireEvent.click(playBtn);
    });
    
    // Validate toggled
    await waitFor(() => {
      expect(screen.getByText('PLAYING')).not.toBeNull();
    }, { timeout: 2000 });

    // Turn off
    await act(async () => {
      fireEvent.click(playBtn);
    });
    
    // Validate toggled off
    await waitFor(() => {
      expect(screen.getByText('STOPPED')).not.toBeNull();
    });
  });
  
  test('volume slider updates correctly', async () => {
    render(<SidPlayer filename="test.sid" audioUrl="/audio/test.sid" />);
    
    // First click play to init the player
    const playBtn = screen.getByTestId('play-button');
    await act(async () => {
      fireEvent.click(playBtn);
    });

    const slider = screen.getByTestId('volume-slider') as HTMLInputElement;

    // Default slider pos 0.5
    expect(slider.value).toBe('0.5');

    // Simulate changed slide event
    fireEvent.change(slider, { target: { value: '0.8'} });
    
    await waitFor(() => {
      expect(slider.value).toBe('0.8');
    });
  });

  test('offers HVSC scrape after local and scraped SID paths are both missing', async () => {
    render(<SidPlayer filename={'MUSICIANS\\B\\Beben_Wally\\Hammerfist.sid'} />);

    await waitFor(() => {
      expect(resolveMediaPath).toHaveBeenCalledWith(
        '/media/local-music',
        'MUSICIANS/B/Beben_Wally/Hammerfist.sid',
      );
      expect(resolveMediaPath).toHaveBeenCalledWith(
        '/media/scraped',
        'MUSICIANS/B/Beben_Wally/Hammerfist.sid',
      );
    });

    expect(screen.getByRole('button', { name: /scrape hvsc/i })).not.toBeNull();
  });

  test('downloads a missing SID from HVSC and enables playback', async () => {
    const filename = 'MUSICIANS\\B\\Beben_Wally\\Hammerfist.sid';
    render(<SidPlayer filename={filename} />);

    fireEvent.click(screen.getByRole('button', { name: /scrape hvsc/i }));

    await waitFor(() => {
      expect(downloadMediaAsset).toHaveBeenCalledWith(
        'https://hvsc.c64.org/download/C64Music/MUSICIANS/B/Beben_Wally/Hammerfist.sid',
        '/media/scraped',
        filename,
      );
      expect(screen.getByTestId('play-button')).not.toBeNull();
    });
  });

  test('stops playback when game-launch event is dispatched', async () => {
    render(<SidPlayer filename="test.sid" audioUrl="/audio/test.sid" />);
    const playBtn = screen.getByTestId('play-button');

    // Click play
    await act(async () => {
      fireEvent.click(playBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('PLAYING')).not.toBeNull();
    });

    // Dispatch game-launch event
    await act(async () => {
      window.dispatchEvent(new CustomEvent('game-launch'));
    });

    await waitFor(() => {
      expect(screen.getByText('STOPPED')).not.toBeNull();
    });
  });

  describe('C64 Theme Render Block', () => {
    beforeEach(() => {
      mockThemeId = 'c64-edition';
    });

    afterEach(() => {
      mockThemeId = 'default';
    });

    test('renders C64-themed labels when theme is c64-edition', () => {
      render(<SidPlayer filename="test.sid" audioUrl="/audio/test.sid" />);
      expect(screen.getByText('SOUNDTRACK // C64 SID')).not.toBeNull();
      expect(screen.getByText('6581 STANDBY')).not.toBeNull();
    });

    test('toggles to active state and shows visualizer and ACTIVE label', async () => {
      render(<SidPlayer filename="test.sid" audioUrl="/audio/test.sid" />);
      const playBtn = screen.getByTestId('play-button');

      await act(async () => {
        fireEvent.click(playBtn);
      });

      await waitFor(() => {
        expect(screen.getByText('6581 ACTIVE')).not.toBeNull();
        expect(screen.getByText('VOL')).not.toBeNull();
      });
    });
  });
});
