"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";

export const useAssignmentSubmissions = (assignmentId: string) => {
  return useQuery({
    queryKey: ["submissions", "assignment", assignmentId],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get(`/api/submissions/assignments/${assignmentId}`);
        return data as {
          assignmentId: string;
          assignmentTitle: string;
          submissions: Array<{
            submissionId: string;
            learnerId: string;
            learnerName: string | null;
            status: "submitted" | "graded" | "resubmission_required";
            score: number | null;
            feedback: string | null;
            isLate: boolean;
            submittedAt: string;
          }>;
        };
      } catch (error) {
        const message = extractApiErrorMessage(error, "제출 목록을 불러오지 못했습니다.");
        throw new Error(message);
      }
    },
  });
};


