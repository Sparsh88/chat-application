import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeMode } from '../types';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  wallpaper: string;
  setWallpaper: (wallpaperUrl: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('pulse_theme') as ThemeMode) || 'dark';
  });
  const [accentColor, setAccentColorState] = useState<string>(() => {
    return localStorage.getItem('pulse_accent') || '#6366f1';
  });
  const [wallpaper, setWallpaperState] = useState<string>(() => {
    return localStorage.getItem('pulse_wallpaper') || 'none';
  });

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem('pulse_theme', mode);
  };

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    localStorage.setItem('pulse_accent', color);
  };

  const setWallpaper = (wp: string) => {
    setWallpaperState(wp);
    localStorage.setItem('pulse_wallpaper', wp);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.className = `theme-${theme}`;
    root.style.setProperty('--accent', accentColor);
  }, [theme, accentColor]);

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      accentColor,
      setAccentColor,
      wallpaper,
      setWallpaper
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
