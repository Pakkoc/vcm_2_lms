import { AssignmentDetailView } from "@/features/assignment-detail/components/AssignmentDetailView";

type LearnerAssignmentPageProps = {
  params: Promise<{ assignmentId: string }>;
};

export default async function LearnerAssignmentPage({ params }: LearnerAssignmentPageProps) {
  const { assignmentId } = await params;
  return <AssignmentDetailView assignmentId={assignmentId} />;
}