import type { ReactNode } from 'react';
import Link from "next/link";
import {
  Award,
  CalendarClock,
  CheckCircle2,
  Compass,
  GraduationCap,
  LineChart,
  NotebookPen,
  ShieldCheck,
  UploadCloud,
  Users,
} from "lucide-react";

const featureHighlights = [
  {
    icon: <GraduationCap className="h-6 w-6 text-indigo-500" />,
    title: "역할 기반 온보딩",
    description: "학습자와 강사가 각각 필요한 절차를 거치며, 한 번의 가입으로 필요한 권한을 자동 설정합니다.",
  },
  {
    icon: <CalendarClock className="h-6 w-6 text-indigo-500" />,
    title: "과제 전 주기 자동화",
    description: "게시, 연장, 마감까지 자동화된 스케줄링으로 운영자의 반복 업무를 줄입니다.",
  },
  {
    icon: <LineChart className="h-6 w-6 text-indigo-500" />,
    title: "실시간 학습 분석",
    description: "진행률과 성취도 지표를 한눈에 확인하고, 취약 구간을 빠르게 찾아 개입하세요.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-indigo-500" />,
    title: "안정적인 접근 제어",
    description: "Supabase Auth와 세밀한 정책으로 보호 구간을 안전하게 지키고 감사 로그를 남깁니다.",
  },
];

const learnerJourney = [
  {
    title: "가입 & 역할 선택",
    description: "이메일 인증 후 Learner 역할을 지정하고 필수 프로필을 완성합니다.",
    icon: <Compass className="h-5 w-5 text-indigo-500" />,
  },
  {
    title: "코스 탐색 & 신청",
    description: "카탈로그에서 필터와 검색으로 코스를 찾고, 정원/상태를 확인한 뒤 신청합니다.",
    icon: <NotebookPen className="h-5 w-5 text-indigo-500" />,
  },
  {
    title: "대시보드 확인",
    description: "마감 임박 과제와 진행률, 최근 피드백을 Learner 대시보드에서 추적합니다.",
    icon: <CalendarClock className="h-5 w-5 text-indigo-500" />,
  },
  {
    title: "제출 & 재제출",
    description: "과제 상세에서 제출물(텍스트/링크)을 업로드하고, 지각/재제출 정책을 안내받습니다.",
    icon: <UploadCloud className="h-5 w-5 text-indigo-500" />,
  },
  {
    title: "성적 & 피드백",
    description: "성적 페이지에서 점수와 피드백을 확인하고 필요 시 재제출로 이어갑니다.",
    icon: <Award className="h-5 w-5 text-indigo-500" />,
  },
];

const instructorJourney = [
  {
    title: "가입 & 역할 지정",
    description: "Instructor 역할을 선택하고 코스 운영에 필요한 기본 정보를 저장합니다.",
    icon: <Compass className="h-5 w-5 text-emerald-500" />,
  },
  {
    title: "코스 생성",
    description: "커리큘럼과 정원을 설정한 뒤 초안 상태에서 내용을 다듬고 공개 전 검토합니다.",
    icon: <NotebookPen className="h-5 w-5 text-emerald-500" />,
  },
  {
    title: "과제 게시",
    description: "과제를 생성해 draft → published로 전환하고, 자동 마감 정책을 설정합니다.",
    icon: <CalendarClock className="h-5 w-5 text-emerald-500" />,
  },
  {
    title: "채점 & 피드백",
    description: "제출물 목록에서 채점하고 피드백 또는 재제출 요청을 기록합니다.",
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  },
  {
    title: "성적 확정",
    description: "마감된 과제를 closed로 전환하고, 성적 리포트를 Learner에게 공유합니다.",
    icon: <Award className="h-5 w-5 text-emerald-500" />,
  },
];

const roleSummaries = [
  {
    title: "학습자 경험",
    description:
      "수강 신청부터 제출, 피드백 확인까지 모바일에서도 매끄럽게 진행됩니다. 마감 임박 알림으로 놓치는 과제가 없습니다.",
    bullets: [
      "맞춤형 대시보드로 현재 과제와 진척도를 한 번에",
      "다양한 제출 형식 지원 및 지각/재제출 정책 안내",
      "실시간 알림으로 강사 피드백과 공지 즉시 확인",
    ],
  },
  {
    title: "강사 워크플로",
    description:
      "코스 운영과 채점 업무를 하나의 작업공간에서 처리하고, 자동화된 규칙으로 반복 작업을 줄입니다.",
    bullets: [
      "강의 개설부터 정원 관리까지 단일 화면 구성",
      "채점 기록과 재채점 이력 자동 저장",
      "과제 마감/연장 요청을 한 번의 클릭으로 처리",
    ],
  },
];

