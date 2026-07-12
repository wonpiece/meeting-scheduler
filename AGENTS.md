# 프로젝트 개요

## 프로젝트 목적

토스 PD Challenge 제출용 **회의 일정 추천 프로토타입**이다. 여러 참석자의 기존 일정·회사 공통 시간·회의실 가용성을 종합해, 회의 주최자(김지원, `ME_ID = "yj"`)가 **확정 가능한 후보 시간**을 빠르게 고를 수 있게 한다.

React + Vite 단일 페이지 앱이며, 실제 캘린더 API 연동 없이 **더미 데이터 + localStorage 영속화**로 데모 시나리오를 재현한다.

## 현재 기능

- **주간 캘린더 뷰**: 월~금 5일 그리드, 다중 구성원 일정 오버레이 표시
- **캘린더 목록 토글**: 사이드바에서 보고 싶은 구성원 선택
- **미니 월간 캘린더**: 2026년 7월 기준 날짜 탐색 (해당 주 월요일로 이동)
- **일정 추가 위저드 (`CreationWizard`)**
  - 툴바 "일정 추가하기" → `quickBase` 플로우 (시간·회의실 필요 여부 중심)
  - 캘린더 빈 칸 클릭 → `base` 플로우 (날짜·시간·회의실 직접 지정)
  - 참석자 1명(본인만): 추천 없이 **즉시 생성**
  - 참석자 2명 이상: **로딩 UI → 후보 3개 추천 → 선택 확정**
- **일정 상세**
  - 일반 일정: `EventDetailModal`
  - 추천으로 확정한 회의: `ConfirmedDetailModal` (참석자 RSVP 데모, 챙길 점 체크리스트)
- **관리 패널 (`AdminPanel`)**: 회사 시간, 직무, 팀, 회의실, 구성원 CRUD
- **RSVP 데모**: 선택 참석자 배지 클릭으로 pending → yes → no 순환 (캘린더 색상 반영)

## 주요 화면

| 화면 | 컴포넌트 | 설명 |
|------|----------|------|
| 메인 캘린더 | `MeetingSchedulerApp`, `Sidebar`, `CalendarGrid` | 헤더 + 사이드바 + 주간 그리드 |
| 일정 추가 | `CreationWizard` | step: `quickBase` / `base` / `datetime` / `attendees` / `room` / `loading` / `3`(후보) |
| 후보 추천 결과 | `CreationWizard` step 3 | 확정 가능 일정, 확인할 점, 회의실 선택 |
| 일반 일정 상세 | `EventDetailModal` | 제목·날짜·시간·유형 |
| 확정 회의 상세 | `ConfirmedDetailModal` | 참석자·회의실·챙길 점 |
| 관리 | `AdminPanel` | 회사 / 구성원 탭 |

---

# 폴더 구조

```
meeting-scheduler/
├── index.html              # Vite 엔트리 HTML
├── package.json
├── vite.config.js
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx            # React 루트 마운트, Pretendard 폰트 로드
│   ├── App.jsx             # MeetingScheduler 래퍼
│   ├── App.css
│   ├── index.css
│   ├── MeetingScheduler.jsx  # ★ 핵심: 데이터·로직·UI 전부 단일 파일 (~1750줄)
│   └── assets/icons/       # SVG 아이콘 (?raw import)
└── (루트의 App.jsx, MeetingScheduler.jsx 등)  # 레거시 중복 파일 — src/ 가 실제 진입점
```

**아키텍처 특징**: 별도 `components/`, `hooks/`, `utils/` 분리 없음. `src/MeetingScheduler.jsx` 하나에 데이터 모델, 추천 엔진, UI가 모두 포함된다.

---

# 데이터 구조

## people

**생성**
- 초기값: `PEOPLE_BASE` (6명, Figma 디자인 기반 이름·아바타 색)
- AdminPanel "구성원" 탭에서 추가/수정/삭제
- `usePersistentState(STORAGE_KEYS.people, PEOPLE_BASE)` → localStorage `meeting-scheduler:people-v2`

