"use client";

import { ProfileSettingsView } from "@/features/user-profiles/components/ProfileSettingsView";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { ROUTES } from "@/constants/routes";
import { getUserRoleFromMetadata } from "@/features/auth/utils/user-role";

type ProfileSettingsPageProps = {
  params: Promise<Record<string, never>>;
};

export default function ProfileSettingsPage({ params }: ProfileSettingsPageProps) {
  void params;
  const { user } = useCurrentUser();
  const role = getUserRoleFromMetadata(user?.userMetadata ?? null);
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <ProfileSettingsView
        title="마이 프로필"
        description="이름과 연락처를 최신 상태로 유지하면 수강생과 운영 팀이 원활하게 소통할 수 있습니다."
        redirectOnSuccess={role === 'instructor' ? ROUTES.instructorDashboard : ROUTES.learnerDashboard}
      />
    </div>
  );
}
