// src/components/diagram/Editor.tsx
"use client";

import React, { useCallback, useRef, useState, MouseEvent as ReactMouseEvent, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  ReactFlowProvider,
  addEdge,
  useReactFlow,
  ConnectionLineType,
  Node,
  MiniMap,
  Edge,
} from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';
import ComponentNode from './ComponentNode';
import TextNode from './TextNode';
import { usePathname } from 'next/navigation';
import 'reactflow/dist/style.css';

const nodeTypes = {
  component: ComponentNode,
  text: TextNode,
};

const AlignmentGuides = ({ guides }: { guides: { vertical: number[]; horizontal: number[] } }) => {
  const { getViewport } = useReactFlow();
  const viewport = getViewport();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {guides.vertical.map((x, i) => (
        <div
          key={`v-${i}`}
          className="absolute top-0 bottom-0 w-0.5 bg-primary opacity-50"
          style={{
            left: `${(x - viewport.x) / viewport.zoom}px`,
          }}
        />
      ))}
      {guides.horizontal.map((y, i) => (
        <div
          key={`h-${i}`}
          className="absolute left-0 right-0 h-0.5 bg-primary opacity-50"
          style={{
            top: `${(y - viewport.y) / viewport.zoom}px`,
          }}
        />
      ))}
    </div>
  );
};

// FIXED: Simple debounce without complex generics
const debounce = (func: () => void, wait: number) => {
  let timeout: NodeJS.Timeout | null = null;
  const debounced = () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func();
      timeout = null;
    }, wait);
  };
  const flush = () => {
    if (timeout) {
      clearTimeout(timeout);
      func();
      timeout = null;
    }
  };
  return { debounced, flush };
};

