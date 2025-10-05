"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { CourseDetailResponse } from "@/features/course-detail/backend/schema";

export const useCourseDetail = (courseId: string | null | undefined) =>
  useQuery({
    enabled: Boolean(courseId),
    queryKey: ["courses", "detail", courseId],
    queryFn: async () => {
      if (!courseId) {
        throw new Error("유효한 코스 ID가 필요합니다.");
      }
      try {
        const { data } = await apiClient.get<CourseDetailResponse>(`/api/courses/${courseId}`);
        return data;
      } catch (error) {
        const message = extractApiErrorMessage(error, "코스 정보를 불러오지 못했습니다.");
        throw new Error(message);
      }
    },
    staleTime: 60_000,
  });
