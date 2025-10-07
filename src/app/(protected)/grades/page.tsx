import { LearnerGradesView } from "@/features/learner-grades/components/LearnerGradesView";

type GradesPageProps = {
  params: Promise<Record<string, never>>;
};

export default async function GradesPage({ params }: GradesPageProps) {
  await params;
  return <LearnerGradesView />;
}