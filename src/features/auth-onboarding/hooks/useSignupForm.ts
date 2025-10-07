"use client";

import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { notifyError, notifySuccess } from "@/lib/notifications/toast";
import { signupFormSchema, type SignupFormValues } from "@/lib/validation/auth";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useLatestTerms } from "@/features/terms/hooks/useLatestTerms";

export const useSignupForm = () => {
  const searchParams = useSearchParams();
  const roleParam = (searchParams?.get("role") ?? "").toLowerCase();
  const prefilledRole: SignupFormValues["role"] = roleParam === "instructor" ? "instructor" : "learner";

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      role: prefilledRole,
      name: "",
      phone: "",
      termsAgreed: false,
    },
  });

  const router = useRouter();
  const { refresh } = useCurrentUser();
  const latestTermsQuery = useLatestTerms();

  const signupMutation = useMutation({
    mutationFn: async (values: SignupFormValues) => {
      const payload = {
        email: values.email.trim(),
        password: values.password,
        role: values.role,
        name: values.name.trim(),
        phone: values.phone.trim(),
        termsAgreed: values.termsAgreed,
      };

      const { data } = await apiClient.post("/api/auth/signup", payload);
      return data as { userId: string; redirectTo: string };
    },
    onSuccess: async ({ redirectTo }, values) => {
      const supabase = getSupabaseBrowserClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        notifyError({
          title: "자동 로그인에 실패했습니다.",
          description: error.message,
        });
        return;
      }

      await refresh();
      notifySuccess({ title: "회원가입이 완료되었습니다." });
      router.replace(redirectTo);
    },
    onError: (error) => {
      const message = extractApiErrorMessage(error, "회원가입에 실패했습니다.");
      notifyError({ title: "회원가입 실패", description: message });
    },
  });

  const handleSubmit = useCallback(
    (values: SignupFormValues) => {
      signupMutation.mutate(values);
    },
    [signupMutation],
  );

  return {
    form,
    latestTermsQuery,
    handleSubmit,
    isSubmitting: signupMutation.isPending,
  };
};
