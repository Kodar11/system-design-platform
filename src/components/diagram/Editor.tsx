"use client";

import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  ReactFlowProvider,
  addEdge,
  useReactFlow
} from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';
import  Lasso  from './Lasso';
import  Eraser  from './Eraser';    
import  RectangleTool  from './RectangleTool';
import 'reactflow/dist/style.css';

const nodeTypes = {
  // Add your custom node types here
  // group: GroupNode, // Assume you have a GroupNode component or use default
  // For eraser, you may need to use custom node types for erasable nodes
  // For rectangle, 'rectangle': RectangleNode,
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
  } = useDiagramStore();

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const rawData = event.dataTransfer.getData('application/reactflow');
      const { nodeType, componentId, componentName, metadata } = JSON.parse(rawData);

      console.log("onDrop - Raw Data:", rawData);
      console.log("onDrop - Parsed Data:", { nodeType, componentId, componentName, metadata });


      const position = reactFlowInstance.project({
        x: event.clientX - (reactFlowBounds?.left || 0),
        y: event.clientY - (reactFlowBounds?.top || 0),
      });

      if (nodeType && position) {
        const newNode = {
          id: Date.now().toString(),
          type: nodeType,
          position,
          data: {
            componentId: componentId,
            label: componentName, // FIX: Use the component's name as the label
            iconUrl: `/assets/icons/${nodeType}.svg`,
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

  return (
    <div className="reactflow-wrapper" style={{ height: '100vh', width: '100%' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
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