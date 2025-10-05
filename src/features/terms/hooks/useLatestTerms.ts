"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { TermsRecord } from "@/features/terms/backend/service";

export const useLatestTerms = () =>
  useQuery({
    queryKey: ["terms", "latest"],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get("/api/auth/terms/latest");
        return (data ?? null) as TermsRecord | null;
      } catch (error) {
        const message = extractApiErrorMessage(error, "최신 약관을 불러오지 못했습니다.");
        throw new Error(message);
      }
    },
    staleTime: 5 * 60_000,
  });
