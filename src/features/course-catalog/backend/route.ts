import type { Hono } from "hono";
import { getSupabase, type AppEnv } from "@/backend/hono/context";
import { respond, success, failure } from "@/backend/http/response";
import { CourseFiltersSchema } from "./schema";
import { getCourses, getCourseCategories, getDifficultyLevels } from "./service";

export const registerCourseCatalogRoutes = (app: Hono<AppEnv>) => {
  app.get("/courses/health", (c) => respond(c, success({ status: "ok", feature: "course-catalog" })));

  app.get("/courses", async (c) => {
    const url = new URL(c.req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const parsed = CourseFiltersSchema.safeParse(params);
    if (!parsed.success) {
      return respond(c, failure(400, "INVALID_COURSE_FILTERS", "Invalid filters", parsed.error.format()));
    }
    const supabase = getSupabase(c);
    const viewerId = c.req.header("x-user-id") ?? null;
    const result = await getCourses(supabase, parsed.data, { viewerId });
    return respond(c, result);
  });

  app.get("/categories", async (c) => {
    const supabase = getSupabase(c);
    const result = await getCourseCategories(supabase);
    return respond(c, result);
  });

  app.get("/difficulty-levels", async (c) => {
    const supabase = getSupabase(c);
    const result = await getDifficultyLevels(supabase);
    return respond(c, result);
  });
};
