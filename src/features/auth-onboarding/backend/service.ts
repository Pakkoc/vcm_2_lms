import type { SupabaseClient } from "@supabase/supabase-js";
import { failure, success, type HandlerResult } from "@/backend/http/response";
import type { Database } from "@/lib/supabase/types";
import { ROLE_REDIRECT_MAP, type UserRole } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { createProfile } from "@/features/user-profiles/backend/service";
import { getLatestPublishedTerms, recordTermsAgreement } from "@/features/terms/backend/service";
import type { SignupRequest } from "./schema";

const EMAIL_ALREADY_USED = "EMAIL_ALREADY_USED" as const;
const PROFILE_WRITE_FAILED = "PROFILE_WRITE_FAILED" as const;
const TERMS_WRITE_FAILED = "TERMS_WRITE_FAILED" as const;
const TERMS_FETCH_FAILED = "TERMS_FETCH_FAILED" as const;
const TERMS_NOT_ACCEPTED = "TERMS_NOT_ACCEPTED" as const;
const AUTH_CREATE_FAILED = "AUTH_CREATE_FAILED" as const;

export type AuthOnboardingError =
  | typeof EMAIL_ALREADY_USED
  | typeof PROFILE_WRITE_FAILED
  | typeof TERMS_WRITE_FAILED
  | typeof TERMS_FETCH_FAILED
  | typeof TERMS_NOT_ACCEPTED
  | typeof AUTH_CREATE_FAILED;

type SignupSuccessPayload = {
  userId: string;
  redirectTo: string;
};

const toUserRole = (role: SignupRequest["role"]): UserRole => {
  if (role === "learner" || role === "instructor") {
    return role;
  }
  return "learner";
};

const resolveRedirectPath = (role: SignupRequest["role"]): string => {
  const normalizedRole = toUserRole(role);
  return ROLE_REDIRECT_MAP[normalizedRole];
};

const isEmailAlreadyUsedError = (error: unknown) => {
  if (!error) {
    return false;
  }

  if (typeof error === "object" && error !== null) {
    const authError = error as { status?: number; message?: string; error_description?: string };
    if (authError.status === 422) {
      return true;
    }
    const message = authError.message ?? authError.error_description;
    if (typeof message === "string") {
      return message.toLowerCase().includes("already registered");
    }
  }

  return false;
};

export const signup = async (
  client: SupabaseClient<Database>,
  payload: SignupRequest,
): Promise<HandlerResult<SignupSuccessPayload, AuthOnboardingError>> => {
  const { email, password, role, name, phone, termsAgreed } = payload;

  if (!termsAgreed) {
    return failure(400, TERMS_NOT_ACCEPTED, "약관에 동의해야 가입을 진행할 수 있습니다.");
  }

  const { data: signUpData, error: signUpError } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, phone, role },
  });

  if (signUpError || !signUpData.user) {
    if (isEmailAlreadyUsedError(signUpError)) {
      return failure(409, EMAIL_ALREADY_USED, "이미 사용 중인 이메일입니다.");
    }
    const message = signUpError?.message ?? "Failed to create auth user";
    return failure(400, AUTH_CREATE_FAILED, message);
  }

  const userId = signUpData.user.id;

  const profileResult = await createProfile(client, {
    userId,
    role: toUserRole(role),
    name,
    phone,
  });

  if (!profileResult.ok) {
    const message = "error" in profileResult ? profileResult.error?.message ?? "" : "";
    return failure(profileResult.status, PROFILE_WRITE_FAILED, message || "Failed to create profile");
  }

  const latestTermsResult = await getLatestPublishedTerms(client);
  if (!latestTermsResult.ok) {
    const message = "error" in latestTermsResult ? latestTermsResult.error?.message ?? "" : "";
    return failure(latestTermsResult.status, TERMS_FETCH_FAILED, message || "Failed to load terms");
  }

  const latestTerms = latestTermsResult.data;

  if (latestTerms) {
    const agreementResult = await recordTermsAgreement(client, {
      userId,
      version: latestTerms.version,
    });

    if (!agreementResult.ok) {
      const message = "error" in agreementResult ? agreementResult.error?.message ?? "" : "";
      return failure(agreementResult.status, TERMS_WRITE_FAILED, message || "Failed to store agreement");
    }
  }

  const redirectTo = role === 'instructor' ? ROUTES.instructorProfile : resolveRedirectPath(role);
  return success({ userId, redirectTo }, 201);
};
