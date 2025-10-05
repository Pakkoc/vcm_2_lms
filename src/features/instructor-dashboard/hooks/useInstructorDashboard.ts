'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';

export const useInstructorDashboard = () => {
  return useQuery({
    queryKey: ['dashboard', 'instructor'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/api/dashboard/instructor');
        return data;
      } catch (error) {
        const message = extractApiErrorMessage(error, 'Failed to load instructor dashboard');
        throw new Error(message);
      }
    },
    staleTime: 60_000,
  });
};


