import axios, { AxiosHeaders, isAxiosError } from "axios";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { getUserRoleFromMetadata } from "@/features/auth/utils/user-role";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  headers: {
    "Content-Type": "application/json",
  },
});

if (typeof window !== "undefined") {
  apiClient.interceptors.request.use(async (config) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (user) {
        const headers = AxiosHeaders.from(config.headers ?? {});
        headers.set("x-user-id", user.id);
        const role = getUserRoleFromMetadata(user.user_metadata ?? null);
        if (role) {
          headers.set("x-user-role", role);
        }
        config.headers = headers;
      }
    } catch (error) {
      // 인터셉터에서 오류가 발생해도 요청을 계속 진행합니다.
    }
    return config;
  });
}

type ErrorPayload = {
  error?: {
    message?: string;
  };
  message?: string;
};

export const extractApiErrorMessage = (
  error: unknown,
  fallbackMessage = "API request failed.",
) => {
  if (isAxiosError(error)) {
    const payload = error.response?.data as ErrorPayload | undefined;

    if (typeof payload?.error?.message === "string") {
      return payload.error.message;
    }

    if (typeof payload?.message === "string") {
      return payload.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

export { apiClient, isAxiosError };
