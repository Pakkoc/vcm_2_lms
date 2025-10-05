# UC-004: 과제 상세 열람 (Learner) - 구현 계획

## 개요

### Feature Modules
- **Assignment Detail Feature** (`src/features/assignment-detail/`)
  - Learner가 과제 상세 내용을 조회하고 제출 가능 여부를 확인하는 주 기능
  - 백엔드 route/service/schema + 프론트 컴포넌트(정보 패널, 정책 안내, CTA)로 구성
- **Submission History Feature** (`src/features/submission-history/`)
  - 학습자의 과거 제출/피드백 기록을 조회해 상세 화면에 제공

### Shared Modules
- **Assignment Status Utils** (`src/lib/assignment-status.ts`)
  - 과제/제출 상태를 UI에 맞는 배지, 색상, 메시지로 변환
- **Submission Policy Checker** (`src/lib/submission-policy.ts`)
  - 지각/재제출 허용 여부, 남은 시간 등 제출 가능성 계산
- **Assignment Access Guard** (`src/lib/assignment-access.ts`)
  - 수강 여부, 과제 상태, 공개 여부를 확인해 접근 제어

## Diagram

```mermaid
graph TD
  subgraph "App Layer"
    A[(protected)/assignments/[assignmentId]/page.tsx]
    B[AssignmentInfo]
    C[SubmissionStatus]
    D[PolicyNotice]
    E[SubmissionCTA]
  end

  subgraph "Feature Layer"
    F[assignment-detail/backend/route.ts]
    G[AssignmentDetailService]
    H[submission-history/backend/service.ts]
  end

  subgraph "Shared"
    I[AssignmentAccess]
    J[SubmissionPolicy]
    K[AssignmentStatusUtils]
  end

  subgraph "Database"
    L[(assignments)]
    M[(courses)]
    N[(enrollments)]
    O[(submissions)]
  end

  A --> F --> G
  G --> L
  G --> M
  G --> N
  G --> H
  H --> O
  F --> I
  D --> J
  B --> K
  C --> K
```

## Implementation Plan

### 1. Database Schema
**파일**: `supabase/migrations/0006_create_assignment_tables.sql`
- `assignments` 테이블: `id`, `course_id`, `title`, `description`, `instructions`, `due_date`, `weight`, `allow_late`, `allow_resubmission`, `visibility`(`draft`/`published`/`closed`), `created_at`, `updated_at`
- `submissions` 테이블(초안): `id`, `assignment_id`, `learner_id`, `content`, `link_url`, `status`(`submitted`/`graded`/`resubmission_required`), `score`, `feedback`, `is_late`, `submitted_at`, `graded_at`
- 외래키: `assignments.course_id → courses.id`, `submissions.assignment_id → assignments.id`, `submissions.learner_id → auth.users.id`
- 인덱스: `assignments_course_idx`, `assignments_due_date_idx`, `submissions_assignment_idx`, `submissions_learner_idx`

### 2. Backend Implementation

#### Assignment Detail Schema
**파일**: `src/features/assignment-detail/backend/schema.ts`
- `AssignmentDetailParamsSchema`: `assignmentId` UUID param 검증
- `AssignmentDetailResponseSchema`: `assignment`, `submission`, `canSubmit`, `policies`

#### Assignment Detail Service
**파일**: `src/features/assignment-detail/backend/service.ts`
- 흐름: 과제 조회 → 수강 여부 확인 → 공개 상태 검사 → 제출 이력 조회 → 제출 가능 여부 계산 → 응답 매핑

**Unit Tests** (`__tests__/service.test.ts`):
- `returns assignment detail for enrolled learner`
- `denies access when learner not enrolled`
- `hides draft assignments`
- `marks canSubmit=false when deadline passed and allow_late=false`

#### Submission History Service
**파일**: `src/features/submission-history/backend/service.ts`
- `getLatestSubmission(assignmentId, learnerId)` 및 `getSubmissionHistory` 제공

**Unit Tests**:
- `returns latest submission with feedback`
- `returns empty list when learner has no submissions`
- `orders history descending by submitted_at`

#### Route Registrar
**파일**: `src/features/assignment-detail/backend/route.ts`
- `GET /api/assignments/:assignmentId` → `AssignmentDetailService`
- `GET /api/assignments/:assignmentId/submissions` → `SubmissionHistoryService`
- 인증/역할 가드 적용 (`withRoleGuard('learner')`)

### 3. Frontend Implementation

#### Assignment Detail Page
**파일**: `src/app/(protected)/assignments/[assignmentId]/page.tsx`
- 서버 컴포넌트에서 데이터 프리패치, 클라이언트에서 상태 표시 및 CTA 제어

**QA Sheet**:
- [ ] 과제 기본 정보(제목, 설명, 마감일)가 정확히 나타나는가?
- [ ] 진행 상태 배지가 상태값에 따라 올바르게 표시되는가?
- [ ] 제출 가능 여부에 따라 CTA와 안내 문구가 달라지는가?
- [ ] 비공개 과제 접근 시 접근 불가 화면이 출력되는가?
- [ ] 수강하지 않은 사용자가 접근하면 403 화면이 출력되는가?
- [ ] 네트워크 오류 시 재시도 UI가 노출되는가?

#### Assignment Detail Components
**위치**: `src/features/assignment-detail/components/`
- `AssignmentInfo.tsx`, `SubmissionStatusCard.tsx`, `PolicyNotice.tsx`, `SubmissionHistoryList.tsx`

**QA Sheet**:
- [ ] `AssignmentInfo`가 점수 비중/마감일/제출 정책을 보기 쉽게 정리하는가?
- [ ] `SubmissionStatusCard`가 현재 제출 상태(미제출/제출/채점 등)를 정확히 보여주는가?
- [ ] `PolicyNotice`가 지각/재제출 정책을 알기 쉽게 설명하는가?
- [ ] `SubmissionHistoryList`가 제출 이력을 최신순으로 정렬하는가?

### 4. Shared Utilities
- `src/lib/assignment-status.ts`: 상태별 배지 정보(`label`, `tone`, `icon`)
- `src/lib/submission-policy.ts`: `evaluateSubmissionWindow(assignment, submission, currentTime)` 함수로 `canSubmit`, `isLate`, `requiresResubmission` 등 반환
- `src/lib/assignment-access.ts`: `assertAssignmentAccess(supabase, assignmentId, userId)` → 접근 불가 사유 코드 포함

### 5. Integration & Observability
- Learner Dashboard/Assignment Submission과 공유되는 `submission` 데이터 모델을 `src/lib/types.ts`에 정의해서 재사용
- `src/backend/hono/app.ts`에서 `registerAssignmentDetailRoutes` 호출 추가
- 접근 거부/미존재 케이스는 `logger.info`로 남기고 404/403 응답 표준화
- Sentry(또는 유사 툴)에 `assignment_detail_fetch_failed` 이벤트 로깅

### 6. Testing Strategy
- **Unit**: 서비스/유틸 구성 (접근 가드, 제출 정책 등)
- **Integration**: `tests/api/assignments/detail.test.ts` – happy-path, 미수강, draft, 만료 케이스
- **E2E**: `tests/e2e/assignment-detail.spec.ts` – UI 표시, 제출 CTA, 빈 상태 검증
- **Security**: 권한 없는 사용자/Instructor 접근 시 403 반환 확인
