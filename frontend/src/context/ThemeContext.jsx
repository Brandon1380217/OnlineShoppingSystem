import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Theme values: 'light' | 'dark' | 'system'
// - 'system' follows prefers-color-scheme and updates live when the OS changes
// - choice is persisted to localStorage so the user keeps their preference
const STORAGE_KEY = 'shopease.theme';
const THEMES = ['light', 'dark', 'system'];
const ThemeContext = createContext(null);

function getSystemPref() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeClass(effective) {
  const root = document.documentElement;
  root.classList.toggle('dark', effective === 'dark');
  root.style.colorScheme = effective;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return THEMES.includes(saved) ? saved : 'system';
    } catch { return 'system'; }
  });

  const [systemPref, setSystemPref] = useState(getSystemPref);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setSystemPref(mql.matches ? 'dark' : 'light');
    mql.addEventListener?.('change', handler);
    return () => mql.removeEventListener?.('change', handler);
  }, []);

  const effective = theme === 'system' ? systemPref : theme;

  useEffect(() => {
    applyThemeClass(effective);
  }, [effective]);

  const setTheme = useCallback((next) => {
    if (!THEMES.includes(next)) return;
    setThemeState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }, []);

  const toggle = useCallback(() => {
    setTheme(effective === 'dark' ? 'light' : 'dark');
  }, [effective, setTheme]);

  const value = useMemo(() => ({ theme, effective, setTheme, toggle }), [theme, effective, setTheme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
