"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { CourseListResponse, CourseSort } from "@/features/course-catalog/backend/schema";

export type CoursesFilter = {
  search?: string;
  category?: string;
  difficulty?: string;
  sort?: CourseSort;
  page?: number;
  limit?: number;
};

const buildQueryString = (filters: CoursesFilter) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export const useCoursesQuery = (filters: CoursesFilter = {}) =>
  useQuery<CourseListResponse>({
    queryKey: ["courses", filters],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<CourseListResponse>(`/api/courses${buildQueryString(filters)}`);
        return data;
      } catch (error) {
        const message = extractApiErrorMessage(error, "코스 목록을 불러오지 못했습니다.");
        throw new Error(message);
      }
    },
    staleTime: 60_000,
  });
