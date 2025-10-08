import type { Hono } from "hono";
import { getSupabase, type AppEnv } from "@/backend/hono/context";
import { respond, success, failure } from "@/backend/http/response";
import { getLatestPublishedTerms } from "@/features/terms/backend/service";
import { ROUTES } from "@/constants/routes";
import { SignupRequestSchema } from "./schema";
import { signup } from "./service";

export const registerAuthOnboardingRoutes = (app: Hono<AppEnv>) => {
  app.get("/auth/health", (c) => respond(c, success({ status: "ok", feature: "auth-onboarding" })));

  app.get("/auth/terms/latest", async (c) => {
    const supabase = getSupabase(c);
    const termsResult = await getLatestPublishedTerms(supabase);
    return respond(c, termsResult);
  });

  app.post("/auth/signup", async (c) => {
    const body = await c.req.json();
    const parsed = SignupRequestSchema.safeParse(body);
    if (!parsed.success) {
      return respond(c, failure(400, "INVALID_SIGNUP_PAYLOAD", "Invalid signup payload.", parsed.error.format()));
    }

    const supabase = getSupabase(c);
    const url = new URL(c.req.url);
    const origin = `${url.protocol}//${url.host}`;
    const nextPath = parsed.data.role === 'instructor' ? ROUTES.instructorProfile : ROUTES.profileSettings;
    const emailRedirectTo = `${origin}${ROUTES.authCallback}?next=${encodeURIComponent(nextPath)}`;

    const result = await signup(supabase, parsed.data, { emailRedirectTo });
    return respond(c, result);
  });
};
