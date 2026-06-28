"use client";

import { useEffect, useRef } from 'react';
import { playRotatingUiSoundEffect } from '../lib/ui-sound-effects';

const POPUP_SOUNDS = ['app-popup-1', 'app-popup-2', 'app-popup-3'];

export function usePopupOpenSound(isOpen: boolean, sequenceKey = 'popup') {
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      void playRotatingUiSoundEffect(sequenceKey, POPUP_SOUNDS, 0.5);
    }

    wasOpenRef.current = isOpen;
  }, [isOpen, sequenceKey]);
}
