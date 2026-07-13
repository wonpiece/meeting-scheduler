/**
 * 회의 일정 추천 정책 (Recommendation Policy)
 *
 * - Hard block: 점심시간 겹침 슬롯 제외, 필수 참석자 hard unavailable 제외
 * - Soft condition: 출퇴근·점심 직후·외근·연속회의·집중근무 등은 점수 감점 + Checkpoints
 * - 목적(purpose): 제목·설명·참석자·길이로 자동 추론, 정렬에만 사용
 * - 최종 3후보: 가장 추천 / 가장 빠르게 진행 가능 / 참여율 최고
 */

import { personFirstName } from "../mock/anonymizedNames";

export type MeetingPurpose = "decision" | "ideation" | "discussion" | "share_followup";

export type MeetingOccasion = "default" | "lunch" | "dinner";

export type CandidateStatus = "ready" | "has_checkpoints" | "needs_coordination" | "not_recommended";

export type CandidateProfileKey = "best" | "fastest" | "participation";

export type CheckpointType =
  | "just_arrived"
  | "before_leaving"
  | "after_lunch"
  | "back_to_back_meeting"
  | "required_external"
  | "external_day"
  | "optional_unavailable"
  | "coordination_needed"
  | "focus_conflict"
  | "fatigue"
  | "required_partial"
  | "optional_partial";

export interface CompanySettings {
  lunchStart: number;
  lunchEnd: number;
  commuteIn: number;
  commuteOut: number;
}

export interface Checkpoint {
  type: CheckpointType;
  title: string;
  description: string;
  /** 조율 문장 주어 — 예: "정민님" */
  actorLabel?: string;
  targetPersonId?: string;
  /** 조율 대상 일정 — UI에서 회의명 링크로 표시 */
  blockingEventId?: string;
  blockingPersonId?: string;
  blockingEventTitle?: string;
  blockingEventAttendeeCount?: number;
}

export interface RecommendationRequest {
  title: string;
  description: string;
  purpose: MeetingPurpose;
  purposeConfidence: number;
  occasion: MeetingOccasion;
  durationMinutes: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  requiredRoom: boolean;
  forcedRoomId: string | null;
  requiredIds: string[];
  optionalIds: string[];
}

export type RecommendationTier = 1 | 2 | 3;

export interface CalendarEvent {
  id: string;
  start: string;
  end: string;
  type?: string;
  movable?: boolean;
  title?: string;
  groupId?: string;
  meetingMeta?: {
    requiredIds: string[];
    optionalIds: string[];
  };
}

export interface Person {
  id: string;
  name: string;
  team: string;
  tower: string;
  floor: number;
}

export interface Room {
  id: string;
  name: string;
  tower: string;
  floor: number;
  capacity: number;
}

export interface RoomBooking {
  id: string;
  start: string;
  end: string;
}

export interface CandidateMetrics {
  requiredAvailable: number;
  roomAvailable: number;
  totalAvailable: number;
  optionalAvailable: number;
  roomCount: number;
  burdenAvoided: number;
  bufferCount: number;
  softPenalty: number;
  participationScore: number;
  compositeScore: number;
}

export interface PersonSlotStatus {
  state: "available" | "movable_conflict" | "external_conflict" | "unavailable";
  conflicts: CalendarEvent[];
  blocking?: CalendarEvent;
}

export interface SlotCandidate {
  start: Date;
  end: Date;
  status: CandidateStatus;
  occasion: MeetingOccasion;
  personStatuses: Record<string, PersonSlotStatus>;
  requiredRoom: boolean;
  requiredIds: string[];
  optionalIds: string[];
  availableRooms: Room[];
  selectedRoom?: Room;
  roomReason: string;
  crossTeam: boolean;
  validationReasons: string[];
  checkpoints: Checkpoint[];
  softTimeFlags: {
    justArrived: boolean;
    beforeLeaving: boolean;
    afterLunch: boolean;
  };
  hasBackToBack: boolean;
  /** 추천 조건 — 비선호 시간 배려 적용 여부 */
  avoidSoftTimes: boolean;
  /** 추천 조건 — 일정 많은 날/연속 회의 배려 적용 여부 */
  avoidBusyDays: boolean;
  metrics: CandidateMetrics;
  profileKey?: CandidateProfileKey;
  profileLabel?: string;
  tier: RecommendationTier;
}

export interface SoftPreferenceOptions {
  /** 비선호 시간(출근 직후·퇴근 직전·점심 직후) 추천 줄이기 — default true */
  avoidSoftTimes?: boolean;
  /** 일정 많은 날(연속 회의·미팅 과다) 추천 줄이기 — default true */
  avoidBusyDays?: boolean;
}

export interface GenerateCandidatesOptions {
  organizerId: string;
  roomEvents: Record<string, RoomBooking[]>;
  fallbackRooms: Room[];
  notBefore?: Date;
  softPreferences?: SoftPreferenceOptions;
}

export interface PurposeInferenceInput {
  title: string;
  description?: string;
  durationMinutes: number;
  requiredIds: string[];
  optionalIds: string[];
  people: Person[];
  organizerId: string;
}

export interface PurposeInferenceResult {
  purpose: MeetingPurpose;
  confidence: number;
}

export const PURPOSE_DEFAULT: MeetingPurpose = "discussion";

export const CANDIDATE_PROFILE_LABELS: Record<CandidateProfileKey, string> = {
  best: "가장 추천",
  fastest: "가장 빠르게 진행 가능",
  participation: "참여율 최고",
};

export const RECOMMENDATION_PHILOSOPHY = {
  maxCandidates: 3,
  maxCheckpoints: 8,
  maxCoordinationBlockers: 3,
  slotStepHours: 0.5,
  adjacentBufferMinutes: 30,
  commuteBufferMinutes: 30,
  beforeLeavingHours: 1,
  afterLunchBufferMinutes: 30,
  externalTravelBufferMinutes: 120,
  fatigueMeetingThreshold: 3,
  bufferOkRatio: 0.6,
  purposeConfidenceThreshold: 0.42,
} as const;

export const STATUS_RANK: Record<CandidateStatus, number> = {
  ready: 0,
  has_checkpoints: 1,
  needs_coordination: 2,
  not_recommended: 3,
};

export const PURPOSE_SORT_METRICS: Record<MeetingPurpose, (keyof CandidateMetrics)[]> = {
  decision: ["requiredAvailable", "roomAvailable", "totalAvailable", "burdenAvoided", "bufferCount"],
  ideation: ["requiredAvailable", "totalAvailable", "optionalAvailable", "burdenAvoided", "roomAvailable", "bufferCount"],
  discussion: ["requiredAvailable", "totalAvailable", "bufferCount", "burdenAvoided", "roomAvailable"],
  share_followup: ["requiredAvailable", "burdenAvoided", "bufferCount", "totalAvailable", "roomAvailable"],
};

const SOFT_PENALTY_WEIGHTS = {
  justArrived: 12,
  beforeLeaving: 26,
  afterLunch: 10,
  fatigue: 8,
  optionalUnavailable: 7,
  backToBack: 4,
  focusConflict: 15,
  requiredExternal: 18,
  requiredExternalNoBuffer: 25,
} as const;

const PURPOSE_KEYWORD_RULES: { purpose: MeetingPurpose; keywords: string[]; weight: number }[] = [
  { purpose: "share_followup", keywords: ["공유", "follow", "followup", "후속", "데모", "시연", "리포트", "전달", "브리핑", "brief"], weight: 3 },
  { purpose: "ideation", keywords: ["아이디어", "브레인", "brainstorm", "워크샵", "발산", "ideation", "창의", "스케치"], weight: 3 },
  { purpose: "decision", keywords: ["결정", "승인", "approve", "의사결정", "go/no-go", "최종", "합의", "채택"], weight: 3 },
  { purpose: "discussion", keywords: ["논의", "싱크", "sync", "점검", "미팅", "스탠드업", "standup", "정렬", "협의"], weight: 2 },
];

const pad2 = (n: number) => String(n).padStart(2, "0");

export const hourToTimeStr = (h: number) =>
  `${pad2(Math.floor(h))}:${pad2(Math.round((h % 1) * 60))}`;

const toDate = (s: string) => new Date(s);
const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && bStart < aEnd;
const addMin = (date: Date, min: number) => new Date(date.getTime() + min * 60000);
const slotTimeKey = (start: Date) => String(start.getTime());

const isExternalType = (type?: string) => type === "external" || type === "ooo";

