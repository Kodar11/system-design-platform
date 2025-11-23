// src/components/diagram/TextNode.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { NodeProps } from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';

const TextNode = ({ data, selected, id }: NodeProps) => {
  const { updateNodeProperties } = useDiagramStore();
  const [content, setContent] = useState(data.label || '');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setContent(data.label || '');
  }, [data.label]);

  // detect dark mode reliably (class strategy or prefers-color-scheme)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const detect = () => {
      const doc = document.documentElement;
      const viaClass = doc.classList && doc.classList.contains('dark');
      const viaMedia = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(!!(viaClass || viaMedia));
    };
    detect();
    const mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => detect();
    mql && mql.addEventListener && mql.addEventListener('change', onChange);
    // also observe class changes (in case theme toggles by adding/removing .dark)
    const observer = new MutationObserver(() => detect());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      mql && mql.removeEventListener && mql.removeEventListener('change', onChange);
      observer.disconnect();
    };
  }, []);

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
      className={`p-2 rounded border-2 overflow-auto text-sm leading-relaxed`}
      style={{
        minWidth: 100,
        minHeight: 50,
        width: data.style?.width || 150,
        height: data.style?.height || 100,
        outline: 'none',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        // explicit colors to ensure readability in both themes
        backgroundColor: isDark ? (selected ? 'rgba(3,37,65,0.24)' : '#071026') : (selected ? '#eff6ff' : '#ffffff'),
        borderColor: selected ? (isDark ? '#60a5fa' : '#3b82f6') : (isDark ? '#374151' : '#d1d5db'),
        color: isDark ? '#e6eef8' : '#0f172a',
      }}
    >
      <div
        contentEditable={true}
        suppressContentEditableWarning={true}
        onBlur={handleBlur}
        onInput={handleInput}
        onKeyDown={(e) => e.stopPropagation()}
        tabIndex={0}
        aria-label="Text node editor"
        style={{ minHeight: 24, color: isDark ? '#e6eef8' : '#0f172a', caretColor: isDark ? '#ffffff' : '#000000' }}
        dangerouslySetInnerHTML={{ __html: (content || '').replace(/\n/g, '<br>') }}
      />
    </div>
  );
};

export default TextNode;