import { useCallback, useEffect, useRef, useState } from 'react';
import { useStoreApi, Node, Edge } from 'reactflow';

type Point = { x: number; y: number };

const Eraser = () => {
  const store = useStoreApi();
  const [start, setStart] = useState<Point | null>(null);
  const [path, setPath] = useState<Point[]>([]);
  const eraserRef = useRef<SVGSVGElement>(null);

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
    //@ts-ignore    
    const { nodes, edges, setNodes, setEdges } = store.getState();
    const toRemoveNodes = nodes.filter((node: Node) => {
      // Check if node center intersects path
      const center = { x: node.position.x + (node.width || 0) / 2, y: node.position.y + (node.height || 0) / 2 };
      return path.some((p, i) => i > 0 && lineIntersects(p, path[i - 1], center, center));
    }).map((node: Node) => node.id);

    const toRemoveEdges = edges.filter((edge: Edge) => {
      // Check if edge path intersects the eraser path
      const sourceNode = nodes.find((n: Node) => n.id === edge.source);
      const targetNode = nodes.find((n: Node) => n.id === edge.target);
      if (!sourceNode || !targetNode) return false;
      const edgeCenter = {
        x: (sourceNode.position.x + targetNode.position.x) / 2,
        y: (sourceNode.position.y + targetNode.position.y) / 2,
      };
      return path.some((p, i) => i > 0 && lineIntersects(p, path[i - 1], edgeCenter, edgeCenter));
    }).map((edge: Edge) => edge.id);

    setNodes(nodes.filter((n: Node) => !toRemoveNodes.includes(n.id)));
    setEdges(edges.filter((e: Edge) => !toRemoveEdges.includes(e.id)));
    setStart(null);
    setPath([]);
  }, [path]);

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

  return (
    <svg ref={eraserRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <path d={d} fill="none" stroke="red" strokeWidth={2} />
    </svg>
  );
};

export default Eraser;

// Implement a simple lineIntersects function
function lineIntersects(a: Point, b: Point, c: Point, d: Point) {
  // Basic line intersection check (simplified for point proximity)
  const det = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
  if (det === 0) return false; // Parallel lines
  const lambda = ((a.y - b.y) * (a.x - c.x) + (b.x - a.x) * (a.y - c.y)) / det;
  const gamma = ((d.y - c.y) * (a.x - c.x) + (c.x - d.x) * (a.y - c.y)) / det;
  return (0 <= lambda && lambda <= 1) && (0 <= gamma && gamma <= 1); // Adjusted for segment intersection
}