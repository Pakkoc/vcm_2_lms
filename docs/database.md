# 데이터베이스 및 데이터 플로우 개요

## 시스템 데이터 플로우
- 인증 미들웨어는 `middleware.ts`에서 Supabase SSR 클라이언트를 생성하고, 보호 대상 경로(`shouldProtectPath`)에 접근하는 비인증 사용자를 로그인 페이지로 리다이렉션합니다.
- 클라이언트는 `@/lib/supabase/browser-client`로 생성한 Supabase 브라우저 클라이언트를 통해 회원가입 · 로그인 · 로그아웃을 처리하고, React Query(`useCurrentUser`)로 세션 스냅샷을 동기화합니다.
- 기능 모듈은 `/api/[[...hono]]` Route Handler를 거쳐 Hono 앱으로 위임되며, `errorBoundary → withAppContext → withSupabase` 미들웨어 체인을 통과한 뒤 기능별 라우터(`registerExampleRoutes`)에서 Supabase 서비스 역할 클라이언트를 사용합니다.
- 백엔드 서비스(`getExampleById`)는 Supabase에서 가져온 레코드를 Zod 스키마로 검증한 후 React Query 훅(`useExampleQuery`)이 소비할 DTO로 매핑합니다.

## Supabase 스키마 요약
### 확장 및 공통 객체
- `pgcrypto`: `gen_random_uuid()` 생성을 위해 기본 확장을 활성화합니다.
- `auth.users`: 이메일/비밀번호 기반 인증에 사용되는 Supabase 관리형 테이블이며, 서비스 로직은 읽기 전용으로만 참조합니다.

### `public.example`
| 컬럼 | 타입 | 기본값/제약 | 설명 |
| --- | --- | --- | --- |
| `id` | `uuid` | `gen_random_uuid()` | 예시 리소스의 기본 키 |
| `full_name` | `text` | NULL 허용 | 사용자 표시용 이름, 미지정 시 프론트에서 기본값 처리 |
| `avatar_url` | `text` | NULL 허용 | 프로필 이미지 URL |
| `bio` | `text` | NULL 허용 | 소개 문구 |
| `created_at` | `timestamptz` | `now()` | 레코드 생성 시각 |
| `updated_at` | `timestamptz` | `now()` & trigger | 레코드 갱신 시각, 트리거로 자동 갱신 |

- 인덱스: `example_updated_at_idx`는 최신 레코드 정렬/캐시 무효화 시 효율을 제공합니다.
- 트리거: `example_set_updated_at`가 `updated_at`을 자동으로 현재 시각으로 갱신합니다.

## 운영 및 마이그레이션 지침
- Supabase 서비스 역할 키는 서버 전용 환경 변수(`SUPABASE_SERVICE_ROLE_KEY`)에만 저장하고, 브라우저에는 `NEXT_PUBLIC_SUPABASE_ANON_KEY`만 노출합니다.
- 새 스키마는 `supabase db push` 또는 Supabase Dashboard SQL Editor에서 `/supabase/migrations`의 순서대로 실행하여 반영합니다.
- 마이그레이션 적용 후에는 `npm run lint`와 `npm run dev`를 실행해 Hono Route Handler(`/api/[[...hono]]`)가 정상적으로 `public.example` 레코드를 조회하는지 확인합니다.
