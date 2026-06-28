"use client";

import { useEffect, useRef } from 'react';
import { playRotatingUiSoundEffect } from '../lib/ui-sound-effects';

const ERROR_SOUNDS = ['app-error-1', 'app-error-2'];
const ERROR_THROTTLE_MS = 1500;

export function UiSoundRuntime() {
  const lastErrorAtRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const playErrorSound = () => {
      const now = Date.now();
      if (now - lastErrorAtRef.current < ERROR_THROTTLE_MS) {
        return;
      }

      lastErrorAtRef.current = now;
      void playRotatingUiSoundEffect('frontend-error', ERROR_SOUNDS, 0.62);
    };

    const handleError = () => {
      playErrorSound();
    };

    const handleUnhandledRejection = () => {
      playErrorSound();
    };

    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      playErrorSound();
      originalConsoleError(...args);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
