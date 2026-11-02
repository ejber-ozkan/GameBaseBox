import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { C64OverridesEditor } from './C64OverridesEditor';

describe('C64 override controls', () => {
  it('offers database defaults globally and explicit region and drive settings', () => {
    const onChange = vi.fn();
    render(<C64OverridesEditor value={{}} onChange={onChange} scope="global" />);
    const region = screen.getByLabelText('Region');
    expect((region as HTMLSelectElement).selectedOptions[0].textContent).toBe('Automatic from database');
    fireEvent.change(region, { target: { value: 'ntsc' } });
    expect(onChange).toHaveBeenCalledWith({ region: 'ntsc' });
    fireEvent.change(screen.getByLabelText('True-drive emulation'), { target: { value: 'false' } });
    expect(onChange).toHaveBeenLastCalledWith({ trueDrive: false });
  });

  it('removes a game override when choosing inherit and preserves other choices', () => {
    const onChange = vi.fn();
    render(<C64OverridesEditor value={{ region: 'pal', reu: 512 }} onChange={onChange} scope="game" />);
    fireEvent.change(screen.getByLabelText('Region'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith({ reu: 512 });
    expect(screen.getAllByRole('option', { name: 'Inherit global / database' }).length).toBe(5);
  });

  it('resets all game overrides with one action', () => {
    const onChange = vi.fn();
    render(<C64OverridesEditor value={{ region: 'pal', trueDrive: true }} onChange={onChange} scope="game" />);
    fireEvent.click(screen.getByRole('button', { name: 'Reset overrides' }));
    expect(onChange).toHaveBeenCalledWith({});
  });
});
