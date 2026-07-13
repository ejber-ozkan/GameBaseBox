import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageWithFallback } from './ImageWithFallback';

const { getAssetUrl, logDebugMessage } = vi.hoisted(() => ({
  getAssetUrl: vi.fn().mockResolvedValue('http://asset.localhost/test.jpg'),
  logDebugMessage: vi.fn(),
}));

vi.mock('../lib/tauri-bridge', () => ({
  getAssetUrl,
  isDebugMode: vi.fn().mockResolvedValue(true),
  logDebugMessage,
}));

describe('ImageWithFallback component', () => {
  beforeEach(() => {
    getAssetUrl.mockClear();
    logDebugMessage.mockClear();
  });

  afterEach(() => {
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  });

  test('renders image element initially passing valid props', () => {
    render(<ImageWithFallback src="/test.jpg" alt="test image" />);
    const img = screen.getByTestId('image-element');
    expect(img.getAttribute('src')).toBe('/test.jpg');
    expect(img.getAttribute('alt')).toBe('test image');
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  test('renders fallback element if src is entirely empty', () => {
    render(<ImageWithFallback src="" alt="broken" fallbackText="Custom Fallback" />);
    expect(screen.queryByTestId('image-element')).toBeNull();
    const fallback = screen.getByTestId('image-fallback');
    expect(fallback.textContent).toBe('Custom Fallback');
  });

  test('renders fallback element gracefully when image fails to load via onError event', () => {
    render(<ImageWithFallback src="/broken.jpg" alt="broken image" />);
    
    const img = screen.getByTestId('image-element');
    expect(img).not.toBeNull();
    
    // Simulate natural browser image error event
    fireEvent.error(img);
    
    // Original image DOM should be destroyed, fallback replacing it
    expect(screen.queryByTestId('image-element')).toBeNull();
    expect(screen.getByTestId('image-fallback').textContent).toBe('No Image');
  });

  test('uses the current alt text when logging a resolved Tauri asset', async () => {
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    const { rerender } = render(<ImageWithFallback src="C:\\media\\test.jpg" alt="Old title" />);

    await waitFor(() => expect(logDebugMessage).toHaveBeenCalledWith(expect.stringContaining('Old title')));
    logDebugMessage.mockClear();

    rerender(<ImageWithFallback src="C:\\media\\test.jpg" alt="New title" />);

    await waitFor(() => expect(logDebugMessage).toHaveBeenCalledWith(expect.stringContaining('New title')));
  });
});
