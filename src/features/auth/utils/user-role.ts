import { ROLE_REDIRECT_MAP, isSupportedRole, type UserRole } from "@/constants/roles";

export const getUserRoleFromMetadata = (
  metadata: Record<string, unknown> | null | undefined,
): UserRole | null => {
  if (!metadata) {
    return null;
  }

  const value = metadata.role;
  if (isSupportedRole(value)) {
    return value;
  }

  return null;
};

export const resolveDefaultRedirect = (role: UserRole | null) => {
  if (!role) {
    return ROLE_REDIRECT_MAP.learner;
  }
  return ROLE_REDIRECT_MAP[role];
};
