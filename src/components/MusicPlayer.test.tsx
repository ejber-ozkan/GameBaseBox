import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { MusicPlayer } from './MusicPlayer';

vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      scrapedMediaPath: '/media/scraped',
      activePlatformId: 'c64',
    },
    resolveMediaPath: (type: string, filename: string) => `/mocked-${type}/${filename}`,
  }),
}));

vi.mock('../lib/tauri-bridge', () => ({
  downloadMediaAsset: vi.fn(),
  getMediaUrl: vi.fn().mockImplementation((path) => Promise.resolve(`blob:${path}`)),
  resolveMediaPath: vi.fn(),
  isDebugMode: vi.fn().mockResolvedValue(false),
}));

describe('MusicPlayer', () => {
  test('uses SID and HVSC controls only for C64 music', () => {
    render(<MusicPlayer platformId="c64" filename="Commando.sid" audioUrl="/music/Commando.sid" />);

    expect(screen.getByText(/Commando\.sid/i)).toBeTruthy();
    expect(screen.getByTitle('Play SID')).toBeTruthy();
  });

  test('uses SAP controls for Atari 800 music without SID or HVSC labels', () => {
    render(<MusicPlayer platformId="atari800" filename="Ballblazer.sap" audioUrl="/music/Ballblazer.sap" />);

    expect(screen.getByText(/Ballblazer\.sap/i)).toBeTruthy();
    expect(screen.getByTitle('Play SAP')).toBeTruthy();
    expect(screen.queryByText(/SID/i)).toBeNull();
    expect(screen.queryByText(/HVSC/i)).toBeNull();
    expect(screen.queryByText(/Scrape/i)).toBeNull();
  });

  test('hides music controls for platforms without music playback', () => {
    const { container } = render(<MusicPlayer platformId="atari2600" filename="sound.bin" />);

    expect(container.textContent).toBe('');
  });
});
