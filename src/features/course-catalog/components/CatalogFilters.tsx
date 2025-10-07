"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CoursesFilter } from "@/features/course-catalog/hooks/useCoursesQuery";
import { useCourseCategories, useDifficultyLevels } from "@/features/course-catalog/hooks/useCatalogTaxonomies";

export type CatalogFiltersProps = {
  filters: CoursesFilter;
  onChange: (next: Partial<CoursesFilter>) => void;
};

export const CatalogFilters = ({ filters, onChange }: CatalogFiltersProps) => {
  const categoriesQuery = useCourseCategories();
  const difficultyQuery = useDifficultyLevels();

  const categoryOptions = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const difficultyOptions = useMemo(() => difficultyQuery.data ?? [], [difficultyQuery.data]);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end">
      <div className="flex-1">
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          검색어
          <Input
            value={filters.search ?? ""}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="코스명을 입력하세요"
          />
        </label>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          카테고리
          <Select
            value={filters.category ?? "ALL"}
            onValueChange={(value) => onChange({ category: value === "ALL" ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          난이도
          <Select
            value={filters.difficulty ?? "ALL"}
            onValueChange={(value) => onChange({ difficulty: value === "ALL" ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              {difficultyOptions.map((difficulty) => (
                <SelectItem key={difficulty.id} value={difficulty.id}>
                  {difficulty.name} (Lv.{difficulty.level})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      <div className="w-full md:w-40">
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          정렬
          <Select value={filters.sort ?? "latest"} onValueChange={(value) => onChange({ sort: value as CoursesFilter["sort"] })}>
            <SelectTrigger>
              <SelectValue placeholder="최신순" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">최신순</SelectItem>
              <SelectItem value="popular">인기순</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>
    </div>
  );
};
