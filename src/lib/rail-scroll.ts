/**
 * Scroll helpers for horizontal game rails.
 *
 * Rails move focus to the card under the mouse. If every focus change also centred the
 * card, centring would slide a new card under the pointer, which would take focus and
 * centre again: the rail runs away as soon as the mouse nears an edge. So a card the
 * pointer is over is only nudged fully into view; keyboard and gamepad focus (card not
 * under the pointer) is centred as before.
 */

export function isPointerOver(element: Element): boolean {
  try {
    return element.matches(':hover');
  } catch {
    return false;
  }
}

/** Horizontal distance to scroll so `card` is fully visible inside `rail` (0 if it is). */
export function revealDelta(rail: HTMLElement, card: HTMLElement, inset = 0): number {
  const railRect = rail.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const visibleLeft = railRect.left + inset;
  const visibleRight = railRect.right - inset;
  if (cardRect.left < visibleLeft) return cardRect.left - visibleLeft;
  if (cardRect.right > visibleRight) return cardRect.right - visibleRight;
  return 0;
}

/** Horizontal distance to scroll so `card` is centred in `rail`. */
export function centreDelta(rail: HTMLElement, card: HTMLElement): number {
  const railRect = rail.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  return cardRect.left + cardRect.width / 2 - (railRect.left + railRect.width / 2);
}

/**
 * Brings the focused card into view: nudges it into view when the pointer is over it,
 * otherwise centres it. Returns what it did.
 */
export function followFocusedCard(
  rail: HTMLElement,
  card: HTMLElement,
  inset = 0,
): 'reveal' | 'centre' | 'none' {
  const pointer = isPointerOver(card);
  const delta = pointer ? revealDelta(rail, card, inset) : centreDelta(rail, card);
  if (Math.abs(delta) < 1) return 'none';
  rail.scrollBy({ left: delta, behavior: 'smooth' });
  return pointer ? 'reveal' : 'centre';
}
