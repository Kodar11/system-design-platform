// src/store/diagramStore.ts
import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowInstance,
  getIncomers,
  getOutgoers,
  getConnectedEdges,
} from 'reactflow';

// Define the state and actions for our store
interface DiagramState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  reactFlowInstance: ReactFlowInstance | null;
  
  // Actions to modify state
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  setSelectedNode: (node: Node | null) => void;
  updateNodeProperties: (nodeId: string, data: any) => void;
  deleteSelectedNodes: () => void;
  setReactFlowInstance: (instance: ReactFlowInstance) => void;
}

// Create the store
export const useDiagramStore = create<DiagramState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  reactFlowInstance: null,

  // Connects directly to React Flow's onNodesChange event
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  // Connects directly to React Flow's onEdgesChange event
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  // Connects directly to React Flow's onConnect event for new edges
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  // Manually sets all nodes (e.g., when loading a saved design)
  setNodes: (nodes: Node[]) => set({ nodes }),

  // Manually sets all edges (e.g., when loading a saved design)
  setEdges: (edges: Edge[]) => set({ edges }),
  
  // Adds a new node to the diagram (used for drag-and-drop)
  addNode: (node: Node) => {
    set({ nodes: [...get().nodes, node] });
  },

  // Sets the currently selected node for the properties panel
  setSelectedNode: (node: Node | null) => {
    set({ selectedNode: node });
  },

  // Updates properties of a specific node
  updateNodeProperties: (nodeId: string, data: any) => {
    set({
      nodes: get().nodes.map(node =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
    });
  },

  // Deletes selected nodes and their connected edges
  deleteSelectedNodes: () => {
    set((state) => {
      const selectedNodeIds = state.nodes.filter(n => n.selected).map(n => n.id);
      const newNodes = state.nodes.filter(n => !selectedNodeIds.includes(n.id));
      const newEdges = state.edges.filter(e => 
        !selectedNodeIds.includes(e.source) && !selectedNodeIds.includes(e.target)
      );
      return { nodes: newNodes, edges: newEdges, selectedNode: null };
    });
  },

  // Stores the React Flow instance for programmatic access (e.g., for `fitView`)
  setReactFlowInstance: (instance: ReactFlowInstance) => set({ reactFlowInstance: instance }),
}));