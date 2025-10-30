// src/components/ui/ThemeAwareIcon.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useThemeStore } from '@/store/themeStore';

interface ThemeAwareIconProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export default function ThemeAwareIcon({ src, alt, width, height, className = '' }: ThemeAwareIconProps) {
  const { theme } = useThemeStore();
  const [isDark, setIsDark] = useState(false); // Default to light mode on server
  
  // Only determine theme on client side to avoid hydration mismatch
  useEffect(() => {
    const checkDarkMode = () => {
      if (theme === 'dark') {
        setIsDark(true);
      } else if (theme === 'system') {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      } else {
        setIsDark(false);
      }
    };
    
    checkDarkMode();
    
    // Listen for system theme changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  return (
    <Image 
      src={src} 
      alt={alt} 
      width={width} 
      height={height}
      className={`${className} ${isDark ? "invert" : ""}`}
      style={{
        filter: isDark ? 'invert(1) brightness(2)' : 'none'
      }}
    />
  );
}
