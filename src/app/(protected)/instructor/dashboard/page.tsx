"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useInstructorDashboard } from "@/features/instructor-dashboard/hooks/useInstructorDashboard";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import type { UserRole } from "@/constants/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import { notifyError, notifySuccess } from "@/lib/notifications/toast";

export default function InstructorDashboardPage() {
  useRoleGuard({ allowedRoles: ['instructor' as UserRole] });
  const { data, isLoading, error } = useInstructorDashboard();
  const queryClient = useQueryClient();
  const [gradingFor, setGradingFor] = useState<string | null>(null);
  const [mode, setMode] = useState<'grade' | 'resubmission_required'>('grade');
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");

  const formatDateTime = (iso?: string) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const getStatusBadge = (status: string): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
    switch (status) {
      case 'submitted':
        return { label: '제출됨', variant: 'secondary' };
      case 'resubmission_required':
        return { label: '재제출 요청', variant: 'destructive' };
      case 'graded':
        return { label: '채점 완료', variant: 'default' };
      default:
        return { label: status, variant: 'outline' };
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Instructor 대시보드</h1>
      {isLoading && <p className="mt-4 text-sm text-slate-500">로딩 중…</p>}
      {error && <p className="mt-4 text-sm text-red-600">대시보드 로딩 실패</p>}
      {data && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <section className="rounded-lg border border-slate-200 p-4">
            <h2 className="text-lg font-medium">요약</h2>
            <ul className="mt-2 text-sm text-slate-600">
              <li>코스 수: {data.statistics.totalCourses}</li>
              <li>공개 코스: {data.statistics.publishedCourses}</li>
              <li>채점 대기: {data.pendingGrading}</li>
            </ul>
          </section>
          <section className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">최근 제출물</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void queryClient.invalidateQueries({ queryKey: ['dashboard', 'instructor'] })}
              >새로고침</Button>
            </div>
            <ul className="mt-2 space-y-3 text-sm text-slate-600">
              {data.recentSubmissions.map((s: any) => (
                <li key={s.submissionId} className="rounded border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="truncate">
                      <p className="font-medium">[{s.courseTitle}] {s.assignmentTitle}</p>
                      <p className="text-xs text-slate-500">제출 ID {s.submissionId}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {(() => { const b = getStatusBadge(s.status); return (<Badge variant={b.variant}>{b.label}</Badge>); })()}
                      <span className="text-xs text-slate-500">{formatDateTime(s.submittedAt)}</span>
                      <Button size="sm" variant="secondary" onClick={() => { setGradingFor(s.submissionId); setMode('resubmission_required'); setScore(0); setFeedback(''); }}>재제출 요청</Button>
                      <Button size="sm" onClick={() => { setGradingFor(s.submissionId); setMode('grade'); setScore(0); setFeedback(''); }}>채점하기</Button>
                    </div>
                  </div>
                  {gradingFor === s.submissionId ? (
                    <div className="mt-3 space-y-2 rounded bg-slate-50 p-3">
                      {mode === 'grade' ? (
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500">점수</label>
                          <Input type="number" className="h-8 w-20" value={score} onChange={(e) => setScore(Number(e.target.value))} />
                        </div>
                      ) : null}
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">피드백</label>
                        <Textarea rows={2} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={async () => {
                          try {
                            await apiClient.post(`/api/grading/submissions/${s.submissionId}/grade`, { action: mode, score: mode === 'grade' ? Number(score) : 0, feedback });
                            notifySuccess({ title: mode === 'grade' ? '채점 완료' : '재제출 요청 완료' });
                            setGradingFor(null); setFeedback(''); setScore(0);
                            void queryClient.invalidateQueries({ queryKey: ['dashboard', 'instructor'] });
                          } catch (err) {
                            const message = extractApiErrorMessage(err, '처리에 실패했습니다.');
                            notifyError({ title: '오류', description: message });
                          }
                        }}>저장</Button>
                        <Button size="sm" variant="outline" onClick={() => { setGradingFor(null); }}>취소</Button>
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
              {data.recentSubmissions.length === 0 ? (
                <li className="text-slate-500">최근 제출물이 없습니다.</li>
              ) : null}
            </ul>
          </section>
        </div>
      )}
    </main>
  );
}


