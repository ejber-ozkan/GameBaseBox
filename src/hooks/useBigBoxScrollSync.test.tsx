import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBigBoxScrollSync } from './useBigBoxScrollSync';

function ScrollSyncHarness({ focusedIndex }: { focusedIndex: number }) {
  const { headerRef, scrollContainerRef } = useBigBoxScrollSync({
    activeRailIndex: 0,
    currentFocusedIndex: focusedIndex,
    currentRailId: 'recent',
    currentRailType: 'recent',
    onSectionJumpHandled: vi.fn(),
    sectionJumpDirection: null,
  });

  return (
    <>
      <header ref={headerRef} />
      <main ref={scrollContainerRef}>
        <section data-rail-id="recent"><div data-rail-anchor="true" /></section>
      </main>
    </>
  );
}

describe('useBigBoxScrollSync', () => {
  afterEach(() => vi.restoreAllMocks());

  it('does not scroll the BigBox viewport when focus moves within a horizontal rail', () => {
    const scrollTo = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scrollTo });

    const { rerender } = render(<ScrollSyncHarness focusedIndex={0} />);
    const initialCalls = scrollTo.mock.calls.length;

    rerender(<ScrollSyncHarness focusedIndex={1} />);

    expect(initialCalls).toBeGreaterThan(0);
    expect(scrollTo).toHaveBeenCalledTimes(initialCalls);
  });
});
