import type { SupabaseClient } from "@supabase/supabase-js";
import { failure, success, type HandlerResult } from "@/backend/http/response";
import type { Database, TableRow, UserRole } from "@/lib/supabase/types";

export type UserProfileRecord = TableRow<"profiles">;

export type ProfileServiceError =
  | "PROFILE_WRITE_FAILED"
  | "PROFILE_NOT_FOUND";

type CreateProfilePayload = {
  userId: string;
  role: UserRole;
  name: string;
  phone: string | null;
};

type UpdateProfilePayload = {
  userId: string;
  name?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  // extended optional fields
  bio?: string | null;
  websiteUrl?: string | null;
  contactHours?: string | null;
  yearsOfExperience?: number | null;
  expertise?: string[] | null;
  school?: string | null;
  grade?: string | null;
  major?: string | null;
  interests?: string[] | null;
};

export const createProfile = async (
  client: SupabaseClient<Database>,
  payload: CreateProfilePayload,
): Promise<HandlerResult<UserProfileRecord, ProfileServiceError>> => {
  const { userId, role, name, phone } = payload;

  const { data, error } = await client
    .from("profiles")
    .insert({
      id: userId,
      role,
      name,
      phone,
    })
    .select()
    .maybeSingle();

  if (error || !data) {
    return failure(500, "PROFILE_WRITE_FAILED", error?.message ?? "Failed to create profile");
  }

  return success<UserProfileRecord>(data as UserProfileRecord, 201);
};

export const getProfileByUserId = async (
  client: SupabaseClient<Database>,
  userId: string,
): Promise<HandlerResult<UserProfileRecord, ProfileServiceError>> => {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return failure(500, "PROFILE_WRITE_FAILED", error.message);
  }

  if (!data) {
    return failure(404, "PROFILE_NOT_FOUND", "Profile not found");
  }

  return success<UserProfileRecord>(data as UserProfileRecord);
};

export const updateProfile = async (
  client: SupabaseClient<Database>,
  payload: UpdateProfilePayload,
): Promise<HandlerResult<UserProfileRecord, ProfileServiceError>> => {
  const { userId, name, phone, avatarUrl } = payload;

  const updatePayload: Partial<UserProfileRecord> = {};
  if (typeof name === "string") {
    updatePayload.name = name;
  }
  if (phone !== undefined) {
    updatePayload.phone = phone;
  }
  if (avatarUrl !== undefined) {
    updatePayload.avatar_url = avatarUrl;
  }

  // Support extended fields if present
  const anyPayload = payload as unknown as Record<string, unknown>;
  if (anyPayload.bio !== undefined) (updatePayload as any).bio = anyPayload.bio ?? null;
  if (anyPayload.websiteUrl !== undefined) (updatePayload as any).website_url = anyPayload.websiteUrl ?? null;
  if (anyPayload.contactHours !== undefined) (updatePayload as any).contact_hours = anyPayload.contactHours ?? null;
  if (anyPayload.yearsOfExperience !== undefined) (updatePayload as any).years_of_experience = anyPayload.yearsOfExperience ?? null;
  if (anyPayload.expertise !== undefined) (updatePayload as any).expertise = anyPayload.expertise ?? null;
  if (anyPayload.school !== undefined) (updatePayload as any).school = anyPayload.school ?? null;
  if (anyPayload.grade !== undefined) (updatePayload as any).grade = anyPayload.grade ?? null;
  if (anyPayload.major !== undefined) (updatePayload as any).major = anyPayload.major ?? null;
  if (anyPayload.interests !== undefined) (updatePayload as any).interests = anyPayload.interests ?? null;

  const { data, error } = await client
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId)
    .select()
    .maybeSingle();

  if (error) {
    return failure(500, "PROFILE_WRITE_FAILED", error.message);
  }

  if (!data) {
    return failure(404, "PROFILE_NOT_FOUND", "Profile not found");
  }

  return success<UserProfileRecord>(data as UserProfileRecord);
};
