"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useGamepad } from './useGamepad';

import { useSettings } from '../contexts/SettingsContext';
import { playUiSoundEffect } from '../lib/ui-sound-effects';

export type DetailZone =
  | 'play'
  | 'play-web'
  | 'favorite'
  | 'versions'
  | 'sid'
  | 'screenshot'
  | 'media-gameplay'
  | 'media-titlescreen'
  | 'media-videosna'
  | 'media-boxfront'
  | 'media-extras';

type Direction = 'up' | 'down' | 'left' | 'right';

export type NavigationConfig = Record<DetailZone, Partial<Record<Direction, DetailZone>>>;

export interface DetailNavigationHook {
  focusedZone: DetailZone;
  setFocusedZone: (zone: DetailZone) => void;
  isFocused: (zone: DetailZone) => boolean;
  focusCls: (zone: DetailZone) => string;
  registerAction: (zone: DetailZone, action: () => void) => void;
  registerTabActions: (actions: { previous?: () => void; next?: () => void }) => void;
  registerDirectionalOverride: (zone: DetailZone, handler: (dir: Direction) => boolean) => void;
  hoverZone: (zone: DetailZone) => void;
  isMouseMode: boolean;
  lastAction: string;
}

interface DetailNavProps {
  onBack: () => void;
  initialZone?: DetailZone;
  config: NavigationConfig;
  enabled?: boolean;
}

