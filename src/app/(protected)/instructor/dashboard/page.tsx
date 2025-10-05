'use client';

import { useInstructorDashboard } from '@/features/instructor-dashboard/hooks/useInstructorDashboard';

export default function InstructorDashboardPage() {
  const { data, isLoading, error } = useInstructorDashboard();

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
            <h2 className="text-lg font-medium">최근 제출물</h2>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {data.recentSubmissions.map((s: any) => (
                <li key={s.submissionId} className="truncate">
                  [{s.courseTitle}] {s.assignmentTitle}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </main>
  );
}


