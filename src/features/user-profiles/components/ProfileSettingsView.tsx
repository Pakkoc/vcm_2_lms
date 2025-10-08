"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserProfileQuery, useUpdateUserProfileMutation } from "@/features/user-profiles/hooks/useUserProfile";
import type { UpdateProfileInput } from "@/features/user-profiles/backend/schema";
import { ProfileForm } from "@/features/user-profiles/components/ProfileForm";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { notifyError, notifySuccess } from "@/lib/notifications/toast";
import { ROUTES } from "@/constants/routes";
import { getUserRoleFromMetadata } from "@/features/auth/utils/user-role";

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
  const role = getUserRoleFromMetadata(user?.userMetadata ?? null) ?? 'learner';

  const [isEditMode, setIsEditMode] = useState(true);

  useEffect(() => {
    if (profileQuery.data) {
      // 프로필이 존재하는 경우 최초에는 보기 모드로 시작
      setIsEditMode(false);
    }
  }, [profileQuery.data]);

  const defaultValues = useMemo(() => {
    if (!profileQuery.data) {
      // 프로필이 없을 때는 빈 기본값으로 폼을 렌더
      return { name: '', phone: null, bio: '', websiteUrl: '', contactHours: '', yearsOfExperience: undefined, expertise: [], school: '', grade: '', major: '', interests: [] };
    }
    const d = profileQuery.data as any;
    return {
      name: d.name ?? '',
      phone: d.phone ?? null,
      bio: d.bio ?? '',
      websiteUrl: d.website_url ?? '',
      contactHours: d.contact_hours ?? '',
      yearsOfExperience: d.years_of_experience ?? undefined,
      expertise: Array.isArray(d.expertise) ? (d.expertise as string[]) : [],
      school: d.school ?? '',
      grade: d.grade ?? '',
      major: d.major ?? '',
      interests: Array.isArray(d.interests) ? (d.interests as string[]) : [],
    };
  }, [profileQuery.data]);

  const handleSubmit = async (values: UpdateProfileInput) => {
    try {
      await updateProfileMutation.mutateAsync(values);
      notifySuccess({ title: '프로필을 저장했습니다.' });
      onCompleted?.();
      setIsEditMode(false);
      if (redirectOnSuccess) {
        router.push(redirectOnSuccess);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '프로필 저장에 실패했습니다.';
      notifyError({ title: '저장 실패', description: message });
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 relative">
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
      ) : isEditMode ? (
        <ProfileForm
          defaultValues={defaultValues}
          isSubmitting={updateProfileMutation.isPending}
          onSubmit={handleSubmit}
          role={role}
        />
      ) : (
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 p-6">
            <h2 className="mb-4 text-lg font-medium text-slate-900">저장된 프로필</h2>
            <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">이름</dt>
                <dd className="text-sm text-slate-900">{profileQuery.data?.name ?? ''}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">연락처</dt>
                <dd className="text-sm text-slate-900">{profileQuery.data?.phone ?? '-'}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs text-slate-500">자기소개</dt>
                <dd className="text-sm whitespace-pre-wrap text-slate-900">{(profileQuery.data as any)?.bio ?? ''}</dd>
              </div>
              {role === 'instructor' ? (
                <>
                  <div>
                    <dt className="text-xs text-slate-500">웹사이트</dt>
                    <dd className="text-sm text-slate-900">{(profileQuery.data as any)?.website_url ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">연락 가능 시간</dt>
                    <dd className="text-sm text-slate-900">{(profileQuery.data as any)?.contact_hours ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">경력(년)</dt>
                    <dd className="text-sm text-slate-900">{(profileQuery.data as any)?.years_of_experience ?? '-'}</dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-xs text-slate-500">전문 분야</dt>
                    <dd className="text-sm text-slate-900">{Array.isArray((profileQuery.data as any)?.expertise) ? ((profileQuery.data as any)?.expertise as string[]).join(', ') : '-'}</dd>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <dt className="text-xs text-slate-500">학교</dt>
                    <dd className="text-sm text-slate-900">{(profileQuery.data as any)?.school ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">학년</dt>
                    <dd className="text-sm text-slate-900">{(profileQuery.data as any)?.grade ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">전공</dt>
                    <dd className="text-sm text-slate-900">{(profileQuery.data as any)?.major ?? '-'}</dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-xs text-slate-500">관심 분야</dt>
                    <dd className="text-sm text-slate-900">{Array.isArray((profileQuery.data as any)?.interests) ? ((profileQuery.data as any)?.interests as string[]).join(', ') : '-'}</dd>
                  </div>
                </>
              )}
            </dl>
          </section>
          <div className="absolute bottom-4 right-4">
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              수정하기
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end text-xs text-slate-400">
        <span>프로필 정보는 마이페이지에서 언제든 수정할 수 있습니다.</span>
      </div>
    </div>
  );
};
