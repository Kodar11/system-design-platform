"use client";

import React, { useCallback, useRef } from 'react';
import ReactFlow, { 
  Controls, 
  Background, 
  ReactFlowProvider, 
  addEdge, 
  useNodesState, 
  useEdgesState,
  useReactFlow // FIX: Import the useReactFlow hook
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useDiagramStore } from '@/store/diagramStore';

// We will need a custom node type to render our SVG icons and labels
const nodeTypes = {
  // Add your custom node types here
};

export const Editor = () => {
  // Use a ref to get the bounds of the React Flow wrapper
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  
  // FIX: Get the instance from the hook
  const reactFlowInstance = useReactFlow();

  // Use the Zustand store to get all our state and actions
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    addNode, 
    setSelectedNode, 
  } = useDiagramStore();

  // This function is crucial for the drag-and-drop functionality
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const rawData = event.dataTransfer.getData('application/reactflow');
      const { nodeType, componentId } = JSON.parse(rawData);

      // Use the ReactFlow instance to get the position of the dropped item
      const position = reactFlowInstance.project({
        x: event.clientX - (reactFlowBounds?.left || 0),
        y: event.clientY - (reactFlowBounds?.top || 0),
      });

      if (nodeType && position) {
        // Create a new node with data from the palette
        const newNode = {
          id: Date.now().toString(),
          type: nodeType,
          position,
          data: { 
            componentId: componentId,
            label: nodeType, 
            iconUrl: `/assets/icons/${nodeType}.svg` 
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
        // FIX: Remove onInit as we are using the hook
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={(event, node) => setSelectedNode(node)}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};
