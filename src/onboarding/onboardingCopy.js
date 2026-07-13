import { buildCoordinationDraftMessage } from '../config/recommendationPolicy';

export const ONBOARDING_STORAGE_KEY = 'meeting-scheduler:onboarding-v2';
export const TOUR_REVEAL_DELAY_MS = 300;

/** Narrative beats 1–11 (auto-advancing cinematic intro). */
export const ONBOARDING_BEATS = {
  cover: 1,
  factorsIntro: 2,
  factorsMultiply: 3,
  judgmentCost: 4,
  whatIf: 5,
  enterInfo: 6,
  purposePriority: 7,
  findSchedule: 8,
  proposeSchedule: 9,
  actOnCoordination: 10,
  finale: 11,
};

export const FACTOR_COPY = {
  required: {
    label: '필수 요소',
    title: '회의 성사에 필요한 요소',
    detail: '참석자, 시간과 장소',
  },
  soft: {
    label: '정성 요소',
    title: '회의 참석자의 집중을 돕는 요소',
    detail: '연속 회의, 출근 직후, 점심 직후 부담',
  },
};

export const MULTIPLY_COUNT = 6;

/** Purpose priority board — mirrors PURPOSE_SORT_METRICS in recommendationPolicy. */
export const PURPOSE_FLOW = {
  activePurpose: 'decision',
  purposes: [
    {
      id: 'decision',
      label: '의사결정',
      hint: '필수 참석 · 회의실이 먼저',
      priorities: ['필수 참석 가능', '회의실 확보', '전체 참석', '부담 적은 시간', '전후 여유'],
    },
    {
      id: 'ideation',
      label: '아이디어',
      hint: '가능한 사람이 많을수록',
      priorities: ['필수 참석 가능', '전체 참석', '선택 참석', '부담 적은 시간', '회의실'],
    },
    {
      id: 'discussion',
      label: '논의',
      hint: '여유 있는 슬롯 선호',
      priorities: ['필수 참석 가능', '전체 참석', '전후 여유', '부담 적은 시간', '회의실'],
    },
    {
      id: 'share_followup',
      label: '공유·후속',
      hint: '부담을 더 낮춰요',
      priorities: ['필수 참석 가능', '부담 적은 시간', '전후 여유', '전체 참석', '회의실'],
    },
  ],
};

export const MOCK_MEETING = {
  title: 'Q3 로드맵 의사결정',
  attendees: [
    { id: 'yj', name: '김지원', team: '사업실', roleShort: 'PD', avatarBg: '#e6ebfb', avatarText: '#7d7abe', isHost: true },
    { id: 'yc', name: '이예찬', team: '사업실', roleShort: 'PM', avatarBg: '#fbf3d1', avatarText: '#c88e58', isHost: false },
    { id: 'jh', name: '박준호', team: '플랫폼팀', roleShort: 'BE', avatarBg: '#e0f2fe', avatarText: '#0369a1', isHost: false },
    { id: 'ys', name: '염은솔', team: '그로스팀', roleShort: 'OM', avatarBg: '#f3ebfc', avatarText: '#a66fd5', isHost: false },
    { id: 'sm', name: '신미르', team: '사업실', roleShort: 'FE', avatarBg: '#e3f4f0', avatarText: '#56a099', isHost: false },
    { id: 'ky', name: '강유정', team: '사업실', roleShort: 'BE', avatarBg: '#fceded', avatarText: '#cd6c6c', isHost: false },
  ],
  durationPreset: 60,
  roomRequired: true,
  recommendTitle: 'Q3 로드맵 의사결정 · 6인',
};

/**
 * Onboarding recommend modal candidates — mirrors CreationWizard results structure.
 * Find page cycles 확정 가능 #1 → #2 → #1. Act page reuses needs_coordination.
 */
