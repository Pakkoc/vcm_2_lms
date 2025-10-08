import { ROUTES } from "./routes";

export const USER_ROLES = ["learner", "instructor", "operator"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_REDIRECT_MAP: Record<UserRole, string> = {
  learner: ROUTES.coursesCatalog,
  instructor: ROUTES.instructorCourses,
  operator: ROUTES.home,
};

export const isSupportedRole = (value: unknown): value is UserRole =>
  typeof value === "string" && USER_ROLES.includes(value as UserRole);
