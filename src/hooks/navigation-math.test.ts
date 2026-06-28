import { describe, expect, it } from 'vitest';
import { 
  calculateRightNavigation, 
  calculateLeftNavigation, 
  calculateUpNavigation, 
  calculateDownNavigation,
  NavigationState, 
  NavigationParams 
} from './navigation-math';

describe('navigation-math (Left/Right)', () => {
  const baseState: NavigationState = {
    activeHeaderItemIndex: 0,
    activeHeaderRow: 0,
    activeRailIndex: -1,
    railFocusIndices: { 'rail-1': 0 },
    sectionJumpDirection: null,
  };

  const baseParams: NavigationParams = {
    rowCounts: [3, 10, 5],
    rails: [
      { id: 'rail-1', length: 5, isGrid: false },
      { id: 'rail-grid', length: 10, isGrid: true },
    ],
    gridColumns: 4,
    jumpRowIndex: 2,
  };

  it('moves right in the header row wrapping around', () => {
    const result = calculateRightNavigation(baseState, baseParams);
    expect(result.state.activeHeaderItemIndex).toBe(1);
    expect(result.moved).toBe(true);

    const endOfRowState = { ...baseState, activeHeaderItemIndex: 2 };
    const wrapResult = calculateRightNavigation(endOfRowState, baseParams);
    expect(wrapResult.state.activeHeaderItemIndex).toBe(0);
  });

  it('moves left in the header row wrapping around backwards', () => {
    const result = calculateLeftNavigation(baseState, baseParams);
    expect(result.state.activeHeaderItemIndex).toBe(2);
    expect(result.moved).toBe(true);

    const midRowState = { ...baseState, activeHeaderItemIndex: 2 };
    const normalResult = calculateLeftNavigation(midRowState, baseParams);
    expect(normalResult.state.activeHeaderItemIndex).toBe(1);
  });

  it('moves right in a standard list rail wrapping around', () => {
    const railState = { ...baseState, activeRailIndex: 0 };
    const result = calculateRightNavigation(railState, baseParams);
    expect(result.state.railFocusIndices['rail-1']).toBe(1);

    const endOfRailState = { ...railState, railFocusIndices: { 'rail-1': 4 } };
    const wrapResult = calculateRightNavigation(endOfRailState, baseParams);
    expect(wrapResult.state.railFocusIndices['rail-1']).toBe(0);
  });

  it('moves left in a standard list rail wrapping around backwards', () => {
    const railState = { ...baseState, activeRailIndex: 0 };
    const wrapResult = calculateLeftNavigation(railState, baseParams);
    expect(wrapResult.state.railFocusIndices['rail-1']).toBe(4);

    const midRailState = { ...railState, railFocusIndices: { 'rail-1': 4 } };
    const result = calculateLeftNavigation(midRailState, baseParams);
    expect(result.state.railFocusIndices['rail-1']).toBe(3);
  });

  it('moves right in a grid rail and STOPS at the end (no wrap)', () => {
    const gridState = { ...baseState, activeRailIndex: 1, railFocusIndices: { 'rail-grid': 8 } };
    const result = calculateRightNavigation(gridState, baseParams);
    expect(result.state.railFocusIndices['rail-grid']).toBe(9);
    expect(result.moved).toBe(true);

    const endGridState = { ...baseState, activeRailIndex: 1, railFocusIndices: { 'rail-grid': 9 } };
    const blockedResult = calculateRightNavigation(endGridState, baseParams);
    expect(blockedResult.state.railFocusIndices['rail-grid']).toBe(9);
    expect(blockedResult.moved).toBe(false);
  });

  it('moves left in a grid rail and STOPS at the beginning (no wrap backwards)', () => {
    const gridState = { ...baseState, activeRailIndex: 1, railFocusIndices: { 'rail-grid': 1 } };
    const result = calculateLeftNavigation(gridState, baseParams);
    expect(result.state.railFocusIndices['rail-grid']).toBe(0);
    expect(result.moved).toBe(true);

    const startGridState = { ...baseState, activeRailIndex: 1, railFocusIndices: { 'rail-grid': 0 } };
    const blockedResult = calculateLeftNavigation(startGridState, baseParams);
    expect(blockedResult.state.railFocusIndices['rail-grid']).toBe(0);
    expect(blockedResult.moved).toBe(false);
  });
});

