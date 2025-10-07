import type { SupabaseClient } from "@supabase/supabase-js";
import { success, failure, type HandlerResult } from "@/backend/http/response";
import type { Database } from "@/lib/supabase/types";

type MetadataSeedResponse = {
  categoriesInserted: number;
  difficultiesInserted: number;
};

type MetadataSeedError = "METADATA_SEED_FAILED";

const defaultCategories = [
  { name: "프론트엔드", description: "웹 프론트엔드 개발 과정", curriculum: null },
  { name: "백엔드", description: "서버 및 API 개발 과정", curriculum: null },
  { name: "데이터", description: "데이터 분석 및 ML 과정", curriculum: null },
];

const defaultDifficulties = [
  { name: "입문", level: 1, description: "기초를 다지는 단계", curriculum: null },
  { name: "중급", level: 2, description: "실무 역량을 강화하는 단계", curriculum: null },
  { name: "고급", level: 3, description: "심화 프로젝트 중심 단계", curriculum: null },
];

export const ensureMetadataSeed = async (
  client: SupabaseClient<Database>,
): Promise<HandlerResult<MetadataSeedResponse, MetadataSeedError, unknown>> => {
  try {
    const { count: categoryCount, error: categoryCountError } = await client
      .from("categories")
      .select("id", { count: "exact", head: true });
    if (categoryCountError) {
      return failure(500, "METADATA_SEED_FAILED", categoryCountError.message);
    }

    let categoriesInserted = 0;
    if (!categoryCount || categoryCount === 0) {
      const { error } = await client.from("categories").insert(defaultCategories);
      if (error) {
        return failure(500, "METADATA_SEED_FAILED", error.message);
      }
      categoriesInserted = defaultCategories.length;
    }

    const { count: difficultyCount, error: difficultyCountError } = await client
      .from("difficulty_levels")
      .select("id", { count: "exact", head: true });
    if (difficultyCountError) {
      return failure(500, "METADATA_SEED_FAILED", difficultyCountError.message);
    }

    let difficultiesInserted = 0;
    if (!difficultyCount || difficultyCount === 0) {
      const { error } = await client.from("difficulty_levels").insert(defaultDifficulties);
      if (error) {
        return failure(500, "METADATA_SEED_FAILED", error.message);
      }
      difficultiesInserted = defaultDifficulties.length;
    }

    return success({ categoriesInserted, difficultiesInserted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return failure(500, "METADATA_SEED_FAILED", message);
  }
};