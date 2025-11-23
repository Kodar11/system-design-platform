'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitProblemSolution, createDesign, sendOtp } from '@/app/actions';

/**
 * Hook for submitting a solution with optimistic updates
 */
export function useSubmitSolution() {
  const queryClient = useQueryClient();
  // Local, minimal diagram shape used for client typing
  type DiagramDataLocal = {
    nodes?: Array<{ id: string; data?: { label?: string; componentId?: string; metadata?: Record<string, unknown> }; position?: { x: number; y: number } }>;
    edges?: Array<{ id: string; source: string; target: string; label?: string }>; 
  };

  type TranscriptHistoryEntryLocal = { role: 'AI' | 'User'; message: string; timestamp: number; context?: string };

  type SubmitSolutionVars = {
    problemId: string;
    diagramData: DiagramDataLocal;
    databaseSchema?: unknown;
    submittedAnswers?: string[];
    transcriptHistory?: TranscriptHistoryEntryLocal[];
    interviewMode: 'practice' | 'mock';
  };

  return useMutation<unknown, unknown, SubmitSolutionVars>({
    mutationFn: async ({
      problemId,
      diagramData,
      databaseSchema,
      submittedAnswers,
      transcriptHistory,
      interviewMode,
    }: SubmitSolutionVars) => {
      return await submitProblemSolution(
        problemId,
        diagramData,
        databaseSchema,
        submittedAnswers,
        transcriptHistory,
        interviewMode
      );
    },
    onSuccess: (submissionId, variables: SubmitSolutionVars) => {
      // Invalidate problem submissions cache
      queryClient.invalidateQueries({ 
        queryKey: ['problem', variables.problemId, 'submissions'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['problems'] 
      });
    },
    retry: 1,
    // Show loading state for at least 1 second for better UX
    meta: {
      minimumLoadingTime: 1000,
    },
  });
}

/**
 * Hook for generating AI designs
 */
export function useGenerateDesign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      return await createDesign(formData);
    },
    onSuccess: () => {
      // Invalidate designs list
      queryClient.invalidateQueries({ 
        queryKey: ['designs'] 
      });
    },
    retry: 1,
  });
}

/**
 * Hook for sending OTP with rate limiting
 */
export function useSendOtp() {
  type TempUserDataLocal = { username: string; password: string; role: string };
  type SendOtpVars = { email: string; newUserData?: TempUserDataLocal };
  return useMutation<unknown, unknown, SendOtpVars>({
    mutationFn: async ({ email, newUserData }: SendOtpVars) => {
      const payload = newUserData as unknown as Parameters<typeof sendOtp>[1];
      return await sendOtp(email, payload);
    },
    // Don't retry OTP sends - user should manually retry
    retry: false,
  });
}
