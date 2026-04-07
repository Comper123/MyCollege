// src/context/ThemeContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Используем useEffect с флагом mounted для предотвращения каскадных рендеров
  useEffect(() => {
    let isMounted = true;
    
    // Используем requestAnimationFrame для асинхронной установки
    const loadTheme = () => {
      try {
        const savedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const shouldBeDark = savedTheme === "dark" || (savedTheme === null && prefersDark);
        
        if (isMounted) {
          setIsDark(shouldBeDark);
          setMounted(true);
          
          if (shouldBeDark) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      } catch (error) {
        console.error("Error loading theme:", error);
        if (isMounted) {
          setMounted(true);
        }
      }
    };
    
    // Используем setTimeout для асинхронной установки
    const timeoutId = setTimeout(loadTheme, 0);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}