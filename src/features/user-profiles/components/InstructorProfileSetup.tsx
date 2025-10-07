"use client";

import { useRouter } from "next/navigation";
import { ProfileSettingsView } from "@/features/user-profiles/components/ProfileSettingsView";
import { ROUTES } from "@/constants/routes";

export const InstructorProfileSetup = () => {
  const router = useRouter();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12">
      <ProfileSettingsView
        title="강사 프로필 설정"
        description="강의 개설 전에 기본 프로필 정보를 완료해 주세요. 입력한 정보는 수강생에게 노출됩니다."
        redirectOnSuccess={ROUTES.instructorDashboard}
        onCompleted={() => {
          router.prefetch(ROUTES.instructorDashboard);
        }}
      />
      <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-sm text-slate-600">
        <h2 className="text-sm font-semibold text-indigo-700">TIP</h2>
        <p className="mt-2">
          프로필은 마이페이지에서도 언제든 변경할 수 있습니다. 이름은 강의 카드와 제출물에 표시되며, 연락처는 운영팀만 확인할 수 있습니다.
        </p>
      </div>
    </div>
  );
};