export const Editor = () => {
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const reactFlowInstance = useReactFlow();
  const [guides, setGuides] = useState({ vertical: [] as number[], horizontal: [] as number[] });

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNode,
    activeTool,
    setActiveTool,
    setNodes,
    setEdges,
    currentEdgeConfig,
    toggleEdgeStyle,
  } = useDiagramStore();
  const { getNodes } = useReactFlow();

  const pathname = usePathname();

  // NEW: Determine if in problem-solving mode and extract ID
  const problemMatch = pathname.match(/^\/problems\/([^\/]+)(?:\/|$)/);
  const problemId = problemMatch ? problemMatch[1] : null;
  const isProblemSolveMode = !!problemId && !pathname.includes(`/result/`);
  const isFreeDesignMode = !problemId;

  // NEW: Auto-load from localStorage on mount (per-problem or global)
  useEffect(() => {
    if (!reactFlowInstance) return;

    let storageKey: string | null = null;
    if (isProblemSolveMode && problemId) {
      storageKey = `problemDraft_${problemId}`;
    } else if (isFreeDesignMode) {
      storageKey = 'freeDesignDraft';
    }

    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const flow = JSON.parse(saved);
          setNodes(flow.nodes ?? []);
          setEdges(flow.edges ?? []);
          reactFlowInstance.setViewport(flow.viewport ?? { x: 0, y: 0, zoom: 1 });
        } catch (e) {
          console.warn('Failed to load auto-saved diagram:', e);
        }
      }
    }
  }, [reactFlowInstance, isProblemSolveMode, isFreeDesignMode, problemId, setNodes, setEdges]);

  // NEW: Auto-save on state changes (debounced, per-problem or global)
  useEffect(() => {
    if (!reactFlowInstance) return;

    let storageKey: string | null = null;
    if (isProblemSolveMode && problemId) {
      storageKey = `problemDraft_${problemId}`;
    } else if (isFreeDesignMode) {
      storageKey = 'freeDesignDraft';
    }
    if (!storageKey) return;

    const saveFunc = () => {
      const flow = reactFlowInstance.toObject();
      localStorage.setItem(storageKey, JSON.stringify(flow));
    };

    const { debounced: debouncedSave, flush } = debounce(saveFunc, 1500);

    // Trigger on nodes or edges change
    debouncedSave();

    // Cleanup on unmount
    return () => {
      flush();
    };
  }, [nodes, edges, reactFlowInstance, isProblemSolveMode, isFreeDesignMode, problemId]);

  // NEW: Global keyboard shortcuts (scoped to editor, ignore inputs)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement | null;
    const activeTag = activeElement?.tagName;
    const isEditable = activeElement?.contentEditable === 'true';
    if (['INPUT', 'TEXTAREA'].includes(activeTag ?? '') || isEditable) return;

    const temporal = useDiagramStore.temporal.getState();

    if (e.key === 'Delete' || e.key === 'Backspace') {
      useDiagramStore.getState().deleteSelectedNodes();
      e.preventDefault();
    } else if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        temporal.undo();
        e.preventDefault();
      } else if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
        temporal.redo();
        e.preventDefault();
      } else if (e.key.toLowerCase() === 'd') {
        useDiagramStore.getState().duplicateSelectedNodes();
        e.preventDefault();
      }
    }
  }, []);

  useEffect(() => {
    const wrapper = reactFlowWrapper.current;
    if (wrapper) {
      wrapper.addEventListener('keydown', handleKeyDown);
      return () => wrapper.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const rawData = event.dataTransfer.getData('application/reactflow');
      const { nodeType, originalType, componentId, componentName, metadata, iconUrl } = JSON.parse(rawData);

      const position = reactFlowInstance.project({
        x: event.clientX - (reactFlowBounds?.left || 0),
        y: event.clientY - (reactFlowBounds?.top || 0),
      });

      if (nodeType && position) {
        const newNode: Node = {
          id: Date.now().toString(),
          type: nodeType,
          position,
          data: {
            originalType,
            componentId: componentId,
            label: componentName,
            iconUrl: iconUrl || '/assets/icons/default.svg',
            metadata
          },
        };
        addNode(newNode);
      }
    },
    [reactFlowInstance, addNode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onPaneClick = useCallback((event: ReactMouseEvent<Element>) => {
    if (activeTool === 'text') {
      const bounds = reactFlowWrapper.current!.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode: Node = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'text',
        position,
        data: { label: 'Click to edit annotation' },
        style: { width: 150, height: 100 },
      };
      addNode(newNode);
      setActiveTool('none');
    }
  }, [activeTool, reactFlowInstance, addNode, setActiveTool]);

  // Custom connection validator to allow connections between any different nodes
  const isValidConnectionCustom = useCallback((connection: any) => {
    return connection.source !== connection.target;
  }, []);

  const onNodeDrag = useCallback((event: any, node: Node) => {
    const allNodes = getNodes();
    const vertical: number[] = [];
    const horizontal: number[] = [];
    const tolerance = 5;

    // Handle positions for dragged node (focusing on handle locations)
    const nodeWidth = node.width || 120;
    const nodeHeight = node.height || 60;
    const draggedHandles = {
      leftX: node.position.x,
      rightX: node.position.x + nodeWidth,
      topY: node.position.y,
      bottomY: node.position.y + nodeHeight,
    };

    allNodes.forEach((other: Node) => {
      if (other.id === node.id) return;

      const otherWidth = other.width || 120;
      const otherHeight = other.height || 60;
      const otherHandles = {
        leftX: other.position.x,
        rightX: other.position.x + otherWidth,
        topY: other.position.y,
        bottomY: other.position.y + otherHeight,
      };

      // Vertical alignments
      if (Math.abs(draggedHandles.leftX - otherHandles.leftX) < tolerance) vertical.push(draggedHandles.leftX);
      if (Math.abs(draggedHandles.rightX - otherHandles.rightX) < tolerance) vertical.push(draggedHandles.rightX);
      if (Math.abs(draggedHandles.leftX - otherHandles.rightX) < tolerance) vertical.push(draggedHandles.leftX);
      if (Math.abs(draggedHandles.rightX - otherHandles.leftX) < tolerance) vertical.push(draggedHandles.rightX);

      // Horizontal alignments
      if (Math.abs(draggedHandles.topY - otherHandles.topY) < tolerance) horizontal.push(draggedHandles.topY);
      if (Math.abs(draggedHandles.bottomY - otherHandles.bottomY) < tolerance) horizontal.push(draggedHandles.bottomY);
      if (Math.abs(draggedHandles.topY - otherHandles.bottomY) < tolerance) horizontal.push(draggedHandles.topY);
      if (Math.abs(draggedHandles.bottomY - otherHandles.topY) < tolerance) horizontal.push(draggedHandles.bottomY);
    });

    setGuides({ vertical: [...new Set(vertical)], horizontal: [...new Set(horizontal)] });
  }, [getNodes]);

  const onNodeDragStop = useCallback(() => {
    setGuides({ vertical: [], horizontal: [] });
  }, []);

  // NEW: Toggle dashed on edge click
  const onEdgeClick = useCallback((event: ReactMouseEvent, edge: Edge) => {
    toggleEdgeStyle(edge.id);
  }, [toggleEdgeStyle]);

  return (
    <div className="reactflow-wrapper bg-background" ref={reactFlowWrapper} style={{ position: 'relative', height: 'calc(100vh - 128px)', width: '100%' }} tabIndex={0}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnectionCustom}
        connectionLineType={currentEdgeConfig.type}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onPaneClick={onPaneClick}
        onNodeClick={(event, node) => setSelectedNode(node)}
        onEdgeClick={onEdgeClick} // NEW: Enable edge click to toggle dashed
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        disableKeyboardA11y={true}
        snapToGrid={true}
        snapGrid={[15, 15]}
      >
        <Controls />
        <Background />
        <MiniMap pannable zoomable style={{ bottom: 12, right: 12 }} nodeStrokeWidth={4} />
      </ReactFlow>
      <AlignmentGuides guides={guides} />
    </div>
  );
};