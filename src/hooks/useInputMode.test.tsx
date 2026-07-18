import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useInputMode } from './useInputMode';

describe('useInputMode', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('hides mouse mode immediately after keyboard input and restores it on the next real mouse movement', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useInputMode());

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 40, clientY: 40 }));
    });
    expect(result.current.isMouseMode).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });
    expect(result.current.isMouseMode).toBe(false);
    expect(result.current.showMouse).toBe(false);

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 44, clientY: 40 }));
    });
    expect(result.current.isMouseMode).toBe(true);
    expect(result.current.showMouse).toBe(true);
  });

  it('hides mouse mode immediately after gamepad input', () => {
    const { result } = renderHook(() => useInputMode());

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 40, clientY: 40 }));
      result.current.onGamepadInput();
    });

    expect(result.current.isMouseMode).toBe(false);
    expect(result.current.showMouse).toBe(false);
  });
});
