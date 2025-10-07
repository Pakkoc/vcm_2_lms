"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";

export const useUpdateCourseStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { courseId: string; status: "draft" | "published" | "archived" }) => {
      try {
        const { data } = await apiClient.patch(`/api/courses/${params.courseId}/status`, { status: params.status });
        return data as { id: string; status: string };
      } catch (error) {
        const message = extractApiErrorMessage(error, "코스 상태를 업데이트하지 못했습니다.");
        throw new Error(message);
      }
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "instructor"] });
      void queryClient.invalidateQueries({ queryKey: ["course-detail", variables.courseId] });
    },
  });
};