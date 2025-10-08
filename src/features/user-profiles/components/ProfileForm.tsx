"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { UpdateProfileInput } from "@/features/user-profiles/backend/schema";
import { UpdateProfileSchema } from "@/features/user-profiles/backend/schema";
import { Textarea } from "@/components/ui/textarea";

export type ProfileFormProps = {
  defaultValues: {
    name: string;
    phone: string | null;
    bio?: string | null;
    websiteUrl?: string | null;
    contactHours?: string | null;
    yearsOfExperience?: number | null | undefined;
    expertise?: string[] | null;
    school?: string | null;
    grade?: string | null;
    major?: string | null;
    interests?: string[] | null;
  };
  isSubmitting: boolean;
  onSubmit: (values: UpdateProfileInput) => Promise<void> | void;
  role?: 'learner' | 'instructor' | 'operator';
};

export const ProfileForm = ({ defaultValues, isSubmitting, onSubmit, role = 'learner' }: ProfileFormProps) => {
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      name: defaultValues.name,
      phone: (defaultValues.phone ?? '') as UpdateProfileInput['phone'],
      avatarUrl: null,
      bio: (defaultValues.bio ?? '') as string,
      websiteUrl: (defaultValues.websiteUrl ?? '') as string,
      contactHours: (defaultValues.contactHours ?? '') as string,
      yearsOfExperience: defaultValues.yearsOfExperience ?? undefined,
      expertise: (defaultValues.expertise ?? []) as string[],
      school: (defaultValues.school ?? '') as string,
      grade: (defaultValues.grade ?? '') as string,
      major: (defaultValues.major ?? '') as string,
      interests: (defaultValues.interests ?? []) as string[],
    },
  });

  useEffect(() => {
    form.reset({
      name: defaultValues.name,
      phone: (defaultValues.phone ?? '') as UpdateProfileInput['phone'],
      avatarUrl: null,
      bio: (defaultValues.bio ?? '') as string,
      websiteUrl: (defaultValues.websiteUrl ?? '') as string,
      contactHours: (defaultValues.contactHours ?? '') as string,
      yearsOfExperience: defaultValues.yearsOfExperience ?? undefined,
      expertise: (defaultValues.expertise ?? []) as string[],
      school: (defaultValues.school ?? '') as string,
      grade: (defaultValues.grade ?? '') as string,
      major: (defaultValues.major ?? '') as string,
      interests: (defaultValues.interests ?? []) as string[],
    });
  }, [defaultValues.name, defaultValues.phone, defaultValues.bio, defaultValues.websiteUrl, defaultValues.contactHours, defaultValues.yearsOfExperience, defaultValues.expertise, defaultValues.school, defaultValues.grade, defaultValues.major, defaultValues.interests, form]);

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(async (values) => onSubmit(values))}>
        {/* 공통: 이름, 연락처 */}
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

        {/* 공통: 자기소개 */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>자기소개</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="간단한 소개를 입력하세요" rows={4} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* 역할별 섹션 */}
        {role === 'instructor' ? (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>웹사이트</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://example.com" disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>연락 가능 시간</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="평일 10:00~18:00" disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="yearsOfExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>경력(년)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="0" disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expertise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>전문 분야(쉼표 구분)</FormLabel>
                    <FormControl>
                      <Input
                        value={(field.value as string[] | undefined)?.join(', ') ?? ''}
                        onChange={(e) => field.onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                        placeholder="프론트엔드, 데이터 분석"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="school"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>학교</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="OO대학교" disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>학년</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="3학년" disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="major"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>전공</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="컴퓨터공학" disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>관심 분야(쉼표 구분)</FormLabel>
                  <FormControl>
                    <Input
                      value={(field.value as string[] | undefined)?.join(', ') ?? ''}
                      onChange={(e) => field.onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                      placeholder="AI, 웹 개발, 디자인"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        <div className="flex items-center justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
