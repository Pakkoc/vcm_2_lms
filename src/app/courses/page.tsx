'use client';

import { useState } from 'react';
import { useCoursesQuery } from '@/features/course-catalog/hooks/useCoursesQuery';

export default function CoursesPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useCoursesQuery({ search, sort: 'latest' });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold">코스 카탈로그</h1>
      <div className="mt-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="검색어를 입력하세요"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {isLoading && <p className="mt-4 text-sm text-slate-500">로딩 중…</p>}
      {error && <p className="mt-4 text-sm text-red-600">목록 로딩 실패</p>}
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {(data?.items ?? []).map((c: any) => (
          <li key={c.id} className="rounded-lg border border-slate-200 p-4">
            <div className="text-base font-medium">{c.title}</div>
            <div className="mt-1 line-clamp-2 text-sm text-slate-600">
              {c.summary ?? '설명이 없습니다.'}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}


