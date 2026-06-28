"use client";

import { startTransition, useMemo, useState } from 'react';
import { useGamepad } from '../hooks/useGamepad';
import { usePopupOpenSound } from '../hooks/usePopupOpenSound';

type KeyboardAction = 'append' | 'space' | 'backspace' | 'clear' | 'close';

interface KeyboardKey {
  id: string;
  label: string;
  action: KeyboardAction;
  value?: string;
  widthClass?: string;
}

interface ControllerSearchKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  onGamepadInput: () => void;
  onSearchChange: (value: string) => void;
  searchInput: string;
}

const KEYBOARD_ROWS: KeyboardKey[][] = [
  [
    { id: '1', label: '1', action: 'append', value: '1' },
    { id: '2', label: '2', action: 'append', value: '2' },
    { id: '3', label: '3', action: 'append', value: '3' },
    { id: '4', label: '4', action: 'append', value: '4' },
    { id: '5', label: '5', action: 'append', value: '5' },
    { id: '6', label: '6', action: 'append', value: '6' },
    { id: '7', label: '7', action: 'append', value: '7' },
    { id: '8', label: '8', action: 'append', value: '8' },
    { id: '9', label: '9', action: 'append', value: '9' },
    { id: '0', label: '0', action: 'append', value: '0' },
    { id: 'backspace', label: 'Backspace', action: 'backspace', widthClass: 'col-span-2' },
  ],
  [
    { id: 'q', label: 'Q', action: 'append', value: 'q' },
    { id: 'w', label: 'W', action: 'append', value: 'w' },
    { id: 'e', label: 'E', action: 'append', value: 'e' },
    { id: 'r', label: 'R', action: 'append', value: 'r' },
    { id: 't', label: 'T', action: 'append', value: 't' },
    { id: 'y', label: 'Y', action: 'append', value: 'y' },
    { id: 'u', label: 'U', action: 'append', value: 'u' },
    { id: 'i', label: 'I', action: 'append', value: 'i' },
    { id: 'o', label: 'O', action: 'append', value: 'o' },
    { id: 'p', label: 'P', action: 'append', value: 'p' },
  ],
  [
    { id: 'a', label: 'A', action: 'append', value: 'a' },
    { id: 's', label: 'S', action: 'append', value: 's' },
    { id: 'd', label: 'D', action: 'append', value: 'd' },
    { id: 'f', label: 'F', action: 'append', value: 'f' },
    { id: 'g', label: 'G', action: 'append', value: 'g' },
    { id: 'h', label: 'H', action: 'append', value: 'h' },
    { id: 'j', label: 'J', action: 'append', value: 'j' },
    { id: 'k', label: 'K', action: 'append', value: 'k' },
    { id: 'l', label: 'L', action: 'append', value: 'l' },
  ],
  [
    { id: 'z', label: 'Z', action: 'append', value: 'z' },
    { id: 'x', label: 'X', action: 'append', value: 'x' },
    { id: 'c', label: 'C', action: 'append', value: 'c' },
    { id: 'v', label: 'V', action: 'append', value: 'v' },
    { id: 'b', label: 'B', action: 'append', value: 'b' },
    { id: 'n', label: 'N', action: 'append', value: 'n' },
    { id: 'm', label: 'M', action: 'append', value: 'm' },
    { id: 'space', label: 'Space', action: 'space', widthClass: 'col-span-2' },
    { id: 'clear', label: 'Clear', action: 'clear' },
    { id: 'close', label: 'Done', action: 'close' },
  ],
];

function updateSearchValue(
  currentValue: string,
  key: KeyboardKey,
) {
  switch (key.action) {
    case 'append':
      return `${currentValue}${key.value ?? ''}`;
    case 'space':
      return `${currentValue} `;
    case 'backspace':
      return currentValue.slice(0, -1);
    case 'clear':
      return '';
    case 'close':
      return currentValue;
  }
}

