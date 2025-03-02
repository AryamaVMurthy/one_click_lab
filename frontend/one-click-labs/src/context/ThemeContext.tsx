"use client";

import React, { createContext, useContext } from "react";
import { Theme, useThemeMode } from "@/hooks/useTheme";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  clearThemePreference: () => void;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { 
    theme, 
    toggleTheme, 
    setTheme: setThemeExplicitly, 
    clearThemePreference,
    isLoaded
  } = useThemeMode();

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      setTheme: setThemeExplicitly,
      clearThemePreference,
      isLoaded
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
