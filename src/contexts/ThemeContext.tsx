"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSettings } from './SettingsContext';
import { Theme, BUILT_IN_THEMES, applyTheme, arcadeVoidTheme } from '@/themes';

interface ThemeContextType {
  theme: Theme;
  setTheme: (themeId: string, persist?: boolean) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettings();
  const currentThemeId = settings.themeId || 'arcade-void';
  const [prevThemeId, setPrevThemeId] = useState<string>(currentThemeId);
  const [activeTheme, setActiveTheme] = useState<Theme>(() => {
    return BUILT_IN_THEMES.find(t => t.id === currentThemeId) || arcadeVoidTheme;
  });

  // Synchronize state during render when settings.themeId changes
  if (currentThemeId !== prevThemeId) {
    setPrevThemeId(currentThemeId);
    const foundTheme = BUILT_IN_THEMES.find(t => t.id === currentThemeId) || arcadeVoidTheme;
    setActiveTheme(foundTheme);
  }

  // Apply theme styles and data attributes to the document whenever activeTheme changes
  useEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);

  const setTheme = (themeId: string, persist = true) => {
    const foundTheme = BUILT_IN_THEMES.find(t => t.id === themeId);
    if (foundTheme) {
      if (persist) {
        updateSettings({ themeId });
      } else {
        setActiveTheme(foundTheme);
        applyTheme(foundTheme);
      }
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        setTheme,
        availableThemes: BUILT_IN_THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
