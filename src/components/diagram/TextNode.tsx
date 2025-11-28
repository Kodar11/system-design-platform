// src/components/diagram/TextNode.tsx
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { NodeProps } from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';

type TextNodeData = {
  label?: string;
  style?: React.CSSProperties;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

const TextNode = ({ data, selected, id }: NodeProps<TextNodeData>) => {
  const { updateNodeProperties, updateNode } = useDiagramStore();
  const [content, setContent] = useState(typeof data.label === 'string' ? data.label : '');
  const [isDark, setIsDark] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resizingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const parseSize = (value: unknown, fallback: number) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/px$/i, ''));
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  };

  const [localSize, setLocalSize] = useState<{ width: number; height: number }>(() => ({
    width: parseSize(data.style?.width, 150),
    height: parseSize(data.style?.height, 100),
  }));

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
    if (mql && (mql as MediaQueryList).addEventListener) {
      (mql as MediaQueryList).addEventListener('change', onChange);
    } else if (mql && (mql as unknown as { addListener?: (fn: () => void) => void }).addListener) {
      // older browsers
      (mql as unknown as { addListener: (fn: () => void) => void }).addListener(onChange);
    }
    // also observe class changes (in case theme toggles by adding/removing .dark)
    const observer = new MutationObserver(() => detect());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      if (mql && (mql as MediaQueryList).removeEventListener) {
        (mql as MediaQueryList).removeEventListener('change', onChange);
      } else if (mql && (mql as unknown as { removeListener?: (fn: () => void) => void }).removeListener) {
        (mql as unknown as { removeListener: (fn: () => void) => void }).removeListener(onChange);
      }
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

  // Keep localSize in sync if external data.style changes
  useEffect(() => {
    const w = parseSize(data.style?.width, 150);
    const h = parseSize(data.style?.height, 100);
    setLocalSize({ width: w, height: h });
  }, [data.style]);

  const startResizing = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    resizingRef.current = true;
    // try to capture the pointer on the target for robustness
    try {
      (e.target as Element)?.setPointerCapture?.(e.pointerId);
    } catch {
      // ignore if not supported
    }
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: localSize.width,
      height: localSize.height,
    };
    document.addEventListener('pointermove', onPointerMove as EventListener);
    document.addEventListener('pointerup', stopPointerResizing as EventListener);
  };

  const onPointerMove = (ev: PointerEvent) => {
    if (!resizingRef.current) return;
    ev.preventDefault();
    const dx = ev.clientX - startRef.current.x;
    const dy = ev.clientY - startRef.current.y;
    const minW = 80;
    const minH = 40;
    const newW = Math.max(minW, Math.round(startRef.current.width + dx));
    const newH = Math.max(minH, Math.round(startRef.current.height + dy));
    setLocalSize({ width: newW, height: newH });
    // live update to store for other logic (throttling not added for simplicity)
    // write size to top-level node properties so React Flow preserves it
    try {
      updateNode(id, {
        style: { ...(data.style || {}), width: newW, height: newH },
        width: newW,
        height: newH,
      });
    } catch {
      // fallback to updating data if updateNode isn't available
      updateNodeProperties(id, { style: { ...(data.style || {}), width: newW, height: newH } });
    }
  };
  const stopPointerResizing = () => {
    if (!resizingRef.current) return;
    resizingRef.current = false;
    document.removeEventListener('pointermove', onPointerMove as EventListener);
    document.removeEventListener('pointerup', stopPointerResizing as EventListener);
    // final write to ensure store is consistent; update top-level width/height too
    try {
      updateNode(id, {
        style: { ...(data.style || {}), width: localSize.width, height: localSize.height },
        width: localSize.width,
        height: localSize.height,
      });
    } catch {
      updateNodeProperties(id, { style: { ...(data.style || {}), width: localSize.width, height: localSize.height } });
    }
  };

  // cleanup listeners on unmount in case component is removed while dragging
  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', onPointerMove as EventListener);
      document.removeEventListener('pointerup', stopPointerResizing as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative p-2 rounded border-2 overflow-auto text-sm leading-relaxed`}
      style={{
        minWidth: 100,
        minHeight: 50,
        width: localSize.width,
        height: localSize.height,
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
        style={{
          minHeight: 24,
          color: isDark ? '#e6eef8' : '#0f172a',
          caretColor: isDark ? '#ffffff' : '#000000',
          width: '100%',
          height: '100%',
          outline: 'none',
        }}
        dangerouslySetInnerHTML={{ __html: (content || '').replace(/\n/g, '<br>') }}
      />

      {/* Resize handle (bottom-right) */}
      <div
        role="separator"
        onPointerDown={startResizing}
        onClick={(e) => e.stopPropagation()}
        title="Resize"
        style={{
          position: 'absolute',
          right: 6,
          bottom: 6,
          // slightly larger hit area for easier dragging
          width: 18,
          height: 18,
          borderRadius: 2,
          background: selected ? (isDark ? '#60a5fa' : '#3b82f6') : (isDark ? '#374151' : '#e5e7eb'),
          cursor: 'nwse-resize',
          zIndex: 30,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.06) inset',
          touchAction: 'none',
        }}
      />
    </div>
  );
};

export default TextNode;