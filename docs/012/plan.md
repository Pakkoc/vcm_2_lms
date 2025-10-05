# UC-012: 운영 (Operator) - 구현 계획

## 개요

### Feature Modules
- **Admin Dashboard Feature** (`src/features/admin-dashboard/`)
  - 운영자 대시보드, 시스템 지표, 알림 설정 UI & API 제공
- **Report Management Feature** (`src/features/report-management/`)
  - 신고 목록/상세/처리 액션/상태 전환을 담당
- **Metadata Management Feature** (`src/features/metadata-management/`)
  - 카테고리, 난이도 등 메타데이터 CRUD + 사용 현황 검증
- **Audit Trail Feature** (`src/features/audit-trail/`)
  - 모든 운영 활동을 분류/조회할 수 있는 로그 API 및 UI

### Shared Modules
- **Admin Auth Guard** (`src/lib/admin-guard.ts`)
  - Operator 권한 검증 및 접근 제어 미들웨어
- **useAdminTable Hook** (`src/features/admin-dashboard/hooks/useAdminTable.ts`)
  - 테이블 필터/정렬/페이지 상태를 공통으로 관리
- **Notification Dispatcher** (`src/lib/notifications/admin.ts`)
  - 신고 처리, 메타데이터 변경 등 운영 알림 처리 래퍼

## Diagram

```mermaid
graph TD
  subgraph "App Layer"
    A[(protected)/admin/dashboard/page.tsx]
    B[ReportsTable]
    C[ReportDetailDrawer]
    D[MetadataManager]
    E[SystemMetricsCards]
    F[AuditLogTable]
  end

  subgraph "Feature Layer"
    G[admin-dashboard/backend/route.ts]
    H[AdminDashboardService]
    I[report-management/backend/route.ts]
    J[ReportService]
    K[metadata-management/backend/route.ts]
    L[MetadataService]
    M[audit-trail/backend/service.ts]
  end

  subgraph "Shared"
    N[AdminGuard]
    O[useAdminTable]
    P[NotificationDispatcher]
  end

  subgraph "Database"
    Q[(reports)]
    R[(report_actions)]
    S[(categories)]
    T[(difficulty_levels)]
    U[(audit_logs)]
    V[(system_metrics_mv)]
  end

  A --> G --> H --> V
  B --> I --> J --> Q
  C --> J --> R
  D --> K --> L --> S
  D --> L --> T
  F --> M --> U
  G --> N
  I --> N
  K --> N
  M --> N
  B --> O
  D --> O
  C --> P
```

## Implementation Plan

### 1. Database Schema
**파일**: `supabase/migrations/0014_operator_tools.sql`
- `reports` 테이블: `id`, `reporter_id`, `reported_user_id`, `reported_submission_id`, `status`(`received`/`investigating`/`resolved`), `reason`, `description`, `evidence_urls[]`, `created_at`, `updated_at`
- `report_actions` 테이블: `id`, `report_id`, `operator_id`, `action_type`, `notes`, `payload`, `created_at`
- `audit_logs` 테이블: `id`, `actor_id`, `actor_role`, `event`, `target_type`, `target_id`, `metadata`, `created_at`
- `system_metrics_mv` materialized view: 최근 24시간 사용자 수, 오류 수, 평균 응답시간 등 집계 (Supabase SQL)
- 카테고리/난이도 테이블에 `managed_by` 및 `managed_at` 컬럼 추가, `active` 기본값 true
- RLS: Operator 역할만 SELECT/INSERT/UPDATE 허용, audit_logs는 모든 역할 읽기 불가(운영자만)

### 2. Backend Implementation

#### Admin Guard Middleware
**파일**: `src/lib/admin-guard.ts`
- Hono 미들웨어 `withOperatorGuard` 구현: 세션에서 역할 확인, 미일치 시 403 반환

#### Report Management
- **Schema** (`src/features/report-management/backend/schema.ts`): `ReportFiltersSchema`, `ReportDetailSchema`, `ReportActionSchema`
- **Service** (`src/features/report-management/backend/service.ts`):
  - `listReports(filters)` → 상태/기간/키워드 필터
  - `getReport(reportId)` → 상세 + 관련 사용자 정보
  - `updateReportStatus(reportId, status, operatorId)`
  - `applyReportAction(reportId, actionPayload)` → 경고, 제출물 상태 변경, 계정 제한과 같은 후속 처리 호출
- **Unit Tests**:
  - `filters reports by status`
  - `applies warning action and logs audit`
  - `prevents action when operator unauthorized`
- **Routes** (`src/features/report-management/backend/route.ts`): `GET /api/admin/reports`, `GET /api/admin/reports/:id`, `PATCH /api/admin/reports/:id`, `POST /api/admin/reports/:id/action`

