# UC-006: 성적 & 피드백 열람 - 구현 계획

## 개요

### Feature Modules
- **Learner Grades Feature** (`src/features/learner-grades/`)
  - 성적 API, 페이지, 요약 카드/테이블 컴포넌트를 포함하는 핵심 모듈
- **Course Gradebook Feature** (`src/features/course-gradebook/`)
  - 코스별 점수 집계, 평균/진행률 계산 로직을 분리해 Instructor/ Learner에서 공용 사용 가능하도록 설계
- **Feedback Viewer Feature** (`src/features/feedback-viewer/`)
  - HTML 피드백을 안전하게 렌더링하고, 모달/확대 보기 UI 제공

### Shared Modules
- **Score Calculator** (`src/lib/score-calculator.ts`)
  - (점수 × 비중)/만점 비율 계산, 평균/총점 렌더링에 사용
- **Feedback Sanitizer** (`src/lib/feedback-sanitizer.ts`)
  - Supabase에서 내려온 HTML 피드백을 sanitize하여 XSS 방지
- **useGradesData Hook** (`src/features/learner-grades/hooks/useGradesData.ts`)
  - React Query 기반 데이터 패칭/필터링/정렬 상태 관리

## Diagram

```mermaid
graph TD
  subgraph "App Layer"
    A[(protected)/grades/page.tsx]
    B[CourseGradeSummary]
    C[AssignmentScoreTable]
    D[FeedbackModal]
  end

  subgraph "Feature Layer"
    E[learner-grades/backend/route.ts]
    F[LearnerGradesService]
    G[course-gradebook/backend/service.ts]
    H[feedback-viewer/backend/service.ts]
  end

  subgraph "Shared"
    I[ScoreCalculator]
    J[FeedbackSanitizer]
    K[useGradesData]
  end

  subgraph "Database"
    L[(enrollments)]
    M[(courses)]
    N[(assignments)]
    O[(submissions)]
  end

  A --> E --> F
  F --> G
  F --> H
  F --> L
  F --> M
  G --> N
  G --> O
  H --> O
  B --> I
  C --> I
  D --> J
  A --> K
```

## Implementation Plan

### 1. Database Schema Updates
**파일**: `supabase/migrations/0008_grade_enhancements.sql`
- `assignments` 테이블에 `max_score`(기본 100) 컬럼 추가, 비중(`weight`)과 함께 사용
- `submissions` 테이블에 `graded_by`(UUID, nullable), `graded_at` 기본값 보정, `percentage` 계산을 위한 generated column (`score / assignments.max_score * 100`) 도입
- 성능 향상을 위해 `submissions_course_idx(assignment_id, learner_id, graded_at)` 복합 인덱스 추가

### 2. Backend Implementation

#### Grades Schema
**파일**: `src/features/learner-grades/backend/schema.ts`
- `LearnerGradesResponseSchema`: `courses` 배열(각각 `course`, `assignments`, `totalScore`, `averageScore`, `progress`)
- `AssignmentScoreSchema`: `assignment`, `submission`, `score`, `percentage`, `isLate`, `feedbackHtml`

#### Learner Grades Service
**파일**: `src/features/learner-grades/backend/service.ts`
- `getGrades(userId)` → 수강 코스 조회 → 제출/채점 데이터 join → `ScoreCalculator` 활용해 총점/평균 계산
- Role guard로 Learner만 접근 가능, 다른 사용자 데이터 참조 시 403 반환

**Unit Tests** (`__tests__/service.test.ts`):
- `returns empty state when learner has no enrollments`
- `includes ungraded submissions with status=PENDING`
- `computes totalScore using weight * score`
- `sets isLate=true when submission.late`
- `sanitizes feedback HTML`

#### Course Gradebook Service (재사용 가능)
**파일**: `src/features/course-gradebook/backend/service.ts`
- `getCourseGradebook(courseId, learnerId)` → 특정 코스 필터링 로직 제공
- Instructor 뷰에서 재활용하기 위한 파생 함수 포함

