// src/components/diagram/EditorWrapper.tsx
"use client";

import dynamic from 'next/dynamic';
import EditorSkeleton from './EditorSkeleton';

// Lazy load heavy Editor component (ReactFlow doesn't work with SSR)
const Editor = dynamic(() => import('./Editor').then(mod => ({ default: mod.Editor })), {
  ssr: false,
  loading: () => <EditorSkeleton />
});

export default Editor;
