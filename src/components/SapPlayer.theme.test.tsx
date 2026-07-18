import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { SapPlayer } from './SapPlayer';

vi.mock('../lib/tauri-bridge', () => ({ getMediaUrl: vi.fn().mockImplementation((path) => Promise.resolve(`blob:${path}`)) }));

describe('SapPlayer theme treatment', () => {
  test('uses selected-theme tokens instead of an unrelated amber panel', () => {
    render(<SapPlayer filename="Ballblazer.sap" audioUrl="/music/Ballblazer.sap" compact />);

    expect(screen.getByTestId('sap-player').className).toContain('bg-theme-surface');
    expect(screen.getByText(/Ballblazer\.sap/i).className).toContain('text-theme-primary');
  });

  test('stops playback when game-launch event is dispatched', async () => {
    // Stub ASAPPlayer
    function MockSapPlayer(this: { load: ReturnType<typeof vi.fn>; play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; setvolume: ReturnType<typeof vi.fn>; setVolume: ReturnType<typeof vi.fn> }) {
      this.load = vi.fn().mockResolvedValue(undefined);
      this.play = vi.fn();
      this.pause = vi.fn();
      this.stop = vi.fn();
      this.setvolume = vi.fn();
      this.setVolume = vi.fn();
    }
    vi.stubGlobal('ASAPPlayer', MockSapPlayer);

    render(<SapPlayer filename="Ballblazer.sap" audioUrl="/music/Ballblazer.sap" />);
    
    const playBtn = screen.getByTestId('sap-play-button');

    // Default state
    expect(screen.getByText('SAP STANDBY')).not.toBeNull();

    // Click play
    await act(async () => {
      fireEvent.click(playBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('SAP ACTIVE')).not.toBeNull();
    });

    // Dispatch game-launch event
    await act(async () => {
      window.dispatchEvent(new CustomEvent('game-launch'));
    });

    await waitFor(() => {
      expect(screen.getByText('SAP STANDBY')).not.toBeNull();
    });

    vi.unstubAllGlobals();
  });
});
