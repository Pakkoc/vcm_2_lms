"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";

type GradeSubmissionInput = {
  submissionId: string;
  action: "grade" | "regrade" | "resubmission_required";
  score?: number;
  feedback: string;
};

export const useGradeSubmissionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: GradeSubmissionInput) => {
      try {
        const payload = {
          action: input.action,
          // 서버 스키마 요구사항: resubmission_required에도 score 필드 필요
          score: input.action === "resubmission_required" ? 0 : input.score,
          feedback: input.feedback,
        };
        const { data } = await apiClient.post(`/api/grading/submissions/${input.submissionId}/grade`, payload);
        return data as { id: string };
      } catch (error) {
        const message = extractApiErrorMessage(error, "제출물 평가에 실패했습니다.");
        throw new Error(message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "instructor"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "learner"] });
      void queryClient.invalidateQueries({ queryKey: ["grades", "learner"] });
    },
  });
};