# UC-009: 과제 관리 (Instructor) - 구현 계획

## 개요

### Feature Modules
- **Assignment Management Feature** (`src/features/assignment-management/`)
  - 과제 생성/수정/상태 전환 API와 Instructor UI 전반을 담당하는 모듈
- **Assignment Editor Feature** (`src/features/assignment-editor/`)
  - 과제 폼, 마감일 선택기, 정책 설정 컴포넌트 묶음
- **Submission Admin Feature** (`src/features/submission-admin/`)
  - 과제별 제출물 리스트, 필터, 빠른 채점 링크 제공

### Shared Modules
- **Assignment Form Schema** (`src/lib/validation/assignment.ts`)
  - 제목/설명/마감일/비중/정책에 대한 검증 규칙
- **useAssignmentForm Hook** (`src/features/assignment-management/hooks/useAssignmentForm.ts`)
  - React Hook Form + dirty 상태 + 마감일 경고 로직 관리
- **Assignment Ownership Guard** (`src/lib/assignment-ownership.ts`)
  - 과제와 강사 소유 코스를 매핑하여 접근 제어

## Diagram

```mermaid
graph TD
  subgraph "App Layer"
    A[(protected)/instructor/courses/[courseId]/assignments/page.tsx]
    B[AssignmentList]
    C[(protected)/instructor/assignments/new/page.tsx]
    D[(protected)/instructor/assignments/[assignmentId]/edit/page.tsx]
    E[SubmissionTable]
  end

  subgraph "Feature Layer"
    F[assignment-management/backend/route.ts]
    G[AssignmentManagementService]
    H[assignment-editor/components/AssignmentForm]
    I[submission-admin/backend/service.ts]
  end

  subgraph "Shared"
    J[AssignmentFormSchema]
    K[useAssignmentForm]
    L[AssignmentOwnershipGuard]
  end

  subgraph "Database"
    M[(assignments)]
    N[(assignment_revisions)]
    O[(submissions)]
    P[(courses)]
  end

  A --> F --> G
  C --> F
  D --> F
  G --> M
  G --> N
  G --> P
  E --> I --> O
  C --> J
  D --> J
  C --> K
  D --> K
  F --> L
```

## Implementation Plan

### 1. Database Schema Updates
**파일**: `supabase/migrations/0011_assignment_management.sql`
- `assignments` 테이블에 `instructions_markdown`, `instructions_html`, `auto_close_at`(마감 자동 종료 시각) 컬럼 추가
- `assignment_revisions` 테이블 생성: `id`, `assignment_id`, `instructor_id`, `payload`, `created_at`
- 마감 자동 전환을 위한 `close_expired_assignments()` 함수 + Supabase cron job (매 15분)
- 인덱스: `assignments_course_idx`, `assignment_revisions_assignment_idx`

### 2. Backend Implementation

#### Assignment Schema
**파일**: `src/features/assignment-management/backend/schema.ts`
- `CreateAssignmentSchema`, `UpdateAssignmentSchema`, `AssignmentStatusSchema`
- 응답 스키마: `AssignmentDetailSchema`

#### Assignment Management Service
**파일**: `src/features/assignment-management/backend/service.ts`
- `createAssignment(instructorId, courseId, payload)` → course ownership 검증 → draft insert → revision 기록
- `updateAssignment(instructorId, assignmentId, payload)` → 제출물 존재 여부 확인 후 중요 필드 변경 시 경고 플래그 반환 → revision 저장
- `changeAssignmentStatus(instructorId, assignmentId, status)` → 전환 규칙(마감일, 제출물 존재 등) 검사 후 상태 변경, 학습자 알림 트리거
- `listAssignments(courseId)` → 상태/마감일로 정렬

**Unit Tests** (`__tests__/service.test.ts`):
- `creates draft assignment`
- `rejects when instructor does not own course`
- `prevents dueDate in the past`
- `warns when updating assignment with submissions`
- `auto closes when status=published and dueDate passed`

