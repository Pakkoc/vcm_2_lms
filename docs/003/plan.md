# UC-003: Learner 대시보드 - 구현 계획

## 개요

### Feature Modules
- **Learner Dashboard Feature** (`src/features/learner-dashboard/`)
  - 대시보드 API, 페이지, 데이터 통합 컴포넌트를 포함하는 상위 모듈
- **Assignment Progress Feature** (`src/features/assignment-progress/`)
  - 과제 진행률/마감 임박 계산 로직과 관련 API 래핑
- **Feedback Summary Feature** (`src/features/feedback-summary/`)
  - 최근 피드백 조회, 정렬, 요약 텍스트 구성 담당

### Shared Modules
- **Progress Calculator** (`src/lib/progress-calculator.ts`)
  - 총 과제 대비 완료 비율 계산, 표현 색상 결정 로직 제공
- **Date Window Utils** (`src/lib/date-utils.ts`)
  - 마감 임박 판단(`isWithinDays`), 남은 시간 문자열 생성 유틸
- **useDashboardStats Hook** (`src/features/learner-dashboard/hooks/useDashboardStats.ts`)
  - React Query 기반 데이터 패칭/리프레시 핸들러, 레이아웃 전역에서 재사용

## Diagram

```mermaid
graph TD
  subgraph "App Layer"
    A[(protected)/dashboard/page.tsx]
    B[CourseProgressGrid]
    C[UpcomingDeadlines]
    D[RecentFeedbackList]
    E[LearningStatsPanel]
  end

  subgraph "Feature Layer"
    F[learner-dashboard/backend/route.ts]
    G[LearnerDashboardService]
    H[assignment-progress/backend/service.ts]
    I[feedback-summary/backend/service.ts]
  end

  subgraph "Shared"
    J[ProgressCalculator]
    K[DateUtils]
    L[useDashboardStats]
  end

  subgraph "Database"
    M[(enrollments)]
    N[(courses)]
    O[(assignments)]
    P[(submissions)]
    Q[(feedback)]
  end

  A --> F --> G
  G --> H
  G --> I
  G --> M
  G --> N
  H --> O
  H --> P
  I --> P
  I --> Q
  B --> J
  C --> K
  A --> L
```

## Implementation Plan

### 1. Database Preparation
- 기존 `courses`, `assignments`, `submissions`, `enrollments` 테이블 활용
- 대시보드 조회 효율화를 위해 `submissions_learner_idx(learner_id, assignment_id)`와 `assignments_due_date_idx(due_date)` 인덱스 점검/추가 (`supabase/migrations/0005_dashboard_indexes.sql`)

### 2. Backend Implementation

#### Dashboard Schema
**파일**: `src/features/learner-dashboard/backend/schema.ts`
- `LearnerDashboardResponseSchema`: `courses`, `upcomingDeadlines`, `recentFeedback`, `stats`
- 각 섹션별로 child schema 정의 (ex. `CourseProgressSchema`)

#### Learner Dashboard Service
**파일**: `src/features/learner-dashboard/backend/service.ts`
- `getDashboard(userId)` → enrolled courses 조회 → 진행률/피드백/통계 조합 → 스키마 검증 후 반환
- Supabase multi-query 최소화를 위해 RPC 또는 `in` 조건 활용

**Unit Tests** (`__tests__/service.test.ts`):
- `returns empty sections when learner has no enrollments`
- `orders courses by enrolled_at descending`
- `caps recentFeedback list at 5 items`
- `flags overdue assignments correctly`

#### Assignment Progress Service
**파일**: `src/features/assignment-progress/backend/service.ts`
- 진행률 계산, 마감 임박 과제 조회 함수 (`getProgressByCourseIds`, `getUpcomingDeadlines`)

**Unit Tests**:
- `calculates progress percentage using submissions counts`
- `ignores closed assignments from upcoming list`
- `returns only due dates within 7 days`

#### Feedback Summary Service
**파일**: `src/features/feedback-summary/backend/service.ts`
- 최근 제출 피드백 5건 조회, 강사명/코스명 join, 요약 텍스트 구성

**Unit Tests**:
- `returns feedback sorted by updated_at desc`
- `omits submissions without feedback`
- `handles null score gracefully`

#### Route Registrar
**파일**: `src/features/learner-dashboard/backend/route.ts`
- `GET /api/dashboard/learner` – 인증 미들웨어 후 `LearnerDashboardService` 호출
- 쿼리 파라미터 없음, `respond`로 성공/실패 표준화

### 3. Frontend Implementation

#### Dashboard Page
**파일**: `src/app/(protected)/dashboard/page.tsx`
- 서버에서 인증 가드 적용, 클라이언트 컴포넌트 렌더링

**QA Sheet**:
- [ ] 수강 코스가 없을 때 CTA(코스 탐색) 가 노출되는가?
- [ ] 진행률 카드가 0~100% 사이 값으로 표시되는가?
- [ ] 마감 임박 리스트에 7일 초과 과제가 노출되지 않는가?
- [ ] 최근 피드백 섹션이 5개 초과 항목을 숨기는가?
- [ ] 데이터 로딩/에러 상태 UI가 존재하는가?
- [ ] 세션 만료 시 로그인 페이지로 리다이렉트되는가?

#### Dashboard Components
**위치**: `src/features/learner-dashboard/components/`
- `CourseProgressGrid.tsx`, `UpcomingDeadlines.tsx`, `RecentFeedbackList.tsx`, `LearningStatsPanel.tsx`

**QA Sheet**:
- [ ] `CourseProgressGrid`가 진행률 구간별 색상을 정확히 사용하는가?
- [ ] `UpcomingDeadlines`가 남은 시간을 `formatTimeRemaining`으로 표시하는가?
- [ ] `RecentFeedbackList`가 점수/피드백/강사 정보를 함께 보여주는가?
- [ ] 각 컴포넌트의 빈 상태 메시지가 명확한가?

#### Dashboard Hook
**파일**: `src/features/learner-dashboard/hooks/useDashboardStats.ts`
- React Query `useQuery`로 데이터 패칭, 폴링 간격 옵션 제공 (기본 5분)

### 4. Shared Utilities
- `src/lib/progress-calculator.ts`: `calculateCourseProgress(totalAssignments, completed)`, `progressColor(progress)`
- `src/lib/date-utils.ts`: `isWithinDays(dueDate, 7)`, `formatTimeRemaining(dueDate)` (예: `"3일 남음"`)
- `src/lib/dashboard-mapper.ts` (신규): 원시 Supabase 응답을 프론트 friendly 형태로 매핑

### 5. Integration & Observability
- Enrollment/Submission 이벤트 후 `queryClient.invalidateQueries(['dashboard','learner'])`
- `src/backend/hono/app.ts`에 `registerLearnerDashboardRoutes` 추가
- 실패 케이스 로깅 시 `logger.warn('dashboard_failed', { userId, code })`
- Feature flag 필요 시 `src/lib/config.ts`에 `ENABLE_LEARNER_DASHBOARD` 선언

### 6. Testing Strategy
- **Unit**: 서비스/유틸 테스팅 (Vitest) – 진행률, 날짜, 피드백 변환
- **Contract**: Zod schema 기반 `assertType` 테스트로 API 응답 구조 보증
- **Integration**: `tests/api/dashboard/learner.test.ts` – 인증 실패/성공/빈 데이터/데이터 존재 케이스
- **E2E**: Playwright `dashboard.spec.ts` – 실제 UI에서 카드/리스트/CTA 노출 확인
- **Performance**: 100개 코스/과제 상황에서 API 응답 시간 측정 및 캐시 전략 문서화
