# UC-010: 제출물 채점 & 피드백 - 구현 계획

## 개요

### Feature Modules
- **Submission Grading Feature** (`src/features/submission-grading/`)
  - 단일 제출물 채점/재채점/재제출 요청 API 및 채점 페이지 컴포넌트를 포함
- **Batch Grading Feature** (`src/features/batch-grading/`)
  - 동일 과제 제출물 일괄 채점 처리, 진행 상태 표시
- **Grading History Feature** (`src/features/grading-history/`)
  - 채점 이력 저장/조회, Instructor와 Learner가 모두 참고할 수 있는 기록 제공

### Shared Modules
- **Grading Validation** (`src/lib/validation/grading.ts`)
  - 점수 범위, 피드백 길이(최소 10자), 재제출 사유 검증
- **useGradingPanel Hook** (`src/features/submission-grading/hooks/useGradingPanel.ts`)
  - 현재 제출물 데이터, 폼 상태, 다음 제출물 이동 로직 관리
- **Feedback Markdown Renderer** (`src/lib/feedback-markdown.ts`)
  - Instructor 피드백 마크다운 → HTML 변환 및 sanitize 처리

## Diagram

```mermaid
graph TD
  subgraph "App Layer"
    A[(protected)/instructor/assignments/[assignmentId]/grading/page.tsx]
    B[SubmissionDetailPanel]
    C[GradingForm]
    D[BatchGradingDialog]
    E[GradingHistoryDrawer]
  end

  subgraph "Feature Layer"
    F[submission-grading/backend/route.ts]
    G[SubmissionGradingService]
    H[batch-grading/backend/service.ts]
    I[grading-history/backend/service.ts]
  end

  subgraph "Shared"
    J[GradingValidation]
    K[useGradingPanel]
    L[FeedbackMarkdown]
  end

  subgraph "Database"
    M[(submissions)]
    N[(grading_history)]
    O[(assignments)]
    P[(courses)]
  end

  A --> F --> G
  G --> M
  G --> O
  G --> P
  G --> I
  D --> H --> M
  I --> N
  C --> J
  A --> K
  C --> L
```

## Implementation Plan

### 1. Database Schema Updates
**파일**: `supabase/migrations/0012_grading.sql`
- `submissions` 테이블 보강: `resubmission_reason` TEXT, `locked_at` TIMESTAMPTZ(동시 채점 방지), `graded_by` UUID NOT NULL
- `grading_history` 테이블 생성: `id`, `submission_id`, `assignment_id`, `instructor_id`, `action`('graded'|'resubmission_requested'), `score`, `feedback_markdown`, `created_at`
- 트리거: `after update on submissions` → `log_grading_history()` to capture changes when status transitions to graded/resubmission
- 인덱스: `grading_history_submission_idx`, `submissions_assignment_status_idx`

### 2. Backend Implementation

#### Grading Schema
**파일**: `src/features/submission-grading/backend/schema.ts`
- `GradeSubmissionRequestSchema`: `{ score, feedback, action }`
- `ResubmissionRequestSchema`: `{ feedback, reason }`
- `BatchGradeRequestSchema`: `{ submissionIds, score, feedback }`
- 응답 스키마: `SubmissionDetailSchema`, `BatchGradeResultSchema`

#### Submission Grading Service
**파일**: `src/features/submission-grading/backend/service.ts`
- `getSubmissionDetail(instructorId, submissionId)` → ownership+status 검증
- `gradeSubmission(instructorId, submissionId, payload)` → 점수 검증, 레코드 lock, status 업데이트, history 저장
- `requestResubmission(instructorId, submissionId, payload)` → 상태 변경, reason/feedback 저장
- 동시 채점 대비 `locked_at` 검사 및 설정

**Unit Tests** (`__tests__/service.test.ts`):
- `returns submission detail when instructor owns assignment`
- `rejects grading when score out of range`
- `marks submission graded with score/feedback`
- `locks submission when grading in progress`
- `creates history record on grade`
- `changes status to resubmission_required with reason`

