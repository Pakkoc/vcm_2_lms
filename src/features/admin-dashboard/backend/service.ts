import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';

type AdminError = 'ACCESS_DENIED' | 'ADMIN_FETCH_FAILED';

export const getAdminDashboard = async (
  client: SupabaseClient,
  operatorId: string,
): Promise<HandlerResult<{ statistics: unknown }, AdminError, unknown>> => {
  try {
    // 권한 확인: profiles.role = 'operator'
    const { data: profile } = await client
      .from('profiles')
      .select('id, role')
      .eq('id', operatorId)
      .maybeSingle();
    if (!profile || profile.role !== 'operator') {
      return failure(403, 'ACCESS_DENIED', 'Operator role required');
    }

    // 간단한 통계 예시: 총 사용자/코스/신고 수
    const [{ count: users }, { count: courses }, { count: reports }] = await Promise.all([
      client.from('auth.users' as any).select('id', { count: 'exact', head: true }) as any,
      client.from('courses').select('id', { count: 'exact', head: true }) as any,
      client.from('reports').select('id', { count: 'exact', head: true }) as any,
    ]);

    return success({ statistics: { users: users ?? 0, courses: courses ?? 0, reports: reports ?? 0 } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return failure(500, 'ADMIN_FETCH_FAILED', message);
  }
};


