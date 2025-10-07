"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSubmitAssignment } from "@/features/assignment-submission/hooks/useSubmitAssignment";
import { notifyError, notifySuccess } from "@/lib/notifications/toast";

const submissionSchema = z.object({
  content: z.string().min(10, "내용을 최소 10자 이상 입력해 주세요."),
  linkUrl: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length === 0 ? undefined : value?.trim()))
    .refine(
      (value) => !value || /^https?:\/\//i.test(value),
      "링크는 http:// 또는 https:// 로 시작해야 합니다.",
    ),
});

export type AssignmentSubmissionFormProps = {
  assignmentId: string;
  canSubmit: boolean;
  hasSubmission: boolean;
};

export function AssignmentSubmissionForm({ assignmentId, canSubmit, hasSubmission }: AssignmentSubmissionFormProps) {
  const submitMutation = useSubmitAssignment();
  const form = useForm<z.infer<typeof submissionSchema>>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      content: "",
      linkUrl: "",
    },
  });

  useEffect(() => {
    if (!canSubmit) {
      form.reset();
    }
  }, [canSubmit, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await submitMutation.mutateAsync({
        assignmentId,
        content: values.content,
        linkUrl: values.linkUrl,
      });
      notifySuccess({ title: "과제를 제출했습니다." });
      form.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : "제출에 실패했습니다.";
      notifyError({ title: "제출 실패", description: message });
    }
  });

  if (!canSubmit) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        현재는 제출할 수 없는 상태입니다. 이미 제출을 완료했거나 마감이 지났을 수 있습니다.
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>제출 내용</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={6}
                  placeholder="제출 내용을 작성해 주세요. 마크다운은 지원하지 않습니다."
                  disabled={submitMutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="linkUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                참고 링크 <span className="text-xs text-slate-400">(선택)</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="https://example.com/work"
                  disabled={submitMutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={submitMutation.isPending} className="w-full md:w-auto">
          {submitMutation.isPending ? "제출 중..." : hasSubmission ? "재제출하기" : "제출하기"}
        </Button>
      </form>
    </Form>
  );
}
