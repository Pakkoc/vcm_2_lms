import { CourseDetailClient } from "@/features/course-detail/components/CourseDetailClient";

export type CourseDetailPageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const resolved = await params;
  return <CourseDetailClient courseId={resolved.courseId} />;
}
