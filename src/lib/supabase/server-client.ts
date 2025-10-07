import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/constants/env";
import type { Database } from "./types";

type WritableCookieStore = Awaited<ReturnType<typeof cookies>> & {
  set?: (options: {
    name: string;
    value: string;
    path?: string;
    expires?: Date;
    maxAge?: number;
    httpOnly?: boolean;
    sameSite?: "lax" | "strict" | "none";
    secure?: boolean;
  }) => void;
};

export const createSupabaseServerClient = async (): Promise<
  SupabaseClient<Database>
> => {
  const cookieStore = (await cookies()) as WritableCookieStore;

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Server Component에서는 cookieStore.set 호출이 제한될 수 있으므로 예외를 무시합니다.
              // 미들웨어/Route Handler에서 세션이 갱신되므로 여기서는 읽기만 해도 충분합니다.
              if (typeof (cookieStore as any).set === "function") {
                (cookieStore as any).set(name, value, options);
              }
            });
          } catch {
            // ignore - Next 15: Server Component에서 쿠키 쓰기 제한
          }
        },
      },
    }
  ) as unknown as SupabaseClient<Database>;
};
