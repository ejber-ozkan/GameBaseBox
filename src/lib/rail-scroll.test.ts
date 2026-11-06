import { describe, expect, test, vi } from 'vitest';
import { centreDelta, followFocusedCard, revealDelta } from './rail-scroll';

function box(left: number, width: number, hovered = false) {
  const element = document.createElement('div');
  element.getBoundingClientRect = () => ({
    left, right: left + width, width, top: 0, bottom: 100, height: 100, x: left, y: 0, toJSON: () => ({}),
  });
  element.matches = (selector: string) => selector === ':hover' && hovered;
  element.scrollBy = vi.fn() as unknown as typeof element.scrollBy;
  return element;
}

describe('rail-scroll', () => {
  test('revealDelta is zero for a fully visible card and the overhang otherwise', () => {
    const rail = box(0, 1000);
    expect(revealDelta(rail, box(100, 300))).toBe(0);
    expect(revealDelta(rail, box(850, 300))).toBe(150);
    expect(revealDelta(rail, box(-120, 300))).toBe(-120);
    expect(revealDelta(rail, box(700, 300), 64)).toBe(64);
  });

  test('centreDelta moves the card centre to the rail centre', () => {
    expect(centreDelta(box(0, 1000), box(850, 300))).toBe(500);
  });

  test('a hovered card is only nudged into view, never centred', () => {
    const rail = box(0, 1000);
    expect(followFocusedCard(rail, box(850, 300, true))).toBe('reveal');
    expect(rail.scrollBy).toHaveBeenCalledWith({ left: 150, behavior: 'smooth' });

    const quiet = box(0, 1000);
    expect(followFocusedCard(quiet, box(400, 300, true))).toBe('none');
    expect(quiet.scrollBy).not.toHaveBeenCalled();
  });

  test('keyboard or gamepad focus (card not under the pointer) is centred', () => {
    const rail = box(0, 1000);
    expect(followFocusedCard(rail, box(850, 300))).toBe('centre');
    expect(rail.scrollBy).toHaveBeenCalledWith({ left: 500, behavior: 'smooth' });
  });
});
