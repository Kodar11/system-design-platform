// src/components/ui/ThemeAwareIcon.tsx
"use client";

import React from 'react';
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
  
  // Determine if we're in dark mode
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

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
