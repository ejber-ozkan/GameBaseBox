import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import type { Extra } from '../../types/game';
import { ResolvedExtraMedia } from './ResolvedExtraMedia';

const mockResolveExtraVideo = vi.fn();
const mockGetAssetUrl = vi.fn();
const mockIsDebugMode = vi.fn();
const mockLogDebugMessage = vi.fn();
const mockOpenFile = vi.fn();
const mockConvertExtraVideo = vi.fn();
const mockDownloadArchiveExtraVideo = vi.fn();
const mockListenExtraVideoDownloadProgress = vi.fn();
let downloadProgressListener: ((progress: {
  relativePath: string;
  bytesDownloaded: number;
  totalBytes: number | null;
  percent: number | null;
  bytesPerSecond: number;
  secondsRemaining: number | null;
}) => void) | null = null;

vi.mock('../../lib/tauri-bridge', () => ({
  resolveExtraVideo: (...args: unknown[]) => mockResolveExtraVideo(...args),
  getAssetUrl: (...args: unknown[]) => mockGetAssetUrl(...args),
  isDebugMode: () => mockIsDebugMode(),
  logDebugMessage: (...args: unknown[]) => mockLogDebugMessage(...args),
  openFile: (...args: unknown[]) => mockOpenFile(...args),
  convertExtraVideo: (...args: unknown[]) => mockConvertExtraVideo(...args),
  downloadArchiveExtraVideo: (...args: unknown[]) => mockDownloadArchiveExtraVideo(...args),
  listenExtraVideoDownloadProgress: (...args: unknown[]) => mockListenExtraVideoDownloadProgress(...args),
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
    downloadProgressListener = null;
    mockListenExtraVideoDownloadProgress.mockImplementation(async (listener) => {
      downloadProgressListener = listener;
      return vi.fn();
    });
    mockGetAssetUrl.mockImplementation(async (path: string) => `asset://${path}`);
    mockIsDebugMode.mockResolvedValue(false);
    mockLogDebugMessage.mockResolvedValue(undefined);
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
    expect(screen.queryByText('Compatible MP4 ready')).toBeNull();
    expect(mockResolveExtraVideo).toHaveBeenCalledWith('E:/Extras', video.path);
    fireEvent.click(screen.getByRole('button', { name: /open in video player/i }));
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

  it('shows system-player and conversion actions before an existing AVI preview fails', async () => {
    mockResolveExtraVideo.mockResolvedValue({
      originalPath: 'E:/Extras/Videos/C64GVA319-Rambo.avi',
      playbackPath: 'E:/Extras/Videos/C64GVA319-Rambo.avi',
      originalExists: true,
      compatibleSidecar: false,
    });

    render(<ResolvedExtraMedia extra={video} extrasPath="E:/Extras" className="media" mode="preview" />);

    expect(await screen.findByRole('button', { name: /open in video player/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /create compatible MP4 copy/i })).not.toBeNull();
  });

  it('shows byte progress and removes the download action once the sidecar is ready', async () => {
    let finishDownload: ((value: { path: string; message: string }) => void) | undefined;
    mockDownloadArchiveExtraVideo.mockImplementation(() => new Promise((resolve) => {
      finishDownload = resolve;
    }));
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

    render(<ResolvedExtraMedia extra={video} extrasPath="E:/Extras" className="media" mode="preview" />);

    fireEvent.click(await screen.findByRole('button', { name: /download compatible MP4/i }));
    expect((screen.getByRole('button', { name: /downloading MP4/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('status').textContent).toContain('Downloading compatible MP4');
    await waitFor(() => expect(downloadProgressListener).not.toBeNull());
    act(() => downloadProgressListener?.({
      relativePath: video.path,
      bytesDownloaded: 12 * 1024 * 1024,
      totalBytes: 48 * 1024 * 1024,
      percent: 25,
      bytesPerSecond: 3 * 1024 * 1024,
      secondsRemaining: 12,
    }));
    expect(screen.getByText(/12\.0 MB of 48\.0 MB/).textContent).toContain('25%');
    expect(screen.getByText(/3\.0 MB\/s/).textContent).toContain('12s left');

    finishDownload?.({
      path: 'E:/Extras/Videos/C64GVA319-Rambo.mp4',
      message: 'Compatible Archive.org MP4 downloaded.',
    });

    expect(await screen.findByText('Compatible Archive.org MP4 downloaded.')).not.toBeNull();
    expect(screen.queryByRole('button', { name: /download compatible MP4/i })).toBeNull();
    expect(screen.queryByText('Compatible MP4 ready')).toBeNull();
  });

  it('never renders video actions in thumbnail mode', async () => {
    mockResolveExtraVideo.mockResolvedValue({
      originalPath: 'E:/Extras/Videos/C64GVA319-Rambo.avi',
      playbackPath: 'E:/Extras/Videos/C64GVA319-Rambo.avi',
      originalExists: true,
      compatibleSidecar: false,
      archiveCandidate: true,
    });

    const { container } = render(
      <ResolvedExtraMedia extra={video} extrasPath="E:/Extras" className="media" mode="thumbnail" />
    );

    await waitFor(() => expect(container.querySelector('video')).not.toBeNull());
    expect(container.querySelector('button')).toBeNull();
    expect(screen.queryByText('Compatible MP4 ready')).toBeNull();
  });

  it('places the system-player action at the bottom-right edge', async () => {
    mockResolveExtraVideo.mockResolvedValue({
      originalPath: 'E:/Extras/Videos/C64GVA319-Rambo.avi',
      playbackPath: 'E:/Extras/Videos/C64GVA319-Rambo.avi',
      originalExists: true,
      compatibleSidecar: false,
      archiveCandidate: true,
    });

    render(<ResolvedExtraMedia extra={video} extrasPath="E:/Extras" className="media" mode="preview" />);

    const openButton = await screen.findByRole('button', { name: /open in video player/i });
    expect(openButton.className).toContain('ml-auto');
  });

  it('keeps GBBox fullscreen actions above the native video controls', async () => {
    mockResolveExtraVideo.mockResolvedValue({
      originalPath: 'E:/Extras/Videos/C64GVA319-Rambo.avi',
      playbackPath: 'E:/Extras/Videos/C64GVA319-Rambo.avi',
      originalExists: true,
      compatibleSidecar: false,
      archiveCandidate: true,
    });

    const { container } = render(
      <ResolvedExtraMedia extra={video} extrasPath="E:/Extras" className="media" mode="fullscreen" />
    );

    await screen.findByRole('button', { name: /open in video player/i });
    expect(container.querySelector('[data-video-actions]')?.parentElement?.className).toContain('bottom-14');
  });

  it('dismisses successful conversion feedback after a brief confirmation', async () => {
    mockResolveExtraVideo
      .mockResolvedValueOnce({
        originalPath: 'E:/Extras/Videos/C64GVA319-Rambo.avi',
        playbackPath: 'E:/Extras/Videos/C64GVA319-Rambo.avi',
        originalExists: true,
        compatibleSidecar: false,
        archiveCandidate: true,
      })
      .mockResolvedValueOnce({
        originalPath: 'E:/Extras/Videos/C64GVA319-Rambo.avi',
        playbackPath: 'E:/Extras/Videos/C64GVA319-Rambo.mp4',
        originalExists: true,
        compatibleSidecar: true,
        archiveCandidate: true,
      });
    render(<ResolvedExtraMedia extra={video} extrasPath="E:/Extras" className="media" mode="preview" />);
    const convertButton = await screen.findByRole('button', { name: /create compatible MP4 copy/i });
    let dismissMessage: (() => void) | undefined;
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation((handler) => {
      dismissMessage = handler as () => void;
      return 1 as ReturnType<typeof setTimeout>;
    });

    try {
      await act(async () => {
        fireEvent.click(convertButton);
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(screen.getByText('Compatible MP4 created.')).not.toBeNull();
      expect(dismissMessage).toBeDefined();
      act(() => dismissMessage?.());
      expect(screen.queryByText('Compatible MP4 created.')).toBeNull();
    } finally {
      timeoutSpy.mockRestore();
    }
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

describe('ResolvedExtraMedia non-video compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays "unavailable" fallback when getAssetUrl fails due to missing parent directory', async () => {
    const imageExtra: Extra = {
      id: 'image-1',
      name: 'Cover image',
      path: 'Magcover/Golden_Disk_64/Golden_Disk_64_(1994-01).jpg',
      type: 'Magcover',
    };

    mockGetAssetUrl.mockRejectedValue(
      new Error('Asset parent directory does not exist: E:/Backups/RETRO-BACKUPS/C64/gb64v19/Games/Extras/Magcover/Golden_Disk_64/Golden_Disk_64_(1994-01).jpg')
    );
    mockIsDebugMode.mockResolvedValue(false);

    render(
      <ResolvedExtraMedia
        extra={imageExtra}
        extrasPath="E:/Backups/RETRO-BACKUPS/C64/gb64v19/Games/Extras"
        className="media"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('unavailable')).not.toBeNull();
    });
  });

  it('sends the error to the webview debug log when debug mode is enabled', async () => {
    const imageExtra: Extra = {
      id: 'image-1',
      name: 'Cover image',
      path: 'Magcover/Golden_Disk_64/Golden_Disk_64_(1994-01).jpg',
      type: 'Magcover',
    };

    mockIsDebugMode.mockResolvedValue(true);
    mockGetAssetUrl.mockRejectedValue(
      new Error('Asset parent directory does not exist: E:/Backups/RETRO-BACKUPS/C64/gb64v19/Games/Extras/Magcover/Golden_Disk_64/Golden_Disk_64_(1994-01).jpg')
    );

    render(
      <ResolvedExtraMedia
        extra={imageExtra}
        extrasPath="E:/Backups/RETRO-BACKUPS/C64/gb64v19/Games/Extras"
        className="media"
      />
    );

    await waitFor(() => {
      expect(mockLogDebugMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to resolve asset parent directory')
      );
    });
  });
});
