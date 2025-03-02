"use client";

import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

/**
 * Custom hook for managing theme (light/dark mode)
 * - Persists user preference in localStorage
 * - Falls back to system preference if no stored preference
 * - Synchronizes with system preference changes when no explicit preference
 */
export function useThemeMode() {
  const [theme, setTheme] = useState<Theme>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    // Safe to access localStorage only on client side
    if (typeof window !== 'undefined') {
      // Check if theme is stored in localStorage
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      
      if (storedTheme && (storedTheme === 'dark' || storedTheme === 'light')) {
        setTheme(storedTheme);
      } else {
        // Fall back to system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }

      // Set up listener for system preference changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (!localStorage.getItem('theme')) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      setIsLoaded(true);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Update HTML class and localStorage when theme changes
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoaded) {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      // Store in localStorage
      localStorage.setItem('theme', theme);
    }
  }, [theme, isLoaded]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const setThemeExplicitly = (newTheme: Theme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setTheme(newTheme);
    }
  };

  const clearThemePreference = () => {
    localStorage.removeItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  };

  return {
    theme,
    toggleTheme,
    setTheme: setThemeExplicitly,
    clearThemePreference,
    isLoaded
  };
}
