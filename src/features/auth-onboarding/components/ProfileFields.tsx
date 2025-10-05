"use client";

import { type Control } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { SignupFormValues } from "@/lib/validation/auth";

export type ProfileFieldsProps = {
  control: Control<SignupFormValues>;
  disabled?: boolean;
};

export const ProfileFields = ({ control, disabled = false }: ProfileFieldsProps) => (
  <div className="grid gap-4 md:grid-cols-2">
    <FormField
      control={control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>이름</FormLabel>
          <FormControl>
            <Input
              {...field}
              disabled={disabled}
              placeholder="홍길동"
              autoComplete="name"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="phone"
      render={({ field }) => (
        <FormItem>
          <FormLabel>휴대폰 번호</FormLabel>
          <FormControl>
            <Input
              {...field}
              disabled={disabled}
              placeholder="010-0000-0000"
              inputMode="tel"
              autoComplete="tel"
            />
          </FormControl>
          <FormDescription>하이픈(-)을 포함한 형식을 입력해 주세요.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);
