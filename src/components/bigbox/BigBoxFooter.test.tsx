import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BigBoxFooter } from './BigBoxFooter';
import { getGamepadControls } from '../../lib/gamepad-controls';

describe('BigBoxFooter', () => {
  it('renders default grid view gamepad controls correctly', () => {
    render(<BigBoxFooter context="grid" />);

    const footer = screen.getByTestId('bigbox-footer');
    expect(footer).toBeDefined();
    expect(footer.getAttribute('data-footer-context')).toBe('grid');

    const gridControls = getGamepadControls('grid');
    gridControls.forEach((control) => {
      expect(screen.getByText(control.button)).toBeDefined();
      expect(screen.getByText(control.label)).toBeDefined();
    });
  });

  it('renders detail view gamepad controls correctly when context="detail"', () => {
    render(<BigBoxFooter context="detail" />);

    const footer = screen.getByTestId('bigbox-footer');
    expect(footer).toBeDefined();
    expect(footer.getAttribute('data-footer-context')).toBe('detail');

    const detailControls = getGamepadControls('detail');
    detailControls.forEach((control) => {
      expect(screen.getByText(control.button)).toBeDefined();
      expect(screen.getByText(control.label)).toBeDefined();
    });
  });
});
