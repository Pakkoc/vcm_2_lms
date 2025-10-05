"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { LOGIN_PATH } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import type { UserRole } from "@/constants/roles";
import { getUserRoleFromMetadata, resolveDefaultRedirect } from "@/features/auth/utils/user-role";

type UseRoleGuardOptions = {
  allowedRoles: UserRole[];
  fallbackRoute?: string;
};

export const useRoleGuard = ({ allowedRoles, fallbackRoute = ROUTES.home }: UseRoleGuardOptions) => {
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace(LOGIN_PATH);
      return;
    }

    const role = getUserRoleFromMetadata(user?.userMetadata ?? null);

    if (!role || !allowedRoles.includes(role)) {
      const redirectTarget = fallbackRoute ?? resolveDefaultRedirect(role);
      router.replace(redirectTarget);
    }
  }, [allowedRoles, fallbackRoute, isAuthenticated, isLoading, router, user]);
};
