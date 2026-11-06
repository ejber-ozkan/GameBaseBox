"use client";

import React, { ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeDecoratorProps {
  children: ReactNode;
}

export function ThemeDecorator({ children }: ThemeDecoratorProps) {
  const { theme } = useTheme();
  const { scanlines, outerBorder, ambientGlow, tvNoise } = theme.effects;

  // Keep the same element tree for every theme: swapping wrapper elements when the
  // outer border toggles would remount the whole app (and replay the launch splash).
  const content = (
    <div
      className={
        outerBorder
          ? 'flex-1 min-h-0 w-screen flex flex-col bg-theme-secondary p-4 sm:p-6 md:p-8 box-border transition-colors duration-250 relative'
          : 'flex-1 min-h-0 w-screen flex flex-col bg-theme-background transition-colors duration-250 relative'
      }
      data-testid={outerBorder ? 'theme-decorator-outer-border' : 'theme-decorator-normal-container'}
    >
      <div
        className={outerBorder ? 'flex-1 min-h-0 flex flex-col overflow-hidden relative isolate' : 'flex-1 min-h-0 flex flex-col relative'}
        style={outerBorder ? {
          backgroundColor: theme.id === 'c64-edition' ? 'transparent' : 'var(--theme-background)'
        } : undefined}
      >
        {children}
      </div>
    </div>
  );

  return (
    <>
      {/* Ambient Glow Effects */}
      {ambientGlow && (
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none z-0"
          data-testid="theme-decorator-glow"
        >
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-theme-primary/8 blur-[130px]" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-theme-secondary/8 blur-[130px]" />
        </div>
      )}

      {/* Main themed viewport container */}
      {/* A definite viewport height (not min-height) so views below can size with
          h-full / flex-1 and "fit by design"; scrolling views scroll inside themselves. */}
      <div className="relative z-10 h-screen w-screen flex flex-col overflow-hidden">
        {content}
      </div>

      {/* CRT Scanline Overlay */}
      {scanlines && (
        <div
          className="scanlines-overlay"
          data-testid="theme-decorator-scanlines"
        />
      )}

      {/* TV Noise Overlay */}
      {tvNoise && (
        <div
          className="fixed inset-0 pointer-events-none noise-bg z-[110]"
          data-testid="theme-decorator-noise"
        />
      )}
    </>
  );
}