#### Submission Admin Service
**파일**: `src/features/submission-admin/backend/service.ts`
- `getSubmissions(assignmentId, filters)` → pending/late/resubmission 필터 적용, 학습자 정보 join
- Instructor 권한 확인 후 데이터 반환

**Unit Tests**:
- `filters pending submissions`
- `includes learner profile info`
- `respects pagination`

#### Route Registrar
**파일**: `src/features/assignment-management/backend/route.ts`
- `POST /api/assignments`
- `GET /api/assignments/:assignmentId`
- `PUT /api/assignments/:assignmentId`
- `PATCH /api/assignments/:assignmentId/status`
- `GET /api/courses/:courseId/assignments`
- `GET /api/assignments/:assignmentId/submissions`
- `withRoleGuard('instructor')` + `AssignmentOwnershipGuard`

### 3. Frontend Implementation

#### Assignment List Page
**파일**: `src/app/(protected)/instructor/courses/[courseId]/assignments/page.tsx`
- 과제 목록, 상태 필터, 빠른 액션 버튼, 제출물 카운트

**QA Sheet**:
- [ ] 과제 리스트가 상태별로 필터링되는가?
- [ ] 마감일이 가까워지면 경고 배지가 표시되는가?
- [ ] 제출물 카운트가 실시간으로 반영되는가?
- [ ] 새 과제 버튼이 생성 페이지로 이동하는가?

#### Assignment Create/Edit Page
**파일**: `src/app/(protected)/instructor/assignments/[assignmentId]/edit/page.tsx`
- `AssignmentForm` 컴포넌트 사용, 마감일 선택기 포함

**QA Sheet**:
- [ ] 필수 필드 미입력 시 폼 에러 표시되는가?
- [ ] 과거 시각을 마감일로 선택하면 경고가 표시되는가?
- [ ] 지각/재제출 정책 토글이 상태를 업데이트하는가?
- [ ] 저장 후 성공 토스트와 함께 목록 또는 상세 페이지로 이동하는가?
- [ ] 제출물이 있는 과제 수정 시 경고 다이얼로그가 표시되는가?

#### Submission Admin Table
**파일**: `src/features/submission-admin/components/SubmissionTable.tsx`
- 제출물 목록, 필터 chips, 정렬(제출일, 상태)

**QA Sheet**:
- [ ] 필터 Chips가 올바르게 토글되는가?
- [ ] 각 행에 학습자, 제출 상태, 점수, 지각 여부가 표시되는가?
- [ ] "채점하기" 버튼이 채점 페이지로 이동하는가?

### 4. Shared Utilities
- `src/lib/validation/assignment.ts`: 마감일 >= 현재시간+5분, weight 범위, 제목/설명 길이 검증, Markdown sanitize
- `src/features/assignment-management/hooks/useAssignmentForm.ts`: 폼 상태, due date guard, 자동 저장(Draft)
- `src/lib/assignment-ownership.ts`: 과제 → 코스 → 강사 관계 확인
- `src/lib/datetime.ts`: 타임존 처리, ISO 문자열 변환

### 5. Integration & Observability
- `src/backend/hono/app.ts`에 `registerAssignmentManagementRoutes` 추가
- 마감일 변경 시 Learner 알림 발송(`CourseNotificationService.notifyAssignmentUpdated`)
- 자동 종료 함수 실행 결과는 `logger.info('assignment_auto_closed', { assignmentId })`
- 캐시 무효화: `queryClient.invalidateQueries(['assignments', courseId])` 및 Learner 대시보드 업데이트

### 6. Testing Strategy
- **Unit**: 서비스/폼 스키마/ownership 유틸 검증
- **Integration**: `tests/api/assignments/manage.test.ts` – 생성/수정/상태 전환/필터
- **E2E**: Playwright `assignment-management.spec.ts` – 과제 생성 → 게시 → 제출물 확인 흐름
- **Cron**: Supabase cron 함수 로컬에서 시뮬레이션, auto close 테스트
