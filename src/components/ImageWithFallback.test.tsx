import { expect, test, describe } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageWithFallback } from './ImageWithFallback';

describe('ImageWithFallback component', () => {

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
});
