import type { Hono } from "hono";
import { getSupabase, type AppEnv } from "@/backend/hono/context";
import { respond, success, failure } from "@/backend/http/response";
import type { UserRole } from "@/constants/roles";
import { CourseDetailParamsSchema } from "./schema";
import { getCourseDetail } from "./service";

export const registerCourseDetailRoutes = (app: Hono<AppEnv>) => {
  app.get("/courses/:courseId", async (c) => {
    const parsed = CourseDetailParamsSchema.safeParse({ courseId: c.req.param("courseId") });
    if (!parsed.success) {
      return respond(c, failure(400, "INVALID_COURSE_ID", "Invalid course id", parsed.error.format()));
    }

    const supabase = getSupabase(c);
    const viewerId = c.req.header("x-user-id") ?? null;
    const viewerRole = (c.req.header("x-user-role") ?? null) as UserRole | null;
    const result = await getCourseDetail(supabase, parsed.data.courseId, { viewerId, viewerRole });
    return respond(c, result);
  });

  app.get("/courses/:courseId/health", (c) =>
    respond(c, success({ status: "ok", feature: "course-detail", courseId: c.req.param("courseId") })),
  );
};
