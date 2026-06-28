"use client";

import { useEffect, useState } from 'react';
import { useGamepad } from '../../hooks/useGamepad';
import { usePopupOpenSound } from '../../hooks/usePopupOpenSound';

type ExitPromptFocus = 'checkbox' | 'cancel' | 'exit';

interface BigBoxExitPromptProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: (dontAskAgain: boolean) => void;
  onGamepadInput: () => void;
}

export function BigBoxExitPrompt({
  isOpen,
  onCancel,
  onConfirm,
  onGamepadInput,
}: BigBoxExitPromptProps) {
  const [focusTarget, setFocusTarget] = useState<ExitPromptFocus>('exit');
  const [dontAskAgain, setDontAskAgain] = useState(false);
  usePopupOpenSound(isOpen, 'bigbox-exit-prompt');

  useGamepad({
    onButtonDown: (button) => {
      if (!isOpen) {
        return;
      }

      onGamepadInput();

      if (button === 'B') {
        onCancel();
        return;
      }

      if (button === 'UP' || button === 'DOWN') {
        setFocusTarget((current) => {
          if (current === 'checkbox') {
            return 'exit';
          }
          return 'checkbox';
        });
        return;
      }

      if (button === 'LEFT') {
        setFocusTarget((current) => {
          if (current === 'exit') {
            return 'cancel';
          }
          return current;
        });
        return;
      }

      if (button === 'RIGHT') {
        setFocusTarget((current) => {
          if (current === 'cancel') {
            return 'exit';
          }
          return current;
        });
        return;
      }

      if (button === 'A') {
        if (focusTarget === 'checkbox') {
          setDontAskAgain((current) => !current);
          return;
        }

        if (focusTarget === 'cancel') {
          onCancel();
          return;
        }

        onConfirm(dontAskAgain);
      }
    },
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        setFocusTarget((current) => (current === 'checkbox' ? 'exit' : 'checkbox'));
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setFocusTarget((current) => (current === 'exit' ? 'cancel' : current));
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setFocusTarget((current) => (current === 'cancel' ? 'exit' : current));
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();

        if (focusTarget === 'checkbox') {
          setDontAskAgain((current) => !current);
          return;
        }

        if (focusTarget === 'cancel') {
          onCancel();
          return;
        }

        onConfirm(dontAskAgain);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dontAskAgain, focusTarget, isOpen, onCancel, onConfirm]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.2),rgba(2,6,23,0.92))] px-6 backdrop-blur-md">
      <div className="w-full max-w-[760px] rounded-[34px] border border-red-400/20 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(3,7,18,0.98))] p-8 shadow-[0_35px_120px_rgba(0,0,0,0.65)]">
        <div className="mb-8">
          <div className="mb-3 text-[11px] font-black uppercase tracking-[0.32em] text-red-300/70">
            Exit Fullscreen Session
          </div>
          <h2 className="text-4xl font-black tracking-tight text-white">Quit GBBox?</h2>
          <p className="mt-3 max-w-[560px] text-base leading-7 text-white/58">
            Your current fullscreen session will be saved before the application closes, including your
            latest BigBox browsing position and saved settings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDontAskAgain((current) => !current)}
          className={`mb-8 flex w-full items-center gap-4 rounded-[24px] border px-5 py-4 text-left transition-all ${
            focusTarget === 'checkbox'
              ? 'border-cyan-300 bg-cyan-400/10 shadow-[0_0_0_2px_rgba(103,232,249,0.14)]'
              : 'border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.05]'
          }`}
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-md border text-lg font-black ${
              dontAskAgain
                ? 'border-cyan-300 bg-cyan-400/20 text-cyan-200'
                : 'border-white/20 bg-black/20 text-transparent'
            }`}
          >
            ✓
          </span>
          <span>
            <span className="block text-sm font-black uppercase tracking-[0.18em] text-white">
              Don&apos;t ask again
            </span>
            <span className="block text-sm text-white/52">
              Pressing controller B in fullscreen will quit directly next time.
            </span>
          </span>
        </button>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.22em] text-white/34">
            <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-2">A Select</span>
            <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-2">B Cancel</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onCancel}
              className={`rounded-[20px] border px-6 py-4 text-sm font-black uppercase tracking-[0.2em] transition-all ${
                focusTarget === 'cancel'
                  ? 'border-white bg-white text-[#040913] shadow-[0_18px_40px_rgba(255,255,255,0.18)]'
                  : 'border-white/12 bg-white/[0.04] text-white/72 hover:border-white/24 hover:bg-white/[0.07]'
              }`}
            >
              Stay Here
            </button>
            <button
              type="button"
              onClick={() => onConfirm(dontAskAgain)}
              className={`rounded-[20px] border px-7 py-4 text-sm font-black uppercase tracking-[0.2em] transition-all ${
                focusTarget === 'exit'
                  ? 'border-red-300 bg-red-500 text-white shadow-[0_18px_45px_rgba(239,68,68,0.35)]'
                  : 'border-red-400/30 bg-red-500/18 text-red-100 hover:border-red-300/45 hover:bg-red-500/26'
              }`}
            >
              Exit Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
