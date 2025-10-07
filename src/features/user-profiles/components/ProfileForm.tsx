"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { UpdateProfileInput } from "@/features/user-profiles/backend/schema";
import { UpdateProfileSchema } from "@/features/user-profiles/backend/schema";

export type ProfileFormProps = {
  defaultValues: {
    name: string;
    phone: string | null;
  };
  isSubmitting: boolean;
  onSubmit: (values: UpdateProfileInput) => Promise<void> | void;
};

export const ProfileForm = ({ defaultValues, isSubmitting, onSubmit }: ProfileFormProps) => {
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      name: defaultValues.name,
      phone: (defaultValues.phone ?? '') as UpdateProfileInput['phone'],
      avatarUrl: null,
    },
  });

  useEffect(() => {
    form.reset({
      name: defaultValues.name,
      phone: (defaultValues.phone ?? '') as UpdateProfileInput['phone'],
      avatarUrl: null,
    });
  }, [defaultValues.name, defaultValues.phone, form]);

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(async (values) => onSubmit(values))}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이름</FormLabel>
              <FormControl>
                <Input {...field} placeholder="홍길동" disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                연락처 <span className="text-xs text-slate-400">(선택)</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="010-1234-5678" disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
