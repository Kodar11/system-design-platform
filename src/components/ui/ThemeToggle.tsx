// src/components/ui/ThemeToggle.tsx
'use client';

import { useThemeStore } from '@/store/themeStore';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const computeIsDark = () => {
      return theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    };

    setIsDark(computeIsDark());

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setIsDark(computeIsDark());
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-muted text-muted-foreground hover:bg-accent transition-colors"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
}