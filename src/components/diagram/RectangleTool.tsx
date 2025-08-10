import { useCallback, useEffect, useState } from 'react';
import { useStoreApi, Node } from 'reactflow';

type Point = { x: number; y: number };

const RectangleTool = () => {
  const store = useStoreApi();
  const [start, setStart] = useState<Point | null>(null);
  const [end, setEnd] = useState<Point | null>(null);

  const onMouseDown = useCallback((e: MouseEvent) => {
    if (e.button !== 0) return;
    const { clientX, clientY } = e;
    setStart({ x: clientX, y: clientY });
    setEnd({ x: clientX, y: clientY });
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!start) return;
    const { clientX, clientY } = e;
    setEnd({ x: clientX, y: clientY });
  }, [start]);

  const onMouseUp = useCallback(() => {
    if (!start || !end) return;
    const position = { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y) };
    const width = Math.abs(start.x - end.x);
    const height = Math.abs(start.y - end.y);
    const newNode: Node = {
      id: Date.now().toString(),
      type: 'rectangle',
      position,
      data: { color: '#ff7000' },
      width,
      height,
    };
    //@ts-ignore
    const { nodes, setNodes } = store.getState();
    setNodes([...nodes, newNode]);
    setStart(null);
    setEnd(null);
  }, [start, end]);

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

  if (!start || !end) return null;

  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(start.x - end.x);
  const height = Math.abs(start.y - end.y);

  return <div style={{ position: 'absolute', left: x, top: y, width, height, border: '1px dashed black', pointerEvents: 'none' }} />;
};

export default RectangleTool;