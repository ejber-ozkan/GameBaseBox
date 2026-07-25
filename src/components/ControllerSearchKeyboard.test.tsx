import { render, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ControllerSearchKeyboard } from './ControllerSearchKeyboard';

describe('ControllerSearchKeyboard', () => {
  it('handles physical keyboard navigation and key selection', () => {
    const onSearchChange = vi.fn();
    const onClose = vi.fn();
    const onGamepadInput = vi.fn();

    render(
      <ControllerSearchKeyboard
        isOpen={true}
        onClose={onClose}
        onGamepadInput={onGamepadInput}
        onSearchChange={onSearchChange}
        searchInput=""
      />,
    );

    // Initial selected key is '1' (row 0, col 0)
    expect(screen.getByText('1')).toBeDefined();

    // Press ArrowRight to select '2'
    fireEvent.keyDown(window, { key: 'ArrowRight' });

    // Press Enter to select '2'
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(onSearchChange).toHaveBeenCalledWith('2');
  });

  it('closes on Escape key press', () => {
    const onClose = vi.fn();

    render(
      <ControllerSearchKeyboard
        isOpen={true}
        onClose={onClose}
        onGamepadInput={vi.fn()}
        onSearchChange={vi.fn()}
        searchInput=""
      />,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
