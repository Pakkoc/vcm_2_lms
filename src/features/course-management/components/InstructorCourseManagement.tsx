"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useMetadataSeedMutation } from "@/features/metadata-management/hooks/useMetadataSeedMutation";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import type { UserRole } from "@/constants/roles";
import { useInstructorDashboard } from "@/features/instructor-dashboard/hooks/useInstructorDashboard";
import { useCourseCategories, useDifficultyLevels } from "@/features/course-catalog/hooks/useCatalogTaxonomies";
import { useCreateCourseMutation } from "@/features/course-management/hooks/useCreateCourseMutation";
import { useUpdateCourseStatusMutation } from "@/features/course-management/hooks/useUpdateCourseStatusMutation";
import { useCreateAssignmentMutation } from "@/features/assignment-management/hooks/useCreateAssignmentMutation";
import { useGradeSubmissionMutation } from "@/features/submission-grading/hooks/useGradeSubmissionMutation";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { notifyError, notifySuccess } from "@/lib/notifications/toast";

const courseFormSchema = z.object({
  title: z.string().min(1, "제목을 입력해 주세요.").max(100),
  description: z.string().min(10, "소개를 10자 이상 입력해 주세요.").max(1000),
  categoryId: z.string().uuid("카테고리를 선택해 주세요."),
  difficultyId: z.string().uuid("난이도를 선택해 주세요."),
  curriculum: z.string().optional(),
  maxStudents: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? Number(value) : undefined))
    .refine((value) => value === undefined || (!Number.isNaN(value) && value > 0), "정원은 양수여야 합니다."),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

const assignmentFormSchema = z.object({
  title: z.string().min(1, "과제명을 입력해 주세요."),
  description: z.string().min(10, "과제 설명을 10자 이상 입력해 주세요."),
  dueDate: z.string().min(1, "마감일을 선택해 주세요."),
  weight: z.number().min(0).max(100),
  allowLate: z.boolean().default(false),
  allowResubmission: z.boolean().default(false),
});

type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

type GradeSubmissionData = {
  submissionId: string;
  action: "grade" | "regrade" | "resubmission_required";
  score?: number;
  feedback: string;
};

const formatDate = (value: string) => {
  try {
    return format(new Date(value), "PPP p", { locale: ko });
  } catch (error) {
    return value;
  }
};

