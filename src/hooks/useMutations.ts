'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitProblemSolution, createDesign, sendOtp } from '@/app/actions';

/**
 * Hook for submitting a solution with optimistic updates
 */
export function useSubmitSolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      problemId,
      diagramData,
      databaseSchema,
      submittedAnswers,
      transcriptHistory,
      interviewMode,
    }: {
      problemId: string;
      diagramData: any;
      databaseSchema?: any;
      submittedAnswers?: any;
      transcriptHistory?: any;
      interviewMode: 'practice' | 'mock';
    }) => {
      return await submitProblemSolution(
        problemId,
        diagramData,
        databaseSchema,
        submittedAnswers,
        transcriptHistory,
        interviewMode
      );
    },
    onSuccess: (submissionId, variables) => {
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
  return useMutation({
    mutationFn: async ({
      email,
      newUserData,
    }: {
      email: string;
      newUserData?: any; // TempUserData type from actions.ts
    }) => {
      return await sendOtp(email, newUserData);
    },
    // Don't retry OTP sends - user should manually retry
    retry: false,
  });
}
