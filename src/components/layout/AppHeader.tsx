"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getUserRoleFromMetadata, resolveDefaultRedirect } from "@/features/auth/utils/user-role";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export function AppHeader() {
  const router = useRouter();
  const { isAuthenticated, user, refresh, isLoading } = useCurrentUser();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const role = getUserRoleFromMetadata(user?.userMetadata ?? null);
  const dashboardHref =
    role === "instructor"
      ? ROUTES.instructorDashboard
      : role === "learner"
        ? ROUTES.learnerDashboard
        : resolveDefaultRedirect(role);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      await refresh();
      router.replace(ROUTES.login);
    } catch (error) {
      console.error("Failed to sign out", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={ROUTES.home} className="text-sm font-semibold text-slate-900">
          VibeMafia LMS
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href={ROUTES.coursesCatalog} className="text-slate-600 hover:text-slate-900">
            카탈로그
          </Link>
          {role === "learner" ? (
            <Link href={ROUTES.learnerGrades} className="text-slate-600 hover:text-slate-900">
              성적
            </Link>
          ) : null}
          {role === "instructor" ? (
            <Link href={ROUTES.instructorCourses} className="text-slate-600 hover:text-slate-900">
              강사 센터
            </Link>
          ) : null}
          {isAuthenticated ? (
            <>
              <Link
                href={ROUTES.profileSettings}
                className="rounded border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-50"
              >
                프로필
              </Link>
              <span className="hidden text-slate-500 sm:inline">{user?.email}</span>
              <Link
                href={dashboardHref}
                className="rounded border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-50"
              >
                대시보드
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut || isLoading}
                className="rounded bg-slate-900 px-3 py-1 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSigningOut ? "로그아웃 중" : "로그아웃"}
              </button>
            </>
          ) : (
            <>
              <Link
                href={ROUTES.login}
                className="rounded border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-50"
              >
                로그인
              </Link>
              <Link
                href={ROUTES.signup}
                className="rounded bg-slate-900 px-3 py-1 text-white hover:bg-slate-800"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
