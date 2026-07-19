"use client";

import React, { ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeDecoratorProps {
  children: ReactNode;
}

export function ThemeDecorator({ children }: ThemeDecoratorProps) {
  const { theme } = useTheme();
  const { scanlines, outerBorder, ambientGlow, tvNoise } = theme.effects;

  // Render C64 outer border if active
  const content = outerBorder ? (
    <div
      className="min-h-screen w-screen flex flex-col bg-theme-secondary p-4 sm:p-6 md:p-8 box-border transition-colors duration-250 relative"
      data-testid="theme-decorator-outer-border"
    >
      <div
        className="flex-1 flex flex-col overflow-hidden relative isolate"
        style={{
          backgroundColor: theme.id === 'c64-edition' ? 'transparent' : 'var(--theme-background)'
        }}
      >
        {children}
      </div>
    </div>
  ) : (
    <div
      className="min-h-screen w-screen flex flex-col bg-theme-background transition-colors duration-250 relative"
      data-testid="theme-decorator-normal-container"
    >
      {children}
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
      <div className="relative z-10 min-h-screen w-screen flex flex-col">
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
