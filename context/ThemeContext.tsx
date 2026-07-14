import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useNativeColorScheme() ?? 'light';
  const [theme, setTheme] = useState<ThemeMode>('light');

  // Fallback to device preference on initial app load
  useEffect(() => {
    setTheme(systemScheme);
  }, [systemScheme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}