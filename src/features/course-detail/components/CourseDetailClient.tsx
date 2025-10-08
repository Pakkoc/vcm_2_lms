"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EnrollmentButton } from "@/features/course-enrollment/components/EnrollmentButton";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import { notifyError, notifySuccess } from "@/lib/notifications/toast";
import { useCourseDetail } from "@/features/course-detail/hooks/useCourseDetail";
import type { CourseDetailResponse } from "@/features/course-detail/backend/schema";
import { ROUTES } from "@/constants/routes";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useAssignmentSubmissions } from "@/features/submission-history/hooks/useAssignmentSubmissions";
import { useGradeSubmissionMutation } from "@/features/submission-grading/hooks/useGradeSubmissionMutation";

const SectionTitle = ({ title }: { title: string }) => (
  <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
);

const DetailSummary = ({ course }: Pick<CourseDetailResponse, "course">) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-2xl font-bold">{course.title}</CardTitle>
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Badge variant={course.status === "published" ? "default" : course.status === "archived" ? "secondary" : "outline"}>
          {course.status}
        </Badge>
        {course.category ? <span>{course.category.name}</span> : null}
        {course.difficulty ? <span>난이도 {course.difficulty.level}</span> : null}
        {course.publishedAt ? <span>게시일 {new Date(course.publishedAt).toLocaleDateString()}</span> : null}
      </div>
    </CardHeader>
    <CardContent className="space-y-4 text-sm text-slate-600">
      <p>{course.summary ?? "코스 요약이 아직 제공되지 않았습니다."}</p>
      {course.description ? (
        <section className="space-y-2">
          <SectionTitle title="코스 소개" />
          <p className="whitespace-pre-wrap leading-6">{course.description}</p>
        </section>
      ) : null}
      {course.curriculum ? (
        <section className="space-y-2">
          <SectionTitle title="커리큘럼" />
          <p className="whitespace-pre-wrap leading-6">{course.curriculum}</p>
        </section>
      ) : null}
    </CardContent>
  </Card>
);

const InstructorSummary = ({ instructor }: Pick<CourseDetailResponse, "instructor">) => {
  const initial = (instructor.name ?? "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">강사 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600">
        <div className="flex items-center gap-3">
          <Avatar>
            {instructor.avatarUrl ? (
              <AvatarImage src={instructor.avatarUrl} alt={instructor.name ?? "instructor"} />
            ) : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="font-medium text-slate-800">{instructor.name ?? "이름 미공개"}</p>
            {instructor.websiteUrl ? (
              <a href={instructor.websiteUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                웹사이트 방문
              </a>
            ) : null}
          </div>
        </div>

        {instructor.bio ? (
          <div>
            <p className="text-xs text-slate-500">소개</p>
            <p className="whitespace-pre-wrap leading-6">{instructor.bio}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {typeof instructor.yearsOfExperience === 'number' ? (
            <div>
              <p className="text-xs text-slate-500">경력(년)</p>
              <p className="text-slate-800">{instructor.yearsOfExperience}</p>
            </div>
          ) : null}
          {instructor.contactHours ? (
            <div>
              <p className="text-xs text-slate-500">연락 가능 시간</p>
              <p className="text-slate-800">{instructor.contactHours}</p>
            </div>
          ) : null}
        </div>

        {Array.isArray(instructor.expertise) && instructor.expertise.length > 0 ? (
          <div>
            <p className="text-xs text-slate-500">전문 분야</p>
            <p className="text-slate-800">{instructor.expertise.join(', ')}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

const CourseMetrics = ({ metrics }: Pick<CourseDetailResponse, "metrics">) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-xl">코스 현황</CardTitle>
    </CardHeader>
    <CardContent className="grid gap-2 text-sm text-slate-600">
      <p>수강생: {metrics.enrolledCount}명</p>
      <p>정원: {typeof metrics.capacity === "number" ? `${metrics.capacity}명` : "제한 없음"}</p>
      <p className={metrics.isFull ? "text-rose-600" : "text-emerald-600"}>
        {metrics.isFull ? "정원이 가득 찼습니다." : "신청 가능 좌석이 있습니다."}
      </p>
    </CardContent>
  </Card>
);

const AssignmentList = ({ assignments, isOwner, onChanged }: Pick<CourseDetailResponse, "assignments"> & { isOwner: boolean; onChanged: () => void }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-xl">과제 목록</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {assignments.length === 0 ? (
        <p className="text-sm text-slate-500">등록된 과제가 없습니다.</p>
      ) : (
        assignments.map((assignment) => (
          <div key={assignment.id} className="space-y-1 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-slate-800">
                {isOwner ? (
                  <span title="학습자 전용 화면입니다">{assignment.title}</span>
                ) : (
                  <Link href={`/learner/assignments/${assignment.id}`} className="hover:underline">
                    {assignment.title}
                  </Link>
                )}
              </p>
              <Badge variant={assignment.status === "published" ? "default" : assignment.status === "closed" ? "secondary" : "outline"}>
                {assignment.status}
              </Badge>
            </div>
            <p>마감일: {new Date(assignment.dueDate).toLocaleString()}</p>
            <p>지각 제출 {assignment.allowLate ? "허용" : "불가"}</p>
            <p>재제출 {assignment.allowResubmission ? "허용" : "불가"}</p>
            {isOwner ? (
              <div className="pt-2">
                {assignment.status !== "published" ? (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await apiClient.patch(`/api/assignments/${assignment.id}/status`, { status: "published" });
                        notifySuccess({ title: "과제를 게시했습니다." });
                        onChanged();
                      } catch (error) {
                        const message = extractApiErrorMessage(error, "과제를 게시하지 못했습니다.");
                        notifyError({ title: "게시 실패", description: message });
                      }
                    }}
                    className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700"
                  >
                    게시하기
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await apiClient.patch(`/api/assignments/${assignment.id}/status`, { status: "closed" });
                        notifySuccess({ title: "과제를 마감했습니다." });
                        onChanged();
                      } catch (error) {
                        const message = extractApiErrorMessage(error, "과제를 마감하지 못했습니다.");
                        notifyError({ title: "마감 실패", description: message });
                      }
                    }}
                    className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-50"
                  >
                    마감하기
                  </button>
                )}
              </div>
            ) : null}
            <Separator className="my-2" />
          </div>
        ))
      )}
    </CardContent>
  </Card>
);

