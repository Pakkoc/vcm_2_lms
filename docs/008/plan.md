# UC-008: 코스 관리 (Instructor) - 구현 계획

## 개요

### Feature Modules
- **Course Management Feature** (`src/features/course-management/`)
  - 코스 생성/수정/상태 전환 API와 폼, 뷰 모델을 포함한 핵심 모듈
- **Course Editor Feature** (`src/features/course-editor/`)
  - 마크다운 커리큘럼 편집기, 미리보기, 자동 저장 기능 제공
- **Course Ownership Guard** (`src/lib/course-ownership.ts`)
  - 강사 본인 코스인지 검증하여 API/페이지 접근 제어

### Shared Modules
- **Course Form Schema** (`src/lib/validation/course.ts`)
  - 제목/소개/카테고리/난이도/커리큘럼/상태 검증 스키마
- **useCourseForm Hook** (`src/features/course-management/hooks/useCourseForm.ts`)
  - React Hook Form + autosave + 상태 전환 로직 관리
- **Course Notification Service** (`src/features/course-management/backend/notifications.ts`)
  - 상태 변경 시 수강생 알림 발송

## Diagram

```mermaid
graph TD
  subgraph "App Layer"
    A[(protected)/instructor/courses/page.tsx]
    B[CourseListPanel]
    C[(protected)/instructor/courses/new/page.tsx]
    D[(protected)/instructor/courses/[courseId]/edit/page.tsx]
    E[CourseStatusToggle]
  end

  subgraph "Feature Layer"
    F[course-management/backend/route.ts]
    G[CourseManagementService]
    H[course-editor/components/MarkdownEditor]
    I[CourseNotificationService]
  end

  subgraph "Shared"
    J[CourseFormSchema]
    K[useCourseForm]
    L[CourseOwnershipGuard]
  end

  subgraph "Database"
    M[(courses)]
    N[(course_revisions)]
    O[(enrollments)]
  end

  A --> F --> G
  C --> F
  D --> F
  G --> M
  G --> N
  G --> I
  C --> J
  D --> J
  C --> K
  D --> K
  E --> L
```

## Implementation Plan

### 1. Database Schema Updates
**파일**: `supabase/migrations/0010_course_management.sql`
- `courses` 테이블 컬럼 보강: `slug`(UNIQUE), `published_at`, `archived_at`, `category_id`, `difficulty_id`, `curriculum_markdown`, `curriculum_html`
- `course_revisions` 테이블 신규: `id`, `course_id`, `instructor_id`, `payload`, `created_at` – 주요 정보 수정 시 이력 저장
- `courses_status_idx`, `courses_slug_idx` 인덱스 추가
- Supabase RLS: Instructor(소유자)만 update/delete 허용, draft 삭제 조건 구현

### 2. Backend Implementation

#### Course Schema
**파일**: `src/features/course-management/backend/schema.ts`
- `CreateCourseSchema`, `UpdateCourseSchema`, `CourseStatusSchema`
- 응답용 `CourseDetailSchema`

#### Course Management Service
**파일**: `src/features/course-management/backend/service.ts`
- `createCourse(instructorId, payload)` → slug 생성, draft 상태로 INSERT, revision 기록
- `updateCourse(instructorId, courseId, payload)` → ownership 검증 후 UPDATE + revision 저장
- `changeStatus(instructorId, courseId, status)` → 전환 규칙 검사 후 상태 및 `published_at/archived_at` 갱신, 알림 트리거
- `deleteCourse(instructorId, courseId)` → draft & zero enrollments 조건 검증 후 soft delete (optional)

**Unit Tests** (`__tests__/service.test.ts`):
- `creates draft course with valid payload`
- `rejects update when instructor does not own course`
- `prevents publish without required fields`
- `archives course and triggers notification`
- `prevents delete when enrollments exist`

#### Route Registrar
**파일**: `src/features/course-management/backend/route.ts`
- `POST /api/courses`
- `GET /api/courses/:courseId` (소유자 검증)
- `PUT /api/courses/:courseId`
- `PATCH /api/courses/:courseId/status`
- `DELETE /api/courses/:courseId`
- 모든 라우트에 `withRoleGuard('instructor')` + `CourseOwnershipGuard`

