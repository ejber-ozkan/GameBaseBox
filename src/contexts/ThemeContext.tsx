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
  const [requestedThemeId, setRequestedThemeId] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<Theme>(() => {
    return BUILT_IN_THEMES.find(t => t.id === currentThemeId) || arcadeVoidTheme;
  });

  // Synchronize state during render when settings.themeId changes
  if (currentThemeId !== prevThemeId) {
    setPrevThemeId(currentThemeId);
    const resolvedThemeId = requestedThemeId && requestedThemeId !== currentThemeId
      ? requestedThemeId
      : currentThemeId;
    const foundTheme = BUILT_IN_THEMES.find(t => t.id === resolvedThemeId) || arcadeVoidTheme;
    setActiveTheme(foundTheme);
  }

  useEffect(() => {
    if (requestedThemeId && requestedThemeId !== currentThemeId) {
      updateSettings({ themeId: requestedThemeId });
      return;
    }
  }, [currentThemeId, requestedThemeId, updateSettings]);

  // Apply theme styles and data attributes to the document whenever activeTheme changes
  useEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);

  const setTheme = (themeId: string, persist = true) => {
    const foundTheme = BUILT_IN_THEMES.find(t => t.id === themeId);
    if (foundTheme) {
      setActiveTheme(foundTheme);
      applyTheme(foundTheme);

      if (persist) {
        setRequestedThemeId(themeId);
        updateSettings({ themeId });
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
    return {
      theme: arcadeVoidTheme,
      setTheme: () => {},
      availableThemes: BUILT_IN_THEMES,
    };
  }
  return context;
}
