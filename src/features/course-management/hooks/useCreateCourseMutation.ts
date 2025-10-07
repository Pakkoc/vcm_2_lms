"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";

export type CreateCourseInput = {
  title: string;
  description: string;
  categoryId: string;
  difficultyId: string;
  curriculum?: string;
  maxStudents?: number | null;
};

export const useCreateCourseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCourseInput) => {
      try {
        const payload = {
          title: input.title,
          description: input.description,
          category_id: input.categoryId,
          difficulty_id: input.difficultyId,
          curriculum: input.curriculum ?? undefined,
          max_students: typeof input.maxStudents === "number" && input.maxStudents > 0 ? input.maxStudents : undefined,
        };
        const { data } = await apiClient.post("/api/courses", payload);
        return data as { id: string };
      } catch (error) {
        const message = extractApiErrorMessage(error, "코스를 생성하지 못했습니다.");
        throw new Error(message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "instructor"] });
    },
  });
};