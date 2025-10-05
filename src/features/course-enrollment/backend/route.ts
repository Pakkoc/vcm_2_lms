import type { Hono } from "hono";
import { getSupabase, type AppEnv } from "@/backend/hono/context";
import { respond, success, failure } from "@/backend/http/response";
import { EnrollRequestSchema, UnenrollParamsSchema } from "./schema";
import { enroll, cancelEnrollment } from "./service";

export const registerCourseEnrollmentRoutes = (app: Hono<AppEnv>) => {
  app.get("/enrollments/health", (c) => respond(c, success({ status: "ok", feature: "course-enrollment" })));

  app.post("/enrollments", async (c) => {
    const body = await c.req.json();
    const parsed = EnrollRequestSchema.safeParse(body);
    if (!parsed.success) {
      return respond(c, failure(400, "INVALID_ENROLLMENT", "Invalid enrollment payload", parsed.error.format()));
    }
    const learnerId = c.req.header("x-user-id") ?? "";
    if (!learnerId) {
      return respond(c, failure(401, "UNAUTHORIZED", "Missing user context"));
    }
    const supabase = getSupabase(c);
    const result = await enroll(supabase, learnerId, parsed.data);
    return respond(c, result);
  });

  app.delete("/enrollments/:id", async (c) => {
    const parsed = UnenrollParamsSchema.safeParse({ enrollmentId: c.req.param("id") });
    if (!parsed.success) {
      return respond(c, failure(400, "INVALID_ENROLLMENT_ID", "Invalid enrollment id", parsed.error.format()));
    }
    const learnerId = c.req.header("x-user-id") ?? "";
    if (!learnerId) {
      return respond(c, failure(401, "UNAUTHORIZED", "Missing user context"));
    }
    const supabase = getSupabase(c);
    const result = await cancelEnrollment(supabase, learnerId, parsed.data.enrollmentId);
    return respond(c, result);
  });
};