**Unit Tests**:
- `filters assignments by course`
- `orders assignments by due_date`

#### Feedback Viewer Service
**파일**: `src/features/feedback-viewer/backend/service.ts`
- 피드백 상세 API (`GET /api/feedback/:submissionId`) 제공, sanitize 후 반환, 권한 검증 포함

**Unit Tests**:
- `returns feedback when submission belongs to learner`
- `throws FORBIDDEN when accessing other learners submission`

#### Route Registrar
**파일**: `src/features/learner-grades/backend/route.ts`
- `GET /api/grades/learner`
- `GET /api/courses/:courseId/grades` (필터링)
- `GET /api/feedback/:submissionId`

### 3. Frontend Implementation

#### Grades Page
**파일**: `src/app/(protected)/grades/page.tsx`
- 서버에서 인증 체크 후 클라이언트 렌더링

**QA Sheet**:
- [ ] 수강 코스가 없을 때 안내 CTA가 표시되는가?
- [ ] 각 코스 카드에 총점/평균/진행률이 정확히 나타나는가?
- [ ] 미채점 과제는 "채점 대기"로 표시되는가?
- [ ] 지각 제출은 강조 색상/아이콘으로 표시되는가?
- [ ] 피드백 보기 클릭 시 모달이 열리고, 닫기/포커스 관리가 정상인가?
- [ ] 데이터 로딩/에러 상태 UI가 존재하는가?

#### Grades Components
**위치**: `src/features/learner-grades/components/`
- `CourseGradeSummary.tsx`, `AssignmentScoreTable.tsx`, `ScoreTrendChart.tsx`, `FeedbackButton.tsx`

**QA Sheet**:
- [ ] `AssignmentScoreTable`가 코스 내 과제를 due date 순으로 정렬하는가?
- [ ] `ScoreTrendChart`가 점수/비중 정보를 올바르게 시각화하는가?
- [ ] `FeedbackButton`이 접근성 aria 속성을 포함하는가?

#### Feedback Modal
**파일**: `src/features/feedback-viewer/components/FeedbackModal.tsx`
- sanitize된 HTML을 `dangerouslySetInnerHTML`로 렌더링, `FeedbackSanitizer` 적용 필수

**QA Sheet**:
- [ ] 모달 열림 시 포커스 트랩이 동작하는가?
- [ ] HTML 피드백 내 허용되지 않은 태그가 제거되는가?
- [ ] 키보드로 닫기/탭 이동이 가능한가?

### 4. Shared Utilities
- `src/lib/score-calculator.ts`: `calculateWeightedScore(score, weight, maxScore)`, `calculateCourseTotals(assignments)`
- `src/lib/feedback-sanitizer.ts`: DOMPurify 또는 custom allowlist 기반 sanitize 함수 구현
- `src/features/learner-grades/hooks/useGradesData.ts`: 필터(코스, 상태), 정렬(점수/마감일) 상태 제공

### 5. Integration & Observability
- 채점 완료 이벤트(UC-007) 이후 `queryClient.invalidateQueries(['grades','learner'])`
- `src/backend/hono/app.ts`에 `registerLearnerGradesRoutes` 추가
- Supabase RLS: Learner는 본인 `submission`만 Select 가능하도록 정책 추가
- Sentry 로깅: `grades_fetch_failed`, `feedback_sanitize_error`

### 6. Testing Strategy
- **Unit**: 점수 계산, sanitize, 서비스 로직 테스트
- **Integration**: `tests/api/grades/learner.test.ts` – 빈 상태, 정상, 권한 오류
- **E2E**: Playwright `grades.spec.ts` – 성적 페이지 내 요약/테이블/피드백 모달 플로우
- **Accessibility**: Feedback 모달 및 테이블에 대한 axe 검사 자동화
