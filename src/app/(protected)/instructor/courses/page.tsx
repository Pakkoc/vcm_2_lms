import { InstructorCourseManagement } from "@/features/course-management/components/InstructorCourseManagement";

type InstructorCoursesPageProps = {
  params: Promise<Record<string, never>>;
};

export default async function InstructorCoursesPage({ params }: InstructorCoursesPageProps) {
  await params;
  return <InstructorCourseManagement />;
}