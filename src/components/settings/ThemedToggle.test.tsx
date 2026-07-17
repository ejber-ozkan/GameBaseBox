import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ThemedToggle } from './ThemedToggle';

describe('ThemedToggle', () => {
  test('exposes distinct selected-theme on and neutral off states with thumb position', () => {
    const { rerender } = render(<ThemedToggle label="Cycle Multiple Images" checked={false} onChange={vi.fn()} />);

    const toggle = screen.getByRole('switch', { name: 'Cycle Multiple Images' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(toggle.className).toContain('bg-theme-background');
    expect(toggle.firstElementChild?.className).toContain('translate-x-0');

    rerender(<ThemedToggle label="Cycle Multiple Images" checked onChange={vi.fn()} />);

    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(toggle.className).toContain('bg-theme-primary');
    expect(toggle.firstElementChild?.className).toContain('translate-x-6');
  });

  test('keeps keyboard focus styling separate from on and off states', () => {
    const onChange = vi.fn();
    render(<ThemedToggle label="Fullscreen Mode" checked={false} onChange={onChange} />);

    const toggle = screen.getByRole('switch', { name: 'Fullscreen Mode' });
    expect(toggle.className).toContain('focus-visible:ring-theme-primary');

    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledOnce();
  });

  test('shows the same separate focus treatment when controller navigation focuses an off switch', () => {
    render(<ThemedToggle label="Scroll Wheel Navigation" checked={false} focused onChange={vi.fn()} />);

    const toggle = screen.getByRole('switch', { name: 'Scroll Wheel Navigation' });
    expect(toggle.className).toContain('ring-theme-primary/70');
    expect(toggle.className).toContain('bg-theme-background');
  });
});
