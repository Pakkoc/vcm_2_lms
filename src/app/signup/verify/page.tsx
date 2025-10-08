'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

export default function SignupVerifyPage() {
  const params = useSearchParams();
  const email = params?.get('email') || '';

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-3 text-2xl font-semibold">이메일 인증이 필요합니다</h1>
      <p className="mb-6 text-muted-foreground">
        {email ? (
          <>
            <strong>{email}</strong> 에 전송된 메일의 인증 링크를 클릭해주세요.
          </>
        ) : (
          <>가입 시 입력한 이메일로 전송된 인증 링크를 클릭해주세요.</>
        )}
      </p>
      <p className="mb-10 text-sm text-muted-foreground">
        인증 후 자동으로 프로필 설정 페이지로 이동합니다.
      </p>
      <Link href={ROUTES.login} className="text-primary underline">
        로그인 페이지로 돌아가기
      </Link>
    </div>
  );
}