export type CourseDetailClientProps = {
  courseId: string;
};

export const CourseDetailClient = ({ courseId }: CourseDetailClientProps) => {
  const detailQuery = useCourseDetail(courseId);
  const { user } = useCurrentUser();

  const enrollmentProps = useMemo(() => {
    const data = detailQuery.data;
    if (!data) {
      return null;
    }
    return {
      courseId: data.course.id,
      enrollmentId: data.viewer.enrollmentId,
      isEnrolled: data.viewer.isEnrolled,
      isFull: data.metrics.isFull,
      canEnroll: data.viewer.canEnroll,
    } as const;
  }, [detailQuery.data]);

  if (detailQuery.isLoading) {
    return <div className="px-6 py-12 text-sm text-slate-500">코스 정보를 불러오는 중입니다...</div>;
  }

  if (detailQuery.isError) {
    return (
      <div className="mx-auto max-w-4xl rounded-lg border border-rose-200 bg-rose-50 px-6 py-12 text-sm text-rose-600">
        {detailQuery.error instanceof Error ? detailQuery.error.message : "코스 정보를 불러오지 못했습니다."}
      </div>
    );
  }

  if (!detailQuery.data) {
    return (
      <div className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
        코스를 찾을 수 없습니다. <Link href={ROUTES.coursesCatalog} className="text-indigo-600 underline">카탈로그로 돌아가기</Link>
      </div>
    );
  }

  const data = detailQuery.data;
  const isOwner = Boolean(data && (data.viewer.isOwner || (user?.id && data.instructor.id === user.id)));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">코스 상세</p>
          <h1 className="text-3xl font-semibold text-slate-900">{data.course.title}</h1>
        </div>
        {enrollmentProps ? <EnrollmentButton {...enrollmentProps} /> : null}
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <DetailSummary course={data.course} />
          <AssignmentList
            assignments={data.assignments}
            isOwner={isOwner}
            onChanged={() => {
              void detailQuery.refetch();
            }}
          />
          {isOwner ? (
            <div className="space-y-4">
              {data.assignments.map((a) => (
                <AssignmentSubmissionsPanel key={a.id} assignmentId={a.id} assignmentTitle={a.title} />
              ))}
            </div>
          ) : null}
        </div>
        <div className="space-y-6">
          <InstructorSummary instructor={data.instructor} />
          <CourseMetrics metrics={data.metrics} />
        </div>
      </div>
    </div>
  );
};

function AssignmentSubmissionsPanel({ assignmentId, assignmentTitle }: { assignmentId: string; assignmentTitle: string }) {
  const list = useAssignmentSubmissions(assignmentId);
  const gradeMutation = useGradeSubmissionMutation();
  const [scoreMap, setScoreMap] = useState<Record<string, number>>({});
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">제출물 · {assignmentTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-600">
        {list.isLoading ? (
          <p>제출 목록을 불러오는 중…</p>
        ) : list.isError ? (
          <p className="text-rose-600">{list.error instanceof Error ? list.error.message : "목록 로딩 실패"}</p>
        ) : (list.data?.submissions?.length ?? 0) === 0 ? (
          <p>제출물이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {list.data!.submissions.map((s) => (
              <li key={s.submissionId} className="flex flex-col gap-2 rounded border border-slate-200 p-2 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-800">{s.learnerName ?? s.learnerId.slice(0, 8)}</span>
                  <span className="text-xs text-slate-500">상태 {s.status} · 제출일 {new Date(s.submittedAt).toLocaleString()}</span>
                  {typeof s.score === 'number' ? (
                    <span className="text-xs text-slate-500">점수 {s.score}점</span>
                  ) : null}
                  {s.feedback ? (
                    <span className="text-xs text-slate-500">피드백 {s.feedback}</span>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-end">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500">점수</label>
                    <Input
                      type="number"
                      className="h-8 w-20"
                      value={scoreMap[s.submissionId] ?? 0}
                      onChange={(e) => setScoreMap((m) => ({ ...m, [s.submissionId]: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="md:w-64">
                    <label className="text-xs text-slate-500">피드백</label>
                    <Textarea
                      rows={1}
                      value={feedbackMap[s.submissionId] ?? ''}
                      onChange={(e) => setFeedbackMap((m) => ({ ...m, [s.submissionId]: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        await gradeMutation.mutateAsync({ submissionId: s.submissionId, action: 'grade', score: Number(scoreMap[s.submissionId] ?? 0), feedback: (feedbackMap[s.submissionId] ?? '').trim() });
                        void list.refetch();
                      }}
                    >채점</Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        await gradeMutation.mutateAsync({ submissionId: s.submissionId, action: 'resubmission_required', feedback: (feedbackMap[s.submissionId] ?? '').trim() });
                        void list.refetch();
                      }}
                    >재제출 요청</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
