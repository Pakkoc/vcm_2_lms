"use client";

import { type Control } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import type { TermsRecord } from "@/features/terms/backend/service";
import type { SignupFormValues } from "@/lib/validation/auth";

const formatPublishedDate = (value: string | null) => {
  if (!value) {
    return null;
  }
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value));
  } catch (error) {
    return null;
  }
};

type TermsCheckboxProps = {
  control: Control<SignupFormValues>;
  disabled?: boolean;
  terms: TermsRecord | null | undefined;
  isLoading: boolean;
};

export const TermsCheckbox = ({ control, disabled = false, terms, isLoading }: TermsCheckboxProps) => {
  const termsSummary = terms?.title ?? "서비스 이용 약관";
  const formattedDate = formatPublishedDate(terms?.published_at ?? null);

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-4">
      <div className="space-y-1 text-sm">
        <div className="font-medium text-slate-900">약관 동의</div>
        <p className="text-slate-600">
          {isLoading
            ? "최신 약관 정보를 불러오는 중입니다."
            : terms
              ? `${termsSummary}${formattedDate ? ` (게시일 ${formattedDate})` : ""}`
              : "최신 약관 정보를 불러오지 못했습니다."}
        </p>
        {terms?.content ? (
          <details className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <summary className="cursor-pointer text-slate-700">약관 내용 보기</summary>
            <div className="mt-2 whitespace-pre-wrap leading-6">{terms.content}</div>
          </details>
        ) : null}
      </div>
      <FormField
        control={control}
        name="termsAgreed"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  disabled={disabled}
                />
              </FormControl>
              <div className="text-sm text-slate-700">
                <FormLabel className="text-sm font-medium text-slate-900">
                  서비스 이용 약관 및 개인정보 처리방침에 동의합니다.
                </FormLabel>
              </div>
            </div>
            <FormDescription>
              가입을 완료하려면 반드시 약관에 동의해야 합니다.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
