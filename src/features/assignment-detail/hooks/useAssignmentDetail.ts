"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { AssignmentDetailResponse } from "@/features/assignment-detail/backend/schema";

export const useAssignmentDetail = (assignmentId: string | null | undefined) =>
  useQuery<AssignmentDetailResponse>({
    queryKey: ["assignment-detail", assignmentId],
    enabled: Boolean(assignmentId),
    queryFn: async () => {
      if (!assignmentId) {
        throw new Error("과제 ID가 필요합니다.");
      }
      try {
        const { data } = await apiClient.get<AssignmentDetailResponse>(`/api/assignments/${assignmentId}`);
        return data;
      } catch (error) {
        const message = extractApiErrorMessage(error, "과제 정보를 불러오지 못했습니다.");
        throw new Error(message);
      }
    },
    staleTime: 60_000,
  });
