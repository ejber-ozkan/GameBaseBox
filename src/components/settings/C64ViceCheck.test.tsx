import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { C64ViceCheck } from './C64ViceCheck';

const check = vi.hoisted(() => vi.fn());
vi.mock('../../lib/tauri-bridge', () => ({ checkC64Vice: check }));

describe('VICE compatibility feedback', () => {
  it('reports the detected build and switch style for the configured executable', async () => {
    check.mockResolvedValue({ version: 'x64 (VICE 2.4)', driveSwitches: 'Legacy global', virtualDeviceSwitches: 'Legacy global' });
    render(<C64ViceCheck executablePath="/emulators/x64" />);
    fireEvent.click(screen.getByRole('button', { name: 'Check VICE compatibility' }));
    expect(check).toHaveBeenCalledWith('/emulators/x64');
    expect((await screen.findByRole('status')).textContent).toContain('VICE 2.4');
  });
});
