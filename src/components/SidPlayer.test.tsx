import { expect, test, describe, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { SidPlayer } from './SidPlayer';

// Mock useSettings
vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      scrapedMediaPath: '/media/scraped',
      activePlatformId: 'c64'
    },
    markAsPlayed: vi.fn(),
    resolveMediaPath: vi.fn()
  })
}));

// Mock tauri-bridge
vi.mock('../lib/tauri-bridge', () => ({
  downloadMediaAsset: vi.fn(),
  resolveMediaPath: vi.fn(),
  getMediaUrl: vi.fn().mockImplementation((path) => Promise.resolve(`blob:${path}`))
}));

describe('SidPlayer Component', () => {

  beforeEach(() => {
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
});
