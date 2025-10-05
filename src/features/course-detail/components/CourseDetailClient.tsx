"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EnrollmentButton } from "@/features/course-enrollment/components/EnrollmentButton";
import { useCourseDetail } from "@/features/course-detail/hooks/useCourseDetail";
import type { CourseDetailResponse } from "@/features/course-detail/backend/schema";
import { ROUTES } from "@/constants/routes";

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

const InstructorSummary = ({ instructor }: Pick<CourseDetailResponse, "instructor">) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-xl">강사 정보</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm text-slate-600">
      <p className="font-medium text-slate-800">{instructor.name ?? "이름 미공개"}</p>
      <p>강사 프로필은 추후 업데이트될 예정입니다.</p>
    </CardContent>
  </Card>
);

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

const AssignmentList = ({ assignments }: Pick<CourseDetailResponse, "assignments">) => (
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
              <p className="font-medium text-slate-800">{assignment.title}</p>
              <Badge variant={assignment.status === "published" ? "default" : assignment.status === "closed" ? "secondary" : "outline"}>
                {assignment.status}
              </Badge>
            </div>
            <p>마감일: {new Date(assignment.dueDate).toLocaleString()}</p>
            <p>지각 제출 {assignment.allowLate ? "허용" : "불가"}</p>
            <p>재제출 {assignment.allowResubmission ? "허용" : "불가"}</p>
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
          <AssignmentList assignments={data.assignments} />
        </div>
        <div className="space-y-6">
          <InstructorSummary instructor={data.instructor} />
          <CourseMetrics metrics={data.metrics} />
        </div>
      </div>
    </div>
  );
};
