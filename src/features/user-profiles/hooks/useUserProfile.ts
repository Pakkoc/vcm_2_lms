"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage, isAxiosError } from "@/lib/remote/api-client";
import type { UpdateProfileInput } from "@/features/user-profiles/backend/schema";

const PROFILE_QUERY_KEY = ["user", "profile"] as const;

export const useUserProfileQuery = () =>
  useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      try {
        const { data } = await apiClient.get("/api/me/profile");
        return data;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          // 최초 가입 등 프로필 미생성 상태는 에러 대신 null로 처리해 빈 폼을 노출
          return null;
        }
        const message = extractApiErrorMessage(error, "프로필 정보를 불러오지 못했습니다.");
        throw new Error(message);
      }
    },
    staleTime: 60_000,
  });

export const useUpdateUserProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateProfileInput) => {
      try {
        const { data } = await apiClient.put("/api/me/profile", payload);
        return data;
      } catch (error) {
        const message = extractApiErrorMessage(error, "프로필 정보를 수정하지 못했습니다.");
        throw new Error(message);
      }
    },
    onSuccess: (data) => {
      void queryClient.setQueryData(PROFILE_QUERY_KEY, data);
    },
  });
};
