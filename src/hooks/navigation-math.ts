export interface NavigationState {
  activeHeaderItemIndex: number;
  activeHeaderRow: number;
  activeRailIndex: number;
  railFocusIndices: Record<string, number>;
  sectionJumpDirection: 'up' | 'down' | null;
}

export interface NavigationParams {
  rowCounts: number[];
  rails: { id: string; length: number; isGrid: boolean }[];
  gridColumns: number;
  jumpRowIndex: number;
}

export interface NavigationResult {
  state: NavigationState;
  moved: boolean;
}

export function calculateRightNavigation(state: NavigationState, params: NavigationParams): NavigationResult {
  const isHeaderActive = state.activeRailIndex === -1;

  if (isHeaderActive) {
    const rowCount = params.rowCounts[state.activeHeaderRow] ?? 1;
    return {
      state: {
        ...state,
        activeHeaderItemIndex: (state.activeHeaderItemIndex + 1) % rowCount,
      },
      moved: true, // We always wrap around in the header, so it "moved"
    };
  }

  const rail = params.rails[state.activeRailIndex];
  if (!rail || rail.length === 0) {
    return { state, moved: false };
  }

  const focusedIndex = state.railFocusIndices[rail.id] ?? 0;

  if (rail.isGrid) {
    if (focusedIndex < rail.length - 1) {
      return {
        state: {
          ...state,
          railFocusIndices: { ...state.railFocusIndices, [rail.id]: focusedIndex + 1 },
        },
        moved: true,
      };
    }
  } else if (rail.length > 0) {
    return {
      state: {
        ...state,
        railFocusIndices: { ...state.railFocusIndices, [rail.id]: (focusedIndex + 1) % rail.length },
      },
      moved: true, // List rails wrap around endlessly
    };
  }

  return { state, moved: false };
}

export function calculateLeftNavigation(state: NavigationState, params: NavigationParams): NavigationResult {
  const isHeaderActive = state.activeRailIndex === -1;

  if (isHeaderActive) {
    const rowCount = params.rowCounts[state.activeHeaderRow] ?? 1;
    return {
      state: {
        ...state,
        activeHeaderItemIndex: (state.activeHeaderItemIndex - 1 + rowCount) % rowCount,
      },
      moved: true,
    };
  }

  const rail = params.rails[state.activeRailIndex];
  if (!rail || rail.length === 0) {
    return { state, moved: false };
  }

  const focusedIndex = state.railFocusIndices[rail.id] ?? 0;

  if (rail.isGrid) {
    if (focusedIndex > 0) {
      return {
        state: {
          ...state,
          railFocusIndices: { ...state.railFocusIndices, [rail.id]: focusedIndex - 1 },
        },
        moved: true,
      };
    }
  } else if (rail.length > 0) {
    return {
      state: {
        ...state,
        railFocusIndices: {
          ...state.railFocusIndices,
          [rail.id]: (focusedIndex - 1 + rail.length) % rail.length,
        },
      },
      moved: true,
    };
  }

  return { state, moved: false };
}

export function calculateDownNavigation(state: NavigationState, params: NavigationParams): NavigationResult {
  const isHeaderActive = state.activeRailIndex === -1;

  if (isHeaderActive) {
    if (state.activeHeaderRow < params.jumpRowIndex) {
      return {
        state: { ...state, activeHeaderRow: state.activeHeaderRow + 1, activeHeaderItemIndex: 0 },
        moved: true,
      };
    } else if (params.rails.length > 0) {
      return {
        state: { ...state, activeRailIndex: 0, sectionJumpDirection: null },
        moved: true,
      };
    }
    return { state, moved: false };
  }

  const rail = params.rails[state.activeRailIndex];
  if (!rail) return { state, moved: false };

  const focusedIndex = state.railFocusIndices[rail.id] ?? 0;

  if (rail.isGrid) {
    const nextIndex = focusedIndex + params.gridColumns;
    if (nextIndex < rail.length) {
      return {
        state: {
          ...state,
          railFocusIndices: { ...state.railFocusIndices, [rail.id]: nextIndex },
        },
        moved: true,
      };
    }
  }

  const nextRailIndex = state.activeRailIndex + 1;
  if (nextRailIndex < params.rails.length) {
    const nextRail = params.rails[nextRailIndex];
    return {
      state: {
        ...state,
        activeRailIndex: nextRailIndex,
        sectionJumpDirection: 'down',
        railFocusIndices: { ...state.railFocusIndices, [nextRail.id]: state.railFocusIndices[nextRail.id] ?? 0 },
      },
      moved: true,
    };
  }

  return { state, moved: false };
}

export function calculateUpNavigation(state: NavigationState, params: NavigationParams): NavigationResult {
  const isHeaderActive = state.activeRailIndex === -1;

  if (isHeaderActive) {
    if (state.activeHeaderRow > 0) {
      return {
        state: { ...state, activeHeaderRow: state.activeHeaderRow - 1, activeHeaderItemIndex: 0 },
        moved: true,
      };
    }
    return { state, moved: false };
  }

  const rail = params.rails[state.activeRailIndex];
  if (!rail) return { state, moved: false };

  const focusedIndex = state.railFocusIndices[rail.id] ?? 0;

  if (rail.isGrid) {
    const nextIndex = focusedIndex - params.gridColumns;
    if (nextIndex >= 0) {
      return {
        state: {
          ...state,
          railFocusIndices: { ...state.railFocusIndices, [rail.id]: nextIndex },
        },
        moved: true,
      };
    }
  }

  const previousRailIndex = state.activeRailIndex - 1;
  if (previousRailIndex >= 0) {
    const previousRail = params.rails[previousRailIndex];
    const previousIndex = state.railFocusIndices[previousRail.id] ?? Math.max(previousRail.length - 1, 0);
    return {
      state: {
        ...state,
        activeRailIndex: previousRailIndex,
        sectionJumpDirection: 'up',
        railFocusIndices: { ...state.railFocusIndices, [previousRail.id]: previousIndex },
      },
      moved: true,
    };
  } else {
    return {
      state: {
        ...state,
        activeRailIndex: -1,
        activeHeaderRow: params.jumpRowIndex,
        activeHeaderItemIndex: 0,
        sectionJumpDirection: null,
      },
      moved: true,
    };
  }
}
