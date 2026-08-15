import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { PlatformSwitcher } from './PlatformSwitcher';
import { createDefaultPlatformSettings } from '../lib/platform-capabilities';
import type { PlatformId, PlatformSettings } from '../types/platform';

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

  test('lists imported GameBases first and makes unimported platforms obvious in text', () => {
    const platformSettings: Record<PlatformId, PlatformSettings> = {
      c64: {
        ...createDefaultPlatformSettings('c64'),
        library: { ...createDefaultPlatformSettings('c64').library, importStatus: 'imported' },
      },
      vic20: {
        ...createDefaultPlatformSettings('vic20'),
        library: { ...createDefaultPlatformSettings('vic20').library, importStatus: 'imported' },
      },
      amstradcpc: {
        ...createDefaultPlatformSettings('amstradcpc'),
        library: { ...createDefaultPlatformSettings('amstradcpc').library, importStatus: 'notImported' },
      },
      atari800: {
        ...createDefaultPlatformSettings('atari800'),
        library: { ...createDefaultPlatformSettings('atari800').library, importStatus: 'notImported' },
      },
      atari2600: {
        ...createDefaultPlatformSettings('atari2600'),
        library: { ...createDefaultPlatformSettings('atari2600').library, importStatus: 'notImported' },
      },
      atari5200: {
        ...createDefaultPlatformSettings('atari5200'),
        library: { ...createDefaultPlatformSettings('atari5200').library, importStatus: 'notImported' },
      },
      atari7800: {
        ...createDefaultPlatformSettings('atari7800'),
        library: { ...createDefaultPlatformSettings('atari7800').library, importStatus: 'notImported' },
      },
      zxspectrum: {
        ...createDefaultPlatformSettings('zxspectrum'),
        library: { ...createDefaultPlatformSettings('zxspectrum').library, importStatus: 'notImported' },
      },
      bbcmicro: {
        ...createDefaultPlatformSettings('bbcmicro'),
        library: { ...createDefaultPlatformSettings('bbcmicro').library, importStatus: 'notImported' },
      },
      amiga: {
        ...createDefaultPlatformSettings('amiga'),
        library: { ...createDefaultPlatformSettings('amiga').library, importStatus: 'notImported' },
      },
      atarist: {
        ...createDefaultPlatformSettings('atarist'),
        library: { ...createDefaultPlatformSettings('atarist').library, importStatus: 'notImported' },
      },
      apple2gs: {
        ...createDefaultPlatformSettings('apple2gs'),
        library: { ...createDefaultPlatformSettings('apple2gs').library, importStatus: 'notImported' },
      },
      pet: {
        ...createDefaultPlatformSettings('pet'),
        library: { ...createDefaultPlatformSettings('pet').library, importStatus: 'notImported' },
      },
    };

    render(
      <PlatformSwitcher
        activePlatformId="c64"
        platformSettings={platformSettings}
        onPlatformSelect={vi.fn()}
      />,
    );

    const importedGroup = screen.getByRole('group', { name: 'Imported GameBases' });
    const notImportedGroup = screen.getByRole('group', { name: 'Not Imported' });

    expect(importedGroup).toBeTruthy();
    expect(notImportedGroup).toBeTruthy();

    const options = screen.getAllByRole('option');
    expect(options[0].textContent).toBe('Commodore 64');
    expect(options[1].textContent).toBe('Commodore VIC-20');
    expect(options[2].textContent).toBe('Atari 800 (Not Imported)');
    expect(options.find((opt) => opt.textContent === 'Amstrad CPC (Not Imported)')).toBeTruthy();
    expect(options.find((opt) => opt.textContent === 'Apple 2GS (Not Imported)')).toBeTruthy();
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
