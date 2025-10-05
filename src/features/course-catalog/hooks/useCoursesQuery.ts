'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';

export type CoursesFilter = {
  search?: string;
  category?: string;
  difficulty?: string;
  sort?: 'latest' | 'popular';
  page?: number;
  limit?: number;
};

export const useCoursesQuery = (filters: CoursesFilter = {}) => {
  return useQuery({
    queryKey: ['courses', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      });

      try {
        const { data } = await apiClient.get(`/api/courses${params.toString() ? `?${params.toString()}` : ''}`);
        return data as { items: unknown[]; total: number };
      } catch (error) {
        const message = extractApiErrorMessage(error, 'Failed to load courses');
        throw new Error(message);
      }
    },
    staleTime: 60_000,
  });
};