function hourOf(d: Date) {
  return d.getHours() + d.getMinutes() / 60;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

/** 제목·설명·참석자·길이 기반 목적 추론. 확신 낮으면 discussion */
export function inferMeetingPurpose(input: PurposeInferenceInput): PurposeInferenceResult {
  const text = normalizeText(`${input.title} ${input.description ?? ""}`);
  const scores: Record<MeetingPurpose, number> = {
    decision: 0,
    ideation: 0,
    discussion: 0.5,
    share_followup: 0,
  };

  for (const rule of PURPOSE_KEYWORD_RULES) {
    for (const keyword of rule.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        scores[rule.purpose] += rule.weight;
      }
    }
  }

  const attendeeTotal = input.requiredIds.length + input.optionalIds.length;
  const optionalRatio = attendeeTotal > 0 ? input.optionalIds.length / attendeeTotal : 0;
  const crossTeamRequired = input.requiredIds.filter((id) => {
    const person = input.people.find((p) => p.id === id);
    const organizer = input.people.find((p) => p.id === input.organizerId);
    return person && organizer && person.team !== organizer.team;
  }).length;

  if (input.durationMinutes <= 30) scores.share_followup += 2;
  if (input.durationMinutes >= 90) scores.ideation += 1.5;
  if (input.durationMinutes >= 60 && input.durationMinutes < 90) scores.discussion += 1;
  if (optionalRatio >= 0.4) scores.ideation += 2;
  if (input.requiredIds.length <= 3 && crossTeamRequired >= 1) scores.decision += 1.5;
  if (attendeeTotal >= 5) scores.discussion += 1;

  const ranked = (Object.entries(scores) as [MeetingPurpose, number][]).sort((a, b) => b[1] - a[1]);
  const [topPurpose, topScore] = ranked[0];
  const secondScore = ranked[1]?.[1] ?? 0;
  const confidence = topScore > 0 ? (topScore - secondScore) / topScore : 0;

  if (confidence < RECOMMENDATION_PHILOSOPHY.purposeConfidenceThreshold) {
    return { purpose: PURPOSE_DEFAULT, confidence };
  }
  return { purpose: topPurpose, confidence };
}

/** 제목으로 점심·회식 등 비정형 일정 유형 추론 */
export function inferMeetingOccasion(title: string): MeetingOccasion {
  const text = title.trim();
  if (!text) return "default";

  if (text.includes("회식")) return "dinner";

  if (/점약/.test(text)) return "lunch";
  if (/~\s*점심|점심\s*~/.test(text)) return "lunch";
  if (/런치|lunch/i.test(text)) return "lunch";
  if (/점심/.test(text) && !/점심\s*(전|후|직후)/.test(text)) return "lunch";

  return "default";
}

export function getOccasionScheduleDefaults(
  title: string,
  companySettings: CompanySettings,
  durationMinutes: number,
) {
  const occasion = inferMeetingOccasion(title);
  if (occasion === "lunch") {
    const lunchDurationMin = Math.round((companySettings.lunchEnd - companySettings.lunchStart) * 60);
    return {
      occasion,
      startHour: companySettings.lunchStart,
      durationMinutes: Math.min(durationMinutes, lunchDurationMin),
      roomRequired: false as const,
    };
  }
  if (occasion === "dinner") {
    return {
      occasion,
      startHour: companySettings.commuteOut,
      durationMinutes,
      roomRequired: false as const,
    };
  }
  return { occasion };
}

export function buildRecommendationRequest(input: {
  title: string;
  description?: string;
  durationMinutes: number;
  weekDays: string[];
  companySettings: CompanySettings;
  roomRequired: boolean;
  forcedRoomId: string | null;
  requiredIds: string[];
  optionalIds: string[];
  people: Person[];
  organizerId: string;
}): RecommendationRequest {
  const { purpose, confidence } = inferMeetingPurpose({
    title: input.title,
    description: input.description,
    durationMinutes: input.durationMinutes,
    requiredIds: input.requiredIds,
    optionalIds: input.optionalIds,
    people: input.people,
    organizerId: input.organizerId,
  });
  const cs = input.companySettings;
  const occasion = inferMeetingOccasion(input.title);
  const lunchDurationMin = Math.round((cs.lunchEnd - cs.lunchStart) * 60);
  const durationMinutes =
    occasion === "lunch"
      ? Math.min(input.durationMinutes, lunchDurationMin)
      : input.durationMinutes;

  return {
    title: input.title || "새 회의",
    description: input.description?.trim() ?? "",
    purpose,
    purposeConfidence: confidence,
    occasion,
    durationMinutes,
    dateRangeStart: `${input.weekDays[0]}T${hourToTimeStr(cs.commuteIn)}:00`,
    dateRangeEnd: `${input.weekDays[input.weekDays.length - 1]}T${hourToTimeStr(cs.commuteOut)}:00`,
    requiredRoom: occasion === "default" ? input.roomRequired !== false : false,
    forcedRoomId: occasion === "default" ? input.forcedRoomId : null,
    requiredIds: input.requiredIds,
    optionalIds: input.optionalIds,
  };
}

function overlapsLunch(slotStart: Date, slotEnd: Date, companySettings: CompanySettings) {
  const startH = hourOf(slotStart);
  const endH = hourOf(slotEnd);
  return startH < companySettings.lunchEnd && endH > companySettings.lunchStart;
}

function getSoftTimeFlags(slotStart: Date, slotEnd: Date, companySettings: CompanySettings) {
  const startH = hourOf(slotStart);
  const endH = hourOf(slotEnd);
  const commuteIn = companySettings.commuteIn;
  const commuteOut = companySettings.commuteOut;
  const lunchEnd = companySettings.lunchEnd;
  const afterLunchEnd = lunchEnd + RECOMMENDATION_PHILOSOPHY.afterLunchBufferMinutes / 60;

  const leavingWindowStart = commuteOut - RECOMMENDATION_PHILOSOPHY.beforeLeavingHours;

  return {
    justArrived: startH >= commuteIn && startH < commuteIn + RECOMMENDATION_PHILOSOPHY.commuteBufferMinutes / 60,
    beforeLeaving: startH < commuteOut && endH > leavingWindowStart,
    afterLunch: startH >= lunchEnd && startH < afterLunchEnd,
  };
}

function isHardConflict(event: CalendarEvent) {
  if (isExternalType(event.type)) return false;
  if (isEffectivelyMovable(event)) return false;
  return event.type === "meeting" || (!event.movable && event.type !== "lunch");
}

/** 1인 미팅·집중 시간 등 — 옮길 수 있는 블록 (2명 이상 미팅은 조율 비용이 높아 제외) */
function isEffectivelyMovable(event: CalendarEvent) {
  if (event.type === "focus") return true;

  const attendeeCount = countCalendarEventAttendees(event);
  if (attendeeCount >= 2) return false;

  if (event.movable) return true;
  if (event.type !== "meeting") return false;
  if (event.meetingMeta) return attendeeCount <= 1;
  if (event.title?.includes("1:1")) return true;
  return !event.groupId;
}

function getPersonStatus(
  personId: string,
  slotStart: Date,
  slotEnd: Date,
  events: Record<string, CalendarEvent[]>,
): PersonSlotStatus {
  const personEvents = events[personId] || [];
  const conflicts = personEvents.filter((e) =>
    overlaps(slotStart, slotEnd, toDate(e.start), toDate(e.end)),
  );
  if (conflicts.length === 0) return { state: "available", conflicts: [] };

  const externalConflict = conflicts.find((e) => isExternalType(e.type));
  if (externalConflict) return { state: "external_conflict", conflicts, blocking: externalConflict };

  const movableConflict = conflicts.find((e) => isEffectivelyMovable(e));
  if (movableConflict) return { state: "movable_conflict", conflicts, blocking: movableConflict };

  const hardConflict = conflicts.find((e) => !isEffectivelyMovable(e) && isHardConflict(e));
  if (hardConflict) return { state: "unavailable", conflicts, blocking: hardConflict };

  return { state: "unavailable", conflicts, blocking: conflicts[0] };
}

function hasTravelBuffer(
  personId: string,
  slotStart: Date,
  slotEnd: Date,
  events: Record<string, CalendarEvent[]>,
  bufferMinutes: number,
) {
  const bufferStart = addMin(slotStart, -bufferMinutes);
  const bufferEnd = addMin(slotEnd, bufferMinutes);
  const personEvents = events[personId] || [];

  return !personEvents.some((e) => {
    const es = toDate(e.start);
    const ee = toDate(e.end);
    if (!overlaps(bufferStart, bufferEnd, es, ee)) return false;
    return isExternalType(e.type) || isHardConflict(e);
  });
}

function getAdjacentEvents(
  personId: string,
  slotStart: Date,
  slotEnd: Date,
  bufferMin: number,
  events: Record<string, CalendarEvent[]>,
) {
  const personEvents = events[personId] || [];
  const beforeWindowStart = addMin(slotStart, -bufferMin);
  const afterWindowEnd = addMin(slotEnd, bufferMin);
  const before = personEvents.find((e) => {
    const ee = toDate(e.end);
    return ee <= slotStart && ee > beforeWindowStart;
  });
  const after = personEvents.find((e) => {
    const es = toDate(e.start);
    return es >= slotEnd && es < afterWindowEnd;
  });
  return { before, after };
}

