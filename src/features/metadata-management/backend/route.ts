import type { Hono } from "hono";
import { getSupabase, type AppEnv } from "@/backend/hono/context";
import { respond, success, failure } from "@/backend/http/response";
import { ensureMetadataSeed } from "./service";

const isAllowedRole = (role: string | null) => role === "instructor" || role === "operator";

export const registerMetadataManagementRoutes = (app: Hono<AppEnv>) => {
  app.get("/admin/metadata/health", (c) => respond(c, success({ status: "ok", feature: "metadata-management" })));

  app.post("/admin/metadata/seed", async (c) => {
    const supabase = getSupabase(c);
    const role = c.req.header("x-user-role") ?? null;
    if (!isAllowedRole(role)) {
      return respond(c, failure(403, "FORBIDDEN", "Metadata seed is restricted to instructors or operators."));
    }

    const result = await ensureMetadataSeed(supabase);
    return respond(c, result);
  });
};