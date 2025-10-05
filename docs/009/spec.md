# UC-009: 과제 관리 (Instructor)

## Primary Actor
- Instructor (강사)

## Precondition
- 사용자가 Instructor 역할로 로그인된 상태
- 하나 이상의 코스를 소유하고 있는 상태
- 코스 관리 권한을 보유한 상태

## Trigger
- Instructor가 특정 코스의 과제 관리 페이지에 접근하거나 새 과제를 생성하려고 시도

## Main Scenario

### 과제 생성
1. Instructor가 코스 상세 페이지에서 "새 과제 생성" 버튼 클릭
2. 시스템이 과제 생성 폼 표시
3. Instructor가 과제 정보 입력
   - 제목, 설명, 마감일, 점수 비중
   - 지각 허용 여부, 재제출 허용 여부
4. Instructor가 "저장" 버튼 클릭
5. 시스템이 입력값 유효성 검사 수행
6. 시스템이 새 과제를 'draft' 상태로 생성
7. 시스템이 생성 완료 메시지 표시

### 과제 수정
8. Instructor가 과제 목록에서 수정할 과제 선택
9. 시스템이 소유 코스 권한 확인
10. 시스템이 과제 수정 폼 표시 (기존 정보 로드)
11. Instructor가 정보 수정
12. Instructor가 "수정 완료" 버튼 클릭
13. 시스템이 변경사항 저장
14. 시스템이 수정 완료 메시지 표시

### 상태 전환
15. Instructor가 과제 상태 변경 (draft/published/closed)
16. 시스템이 상태 전환 규칙 확인
17. 시스템이 상태 업데이트 및 관련 처리 수행
18. 학습자 화면에 변경사항 반영

### 제출물 관리
19. Instructor가 과제의 제출물 목록 조회
20. 시스템이 필터 옵션 제공 (미채점/지각/재제출요청)
21. Instructor가 필터 적용하여 제출물 확인

## Edge Cases

- **권한 없음**: 다른 강사의 코스 과제 관리 시도 시 접근 거부
- **필수 정보 누락**: 제목, 마감일 등 필수 필드 미입력 시 폼 검증 오류
- **과거 마감일**: 현재 시간보다 이전 마감일 설정 시 경고 메시지
- **제출물 있는 상태에서 수정**: 이미 제출물이 있는 과제 수정 시 주의 안내
- **published → closed 자동 전환**: 마감일 도달 시 자동으로 closed 상태로 변경
- **네트워크 오류**: 저장 중 연결 실패 시 임시 저장 및 재시도 안내
- **동시 수정**: 여러 강사가 동시 수정 시도 시 충돌 방지

## Business Rules

- 소유한 코스의 과제만 관리 가능
- 'draft' 상태: 학습자에게 노출되지 않음
- 'published' 상태: 학습자가 제출 가능
- 'closed' 상태: 제출 불가, 채점만 가능
- 마감일 이후 자동으로 'closed' 상태로 전환
- 점수 비중은 0-100 범위 내에서 설정
- 제목은 최대 200자, 설명은 최대 2000자
- 지각/재제출 정책은 과제별로 개별 설정
- 제출물이 있는 과제는 삭제 불가 (archived 처리)
- 마감일 변경 시 수강생에게 알림 발송

## Sequence Diagram

```plantuml
@startuml
participant User as "Instructor"
participant FE
participant BE
participant Database

== 과제 생성 ==
User -> FE: 코스에서 "새 과제 생성" 클릭
FE -> User: 과제 생성 폼 표시

User -> FE: 과제 정보 입력 및 저장
note right: 제목, 설명, 마감일, 점수 비중,\n지각 허용, 재제출 허용
FE -> FE: 클라이언트 유효성 검사
note right: - 필수 필드 확인\n- 마감일 유효성\n- 점수 비중 범위

FE -> BE: POST /api/assignments
note right: {\n  courseId, title, description,\n  dueDate, weight, allowLate,\n  allowResubmission\n}

BE -> Database: 코스 소유권 확인
note right: SELECT * FROM courses\nWHERE id = courseId AND instructor_id = userId
Database -> BE: 소유권 확인 결과

alt 소유권 없음
    BE -> FE: 403 Forbidden
    FE -> User: 권한 없음 메시지
else 소유권 확인
    BE -> BE: 서버 유효성 검사
    BE -> Database: 새 과제 생성
    note right: INSERT INTO assignments\n(..., status = 'draft')
    Database -> BE: 생성된 과제 ID 반환
    BE -> FE: 생성 성공 응답
    FE -> User: 생성 완료 메시지
end

== 과제 수정 ==
User -> FE: 과제 목록에서 수정할 과제 선택
FE -> BE: GET /api/assignments/{assignmentId}

BE -> Database: 과제 정보 및 권한 확인
note right: SELECT a.*, c.instructor_id\nFROM assignments a\nJOIN courses c ON a.course_id = c.id\nWHERE a.id = assignmentId
Database -> BE: 과제 정보 반환

BE -> FE: 과제 정보 응답
FE -> User: 수정 폼 표시 (기존 정보 로드)

User -> FE: 정보 수정 및 저장
FE -> BE: PUT /api/assignments/{assignmentId}

BE -> Database: 제출물 존재 여부 확인
note right: SELECT COUNT(*) FROM submissions\nWHERE assignment_id = assignmentId
Database -> BE: 제출물 수 반환

alt 제출물이 있고 중요 정보 변경
    BE -> FE: 변경 주의 경고
    FE -> User: 확인 다이얼로그 표시
    User -> FE: 변경 확인
end

BE -> Database: 과제 정보 업데이트
Database -> BE: 업데이트 완료
BE -> FE: 수정 성공 응답
FE -> User: 수정 완료 메시지

== 상태 전환 (게시) ==
User -> FE: 과제 상태를 "게시"로 변경
FE -> BE: PATCH /api/assignments/{assignmentId}/status
note right: { status: 'published' }

BE -> Database: 상태 업데이트
note right: UPDATE assignments\nSET status = 'published'
Database -> BE: 업데이트 완료

BE -> BE: 학습자 알림 처리
note right: 수강생들에게 새 과제 알림 발송

BE -> FE: 상태 변경 성공 응답
FE -> User: 게시 완료 알림

== 제출물 목록 조회 ==
User -> FE: 과제의 제출물 목록 클릭
FE -> BE: GET /api/assignments/{assignmentId}/submissions?filter=pending

BE -> Database: 제출물 목록 조회
note right: SELECT s.*, u.name as learner_name\nFROM submissions s\nJOIN users u ON s.learner_id = u.id\nWHERE s.assignment_id = assignmentId\nAND (filter 조건)
Database -> BE: 제출물 목록 반환

BE -> FE: 제출물 목록 응답
FE -> User: 제출물 목록 표시
note right: - 학습자별 제출 상태\n- 채점 여부\n- 지각/재제출 표시\n- 빠른 채점 링크
@enduml
```
