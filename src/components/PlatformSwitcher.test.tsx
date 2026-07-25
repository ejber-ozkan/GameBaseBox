import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { PlatformSwitcher } from './PlatformSwitcher';

describe('PlatformSwitcher', () => {
  test('shows supported platforms and emits selected platform', () => {
    const onPlatformSelect = vi.fn();

    render(
      <PlatformSwitcher
        activePlatformId="c64"
        onPlatformSelect={onPlatformSelect}
      />,
    );

    const select = screen.getByLabelText('Active platform');
    expect(select).toBeTruthy();

    fireEvent.change(select, { target: { value: 'atari800' } });

    expect(onPlatformSelect).toHaveBeenCalledWith('atari800');
  });

  test('uses the shared theme-aware selector shell', () => {
    render(
      <PlatformSwitcher
        activePlatformId="c64"
        onPlatformSelect={vi.fn()}
      />,
    );

    const shell = screen.getByTestId('platform-switcher');
    expect(shell.className).toContain('bg-[var(--theme-primary-container)]');
    expect(shell.className).toContain('border-[var(--theme-primary)]');
    expect(screen.getByLabelText('Active platform').className).toContain('bg-[var(--theme-background)]');
  });
});
