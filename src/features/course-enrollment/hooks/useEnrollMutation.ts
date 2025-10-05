"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import { notifyError, notifySuccess } from "@/lib/notifications/toast";

export const useEnrollMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { data } = await apiClient.post<{ enrollmentId: string; courseId: string }>("/api/enrollments", {
        courseId,
      });
      return data;
    },
    onSuccess: ({ courseId }) => {
      notifySuccess({ title: "수강 신청이 완료되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses", "detail", courseId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "learner"] });
    },
    onError: (error) => {
      const message = extractApiErrorMessage(error, "수강 신청에 실패했습니다.");
      notifyError({ title: "신청 실패", description: message });
    },
  });
};
