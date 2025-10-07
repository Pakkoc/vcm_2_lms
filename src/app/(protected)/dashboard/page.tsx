"use client";

import Image from "next/image";
import Link from "next/link";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useLearnerDashboard } from "@/features/learner-dashboard/hooks/useLearnerDashboard";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import type { UserRole } from "@/constants/roles";

type DashboardPageProps = {
  params: Promise<Record<string, never>>;
};

export default function DashboardPage({ params }: DashboardPageProps) {
  useRoleGuard({ allowedRoles: ["learner" as UserRole] });
  void params;
  const { user } = useCurrentUser();
  const { data, isLoading, error } = useLearnerDashboard();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Learner 대시보드</h1>
        <p className="text-slate-500">{user?.email ?? "알 수 없는 사용자"} 님, 오늘도 학습을 이어가 볼까요?</p>
      </header>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <Image
          alt="대시보드"
          src="https://picsum.photos/seed/dashboard/960/420"
          width={960}
          height={420}
          className="h-auto w-full object-cover"
        />
      </div>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 p-4">
          <h2 className="text-lg font-medium">현재 세션</h2>
          <p className="mt-2 text-sm text-slate-500">Supabase 미들웨어가 세션 쿠키를 자동으로 동기화합니다.</p>
        </article>
        <article className="rounded-lg border border-slate-200 p-4">
          <h2 className="text-lg font-medium">보안 체크</h2>
          <p className="mt-2 text-sm text-slate-500">보호된 App Router 세그먼트로 라우팅되며, 로그인 사용자만 접근할 수 있습니다.</p>
        </article>
        <article className="rounded-lg border border-slate-200 p-4">
          <h2 className="text-lg font-medium">내 코스 요약</h2>
          {isLoading ? <p className="mt-2 text-sm text-slate-500">로딩 중…</p> : null}
          {error ? <p className="mt-2 text-sm text-red-600">대시보드 로딩 실패</p> : null}
          {data ? (
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {data.courses.slice(0, 5).map((c: any) => (
                <li key={c.courseId} className="flex items-center justify-between">
                  <span className="truncate">{c.title}</span>
                  <span className="text-xs text-slate-500">진행률 {c.progress}%</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3">
            <Link href="/courses" className="text-sm text-indigo-600 hover:underline">
              코스 보러가기
            </Link>
          </div>
        </article>
        <article className="rounded-lg border border-slate-200 p-4">
          <h2 className="text-lg font-medium">다음 단계</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <Link
              href="/courses"
              className="block rounded-md border border-slate-200 px-3 py-2 text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50"
            >
              코스 탐색 및 과제 확인
            </Link>
            <Link
              href="/learner/grades"
              className="block rounded-md border border-slate-200 px-3 py-2 text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50"
            >
              성적 및 피드백 보기
            </Link>
            <p className="text-xs text-slate-500">과제 상세 페이지는 코스 상세 &gt; 과제 목록에서 진입할 수 있습니다.</p>
          </div>
        </article>
      </section>
    </div>
  );
}