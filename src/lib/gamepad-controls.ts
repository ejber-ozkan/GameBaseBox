"use client";

import { useMemo } from 'react';

export interface GamepadControlHint {
  id: string;
  button: string;
  label: string;
}

export type GamepadViewContext = 'grid' | 'detail';

export function getGamepadControls(context: GamepadViewContext = 'grid'): GamepadControlHint[] {
  if (context === 'detail') {
    return [
      { id: 'navigate', button: 'D-PAD', label: 'NAVIGATE' },
      { id: 'select', button: 'A', label: 'SELECT / PLAY' },
      { id: 'back', button: 'B', label: 'BACK' },
      { id: 'favorite', button: 'Y', label: 'FAVORITE' },
      { id: 'tabs', button: 'LB / RB', label: 'TABS' },
      { id: 'settings', button: 'START', label: 'SETTINGS' },
    ];
  }

  return [
    { id: 'navigate', button: 'D-PAD', label: 'NAVIGATE' },
    { id: 'select', button: 'A', label: 'SELECT' },
    { id: 'back', button: 'B', label: 'BACK' },
    { id: 'favorite', button: 'Y', label: 'FAVORITE' },
    { id: 'sections', button: 'LB / RB', label: 'SECTIONS' },
    { id: 'top_menu', button: 'LT', label: 'TOP MENU' },
    { id: 'settings', button: 'START', label: 'SETTINGS' },
  ];
}

export function useGamepadControls(context: GamepadViewContext = 'grid'): GamepadControlHint[] {
  return useMemo(() => getGamepadControls(context), [context]);
}
