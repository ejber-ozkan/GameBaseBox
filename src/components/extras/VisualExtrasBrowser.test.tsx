import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { VisualExtrasBrowser } from './VisualExtrasBrowser';
import type { Extra } from '../../types/game';

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
  resolveExtraVideo: vi.fn().mockResolvedValue({
    originalPath: 'D:/custom-platform-extras/Videos/C64GVA319-Rambo.avi',
    playbackPath: null,
    originalExists: false,
    compatibleSidecar: false,
    archiveCandidate: true,
  }),
  openFile: vi.fn().mockResolvedValue(undefined),
  convertExtraVideo: vi.fn(),
  downloadArchiveExtraVideo: vi.fn(),
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
  test('renders browser with visual extras', () => {
    render(
      <VisualExtrasBrowser
        extras={mockExtras}
        extrasPath="D:/custom-platform-extras"
      />
    );

    expect(screen.getAllByText('Extra Image 1').length).toBeGreaterThan(0);
  });

  test('does not nest video action buttons inside the preview activator', async () => {
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

    await screen.findByRole('button', { name: /download compatible mp4/i });
    expect(container.querySelector('button button')).toBeNull();
  });
});
