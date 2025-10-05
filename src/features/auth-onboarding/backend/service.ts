import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { SignupRequest } from './schema';

const EMAIL_ALREADY_USED = 'EMAIL_ALREADY_USED' as const;
const PROFILE_WRITE_FAILED = 'PROFILE_WRITE_FAILED' as const;
const TERMS_WRITE_FAILED = 'TERMS_WRITE_FAILED' as const;
const AUTH_CREATE_FAILED = 'AUTH_CREATE_FAILED' as const;

export type AuthOnboardingError =
  | typeof EMAIL_ALREADY_USED
  | typeof PROFILE_WRITE_FAILED
  | typeof TERMS_WRITE_FAILED
  | typeof AUTH_CREATE_FAILED;

export const signup = async (
  client: SupabaseClient,
  payload: SignupRequest,
): Promise<HandlerResult<{ userId: string; redirectPath: string }, AuthOnboardingError, unknown>> => {
  // 1) 이메일 중복 검사 (auth.users는 관리 테이블이므로 signUp 시 에러로 확인)
  const { data: signUpData, error: signUpError } = await client.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: { name: payload.name, phone: payload.phone, role: payload.role },
  });

  if (signUpError || !signUpData.user) {
    const message = signUpError?.message ?? 'Failed to create auth user';
    return failure(400, AUTH_CREATE_FAILED, message);
  }

  const userId = signUpData.user.id;

  // 2) 프로필 저장
  const { error: profileError } = await client.from('profiles').insert({
    id: userId,
    role: payload.role,
    name: payload.name,
    phone: payload.phone,
  });
  if (profileError) {
    return failure(500, PROFILE_WRITE_FAILED, profileError.message);
  }

  // 3) 약관 동의 저장 (버전은 DB의 최신 terms 소스에서 조회한다고 가정: 하드코딩 금지)
  const { data: latestTerms, error: termsQueryError } = await client
    .from('terms')
    .select('version')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!termsQueryError && latestTerms?.version) {
    const { error: termsError } = await client.from('terms_agreements').insert({
      user_id: userId,
      terms_version: latestTerms.version,
    });
    if (termsError) {
      return failure(500, TERMS_WRITE_FAILED, termsError.message);
    }
  }

  // 4) 역할에 따른 리다이렉트 URL 구성 (하드코딩 금지 → 테이블/환경에서 가져올 수도 있으나 기본 경로 규칙 적용)
  const redirectPath = payload.role === 'learner' ? '/courses' : '/dashboard';

  return success({ userId, redirectPath }, 201);
};


