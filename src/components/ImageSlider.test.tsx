import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageSlider } from './ImageSlider';

const { findAllVariants, logDebugMessage } = vi.hoisted(() => ({
  findAllVariants: vi.fn().mockResolvedValue([]),
  logDebugMessage: vi.fn(),
}));

vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      imageAnimation: 'fade',
      imageCycling: false,
      bigBoxAnimateVertical: false,
    },
    findAllVariants,
  }),
}));

vi.mock('../lib/tauri-bridge', () => ({
  isDebugMode: vi.fn().mockResolvedValue(true),
  logDebugMessage,
}));

describe('ImageSlider', () => {
  beforeEach(() => {
    findAllVariants.mockClear();
    logDebugMessage.mockClear();
  });

  it('uses the current alt text when reporting missing variants', async () => {
    const { rerender } = render(
      <ImageSlider filename="game.png" type="screenshot" alt="Old title" />,
    );

    await waitFor(() => expect(logDebugMessage).toHaveBeenCalledWith(expect.stringContaining('Old title')));
    logDebugMessage.mockClear();

    rerender(<ImageSlider filename="game.png" type="screenshot" alt="New title" />);

    await waitFor(() => expect(logDebugMessage).toHaveBeenCalledWith(expect.stringContaining('New title')));
  });

  it('defers screenshot variant loading until the slider enters the preload margin', async () => {
    let onIntersect: ((entries: Array<{ isIntersecting: boolean }>) => void) | undefined;
    const globalWithObserver = globalThis as typeof globalThis & { IntersectionObserver?: unknown };
    const originalObserver = globalWithObserver.IntersectionObserver;

    class MockIntersectionObserver {
      constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
        onIntersect = callback;
      }

      disconnect() {}
      observe() {}
    }

    Object.defineProperty(globalWithObserver, 'IntersectionObserver', {
      configurable: true,
      value: MockIntersectionObserver,
    });

    try {
      render(<ImageSlider defer filename="deferred.png" type="screenshot" alt="Deferred title" />);

      expect(findAllVariants).not.toHaveBeenCalled();
      onIntersect?.([{ isIntersecting: true }]);

      await waitFor(() => {
        expect(findAllVariants).toHaveBeenCalledWith('screenshot', 'deferred.png');
      });
    } finally {
      if (originalObserver) {
        Object.defineProperty(globalWithObserver, 'IntersectionObserver', {
          configurable: true,
          value: originalObserver,
        });
      } else {
        delete globalWithObserver.IntersectionObserver;
      }
    }
  });
});
