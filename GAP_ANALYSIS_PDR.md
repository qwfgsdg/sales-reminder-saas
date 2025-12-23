# Product Design Report (PDR) & Gap Analysis
**대상**: `백업9.html` (Legacy Prototype) vs `sales-reminder-saas` (Current Vue Project)
**작성일**: 2024-12-24

## 1. 개요 (Overview)
현재 SaaS 버전(`sales-reminder-saas`)은 `백업9.html`의 핵심 기능을 Vue/Quasar 기반으로 이관하는 과정에 있으나, **사용자 경험(UX)의 디테일과 일부 핵심 워크플로우**에서 상당한 누락이 발견되었습니다. 특히 "영업 비서"로서의 정체성을 부여하는 **Smart Modal의 다기능성**과 **Calendar의 유기적 연동**이 구현되지 않았습니다.

## 2. 핵심 기능 누락 (Critical Gaps)

### 2.1 Smart Modal (결과 처리 모달)의 로직 및 기능 퇴보
가장 심각한 차이점입니다. 레거시 버전은 모달 하나에서 모든 수정/참조/결과처리가 가능했으나, 현재 버전은 단순한 선택지로 축소되었습니다.

| 구분 | 백업9.html (Legacy) | SaaS (Current) | 프론트엔드 차이 분석 |
| :--- | :--- | :--- | :--- |
| **내방(Visit) 로직** | **별도 플로우 존재**: '내방 예약' 클릭 시 날짜/시간을 입력받아 **새로운 미래 일정**으로 등록 (Icon: 🤝) | **오류**: '내방 예약'이 '성공(Success)' 단계로 잘못 연결됨. 미래 일정이 아닌 완료 처리로 로직 혼선. | Legacy는 `modalStep='visit'` 상태를 따로 관리했으나, Vue Store는 이를 단순히 `result`로 처리하려 함. |
| **헤더 수정 기능** | 모달 헤더에서 즉시 고객명, 전화번호, 시간 수정 가능 (Edit Mode 토글) | **기능 없음**: 단순 텍스트 표시만 가능. 수정 불가. | `isEditing` 상태 변수 및 `input` 바인딩 누락. |
| **인라인 유틸리티** | 하단에 **[메모]**, **[히스토리]** 탭이 있어 모달을 닫지 않고 과거 기록 조회/메모 작성 가능 | **기능 없음**: 해당 탭 자체가 존재하지 않음. | `utilityMode` 상태 관리 및 `transition` 애니메이션 UI 누락. |
| **Reschedule UX** | 오전/오후(AM/PM) 커스텀 토글 버튼 + 직관적 시간 입력 | 표준 브라우저/Quasar Time Picker 의존 | 빠른 입력을 위한 커스텀 UI 컴포넌트 부재. |

### 2.2 Dashboard (대시보드) 인터랙션 부재
| 구분 | 백업9.html (Legacy) | SaaS (Current) | 프론트엔드 차이 분석 |
| :--- | :--- | :--- | :--- |
| **드릴다운 리스트** | 상단 카드(성공, 재통화 등) 클릭 시 **하단에 해당 내역만 필터링된 리스트**가 애니메이션과 함께 등장 | **기능 없음**: 카드가 정적인 숫자만 표시함. 하단 리스트 아예 없음. | `selectedStat` 상태 변수와 `filteredLogs` computed 속성, 그리고 하단 리스트 컴포넌트(`Drill Down List`) 미구현. |
| **차트 연동** | 차트가 주간 활동 추이를 시각화 | 차트는 구현되었으나 데이터 연동 확인 필요. | 유사하게 구현됨. |

### 2.3 Calendar (캘린더) 뷰 누락
현재 `DashboardPage`만 구현되어 있으며, 캘린더 페이지는 파일(`CalendarPage.vue`)만 존재하고 내용은 비어있을 가능성이 높습니다 (파일 크기 232 byte).

*   **누락된 기능**:
    *   월별 달력 그리드 뷰 (`calendar-grid`)
    *   날짜 셀 호버 시 "+" 퀵 버튼 (`quickAdd`)
    *   3개 이상 일정 시 "+N개 더보기" 버튼 및 **Day Detail Modal** (일별 상세 모달)

### 2.4 Notification Stack (알림 스택)
*   **Legacy**: 우측 상단에 알림이 쌓이는(Stack) 형태. "놓친 알림"을 시각적으로 인지하고 한 번에 지우거나 개별 삭제 가능.
*   **SaaS**: `$q.notify` (Toast)를 사용하여 일정 시간 후 사라짐. **놓친 일정을 지속적으로 상기시키는 기능**이 약화됨.

## 3. 프론트엔드/디자인 차이 (Frontend Checklist)

1.  **애니메이션 (Animation)**:
    *   Legacy는 `animate-slideUp`, `animate-fadeIn` 등 커스텀 Keyframe 애니메이션으로 "앱 같은(App-like)" 느낌을 줌.
    *   SaaS는 Quasar의 기본 트랜지션에 의존하여 다소 딱딱한 느낌을 줄 수 있음. `style` 태그 내의 커스텀 애니메이션 이식 필요.
2.  **컬러 시스템 (Visual Identity)**:
    *   Legacy: Slate-900(사이드바) + Blue/Red 포인트의 강렬한 대비.
    *   SaaS: Grey-1 배경의 다소 평범한 Admin 톤. Legacy의 "다크 사이드바 & 화이트 컨텐츠" 레이아웃 부활 고려 필요.
3.  **NLP 미리보기 (Input Preview)**:
    *   Legacy: 입력창 상단에 `[12/25] [010-...]` 형태의 칩이 실시간으로 떠서 파싱 결과를 미리 보여줌.
    *   SaaS: 해당 피드백 UI 없음. 사용자가 엔터를 치기 전까지 어떻게 저장될지 모름.

## 4. 복구/구현 계획 (Action Plan)

이 분석을 바탕으로 다음 순서로 복구를 진행해야 합니다.

1.  **[1순위] Smart Modal 고도화**: `SmartResultModal.vue`를 전면 수정하여 헤더 수정, 유틸리티 탭(메모/검색), 내방(Visit) 별도 플로우를 복원합니다.
2.  **[2순위] 방문(Visit) 로직 분리**: "내방 예약(Task 생성)"과 "내방 성공(History 기록)"을 명확히 구분하는 스토어 액션 추가.
3.  **[3순위] Dashboard 드릴다운**: 카드 클릭 이벤트를 부활시키고 하단 상세 리스트 컴포넌트 추가.
4.  **[4순위] Calendar 구현**: `CalendarPage.vue`에 그리드 캘린더 및 Day Modal 이식.

---
**결론**: 현재 SaaS 버전은 "기능적 뼈대"는 갖추었으나, 백업9.html이 가지고 있던 **"디테일한 사용성(UX)"과 "영업 특화 기능(내방, NLP 피드백)"**이 누락되어 있습니다. 이를 복원하는 것이 급선무입니다.
