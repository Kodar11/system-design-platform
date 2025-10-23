// src/components/diagram/TextNode.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { NodeProps } from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';

const TextNode = ({ data, selected, id }: NodeProps) => {
  const { updateNodeProperties } = useDiagramStore();
  const [content, setContent] = useState(data.label || '');

  useEffect(() => {
    setContent(data.label || '');
  }, [data.label]);

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.innerText.trim();
    if (newText !== data.label) {
      updateNodeProperties(id, { label: newText || 'Untitled note' });
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    setContent(e.currentTarget.innerText);
  };

  return (
    <div 
      className={`p-2 rounded border-2 overflow-auto ${selected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-300 bg-white'}`} 
      style={{ 
        minWidth: 100, 
        minHeight: 50, 
        width: data.style?.width || 150,
        height: data.style?.height || 100,
        outline: 'none',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        cursor: selected ? 'text' : 'default'
      }}
    >
      <div
        contentEditable={selected}
        suppressContentEditableWarning={true}
        onBlur={handleBlur}
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br>') }}
      />
    </div>
  );
};

export default TextNode;