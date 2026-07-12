export type CompanyScheduleSettings = {
  lunchStart: number;
  lunchEnd: number;
  commuteIn: number;
  commuteOut: number;
};

export const DEFAULT_COMPANY_SETTINGS: CompanyScheduleSettings = {
  lunchStart: 13,
  lunchEnd: 14.25,
  commuteIn: 11,
  commuteOut: 19,
};

/** 출근(commuteIn) 직후 여유 — 더미 일정은 이 시각 이전에 배치하지 않음 (commuteIn 11 → 12시) */
export const COMMUTE_BUFFER_HOURS = 1;
