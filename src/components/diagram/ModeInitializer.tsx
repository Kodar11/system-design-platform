'use client';

import { useEffect } from 'react';
import { useDiagramStore } from '@/store/diagramStore';

interface ModeInitializerProps {
  mode: 'practice' | 'mock';
  problemId: string;
}

export const ModeInitializer: React.FC<ModeInitializerProps> = ({ mode, problemId }) => {
  const { setInterviewMode, resetInterviewState } = useDiagramStore();

  useEffect(() => {
    resetInterviewState();
    setInterviewMode(mode);
    
    sessionStorage.setItem('interviewMode', mode);
    sessionStorage.setItem('currentProblemId', problemId);

    console.log(`Initialized ${mode} mode for problem ${problemId}`);
  }, [mode, problemId, setInterviewMode, resetInterviewState]);

  return null;
};
