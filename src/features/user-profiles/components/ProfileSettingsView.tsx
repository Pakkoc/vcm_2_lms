"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUserProfileQuery, useUpdateUserProfileMutation } from "@/features/user-profiles/hooks/useUserProfile";
import type { UpdateProfileInput } from "@/features/user-profiles/backend/schema";
import { ProfileForm } from "@/features/user-profiles/components/ProfileForm";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { notifyError, notifySuccess } from "@/lib/notifications/toast";
import { ROUTES } from "@/constants/routes";

export type ProfileSettingsViewProps = {
  title?: string;
  description?: string;
  onCompleted?: () => void;
  primaryActionLabel?: string;
  redirectOnSuccess?: string | null;
};

export const ProfileSettingsView = ({
  title = '프로필 설정',
  description = '서비스 이용을 위한 기본 프로필 정보를 관리할 수 있습니다.',
  onCompleted,
  primaryActionLabel,
  redirectOnSuccess,
}: ProfileSettingsViewProps) => {
  const { user } = useCurrentUser();
  const router = useRouter();

  const profileQuery = useUserProfileQuery();
  const updateProfileMutation = useUpdateUserProfileMutation();

  const defaultValues = useMemo(() => {
    if (!profileQuery.data) {
      return { name: '', phone: null };
    }
    return {
      name: profileQuery.data.name ?? '',
      phone: profileQuery.data.phone ?? null,
    };
  }, [profileQuery.data]);

  const handleSubmit = async (values: UpdateProfileInput) => {
    try {
      await updateProfileMutation.mutateAsync(values);
      notifySuccess({ title: '프로필을 저장했습니다.' });
      onCompleted?.();
      if (redirectOnSuccess) {
        router.push(redirectOnSuccess);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '프로필 저장에 실패했습니다.';
      notifyError({ title: '저장 실패', description: message });
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600">{description}</p>
        {user?.email ? <p className="text-xs text-slate-400">이메일: {user.email}</p> : null}
      </header>

      {profileQuery.isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">프로필 정보를 불러오는 중입니다...</div>
      ) : profileQuery.isError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
          {profileQuery.error instanceof Error ? profileQuery.error.message : '프로필 정보를 불러오지 못했습니다.'}
        </div>
      ) : (
        <ProfileForm
          defaultValues={defaultValues}
          isSubmitting={updateProfileMutation.isPending}
          onSubmit={handleSubmit}
        />
      )}

      <div className="flex items-center justify-end text-xs text-slate-400">
        <span>프로필 정보는 마이페이지에서 언제든 수정할 수 있습니다.</span>
      </div>
    </div>
  );
};