function getFollowingAdjacentEvent(
  personId: string,
  slotStart: Date,
  slotEnd: Date,
  bufferMin: number,
  events: Record<string, CalendarEvent[]>,
) {
  return getAdjacentEvents(personId, slotStart, slotEnd, bufferMin, events).after;
}

function getAdjacentEvent(
  personId: string,
  slotStart: Date,
  slotEnd: Date,
  bufferMin: number,
  events: Record<string, CalendarEvent[]>,
) {
  const { before, after } = getAdjacentEvents(personId, slotStart, slotEnd, bufferMin, events);
  return before || after;
}

function focusEventLabel(blocking?: CalendarEvent) {
  const title = blocking?.title?.trim();
  return title || "집중 근무";
}

function countCalendarEventAttendees(event?: CalendarEvent) {
  if (!event) return 1;
  if (event.meetingMeta) {
    return event.meetingMeta.requiredIds.length + event.meetingMeta.optionalIds.length;
  }
  return 1;
}

function buildFocusConflictCheckpoint(input: {
  person: Person;
  isOrganizer: boolean;
  blocking?: CalendarEvent;
}): Checkpoint {
  const focusLabel = focusEventLabel(input.blocking);
  const blockingMeta = {
    blockingEventId: input.blocking?.id,
    blockingPersonId: input.person.id,
    blockingEventTitle: focusLabel,
    blockingEventAttendeeCount: countCalendarEventAttendees(input.blocking),
  };
  if (input.isOrganizer) {
    return {
      type: "focus_conflict",
      targetPersonId: input.person.id,
      actorLabel: `${personFirstName(input.person.name)}님`,
      title: focusLabel,
      description: "와 겹쳐요. 옮겨 보세요.",
      ...blockingMeta,
    };
  }
  return {
    type: "focus_conflict",
    targetPersonId: input.person.id,
    actorLabel: `${personFirstName(input.person.name)}님`,
    title: focusLabel,
    description: "을 옮길 수 있는지 확인해 보세요.",
    ...blockingMeta,
  };
}

function getAvailableRooms(
  slotStart: Date,
  slotEnd: Date,
  attendeeCount: number,
  roomPool: Room[],
  roomEvents: Record<string, RoomBooking[]>,
) {
  return roomPool.filter((room) => {
    if (room.capacity < attendeeCount) return false;
    const bookings = roomEvents[room.id] || [];
    return !bookings.some((e) => overlaps(slotStart, slotEnd, toDate(e.start), toDate(e.end)));
  });
}

function getDayMeetingCount(personId: string, date: Date, events: Record<string, CalendarEvent[]>) {
  const personEvents = events[personId] || [];
  const dayKey = date.toDateString();
  return personEvents.filter(
    (e) => e.type !== "lunch" && toDate(e.start).toDateString() === dayKey,
  ).length;
}

function pickBestRoom(
  availableRooms: Room[],
  requiredIds: string[],
  optionalIds: string[],
  people: Person[],
  organizerId: string,
) {
  if (availableRooms.length === 0) return { room: undefined, crossTeam: false };

  const organizer = people.find((p) => p.id === organizerId);
  const allAttendees = [...requiredIds, ...optionalIds]
    .map((id) => people.find((p) => p.id === id))
    .filter(Boolean) as Person[];
  const otherTeamAttendees = allAttendees.filter((p) => p.team !== organizer?.team);
  const crossTeam = otherTeamAttendees.length > 0;

  let targetPeople: Person[];
  if (crossTeam) {
    const byTeam = new Map<string, Person[]>();
    for (const person of otherTeamAttendees) {
      if (!byTeam.has(person.team)) byTeam.set(person.team, []);
      byTeam.get(person.team)!.push(person);
    }
    targetPeople = [...byTeam.values()].sort((a, b) => b.length - a.length)[0];
  } else {
    targetPeople = allAttendees;
  }

  const scoreRoom = (room: Room) =>
    targetPeople.filter((p) => p.tower === room.tower && p.floor === room.floor).length * 3 +
    targetPeople.filter((p) => p.tower === room.tower).length;

  const sorted = availableRooms.slice().sort((a, b) => {
    const diff = scoreRoom(b) - scoreRoom(a);
    if (diff !== 0) return diff;
    return a.capacity - b.capacity;
  });

  return { room: sorted[0], crossTeam };
}

function computeSoftPenalty(input: {
  softFlags: ReturnType<typeof getSoftTimeFlags>;
  requiredIds: string[];
  optionalIds: string[];
  allIds: string[];
  personStatuses: Record<string, PersonSlotStatus>;
  events: Record<string, CalendarEvent[]>;
  start: Date;
  end: Date;
  hasBackToBack: boolean;
  hasFatigue: boolean;
  requiredExternalIds: string[];
  requiredExternalNoBufferIds: string[];
  optionalUnavailableCount: number;
  focusConflictCount: number;
}) {
  let penalty = 0;
  const w = SOFT_PENALTY_WEIGHTS;

  if (input.softFlags.justArrived) penalty += w.justArrived;
  if (input.softFlags.beforeLeaving) penalty += w.beforeLeaving;
  if (input.softFlags.afterLunch) penalty += w.afterLunch;
  if (input.hasFatigue) penalty += w.fatigue;
  if (input.hasBackToBack) penalty += w.backToBack;
  if (input.optionalUnavailableCount > 0) penalty += w.optionalUnavailable * input.optionalUnavailableCount;
  if (input.focusConflictCount > 0) penalty += w.focusConflict * input.focusConflictCount;
  if (input.requiredExternalIds.length > 0) penalty += w.requiredExternal * input.requiredExternalIds.length;
  if (input.requiredExternalNoBufferIds.length > 0) {
    penalty += w.requiredExternalNoBuffer * input.requiredExternalNoBufferIds.length;
  }

  return penalty;
}

const CHECKPOINT_PRIORITY: Record<CheckpointType, number> = {
  required_partial: 0,
  coordination_needed: 1,
  focus_conflict: 2,
  required_external: 3,
  back_to_back_meeting: 4,
  optional_partial: 5,
  optional_unavailable: 6,
  external_day: 7,
  fatigue: 8,
  after_lunch: 9,
  just_arrived: 10,
  before_leaving: 11,
};

function personNames(ids: string[], people: Person[]) {
  return ids
    .map((id) => people.find((p) => p.id === id)?.name)
    .filter(Boolean) as string[];
}

function formatNames(names: string[]) {
  if (names.length === 0) return "";
  if (names.length <= 3) return names.map((name) => `${personFirstName(name)}님`).join(", ");
  return `${names.slice(0, 2).map((name) => `${personFirstName(name)}님`).join(", ")}, ${personFirstName(names[2])}님 외 ${names.length - 3}명`;
}

function compactCheckpoints(checkpoints: Checkpoint[]) {
  const softTimeTypes = new Set<CheckpointType>(["before_leaving", "after_lunch", "just_arrived"]);
  const softTime = checkpoints.filter((checkpoint) => softTimeTypes.has(checkpoint.type));
  const others = checkpoints.filter((checkpoint) => !softTimeTypes.has(checkpoint.type));
  const maxOthers = Math.max(0, RECOMMENDATION_PHILOSOPHY.maxCheckpoints - softTime.length);
  const sortedOthers = [...others]
    .sort((a, b) => CHECKPOINT_PRIORITY[a.type] - CHECKPOINT_PRIORITY[b.type])
    .slice(0, maxOthers);
  const sortedSoftTime = [...softTime]
    .sort((a, b) => CHECKPOINT_PRIORITY[a.type] - CHECKPOINT_PRIORITY[b.type]);
  return [...sortedOthers, ...sortedSoftTime].slice(0, RECOMMENDATION_PHILOSOPHY.maxCheckpoints);
}

