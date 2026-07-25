import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { SidPlayer } from './SidPlayer';

vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({ settings: { activePlatformId: 'c64', platformSettings: {}, scrapedMediaPath: '' } }),
}));
vi.mock('../lib/tauri-bridge', () => ({ resolveMediaPath: vi.fn(), downloadMediaAsset: vi.fn(), getMediaUrl: vi.fn() }));

describe('SidPlayer theme treatment', () => {
  test('uses theme panel, text, and accent tokens for compact soundtrack controls', () => {
    render(<SidPlayer filename="Commando.sid" audioUrl="/music/Commando.sid" compact />);

    expect(screen.getByTestId('sid-player').className).toContain('bg-theme-surface');
    expect(screen.getByTestId('sid-player').className).toContain('border-theme-outline');
    expect(screen.getByText(/Commando\.sid/i).className).toContain('text-theme-primary');
  });
});