describe('navigation-math (Up/Down)', () => {
  const baseState: NavigationState = {
    activeHeaderItemIndex: 1,
    activeHeaderRow: 0,
    activeRailIndex: -1,
    railFocusIndices: { 'rail-1': 0, 'rail-grid': 10 },
    sectionJumpDirection: null,
  };

  const baseParams: NavigationParams = {
    rowCounts: [3, 10, 5], // Example: 0->top, 1->genre, 2->jump
    rails: [
      { id: 'rail-1', length: 5, isGrid: false },
      { id: 'rail-grid', length: 20, isGrid: true },
    ],
    gridColumns: 4,
    jumpRowIndex: 2,
  };

  it('moves down inside the header until reaching the jumpRow, then leaps to activeRailIndex 0', () => {
    // 0 -> 1
    const res1 = calculateDownNavigation(baseState, baseParams);
    expect(res1.state.activeHeaderRow).toBe(1);
    expect(res1.state.activeHeaderItemIndex).toBe(0); // Resets horizontal index
    expect(res1.moved).toBe(true);

    // 1 -> 2 (jump row)
    const res2 = calculateDownNavigation(res1.state, baseParams);
    expect(res2.state.activeHeaderRow).toBe(2);

    // 2 -> Jump to rail 0
    const res3 = calculateDownNavigation(res2.state, baseParams);
    expect(res3.state.activeRailIndex).toBe(0);
    expect(res3.state.sectionJumpDirection).toBe(null);
  });

  it('moves up inside the header and stops at top row', () => {
    const headerRow1State = { ...baseState, activeHeaderRow: 1, activeHeaderItemIndex: 5 };
    const res1 = calculateUpNavigation(headerRow1State, baseParams);
    expect(res1.state.activeHeaderRow).toBe(0);
    expect(res1.state.activeHeaderItemIndex).toBe(0);
    expect(res1.moved).toBe(true);

    const res2 = calculateUpNavigation(res1.state, baseParams);
    expect(res2.state.activeHeaderRow).toBe(0); // Stopped
    expect(res2.moved).toBe(false);
  });

  it('moves down from a list rail to the next rail', () => {
    const listRailState = { ...baseState, activeRailIndex: 0 };
    const res1 = calculateDownNavigation(listRailState, baseParams);
    expect(res1.state.activeRailIndex).toBe(1);
    expect(res1.state.sectionJumpDirection).toBe('down');
    expect(res1.moved).toBe(true);
  });

  it('stops moving down if at the bottommost rail', () => {
    const gridRailState = { ...baseState, activeRailIndex: 1, railFocusIndices: { 'rail-grid': 16 } };
    const res1 = calculateDownNavigation(gridRailState, baseParams);
    expect(res1.state.activeRailIndex).toBe(1);
    expect(res1.moved).toBe(false);
  });

  it('moves up from the first rail into the header (jump row)', () => {
    const firstRailState = { ...baseState, activeRailIndex: 0 };
    const res1 = calculateUpNavigation(firstRailState, baseParams);
    expect(res1.state.activeRailIndex).toBe(-1);
    expect(res1.state.activeHeaderRow).toBe(2);
    expect(res1.state.activeHeaderItemIndex).toBe(0);
    expect(res1.state.sectionJumpDirection).toBe(null);
    expect(res1.moved).toBe(true);
  });

  it('moves down within a grid rail (adds columns)', () => {
    const gridState = { ...baseState, activeRailIndex: 1, railFocusIndices: { 'rail-grid': 2 } };
    const res1 = calculateDownNavigation(gridState, baseParams);
    expect(res1.state.railFocusIndices['rail-grid']).toBe(6);
    expect(res1.state.activeRailIndex).toBe(1);
    expect(res1.moved).toBe(true);
  });

  it('moves up within a grid rail (subtracts columns)', () => {
    const gridState = { ...baseState, activeRailIndex: 1, railFocusIndices: { 'rail-grid': 6 } };
    const res1 = calculateUpNavigation(gridState, baseParams);
    expect(res1.state.railFocusIndices['rail-grid']).toBe(2);
    expect(res1.state.activeRailIndex).toBe(1);
    expect(res1.moved).toBe(true);
  });

  it('moves up from a lower rail into the previous rail', () => {
    const gridState = { ...baseState, activeRailIndex: 1, railFocusIndices: { ...baseState.railFocusIndices, 'rail-grid': 2 } };
    const res1 = calculateUpNavigation(gridState, baseParams);
    expect(res1.state.activeRailIndex).toBe(0);
    expect(res1.state.sectionJumpDirection).toBe('up');
    expect(res1.state.railFocusIndices['rail-1']).toBe(0); // Assuming previous history was 0
    expect(res1.moved).toBe(true);
  });
});