/** 확정 행동 강령(Checkpoints) — 행동 지시 중심, 중복 제거·최대 3개 */
export function buildCheckpoints(input: {
  start: Date;
  end: Date;
  softFlags: ReturnType<typeof getSoftTimeFlags>;
  personStatuses: Record<string, PersonSlotStatus>;
  requiredIds: string[];
  optionalIds: string[];
  allIds: string[];
  people: Person[];
  events: Record<string, CalendarEvent[]>;
  selectedRoom?: Room;
  requiredExternalIds: string[];
  organizerId: string;
  skipBufferAndSoftChecks?: boolean;
  skipSoftTimeChecks?: boolean;
  skipBusyDayChecks?: boolean;
}): Checkpoint[] {
  const {
    start,
    softFlags,
    personStatuses,
    requiredIds,
    optionalIds,
    allIds,
    people,
    events,
    selectedRoom,
    requiredExternalIds,
    organizerId,
  } = input;
  const skipBufferAndSoftChecks = input.skipBufferAndSoftChecks === true;
  const skipSoftTimeChecks = input.skipSoftTimeChecks === true || skipBufferAndSoftChecks;
  const skipBusyDayChecks = input.skipBusyDayChecks === true || skipBufferAndSoftChecks;
  const checkpoints: Checkpoint[] = [];

  const unavailableRequired = requiredIds.filter((id) => {
    const state = personStatuses[id].state;
    return state === "unavailable" || state === "external_conflict";
  });

  for (const id of unavailableRequired) {
    const person = people.find((p) => p.id === id);
    if (!person) continue;
    const isExternal = personStatuses[id].state === "external_conflict";
    checkpoints.push({
      type: isExternal ? "required_external" : "required_partial",
      title: `${personFirstName(person.name)}님 참석 불가`,
      description: isExternal
        ? "온라인 참석 가능 여부를 확인하고 확정해 보세요."
        : "참석 가능 여부를 확인해 보세요.",
    });
  }

  const unavailableOptional = optionalIds.filter((id) => personStatuses[id].state !== "available");
  for (const id of unavailableOptional) {
    const person = people.find((p) => p.id === id);
    if (!person) continue;
    const isExternal = personStatuses[id].conflicts.some((event) => isExternalType(event.type));
    checkpoints.push({
      type: isExternal ? "external_day" : "optional_partial",
      title: `${personFirstName(person.name)}님(선택 참석자) 참석 불가`,
      description: isExternal
        ? "온라인 참석 가능 여부를 확인해 보세요."
        : "양해를 구하거나, 회의 종료 후 요약본을 공유해 보세요.",
    });
  }

  if (!skipSoftTimeChecks) {
    if (softFlags.beforeLeaving) {
      checkpoints.push({
        type: "before_leaving",
        title: "퇴근 직전 시간",
        description: "정해진 회의 시간을 지키고, 남은 안건은 회의 후 비동기로 정리해 보세요.",
      });
    } else if (softFlags.afterLunch) {
      checkpoints.push({
        type: "after_lunch",
        title: "점심 직후 시간",
        description: "발표 위주보다 토론 · 질의응답 방식으로 회의를 구성해 보세요.",
      });
    } else if (softFlags.justArrived) {
      checkpoints.push({
        type: "just_arrived",
        title: "출근 직후 시간",
        description: "안건을 미리 공유해서 오전 준비 부담을 줄여 보세요.",
      });
    }
  }

  if (requiredExternalIds.length > 0) {
    for (const id of requiredExternalIds) {
      if (unavailableRequired.includes(id)) continue;
      const person = people.find((p) => p.id === id);
      if (!person) continue;
      checkpoints.push({
        type: "required_external",
        title: `${personFirstName(person.name)}님 외근`,
        description: "온라인 참석 가능 여부를 확인하고 확정해 보세요.",
      });
    }
  }

  const movableRequired = requiredIds.filter((id) => personStatuses[id].state === "movable_conflict");
  const focusRequired = movableRequired.filter((id) => personStatuses[id].blocking?.type === "focus");
  const otherMovableRequired = movableRequired.filter((id) => personStatuses[id].blocking?.type !== "focus");

  if (focusRequired.length > 0) {
    for (const id of focusRequired) {
      const person = people.find((p) => p.id === id);
      if (!person) continue;
      checkpoints.push(
        buildFocusConflictCheckpoint({
          person,
          isOrganizer: id === organizerId,
          blocking: personStatuses[id].blocking,
        }),
      );
    }
  }
  if (otherMovableRequired.length > 0) {
    for (const id of otherMovableRequired) {
      const person = people.find((p) => p.id === id);
      if (!person) continue;
      const blocking = personStatuses[id].blocking;
      const eventTitle = blocking?.title?.trim() || "일정";
      checkpoints.push({
        type: "coordination_needed",
        targetPersonId: id,
        actorLabel: `${personFirstName(person.name)}님`,
        title: eventTitle,
        description: "을 옮길 수 있는지 확인해 보세요.",
        blockingEventId: blocking?.id,
        blockingPersonId: id,
        blockingEventTitle: eventTitle,
        blockingEventAttendeeCount: countCalendarEventAttendees(blocking),
      });
    }
  }

  const hasBackToBack = !skipBusyDayChecks && allIds.some(
    (id) =>
      personStatuses[id].state === "available" &&
      getFollowingAdjacentEvent(id, start, input.end, RECOMMENDATION_PHILOSOPHY.adjacentBufferMinutes, events),
  );
  const backToBackIds = skipBusyDayChecks ? [] : allIds.filter((id) => {
    if (personStatuses[id].state !== "available") return false;
    return !!getFollowingAdjacentEvent(
      id,
      start,
      input.end,
      RECOMMENDATION_PHILOSOPHY.adjacentBufferMinutes,
      events,
    );
  });
  if (hasBackToBack && backToBackIds.length > 0) {
    if (backToBackIds.includes(organizerId)) {
      const organizer = people.find((p) => p.id === organizerId);
      const organizerLabel = organizer
        ? `${personFirstName(organizer.name)}님`
        : "주선자";
      checkpoints.push({
        type: "back_to_back_meeting",
        targetPersonId: organizerId,
        title: `${organizerLabel} 바로 다음 회의 있음`,
        description: "참여해야 하는 안건을 먼저 논의하고, 다음 회의에 늦지 않도록 시간을 맞춰 보세요.",
      });
    }
    const otherBackToBackIds = backToBackIds.filter((id) => id !== organizerId);
    if (otherBackToBackIds.length > 0) {
      const names = personNames(otherBackToBackIds, people).sort((a, b) => a.localeCompare(b, "ko"));
      checkpoints.push({
        type: "back_to_back_meeting",
        title: `${formatNames(names)} 바로 다음 회의 있음`,
        description: `${formatNames(names)}이 참여해야 하는 안건을 먼저 논의하고, 먼저 퇴실할 수 있도록 도와주세요.`,
      });
    }
  }

  const fatiguedIds = skipBusyDayChecks ? [] : allIds.filter((id) => {
    if (personStatuses[id].state !== "available") return false;
    return getDayMeetingCount(id, start, events) >= RECOMMENDATION_PHILOSOPHY.fatigueMeetingThreshold;
  });
  if (fatiguedIds.length > 0) {
    const threshold = RECOMMENDATION_PHILOSOPHY.fatigueMeetingThreshold;
    const dedupedFatiguedIds = fatiguedIds.filter((id) => !backToBackIds.includes(id));
    if (dedupedFatiguedIds.length > 0) {
      checkpoints.push({
        type: "fatigue",
        title: `${formatNames(personNames(dedupedFatiguedIds, people))} 회의 ${threshold}건 이상`,
        description: "집중력이 떨어질 수 있으니 회의가 끝난 뒤 결정된 사항을 정리해서 공유해 보세요.",
      });
    }
  }

  return compactCheckpoints(checkpoints);
}

function pushUniqueReason(reasons: string[], line: string) {
  if (!reasons.includes(line)) reasons.push(line);
}

function getRoomCountComparativeLeader(pool: SlotCandidate[]): SlotCandidate | null {
  if (pool.length <= 1) return null;

  const maxRoomCount = Math.max(...pool.map((candidate) => candidate.metrics.roomCount));
  const minRoomCount = Math.min(...pool.map((candidate) => candidate.metrics.roomCount));
  if (maxRoomCount <= 1 || minRoomCount >= maxRoomCount) return null;

  const tiedAtMax = pool.filter((candidate) => candidate.metrics.roomCount >= maxRoomCount - 1e-9);
  tiedAtMax.sort(compareCandidatesForCarousel);
  return tiedAtMax[0] ?? null;
}

function buildComparativeLeads(candidate: SlotCandidate, pool: SlotCandidate[]): string[] {
  if (pool.length <= 1) return [];

  const lines: string[] = [];
  const candidateKey = slotTimeKey(candidate.start);
  const totalCount = candidate.requiredIds.length + candidate.optionalIds.length;

  const earliest = pool.reduce((best, c) => (c.start.getTime() < best.start.getTime() ? c : best));
  if (candidateKey === slotTimeKey(earliest.start)) {
    lines.push("3개 후보 중 가장 빠른 시간이에요.");
  }

  const maxPart = Math.max(...pool.map((c) => c.metrics.participationScore));
  const topPart = pool.filter((c) => c.metrics.participationScore >= maxPart - 1e-9);
  if (topPart.length < pool.length && topPart.some((c) => slotTimeKey(c.start) === candidateKey)) {
    const availCount = Math.round(candidate.metrics.participationScore * totalCount);
    if (availCount !== totalCount) {
      lines.push(`3개 후보 중 참석 가능한 사람이 가장 많아요. (${availCount}/${totalCount}명)`);
    }
  }

  return lines;
}

/** 조율 UI에 표시되는 건수 — movable 충돌 일정 수 (적을수록 우선) */
function getCandidateCoordinationCost(candidate: SlotCandidate): number {
  const movableBlockerIds = new Set(
    candidate.requiredIds.filter((id) => candidate.personStatuses[id].state === "movable_conflict"),
  );
  if (movableBlockerIds.size === 0) return 0;

  return candidate.checkpoints.filter(
    (checkpoint) =>
      checkpoint.blockingEventId &&
      checkpoint.blockingPersonId &&
      movableBlockerIds.has(checkpoint.blockingPersonId),
  ).length;
}

