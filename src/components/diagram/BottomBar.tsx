// src/components/diagram/BottomBar.tsx
"use client";

import React, { useCallback } from 'react';
import { useDiagramStore } from '@/store/diagramStore';
import { useReactFlow } from 'reactflow';
import { useThemeStore } from '@/store/themeStore';
import { toPng } from 'html-to-image'; // NEW: Import from html-to-image (install via: npm install html-to-image)

export const BottomBar = () => {
  const reactFlowInstance = useReactFlow();
  const { theme } = useThemeStore();
  const { 
    groupSelectedNodes,
    ungroupSelectedNodes,
    setActiveTool,
    setCurrentEdgeConfig,
    currentEdgeConfig,
    setNodes,
    setEdges 
  } = useDiagramStore();

  // Determine if we're in dark mode
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleDashed = () => {
    const isDashed = !!currentEdgeConfig.style.strokeDasharray;
    setCurrentEdgeConfig({
      ...currentEdgeConfig,
      style: isDashed ? {} : { strokeDasharray: '5, 5' },
    });
  };

  // UPDATED: Export functions using html-to-image for compatibility across React Flow versions
  const handleExportJSON = useCallback(() => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      const jsonString = JSON.stringify(flow, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagram.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [reactFlowInstance]);

  const handleExportPNG = useCallback(async () => {
    const element = document.querySelector('.react-flow__viewport') as HTMLElement; // FIXED: Target viewport for edges
    if (!element || !reactFlowInstance) {
      alert('Export failed: React Flow viewport not found.');
      return;
    }

    try {
      // Fit view to capture the full diagram
      reactFlowInstance.fitView();
      await new Promise(resolve => setTimeout(resolve, 300)); // Brief delay for fitView animation

      const dataUrl = await toPng(element, {
        filter: (node: Element) => {
          // Exclude only non-diagram UI; include edges and nodes
          const classList = node.classList;
          return !classList?.contains('react-flow__minimap') &&
                 !classList?.contains('react-flow__controls') &&
                 !classList?.contains('react-flow__attribution') &&
                 !classList?.contains('bottom-bar') &&
                 !classList?.contains('top-bar');
        },
        backgroundColor: isDark ? '#1a1a1a' : '#ffffff', // Theme-aware background
        pixelRatio: 2, // Higher resolution
        width: element.scrollWidth, // FIXED: Explicit full width
        height: element.scrollHeight, // FIXED: Explicit full height
        style: { 
          transform: 'none !important', // FIXED: Flatten transforms for edges
          width: `${element.scrollWidth}px !important`,
          height: `${element.scrollHeight}px !important`,
        },
      });

      const link = document.createElement('a');
      link.download = 'diagram.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('PNG export error:', error);
      alert(`PNG export failed: ${(error as Error).message}`);
    }
  }, [reactFlowInstance]);


  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && reactFlowInstance) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const flow = JSON.parse(e.target?.result as string);
          setNodes(flow.nodes ?? []);
          setEdges(flow.edges ?? []);
          reactFlowInstance.setViewport(flow.viewport ?? { x: 0, y: 0, zoom: 1 });
          alert('Diagram imported successfully!');
        } catch (error) {
          alert(`Invalid JSON file! ${error}`);
        }
      };
      reader.readAsText(file);
      // Reset input value to allow re-importing same file
      event.target.value = '';
    }
  }, [reactFlowInstance, setNodes, setEdges]);

  return (
    <div className="bottom-bar p-6 bg-card border-t-2 border-border shadow-xl">
      <div className="max-w-6xl mx-auto">
        {/* Main Toolbar */}
        <div className="flex items-center justify-center">
          {/* Left Section - Export/Import */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportJSON} 
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm border border-primary/20"
                title="Export Diagram as JSON"
              >
                Export JSON
              </button>
              <button 
                onClick={handleExportPNG} 
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm border border-primary/20"
                title="Export Diagram as PNG"
              >
                Export PNG
              </button>
              <label className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm cursor-pointer border border-primary/20" title="Import Diagram from JSON">
                Import JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Center Section - Drawing Tools */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleDashed} 
                className={`px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm border ${
                  currentEdgeConfig.style.strokeDasharray 
                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive/30' 
                    : 'bg-muted text-foreground hover:bg-accent hover:text-accent-foreground border-border/50'
                }`}
                title="Toggle Edge Style (Dashed/Solid for new connections)"
              >
                {currentEdgeConfig.style.strokeDasharray ? 'Solid' : 'Dashed'}
              </button>
              <button 
                onClick={() => setActiveTool('text')} 
                className="px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm border border-border/50"
                title="Add Text Annotation"
              >
                Text
              </button>
            </div>
          </div>

          {/* Right Section - Grouping Tools */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button 
                onClick={groupSelectedNodes} 
                className="px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm border border-accent/30"
                title="Group Selected Nodes"
              >
                Group
              </button>
              <button 
                onClick={ungroupSelectedNodes} 
                className="px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm border border-accent/30"
                title="Ungroup Selected Nodes"
              >
                Ungroup
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};