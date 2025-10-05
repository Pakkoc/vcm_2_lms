"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type {
  CourseCategoryOption,
  CourseDifficultyOption,
} from "@/features/course-catalog/backend/schema";

type CategoriesResponse = { categories: CourseCategoryOption[] };
type DifficultiesResponse = { difficulties: CourseDifficultyOption[] };

export const useCourseCategories = () =>
  useQuery({
    queryKey: ["courses", "categories"],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<CategoriesResponse>("/api/categories");
        return data.categories;
      } catch (error) {
        const message = extractApiErrorMessage(error, "카테고리를 불러오지 못했습니다.");
        throw new Error(message);
      }
    },
    staleTime: 10 * 60_000,
  });

export const useDifficultyLevels = () =>
  useQuery({
    queryKey: ["courses", "difficulty-levels"],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<DifficultiesResponse>("/api/difficulty-levels");
        return data.difficulties;
      } catch (error) {
        const message = extractApiErrorMessage(error, "난이도를 불러오지 못했습니다.");
        throw new Error(message);
      }
    },
    staleTime: 10 * 60_000,
  });
