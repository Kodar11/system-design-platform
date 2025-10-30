// Custom hook for ReactFlow performance optimizations
import { useCallback, useMemo } from 'react';
import { Edge } from 'reactflow';

// Hook to optimize node/edge changes
export const useReactFlowPerformance = () => {
  // Throttle node changes for better performance during dragging
  const throttleNodeChanges = useCallback((changes: any[]) => {
    // Group position changes together
    const positionChanges = changes.filter(c => c.type === 'position');
    const otherChanges = changes.filter(c => c.type !== 'position');
    
    if (positionChanges.length > 5) {
      // Only apply last position change for each node during rapid updates
      const latestPositions = new Map();
      positionChanges.forEach(change => {
        latestPositions.set(change.id, change);
      });
      return [...otherChanges, ...Array.from(latestPositions.values())];
    }
    
    return changes;
  }, []);

  // Optimize edge updates
  const optimizeEdgeUpdate = useCallback((edges: Edge[]) => {
    return edges.map(edge => ({
      ...edge,
      // Add animated prop only to selected edges
      animated: edge.selected ? true : false,
    }));
  }, []);

  // Connection line style memoization
  const connectionLineStyle = useMemo(() => ({
    strokeWidth: 2,
    stroke: 'hsl(var(--primary))',
  }), []);

  // Default edge options memoization
  const defaultEdgeOptions = useMemo(() => ({
    type: 'default',
    animated: false,
    style: { strokeWidth: 2 },
  }), []);

  return {
    throttleNodeChanges,
    optimizeEdgeUpdate,
    connectionLineStyle,
    defaultEdgeOptions,
  };
};
