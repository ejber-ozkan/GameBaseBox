import { cleanup, render, screen, waitFor, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BigBoxTileMedia } from './BigBoxTileMedia';
import { mockGames } from '../data/mockGames';

const { findAllVariants, getAssetUrl, resolveMediaPath, mockSettings } = vi.hoisted(() => ({
  findAllVariants: vi.fn(),
  getAssetUrl: vi.fn(),
  resolveMediaPath: vi.fn(),
  mockSettings: {
    activePlatformId: 'c64',
    imageCycling: true,
    platformSettings: {
      c64: {
        folders: {
          extrasPath: 'D:/Stage7/Extras',
          screenshotsPath: 'D:/Stage7/Screenshots',
        },
      },
    },
  },
}));

vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
    findAllVariants,
  }),
}));

vi.mock('../lib/tauri-bridge', () => ({
  getAssetUrl,
  resolveMediaPath,
}));

describe('BigBoxTileMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findAllVariants.mockResolvedValue(['asset://stage7/screenshot.png']);
    resolveMediaPath.mockResolvedValue({ absolute_path: 'D:/Stage7/Extras/cover.png', exists: true });
    getAssetUrl.mockResolvedValue('asset://stage7/cover.png');
  });

  afterEach(() => {
    cleanup();
  });

  it('keeps BigBox rail artwork lazy and reuses the in-memory requests after a remount', async () => {
    const game = {
      ...mockGames[0],
      coverPath: 'Stage7/cover.png',
      screenshotFilename: 'stage7-screenshot.png',
    };
    const first = render(<BigBoxTileMedia game={game} />);

    const firstImage = await screen.findByAltText(game.name);
    expect(firstImage.getAttribute('loading')).toBe('lazy');
    expect(findAllVariants).toHaveBeenCalledTimes(1);
    expect(resolveMediaPath).toHaveBeenCalledTimes(1);
    first.unmount();

    render(<BigBoxTileMedia game={game} />);

    await waitFor(() => expect(screen.getByAltText(game.name)).toBeTruthy());
    expect(findAllVariants).toHaveBeenCalledTimes(1);
    expect(resolveMediaPath).toHaveBeenCalledTimes(1);
  });

  it('does not request media for a rail tile that is disabled', async () => {
    const game = {
      ...mockGames[1],
      coverPath: 'Stage7/disabled-cover.png',
      screenshotFilename: 'stage7-disabled-screenshot.png',
    };
    render(<BigBoxTileMedia enabled={false} game={game} />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(findAllVariants).not.toHaveBeenCalled();
    expect(resolveMediaPath).not.toHaveBeenCalled();
  });

  it('does not cycle screenshots if settings.imageCycling is false', async () => {
    vi.useFakeTimers();
    mockSettings.imageCycling = false;
    findAllVariants.mockResolvedValue([
      'asset://stage7/screenshot1.png',
      'asset://stage7/screenshot2.png',
    ]);

    const game = {
      ...mockGames[0],
      coverPath: '',
      screenshotFilename: 'stage7-screenshot-nocycle.png',
    };

    render(<BigBoxTileMedia game={game} />);

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    const img = screen.getByAltText(game.name);
    expect(img.getAttribute('src')).toBe('asset://stage7/screenshot1.png');

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(img.getAttribute('src')).toBe('asset://stage7/screenshot1.png');
    vi.useRealTimers();
  });

  it('cycles screenshots if settings.imageCycling is true', async () => {
    vi.useFakeTimers();
    mockSettings.imageCycling = true;
    findAllVariants.mockResolvedValue([
      'asset://stage7/screenshot1.png',
      'asset://stage7/screenshot2.png',
    ]);

    const game = {
      ...mockGames[0],
      coverPath: '',
      screenshotFilename: 'stage7-screenshot-cycle.png',
    };

    render(<BigBoxTileMedia game={game} />);

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    const img = screen.getByAltText(game.name);
    expect(img.getAttribute('src')).toBe('asset://stage7/screenshot1.png');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3500);
    });

    const img2 = screen.getByAltText(game.name);
    expect(img2.getAttribute('src')).toBe('asset://stage7/screenshot2.png');
    vi.useRealTimers();
  });
});