function compareCandidatesForDisplay(a: SlotCandidate, b: SlotCandidate) {
  const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
  if (rankDiff !== 0) return rankDiff;

  const coordinationDiff = getCandidateCoordinationCost(a) - getCandidateCoordinationCost(b);
  if (coordinationDiff !== 0) return coordinationDiff;

  const checkpointDiff = a.checkpoints.length - b.checkpoints.length;
  if (checkpointDiff !== 0) return checkpointDiff;

  const softDiff = a.metrics.softPenalty - b.metrics.softPenalty;
  if (softDiff !== 0) return softDiff;

  const scoreDiff = b.metrics.compositeScore - a.metrics.compositeScore;
  if (Math.abs(scoreDiff) > 1e-9) return scoreDiff;

  return a.start.getTime() - b.start.getTime();
}

/** 캐러셀 표시: 확정 용이성(조율·확인할 점) 우선 → 점수 → 이른 시간 */
function compareCandidatesForCarousel(a: SlotCandidate, b: SlotCandidate) {
  const tierDiff = a.tier - b.tier;
  if (tierDiff !== 0) return tierDiff;

  const coordinationDiff = getCandidateCoordinationCost(a) - getCandidateCoordinationCost(b);
  if (coordinationDiff !== 0) return coordinationDiff;

  // 참고할 점·조율 항목 등 확인할 점이 많을수록 뒤로
  const checkpointDiff = a.checkpoints.length - b.checkpoints.length;
  if (checkpointDiff !== 0) return checkpointDiff;

  const softDiff = a.metrics.softPenalty - b.metrics.softPenalty;
  if (softDiff !== 0) return softDiff;

  const scoreDiff = b.metrics.compositeScore - a.metrics.compositeScore;
  if (Math.abs(scoreDiff) > 1e-9) return scoreDiff;

  return a.start.getTime() - b.start.getTime();
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

function mondayOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + offset);
  copy.setHours(12, 0, 0, 0);
  return copy;
}