export function ControllerSearchKeyboard({
  isOpen,
  onClose,
  onGamepadInput,
  onSearchChange,
  searchInput,
}: ControllerSearchKeyboardProps) {
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);
  usePopupOpenSound(isOpen, 'controller-search-keyboard');

  const selectedKey = useMemo(
    () => KEYBOARD_ROWS[selectedRow]?.[selectedCol] ?? KEYBOARD_ROWS[0][0],
    [selectedCol, selectedRow],
  );

  const applyKey = (key: KeyboardKey) => {
    if (key.action === 'close') {
      onClose();
      return;
    }

    const nextValue = updateSearchValue(searchInput, key);
    startTransition(() => onSearchChange(nextValue));
  };

  useGamepad({
    onButtonDown: (button) => {
      if (!isOpen) {
        return;
      }

      onGamepadInput();

      if (button === 'B') {
        onClose();
        return;
      }

      if (button === 'A') {
        applyKey(selectedKey);
        return;
      }

      if (button === 'LEFT') {
        setSelectedCol((current) => Math.max(current - 1, 0));
        return;
      }

      if (button === 'RIGHT') {
        setSelectedCol((current) => Math.min(current + 1, KEYBOARD_ROWS[selectedRow].length - 1));
        return;
      }

      if (button === 'UP') {
        setSelectedRow((current) => {
          const nextRow = Math.max(current - 1, 0);
          setSelectedCol((previous) => Math.min(previous, KEYBOARD_ROWS[nextRow].length - 1));
          return nextRow;
        });
        return;
      }

      if (button === 'DOWN') {
        setSelectedRow((current) => {
          const nextRow = Math.min(current + 1, KEYBOARD_ROWS.length - 1);
          setSelectedCol((previous) => Math.min(previous, KEYBOARD_ROWS[nextRow].length - 1));
          return nextRow;
        });
      }
    },
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-[linear-gradient(180deg,rgba(2,6,23,0)_0%,rgba(2,6,23,0.38)_35%,rgba(2,6,23,0.92)_100%)]">
      <div className="w-full border-t border-cyan-400/20 bg-[linear-gradient(180deg,rgba(6,10,18,0.96),rgba(5,8,15,0.99))] px-10 pb-8 pt-6 shadow-[0_-24px_80px_rgba(2,6,23,0.7)] backdrop-blur-3xl">
        <div className="mx-auto flex max-w-[1720px] flex-col gap-5">
          <div className="flex items-end justify-between gap-8">
            <div className="min-w-0 flex-1">
              <div className="mb-2 text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300/70">
                Controller Search
              </div>
              <div className="min-h-[68px] rounded-[24px] border border-white/10 bg-white/[0.045] px-7 py-4 text-3xl font-black tracking-tight text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                {searchInput || <span className="text-white/20">Search your library</span>}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3 text-sm font-bold uppercase tracking-[0.18em] text-white/45">
              <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-cyan-200">A Select</span>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">B Close</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {KEYBOARD_ROWS.map((row, rowIndex) => (
              <div
                key={`row-${rowIndex}`}
                className={`grid gap-3 ${
                  rowIndex === 0
                    ? 'grid-cols-12'
                    : rowIndex === 1
                      ? 'grid-cols-10'
                      : rowIndex === 2
                        ? 'grid-cols-9'
                    : rowIndex === 3
                      ? 'grid-cols-10'
                      : 'grid-cols-10'
                }`}
              >
                {row.map((key, colIndex) => {
                  const isSelected = rowIndex === selectedRow && colIndex === selectedCol;
                  return (
                    <button
                      key={key.id}
                      type="button"
                      onClick={() => applyKey(key)}
                      className={`min-h-[78px] rounded-[22px] border px-4 text-center transition-all duration-200 ${
                        key.widthClass ?? ''
                      } ${
                        isSelected
                          ? 'border-cyan-300 bg-cyan-400/16 text-white shadow-[0_0_0_2px_rgba(103,232,249,0.18),0_16px_34px_rgba(6,182,212,0.22)]'
                          : 'border-white/8 bg-white/[0.04] text-white/82 hover:border-white/20 hover:bg-white/[0.07]'
                      }`}
                    >
                      <div className="flex h-full items-center justify-center text-[26px] font-black tracking-tight">
                        {key.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