export const MOCK_CANDIDATES = [
  {
    status: 'ready',
    statusLabel: '확정 가능 일정',
    dateLabel: '7월 15일 오전 10시~11시',
    weekdayLabel: '이번 주 화요일',
    reasons: [
      '필수 참석자 모두가 참석 가능한 시간이에요.',
      '미르타워 아폴로 회의실을 바로 예약할 수 있어요.',
      '김지원·이예찬·염은솔 모두 전후 30분 여유가 있어요.',
      '점심·출근 직후를 피해 부담이 적은 시간이에요.',
    ],
    references: [
      { title: '박도윤님 회의 3건 이상', description: '집중력이 떨어질 수 있으니 회의가 끝난 뒤 결정된 사항을 정리해서 공유해 보세요.' },
    ],
    room: { tower: '미르타워', name: '아폴로', capacity: 6 },
  },
  {
    status: 'ready',
    statusLabel: '확정 가능 일정',
    dateLabel: '7월 16일 오후 2시~3시',
    weekdayLabel: '이번 주 수요일',
    reasons: [
      '필수 참석자와 회의실이 모두 맞아떨어지는 시간이에요.',
      '선택 참석자까지 포함해도 전원이 참석할 수 있어요.',
      '오전 집중 시간을 해치지 않는 오후 슬롯이에요.',
      '퇴근 직전을 피해 부담이 적은 시간이에요.',
    ],
    references: [
      { title: '퇴근 직전 시간', description: '정해진 회의 시간을 지키고, 남은 안건은 회의 후 비동기로 정리해 보세요.' },
    ],
    room: { tower: '솔라타워', name: '비너스', capacity: 8 },
  },
  {
    status: 'needs_coordination',
    statusLabel: '확인 필요 일정',
    dateLabel: '7월 17일 오전 11시~12시',
    weekdayLabel: '이번 주 목요일',
    coordinationHeadline: '1건만 조율하면 이 시간으로 확정할 수 있어요.',
    checkpoints: [
      { text: '이예찬님 개인 집중 시간(11:00–11:30) 이동을 요청해 보세요.' },
    ],
    room: { tower: '미르타워', name: '아폴로', capacity: 6 },
  },
];

/** Coordination request demo — event detail guide + copy toast. */
const MOCK_BLOCKING_START = new Date(2026, 6, 17, 11, 0, 0);
const MOCK_BLOCKING_END = new Date(2026, 6, 17, 11, 30, 0);
const MOCK_PROPOSED_START = new Date(2026, 6, 17, 11, 0, 0);
const MOCK_PROPOSED_END = new Date(2026, 6, 17, 12, 0, 0);

export const MOCK_COORDINATION = {
  eventTitle: '개인 집중 시간',
  dateLabel: '7월 17일 (목)',
  timeLabel: '오전 11:00–11:30',
  owner: {
    id: 'yc',
    name: '이예찬',
    team: '사업실',
    roleShort: 'PM',
    avatarBg: '#fbf3d1',
    avatarText: '#c88e58',
  },
  guideTitle: '이렇게 보내보세요',
  draft: buildCoordinationDraftMessage({
    ownerFullName: '이예찬',
    blockingTitle: '개인 집중 시간',
    blockingStart: MOCK_BLOCKING_START,
    blockingEnd: MOCK_BLOCKING_END,
    proposedTitle: MOCK_MEETING.title,
    proposedStart: MOCK_PROPOSED_START,
    proposedEnd: MOCK_PROPOSED_END,
  }),
  toastMessage: '복사되었습니다',
};

export const TOUR_STEPS = [
  {
    target: 'create-schedule',
    placement: 'right',
    title: '회의 일정을 추가해 보세요',
    textLines: ['참석자, 회의실, 여유 시간을 고려해 확정할 수 있는 시간을 찾아드릴게요.'],
    cta: '확인',
    dismissOnBackdrop: true,
  },
];

export function isOnboardingComplete() {
  try {
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markOnboardingComplete() {
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function shouldForceOnboarding() {
  try {
    return new URLSearchParams(window.location.search).has('onboarding');
  } catch {
    return false;
  }
}

export function readOnboardingEntryState() {
  const force = shouldForceOnboarding();
  if (force) {
    try {
      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  const needsOnboarding = force || !isOnboardingComplete();
  return {
    finished: !needsOnboarding,
    introMounted: needsOnboarding,
  };
}
