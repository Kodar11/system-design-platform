import { create } from 'zustand';
import { temporal } from 'zundo';
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
  XYPosition,
} from 'reactflow';

// Define a type for the temporal actions and history
type TemporalActions = {
  undo: () => void;
  redo: () => void;
  pastStates: any[]; // You can type this more specifically if needed
  futureStates: any[]; // You can type this more specifically if needed
};

// Update the DiagramState interface to include the temporal object
interface DiagramState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  reactFlowInstance: ReactFlowInstance | null;
  activeTool: 'none' | 'lasso' | 'eraser' | 'rectangle';
  
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
  groupSelectedNodes: () => void;
  ungroupSelectedNodes: () => void;
  setActiveTool: (tool: 'none' | 'lasso' | 'eraser' | 'rectangle') => void;
  
  // The temporal object is now part of the store's state
  temporal?: TemporalActions; 
}

// Equality function to ignore position changes
const equality = (a: { nodes: Node[]; edges: Edge[] }, b: { nodes: Node[]; edges: Edge[] }) => {
  if (a.nodes.length !== b.nodes.length || a.edges.length !== b.edges.length) return false;

  const aNodesMap = new Map(a.nodes.map(node => [node.id, node]));

  for (const bNode of b.nodes) {
    const aNode = aNodesMap.get(bNode.id);
    if (!aNode || aNode.type !== bNode.type || JSON.stringify(aNode.data) !== JSON.stringify(bNode.data)) return false;
  }

  const aEdgesMap = new Map(a.edges.map(edge => [edge.id, edge]));

  for (const bEdge of b.edges) {
    const aEdge = aEdgesMap.get(bEdge.id);
    if (!aEdge || aEdge.source !== bEdge.source || aEdge.target !== bEdge.target || aEdge.sourceHandle !== bEdge.sourceHandle || aEdge.targetHandle !== bEdge.targetHandle) return false;
  }

  return true;
};

// Create the store wrapped with the temporal middleware
export const useDiagramStore = create<DiagramState>()(
  temporal(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNode: null,
      reactFlowInstance: null,
      activeTool: 'none',

      onNodesChange: (changes: NodeChange[]) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes),
        });
      },

      onEdgesChange: (changes: EdgeChange[]) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },

      onConnect: (connection: Connection) => {
        set({
          edges: addEdge(connection, get().edges),
        });
      },

      setNodes: (nodes: Node[]) => set({ nodes }),
      setEdges: (edges: Edge[]) => set({ edges }),
      
      addNode: (node: Node) => {
        set({ nodes: [...get().nodes, node] });
      },

      setSelectedNode: (node: Node | null) => {
        set({ selectedNode: node });
      },

      updateNodeProperties: (nodeId: string, data: any) => {
        set({
          nodes: get().nodes.map(node =>
            node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
          ),
        });
      },

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

      setReactFlowInstance: (instance: ReactFlowInstance) => set({ reactFlowInstance: instance }),

      groupSelectedNodes: () => {
        set((state) => {
          const selectedNodes = state.nodes.filter(n => n.selected);
          if (selectedNodes.length < 2) return state; // Need at least 2 nodes to group

          // Calculate bounding box for the group
          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;

          selectedNodes.forEach(node => {
            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxX = Math.max(maxX, node.position.x + (node.width || 100));
            maxY = Math.max(maxY, node.position.y + (node.height || 100));
          });

          const padding = 20;
          const groupWidth = maxX - minX + padding * 2;
          const groupHeight = maxY - minY + padding * 2;
          const groupPosition: XYPosition = { x: minX - padding, y: minY - padding };

          // Create group node
          const groupId = Date.now().toString();
          const groupNode: Node = {
            id: groupId,
            type: 'group',
            position: groupPosition,
            style: { width: groupWidth, height: groupHeight },
            data: { label: 'Group' },
          };

          // Update children: set parentId, relative position, extent
          const updatedNodes = state.nodes.map(node => {
            if (selectedNodes.some(n => n.id === node.id)) {
              return {
                ...node,
                parentId: groupId,
                extent: "parent" as const,
                position: {
                  x: node.position.x - groupPosition.x,
                  y: node.position.y - groupPosition.y,
                },
                selected: false, // Deselect after grouping
              };
            }
            return node;
          });

          return { nodes: [...updatedNodes, groupNode], selectedNode: null };
        });
      },

      ungroupSelectedNodes: () => {
        set((state) => {
          const selectedGroups = state.nodes.filter(n => n.selected && n.type === 'group');

          let newNodes = [...state.nodes];

          selectedGroups.forEach(group => {
            const groupPosition = group.position;

            // Update children: remove parentId, set absolute position, remove extent
            newNodes = newNodes.map(node => {
              if (node.parentId === group.id) {
                return {
                  ...node,
                  parentId: undefined,
                  extent: undefined,
                  position: {
                    x: node.position.x + groupPosition.x,
                    y: node.position.y + groupPosition.y,
                  },
                };
              }
              return node;
            });

            // Remove the group if empty (no children left)
            if (newNodes.filter(n => n.parentId === group.id).length === 0) {
              newNodes = newNodes.filter(n => n.id !== group.id);
            }
          });

          return { nodes: newNodes, selectedNode: null };
        });
      },

      setActiveTool: (tool) => set({ activeTool: tool }),
    }),
    {
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
      equality,
    }
  )
);