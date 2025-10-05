import { redirect } from "next/navigation";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { loadCurrentUser } from "@/features/auth/server/load-current-user";
import { getUserRoleFromMetadata, resolveDefaultRedirect } from "@/features/auth/utils/user-role";
import { SignupForm } from "@/features/auth-onboarding/components/SignupForm";

const signupHighlights = [
  {
    title: "역할 기반 온보딩",
    description: "Learner와 Instructor 역할에 맞춘 대시보드와 권한이 자동으로 구성됩니다.",
  },
  {
    title: "약관 동의 이력 관리",
    description: "버전 관리되는 약관 동의 기록을 안전하게 저장합니다.",
  },
  {
    title: "즉시 로그인",
    description: "가입과 동시에 세션이 생성되어 학습을 바로 시작할 수 있습니다.",
  },
] as const;

const FeatureList = () => (
  <ul className="space-y-4">
    {signupHighlights.map((item) => (
      <li key={item.title} className="rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
        <p className="mt-1 text-sm text-slate-600">{item.description}</p>
      </li>
    ))}
  </ul>
);

export default async function SignupPage() {
  const currentUser = await loadCurrentUser();

  if (currentUser.status === "authenticated") {
    const role = getUserRoleFromMetadata(currentUser.user.userMetadata ?? null);
    redirect(resolveDefaultRedirect(role));
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl gap-10 px-6 py-16 md:grid-cols-[1fr,1.1fr]">
      <section className="space-y-6">
        <header className="space-y-3">
          <p className="text-sm font-semibold text-indigo-600">Sign up</p>
          <h1 className="text-3xl font-bold text-slate-900">계정을 생성하고 학습을 시작하세요</h1>
          <p className="text-sm text-slate-600">
            이메일을 인증하면 역할에 따라 맞춤화된 학습 및 코스 관리 도구를 바로 사용할 수 있습니다.
          </p>
        </header>
        <FeatureList />
        <p className="text-xs text-slate-500">
          이미 계정이 있으시면 <Link href={ROUTES.login} className="font-medium text-slate-900 underline">로그인</Link>으로 이동하세요.
        </p>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <SignupForm />
      </section>
    </main>
  );
}
