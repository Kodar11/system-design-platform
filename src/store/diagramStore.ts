// src/store/diagramStore.ts
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
  ConnectionLineType,
} from 'reactflow';

type TemporalActions = {
  undo: () => void;
  redo: () => void;
  pastStates: unknown[]; 
  futureStates: unknown[]; 
};

interface EdgeConfig {
  type: ConnectionLineType;
  animated: boolean;
  style: React.CSSProperties;
}

interface ErrorItem {
  field: string;
  message: string;
}

interface DiagramState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  reactFlowInstance: ReactFlowInstance | null;
  activeTool: 'none' | 'text';
  currentEdgeConfig: EdgeConfig;
  problemData?: any;
  budget?: number;
  configurationTargets?: Record<string, any>;
  totalCost: number;
  nodeErrors: Record<string, ErrorItem[]>;
  hasCriticalErrors: boolean;
  
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  setSelectedNode: (node: Node | null) => void;
  updateNodeProperties: (nodeId: string, data: Record<string, unknown>) => void;
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  setNodeType: (nodeId: string, nodeType: string) => void;
  deleteSelectedNodes: () => void;
  setReactFlowInstance: (instance: ReactFlowInstance) => void;
  groupSelectedNodes: () => void;
  ungroupSelectedNodes: () => void;
  setActiveTool: (tool: 'none' | 'text') => void;
  setCurrentEdgeConfig: (config: EdgeConfig) => void;
  setProblemData: (data: any) => void;
  setBudget: (budget: number) => void;
  setConfigurationTargets: (targets: Record<string, any>) => void;
  computeCostsAndErrors: () => void;
  
  // NEW: Duplicate action (minor addition)
  duplicateSelectedNodes: () => void;

  // NEW: Toggle dashed style for a specific edge
  toggleEdgeStyle: (edgeId: string) => void;

  // The temporal object is now part of the store's state
  temporal?: TemporalActions; 
}

