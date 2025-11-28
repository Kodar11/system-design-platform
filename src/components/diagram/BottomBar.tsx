// src/components/diagram/BottomBar.tsx
"use client";

import React, { useCallback } from 'react';
import {  useState } from 'react';
import { useDiagramStore } from '@/store/diagramStore';
import { useReactFlow } from 'reactflow';

import { exportJSON, exportPNG } from './exportUtils';
import FixedAboveMenu from './FixedAboveMenu';
// Undo/Redo will be rendered in BottomBar center for better layout

export const BottomBar = () => {
  const reactFlowInstance = useReactFlow();
  const [centerMenuOpen, setCenterMenuOpen] = useState(false);
  const { 
    groupSelectedNodes,
    ungroupSelectedNodes, 
    setActiveTool,
    setCurrentEdgeConfig,
    currentEdgeConfig,
    setNodes,
    setEdges,
    nodes,
  } = useDiagramStore();

  const centerButtonRef = React.useRef<HTMLButtonElement | null>(null);


  

  const toggleDashed = () => {
    const isDashed = !!currentEdgeConfig.style.strokeDasharray;
    setCurrentEdgeConfig({
      ...currentEdgeConfig,
      style: isDashed ? {} : { strokeDasharray: '5, 5' },
    });
  };



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

    // (removed unused problemId retrieval — not needed in this toolbar)

  return (
    <div className="bottom-bar py-3 px-4 bg-card border-t border-border shadow-xl">
      <div className="max-w-6xl mx-auto">
        {/* Main Toolbar: left / center / right */}
        <div className="flex items-center justify-between">
          

          {/* Center Section - Drawing Tools */}
          <div className="flex items-center justify-center w-full">
            <div className="relative flex items-center gap-2">
              {/* Undo / Redo placed center with other canvas controls */}
              {(() => {
                const temporal = useDiagramStore.temporal.getState();
                const past = temporal.pastStates?.length ?? 0;
                const future = temporal.futureStates?.length ?? 0;
                const selectedCount = nodes.filter((n) => n.selected).length;
                return (
                  <>
                    

                    

                    <button
                      onClick={() => temporal.undo && temporal.undo()}
                      disabled={past === 0}
                      title="Undo (Ctrl+Z)"
                      aria-label="Undo (Ctrl+Z)"
                      className="px-3 py-2 rounded-lg bg-muted text-foreground hover:bg-accent disabled:opacity-50 transition-all duration-150"
                    >
                      ⤺
                    </button>
                    <button
                      onClick={() => temporal.redo && temporal.redo()}
                      disabled={future === 0}
                      title="Redo (Ctrl+Y)"
                      aria-label="Redo (Ctrl+Y)"
                      className="px-3 py-2 rounded-lg bg-muted text-foreground hover:bg-accent disabled:opacity-50 transition-all duration-150"
                    >
                      ⤼
                    </button>

                    

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

                    {/* Group / Ungroup buttons */}
                    <button
                      onClick={() => groupSelectedNodes && groupSelectedNodes()}
                      disabled={selectedCount < 2}
                      title="Group selected nodes"
                      className="px-3 py-2 rounded-lg bg-muted text-foreground hover:bg-accent disabled:opacity-50 transition-all duration-150"
                    >
                      Group
                    </button>
                    <button
                      onClick={() => ungroupSelectedNodes && ungroupSelectedNodes()}
                      disabled={selectedCount === 0}
                      title="Ungroup selected nodes"
                      className="px-3 py-2 rounded-lg bg-muted text-foreground hover:bg-accent disabled:opacity-50 transition-all duration-150"
                    >
                      Ungroup
                    </button>

                    {/* Center Import/Export menu button (rectangular) */}
                    <div>
                      <button
                        ref={centerButtonRef}
                        onClick={() => setCenterMenuOpen((s) => !s)}
                        className="px-4 py-2 rounded-md border border-border bg-card/80 text-foreground hover:bg-accent transition-all"
                        title="Import / Export"
                        aria-haspopup="true"
                        aria-expanded={centerMenuOpen}
                      >
                        Import / Export
                      </button>

                      {/* Menu appears above the button using fixed positioning computed from the button rect */}
                      {centerMenuOpen && (
                        <FixedAboveMenu
                          anchorRef={centerButtonRef}
                          onClose={() => setCenterMenuOpen(false)}
                          onExportJSON={() => { exportJSON(reactFlowInstance); }}
                          onExportPNG={() => { exportPNG(reactFlowInstance); }}
                          onImport={handleImport}
                        />
                      )}
                    </div>

                    
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};