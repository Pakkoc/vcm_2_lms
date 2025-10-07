"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";

export const useMetadataSeedMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        const { data } = await apiClient.post("/api/admin/metadata/seed");
        return data as { categoriesInserted: number; difficultiesInserted: number };
      } catch (error) {
        const message = extractApiErrorMessage(error, "기본 메타데이터 생성에 실패했습니다.");
        throw new Error(message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["courses", "categories"] });
      void queryClient.invalidateQueries({ queryKey: ["courses", "difficulty-levels"] });
    },
  });
};