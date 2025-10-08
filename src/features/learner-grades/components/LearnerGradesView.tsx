"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLearnerGrades } from "@/features/learner-grades/hooks/useLearnerGrades";

const formatScore = (score: number | null) => {
  if (score === null) {
    return "미채점";
  }
  return `${score}점`;
};

export function LearnerGradesView() {
  const gradesQuery = useLearnerGrades();

  if (gradesQuery.isLoading) {
    return <div className="px-6 py-10 text-sm text-slate-500">성적 정보를 불러오는 중입니다...</div>;
  }

  if (gradesQuery.isError) {
    return (
      <div className="mx-auto max-w-4xl rounded-lg border border-rose-200 bg-rose-50 px-6 py-10 text-sm text-rose-600">
        {gradesQuery.error instanceof Error ? gradesQuery.error.message : "성적 정보를 불러오지 못했습니다."}
      </div>
    );
  }

  const courses = gradesQuery.data?.courses ?? [];

  if (courses.length === 0) {
    return (
      <div className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
        성적을 조회할 수 있는 코스가 없습니다. 코스에 수강 신청 후 과제를 제출해 보세요.
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Learner 성적</p>
        <h1 className="text-3xl font-semibold text-slate-900">내 성적 및 피드백</h1>
        <p className="text-sm text-slate-600">각 코스별로 과제 점수, 진행률, 피드백을 확인할 수 있습니다.</p>
      </header>

      {courses.map((course) => (
        <Card key={course.courseId}>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">{course.courseTitle}</CardTitle>
              <p className="text-sm text-slate-500">평균 점수 {course.averageScore}점 · 진행률 {course.progress}%</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Badge variant="outline">총 배점 {course.totalScore}점</Badge>
              <Badge variant="outline">과제 {course.assignments.length}개</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {course.assignments.length === 0 ? (
              <p className="text-sm text-slate-500">등록된 과제가 없습니다.</p>
            ) : (
              course.assignments.map((assignment, index) => (
                <Fragment key={assignment.assignmentId}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        <Link href={`/learner/assignments/${assignment.assignmentId}`} className="hover:underline">
                          {assignment.assignmentTitle}
                        </Link>
                      </p>
                      <p className="text-xs text-slate-500">배점 {assignment.percentage !== null ? `${assignment.percentage}%` : "미채점"}</p>
                      {assignment.feedbackHtml ? (
                        <p className="mt-2 rounded-md bg-slate-50 p-3 text-sm text-slate-600">{assignment.feedbackHtml}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-start gap-1 text-xs text-slate-500 md:items-end">
                      <Badge variant={assignment.isLate ? "destructive" : "secondary"}>
                        {assignment.isLate ? "지각 제출" : "정시 제출"}
                      </Badge>
                      <span className="text-sm text-slate-700">{formatScore(assignment.score)}</span>
                    </div>
                  </div>
                  {index < course.assignments.length - 1 ? <Separator /> : null}
                </Fragment>
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}