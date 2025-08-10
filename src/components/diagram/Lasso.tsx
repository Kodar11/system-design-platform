import { useCallback, useEffect, useRef, useState } from 'react';
import { useStoreApi, Node } from 'reactflow';

type Point = { x: number; y: number };

function pointInPolygon(point: Point, polygon: Point[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (
      polygon[i].y > point.y !== polygon[j].y > point.y &&
      point.x < polygon[i].x + (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y)
    ) {
      inside = !inside;
    }
  }
  return inside;
}

const Lasso = ({ partial = false }) => {
  const store = useStoreApi();
  const [start, setStart] = useState<Point | null>(null);
  const [path, setPath] = useState<Point[]>([]);
  const lassoRef = useRef(null);

  const onMouseDown = useCallback((e: MouseEvent) => {
    if (e.button !== 0) return;
    const { clientX, clientY } = e;
    setStart({ x: clientX, y: clientY });
    setPath([{ x: clientX, y: clientY }]);
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!start) return;
    const { clientX, clientY } = e;
    setPath((p) => [...p, { x: clientX, y: clientY }]);
  }, [start]);

  const onMouseUp = useCallback(() => {
    if (!path.length) return;
    const { nodeInternals, setNodes } = store.getState();
    const nodesArray = Array.from(nodeInternals.values());
    const selectedIds: string[] = [];
    nodesArray.forEach((node) => {
      const nodePosition = { x: node.position.x, y: node.position.y };
      if (pointInPolygon(nodePosition, path)) {
        selectedIds.push(node.id);
      }
      // For partial, implement intersection check
      if (partial) {
        // Simple partial check: if any corner is inside
        const corners = [
          nodePosition,
          { x: node.position.x + (node.width || 0), y: node.position.y },
          { x: node.position.x, y: node.position.y + (node.height || 0) },
          { x: node.position.x + (node.width || 0), y: node.position.y + (node.height || 0) },
        ];
        if (corners.some(cor => pointInPolygon(cor, path))) {
          selectedIds.push(node.id);
        }
      }
    });
    setNodes(nodesArray.map(node => ({ ...node, selected: selectedIds.includes(node.id) })));
    setStart(null);
    setPath([]);
  }, [path, partial]);

  useEffect(() => {
    const pane = document.querySelector('.react-flow__pane');
    if (pane) {
      pane.addEventListener('mousedown', onMouseDown as EventListener);
      pane.addEventListener('mousemove', onMouseMove as EventListener);
      pane.addEventListener('mouseup', onMouseUp as EventListener);
    }
    return () => {
      if (pane) {
        pane.removeEventListener('mousedown', onMouseDown as EventListener);
        pane.removeEventListener('mousemove', onMouseMove as EventListener);
        pane.removeEventListener('mouseup', onMouseUp as EventListener);
      }
    };
  }, [onMouseDown, onMouseMove, onMouseUp]);

  if (!path.length) return null;

  const d = path.reduce((acc, point, i) => {
    if (i === 0) return `M${point.x} ${point.y}`;
    return acc + `L${point.x} ${point.y}`;
  }, '');

  return <svg ref={lassoRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
    <path d={d} fill="none" stroke="black" strokeDasharray="5 5" />
  </svg>;
};

export default Lasso;