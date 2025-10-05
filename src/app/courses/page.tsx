"use client";

import { useCallback, useMemo, useState } from "react";
import { useDebounce } from "react-use";
import { Button } from "@/components/ui/button";
import { CatalogFilters } from "@/features/course-catalog/components/CatalogFilters";
import { CourseCard } from "@/features/course-catalog/components/CourseCard";
import type { CourseListResponse } from "@/features/course-catalog/backend/schema";
import { useCoursesQuery, type CoursesFilter } from "@/features/course-catalog/hooks/useCoursesQuery";

const DEFAULT_PAGE_SIZE = 12;

export default function CoursesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<CoursesFilter>({ sort: "latest", page: 1, limit: DEFAULT_PAGE_SIZE });

  useDebounce(
    () => {
      setFilters((prev) => ({ ...prev, search: searchInput.trim() || undefined, page: 1 }));
    },
    300,
    [searchInput],
  );

  const coursesQuery = useCoursesQuery(filters);
  const courseList = coursesQuery.data as CourseListResponse | undefined;

  const totalPages = useMemo(() => {
    if (!courseList) {
      return 1;
    }
    const limit = courseList.limit ?? filters.limit ?? DEFAULT_PAGE_SIZE;
    if (!limit) {
      return 1;
    }
    return Math.max(1, Math.ceil(courseList.total / limit));
  }, [courseList, filters.limit]);

  const handleFilterChange = useCallback(
    (next: Partial<CoursesFilter>) => {
      if (Object.prototype.hasOwnProperty.call(next, "search")) {
        setSearchInput(next.search ?? "");
        return;
      }
      setFilters((prev) => ({ ...prev, ...next, page: next.page ?? prev.page }));
    },
    [],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setFilters((prev) => ({ ...prev, page }));
    },
    [],
  );

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">코스 카탈로그</h1>
        <p className="text-sm text-slate-600">관심 있는 코스를 찾아 수강을 신청할 수 있습니다.</p>
      </header>

      <CatalogFilters filters={{ ...filters, search: searchInput }} onChange={handleFilterChange} />

      {coursesQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: DEFAULT_PAGE_SIZE }).map((_, index) => (
            <div
              key={`course-skeleton-${index}`}
              className="h-48 w-full animate-pulse rounded-lg border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      ) : null}

      {coursesQuery.isError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
          {coursesQuery.error instanceof Error ? coursesQuery.error.message : "코스 목록을 불러오지 못했습니다."}
        </div>
      ) : null}

      {courseList && courseList.items.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          조건에 맞는 코스가 없습니다. 다른 필터를 시도해 보세요.
        </div>
      ) : null}

      {courseList && courseList.items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courseList.items.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : null}

      {courseList && totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={(filters.page ?? 1) === 1 || coursesQuery.isFetching}
            onClick={() => handlePageChange(Math.max(1, (filters.page ?? 1) - 1))}
          >
            이전
          </Button>
          <span className="text-sm text-slate-600">
            {filters.page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={(filters.page ?? 1) === totalPages || coursesQuery.isFetching}
            onClick={() => handlePageChange(Math.min(totalPages, (filters.page ?? 1) + 1))}
          >
            다음
          </Button>
        </div>
      ) : null}
    </main>
  );
}