export function InstructorCourseManagement() {
  useRoleGuard({ allowedRoles: ["instructor" as UserRole] });

  const dashboardQuery = useInstructorDashboard();
  const categoriesQuery = useCourseCategories();
  const difficultyQuery = useDifficultyLevels();

  const createCourseMutation = useCreateCourseMutation();
  const updateCourseStatusMutation = useUpdateCourseStatusMutation();
  const createAssignmentMutation = useCreateAssignmentMutation();
  const gradeSubmissionMutation = useGradeSubmissionMutation();
  const metadataSeedMutation = useMetadataSeedMutation();
  const [metadataSeedTriggered, setMetadataSeedTriggered] = useState(false);

  const courseForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: undefined,
      difficultyId: undefined,
      curriculum: "",
      maxStudents: undefined,
    },
  });

  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  const courses = dashboardQuery.data?.courses ?? [];
  const pendingCount = dashboardQuery.data?.pendingGrading ?? 0;
  const recentSubmissions = dashboardQuery.data?.recentSubmissions ?? [];

  const handleCreateCourse = courseForm.handleSubmit(async (values) => {
    if (!isMetadataReady) {
      notifyError({
        title: "카테고리/난이도가 필요합니다.",
        description: "기본 메타데이터를 먼저 생성해 주세요.",
      });
      return;
    }
    try {
      await createCourseMutation.mutateAsync({
        title: values.title,
        description: values.description,
        categoryId: values.categoryId,
        difficultyId: values.difficultyId,
        curriculum: values.curriculum,
        maxStudents: values.maxStudents,
      });
      notifySuccess({ title: "코스를 생성했습니다." });
      courseForm.reset();
    } catch (error) {
      notifyError({
        title: "코스 생성 실패",
        description: error instanceof Error ? error.message : undefined,
      });
    }
  });

  const categoryOptions = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const difficultyOptions = useMemo(() => difficultyQuery.data ?? [], [difficultyQuery.data]);
  const isMetadataLoading = categoriesQuery.isLoading || difficultyQuery.isLoading;
  const isMetadataReady = categoryOptions.length > 0 && difficultyOptions.length > 0;
  const disableCourseForm = createCourseMutation.isPending || metadataSeedMutation.isPending || !isMetadataReady;

  const handleSeedMetadata = useCallback(() => {
    if (metadataSeedMutation.isPending) {
      return;
    }
    setMetadataSeedTriggered(true);
    metadataSeedMutation.mutate(undefined, {
      onSuccess: (result) => {
        notifySuccess({
          title: "기본 메타데이터를 생성했습니다.",
          description: `카테고리 ${result.categoriesInserted}개, 난이도 ${result.difficultiesInserted}개가 준비되었습니다.`,
        });
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : "기본 메타데이터 생성에 실패했습니다.";
        notifyError({ title: "메타데이터 생성 실패", description: message });
      },
    });
  }, [metadataSeedMutation]);

  useEffect(() => {
    if (!metadataSeedTriggered && !isMetadataLoading && !isMetadataReady && !metadataSeedMutation.isPending) {
      setMetadataSeedTriggered(true);
      handleSeedMetadata();
    }
  }, [handleSeedMetadata, isMetadataLoading, isMetadataReady, metadataSeedMutation.isPending, metadataSeedTriggered]);


  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Instructor 워크플로</p>
        <h1 className="text-3xl font-semibold text-slate-900">코스 및 과제 관리</h1>
        <p className="text-sm text-slate-600">
          PRD에 정의된 Instructor 여정에 따라 코스 생성, 과제 게시, 제출물 채점을 한 화면에서 진행할 수 있습니다.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">새 코스 생성</CardTitle>
        </CardHeader>
        <CardContent>
          {!isMetadataLoading && !isMetadataReady ? (
            <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-slate-700">
              <p className="font-medium text-slate-800">카테고리와 난이도 정보가 비어 있습니다.</p>
              <p className="mt-1 text-xs text-slate-500">기본 메타데이터를 생성한 뒤 다시 시도해 주세요.</p>
              <div className="mt-3 flex items-center gap-3">
                <Button type="button" size="sm" onClick={handleSeedMetadata} disabled={metadataSeedMutation.isPending || isMetadataLoading}>
                  {metadataSeedMutation.isPending ? "생성 중..." : "기본 메타데이터 생성"}
                </Button>
              </div>
            </div>
          ) : null}
          <Form {...courseForm}>
            <form onSubmit={handleCreateCourse} className="grid gap-4 md:grid-cols-2">
              <FormField
                control={courseForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>코스 제목</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="예) React 기초부터 실전까지" disabled={disableCourseForm} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={courseForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>코스 소개</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} placeholder="코스 소개를 입력해 주세요." disabled={disableCourseForm} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={courseForm.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>카테고리</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                        disabled={disableCourseForm || isMetadataLoading}
                      >
                        <option value="">카테고리 선택</option>
                        {categoryOptions.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={courseForm.control}
                name="difficultyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>난이도</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                        disabled={disableCourseForm || isMetadataLoading}
                      >
                        <option value="">난이도 선택</option>
                        {difficultyOptions.map((difficulty) => (
                          <option key={difficulty.id} value={difficulty.id}>
                            {difficulty.name} (Lv.{difficulty.level})
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={courseForm.control}
                name="curriculum"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>커리큘럼 (선택)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="주요 커리큘럼을 입력해 주세요." disabled={disableCourseForm} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={courseForm.control}
                name="maxStudents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>정원 (선택)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="예) 30" disabled={disableCourseForm} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2 flex items-center justify-end">
                <Button type="submit" disabled={disableCourseForm}>
                  {createCourseMutation.isPending ? "생성 중..." : "코스 생성"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">내 코스</h2>
          <p className="text-sm text-slate-500">
            총 {courses.length}개 · 게시 {dashboardQuery.data?.statistics.publishedCourses ?? 0}개
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <Badge variant={course.status === "published" ? "default" : course.status === "archived" ? "secondary" : "outline"}>
                    {course.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">수강생 {course.enrollmentCount}명</p>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <div className="flex flex-wrap gap-2">
                  {course.status !== "published" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={updateCourseStatusMutation.isPending}
                      onClick={async () => {
                        try {
                          await updateCourseStatusMutation.mutateAsync({ courseId: course.id, status: "published" });
                          notifySuccess({ title: "코스를 게시했습니다." });
                        } catch (error) {
                          notifyError({
                            title: "상태 변경 실패",
                            description: error instanceof Error ? error.message : undefined,
                          });
                        }
                      }}
                    >
                      게시하기
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={updateCourseStatusMutation.isPending}
                      onClick={async () => {
                        try {
                          await updateCourseStatusMutation.mutateAsync({ courseId: course.id, status: "archived" });
                          notifySuccess({ title: "코스를 보관 처리했습니다." });
                        } catch (error) {
                          notifyError({
                            title: "상태 변경 실패",
                            description: error instanceof Error ? error.message : undefined,
                          });
                        }
                      }}
                    >
                      보관 처리
                    </Button>
                  )}
                  <Button type="button" size="sm" variant="ghost" asChild>
                    <Link href={`/courses/${course.id}`}>코스 상세 보기</Link>
                  </Button>
                </div>
                <Separator />
                <AssignmentQuickCreate
                  courseId={course.id}
                  isOpen={expandedCourseId === course.id}
                  onOpenChange={(open) => setExpandedCourseId(open ? course.id : null)}
                  isSubmitting={createAssignmentMutation.isPending}
                  onSubmit={async (values) => {
                    try {
                      await createAssignmentMutation.mutateAsync({
                        courseId: course.id,
                        title: values.title,
                        description: values.description,
                        dueDate: values.dueDate,
                        weight: values.weight,
                        allowLate: values.allowLate,
                        allowResubmission: values.allowResubmission,
                      });
                      notifySuccess({ title: "과제를 생성했습니다." });
                      setExpandedCourseId(null);
                    } catch (error) {
                      notifyError({
                        title: "과제 생성 실패",
                        description: error instanceof Error ? error.message : undefined,
                      });
                    }
                  }}
                />
              </CardContent>
            </Card>
          ))}
          {courses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              생성된 코스가 없습니다. 위의 폼에서 첫 코스를 만들어 보세요.
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">최근 제출물</h2>
          <Badge variant={pendingCount > 0 ? "destructive" : "secondary"}>채점 대기 {pendingCount}건</Badge>
        </div>
        <div className="space-y-3">
          {recentSubmissions.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
              최근 제출물이 없습니다.
            </div>
          ) : (
            recentSubmissions.map((submission) => (
              <Card key={submission.submissionId}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{submission.assignmentTitle}</CardTitle>
                      <p className="text-xs text-slate-500">{submission.courseTitle}</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      제출일 {formatDate(submission.submittedAt)} · 학습자 {submission.learnerName ?? "미확인"}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <GradeSubmissionForm
                    submissionId={submission.submissionId}
                    isSubmitting={gradeSubmissionMutation.isPending}
                    onSubmit={async (payload) => {
                      try {
                        await gradeSubmissionMutation.mutateAsync(payload);
                        notifySuccess({
                          title:
                            payload.action === "resubmission_required"
                              ? "재제출을 요청했습니다."
                              : payload.action === "regrade"
                              ? "재채점을 완료했습니다."
                              : "채점을 완료했습니다.",
                        });
                      } catch (error) {
                        notifyError({
                          title: "채점 실패",
                          description: error instanceof Error ? error.message : undefined,
                        });
                      }
                    }}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

type AssignmentQuickCreateProps = {
  courseId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  onSubmit: (values: AssignmentFormValues) => Promise<void>;
};

function AssignmentQuickCreate({ courseId, isOpen, onOpenChange, isSubmitting, onSubmit }: AssignmentQuickCreateProps) {
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      weight: 0,
      allowLate: false,
      allowResubmission: false,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
    form.reset({ title: "", description: "", dueDate: "", weight: 0, allowLate: false, allowResubmission: false });
  });

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        className="flex w-full items-center justify-between text-sm font-semibold text-slate-700"
      >
        빠른 과제 생성
        <span>{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen ? (
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>과제명</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="예) 1주차 미니 프로젝트" disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="과제 요구 사항을 입력해 주세요." disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>마감일</FormLabel>
                      <FormControl>
                        <Input {...field} type="datetime-local" disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>배점</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="allowLate"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">지각 제출 허용</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="allowResubmission"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">재제출 허용</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "생성 중..." : "과제 생성"}
              </Button>
            </form>
          </Form>
        </div>
      ) : null}
    </div>
  );
}

type GradeSubmissionFormProps = {
  submissionId: string;
  onSubmit: (payload: GradeSubmissionData) => Promise<void>;
  isSubmitting: boolean;
};

function GradeSubmissionForm({ submissionId, onSubmit, isSubmitting }: GradeSubmissionFormProps) {
  const form = useForm({
    defaultValues: {
      action: "grade" as GradeSubmissionData["action"],
      score: 0,
      feedback: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      submissionId,
      action: values.action,
      score: values.action === "resubmission_required" ? undefined : Number(values.score),
      feedback: values.feedback,
    });
    form.reset({ action: "grade", score: 0, feedback: "" });
  });

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-4 md:items-end">
      <div className="md:col-span-1">
        <label className="text-xs font-medium text-slate-500">처리 유형</label>
        <select
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          {...form.register("action")}
          disabled={isSubmitting}
        >
          <option value="grade">채점</option>
          <option value="regrade">재채점</option>
          <option value="resubmission_required">재제출 요청</option>
        </select>
      </div>
      {form.watch("action") !== "resubmission_required" ? (
        <div>
          <label className="text-xs font-medium text-slate-500">점수</label>
          <Input
            type="number"
            className="mt-1"
            {...form.register("score", { valueAsNumber: true })}
            disabled={isSubmitting}
          />
        </div>
      ) : (
        <div />
      )}
      <div className="md:col-span-2">
        <label className="text-xs font-medium text-slate-500">피드백</label>
        <Textarea
          rows={form.watch("action") === "resubmission_required" ? 2 : 1}
          className="mt-1"
          placeholder="학습자에게 전달할 메시지를 입력해 주세요."
          {...form.register("feedback")}
          disabled={isSubmitting}
        />
      </div>
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "처리 중..." : "저장"}
      </Button>
    </form>
  );
}
