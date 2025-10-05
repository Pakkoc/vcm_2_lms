'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';

export const useLearnerGrades = () => {
  return useQuery({
    queryKey: ['grades', 'learner'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/api/grades/learner');
        return data;
      } catch (error) {
        const message = extractApiErrorMessage(error, 'Failed to load grades');
        throw new Error(message);
      }
    },
    staleTime: 60_000,
  });
};


