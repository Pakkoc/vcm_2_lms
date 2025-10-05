"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnrollmentButton } from "@/features/course-enrollment/components/EnrollmentButton";
import type { CourseListItem } from "@/features/course-catalog/backend/schema";
import { ROUTES } from "@/constants/routes";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

const getStatusBadgeTone = (status: CourseListItem["status"]) => {
  switch (status) {
    case "published":
      return "default" as const;
    case "archived":
      return "secondary" as const;
    case "draft":
    default:
      return "outline" as const;
  }
};

const formatPublishedAt = (value: string | null | undefined) => {
  if (!value) {
    return "게시 예정";
  }
  return `${formatDistanceToNow(new Date(value), { addSuffix: true, locale: ko })}`;
};

export type CourseCardProps = {
  course: CourseListItem;
};

export const CourseCard = ({ course }: CourseCardProps) => {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              <Link href={`${ROUTES.coursesCatalog}/${course.id}`} className="hover:underline">
                {course.title}
              </Link>
            </CardTitle>
            <p className="text-sm text-slate-500 line-clamp-2">{course.summary ?? "소개가 아직 등록되지 않았습니다."}</p>
          </div>
          <Badge variant={getStatusBadgeTone(course.status)}>{course.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 text-sm text-slate-600">
        <div className="flex gap-3">
          {course.category ? <span className="rounded bg-slate-100 px-2 py-0.5">{course.category.name}</span> : null}
          {course.difficulty ? (
            <span className="rounded bg-slate-100 px-2 py-0.5">난이도 {course.difficulty.level}</span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span>수강생 {course.enrolledCount}명</span>
          {course.maxStudents ? <span>정원 {course.maxStudents}명</span> : <span>정원 제한 없음</span>}
          <span>{formatPublishedAt(course.publishedAt)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="text-xs text-slate-500">
          {course.instructor?.name ? `${course.instructor.name} 강사` : "강사 정보 미제공"}
        </div>
        <EnrollmentButton
          courseId={course.id}
          enrollmentId={course.enrollmentId}
          isEnrolled={course.isEnrolled}
          isFull={course.isFull}
          canEnroll={course.canEnroll}
        />
      </CardFooter>
    </Card>
  );
};
