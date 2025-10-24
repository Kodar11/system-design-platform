// src/components/diagram/BottomBar.tsx
"use client";

import React from 'react';
import { useDiagramStore } from '@/store/diagramStore';
import { ConnectionLineType } from 'reactflow';

export const BottomBar = () => {
  const {
    groupSelectedNodes,
    ungroupSelectedNodes,
    setActiveTool,
    setCurrentEdgeConfig,
    currentEdgeConfig,
  } = useDiagramStore();

  const toggleDashed = () => {
    const isDashed = !!currentEdgeConfig.style.strokeDasharray;
    setCurrentEdgeConfig({
      ...currentEdgeConfig,
      style: isDashed ? {} : { strokeDasharray: '5, 5' },
    });
  };

  return (
    <div className="bottom-bar p-4 bg-gray-200 flex justify-center items-center gap-4">
      {/* Dashed Toggle (for new edges) */}
      <div className="flex gap-2">
        <button 
          onClick={toggleDashed} 
          className={`p-2 rounded ${currentEdgeConfig.style.strokeDasharray ? 'bg-red-500' : 'bg-gray-400'} text-white`}
        >
          {currentEdgeConfig.style.strokeDasharray ? 'Solid' : 'Dashed'}
        </button>
      </div>

      {/* Text */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTool('text')} className="p-2 rounded bg-gray-400 text-white">Text</button>
      </div>
      
      {/* Grouping Tools */}
      <div className="flex gap-2">
        <button onClick={groupSelectedNodes} className="p-2 rounded bg-purple-500 text-white">Group</button>
        <button onClick={ungroupSelectedNodes} className="p-2 rounded bg-purple-500 text-white">Ungroup</button>
      </div>
    </div>
  );
};