export function formatRelativeWeekdayLabel(date: Date, anchorDateStr: string) {
  const weekday = WEEKDAY_KO[date.getDay()];
  const anchorMonday = mondayOfWeek(toDate(`${anchorDateStr}T12:00:00`));
  const dateMonday = mondayOfWeek(date);
  const diffWeeks = Math.round((dateMonday.getTime() - anchorMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  if (diffWeeks === 0) return `이번 주 ${weekday}요일`;
  if (diffWeeks === 1) return `다음주 ${weekday}요일`;
  if (diffWeeks === -1) return `지난주 ${weekday}요일`;
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
}

export function getRecommendationWeekDays(anchorDateStr: string, pool: readonly string[]) {
  const filtered = pool.filter((day) => day >= anchorDateStr);
  return filtered.length > 0 ? filtered : [...pool];
}

export function buildPositiveValidationReasons(input: {
  candidate: SlotCandidate;
  pool?: SlotCandidate[];
  roomReason?: string | null;
  requiredRoom?: boolean;
  requiredAvailableCount: number;
  requiredCount: number;
  optionalAvailableCount: number;
  optionalCount: number;
  allCount: number;
  bufferOkCount: number;
  softPenalty: number;
  softTimeFlags: SlotCandidate["softTimeFlags"];
  hasBackToBack: boolean;
  occasion?: MeetingOccasion;
  avoidSoftTimes?: boolean;
  avoidBusyDays?: boolean;
}) {
  const reasons: string[] = [];

  if (input.requiredCount > 0 && input.requiredAvailableCount < input.requiredCount) {
    return reasons;
  }

  const {
    requiredAvailableCount,
    requiredCount,
    optionalAvailableCount,
    optionalCount,
    allCount,
    bufferOkCount,
    hasBackToBack,
  } = input;

  const avoidBusyDays = input.avoidBusyDays !== false;

  const allAvailable =
    allCount > 0 &&
    requiredAvailableCount === requiredCount &&
    optionalAvailableCount === optionalCount;

  if (allAvailable && allCount > 1) {
    pushUniqueReason(reasons, "전 인원이 참석 가능해요.");
  } else if (requiredCount > 0 && requiredAvailableCount === requiredCount && allCount > 1) {
    pushUniqueReason(reasons, `필수 참석자 ${requiredCount}명 모두 참석 가능해요.`);
  }

  if (optionalCount > 0 && optionalAvailableCount === optionalCount && !allAvailable) {
    pushUniqueReason(reasons, `선택 참석자 ${optionalCount}명도 모두 참석 가능해요.`);
  }

  if (input.pool && input.pool.length > 1) {
    for (const line of buildComparativeLeads(input.candidate, input.pool)) {
      pushUniqueReason(reasons, line);
    }

    const roomCountLeader = getRoomCountComparativeLeader(input.pool);
    if (
      input.requiredRoom &&
      roomCountLeader &&
      slotTimeKey(input.candidate.start) === slotTimeKey(roomCountLeader.start)
    ) {
      pushUniqueReason(reasons, "다른 후보보다 회의실 선택지가 많아요.");
    }
  }

  const bufferThreshold = Math.ceil(allCount * RECOMMENDATION_PHILOSOPHY.bufferOkRatio);
  // 일정 많은 날 배려가 켜져 있을 때만 전후 버퍼를 근거로 노출
  if (
    input.occasion === "default" &&
    avoidBusyDays &&
    allCount > 0 &&
    bufferOkCount >= bufferThreshold
  ) {
    pushUniqueReason(
      reasons,
      allCount === 1
        ? "회의 전후로 30분씩 여유가 있어요."
        : `${allCount}명 중 ${bufferOkCount}명이 회의 전후로 30분씩 여유가 있어요.`,
    );
  }

  if (input.occasion === "lunch") {
    pushUniqueReason(reasons, "점심 시간대로 잡았어요.");
  } else if (input.occasion === "dinner") {
    pushUniqueReason(reasons, "퇴근 시간에 맞춰 잡았어요.");
  }

  // 출근/퇴근/점심은 시간만 봐도 알 수 있어 문구에서 제외. 앞뒤 회의 여유만 노출.
  if (input.occasion === "default" && avoidBusyDays && !hasBackToBack) {
    pushUniqueReason(reasons, "앞뒤로 회의가 없어, 부담이 적은 시간이에요.");
  }

  if (input.requiredRoom && input.roomReason) {
    pushUniqueReason(reasons, input.roomReason);
  }

  return reasons;
}

export function getValidationReasonInput(candidate: SlotCandidate, roomReason?: string | null) {
  return {
    candidate,
    requiredAvailableCount: Math.round(candidate.metrics.requiredAvailable * candidate.requiredIds.length),
    requiredCount: candidate.requiredIds.length,
    optionalAvailableCount: Math.round(candidate.metrics.optionalAvailable * candidate.optionalIds.length),
    optionalCount: candidate.optionalIds.length,
    allCount: candidate.requiredIds.length + candidate.optionalIds.length,
    bufferOkCount: candidate.metrics.bufferCount,
    softPenalty: candidate.metrics.softPenalty,
    softTimeFlags: candidate.softTimeFlags,
    hasBackToBack: candidate.hasBackToBack,
    avoidSoftTimes: candidate.avoidSoftTimes,
    avoidBusyDays: candidate.avoidBusyDays,
    roomReason: roomReason ?? candidate.roomReason,
    requiredRoom: candidate.requiredRoom,
  };
}

function buildRoomAssignmentReason(input: {
  room?: Room;
  crossTeam: boolean;
  requiredIds: string[];
  optionalIds: string[];
  people: Person[];
  organizerId: string;
  availableRoomCount: number;
}) {
  const { room, crossTeam, requiredIds, optionalIds, people, organizerId, availableRoomCount } = input;
  if (!room) return null;

  if (availableRoomCount === 1) {
    return "전 인원이 가능한 회의실이 있어요.";
  }

  if (!crossTeam) {
    return `가장 가까운 ${room.name}을 배정했어요.`;
  }

  const organizer = people.find((p) => p.id === organizerId);
  const otherTeamAttendees = [...requiredIds, ...optionalIds]
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Person => !!p && p.team !== organizer?.team);

  const byTeam = new Map<string, Person[]>();
  for (const person of otherTeamAttendees) {
    if (!byTeam.has(person.team)) byTeam.set(person.team, []);
    byTeam.get(person.team)!.push(person);
  }
  const dominantTeam = [...byTeam.values()].sort((a, b) => b.length - a.length)[0] ?? [];
  const onDominantFloor = dominantTeam.some(
    (p) => p.tower === room.tower && p.floor === room.floor,
  );

  if (onDominantFloor) {
    return `타 팀 분들이 계신 ${room.name}으로 배정했어요.`;
  }
  return `타 팀 참석자 이동을 줄이도록 ${room.name}으로 배정했어요.`;
}

function computeCompositeScore(candidate: SlotCandidate, purpose: MeetingPurpose) {
  const order = PURPOSE_SORT_METRICS[purpose] ?? PURPOSE_SORT_METRICS.discussion;
  let score = 0;
  order.forEach((key, index) => {
    score += candidate.metrics[key] * 10 ** (order.length - index);
  });
  score += candidate.metrics.participationScore * 100;
  score -= candidate.metrics.softPenalty * 50;
  score -= getCandidateCoordinationCost(candidate) * 50_000;
  score -= STATUS_RANK[candidate.status] * 1_000_000;
  return score;
}

export function generateSlots(request: RecommendationRequest, companySettings: CompanySettings) {
  if (request.occasion === "lunch") {
    return generateLunchSlots(request, companySettings);
  }
  if (request.occasion === "dinner") {
    return generateDinnerSlots(request, companySettings);
  }
  return generateDefaultSlots(request, companySettings);
}

function generateDefaultSlots(request: RecommendationRequest, companySettings: CompanySettings) {
  const bizStart = companySettings.commuteIn;
  const bizEnd = companySettings.commuteOut;
  const slots: { start: Date; end: Date }[] = [];
  const rangeStart = toDate(request.dateRangeStart);
  const rangeEnd = toDate(request.dateRangeEnd);
  let cursor = new Date(rangeStart);
  cursor.setHours(Math.floor(bizStart), (bizStart % 1) * 60, 0, 0);
  const lastMoment = new Date(rangeEnd);

  while (cursor <= lastMoment) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      for (let h = bizStart; h < bizEnd; h += RECOMMENDATION_PHILOSOPHY.slotStepHours) {
        const slotStart = new Date(cursor);
        slotStart.setHours(Math.floor(h), (h % 1) * 60, 0, 0);
        const slotEnd = addMin(slotStart, request.durationMinutes);
        const slotEndHour = hourOf(slotEnd);
        if (
          slotEndHour <= bizEnd &&
          slotEnd <= lastMoment &&
          !overlapsLunch(slotStart, slotEnd, companySettings)
        ) {
          slots.push({ start: slotStart, end: slotEnd });
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(Math.floor(bizStart), (bizStart % 1) * 60, 0, 0);
  }

  return slots;
}

function generateLunchSlots(request: RecommendationRequest, companySettings: CompanySettings) {
  const { lunchStart, lunchEnd } = companySettings;
  const slots: { start: Date; end: Date }[] = [];
  const rangeStart = toDate(request.dateRangeStart);
  const rangeEnd = toDate(request.dateRangeEnd);
  let cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);
  const lastMoment = new Date(rangeEnd);

  while (cursor <= lastMoment) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      for (let h = lunchStart; h < lunchEnd; h += RECOMMENDATION_PHILOSOPHY.slotStepHours) {
        const slotStart = new Date(cursor);
        slotStart.setHours(Math.floor(h), (h % 1) * 60, 0, 0);
        const slotEnd = addMin(slotStart, request.durationMinutes);
        const slotEndHour = hourOf(slotEnd);
        if (
          slotEndHour <= lunchEnd + 1e-9 &&
          slotStart >= rangeStart &&
          slotEnd <= lastMoment
        ) {
          slots.push({ start: slotStart, end: slotEnd });
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(0, 0, 0, 0);
  }

  return slots;
}

function generateDinnerSlots(request: RecommendationRequest, companySettings: CompanySettings) {
  const dinnerStart = companySettings.commuteOut;
  const slots: { start: Date; end: Date }[] = [];
  const rangeStart = toDate(request.dateRangeStart);
  const rangeEnd = toDate(request.dateRangeEnd);
  let cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);
  const lastMoment = new Date(rangeEnd);

  while (cursor <= lastMoment) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      const slotStart = new Date(cursor);
      slotStart.setHours(Math.floor(dinnerStart), (dinnerStart % 1) * 60, 0, 0);
      const slotEnd = addMin(slotStart, request.durationMinutes);
      if (slotStart >= rangeStart && slotStart <= lastMoment) {
        slots.push({ start: slotStart, end: slotEnd });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(0, 0, 0, 0);
  }

  return slots;
}

function evaluateSlot(
  slot: { start: Date; end: Date },
  request: RecommendationRequest,
  people: Person[],
  events: Record<string, CalendarEvent[]>,
  companySettings: CompanySettings,
  rooms: Room[],
  options: GenerateCandidatesOptions,
  dayAlternativeContext: Map<string, boolean>,
) {
  const { start, end } = slot;
  const { requiredIds, optionalIds } = request;
  const allIds = [...requiredIds, ...optionalIds];
  const isCasualOccasion = request.occasion === "lunch" || request.occasion === "dinner";
  const personStatuses: Record<string, PersonSlotStatus> = {};
  allIds.forEach((id) => {
    personStatuses[id] = getPersonStatus(id, start, end, events);
  });

  const requiredAvailable = requiredIds.filter((id) => personStatuses[id].state === "available");
  const requiredMovable = requiredIds.filter((id) => personStatuses[id].state === "movable_conflict");
  const requiredExternal = requiredIds.filter((id) => personStatuses[id].state === "external_conflict");
  const requiredHardUnavailable = requiredIds.filter((id) => personStatuses[id].state === "unavailable");
  const optionalAvailable = optionalIds.filter((id) => personStatuses[id].state === "available");
  const optionalUnavailable = optionalIds.filter((id) => personStatuses[id].state !== "available");

  const requiredExternalNoBuffer = isCasualOccasion
    ? []
    : requiredExternal.filter(
        (id) =>
          !hasTravelBuffer(
            id,
            start,
            end,
            events,
            RECOMMENDATION_PHILOSOPHY.externalTravelBufferMinutes,
          ),
      );

  const externalOnlyDayRequired = requiredExternal.filter(
    (id) => dayAlternativeContext.get(`${id}:${start.toDateString()}`) === true,
  );
  const externalOnlyDayMissingBuffer =
    !isCasualOccasion &&
    externalOnlyDayRequired.length > 0 &&
    externalOnlyDayRequired.some((id) =>
      requiredExternalNoBuffer.includes(id),
    );

  const roomPool = request.forcedRoomId
    ? rooms.filter((r) => r.id === request.forcedRoomId)
    : rooms;
  const availableRooms = request.requiredRoom
    ? getAvailableRooms(start, end, allIds.length, roomPool, options.roomEvents)
    : [];
  const roomOk = !request.requiredRoom || availableRooms.length > 0;

  const { room: defaultRoom, crossTeam } = request.requiredRoom
    ? pickBestRoom(availableRooms, requiredIds, optionalIds, people, options.organizerId)
    : { room: undefined, crossTeam: false };
  const roomReason = buildRoomAssignmentReason({
    room: defaultRoom,
    crossTeam,
    requiredIds,
    optionalIds,
    people,
    organizerId: options.organizerId,
    availableRoomCount: availableRooms.length,
  }) ?? "예약 가능한 회의실이에요.";

  const softPrefs = options.softPreferences ?? {};
  const avoidSoftTimes = softPrefs.avoidSoftTimes !== false;
  const avoidBusyDays = softPrefs.avoidBusyDays !== false;

  const softFlags = isCasualOccasion || !avoidSoftTimes
    ? { justArrived: false, beforeLeaving: false, afterLunch: false }
    : getSoftTimeFlags(start, end, companySettings);
  const hasBackToBack = isCasualOccasion || !avoidBusyDays
    ? false
    : allIds.some(
        (id) =>
          personStatuses[id].state === "available" &&
          getFollowingAdjacentEvent(id, start, end, RECOMMENDATION_PHILOSOPHY.adjacentBufferMinutes, events),
      );
  const hasFatigue = isCasualOccasion || !avoidBusyDays
    ? false
    : allIds.some((id) => {
        if (personStatuses[id].state !== "available") return false;
        return getDayMeetingCount(id, start, events) >= RECOMMENDATION_PHILOSOPHY.fatigueMeetingThreshold;
      });
  const focusConflictCount = requiredMovable.filter(
    (id) => personStatuses[id].blocking?.type === "focus",
  ).length;

  const softPenalty = isCasualOccasion
    ? 0
    : computeSoftPenalty({
        softFlags,
        requiredIds,
        optionalIds,
        allIds,
        personStatuses,
        events,
        start,
        end,
        hasBackToBack,
        hasFatigue,
        requiredExternalIds: requiredExternal,
        requiredExternalNoBufferIds: requiredExternalNoBuffer,
        optionalUnavailableCount: optionalUnavailable.length,
        focusConflictCount,
      });

  const checkpoints = buildCheckpoints({
    start,
    end,
    softFlags,
    personStatuses,
    requiredIds,
    optionalIds,
    allIds,
    people,
    events,
    selectedRoom: defaultRoom,
    requiredExternalIds: requiredExternal,
    organizerId: options.organizerId,
    skipSoftTimeChecks: isCasualOccasion || !avoidSoftTimes,
    skipBusyDayChecks: isCasualOccasion || !avoidBusyDays,
  });

  let status: CandidateStatus;
  const tier = computeRecommendationTier({
    personStatuses,
    requiredIds,
    requiredRoom: request.requiredRoom,
    availableRooms,
    checkpoints,
    requiredHardUnavailable,
    externalOnlyDayMissingBuffer,
    organizerId: options.organizerId,
  });

  if (tier === 3) status = "not_recommended";
  else if (tier === 2) status = !roomOk ? "needs_coordination" : "has_checkpoints";
  else status = "ready";

  const bufferOkCount = isCasualOccasion || !avoidBusyDays
    ? allIds.length
    : allIds.filter(
        (id) =>
          personStatuses[id].state === "available" &&
          !getAdjacentEvent(id, start, end, RECOMMENDATION_PHILOSOPHY.adjacentBufferMinutes, events),
      ).length;

  const participationScore =
    (requiredAvailable.length + optionalAvailable.length) / (allIds.length || 1);

  const metrics: CandidateMetrics = {
    requiredAvailable: requiredAvailable.length / (requiredIds.length || 1),
    roomAvailable: request.requiredRoom ? (availableRooms.length > 0 ? 1 : 0) : 1,
    totalAvailable: (requiredAvailable.length + optionalAvailable.length) / (allIds.length || 1),
    optionalAvailable: optionalIds.length ? optionalAvailable.length / optionalIds.length : 1,
    roomCount: availableRooms.length,
    burdenAvoided: softPenalty === 0 ? 1 : Math.max(0, 1 - softPenalty / 40),
    bufferCount: bufferOkCount,
    softPenalty,
    participationScore,
    compositeScore: 0,
  };

  const candidate: SlotCandidate = {
    start,
    end,
    status,
    occasion: request.occasion,
    personStatuses,
    requiredRoom: request.requiredRoom,
    requiredIds,
    optionalIds,
    availableRooms,
    selectedRoom: defaultRoom,
    roomReason,
    crossTeam,
    validationReasons: [],
    checkpoints,
    softTimeFlags: softFlags,
    hasBackToBack,
    avoidSoftTimes,
    avoidBusyDays,
    metrics,
    tier,
  };

  candidate.metrics.compositeScore = computeCompositeScore(candidate, request.purpose);
  candidate.validationReasons = buildPositiveValidationReasons({
    ...getValidationReasonInput(candidate),
    occasion: request.occasion,
  });

  return candidate;
}

/** purpose metric + soft penalty 기반 후보 정렬 */
export function sortCandidates(candidates: SlotCandidate[], purpose: MeetingPurpose) {
  return candidates.slice().sort((a, b) => {
    const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (rankDiff !== 0) return rankDiff;

    const coordinationDiff = getCandidateCoordinationCost(a) - getCandidateCoordinationCost(b);
    if (coordinationDiff !== 0) return coordinationDiff;

    const scoreDiff = b.metrics.compositeScore - a.metrics.compositeScore;
    if (Math.abs(scoreDiff) > 1e-9) return scoreDiff;
    return a.start.getTime() - b.start.getTime();
  });
}

function pickUniqueCandidate(
  pool: SlotCandidate[],
  usedKeys: Set<string>,
  selector: (a: SlotCandidate, b: SlotCandidate) => number,
): SlotCandidate | null {
  const sorted = pool.slice().sort(selector);
  for (const candidate of sorted) {
    const key = slotTimeKey(candidate.start);
    if (!usedKeys.has(key)) return candidate;
  }
  return null;
}

/** 성격이 다른 최종 3후보 선정 */
export function pickProfiledCandidates(
  candidates: SlotCandidate[],
  purpose: MeetingPurpose,
  people: Person[],
  organizerId: string,
): SlotCandidate[] {
  const visible = candidates.filter((c) => c.tier < 3);
  const pool = visible;
  if (pool.length === 0) return [];

  const sorted = sortCandidates(pool, purpose);
  const usedKeys = new Set<string>();
  const result: SlotCandidate[] = [];

  const assign = (candidate: SlotCandidate | null, profileKey: CandidateProfileKey) => {
    if (!candidate) return;
    const key = slotTimeKey(candidate.start);
    if (usedKeys.has(key)) return;
    usedKeys.add(key);
    result.push({
      ...candidate,
      profileKey,
      profileLabel: CANDIDATE_PROFILE_LABELS[profileKey],
    });
  };

  assign(
    pickUniqueCandidate(sorted, usedKeys, (a, b) => compareCandidatesForDisplay(b, a)),
    "best",
  );

  assign(
    pickUniqueCandidate(sorted, usedKeys, (a, b) => {
      const partDiff = b.metrics.participationScore - a.metrics.participationScore;
      if (Math.abs(partDiff) > 1e-9) return partDiff;
      const optDiff = b.metrics.optionalAvailable - a.metrics.optionalAvailable;
      if (Math.abs(optDiff) > 1e-9) return optDiff;
      return b.metrics.compositeScore - a.metrics.compositeScore;
    }),
    "participation",
  );

  assign(
    pickUniqueCandidate(sorted, usedKeys, (a, b) => {
      const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      if (rankDiff !== 0) return rankDiff;
      const coordinationDiff = getCandidateCoordinationCost(a) - getCandidateCoordinationCost(b);
      if (coordinationDiff !== 0) return coordinationDiff;
      const timeDiff = a.start.getTime() - b.start.getTime();
      if (timeDiff !== 0) return timeDiff;
      return b.metrics.compositeScore - a.metrics.compositeScore;
    }),
    "fastest",
  );

  for (const candidate of sorted) {
    if (result.length >= RECOMMENDATION_PHILOSOPHY.maxCandidates) break;
    const key = slotTimeKey(candidate.start);
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);
    result.push(candidate);
  }

  const sortedForDisplay = result.slice().sort(compareCandidatesForCarousel);
  return sortedForDisplay.map((candidate) => ({
    ...candidate,
    validationReasons: buildPositiveValidationReasons({
      ...getValidationReasonInput(candidate),
      pool: sortedForDisplay,
      occasion: candidate.occasion,
    }),
  }));
}