export function useDetailNavigation({ onBack, initialZone = 'play', config, enabled = true }: DetailNavProps): DetailNavigationHook {
  const { settings } = useSettings();
  const [focusedZone, setFocusedZoneState] = useState<DetailZone>(initialZone);
  const focusedZoneRef = useRef<DetailZone>(initialZone);
  const actionsRef = useRef<Partial<Record<DetailZone, () => void>>>({});
  const tabActionsRef = useRef<{ previous?: () => void; next?: () => void }>({});
  const directionalOverridesRef = useRef<Partial<Record<DetailZone, (dir: Direction) => boolean>>>({});
  
  const [lastAction, setLastAction] = useState<string>('Ready');
  const [isMouseMode, setIsMouseMode] = useState(true);
  const isMouseModeRef = useRef(true);

  const debug = (msg: string) => {
    console.log(`[useDetailNavigation] ${msg}`);
    setLastAction(msg);
  };

  const hasBlockingModal = useCallback(() => {
    if (typeof document === 'undefined') {
      return false;
    }
    return Boolean(document.querySelector('[data-detail-modal="open"]'));
  }, []);

  const setControllerMode = useCallback(() => {
    if (isMouseModeRef.current) {
      isMouseModeRef.current = false;
      setIsMouseMode(false);
    }
  }, []);

  const setFocusedZone = useCallback((zone: DetailZone) => {
    focusedZoneRef.current = zone;
    setFocusedZoneState(zone);
  }, []);

  const moveZone = useCallback((dir: Direction) => {
    const cur = focusedZoneRef.current;
    const override = directionalOverridesRef.current[cur];
    if (override?.(dir)) {
      void playUiSoundEffect('menu-move-1', 0.28);
      debug(`Handled ${dir} in ${cur}`);
      return;
    }
    const next = config[cur]?.[dir];
    if (next) {
      void playUiSoundEffect('menu-move-1', 0.28);
      debug(`Moved ${dir} to ${next}`);
      setFocusedZone(next);
    } else {
      debug(`No exit ${dir} from ${cur}`);
    }
  }, [setFocusedZone, config]);

  const activateFocused = useCallback(() => {
    const zone = focusedZoneRef.current;
    const action = actionsRef.current[zone];
    if (action) {
      debug(`Activating ${zone}`);
      action();
    } else {
      debug(`No action for ${zone}`);
    }
  }, []);

  const registerAction = useCallback((zone: DetailZone, action: () => void) => {
    actionsRef.current[zone] = action;
  }, []);

  const registerTabActions = useCallback((actions: { previous?: () => void; next?: () => void }) => {
    tabActionsRef.current = actions;
  }, []);

  const registerDirectionalOverride = useCallback((zone: DetailZone, handler: (dir: Direction) => boolean) => {
    directionalOverridesRef.current[zone] = handler;
  }, []);

  const hoverZone = useCallback((zone: DetailZone) => {
    // If we're in "scroll only" mode (meaning mouseHoverSelection is false), we skip hover selection
    if (settings.mouseHoverSelection && isMouseModeRef.current) {
      setFocusedZone(zone);
    }
  }, [setFocusedZone, settings.mouseHoverSelection]);

  useEffect(() => {
    const onMouseMove = () => {
      if (!isMouseModeRef.current) {
        isMouseModeRef.current = true;
        setIsMouseMode(true);
      }
    };
    
    const handleWheel = (e: WheelEvent) => {
      if (!enabled || hasBlockingModal() || !settings.scrollNavigation) return;

      if (!isMouseModeRef.current) {
        isMouseModeRef.current = true;
        setIsMouseMode(true);
      }
      
      if (e.deltaY > 0) {
        moveZone('down');
      } else if (e.deltaY < 0) {
        moveZone('up');
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [enabled, hasBlockingModal, moveZone, settings.scrollNavigation]);

  // Combined Controller Handler
  useGamepad({
    onButtonDown: (btn) => {
      if (!enabled || hasBlockingModal()) {
        return;
      }
      setControllerMode();
      if (btn === 'LB') {
        void playUiSoundEffect('menu-move-1', 0.28);
        debug('Previous tab');
        tabActionsRef.current.previous?.();
      }
      if (btn === 'RB') {
        void playUiSoundEffect('menu-move-1', 0.28);
        debug('Next tab');
        tabActionsRef.current.next?.();
      }
      if (btn === 'LEFT')  moveZone('left');
      if (btn === 'RIGHT') moveZone('right');
      if (btn === 'UP')    moveZone('up');
      if (btn === 'DOWN')  moveZone('down');
      if (btn === 'A')     activateFocused();
      if (btn === 'B')     { debug('Back Button'); onBack(); }
    }
  });

  // Keyboard fallbacks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enabled || hasBlockingModal()) return;
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.key === 'Tab') {
        e.preventDefault();
        setControllerMode();
        if (e.shiftKey) {
          void playUiSoundEffect('menu-move-1', 0.28);
          debug('Previous tab');
          tabActionsRef.current.previous?.();
        } else {
          void playUiSoundEffect('menu-move-1', 0.28);
          debug('Next tab');
          tabActionsRef.current.next?.();
        }
        return;
      }

      if (e.key === 'PageUp' || e.key === '[') {
        e.preventDefault();
        setControllerMode();
        void playUiSoundEffect('menu-move-1', 0.28);
        debug('Previous tab');
        tabActionsRef.current.previous?.();
        return;
      }

      if (e.key === 'PageDown' || e.key === ']') {
        e.preventDefault();
        setControllerMode();
        void playUiSoundEffect('menu-move-1', 0.28);
        debug('Next tab');
        tabActionsRef.current.next?.();
        return;
      }

      setControllerMode();
      if (e.key === 'ArrowLeft')  { e.preventDefault(); moveZone('left'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); moveZone('right'); }
      if (e.key === 'ArrowUp')    { e.preventDefault(); moveZone('up'); }
      if (e.key === 'ArrowDown')  { e.preventDefault(); moveZone('down'); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateFocused(); }
      if (e.key === 'Escape' || e.key === 'Backspace') { debug('Escape/Back'); onBack(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activateFocused, enabled, hasBlockingModal, moveZone, onBack, setControllerMode]);

  const isFocused = useCallback((zone: DetailZone) => focusedZone === zone, [focusedZone]);

  const focusCls = useCallback((zone: DetailZone): string =>
    focusedZone === zone
      ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-gray-900 z-50 relative brightness-125 shadow-[0_0_25px_rgba(250,204,21,0.9)] scale-105'
      : ''
  , [focusedZone]);

  return { focusedZone, setFocusedZone, isFocused, focusCls, registerAction, registerTabActions, registerDirectionalOverride, hoverZone, isMouseMode, lastAction };
}
