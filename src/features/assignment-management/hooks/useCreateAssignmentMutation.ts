"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";

type CreateAssignmentInput = {
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  weight: number;
  allowLate: boolean;
  allowResubmission: boolean;
};

export const useCreateAssignmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAssignmentInput) => {
      try {
        const payload = {
          courseId: input.courseId,
          title: input.title,
          description: input.description,
          due_date: input.dueDate,
          weight: input.weight,
          allow_late: input.allowLate,
          allow_resubmission: input.allowResubmission,
        };
        const { data } = await apiClient.post(`/api/assignments`, payload);
        return data as { id: string };
      } catch (error) {
        const message = extractApiErrorMessage(error, "과제를 생성하지 못했습니다.");
        throw new Error(message);
      }
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "instructor"] });
      void queryClient.invalidateQueries({ queryKey: ["course-detail", variables.courseId] });
    },
  });
};