'use client';

import { useEffect } from 'react';
import { useDiagramStore } from '@/store/diagramStore';

interface ModeInitializerProps {
  mode: 'practice' | 'mock';
  problemId: string;
  starterDiagram?: {
    nodes?: any[];
    edges?: any[];
  } | null;
}

export const ModeInitializer: React.FC<ModeInitializerProps> = ({ mode, problemId, starterDiagram = null }) => {
  const { setInterviewMode, resetInterviewState, setNodes, setEdges } = useDiagramStore();

  useEffect(() => {
    resetInterviewState();
    setInterviewMode(mode);
    
    sessionStorage.setItem('interviewMode', mode);
    sessionStorage.setItem('currentProblemId', problemId);

    // If the problem provides a starter diagram, load it into the store so the editor can render it
    if (starterDiagram && starterDiagram.nodes) {
      try {
        setNodes(starterDiagram.nodes as any[]);
        setEdges(starterDiagram.edges as any[] || []);
        console.log('Loaded starter diagram for problem', problemId);
      } catch (e) {
        console.warn('Failed to load starter diagram into store', e);
      }
    }
    console.log(`Initialized ${mode} mode for problem ${problemId}`);
  }, [mode, problemId, setInterviewMode, resetInterviewState]);

  return null;
};
