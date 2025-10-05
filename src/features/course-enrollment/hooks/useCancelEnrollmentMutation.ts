"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import { notifyError, notifySuccess } from "@/lib/notifications/toast";

type CancelPayload = {
  enrollmentId: string;
  courseId: string;
};

export const useCancelEnrollmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ enrollmentId }: CancelPayload) => {
      const { data } = await apiClient.delete<{ cancelledAt: string; courseId: string }>(
        `/api/enrollments/${enrollmentId}`,
      );
      return data;
    },
    onSuccess: ({ courseId }) => {
      notifySuccess({ title: "수강 취소가 완료되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses", "detail", courseId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "learner"] });
    },
    onError: (error) => {
      const message = extractApiErrorMessage(error, "수강 취소에 실패했습니다.");
      notifyError({ title: "취소 실패", description: message });
    },
  });
};
