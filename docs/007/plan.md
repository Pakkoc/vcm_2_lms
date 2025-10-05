# UC-007: Instructor 대시보드 - 구현 계획

## 개요

### Feature Modules
- **Instructor Dashboard Feature** (`src/features/instructor-dashboard/`)
  - 강사 대시보드 API/페이지, 요약 카드/리스트/차트를 포함
- **Grading Queue Feature** (`src/features/grading-queue/`)
  - 채점 대기 제출물 조회/필터링/빠른 액션 제공
- **Course Analytics Feature** (`src/features/course-analytics/`)
  - 코스별 수강생 수, 활동량, 제출 통계 계산 및 캐싱

### Shared Modules
- **useInstructorDashboard Hook** (`src/features/instructor-dashboard/hooks/useInstructorDashboard.ts`)
  - React Query 기반 데이터 패칭, 폴링, 필터 상태 제공
- **Dashboard Date Utils** (`src/lib/dashboard-date.ts`)
  - 최근 N일 필터, 상대 시간 문자열 생성
- **Highlight Badge Component** (`src/components/ui/HighlightBadge.tsx`)
  - 상태/경고 배지 UI 재사용

## Diagram

```mermaid
graph TD
  subgraph "App Layer"
    A[(protected)/instructor/dashboard/page.tsx]
    B[CourseStatusGrid]
    C[PendingGradingCard]
    D[RecentSubmissionsList]
    E[CourseAnalyticsCharts]
  end

  subgraph "Feature Layer"
    F[instructor-dashboard/backend/route.ts]
    G[InstructorDashboardService]
    H[grading-queue/backend/service.ts]
    I[course-analytics/backend/service.ts]
  end

  subgraph "Shared"
    J[useInstructorDashboard]
    K[DashboardDateUtils]
    L[HighlightBadge]
  end

  subgraph "Database"
    M[(courses)]
    N[(assignments)]
    O[(submissions)]
    P[(enrollments)]
    Q[(course_metrics_mv)]
  end

  A --> F --> G
  G --> H
  G --> I
  G --> M
  H --> N
  H --> O
  I --> P
  I --> Q
  B --> L
  C --> L
  A --> J
  D --> K
```

## Implementation Plan

### 1. Database Schema & Materialized View
**파일**: `supabase/migrations/0009_instructor_dashboard.sql`
- `course_metrics_mv` materialized view 생성: 코스별 수강생 수, 활성 학습자 수, 최근 7일 제출 수, 평균 점수 등 집계
- `refresh_course_metrics()` Supabase 함수 정의 및 `cron` 확장 사용해 5분마다 리프레시 (또는 API 레벨에서 수동 리프레시)
- `pending_grading_view`: 채점 대기 제출물(점수 null, status='submitted') 조회용 뷰
- 필요한 인덱스: `courses_instructor_idx`, `pending_grading_view_submitted_at_idx`

### 2. Backend Implementation

#### Dashboard Schema
**파일**: `src/features/instructor-dashboard/backend/schema.ts`
- `InstructorDashboardResponseSchema`: `courses`, `pendingGrading`, `recentSubmissions`, `stats`
- `CourseSummarySchema`, `PendingSubmissionSchema`, `CourseMetricSchema` 정의

#### Instructor Dashboard Service
**파일**: `src/features/instructor-dashboard/backend/service.ts`
- 입력: `instructorId`
- 출력: 강의 목록(상태별 구분), 채점 대기 요약, 최근 제출, 통계치
- 캐시 허용(최대 60초) – `cacheControl` 헤더 설정

**Unit Tests** (`__tests__/service.test.ts`):
- `returns empty state when instructor has no courses`
- `groups courses by status`
- `limits recent submissions to 10`
- `pulls metrics from materialized view`

#### Grading Queue Service
**파일**: `src/features/grading-queue/backend/service.ts`
- `getPendingSubmissions(instructorId, options)` → 필터(코스, 마감일), pagination 지원
- Instructor가 아닌 사용자 접근 시 FORBIDDEN

**Unit Tests**:
- `filters queue by course`
- `orders submissions by submitted_at desc`
- `excludes graded submissions`

#### Course Analytics Service
**파일**: `src/features/course-analytics/backend/service.ts`
- `getCourseMetrics(instructorId)` → `course_metrics_mv` 조회 후 가공
- `triggerMetricsRefresh(instructorId?)` → 필요한 경우 materialized view 리프레시

**Unit Tests**:
- `returns metrics for instructor courses`
- `refresh function handles supabase error`

#### Route Registrar
**파일**: `src/features/instructor-dashboard/backend/route.ts`
- `GET /api/dashboard/instructor`
- `GET /api/dashboard/instructor/pending`
- `POST /api/dashboard/instructor/metrics/refresh` (관리자용)
- `withRoleGuard('instructor')` 적용

### 3. Frontend Implementation

#### Instructor Dashboard Page
**파일**: `src/app/(protected)/instructor/dashboard/page.tsx`
- 서버에서 역할 검사 후 클라이언트 컴포넌트 렌더

**QA Sheet**:
- [ ] 담당 코스가 없을 때 "코스 생성" CTA가 노출되는가?
- [ ] 상태별 카드가 색상/아이콘으로 구분되는가?
- [ ] 채점 대기 건수가 정확히 표시되는가?
- [ ] 최근 제출 리스트가 10개 이하로 표시되는가?
- [ ] 빠른 액션 버튼이 올바른 경로로 이동시키는가?
- [ ] 로딩/에러 상태가 적절히 노출되는가?

#### Dashboard Components
**위치**: `src/features/instructor-dashboard/components/`
- `CourseStatusGrid.tsx`, `PendingGradingCard.tsx`, `RecentSubmissionsList.tsx`, `CourseAnalyticsCharts.tsx`, `QuickActions.tsx`

**QA Sheet**:
- [ ] `PendingGradingCard` 클릭 시 채점 큐 페이지로 이동하는가?
- [ ] `RecentSubmissionsList`가 학습자, 과제, 제출 시간을 명확히 표시하는가?
- [ ] `CourseAnalyticsCharts`가 빈 데이터 시 플레이스홀더를 보여주는가?
- [ ] `QuickActions` 버튼 접근성이 보장되는가?(tab 순서, aria-label)

### 4. Shared Utilities
- `src/features/instructor-dashboard/hooks/useInstructorDashboard.ts`: `useQuery` + `useMemo`로 상태 그룹화, 리프레시 핸들러 제공
- `src/lib/dashboard-date.ts`: `formatRelativeTime`, `getLastNDaysRange`
- `src/components/ui/HighlightBadge.tsx`: 색상/아이콘 props로 제네릭 배지 구현

### 5. Integration & Observability
- Instructor가 코스/과제 수정 시 `course_metrics_mv` 리프레시 필요 → Supabase Function 호출 or background job TODO
- 채점 완료(UC-008) → `pending` 쿼리 무효화 (`['instructor','pending']`)
- 로깅: `logger.info('instructor_dashboard_loaded', { instructorId, courseCount })`
- Sentry 태그: `context: 'instructor-dashboard'`

### 6. Testing Strategy
- **Unit**: 서비스, metrics 계산, date utils
- **Integration**: `tests/api/dashboard/instructor.test.ts` – 코스 없음/있음/권한 오류
- **E2E**: Playwright `instructor-dashboard.spec.ts` – UI 요소, 빠른 액션, pending list 탐색
- **Performance**: 코스 50개, 제출물 10k 건 시 응답 시간 측정 → materialized view 리프레시 주기 조정
