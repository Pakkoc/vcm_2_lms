'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';

export const useLearnerDashboard = () => {
  return useQuery({
    queryKey: ['dashboard', 'learner'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/api/dashboard/learner');
        return data;
      } catch (error) {
        const message = extractApiErrorMessage(error, 'Failed to load dashboard');
        throw new Error(message);
      }
    },
    staleTime: 60_000,
  });
};


