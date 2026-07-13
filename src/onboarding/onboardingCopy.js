export const ONBOARDING_STORAGE_KEY = 'meeting-scheduler:onboarding-v1';
export const TOUR_REVEAL_DELAY_MS = 1000;

export const ONBOARDING_STEPS = [
  {
    subtitle: ['회의 주선자는', '회의 일정을 잡을 시'],
    headline: ['"이 시간으로 정해도 되는지"', '판단해야 합니다.'],
    cta: '다음',
  },
  {
    subtitle: ['비어있는 시간이어도', '이전 일정은 어떠한 지, 너무 점심 직후는 아닌지'],
    headline: ['일정 확정을 위해', '고려할 요소가 남습니다'],
    cta: '다음',
  },
  {
    subtitle: ['확정 가능한 시간을', '근거와 함께 알려주면,'],
    headline: ['확정 가능한 시간을', '빠르게 판단할 수 있지 않을까?'],
    cta: '다음',
  },
  {
    headline: ['가장 쉬운', '회의 일정 잡기'],
    cta: '시작하기',
  },
];

export const TOUR_STEPS = [
  {
    target: 'create-schedule',
    placement: 'right',
    title: '회의 일정을 추가해 보세요',
    textLines: ['참여자, 회의실, 여유 시간을 고려해 최적 일정을 찾아드릴게요.'],
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
