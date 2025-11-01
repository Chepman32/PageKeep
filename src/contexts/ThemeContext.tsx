import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { Theme, themes, lightTheme } from '../constants/themes';
import { useSettingsStore } from '../store/settingsStore';

export type ThemeId = keyof typeof themes;

interface ThemeContextValue {
  theme: Theme;
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  themeId: 'light',
  setTheme: () => {},
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const themeId = useSettingsStore(state => state.readerDefaults.theme);
  const loadSettings = useSettingsStore(state => state.loadSettings);
  const updateReaderDefaults = useSettingsStore(
    state => state.updateReaderDefaults,
  );

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const resolvedTheme = useMemo<Theme>(() => {
    if (themeId && themeId in themes) {
      return themes[themeId as ThemeId];
    }
    return lightTheme;
  }, [themeId]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: resolvedTheme,
      themeId: resolvedTheme.id as ThemeId,
      setTheme: (id: ThemeId) => updateReaderDefaults({ theme: id }),
    }),
    [resolvedTheme, updateReaderDefaults],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  return useContext(ThemeContext);
};