#### Notifications Service
**파일**: `src/features/course-management/backend/notifications.ts`
- `notifyCourseStatusChange(courseId, status)` → Learner에게 이메일/인앱 알림 (Supabase Functions or TODO)
- 테스트용 stub 구현 후 실제 인프라 연동 시 확장

### 3. Frontend Implementation

#### Course List Page
**파일**: `src/app/(protected)/instructor/courses/page.tsx`
- 소유 코스 목록, 상태별 그룹 필터, 빠른 액션 버튼

**QA Sheet**:
- [ ] 코스 목록이 상태(Tag)와 함께 표시되는가?
- [ ] 새 코스 버튼이 신규 페이지로 이동하는가?
- [ ] 상태 필터(전체/draft/published/archived)가 동작하는가?
- [ ] 네트워크 오류 시 재시도 UI가 노출되는가?

#### Course Create Page
**파일**: `src/app/(protected)/instructor/courses/new/page.tsx`
- `CourseForm` 컴포넌트 렌더링, 제출 후 상세 편집 페이지로 이동

**QA Sheet**:
- [ ] 필수 필드 누락 시 즉시 에러가 표시되는가?
- [ ] 커리큘럼 미리보기가 Markdown → HTML로 정확히 변환되는가?
- [ ] 저장 후 성공 토스트와 함께 편집 페이지로 이동하는가?
- [ ] 임시 저장(autosave) 작동 여부

#### Course Edit Page
**파일**: `src/app/(protected)/instructor/courses/[courseId]/edit/page.tsx`
- 초기 데이터 프리패치, 상태 전환 토글 포함

**QA Sheet**:
- [ ] 소유자가 아닐 경우 접근이 차단되는가?
- [ ] 수정 후 저장 시 revision이 기록되는가? (확인용 로그 또는 API 응답)
- [ ] 상태 전환 시 확인 다이얼로그가 표시되는가?
- [ ] published 상태에서 핵심 정보 수정 시 경고가 표시되는가?

#### Course Form Components
**위치**: `src/features/course-management/components/`
- `CourseForm.tsx`, `CourseStatusToggle.tsx`, `CurriculumEditor.tsx`, `DiscardDraftDialog.tsx`

**QA Sheet**:
- [ ] `CourseStatusToggle`가 허용되지 않은 전환을 막는가?
- [ ] `CurriculumEditor`가 1000자 제한과 미리보기를 제공하는가?
- [ ] autosave 동작 시 사용자에게 피드백(저장 시간)이 제공되는가?

### 4. Shared Utilities
- `src/lib/validation/course.ts`: `CourseFormSchema`, `CourseStatusTransitionMap`
- `src/features/course-management/hooks/useCourseForm.ts`: 폼 상태, autosave(1초 디바운스), dirty 체크
- `src/lib/course-ownership.ts`: `assertCourseOwnership(supabase, courseId, instructorId)`
- `src/lib/markdown.ts`: 커리큘럼 Markdown → HTML 변환 (gray-matter + remark)

### 5. Integration & Observability
- `src/backend/hono/app.ts`에 `registerCourseManagementRoutes` 추가
- course publish/archive 후 `queryClient.invalidateQueries(['courses','catalog'])`
- RLS 업데이트: Instructor만 자신의 코스 update/delete 가능, draft insert는 본인만
- 로깅: `logger.info('course_status_changed', { courseId, status })`
- TODO: 상태 전환 시 Learner 알림 – Supabase Functions 호출 또는 external webhook

### 6. Testing Strategy
- **Unit**: 서비스/validation/form hook 테스트 (Vitest)
- **Integration**: `tests/api/courses/manage.test.ts` – 생성/수정/상태전환/삭제/권한 오류
- **E2E**: Playwright `course-management.spec.ts` – 생성 → 편집 → publish → archive 전 흐름
- **Regression**: autosave 중 네트워크 오류 발생 시 사용자 경고/재시도 동작 검증
