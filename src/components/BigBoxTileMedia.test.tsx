import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BigBoxTileMedia } from './BigBoxTileMedia';
import { mockGames } from '../data/mockGames';

const { findAllVariants, getAssetUrl, resolveMediaPath } = vi.hoisted(() => ({
  findAllVariants: vi.fn(),
  getAssetUrl: vi.fn(),
  resolveMediaPath: vi.fn(),
}));

vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      activePlatformId: 'c64',
      platformSettings: {
        c64: {
          folders: {
            extrasPath: 'D:/Stage7/Extras',
            screenshotsPath: 'D:/Stage7/Screenshots',
          },
        },
      },
    },
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
});
