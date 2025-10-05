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