#### Batch Grading Service
**파일**: `src/features/batch-grading/backend/service.ts`
- `batchGrade(instructorId, submissionIds, payload)` → 제출물 소유권/상태 확인 → 트랜잭션으로 일괄 업데이트
- 실패 시 부분 성공 처리 및 결과 반환 (`successIds`, `failedIds`)

**Unit Tests**:
- `grades multiple submissions successfully`
- `skips submissions not in submitted state`
- `fails when submissions belong to different instructor`

#### Grading History Service
**파일**: `src/features/grading-history/backend/service.ts`
- `getHistory(submissionId)` → 최근 채점 이력 정렬, sanitized feedback 제공
- Learner 접근 시 본인 제출 여부 확인

**Unit Tests**:
- `returns chronological history`
- `filters history by submission`

#### Route Registrar
**파일**: `src/features/submission-grading/backend/route.ts`
- `GET /api/submissions/:submissionId`
- `POST /api/submissions/:submissionId/grade`
- `POST /api/submissions/:submissionId/resubmission`
- `POST /api/submissions/batch-grade`
- `GET /api/submissions/:submissionId/history`
- 모든 라우트 `withRoleGuard('instructor')` + ownership 검증

### 3. Frontend Implementation

#### Grading Workspace Page
**파일**: `src/app/(protected)/instructor/assignments/[assignmentId]/grading/page.tsx`
- 측면에 제출물 리스트, 중앙에 제출물 상세/채점 폼, 하단에 히스토리 패널

**QA Sheet**:
- [ ] 제출물 상세가 학습자 정보/제출 콘텐츠/지각 여부를 정확히 보여주는가?
- [ ] 점수 입력이 0-100 범위를 벗어나면 즉시 에러가 표시되는가?
- [ ] 피드백 마크다운 미리보기와 실제 저장본이 일치하는가?
- [ ] 채점 완료 후 다음 제출물로 이동 내비게이션이 동작하는가?
- [ ] 재제출 요청 시 사유 입력이 필수인지 확인되는가?
- [ ] 동시 채점 시 잠금 메시지가 표시되는가?

#### Batch Grading Dialog
**파일**: `src/features/batch-grading/components/BatchGradingDialog.tsx`

**QA Sheet**:
- [ ] 제출물 선택 개수가 표시되는가?
- [ ] 점수/피드백 필드가 공유 상태로 수정 가능한가?
- [ ] 일괄 채점 성공/실패 결과가 사용자에게 명확히 보여지는가?

#### Grading History Drawer
**파일**: `src/features/grading-history/components/HistoryDrawer.tsx`

**QA Sheet**:
- [ ] 히스토리 항목이 최신순으로 정렬되는가?
- [ ] action 종류(graded/resubmission 요청)가 구분되어 표시되는가?
- [ ] 마크다운 피드백이 안전하게 렌더링되는가?

### 4. Shared Utilities
- `src/lib/validation/grading.ts`: `ScoreSchema`, `FeedbackSchema`, `BatchGradeSchema`
- `src/features/submission-grading/hooks/useGradingPanel.ts`: 현재 제출물, 이전/다음 탐색, mutation 처리
- `src/lib/feedback-markdown.ts`: remark + rehype sanitize 파이프라인 구성
- `src/lib/notifications/email.ts`: 채점/재제출 알림 발송 래퍼 (stub → 실제 연동 TODO)

### 5. Integration & Observability
- 채점 완료 후 Learner 대시보드/성적/과제 상세 캐시 무효화 (`['dashboard','learner']`, `['grades','learner']`, `['assignments', assignmentId]`)
- Instructor 대시보드 pending 카드 무효화 (`['instructor','pending']`)
- 로그: `logger.info('submission_graded', { submissionId, instructorId })`
- Alerting: 반복 실패 시 Sentry 태그 `grading`

### 6. Testing Strategy
- **Unit**: 서비스, validation, hook 로직 테스트
- **Integration**: `tests/api/submissions/grading.test.ts` – 단일/재제출/일괄/권한 케이스
- **E2E**: Playwright `grading.spec.ts` – 제출물 열람 → 채점 → 히스토리 확인 → 재제출 요청 플로우
- **Race Condition**: 동시 채점 시 잠금 로직 테스트 (두 요청 동시 발생 시 하나가 409 반환)
