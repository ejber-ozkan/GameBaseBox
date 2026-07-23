"use client";

import { useEffect, useRef } from 'react';

type GamepadButtonMap = {
  [key: number]: string;
};

// Standard Xbox/PS mapping for D-pad buttons
const STANDARD_MAP: GamepadButtonMap = {
  0: 'A',      // Bottom button
  1: 'B',      // Right button
  2: 'X',      // Left button
  3: 'Y',      // Top button
  4: 'LB',     // L1
  5: 'RB',     // R1
  6: 'LT',     // L2 / Left trigger
  7: 'RT',     // R2 / Right trigger
  8: 'SELECT', // Select / Back / View
  9: 'START',  // Menu/Start
  12: 'UP',    // D-pad Up
  13: 'DOWN',  // D-pad Down
  14: 'LEFT',  // D-pad Left
  15: 'RIGHT', // D-pad Right
};

interface GamepadHandlers {
  onButtonDown?: (button: string) => void;
}

// Global state for singleton polling
const subscribers = new Set<GamepadHandlers>();
const lastStates: Record<number, Record<number, boolean>> = {};
const lastAxes: Record<number, Record<number, number>> = {}; // PadIdx -> AxisIdx -> Value
let pollingActive = false;

// Threshold for stick movement to count as a "press"
const AXIS_THRESHOLD = 0.5;

function pollGamepads() {
  if (subscribers.size === 0) {
    pollingActive = false;
    return;
  }

  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  
  for (let i = 0; i < pads.length; i++) {
    const pad = pads[i];
    if (!pad) continue;

    if (!lastStates[i]) lastStates[i] = {};
    if (!lastAxes[i]) lastAxes[i] = {};

    // 1. Process Buttons (D-pad + Action)
    pad.buttons.forEach((button, btnIdx) => {
      const isPressed = button.pressed;
      const wasPressed = lastStates[i][btnIdx] || false;

      if (isPressed && !wasPressed) {
        const mappedName = STANDARD_MAP[btnIdx];
        if (mappedName) {
          subscribers.forEach(sub => sub.onButtonDown?.(mappedName));
        } else {
          console.log(`[Gamepad] Pad ${i} button ${btnIdx} pressed`);
        }
      }
      lastStates[i][btnIdx] = isPressed;
    });

    // 2. Process Axes (Left Stick)
    // Horizontal (0) and Vertical (1)
    [0, 1].forEach(axisIdx => {
      const val = pad.axes[axisIdx];
      const prevVal = lastAxes[i][axisIdx] || 0;
      
      const fire = (btn: string) => {
        subscribers.forEach(sub => sub.onButtonDown?.(btn));
      };

      // Check for "leading edge" movement into threshold zones
      if (axisIdx === 0) { // Horizontal
        if (val < -AXIS_THRESHOLD && prevVal >= -AXIS_THRESHOLD) fire('LEFT');
        if (val > AXIS_THRESHOLD && prevVal <= AXIS_THRESHOLD) fire('RIGHT');
      } else if (axisIdx === 1) { // Vertical
        if (val < -AXIS_THRESHOLD && prevVal >= -AXIS_THRESHOLD) fire('UP');
        if (val > AXIS_THRESHOLD && prevVal <= AXIS_THRESHOLD) fire('DOWN');
      }
      
      lastAxes[i][axisIdx] = val;
    });
  }

  requestAnimationFrame(pollGamepads);
}

export function useGamepad(handlers: GamepadHandlers) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // Stable listener proxy that always calls the latest registered callback
  const listener = useRef<GamepadHandlers>({
    onButtonDown: (btn) => {
      if (handlersRef.current.onButtonDown) {
        handlersRef.current.onButtonDown(btn);
      }
    }
  });

  useEffect(() => {
    const currentListener = listener.current;
    subscribers.add(currentListener);
    
    if (!pollingActive) {
      pollingActive = true;
      requestAnimationFrame(pollGamepads);
    }

    return () => {
      subscribers.delete(currentListener);
    };
  }, []);
}
