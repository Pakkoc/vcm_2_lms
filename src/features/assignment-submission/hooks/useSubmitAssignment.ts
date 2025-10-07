"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';

type SubmitPayload = {
  assignmentId: string;
  content: string;
  linkUrl?: string;
};

export const useSubmitAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitPayload) => {
      try {
        const { data } = await apiClient.post('/api/submissions', payload);
        return data as { submissionId: string; isLate: boolean };
      } catch (error) {
        const message = extractApiErrorMessage(error, 'Failed to submit assignment');
        throw new Error(message);
      }
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화 (대시보드, 성적, 과제 상세 등)
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'learner'] });
      void queryClient.invalidateQueries({ queryKey: ['grades', 'learner'] });
      if (variables.assignmentId) {
        void queryClient.invalidateQueries({ queryKey: ['assignment-detail', variables.assignmentId] });
      }
    },
  });
};
