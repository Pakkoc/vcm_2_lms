"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { AlertCircle, BookOpenCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAssignmentDetail } from "@/features/assignment-detail/hooks/useAssignmentDetail";
import { AssignmentSubmissionForm } from "@/features/assignment-detail/components/AssignmentSubmissionForm";

const formatDueDate = (value: string) => {
  try {
    return format(new Date(value), "PPP p", { locale: ko });
  } catch (error) {
    return value;
  }
};

export type AssignmentDetailViewProps = {
  assignmentId: string;
};

export function AssignmentDetailView({ assignmentId }: AssignmentDetailViewProps) {
  const detailQuery = useAssignmentDetail(assignmentId);

  if (detailQuery.isLoading) {
    return <div className="px-6 py-10 text-sm text-slate-500">과제 정보를 불러오는 중입니다...</div>;
  }

  if (detailQuery.isError) {
    return (
      <div className="mx-auto max-w-4xl rounded-lg border border-rose-200 bg-rose-50 px-6 py-10 text-sm text-rose-600">
        {detailQuery.error instanceof Error ? detailQuery.error.message : "과제 정보를 불러오지 못했습니다."}
      </div>
    );
  }

  if (!detailQuery.data) {
    return (
      <div className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
        과제를 찾을 수 없습니다.
      </div>
    );
  }

  const { assignment, submission, canSubmit, policies } = detailQuery.data;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">과제 상세</p>
        <h1 className="text-3xl font-semibold text-slate-900">{assignment.title}</h1>
      </header>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-xl font-semibold">과제 안내</CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Badge variant="outline">마감 {formatDueDate(assignment.dueDate)}</Badge>
              <Badge variant="outline">배점 {assignment.weight}</Badge>
              <Badge variant="outline">지각 제출 {policies.allowLate ? "허용" : "불가"}</Badge>
              <Badge variant="outline">재제출 {policies.allowResubmission ? "허용" : "불가"}</Badge>
              <Badge variant="secondary">상태 {assignment.status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-slate-600">
          <p className="whitespace-pre-wrap">{assignment.description}</p>
          <Separator />
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
            <p className="font-medium text-slate-700">제출 정책 요약</p>
            <ul className="mt-2 space-y-1">
              <li>마감일: {formatDueDate(assignment.dueDate)}</li>
              <li>{policies.allowLate ? "마감 후 지각 제출이 허용됩니다." : "마감 후 제출은 허용되지 않습니다."}</li>
              <li>{policies.allowResubmission ? "재제출이 허용되며, 최근 제출이 평가됩니다." : "재제출은 허용되지 않습니다."}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpenCheck className="h-5 w-5" /> 제출 현황
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          {submission ? (
            <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline">제출 ID {submission.id}</Badge>
                <Badge variant="secondary">상태 {submission.status ?? "확인 중"}</Badge>
                {submission.isLate ? <Badge variant="destructive">지각 제출</Badge> : null}
              </div>
              {submission.status === "resubmission_required" ? (
                <p className="text-sm text-amber-600">강사가 재제출을 요청했습니다. 새로운 내용을 제출해 주세요.</p>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              <AlertCircle className="h-5 w-5 text-slate-400" />
              아직 제출 기록이 없습니다. 제출 폼을 작성해 과제를 등록해 보세요.
            </div>
          )}

          <AssignmentSubmissionForm
            assignmentId={assignment.id}
            canSubmit={canSubmit}
            hasSubmission={Boolean(submission)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
