// src/components/diagram/CompactNode.tsx
"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const CompactNode = ({ data, selected }: NodeProps) => {
  return (
    <div 
      className={`p-1 rounded shadow-sm border-2 flex flex-col items-center justify-center ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`} 
      style={{ minWidth: 60, minHeight: 40 }}
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
      
      {/* Content - Compact */}
      <div className="flex flex-col items-center">
        <img src={data.iconUrl || '/assets/icons/default.svg'} alt={data.label} className="w-5 h-5 mb-0.5" />
        <span className="text-xs font-medium text-gray-800 text-center break-words max-w-[50px]">{data.label}</span>
      </div>

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

export default CompactNode;