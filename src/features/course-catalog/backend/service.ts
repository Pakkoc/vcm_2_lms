import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { CourseFilters, CourseSummary } from './schema';

type CatalogError = 'CATALOG_FETCH_FAILED';

export const getCourses = async (
  client: SupabaseClient,
  filters: CourseFilters,
): Promise<HandlerResult<{ items: CourseSummary[]; total: number }, CatalogError, unknown>> => {
  try {
    // Base query: published courses only for catalog
    let query = client
      .from('courses')
      .select('id, title, summary, thumbnail_url, enrolled_count, status', { count: 'exact' })
      .eq('status', 'published');

    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }
    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }
    if (filters.difficulty) {
      query = query.eq('difficulty_id', filters.difficulty);
    }

    if (filters.sort === 'popular') {
      query = query.order('enrolled_count', { ascending: false });
    } else {
      query = query.order('published_at', { ascending: false });
    }

    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) {
      return failure(500, 'CATALOG_FETCH_FAILED', error.message);
    }

    const items: CourseSummary[] = (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      summary: row.summary ?? null,
      thumbnailUrl: row.thumbnail_url ?? null,
      enrolledCount: Number(row.enrolled_count ?? 0),
      status: row.status,
    }));

    return success({ items, total: count ?? 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return failure(500, 'CATALOG_FETCH_FAILED', message);
  }
};