**스키마**
```js
{
  id: string,        // "yj", "ky", ...
  name: string,
  team: string,      // teams 목록 중 하나
  role: string,      // jobs.name 과 매칭 (예: "Product Designer")
  tower: string,     // "미르타워" | "solar타워"
  floor: number,
  avatarBg: string,
  avatarText: string,
}
```

**사용**
- 캘린더 그리드·아바타·참석자 검색
- 일정 추천 시 참석 가능 여부 판단 (`getPersonStatus`)
- 회의실 추천 시 층/타워 근접도 (`pickBestRoom`)
- 직군(`role`) 변경 시 더미 일정 재생성 (`generateRoleEventsForPerson`)

**고정 상수**: `ME_ID = "yj"` — 주최자, 삭제 불가, 위저드 기본 참석자

---

## events

**생성**
- 초기값: `generateInitialEvents(PEOPLE_BASE)` → 사람별 3주치 더미 일정
- 일정 추가/추천 확정: `addEventsForAttendees`
- AdminPanel에서 role 변경 시 `roleDemo` 이벤트만 교체
- `usePersistentState(STORAGE_KEYS.events, INITIAL_EVENTS)` → `meeting-scheduler:events-v3`

**저장 형태**: `{ [personId: string]: Event[] }` — 사람별 배열

**Event 스키마**
```js
{
  id: string,
  title: string,
  start: string,       // "YYYY-MM-DDTHH:mm:ss" (로컬, toISOString 미사용)
  end: string,
  visibility: "public" | "private",
  type: "meeting" | "focus" | "personal" | "external" | "ooo" | "lunch",
  movable: boolean,    // true면 조율 가능 충돌
  roleDemo?: boolean,  // 더미 생성 일정 (Admin role 변경 시 교체 대상)
  groupId?: string,    // 다중 참석 회의 그룹 ID
  room?: Room,         // quickCreate 시
  meetingMeta?: {      // 추천 확정 회의 메타
    requiredIds, optionalIds, room, checkpoints, start, end
  },
}
```

**사용**
- `CalendarGrid`: `events[personId]`를 날짜 prefix(`e.start.startsWith(day)`)로 필터
- 추천 엔진: `getPersonStatus`, `getAdjacentEvent`, `getDayMeetingCount`
- `groupId` 있으면 확정 회의 → RSVP·ConfirmedDetailModal
- `deleteMeetingGroup(groupId)`: 그룹 전체 삭제

---

## rooms

**생성**
- 초기값: `ROOMS_BASE` (4개)
- AdminPanel "회의실" 카드에서 CRUD
- `usePersistentState(STORAGE_KEYS.rooms, ROOMS_BASE)` → `meeting-scheduler:rooms`

**스키마**
```js
{ id, name, tower, floor, capacity }
```

**사용**
- `getAvailableRooms`: capacity + `ROOM_EVENTS` 충돌 검사
- `pickBestRoom`: 참석자 층/타워 근접도 점수
- CreationWizard 회의실 선택·RoomPicker
- **주의**: `ROOM_EVENTS`(회의실별 예약 더미)는 **하드코딩** 상수이며 localStorage와 무관

---

## teams

**생성**
- 초기값: `TEAMS_BASE` = `["사업실", "플랫폼팀", "그로스팀", "경영지원실"]`
- AdminPanel에서 CRUD
- `usePersistentState(STORAGE_KEYS.teams, TEAMS_BASE)` → `meeting-scheduler:teams`

**사용**
- people.team 선택 드롭다운
- `pickBestRoom`에서 crossTeam 판별 (주최자 팀 vs 다른 참석자 팀)

---

## companySettings

**생성**
- 초기값: `DEFAULT_COMPANY_SETTINGS`
- AdminPanel "회사 시간"에서 수정
- `normalizeCompanySettings`로 0~24 시간 클램프
- `usePersistentState(STORAGE_KEYS.companySettings, ...)` → `meeting-scheduler:company-settings`