export function isRequiredAttendanceMet(candidate: SlotCandidate) {
  return candidate.tier === 1;
}

/** tier 1·2 후보만 선택 가능 */
export function isCandidateSelectable(candidate: SlotCandidate) {
  return candidate.tier <= 2;
}

export function countRequiredCoordinationBlockers(candidate: SlotCandidate) {
  return candidate.requiredIds.filter((id) => {
    const state = candidate.personStatuses[id].state;
    return state === "movable_conflict" || state === "external_conflict";
  }).length;
}

/** 필수 참석자 일정 조율(movable)만 — 외근·참고 항목 제외 */
export function countRequiredMovableCoordinationBlockers(candidate: SlotCandidate) {
  return candidate.requiredIds.filter((id) => candidate.personStatuses[id].state === "movable_conflict").length;
}

const COORDINATION_CHECKPOINT_TYPES = new Set<CheckpointType>([
  "focus_conflict",
  "coordination_needed",
  "required_partial",
  "required_external",
]);

export function getCoordinationCheckpoints(candidate: SlotCandidate) {
  return candidate.checkpoints.filter((checkpoint) => COORDINATION_CHECKPOINT_TYPES.has(checkpoint.type));
}

export function getReferenceCheckpoints(candidate: SlotCandidate) {
  return candidate.checkpoints.filter((checkpoint) => !COORDINATION_CHECKPOINT_TYPES.has(checkpoint.type));
}

/** 조율 가능 — 필수 참석자 movable 충돌만 */
export function buildCandidateCoordinationSection(candidate: SlotCandidate) {
  if (candidate.tier !== 2) return null;

  const movableCount = countRequiredMovableCoordinationBlockers(candidate);
  if (movableCount === 0) return null;

  const movableBlockerIds = new Set(
    candidate.requiredIds.filter((id) => candidate.personStatuses[id].state === "movable_conflict"),
  );
  const checkpoints = getCoordinationCheckpoints(candidate).filter(
    (checkpoint) =>
      checkpoint.blockingEventId &&
      checkpoint.blockingPersonId &&
      movableBlockerIds.has(checkpoint.blockingPersonId),
  );
  if (checkpoints.length === 0) return null;

  const visibleCheckpoints = checkpoints.slice(0, RECOMMENDATION_PHILOSOPHY.maxCoordinationBlockers);
  const displayedCount = visibleCheckpoints.length;

  return {
    headline: displayedCount === 1
      ? "1건만 조율하면 이 시간으로 확정할 수 있어요."
      : `${displayedCount}건 조율하면 이 시간으로 확정할 수 있어요.`,
    checkpoints: visibleCheckpoints,
  };
}

