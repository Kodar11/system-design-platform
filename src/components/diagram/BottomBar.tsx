"use client";

import React from 'react';
import { useDiagramStore } from '@/store/diagramStore';

export const BottomBar = () => {
  const selectedNode = useDiagramStore(state => state.selectedNode);
  const groupSelectedNodes = useDiagramStore(state => state.groupSelectedNodes);
  const ungroupSelectedNodes = useDiagramStore(state => state.ungroupSelectedNodes);
  const setActiveTool = useDiagramStore(state => state.setActiveTool);
  const setCurrentEdgeConfig = useDiagramStore(state => state.setCurrentEdgeConfig);

  const setSolidLine = () => {
    setCurrentEdgeConfig({ type: 'default', animated: false, style: {} });
  };

  const setDashedLine = () => {
    setCurrentEdgeConfig({ type: 'default', animated: false, style: { strokeDasharray: '5, 5' } });
  };

  return (
    <div className="bottom-bar p-4 bg-gray-200 flex justify-center items-center gap-4">
      {/* Connector Tools */}
      <div className="flex gap-2">
        <button onClick={setSolidLine} className="p-2 rounded bg-gray-400 text-white">Solid Line</button>
        <button onClick={setDashedLine} className="p-2 rounded bg-gray-400 text-white">Dashed Line</button>
      </div>

      {/* Shapes */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTool('rectangle')} className="p-2 rounded bg-gray-400 text-white">Rectangle</button>
        <button onClick={() => setActiveTool('text')} className="p-2 rounded bg-gray-400 text-white">Text Box</button>
      </div>
      
      {/* Grouping Tools */}
      <div className="flex gap-2">
        <button onClick={groupSelectedNodes} className="p-2 rounded bg-purple-500 text-white">Group</button>
        <button onClick={ungroupSelectedNodes} className="p-2 rounded bg-purple-500 text-white">Ungroup</button>
      </div>
      
      {/* New Tools */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTool('lasso')} className="p-2 rounded bg-green-500 text-white">Lasso</button>
        <button onClick={() => setActiveTool('eraser')} className="p-2 rounded bg-red-500 text-white">Eraser</button>
        <button onClick={() => setActiveTool('none')} className="p-2 rounded bg-blue-500 text-white">None</button>
      </div>
    </div>
  );
};