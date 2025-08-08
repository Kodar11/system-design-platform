"use client";

import React from 'react';
import { useDiagramStore } from '@/store/diagramStore';

export const BottomBar = () => {
  const selectedNode = useDiagramStore(state => state.selectedNode);
  
  // Dummy functions for now
  const handleGroup = () => console.log('Group clicked');
  const handleUngroup = () => console.log('Ungroup clicked');

  return (
    <div className="bottom-bar p-4 bg-gray-200 flex justify-center items-center gap-4">
      {/* Connector Tools */}
      <div className="flex gap-2">
        <button className="p-2 rounded bg-gray-400 text-white">Solid Line</button>
        <button className="p-2 rounded bg-gray-400 text-white">Dashed Line</button>
      </div>

      {/* Shapes */}
      <div className="flex gap-2">
        <button className="p-2 rounded bg-gray-400 text-white">Rectangle</button>
        <button className="p-2 rounded bg-gray-400 text-white">Text Box</button>
      </div>
      
      {/* Grouping Tools */}
      {selectedNode && (
        <div className="flex gap-2">
          <button onClick={handleGroup} className="p-2 rounded bg-purple-500 text-white">Group</button>
          <button onClick={handleUngroup} className="p-2 rounded bg-purple-500 text-white">Ungroup</button>
        </div>
      )}
    </div>
  );
};
