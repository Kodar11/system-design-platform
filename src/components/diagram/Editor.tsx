"use client";

import React, { useCallback, useRef, MouseEvent as ReactMouseEvent } from 'react';
import ReactFlow, {
  Controls,
  Background,
  ReactFlowProvider,
  addEdge,
  useReactFlow,
  ConnectionLineType,
} from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';
import { Node } from 'reactflow';
import  Lasso  from './Lasso';
import  Eraser  from './Eraser';    
import  RectangleTool  from './RectangleTool';
import ComponentNode from './ComponentNode';
import CompactNode from './CompactNode';
import TextNode from './TextNode';
import 'reactflow/dist/style.css';

const nodeTypes = {
  component: ComponentNode,
  compact: CompactNode,
  text: TextNode,
};

export const Editor = () => {
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const reactFlowInstance = useReactFlow();

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

  return (
    <div className="reactflow-wrapper" style={{ height: '100vh', width: '100%' }} ref={reactFlowWrapper}>
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
        nodeTypes={nodeTypes}
        fitView
        disableKeyboardA11y={true}
      >
        <Controls />
        <Background />
        {activeTool === 'lasso' && <Lasso partial={true} />}
        {activeTool === 'eraser' && <Eraser />}
        {activeTool === 'rectangle' && <RectangleTool />}
      </ReactFlow>
    </div>
  );
};