export type EventType = "meeting" | "focus" | "personal" | "external" | "ooo" | "lunch";

export type MeetingCategory =
  | "daily"
  | "weekly"
  | "oneOnOne"
  | "focus"
  | "external"
  | "lunch"
  | "personal"
  | "sync"
  | "review"
  | "common";

export type TitleMode = "plain" | "oneOnOne" | "designPrefix" | "productPrefix";

export interface MockPerson {
  id: string;
  name: string;
  team: string;
  role: string;
  tower: string;
  floor: number;
  avatarBg?: string;
  avatarText?: string;
}

export interface ScheduleBlock {
  id: string;
  category: MeetingCategory;
  days: number[];
  starts: number[];
  durations: number[];
  titles: string[];
  type?: EventType;
  movable?: boolean;
  repeatEachDay?: boolean;
  /** 포함할 주차 (0=이번 주, 1=다음 주, 2=다다음 주). biweekly=[0,2] 등 */
  weeks?: number[];
  weight?: number;
  typeChance?: number;
  /** 0~1, 공통 일정 등 확률적 배치 */
  probability?: number;
  /** true면 시작 시각 jitter 생략 */
  skipJitter?: boolean;
  /** 동적 제목 생성 방식 */
  titleMode?: TitleMode;
  /** 주당 최소 생성 횟수 (PM 1:1 파편화 등) */
  minPerWeek?: number;
}

export interface RoleTemplate {
  role: string;
  weeklyRange: [number, number];
  focusChance: number;
  anchors: ScheduleBlock[];
  pools: ScheduleBlock[];
  /** PM처럼 평일마다 파편화 1:1을 추가로 채울 때 */
  fragmentedOneOnOnePerDay?: [number, number];
}

export interface DraftScheduleItem {
  day: number;
  start: number;
  duration: number;
  title: string;
  type: EventType;
  movable: boolean;
  category: MeetingCategory;
}

export interface GeneratedCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  visibility: "public" | "private";
  type: EventType;
  movable: boolean;
  roleDemo: true;
}

export interface PersonCalendarTraits {
  meetingCountBias: number;
  morningPerson: boolean;
  startOffset: number;
  lunchMeetingChance: number;
  personalChance: number;
  focusAffinity: number;
  oneOnOneAffinity: number;
  externalAffinity: number;
  dayWeights: number[];
  dailyHour: number;
  weeklyDayShift: number;
  durationBias: number;
  poolWeights: Partial<Record<MeetingCategory, number>>;
}

export type RandomFn = () => number;
