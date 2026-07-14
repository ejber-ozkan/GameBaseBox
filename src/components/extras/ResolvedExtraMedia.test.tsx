import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Extra } from '../../types/game';
import { ResolvedExtraMedia } from './ResolvedExtraMedia';

const mockResolveExtraVideo = vi.fn();
const mockGetAssetUrl = vi.fn();
const mockOpenFile = vi.fn();
const mockConvertExtraVideo = vi.fn();
const mockDownloadArchiveExtraVideo = vi.fn();

vi.mock('../../lib/tauri-bridge', () => ({
  resolveExtraVideo: (...args: unknown[]) => mockResolveExtraVideo(...args),
  getAssetUrl: (...args: unknown[]) => mockGetAssetUrl(...args),
  openFile: (...args: unknown[]) => mockOpenFile(...args),
  convertExtraVideo: (...args: unknown[]) => mockConvertExtraVideo(...args),
  downloadArchiveExtraVideo: (...args: unknown[]) => mockDownloadArchiveExtraVideo(...args),
}));

const video: Extra = {
  id: 'video-1',
  name: 'Rambo video',
  path: 'Videos\\C64GVA319-Rambo.avi',
  type: 'video',
};

describe('ResolvedExtraMedia video compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAssetUrl.mockImplementation(async (path: string) => `asset://${path}`);
    mockOpenFile.mockResolvedValue(undefined);
    mockConvertExtraVideo.mockResolvedValue({
      path: 'E:/Extras/Videos/C64GVA319-Rambo.mp4',
      message: 'Compatible MP4 created.',
    });
    mockDownloadArchiveExtraVideo.mockResolvedValue({
      path: 'E:/Extras/Videos/C64GVA319-Rambo.mp4',
      message: 'Compatible MP4 downloaded.',
    });
  });

  it('prefers a compatible same-stem sidecar without changing the database extra path', async () => {
    mockResolveExtraVideo.mockResolvedValue({
      originalPath: 'E:/Extras/Videos/C64GVA319-Rambo.avi',
      playbackPath: 'E:/Extras/Videos/C64GVA319-Rambo.mp4',
      originalExists: true,
      compatibleSidecar: true,
    });

    const { container } = render(
      <ResolvedExtraMedia extra={video} extrasPath="E:/Extras" className="media" mode="fullscreen" />
    );

    await waitFor(() => {
      expect(container.querySelector('video')?.getAttribute('src')).toBe(
        'asset://E:/Extras/Videos/C64GVA319-Rambo.mp4'
      );
    });
    expect(mockResolveExtraVideo).toHaveBeenCalledWith('E:/Extras', video.path);
    fireEvent.click(screen.getByRole('button', { name: /open original externally/i }));
    expect(mockOpenFile).toHaveBeenCalledWith('E:/Extras/Videos/C64GVA319-Rambo.avi');
  });

  it('offers the system player and non-destructive conversion after AVI preview fails', async () => {
    mockResolveExtraVideo
      .mockResolvedValueOnce({
        originalPath: 'E:/Extras/Videos/C64GVA319-Rambo.avi',
        playbackPath: 'E:/Extras/Videos/C64GVA319-Rambo.avi',
        originalExists: true,
        compatibleSidecar: false,
      })
      .mockResolvedValueOnce({
        originalPath: 'E:/Extras/Videos/C64GVA319-Rambo.avi',
        playbackPath: 'E:/Extras/Videos/C64GVA319-Rambo.mp4',
        originalExists: true,
        compatibleSidecar: true,
      });

    const { container } = render(
      <ResolvedExtraMedia extra={video} extrasPath="E:/Extras" className="media" mode="fullscreen" />
    );

    await waitFor(() => expect(container.querySelector('video')).not.toBeNull());
    fireEvent.error(container.querySelector('video')!);

    expect((await screen.findByText(/cannot be previewed in GBBox/i)).textContent).toMatch(/cannot be previewed/i);
    fireEvent.click(screen.getByRole('button', { name: /open in video player/i }));
    expect(mockOpenFile).toHaveBeenCalledWith('E:/Extras/Videos/C64GVA319-Rambo.avi');

    fireEvent.click(screen.getByRole('button', { name: /create compatible MP4 copy/i }));
    await waitFor(() => {
      expect(mockConvertExtraVideo).toHaveBeenCalledWith('E:/Extras', video.path);
      expect(mockResolveExtraVideo).toHaveBeenCalledTimes(2);
    });
  });

  it('offers an Archive.org MP4 derivative when the referenced video is missing locally', async () => {
    mockResolveExtraVideo
      .mockResolvedValueOnce({
        originalPath: 'E:/Extras/Videos/C64GVA319-Rambo.avi',
        playbackPath: null,
        originalExists: false,
        compatibleSidecar: false,
        archiveCandidate: true,
      })
      .mockResolvedValueOnce({
        originalPath: 'E:/Extras/Videos/C64GVA319-Rambo.avi',
        playbackPath: 'E:/Extras/Videos/C64GVA319-Rambo.mp4',
        originalExists: false,
        compatibleSidecar: true,
        archiveCandidate: true,
      });

    render(<ResolvedExtraMedia extra={video} extrasPath="E:/Extras" className="media" />);

    expect((await screen.findByText(/video file is not available locally/i)).textContent).toMatch(/not available locally/i);
    expect(screen.queryByRole('button', { name: /open in video player/i })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /download compatible MP4/i }));
    await waitFor(() => {
      expect(mockDownloadArchiveExtraVideo).toHaveBeenCalledWith('E:/Extras', video.path);
      expect(mockResolveExtraVideo).toHaveBeenCalledTimes(2);
    });
  });

  it('does not offer the C64 Archive.org downloader for unrelated missing videos', async () => {
    mockResolveExtraVideo.mockResolvedValue({
      originalPath: 'E:/Extras/Videos/Atari-Longplay-PacMan.avi',
      playbackPath: null,
      originalExists: false,
      compatibleSidecar: false,
      archiveCandidate: false,
    });

    render(
      <ResolvedExtraMedia
        extra={{ ...video, path: 'Videos\\Atari-Longplay-PacMan.avi' }}
        extrasPath="E:/Extras"
        className="media"
      />
    );

    await screen.findByText(/video file is not available locally/i);
    expect(screen.queryByRole('button', { name: /download compatible MP4/i })).toBeNull();
  });
});
