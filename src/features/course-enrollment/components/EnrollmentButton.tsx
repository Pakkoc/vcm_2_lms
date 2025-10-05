"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LOGIN_PATH } from "@/constants/auth";
import { getUserRoleFromMetadata } from "@/features/auth/utils/user-role";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useEnrollMutation } from "@/features/course-enrollment/hooks/useEnrollMutation";
import { useCancelEnrollmentMutation } from "@/features/course-enrollment/hooks/useCancelEnrollmentMutation";

export type EnrollmentButtonProps = {
  courseId: string;
  enrollmentId?: string | null;
  canEnroll: boolean;
  isEnrolled: boolean;
  isFull: boolean;
};

export const EnrollmentButton = ({
  courseId,
  enrollmentId,
  canEnroll,
  isEnrolled,
  isFull,
}: EnrollmentButtonProps) => {
  const router = useRouter();
  const { user, isAuthenticated } = useCurrentUser();
  const enrollMutation = useEnrollMutation();
  const cancelMutation = useCancelEnrollmentMutation();

  const role = useMemo(() => getUserRoleFromMetadata(user?.userMetadata ?? null), [user]);

  const handleEnroll = useCallback(() => {
    if (!isAuthenticated) {
      router.push(LOGIN_PATH);
      return;
    }
    enrollMutation.mutate(courseId);
  }, [courseId, enrollMutation, isAuthenticated, router]);

  const handleCancel = useCallback(() => {
    if (!enrollmentId) {
      return;
    }
    cancelMutation.mutate({ enrollmentId, courseId });
  }, [cancelMutation, courseId, enrollmentId]);

  if (isEnrolled) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={cancelMutation.isPending || !enrollmentId}
        onClick={handleCancel}
      >
        {cancelMutation.isPending ? "취소 중..." : "수강 취소"}
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button type="button" size="sm" onClick={handleEnroll}>
        로그인 후 신청
      </Button>
    );
  }

  if (role !== "learner") {
    return (
      <Button type="button" variant="secondary" size="sm" disabled>
        학습자만 신청 가능
      </Button>
    );
  }

  if (isFull) {
    return (
      <Button type="button" variant="secondary" size="sm" disabled>
        정원 마감
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={!canEnroll || enrollMutation.isPending}
      onClick={handleEnroll}
    >
      {enrollMutation.isPending ? "신청 중..." : "수강 신청"}
    </Button>
  );
};
