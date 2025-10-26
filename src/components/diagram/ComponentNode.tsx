// src/components/diagram/ComponentNode.tsx
"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import Image from 'next/image';
import { useDiagramStore } from '@/store/diagramStore';
import { useThemeStore } from '@/store/themeStore';
import { AlertCircle } from 'lucide-react';

const ComponentNode = ({ data, id, selected }: NodeProps) => {
  const { nodeErrors } = useDiagramStore();
  const { theme } = useThemeStore();
  const errors = nodeErrors[id] || [];
  const hasErrors = errors.length > 0;

  // Determine if we're in dark mode
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div 
      className={`px-3 py-2 rounded-lg shadow-lg border-2 flex flex-col items-center justify-center relative bg-card hover:bg-accent/50 transition-colors ${selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''} ${hasErrors ? 'border-destructive' : 'border-border'}`} 
      style={{ minWidth: 100, minHeight: 60 }}
    >
      {/* Top Handle: Target first, then Source (overlapping) */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top-in"
        style={{ left: '50%', top: 0, transform: 'translateX(-50%)' }}
      />
      <Handle 
        type="source" 
        position={Position.Top} 
        id="top-out"
        style={{ left: '50%', top: 0, transform: 'translateX(-50%)' }}
      />
      
      {/* Content */}
      <div className="flex flex-col items-center z-10 relative">
        <div className="w-8 h-8 flex items-center justify-center bg-muted/30 dark:bg-muted/70 rounded p-1 mb-1">
          <Image 
            src={data.iconUrl || '/assets/icons/default.svg'} 
            alt={data.label} 
            width={24} 
            height={24} 
            className={isDark ? "invert" : ""}
            style={{
              filter: isDark ? 'invert(1) brightness(2)' : 'none'
            }}
          />
        </div>
        <span className="text-sm font-medium text-foreground text-center break-words max-w-[80px]">{data.label}</span>
      </div>

      {/* Error Badge */}
      {hasErrors && (
        <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center shadow-md z-20">
          <AlertCircle className="w-3 h-3" />
        </div>
      )}

      {/* Right Handle: Target first, then Source (overlapping) */}
      <Handle 
        type="target" 
        position={Position.Right} 
        id="right-in"
        style={{ left: '100%', top: '50%', transform: 'translateY(-50%)' }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right-out"
        style={{ left: '100%', top: '50%', transform: 'translateY(-50%)' }}
      />

      {/* Bottom Handle: Target first, then Source (overlapping) */}
      <Handle 
        type="target" 
        position={Position.Bottom} 
        id="bottom-in"
        style={{ left: '50%', bottom: 0, transform: 'translateX(-50%)' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom-out"
        style={{ left: '50%', bottom: 0, transform: 'translateX(-50%)' }}
      />

      {/* Left Handle: Target first, then Source (overlapping) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left-in"
        style={{ right: '100%', top: '50%', transform: 'translateY(-50%)' }}
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        id="left-out"
        style={{ right: '100%', top: '50%', transform: 'translateY(-50%)' }}
      />
    </div>
  );
};

export default ComponentNode;