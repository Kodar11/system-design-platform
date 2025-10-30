// src/components/diagram/ComponentPalette.tsx
"use client";

import React, { memo, useCallback, useRef } from "react";
import Image from "next/image";
import { useThemeStore } from '@/store/themeStore';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Component {
  id: string;
  name: string;
  type: string;
  iconUrl: string | null;
  documentationUrl?: string | null;
  metadata: unknown;
}

interface ComponentPaletteProps {
  components: Component[];
}

// Memoize individual component item to prevent re-renders
const ComponentItem = memo(({ 
  comp, 
  onDragStart, 
  isDark 
}: { 
  comp: Component; 
  onDragStart: (event: React.DragEvent, nodeType: string, originalType: string, componentId: string, componentName: string, metadata: unknown, iconUrl: string | null) => void;
  isDark: boolean;
}) => (
  <div
    key={comp.id}
    className="p-3 bg-muted rounded-lg flex items-center gap-3 cursor-grab hover:bg-accent hover:text-accent-foreground transition-all duration-200 border border-border/50 hover:border-primary/30 hover:shadow-md"
    onDragStart={(event) => onDragStart(event, 'component', comp.type, comp.id, comp.name, comp.metadata, comp.iconUrl)}
    draggable
  >
    <div className="w-6 h-6 flex items-center justify-center bg-muted/30 dark:bg-muted/70 rounded p-1">
      <Image 
        src={comp.iconUrl || "/assets/icons/default.svg"} 
        alt={comp.name} 
        width={20} 
        height={20}
        className={isDark ? "invert" : ""}
        style={{
          filter: isDark ? 'invert(1) brightness(2)' : 'none'
        }}
      />
    </div>
    <span className="text-sm font-medium">{comp.name}</span>
  </div>
));

ComponentItem.displayName = 'ComponentItem';

function ComponentPalette({ components }: ComponentPaletteProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // ✅ Optimized: Only subscribe to theme
  const theme = useThemeStore((state) => state.theme);
  
  // Determine if we're in dark mode
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // ✅ Optimized: Memoize callback to prevent recreation
  const onDragStart = useCallback((event: React.DragEvent, nodeType: string, originalType: string, componentId: string, componentName: string, metadata: unknown, iconUrl: string | null) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify({ nodeType, originalType, componentId, componentName, metadata, iconUrl: iconUrl || `/assets/icons/${originalType}.svg` }));
    event.dataTransfer.effectAllowed = "move";
    console.log("onDragStart - Dragging component with metadata:", metadata);
  }, []);

  // ✅ Virtual scrolling: Only render visible items
  const rowVirtualizer = useVirtualizer({
    count: components.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated height of each component item (48px + 12px gap)
    overscan: 5, // Render 5 extra items above/below viewport
  });

  return (
    <aside className="w-64 bg-card border-r border-border shadow-lg flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">Components</h2>
        <p className="text-xs text-muted-foreground mt-1">{components.length} components</p>
      </div>
      <div ref={parentRef} className="flex-1 p-4 overflow-y-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const comp = components[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="pb-3">
                  <ComponentItem 
                    comp={comp} 
                    onDragStart={onDragStart} 
                    isDark={isDark}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

// ✅ Optimized: Memoize entire component
export default memo(ComponentPalette);