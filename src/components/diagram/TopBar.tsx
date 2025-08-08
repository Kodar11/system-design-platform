"use client";

import React from 'react';
import { useDiagramStore } from '@/store/diagramStore';
import { useReactFlow } from 'reactflow';

export const TopBar = () => {
  // Get actions from the Zustand store
  const { nodes, edges } = useDiagramStore();
  const reactFlowInstance = useReactFlow();

  const handleSave = () => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      console.log('Saved flow:', flow);
      // In a real app, you would send this to your backend via a Server Action
      // saveDesign({ diagramData: flow });
      alert('Diagram state saved to console!');
    }
  };

  const handleExport = () => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      const jsonString = JSON.stringify(flow, null, 2);
      // Create a Blob to download the JSON file
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagram.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };
  
  const handleFitView = () => {
    reactFlowInstance?.fitView();
  };
  
  // Placeholder for undo/redo logic
  const handleUndo = () => console.log('Undo clicked');
  const handleRedo = () => console.log('Redo clicked');
  
  return (
    <div className="top-bar p-4 bg-gray-200 flex justify-between items-center">
      <div className="flex gap-2">
        <button onClick={handleSave} className="p-2 rounded bg-blue-500 text-white">Save</button>
        <button onClick={handleExport} className="p-2 rounded bg-green-500 text-white">Export</button>
      </div>
      <input type="text" placeholder="Diagram Title" className="p-2 rounded" />
      <div className="flex gap-2">
        <button onClick={handleUndo} className="p-2 rounded bg-gray-400 text-white">Undo</button>
        <button onClick={handleRedo} className="p-2 rounded bg-gray-400 text-white">Redo</button>
        <button onClick={handleFitView} className="p-2 rounded bg-gray-400 text-white">Fit View</button>
      </div>
    </div>
  );
};