// Helper to get nested value
const getNestedValue = (obj: any, path: string): any => {
  if (!obj || typeof path !== 'string') return undefined;
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Recursive cost and error calculation
export const calculateNodeCostAndErrors = (
  values: Record<string, unknown>,
  schema: Record<string, unknown>,
  targets?: Record<string, any>,
  prefix = '',
  accumulatedCost = 0,
  accumulatedErrors: ErrorItem[] = []
): { cost: number; errors: ErrorItem[] } => {
  Object.entries(schema).forEach(([key, config]) => {
    const fieldName = prefix ? `${prefix}.${key}` : key;
    const configData = config as any;
    const value = getNestedValue(values, fieldName);

    if (configData.options && configData.configs) {
      // Dropdown with configs
      const selected = String(value || '');
      const selectedConfig = configData.configs[selected];
      if (selectedConfig) {
        accumulatedCost += selectedConfig.cost_factor || 0;
        // Recurse into sub-config
        const subResult = calculateNodeCostAndErrors(values, selectedConfig, targets, fieldName, accumulatedCost, accumulatedErrors);
        accumulatedCost = subResult.cost;
        accumulatedErrors = subResult.errors;
      }
      // Check target for this field
      if (targets && targets[fieldName]) {
        const target = targets[fieldName];
        if (typeof target === 'string' && String(value) !== target) {
          accumulatedErrors.push({ field: fieldName, message: `${configData.label || key} must be "${target}"` });
        }
      }
    } else if (configData.type) {
      // Simple field
      let fieldCost = 0;
      if (configData.type === 'number' && typeof value === 'number') {
        fieldCost = value * (configData.cost_factor || 0);
      }
      accumulatedCost += fieldCost;

      // Validation
      if (configData.required && (value === undefined || value === '' || value === null)) {
        accumulatedErrors.push({ field: fieldName, message: `Missing: ${configData.label || key} required` });
      }
      if (targets && targets[fieldName]) {
        const target = targets[fieldName];
        if (typeof target === 'object' && target !== null) {
          if (target.min !== undefined && typeof value === 'number' && value < target.min) {
            accumulatedErrors.push({ field: fieldName, message: `Min ${target.min} ${configData.label || key} required` });
          }
          if (target.max !== undefined && typeof value === 'number' && value > target.max) {
            accumulatedErrors.push({ field: fieldName, message: `Max ${target.max} ${configData.label || key} allowed` });
          }
        } else if (typeof target === 'boolean' && value !== target) {
          accumulatedErrors.push({ field: fieldName, message: `${configData.label || key} must be ${target}` });
        } else if (typeof target === 'string' && String(value) !== target) {
          accumulatedErrors.push({ field: fieldName, message: `${configData.label || key} must be "${target}"` });
        }
      }
    } else if (typeof configData === 'object' && configData !== null) {
      // Nested object
      const subResult = calculateNodeCostAndErrors(values, configData, targets, fieldName, accumulatedCost, accumulatedErrors);
      accumulatedCost = subResult.cost;
      accumulatedErrors = subResult.errors;
    }
  });

  return { cost: accumulatedCost, errors: accumulatedErrors };
};

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
      currentEdgeConfig: { type: ConnectionLineType.Step, animated: false, style: {} }, // DEFAULT: Right-angled (Step)
      problemData: undefined,
      budget: undefined,
      configurationTargets: undefined,
      totalCost: 0,
      nodeErrors: {},
      hasCriticalErrors: false,

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
        const { currentEdgeConfig } = get();
        const newEdge = {
          ...connection,
          type: currentEdgeConfig.type,
          animated: currentEdgeConfig.animated,
          style: currentEdgeConfig.style,
        };
        set({
          edges: addEdge(newEdge, get().edges),
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

      updateNodeProperties: (nodeId: string, data: Record<string, unknown>) => {
        set({
          nodes: get().nodes.map(node =>
            node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
          ),
        });
      },

      updateNode: (nodeId: string, updates: Partial<Node>) => {
        set({
          nodes: get().nodes.map(node =>
            node.id === nodeId ? { ...node, ...updates } : node
          ),
        });
      },

      setNodeType: (nodeId: string, nodeType: string) => {
        set({
          nodes: get().nodes.map(node =>
            node.id === nodeId ? { ...node, type: nodeType } : node
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

      setProblemData: (data: any) => set({ problemData: data }),
      setBudget: (budget: number) => set({ budget }),
      setConfigurationTargets: (targets: Record<string, any>) => set({ configurationTargets: targets }),

      computeCostsAndErrors: () => {
        const { nodes, configurationTargets } = get();
        let totalCost = 0;
        const nodeErrors: Record<string, ErrorItem[]> = {};
        nodes.forEach((node) => {
          if (!node.data.metadata) return;
          const componentTargets = configurationTargets?.[node.data.label];
          const { cost, errors } = calculateNodeCostAndErrors(node.data, node.data.metadata, componentTargets);
          totalCost += cost;
          if (errors.length > 0) {
            nodeErrors[node.id] = errors;
          }
        });
        set({
          totalCost,
          nodeErrors,
          hasCriticalErrors: Object.keys(nodeErrors).length > 0,
        });
      },

      groupSelectedNodes: () => {
        set((state) => {
          const selectedNodes = state.nodes.filter(n => n.selected);
          if (selectedNodes.length < 2) return state;

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

          const groupId = Date.now().toString();
          const groupNode: Node = {
            id: groupId,
            type: 'group',
            position: groupPosition,
            style: { 
              width: groupWidth, 
              height: groupHeight,
              background: 'rgba(0, 0, 0, 0.05)', // FIXED: Very light background for visibility without obstruction
              border: '1px dashed #999', // FIXED: Dashed border to indicate grouping without blocking
              borderRadius: 4,
              zIndex: 1, // FIXED: Low z-index to allow children to be on top
            },
            data: { label: 'Group' },
          };

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
                selected: false,
                style: { ...node.style, zIndex: 2 }, // FIXED: Higher z-index for children to ensure visibility and clickability
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
                  style: { ...node.style, zIndex: undefined }, // FIXED: Reset z-index on ungroup
                };
              }
              return node;
            });

            if (newNodes.filter(n => n.parentId === group.id).length === 0) {
              newNodes = newNodes.filter(n => n.id !== group.id);
            }
          });

          return { nodes: newNodes, selectedNode: null };
        });
      },

      setActiveTool: (tool: 'none' | 'text') => set({ activeTool: tool }),

      setCurrentEdgeConfig: (config: EdgeConfig) => set({ currentEdgeConfig: config }),

      // NEW: Toggle dashed style for a specific edge
      toggleEdgeStyle: (edgeId: string) => {
        set((state) => ({
          edges: state.edges.map(edge =>
            edge.id === edgeId
              ? {
                  ...edge,
                  style: edge.style?.strokeDasharray
                    ? {} // Switch to solid
                    : { strokeDasharray: '5, 5' }, // Switch to dashed
                }
              : edge
          ),
        }));
      },

      duplicateSelectedNodes: () => {
        set((state) => {
          const selectedNodes = state.nodes.filter((n) => n.selected);
          if (selectedNodes.length === 0) return state;

          const offsetX = 30;
          const offsetY = 30;
          const oldToNewIdMap = new Map<string, string>();

          const duplicatedNodes: Node[] = selectedNodes.map((node) => {
            const newId = `${node.id}-dup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            oldToNewIdMap.set(node.id, newId);
            return {
              ...node,
              id: newId,
              position: {
                x: node.position.x + offsetX,
                y: node.position.y + offsetY,
              },
              selected: true,
            };
          });

          const selectedNodeIdSet = new Set(selectedNodes.map((n) => n.id));
          const duplicatedEdges: Edge[] = state.edges
            .filter((e) => selectedNodeIdSet.has(e.source) && selectedNodeIdSet.has(e.target))
            .map((e) => ({
              ...e,
              id: `${e.id}-dup-${Date.now()}`,
              source: oldToNewIdMap.get(e.source)!,
              target: oldToNewIdMap.get(e.target)!,
            }));

          const nodesWithoutOriginals = state.nodes.map((n) =>
            n.selected ? { ...n, selected: false } : n
          );

          return {
            nodes: [...nodesWithoutOriginals, ...duplicatedNodes],
            edges: [...state.edges, ...duplicatedEdges],
            selectedNode: null,
          };
        });
      },
    }),
    {
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
      equality,
    }
  )
);