export function resolveCheckpointBlockingEvent(
  checkpoint: Checkpoint,
  events: Record<string, CalendarEvent[]>,
): { personId: string; event: CalendarEvent } | null {
  if (!checkpoint.blockingEventId || !checkpoint.blockingPersonId) return null;
  const event = (events[checkpoint.blockingPersonId] || []).find(
    (item) => item.id === checkpoint.blockingEventId,
  );
  if (!event) return null;
  return { personId: checkpoint.blockingPersonId, event };
}

/** tier 1(확정 가능)을 막는 확인할 점 — 조율·참석 확인이 필요한 항목만 */
const TIER1_BLOCKING_CHECKPOINT_TYPES = new Set<CheckpointType>([
  "required_partial",
  "coordination_needed",
  "focus_conflict",
  "required_external",
  "optional_partial",
  "optional_unavailable",
  "external_day",
]);

function countTier1BlockingCheckpoints(checkpoints: Checkpoint[], organizerId?: string) {
  return checkpoints.filter((checkpoint) => {
    if (!TIER1_BLOCKING_CHECKPOINT_TYPES.has(checkpoint.type)) return false;
    if (
      checkpoint.type === "focus_conflict" &&
      organizerId &&
      checkpoint.targetPersonId === organizerId
    ) {
      return false;
    }
    return true;
  }).length;
}

export function isRoomAvailableForCandidate(candidate: SlotCandidate): boolean {
  return !candidate.requiredRoom || candidate.availableRooms.length > 0;
}

/** 필수 전원 가능 + 회의실만 막힌 경우 (조율 대상 아님) */
export function isRoomOnlyBlocker(candidate: SlotCandidate): boolean {
  const allRequiredAvailable = candidate.requiredIds.every(
    (id) => candidate.personStatuses[id].state === "available",
  );
  return (
    candidate.requiredRoom &&
    candidate.availableRooms.length === 0 &&
    allRequiredAvailable &&
    countRequiredCoordinationBlockers(candidate) === 0
  );
}

export function computeRecommendationTier(input: {
  personStatuses: Record<string, PersonSlotStatus>;
  requiredIds: string[];
  requiredRoom: boolean;
  availableRooms: Room[];
  checkpoints: Checkpoint[];
  requiredHardUnavailable: string[];
  externalOnlyDayMissingBuffer: boolean;
  organizerId?: string;
}): RecommendationTier {
  if (input.externalOnlyDayMissingBuffer) return 3;

  const requiredNonCoordinatable = input.requiredIds.filter((id) => {
    const state = input.personStatuses[id].state;
    return state === "unavailable" || state === "external_conflict";
  });
  if (requiredNonCoordinatable.length > 0) return 3;

  const movableCoordinationCount = input.requiredIds.filter(
    (id) => input.personStatuses[id]?.state === "movable_conflict",
  ).length;
  if (movableCoordinationCount > RECOMMENDATION_PHILOSOPHY.maxCoordinationBlockers) return 3;

  const allRequiredAvailable = input.requiredIds.every(
    (id) => input.personStatuses[id].state === "available",
  );
  const roomOk = !input.requiredRoom || input.availableRooms.length > 0;
  const blockingCheckpoints = countTier1BlockingCheckpoints(input.checkpoints, input.organizerId);
  if (allRequiredAvailable && roomOk && blockingCheckpoints === 0) return 1;

  return 2;
}

export function getRecommendationTier(candidate: SlotCandidate): RecommendationTier {
  return candidate.tier;
}

/** 3후보 전체 흐름용 — "불가" 대신 조율 경로 제안 */
export function buildRecommendationFlowSummary(candidates: SlotCandidate[]) {
  if (candidates.length === 0) {
    return {
      headline: "바로 확정 가능한 시간은 없어요.",
      subline: "참석자나 시간 조건을 바꾸면 만들 수 있는지 다시 찾아볼게요.",
    };
  }

  if (candidates.some((candidate) => candidate.tier === 1)) {
    return null;
  }

  if (candidates.length > 0 && candidates.every(isRoomOnlyBlocker)) {
    return {
      headline: "바로 확정 가능한 시간은 없어요.",
      subline: "예약 가능한 회의실이 없어요. 라운지에서 진행해 보거나, 다른 일자를 추천받아 보세요.",
    };
  }

  const minPeopleBlockers = Math.min(...candidates.map(countRequiredCoordinationBlockers));

  if (minPeopleBlockers === 1) {
    return {
      headline: "바로 확정 가능한 시간은 없어요.",
      subline: "하지만 1건만 조율하면 만들 수 있는 시간이 있어요.",
    };
  }

  return {
    headline: "바로 확정 가능한 시간은 없어요.",
    subline: "참고할 점을 확인하면 만들 수 있는 시간이 있어요.",
  };
}

/** 후보별 보조 힌트 — 회의실 없음 등 */
export function buildCandidateCoordinationHint(candidate: SlotCandidate) {
  if (isRoomOnlyBlocker(candidate)) {
    return "예약 가능한 회의실이 없어요. 라운지에서 진행해 보거나, 다른 시간을 찾아볼게요.";
  }
  return null;
}

export function generateCandidates(
  request: RecommendationRequest,
  people: Person[],
  events: Record<string, CalendarEvent[]>,
  companySettings: CompanySettings,
  rooms: Room[],
  options: GenerateCandidatesOptions,
) {
  const slots = generateSlots(request, companySettings).filter(
    (slot) => !options.notBefore || slot.start >= options.notBefore,
  );

  const dayAlternativeContext = new Map<string, boolean>();
  for (const personId of request.requiredIds) {
    const externalDays = new Set<string>();
    (events[personId] || []).forEach((e) => {
      if (isExternalType(e.type)) externalDays.add(toDate(e.start).toDateString());
    });
    externalDays.forEach((dayKey) => {
      const date = new Date(dayKey);
      const otherViableDays = slots.some((slot) => {
        if (slot.start.toDateString() === dayKey) return false;
        return request.requiredIds.every((id) => {
          const status = getPersonStatus(id, slot.start, slot.end, events);
          return status.state !== "unavailable";
        });
      });
      dayAlternativeContext.set(`${personId}:${dayKey}`, !otherViableDays);
    });
  }

  const evaluated = slots.map((slot) =>
    evaluateSlot(slot, request, people, events, companySettings, rooms, options, dayAlternativeContext),
  );

  return pickProfiledCandidates(evaluated, request.purpose, people, options.organizerId);
}

export function getRoomAssignmentReasonForCandidate(
  candidate: SlotCandidate,
  room: Room | undefined,
  people: Person[],
  organizerId: string,
) {
  if (!candidate.requiredRoom || !room) return null;
  return buildRoomAssignmentReason({
    room,
    crossTeam: candidate.crossTeam,
    requiredIds: candidate.requiredIds,
    optionalIds: candidate.optionalIds,
    people,
    organizerId,
    availableRoomCount: candidate.availableRooms.length,
  });
}

function formatShortScheduleRange(start: Date, end: Date): string {
  const month = start.getMonth() + 1;
  const day = start.getDate();
  const fmtTimePart = (date: Date, includePeriod: boolean) => {
    const h = date.getHours();
    const period = h < 12 ? "오전" : "오후";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const min = date.getMinutes();
    const time = min === 0 ? `${hour12}시` : `${hour12}시 ${min}분`;
    return includePeriod ? `${period} ${time}` : time;
  };
  const startPeriod = start.getHours() < 12 ? "오전" : "오후";
  const endPeriod = end.getHours() < 12 ? "오전" : "오후";
  const timeRange = startPeriod === endPeriod
    ? `${startPeriod} ${fmtTimePart(start, false)}~${fmtTimePart(end, false)}`
    : `${fmtTimePart(start, true)}~${fmtTimePart(end, true)}`;
  return `${month}/${day} ${timeRange}`;
}

/** 제안 모달에서 다른 사람 일정을 열었을 때 보낼 조율 메시지 초안 */
export function buildCoordinationDraftMessage(input: {
  ownerFullName: string;
  blockingTitle: string;
  blockingStart: Date;
  blockingEnd: Date;
  proposedTitle: string;
  proposedStart: Date;
  proposedEnd: Date;
}): string {
  const owner = personFirstName(input.ownerFullName);
  const blockingRange = formatShortScheduleRange(input.blockingStart, input.blockingEnd);
  const proposedRange = formatShortScheduleRange(input.proposedStart, input.proposedEnd);
  const proposedTitle = input.proposedTitle.trim() || "새 일정";
  return `${owner}님, 안녕하세요! ${proposedTitle}(${proposedRange}) 회의를 잡으려는데 ${input.blockingTitle}(${blockingRange}) 일정과 겹쳐요. 혹시 ${input.blockingTitle} 일정을 다른 시간으로 옮기는 게 가능할까요?`;
}