#### Metadata Management
- **Schema** (`src/features/metadata-management/backend/schema.ts`): `UpsertCategorySchema`, `UpsertDifficultySchema`
- **Service** (`src/features/metadata-management/backend/service.ts`):
  - `listMetadata()` → categories/difficulties with usage counts
  - `createCategory(payload, operatorId)`
  - `updateCategory(id, payload)` with usage checks
  - `toggleCategory(id, active)` – 사용 중인 경우 비활성만 허용
- **Unit Tests**:
  - `creates category and records audit`
  - `blocks deletion when in use`
  - `updates difficulty level`
- **Routes**: `GET /api/admin/metadata`, `POST /api/admin/metadata/categories`, `PATCH /api/admin/metadata/categories/:id`, 동일 구조로 difficulties

#### Admin Dashboard
- **Service** (`src/features/admin-dashboard/backend/service.ts`): `getSystemMetrics()` (materialized view), `getOpenReportCount()`, `getActiveUsers()`
- **Route**: `GET /api/admin/dashboard`

#### Audit Trail
- **Service** (`src/features/audit-trail/backend/service.ts`): `log(event)` helper, `listLogs(filters)` (actor, event, 기간)
- **Route**: `GET /api/admin/audit-logs`
- 자동 로그 기록: report/metadata/service에서 `auditTrail.log(...)` 호출

#### Notification Dispatcher
- `src/lib/notifications/admin.ts`: Slack/Webhook/Email 등 알림 인터페이스 추상화, 실제 구현 TBD

### 3. Frontend Implementation

#### Admin Dashboard Page
**파일**: `src/app/(protected)/admin/dashboard/page.tsx`
- 카드: 개방 신고 수, 평균 응답 시간, 활성 코스, 시스템 오류 알림
- 차트: 트래픽/오류 추이 (Dummy dataset → 실제 API)

**QA Sheet**:
- [ ] Operator 이외 역할 접근 시 403 페이지가 표시되는가?
- [ ] 각 카드가 API 데이터와 일치하는가?
- [ ] 오류 발생 시 "재시도" 버튼이 동작하는가?

#### Reports Table & Detail
**파일**: `src/features/report-management/components/ReportsTable.tsx`, `ReportDetailDrawer.tsx`

**QA Sheet**:
- [ ] 상태 필터(Received/Investigating/Resolved)가 동작하는가?
- [ ] 신고 상세에 증거 URL, 관련 사용자 정보가 표시되는가?
- [ ] 상태 변경 후 목록이 즉시 갱신되는가?
- [ ] 액션 실행 시 확인 다이얼로그와 성공 토스트가 표시되는가?

#### Metadata Manager
**파일**: `src/features/metadata-management/components/MetadataManager.tsx`

**QA Sheet**:
- [ ] 카테고리/난이도 리스트가 usage count와 함께 표시되는가?
- [ ] 새 카테고리 추가 후 목록이 갱신되는가?
- [ ] 사용 중인 항목 비활성화 시 경고 다이얼로그가 표시되는가?
- [ ] 검색/정렬 기능이 동작하는가?

#### Audit Log Table
**파일**: `src/features/audit-trail/components/AuditLogTable.tsx`

**QA Sheet**:
- [ ] 이벤트, 대상, 시간, 운영자 정보가 표시되는가?
- [ ] 기간 필터가 동작하는가?
- [ ] CSV 내보내기가 정확한가?

### 4. Shared Utilities
- `src/lib/admin-guard.ts`: Hono 미들웨어 + 클라이언트 라우트 보호
- `src/features/admin-dashboard/hooks/useAdminTable.ts`: 공통 테이블 훅 (페이지, 정렬, 검색)
- `src/lib/notifications/admin.ts`: `sendReportUpdate`, `sendMetadataChange`, `sendSystemAlert`
- `src/lib/audit.ts`: `recordAudit({ actorId, event, target })`

### 5. Integration & Observability
- `src/backend/hono/app.ts`에 admin 라우트 등록 (`registerReportRoutes`, `registerMetadataRoutes`, 등)
- 운영자 액션 후 캐시 무효화: `['courses','catalog']` (메타데이터 변경), `['reports','list']`
- Slack/Webhook 연동 TODO: Notification dispatcher에서 stub 처리
- 모니터링 지표: Prometheus exporter 또는 Supabase metrics 활용 (문서화 필요)
- 보안: Admin 라우트는 RLS 외에도 rate limit 적용 (`src/backend/middleware/rateLimit.ts`)

### 6. Testing Strategy
- **Unit**: Report/Metadata 서비스, guard, audit 유틸 테스트
- **Integration**: `tests/api/admin/reports.test.ts`, `tests/api/admin/metadata.test.ts`
- **E2E**: Playwright `admin-operations.spec.ts` – 로그인 → 신고 처리 → 메타데이터 변경
- **Security**: 권한 없는 사용자 시 403, SQL Injection 방지, audit 로그 누락 여부 테스트
- **Performance**: 신고 목록 페이지네이션(>1000건)에서 응답 시간 측정
