// src/components/diagram/FlowProvider.tsx
"use client";

import React, { PropsWithChildren } from 'react';
import { ReactFlowProvider } from 'reactflow';

export default function FlowProvider({ children }: PropsWithChildren) {
  return (
    // FIX: Wrap the children with the ReactFlowProvider
    <ReactFlowProvider>
      {children}
    </ReactFlowProvider>
  );
}