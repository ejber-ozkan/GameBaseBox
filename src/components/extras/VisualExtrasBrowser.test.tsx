import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import { beforeEach } from 'vitest';
import { VisualExtrasBrowser } from './VisualExtrasBrowser';
import type { Extra } from '../../types/game';

const mockResolveExtraVideo = vi.fn();

// Mock settings context
vi.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      imageCycling: false,
      imageAnimation: 'none',
    },
  }),
}));

vi.mock('../../hooks/useGamepad', () => ({
  useGamepad: vi.fn(),
}));

vi.mock('../../hooks/usePopupOpenSound', () => ({
  usePopupOpenSound: vi.fn(),
}));

vi.mock('../../lib/tauri-bridge', () => ({
  getAssetUrl: vi.fn().mockImplementation((path) => Promise.resolve(`resolved-url:${path}`)),
  isDebugMode: vi.fn().mockResolvedValue(false),
  resolveExtraVideo: (...args: unknown[]) => mockResolveExtraVideo(...args),
  openFile: vi.fn().mockResolvedValue(undefined),
  convertExtraVideo: vi.fn(),
  downloadArchiveExtraVideo: vi.fn(),
  listenExtraVideoDownloadProgress: vi.fn().mockResolvedValue(vi.fn()),
}));

const mockExtras: Extra[] = [
  {
    id: '1',
    name: 'Extra Image 1',
    path: 'extras/pic1.jpg',
    type: 'visual',
  },
];

describe('VisualExtrasBrowser', () => {
  beforeEach(() => {
    mockResolveExtraVideo.mockResolvedValue({
      originalPath: 'D:/custom-platform-extras/Videos/C64GVA319-Rambo.avi',
      playbackPath: 'D:/custom-platform-extras/Videos/C64GVA319-Rambo.avi',
      originalExists: true,
      compatibleSidecar: false,
      archiveCandidate: true,
    });
  });

  test('renders browser with visual extras', () => {
    render(
      <VisualExtrasBrowser
        extras={mockExtras}
        extrasPath="D:/custom-platform-extras"
      />
    );

    expect(screen.getAllByText('Extra Image 1').length).toBeGreaterThan(0);
  });

  test('does not render interactive video actions inside thumbnail buttons', async () => {
    const { container } = render(
      <VisualExtrasBrowser
        extras={[{
          id: 'video-1',
          name: 'Rambo video',
          path: 'Videos\\C64GVA319-Rambo.avi',
          type: 'video',
        }]}
        extrasPath="D:/custom-platform-extras"
      />
    );

    await waitFor(() => expect(container.querySelectorAll('video').length).toBeGreaterThan(0));
    expect(container.querySelector('button button')).toBeNull();
  });

  test('portals fullscreen video to the viewport and keeps native controls interactive', async () => {
    render(
      <VisualExtrasBrowser
        extras={[{
          id: 'video-1',
          name: 'Rambo video',
          path: 'Videos\\C64GVA319-Rambo.avi',
          type: 'video',
        }]}
        extrasPath="D:/custom-platform-extras"
      />
    );

    fireEvent.click(await screen.findByRole('button', { name: /open Rambo video fullscreen/i }));
    const modal = await waitFor(() => {
      const element = document.querySelector('[data-detail-modal="open"]');
      expect(element).not.toBeNull();
      return element as HTMLElement;
    });
    expect(modal.parentElement).toBe(document.body);
    const fullscreenVideo = modal.querySelector('video') as HTMLVideoElement;
    expect(fullscreenVideo).not.toBeNull();
    expect(fullscreenVideo.controls).toBe(true);
    fireEvent.click(fullscreenVideo);
    expect(document.querySelector('[data-detail-modal="open"]')).not.toBeNull();
  });
});
