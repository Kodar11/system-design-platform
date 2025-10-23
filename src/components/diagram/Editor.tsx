"use client";

import React, { useCallback, useRef, useState, MouseEvent as ReactMouseEvent } from 'react';
import ReactFlow, {
  Controls,
  Background,
  ReactFlowProvider,
  addEdge,
  useReactFlow,
  ConnectionLineType,
  Node,
} from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';
import  Lasso  from './Lasso';
import  Eraser  from './Eraser';    
import  RectangleTool  from './RectangleTool';
import ComponentNode from './ComponentNode';
import TextNode from './TextNode';
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
          className="absolute top-0 bottom-0 w-0.5 bg-blue-400 opacity-50"
          style={{
            left: `${(x - viewport.x) / viewport.zoom}px`,
          }}
        />
      ))}
      {guides.horizontal.map((y, i) => (
        <div
          key={`h-${i}`}
          className="absolute left-0 right-0 h-0.5 bg-blue-400 opacity-50"
          style={{
            top: `${(y - viewport.y) / viewport.zoom}px`,
          }}
        />
      ))}
    </div>
  );
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
  } = useDiagramStore();
  const { getNodes } = useReactFlow();

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const rawData = event.dataTransfer.getData('application/reactflow');
      const { nodeType, originalType, componentId, componentName, metadata, iconUrl } = JSON.parse(rawData);

      console.log("onDrop - Raw Data:", rawData);
      console.log("onDrop - Parsed Data:", { nodeType, originalType, componentId, componentName, metadata, iconUrl });

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
      leftX: node.position.x,  // Left handle x
      rightX: node.position.x + nodeWidth,  // Right handle x
      topY: node.position.y,  // Top handle y
      bottomY: node.position.y + nodeHeight,  // Bottom handle y
      // Center handles for left/right y and top/bottom x, but since handles are at edges, focus on edges
    };

    allNodes.forEach((other: Node) => {
      if (other.id === node.id) return;

      const otherWidth = other.width || 120;
      const otherHeight = other.height || 60;
      const otherHandles = {
        leftX: other.position.x,  // Left handle x
        rightX: other.position.x + otherWidth,  // Right handle x
        topY: other.position.y,  // Top handle y
        bottomY: other.position.y + otherHeight,  // Bottom handle y
      };

      // Vertical alignments: Align left-to-left, right-to-right, left-to-right, right-to-left handles
      if (Math.abs(draggedHandles.leftX - otherHandles.leftX) < tolerance) vertical.push(draggedHandles.leftX);
      if (Math.abs(draggedHandles.rightX - otherHandles.rightX) < tolerance) vertical.push(draggedHandles.rightX);
      if (Math.abs(draggedHandles.leftX - otherHandles.rightX) < tolerance) vertical.push(draggedHandles.leftX);
      if (Math.abs(draggedHandles.rightX - otherHandles.leftX) < tolerance) vertical.push(draggedHandles.rightX);

      // Horizontal alignments: Align top-to-top, bottom-to-bottom, top-to-bottom, bottom-to-top handles
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

  return (
    <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnectionCustom}
        connectionLineType={ConnectionLineType.SmoothStep}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onPaneClick={onPaneClick}
        onNodeClick={(event, node) => setSelectedNode(node)}
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
        {activeTool === 'lasso' && <Lasso partial={true} />}
        {activeTool === 'eraser' && <Eraser />}
        {activeTool === 'rectangle' && <RectangleTool />}
      </ReactFlow>
      <AlignmentGuides guides={guides} />
    </div>
  );
};