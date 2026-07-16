"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSettings } from './SettingsContext';
import { Theme, BUILT_IN_THEMES, applyTheme, arcadeVoidTheme } from '@/themes';

interface ThemeContextType {
  theme: Theme;
  setTheme: (themeId: string) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettings();
  const [activeTheme, setActiveTheme] = useState<Theme>(arcadeVoidTheme);

  // Synchronize activeTheme state whenever settings.themeId changes
  useEffect(() => {
    const selectedThemeId = settings.themeId || 'arcade-void';
    const foundTheme = BUILT_IN_THEMES.find(t => t.id === selectedThemeId) || arcadeVoidTheme;
    setActiveTheme(foundTheme);
    applyTheme(foundTheme);
  }, [settings.themeId]);

  const setTheme = (themeId: string) => {
    const foundTheme = BUILT_IN_THEMES.find(t => t.id === themeId);
    if (foundTheme) {
      updateSettings({ themeId });
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
