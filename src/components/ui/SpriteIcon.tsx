// Sprite Icon Component - Uses SVG sprites for better performance
'use client';

import React from 'react';

interface SpriteIconProps {
  icon: string; // Icon name (e.g., 'database', 'cache')
  className?: string;
  size?: number;
}

export default function SpriteIcon({ icon, className = '', size = 24 }: SpriteIconProps) {
  const iconId = `icon-${icon.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <svg
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <use href={`/assets/icons/sprite.svg#${iconId}`} />
    </svg>
  );
}
