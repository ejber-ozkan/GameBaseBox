import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { SapPlayer } from './SapPlayer';

vi.mock('../lib/tauri-bridge', () => ({ getMediaUrl: vi.fn() }));

describe('SapPlayer theme treatment', () => {
  test('uses selected-theme tokens instead of an unrelated amber panel', () => {
    render(<SapPlayer filename="Ballblazer.sap" audioUrl="/music/Ballblazer.sap" compact />);

    expect(screen.getByTestId('sap-player').className).toContain('bg-theme-surface');
    expect(screen.getByText(/Ballblazer\.sap/i).className).toContain('text-theme-primary');
  });
});
