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
});
