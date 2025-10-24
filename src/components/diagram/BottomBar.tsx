// src/components/diagram/BottomBar.tsx
"use client";

import React, { useCallback } from 'react';
import { useDiagramStore } from '@/store/diagramStore';
import { useReactFlow } from 'reactflow';
import { toPng } from 'html-to-image'; // NEW: Import from html-to-image (install via: npm install html-to-image)
import { ConnectionLineType } from 'reactflow';

export const BottomBar = () => {
  const reactFlowInstance = useReactFlow();
  const { 
    groupSelectedNodes,
    ungroupSelectedNodes,
    setActiveTool,
    setCurrentEdgeConfig,
    currentEdgeConfig,
    setNodes,
    setEdges 
  } = useDiagramStore();

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
        backgroundColor: '#ffffff', // White background
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
          alert('Invalid JSON file!');
        }
      };
      reader.readAsText(file);
      // Reset input value to allow re-importing same file
      event.target.value = '';
    }
  }, [reactFlowInstance, setNodes, setEdges]);

  return (
    <div className="bottom-bar p-4 bg-gray-200 flex justify-center items-center gap-4">
      {/* Export/Import Tools */}
      <div className="flex gap-2">
        <button 
          onClick={handleExportJSON} 
          className="p-2 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
          title="Export Diagram as JSON"
        >
          Export JSON
        </button>
        <button 
          onClick={handleExportPNG} 
          className="p-2 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
          title="Export Diagram as PNG"
        >
          Export PNG
        </button>

        <label className="p-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer" title="Import Diagram from JSON">
          Import JSON
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      {/* Dashed Toggle (for new edges) */}
      <div className="flex gap-2">
        <button 
          onClick={toggleDashed} 
          className={`p-2 rounded ${currentEdgeConfig.style.strokeDasharray ? 'bg-red-500' : 'bg-gray-400'} text-white`}
          title="Toggle Edge Style (Dashed/Solid for new connections)"
        >
          {currentEdgeConfig.style.strokeDasharray ? 'Solid' : 'Dashed'}
        </button>
      </div>

      {/* Text Tool */}
      <div className="flex gap-2">
        <button 
          onClick={() => setActiveTool('text')} 
          className="p-2 rounded bg-gray-400 text-white hover:bg-gray-500 transition-colors"
          title="Add Text Annotation"
        >
          Text
        </button>
      </div>
      
      {/* Grouping Tools */}
      <div className="flex gap-2">
        <button 
          onClick={groupSelectedNodes} 
          className="p-2 rounded bg-purple-500 text-white hover:bg-purple-600 transition-colors"
          title="Group Selected Nodes"
        >
          Group
        </button>
        <button 
          onClick={ungroupSelectedNodes} 
          className="p-2 rounded bg-purple-500 text-white hover:bg-purple-600 transition-colors"
          title="Ungroup Selected Nodes"
        >
          Ungroup
        </button>
      </div>
    </div>
  );
};