**스키마**
```js
{
  lunchStart: number,   // 소수 시간 (13 = 13:00, 14.25 = 14:15)
  lunchEnd: number,
  commuteIn: number,    // 출근 (슬롯·캘린더 밴드 시작)
  commuteOut: number,   // 퇴근
}
```

**사용**
- `generateSlots`: 업무 시간대 슬롯 생성
- `getCompanyBurden`: 점심·출근 직후·퇴근 직전 체크포인트
- `CalendarGrid`: 점심/출근/퇴근 배경 밴드 위치·라벨
- 추천 `metrics.burdenAvoided` 점수

---

## 기타 영속 데이터

| 키 | 내용 |
|----|------|
| `meeting-scheduler:jobs` | 직무 목록 `{ id, name, short }` — people.role·더미 일정 프로필 연결 |
| `meeting-scheduler:rsvp` | `{ "${groupId}:${personId}": "yes" \| "no" }` |

**비영속 state**: `visibleIds`(캘린더 표시 인원), `weekStart`, `wizard`, `detail`, `toast`, `showAdmin`

---

# 일정 추천 로직

진입점: `generateCandidates(request, people, events, companySettings, rooms)`

`request` 구성 (CreationWizard step 3):
```js
{
  title, purpose, durationMinutes,
  dateRangeStart, dateRangeEnd,  // WEEK_DAYS[0]~[4] + commuteIn/Out
  requiredRoom, forcedRoomId,
  requiredIds, optionalIds,
}
```

## 후보 생성

`generateSlots(request, companySettings)`

1. `dateRangeStart` ~ `dateRangeEnd` 날짜 순회
2. 주말(토·일) 제외
3. `commuteIn` ~ `commuteOut` 범위를 **30분 단위**로 슬롯 생성
4. 슬롯 종료 시각이 `commuteOut`을 넘지 않는 것만 포함
5. 각 슬롯: `{ start: Date, end: Date }`

## 후보 평가

`evaluateSlot(slot, request, people, floorOf, events, companySettings, rooms)`

**참석자 상태** (`getPersonStatus`):
| state | 조건 |
|-------|------|
| `available` | 충돌 없음 |
| `movable_conflict` | `movable: true` 일정과만 겹침 |
| `unavailable` | external/ooo/non-movable 충돌 |

**status 결정**:
| status | 조건 |
|--------|------|
| `not_recommended` | 필수 참석자 hard unavailable |
| `needs_coordination` | 필수 참석자 movable conflict 또는 회의실 없음 |
| `has_checkpoints` | soft 이슈만 존재 |
| `ready` | 이슈 없음 |

**metrics** (정렬용): `requiredAvailable`, `roomAvailable`, `totalAvailable`, `optionalAvailable`, `roomCount`, `burdenAvoided`, `bufferCount`

## 후보 정렬

1. `not_recommended` 제외
2. `sortCandidates(visible, request.purpose)`:
   - 1차: `STATUS_RANK` (ready < has_checkpoints < needs_coordination)
   - 2차: `PURPOSE_ORDER[purpose]` metric 키 순서대로 내림차순
   - 3차: `start` 오름차순 (이른 시간 우선)
3. 겹치는 시간대 제거하며 **최대 3개** 선택
4. `addComparativeReasons`: 상대 비교 validation 문구 추가

**purpose별 metric 우선순위**:
| purpose | 우선 metric |
|---------|-------------|
| decision | requiredAvailable → roomAvailable → totalAvailable → burdenAvoided → bufferCount |
| ideation | requiredAvailable → totalAvailable → optionalAvailable → ... |
| discussion | requiredAvailable → totalAvailable → bufferCount → ... |
| share_followup | requiredAvailable → burdenAvoided → bufferCount → ... |

## 회의실 추천

1. `getAvailableRooms`: capacity ≥ 참석 수, `ROOM_EVENTS`와 시간 비충돌
2. `forcedRoomId` 있으면 해당 room만 pool
3. `pickBestRoom`:
   - 타 팀 참석자 있으면 → 그들 기준 근접도
   - 없으면 → 전체 참석자 기준
   - 점수: 같은 타워+층 ×2 + 같은 타워 ×1, 동점 시 capacity 작은 room
