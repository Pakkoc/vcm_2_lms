import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { failure, success, type HandlerResult } from "@/backend/http/response";
import type { Database, TableRow } from "@/lib/supabase/types";

export type TermsRecord = TableRow<"terms">;
export type TermsAgreementRecord = TableRow<"terms_agreements">;

export type TermsServiceError =
  | "TERMS_FETCH_FAILED"
  | "TERMS_WRITE_FAILED";

const isUniqueViolation = (error: PostgrestError | null) => error?.code === "23505";

export const getLatestPublishedTerms = async (
  client: SupabaseClient<Database>,
): Promise<HandlerResult<TermsRecord | null, TermsServiceError>> => {
  const { data, error } = await client
    .from("terms")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return failure(500, "TERMS_FETCH_FAILED", error.message);
  }

  return success(data ?? null);
};

type RecordAgreementPayload = {
  userId: string;
  version: string;
};

export const recordTermsAgreement = async (
  client: SupabaseClient<Database>,
  payload: RecordAgreementPayload,
): Promise<HandlerResult<TermsAgreementRecord, TermsServiceError>> => {
  const { userId, version } = payload;

  const { data, error } = await client
    .from("terms_agreements")
    .insert({
      user_id: userId,
      terms_version: version,
    })
    .select()
    .maybeSingle();

  if (error && !isUniqueViolation(error)) {
    return failure(500, "TERMS_WRITE_FAILED", error.message);
  }

  if (data) {
    return success(data, 201);
  }

  // Unique violation: fetch existing record to confirm agreement
  const { data: existing, error: fetchError } = await client
    .from("terms_agreements")
    .select("*")
    .eq("user_id", userId)
    .eq("terms_version", version)
    .maybeSingle();

  if (fetchError || !existing) {
    return failure(500, "TERMS_WRITE_FAILED", fetchError?.message ?? "Failed to store agreement");
  }

  return success(existing);
};

export const hasAgreedToTerms = async (
  client: SupabaseClient<Database>,
  payload: RecordAgreementPayload,
): Promise<HandlerResult<boolean, TermsServiceError>> => {
  const { userId, version } = payload;

  const { data, error } = await client
    .from("terms_agreements")
    .select("id")
    .eq("user_id", userId)
    .eq("terms_version", version)
    .limit(1)
    .maybeSingle();

  if (error) {
    return failure(500, "TERMS_FETCH_FAILED", error.message);
  }

  return success(Boolean(data));
};