export default function Home() {
  return (
    <main className="min-h-[70vh] bg-gradient-to-b from-slate-50 via-white to-white">
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 pb-16 pt-20 text-center">
        <span className="rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
          VibeMafia LMS
        </span>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            학습과 강의를 연결하는 역할 기반 학습 관리 플랫폼
          </h1>
          <p className="mx-auto max-w-2xl text-base text-slate-600 md:text-lg">
            학습자는 명확한 여정에 집중하고, 강사는 운영에만 몰입할 수 있도록 설계된 경량 LMS입니다.
            온보딩부터 과제, 채점, 리포트까지 한 번에 관리하세요.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/signup?role=instructor" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800">
            강사로 시작하기
          </Link>
          <Link href="/signup?role=learner" className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50">
            학습자로 시작하기
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            이미 계정이 있나요?
          </Link>
        </div>
        <dl className="grid w-full grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white/60 p-6 shadow-sm sm:grid-cols-3">
          <div className="space-y-1">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">온보딩 완료까지</dt>
            <dd className="text-2xl font-semibold text-slate-900">5분 이내</dd>
            <p className="text-xs text-slate-500">역할 선택과 이용 약관 동의가 자동으로 처리됩니다.</p>
          </div>
          <div className="space-y-1">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">과제 자동 마감률</dt>
            <dd className="text-2xl font-semibold text-slate-900">98%</dd>
            <p className="text-xs text-slate-500">자동 마감 API로 지각 처리와 리포팅을 단순화합니다.</p>
          </div>
          <div className="space-y-1">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">강사용 워크로드 절감</dt>
            <dd className="text-2xl font-semibold text-slate-900">40%↓</dd>
            <p className="text-xs text-slate-500">채점 이력과 피드백 자동화를 통해 반복 업무를 줄입니다.</p>
          </div>
        </dl>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="space-y-4 text-center">
          <h2 className="text-3xl font-semibold text-slate-900">역할별 여정</h2>
          <p className="mx-auto max-w-3xl text-sm text-slate-600 md:text-base">
            Learner와 Instructor가 제품을 사용하는 흐름을 단계별로 구성했습니다. PRD에 정의된 사용자 여정을 화면 설계와
            온보딩 메시지에 그대로 반영했습니다.
          </p>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <JourneyCard title="Learner 여정" tone="indigo" steps={learnerJourney} />
          <JourneyCard title="Instructor 여정" tone="emerald" steps={instructorJourney} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-2">
          {featureHighlights.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
                {feature.icon}
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-slate-200 bg-slate-900 px-8 py-12 text-white shadow-xl">
          <div className="grid gap-12 md:grid-cols-2">
            {roleSummaries.map((role) => (
              <div key={role.title} className="space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-indigo-300" />
                  <h3 className="text-xl font-semibold">{role.title}</h3>
                </div>
                <p className="text-sm text-slate-100/80">{role.description}</p>
                <ul className="space-y-2 text-sm text-slate-100">
                  {role.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-indigo-300" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="rounded-3xl border border-indigo-100 bg-indigo-50 px-8 py-14 text-center shadow">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">지금 시작해 보세요</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">온보딩부터 채점까지, 한 번의 설정으로 완료됩니다.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600">
            테스트 워크스페이스를 생성하고 기본 코스를 불러와 기능을 직접 경험해 보세요. 14일 동안 모든 기능이 무료로 제공됩니다.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup?role=learner" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800">
              학습자로 시작하기
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
            >
              데모 계정으로 둘러보기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

type JourneyCardProps = {
  title: string;
  tone: "indigo" | "emerald";
  steps: Array<{
    title: string;
    description: string;
    icon: ReactNode;
  }>;
};

function JourneyCard({ title, tone, steps }: JourneyCardProps) {
  const accent = tone === "emerald" ? "border-emerald-100 bg-emerald-50" : "border-indigo-100 bg-indigo-50";
  const dotColor = tone === "emerald" ? "bg-emerald-500" : "bg-indigo-500";

  return (
    <article className={`relative overflow-hidden rounded-3xl border ${accent} p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}>
      <div className="mb-6 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tone === "emerald" ? "bg-emerald-100" : "bg-indigo-100"}`}>
          <Users className={tone === "emerald" ? "h-5 w-5 text-emerald-600" : "h-5 w-5 text-indigo-600"} />
        </div>
        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      </div>
      <ol className="space-y-5">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${tone === "emerald" ? "bg-emerald-200" : "bg-indigo-200"}`}>
                {step.icon}
              </div>
              {index < steps.length - 1 ? <span className={`mt-1 h-full w-px ${tone === "emerald" ? "bg-emerald-200" : "bg-indigo-200"}`} /> : null}
            </div>
            <div className="space-y-1 text-left">
              <p className="text-sm font-semibold text-slate-900">
                <span className={`mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white ${dotColor}`}>
                  {index + 1}
                </span>
                {step.title}
              </p>
              <p className="text-sm text-slate-600">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}
