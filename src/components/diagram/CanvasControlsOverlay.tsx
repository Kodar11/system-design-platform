"use client";

import React from 'react';
import { useDiagramStore } from '@/store/diagramStore';

export const CanvasControlsOverlay: React.FC = () => {
  // Access the temporal sub-store directly (pattern used elsewhere in the repo)
  const temporalState = useDiagramStore.temporal.getState();
  const undo = temporalState.undo;
  const redo = temporalState.redo;

  // Fallback to access past/future length
  const past = temporalState.pastStates?.length ?? 0;
  const future = temporalState.futureStates?.length ?? 0;

  return (
    <div aria-hidden={false} className="fixed left-1/2 bottom-24 transform -translate-x-1/2 z-50">
      <div className="flex flex-row gap-2 bg-card/95 dark:bg-card/95 p-2 rounded-lg border border-border shadow-lg">
        <button
          onClick={() => undo && undo()}
          disabled={past === 0}
          aria-label="Undo (Ctrl+Z)"
          title="Undo (Ctrl+Z)"
          className="p-2 rounded bg-muted hover:bg-accent disabled:opacity-50"
        >
          ⤺
        </button>
        <button
          onClick={() => redo && redo()}
          disabled={future === 0}
          aria-label="Redo (Ctrl+Y)"
          title="Redo (Ctrl+Y)"
          className="p-2 rounded bg-muted hover:bg-accent disabled:opacity-50"
        >
          ⤼
        </button>
      </div>
    </div>
  );
};

export default CanvasControlsOverlay;
