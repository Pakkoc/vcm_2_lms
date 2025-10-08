import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { ROUTES } from '@/constants/routes';
import { env } from '@/constants/env';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const token_hash = url.searchParams.get('token_hash');
  const type = (url.searchParams.get('type') || 'signup') as any;
  const next = url.searchParams.get('next') || ROUTES.home;

  const redirectUrl = new URL(next, url.origin);
  const response = NextResponse.redirect(redirectUrl);

  const cookieStore = await cookies();
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set({ name, value, ...options });
        });
      },
    },
  });

  try {
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    } else if (token_hash) {
      await supabase.auth.verifyOtp({ type, token_hash } as any);
    } else {
      // No server-visible tokens; return minimal client page to post hash tokens
      const html = `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body>
      <div style="font-family:ui-sans-serif,system-ui,-apple-system;display:flex;min-height:60vh;align-items:center;justify-content:center;color:#64748b">인증을 확인하는 중입니다...</div>
      <script>(function(){
        try {
          var params = new URLSearchParams(window.location.search);
          var next = params.get('next') || '/';
          var hash = window.location.hash ? window.location.hash.replace(/^#/, '') : '';
          var hs = new URLSearchParams(hash);
          var at = hs.get('access_token');
          var rt = hs.get('refresh_token');
          if(at && rt){
            fetch(window.location.pathname, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ access_token: at, refresh_token: rt }) })
              .then(function(){ window.location.replace(next); })
              .catch(function(){ window.location.replace('${ROUTES.login}?verifyError=1'); });
          } else {
            window.location.replace('${ROUTES.login}?verifyError=1');
          }
        } catch(e){ window.location.replace('${ROUTES.login}?verifyError=1'); }
      })();</script></body></html>`;
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
  } catch {
    const fallback = new URL(ROUTES.login, url.origin);
    fallback.searchParams.set('verifyError', '1');
    return NextResponse.redirect(fallback);
  }

  return response;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const access_token = body?.access_token as string | undefined;
  const refresh_token = body?.refresh_token as string | undefined;

  if (!access_token || !refresh_token) {
    return NextResponse.json({ ok: false, error: 'MISSING_TOKENS' }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  const cookieStore = await cookies();
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set({ name, value, ...options });
        });
      },
    },
  });

  try {
    await supabase.auth.setSession({ access_token, refresh_token });
  } catch {
    return NextResponse.json({ ok: false, error: 'SET_SESSION_FAILED' }, { status: 400 });
  }

  return res;
}


