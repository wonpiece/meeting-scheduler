export type CompanyScheduleSettings = {
  lunchStart: number;
  lunchEnd: number;
  commuteIn: number;
  commuteOut: number;
};

export const DEFAULT_COMPANY_SETTINGS: CompanyScheduleSettings = {
  lunchStart: 13,
  lunchEnd: 14.25,
  commuteIn: 9,
  commuteOut: 19,
};

/** 추천 정책 commuteBufferMinutes(30분)과 동일 — 더미 일정 earliest start */
export const COMMUTE_BUFFER_HOURS = 0.5;
