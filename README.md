# VibeMafia Challenge LMS (경량 LMS)

## 빠른 시작

1) 의존성 설치

```bash
npm install
```

2) 환경 변수 설정 (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

3) 개발 서버

```bash
npm run dev
```

## 마이그레이션

`supabase/migrations` 순서대로 적용하세요.

- 0003_init_core_schema.sql: 코어 스키마(프로필, 카테고리/난이도, 코스, 수강, 과제, 제출, 리포트)
- 0004_add_assignment_timestamps.sql: 과제 `published_at`, `closed_at` 추가
- 0005_add_grading_history.sql: 채점 이력 테이블 추가

## 주요 기능

- 인증/온보딩: Supabase Auth, 역할 선택
- 코스 카탈로그/상세: 검색/필터/정렬, 정원/신청 상태
- 수강신청/취소: 정책 가드(중복, 정원, 상태)
- 과제 라이프사이클: 게시/마감/연장, 자동 마감 API (`POST /api/assignments/auto-close`)
- 제출/재제출: 마감/지각/재제출 정책 반영
- 채점/피드백/재제출요청: 채점 이력 기록

## 개발 규칙

- 타입스크립트, React 19, Tailwind
- 라우팅: Next.js App Router, Hono로 백엔드 위임(`/api`)
- 린트: `npm run lint`
