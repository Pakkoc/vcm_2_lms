"use client";

import Link from "next/link";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { PASSWORD_REQUIREMENT_SUMMARY } from "@/lib/validation/auth";
import { RoleSelector } from "./RoleSelector";
import { ProfileFields } from "./ProfileFields";
import { TermsCheckbox } from "./TermsCheckbox";
import { useSignupForm } from "../hooks/useSignupForm";

export const SignupForm = () => {
  const { form, latestTermsQuery, handleSubmit, isSubmitting } = useSignupForm();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <section className="space-y-4">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold">계정 정보</h2>
            <p className="text-sm text-slate-600">
              서비스 이용을 위한 기본 계정 정보를 입력해 주세요.
            </p>
          </header>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이메일</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isSubmitting}
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      type="password"
                      autoComplete="new-password"
                      placeholder={PASSWORD_REQUIREMENT_SUMMARY}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호 확인</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      type="password"
                      autoComplete="new-password"
                      placeholder="비밀번호를 다시 입력하세요"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="space-y-4">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold">역할 및 프로필</h2>
            <p className="text-sm text-slate-600">
              역할을 선택하고 프로필 정보를 입력하면 맞춤 기능이 제공됩니다.
            </p>
          </header>
          <RoleSelector control={form.control} disabled={isSubmitting} />
          <ProfileFields control={form.control} disabled={isSubmitting} />
        </section>

        <section className="space-y-4">
          <TermsCheckbox
            control={form.control}
            disabled={isSubmitting}
            terms={latestTermsQuery.data}
            isLoading={latestTermsQuery.isLoading}
          />
        </section>

        <footer className="flex flex-col gap-3">
          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
            {isSubmitting ? "가입 처리 중..." : "가입하기"}
          </Button>
          <p className="text-sm text-slate-600">
            이미 계정을 보유하고 계신가요?{" "}
            <Link href={ROUTES.login} className="font-medium text-slate-900 underline">
              로그인하기
            </Link>
          </p>
        </footer>
      </form>
    </Form>
  );
};
