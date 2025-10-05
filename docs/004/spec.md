# UC-004: 과제 상세 열람 (Learner)

## Primary Actor
- Learner (학습자)

## Precondition
- 사용자가 Learner 역할로 로그인된 상태
- 해당 코스에 수강신청된 상태
- 과제가 'published' 상태

## Trigger
- Learner가 내 코스 목록에서 특정 과제를 선택하여 상세 페이지 진입

## Main Scenario

1. Learner가 내 코스 목록에서 Assignment 목록 확인
2. Learner가 특정 Assignment 클릭
3. 시스템이 사용자의 수강 권한 검증
4. 시스템이 Assignment 상태 확인 ('published' 여부)
5. 시스템이 Assignment 상세 정보 조회
6. 시스템이 사용자의 제출 이력 조회
7. 시스템이 과제 상세 페이지 표시
   - 과제 제목 및 설명
   - 마감일 및 남은 시간
   - 점수 비중
   - 제출 정책 (지각 허용/재제출 허용 여부)
   - 제출 상태 및 이력
   - 제출 UI (상태에 따라 활성화/비활성화)

## Edge Cases

- **권한 없음**: 수강하지 않은 코스의 과제 접근 시 접근 거부
- **비공개 과제**: 'draft' 상태 과제 접근 시 "아직 공개되지 않은 과제" 메시지
- **마감된 과제**: 'closed' 상태 과제는 열람 가능하지만 제출 버튼 비활성화
- **삭제된 과제**: 존재하지 않는 과제 ID 접근 시 404 오류
- **로딩 실패**: 과제 정보 로딩 실패 시 재시도 버튼 제공
- **세션 만료**: 로그인 세션 만료 시 로그인 페이지로 리다이렉트

## Business Rules

- 'published' 상태의 과제만 열람 가능
- 수강 중인 코스의 과제만 접근 가능
- 'closed' 상태 과제는 제출 불가, 열람만 가능
- 마감일이 지난 과제도 지각 허용 정책에 따라 제출 가능 여부 결정
- 재제출 허용 정책에 따라 이미 제출한 과제의 재제출 가능 여부 결정
- 제출 이력이 있는 경우 기존 제출 내용 표시
- 점수와 피드백이 있는 경우 함께 표시

## Sequence Diagram

```plantuml
@startuml
participant User as "Learner"
participant FE
participant BE
participant Database

User -> FE: 내 코스에서 Assignment 클릭
FE -> BE: GET /api/assignments/{assignmentId}

== 권한 검증 ==
BE -> Database: 수강 권한 확인
note right: SELECT * FROM enrollments\nWHERE learner_id = userId\nAND course_id = assignment.course_id
Database -> BE: 권한 확인 결과

alt 권한 없음
    BE -> FE: 403 Forbidden
    FE -> User: 접근 권한 없음 메시지
else 권한 있음
    == Assignment 정보 조회 ==
    BE -> Database: Assignment 상세 조회
    note right: SELECT * FROM assignments\nWHERE id = assignmentId
    Database -> BE: Assignment 정보 반환
    
    alt Assignment가 'published' 아님
        BE -> FE: Assignment 비공개 응답
        FE -> User: "아직 공개되지 않은 과제" 메시지
    else Assignment가 'published'
        == 제출 이력 조회 ==
        BE -> Database: 사용자 제출 이력 조회
        note right: SELECT * FROM submissions\nWHERE assignment_id = assignmentId\nAND learner_id = userId
        Database -> BE: 제출 이력 반환
        
        BE -> BE: 제출 가능 여부 판단
        note right: - Assignment 상태 확인\n- 마감일 확인\n- 지각/재제출 정책 확인
        
        BE -> FE: Assignment 상세 정보 응답
        note right: {\n  assignment: {...},\n  submission: {...},\n  canSubmit: boolean,\n  policies: {...}\n}
        
        FE -> FE: UI 상태 설정
        note right: - 제출 버튼 활성화/비활성화\n- 기존 제출 내용 표시\n- 정책 안내 표시
        
        FE -> User: 과제 상세 페이지 표시
        note right: - 과제 정보\n- 제출 상태\n- 제출 UI\n- 정책 안내
    end
end
@enduml
```
