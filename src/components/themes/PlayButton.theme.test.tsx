import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { mockGames } from '../../data/mockGames';
import { createDefaultPlatformSettingsMap } from '../../lib/platform-capabilities';
import { PlayButton } from './PlayButton';

const platformSettings = createDefaultPlatformSettingsMap();
vi.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: { activePlatformId: 'c64', preferredEmulator: 'vice', emulatorPath: '', platformSettings },
    markAsPlayed: vi.fn(),
  }),
}));

describe('PlayButton theme treatment', () => {
  test('uses selected-theme action styling for native and embedded launch controls', () => {
    render(<PlayButton game={mockGames[0]} compact />);

    expect(screen.getByRole('button', { name: /launch emulator/i }).className).toContain('bg-theme-primary');
    expect(screen.getByRole('button', { name: /play embedded/i }).className).toContain('border-theme-primary');
  });
});
