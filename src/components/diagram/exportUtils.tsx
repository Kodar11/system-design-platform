"use client";

import { toPng } from 'html-to-image';
import type { ReactFlowInstance } from 'reactflow';

export const exportJSON = (reactFlowInstance: ReactFlowInstance | null | undefined, filename = 'diagram.json'): void => {
  if (!reactFlowInstance) return;
  const flow = reactFlowInstance.toObject();
  const jsonString = JSON.stringify(flow, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportPNG = async (reactFlowInstance: ReactFlowInstance | null | undefined): Promise<void> => {
  if (!reactFlowInstance) return;
  const element = document.querySelector('.react-flow__viewport') as HTMLElement | null;
  if (!element) return;

  // determine dark mode for background
  const theme = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const isDark = theme === 'dark';

  try {
    reactFlowInstance.fitView();
    await new Promise((r) => setTimeout(r, 300));

    const dataUrl = await toPng(element, {
      filter: (node: Element) => {
        const classList = node.classList;
        return !classList?.contains('react-flow__minimap') &&
               !classList?.contains('react-flow__controls') &&
               !classList?.contains('react-flow__attribution') &&
               !classList?.contains('bottom-bar') &&
               !classList?.contains('top-bar');
      },
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      pixelRatio: 2,
      width: element.scrollWidth,
      height: element.scrollHeight,
    });

    const link = document.createElement('a');
    link.download = 'diagram.png';
    link.href = dataUrl;
    link.click();
  } catch (error) {
    // keep original behavior: log and alert
    console.error('PNG export error:', error);
    alert(`PNG export failed: ${(error as Error).message}`);
  }
};