4. UI `RoomPicker`에서 후보별 room 변경 가능 (`selectedRoomByCandidate`)

## 확인할 점 생성

`evaluateSlot` 내 `checkpoints` 배열:

| type | 트리거 |
|------|--------|
| `soft_time` | 점심/출근 직후/퇴근 직전 (`getCompanyBurden`) |
| `back_to_back_meeting` | available 참석자, 전후 30분 내 인접 일정 |
| `external_day` | optional + external/ooo 충돌 |
| `optional_unavailable` | optional + 기타 충돌 |
| `coordination_needed` | required + movable conflict (purpose별 tradeoff 문구) |
| `fatigue` | available 참석자, 당일 meeting 3개 이상 (lunch 제외) |

확정 후 `ConfirmedDetailModal`의 "챙길 점"은 `soft_time` 제외하고 액션 문구로 변환 표시.

## 회의 목적 추론

**현재 UI/API상 자동 추론은 구현되어 있지 않다.**

- `EMPTY_WIZARD.purpose` = `PURPOSE_DEFAULT` = `"decision"` 고정
- 사용자가 purpose를 바꾸는 UI 없음
- purpose는 추천 **정렬 가중치**, **validationReasons**, **coordination_needed 설명(tradeoffCopy)** 에만 사용

**지원 purpose 값** (향후 제목/참석자 기반 추론 연동 예정):
- `decision` — 의사결정
- `ideation` — 아이디어 논의
- `discussion` — 일반 논의
- `share_followup` — 공유/후속

---

# 더미 데이터 생성 로직

## 직군별 일정 생성 방식

`ROLE_CALENDAR_PROFILES[person.role]` — 6개 직군별 프로필:

| 직군 | weeklyRange | 특징 |
|------|-------------|------|
| Product Manager | 6~9 | 주간 미팅·의사결정 anchor |
| Product Designer | 7~11 | 디자인 리뷰·집중 블록 |
| Operations Manager | 10~14 | 매일 운영 데일리 anchor |
| Business Development Manager | 9~13 | external/lunch typeChance |
| Backend | 7~10 | 데일리 스크럼, NMD focus |
| Frontend | 6~9 | 데일리, 집중 개발 focus |

각 프로필 구조:
- `anchors`: 고정 반복 일정 (repeatEachDay 옵션)
- `pools`: 랜덤 채울 후보 풀 (days, starts, durations, titles, type, typeChance, movable)
- `focusChance`: focus 타입 추가 확률

**흐름** (`buildWeekSchedule`):
1. seed = `hashString(\`${person.id}:${person.name}:${person.role}:${week}\`)`
2. anchors 먼저 배치 (겹치면 skip)
3. `weeklyRange` 목표 개수까지 pools에서 랜덤 추가
4. `focusChance`로 focus 블록 보충
5. 개인 variation (점심 28%, 개인 일정 18%) 추가
6. day·start 순 정렬

**Event 변환** (`generateRoleEventsForPerson`):
- `baseMonday = new Date(2026, 6, 13)` (2026-07-13 월요일)
- `makeDateTime` + `formatLocalDateTime`으로 start/end 문자열 생성
- `roleDemo: true` 플래그

## variation 방식

동일 직군이라도 주·사람마다 다른 일정이 되도록:

1. **시드 기반 PRNG** (`seededRandom`): person.id + name + role + week
2. **pool/title/start/duration 랜덤 선택** (`pickWithRandom`)
3. **시작 시각 jitter**: `[-0.5, 0, 0, 0.5]` 시간 추가 후 9:00~19:30 클램프
4. **주간 이벤트 수**: `weeklyRange` min~max 사이 랜덤 target
5. **type/typeChance**: BDM external 45% 등
6. **focusChance** + focus pool
7. **개인 리듬**: 점심 약속(28%), 개인 일정(18%) 독립 추가

AdminPanel에서 role 변경 시: 기존 `roleDemo` 이벤트 삭제 후 새 role 프로필로 3주 재생성.

