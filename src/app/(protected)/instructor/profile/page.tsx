"use client";

import { InstructorProfileSetup } from "@/features/user-profiles/components/InstructorProfileSetup";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import type { UserRole } from "@/constants/roles";

type InstructorProfilePageProps = {
  params: Promise<Record<string, never>>;
};

export default function InstructorProfilePage({ params }: InstructorProfilePageProps) {
  useRoleGuard({ allowedRoles: ['instructor' as UserRole] });
  void params;
  return <InstructorProfileSetup />;
}