## 3주 생성 방식

```js
for (let week = 0; week < 3; week++) {
  const schedule = buildWeekSchedule(person, week);  // week마다 다른 seed
  // day 0=월 ~ 4=금, weekOffset 0/1/2 → 7/13~7/17, 7/20~7/24, 7/27~7/31
}
```

- 1주차: 2026-07-13(월) ~ 07-17(금) — `WEEK_DAYS`와 일치, 추천 탐색 범위
- 2·3주차: 캘린더 주 이동 시 추가 데이터로 표시

---

# 수정 시 주의사항

## toISOString 사용 금지

`Date.prototype.toISOString()`은 UTC로 변환되어 **KST(+9) 환경에서 날짜/시간이 하루 밀리거나 어긋날 수 있다.**

대신 프로젝트 전용 헬퍼 사용:
- `formatLocalDateTime(d)` — 더미 일정 생성 (`:00` 초 고정)
- `toLocalISO(d)` — 일정 저장·meetingMeta
- `dateOnlyStr(d)` — `YYYY-MM-DD`
- `pad2` + 수동 조합

## today 날짜 하드코딩

데모 기준 **오늘 = 2026-07-12 (일요일)**:

| 상수/위치 | 값 |
|-----------|-----|
| `TODAY_DATE` | `12` |
| `EMPTY_WIZARD.dateStr` | `"2026-07-12"` |
| `weekStart` 초기값 | `mondayOf(new Date(2026, 6, 13))` — 다음 주 월요일 |
| `WEEK_DAYS` | 7/13~7/17 (추천 탐색 고정 범위) |
| `MiniMonth` | `"2026년 7월"`, `firstDow = 2` (7/1 수요일) |
| `generateRoleEventsForPerson` baseMonday | `new Date(2026, 6, 13)` |

"오늘" 버튼·하이라이트는 `TODAY_DATE`와 `getMonth() === 6`(7월) 조합. 실제 `new Date()` 사용 시 데모 날짜와 불일치한다.

## localStorage 사용

- `usePersistentState` + `STORAGE_KEYS`로 people/events/jobs/companySettings/rooms/teams/rsvp 영속화
- 스키마 변경 시 **키 버전 suffix** (`-v2`, `-v3`) — 마이그레이션 없음, 키 변경 시 기존 데이터 무시
- `readStored`/`writeStored` try-catch — quota/비활성화 시 fallback
- `ROOM_EVENTS`, `visibleIds`, `weekStart`는 **저장 안 됨**
- Admin/일정 변경 후 새로고침해도 유지됨 — 테스트 시 localStorage 초기화 필요할 수 있음

## SVG 아이콘

- `src/assets/icons/*.svg`를 Vite `?raw` import → `ICONS` 객체
- `SvgIcon` + `normalizeSvg`: width/height 100%, fill/stroke → `currentColor`
- lucide/react-icons 등 **외부 아이콘 라이브러리 미사용**
- 새 아이콘 추가 시: svg 파일 추가 → import → `ICONS` 등록 → 래퍼 컴포넌트

## 기타

- **단일 파일 집중**: 로직·UI 모두 `src/MeetingScheduler.jsx` — 분리 시 import 경로·상태 전달 주의
- **루트 중복 파일**: `src/` 외 루트의 `MeetingScheduler.jsx` 등은 레거시, `src/main.jsx` → `src/App.jsx` 경로가 실제 앱
- **회의실 예약 더미 `ROOM_EVENTS`**: rooms CRUD와 별개 하드코딩 — room id 변경 시 수동 동기화 필요
- **추천 범위 고정**: `WEEK_DAYS`(다음 주 평일)만 탐색, 위저드에서 날짜 지정해도 step 3 추천 request는 `WEEK_DAYS` 기준
- **Figma 디자인 토큰**: `C`, `FONT`, `HOUR_HEIGHT=72` 등 변경 시 전체 UI 레이아웃 영향
- **React 19 + Vite 8**, TypeScript 미사용 (JSX)
