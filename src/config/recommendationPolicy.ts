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
  targetPersonId?: string;
}

export interface RecommendationRequest {
  title: string;
  description: string;
  purpose: MeetingPurpose;
  purposeConfidence: number;
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
  metrics: CandidateMetrics;
  profileKey?: CandidateProfileKey;
  profileLabel?: string;
  tier: RecommendationTier;
}

export interface GenerateCandidatesOptions {
  organizerId: string;
  roomEvents: Record<string, RoomBooking[]>;
  fallbackRooms: Room[];
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

  return {
    title: input.title || "새 회의",
    description: input.description?.trim() ?? "",
    purpose,
    purposeConfidence: confidence,
    durationMinutes: input.durationMinutes,
    dateRangeStart: `${input.weekDays[0]}T${hourToTimeStr(cs.commuteIn)}:00`,
    dateRangeEnd: `${input.weekDays[input.weekDays.length - 1]}T${hourToTimeStr(cs.commuteOut)}:00`,
    requiredRoom: input.roomRequired !== false,
    forcedRoomId: input.forcedRoomId,
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

/** 1인 미팅·집중 시간 등 — 옮길 수 있는 블록 */
function isEffectivelyMovable(event: CalendarEvent) {
  if (event.movable) return true;
  if (event.type === "focus") return true;
  if (event.type !== "meeting") return false;
  if (event.meetingMeta) {
    const attendeeCount = event.meetingMeta.requiredIds.length + event.meetingMeta.optionalIds.length;
    return attendeeCount <= 1;
  }
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

function buildOrganizerBackToBackDescription(adjacent: {
  before?: CalendarEvent;
  after?: CalendarEvent;
}) {
  const { before, after } = adjacent;
  if (before && after) {
    return `앞 뒤로 ${before.title},${after.title}가 있어요. 옮길 수 있는지 확인해 보세요.`;
  }
  if (before) {
    return `앞에 ${before.title}가 있어요. 옮길 수 있는지 확인해 보세요.`;
  }
  if (after) {
    return `뒤에 ${after.title}가 있어요. 옮길 수 있는지 확인해 보세요.`;
  }
  return "앞뒤로 일정이 이어져 있어요. 옮길 수 있는지 확인해 보세요.";
}

function focusEventLabel(blocking?: CalendarEvent) {
  const title = blocking?.title?.trim();
  return title || "집중 근무";
}

function buildFocusConflictCheckpoint(input: {
  person: Person;
  isOrganizer: boolean;
  blocking?: CalendarEvent;
}): Checkpoint {
  const focusLabel = focusEventLabel(input.blocking);
  if (input.isOrganizer) {
    return {
      type: "focus_conflict",
      targetPersonId: input.person.id,
      title: "집중 근무 겹침",
      description: `${focusLabel}와 겹쳐요. 다른 시간으로 옮겨 보세요.`,
    };
  }
  return {
    type: "focus_conflict",
    targetPersonId: input.person.id,
    title: `${personFirstName(input.person.name)}님 집중 근무 겹침`,
    description: `${focusLabel}를 다른 시간으로 옮길 수 있는지 확인해 보세요.`,
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
      description: "발표 위주보다 토론·질의응답 방식으로 회의를 구성해 보세요.",
    });
  } else if (softFlags.justArrived) {
    checkpoints.push({
      type: "just_arrived",
      title: "출근 직후 시간",
      description: "참석자가 미리 준비할 수 있도록 회의 전날 안건과 자료를 공유해 보세요.",
    });
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
      checkpoints.push({
        type: "coordination_needed",
        title: `${personFirstName(person.name)}님 일정 조율 필요`,
        description: "해당 시간 참석 가능 여부를 확인해 보세요.",
      });
    }
  }

  const hasBackToBack = allIds.some(
    (id) =>
      personStatuses[id].state === "available" &&
      getAdjacentEvent(id, start, input.end, RECOMMENDATION_PHILOSOPHY.adjacentBufferMinutes, events),
  );
  const backToBackIds = allIds.filter((id) => {
    if (personStatuses[id].state !== "available") return false;
    const adjacent = getAdjacentEvents(
      id,
      start,
      input.end,
      RECOMMENDATION_PHILOSOPHY.adjacentBufferMinutes,
      events,
    );
    return !!(adjacent.before || adjacent.after);
  });
  if (hasBackToBack) {
    for (const id of backToBackIds.slice(0, 2)) {
      const person = people.find((p) => p.id === id);
      if (!person) continue;
      const isOrganizer = id === organizerId;
      const adjacent = getAdjacentEvents(
        id,
        start,
        input.end,
        RECOMMENDATION_PHILOSOPHY.adjacentBufferMinutes,
        events,
      );
      checkpoints.push({
        type: "back_to_back_meeting",
        title: `${personFirstName(person.name)}님 연속 회의`,
        description: isOrganizer
          ? buildOrganizerBackToBackDescription(adjacent)
          : "앞뒤로 일정이 이어져 있어요. 참석 가능한지 확인해 보세요.",
      });
    }
  }

  const fatiguedIds = allIds.filter((id) => {
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
        description: "불필요한 안건은 과감히 빼고, 정해진 시간 안에 회의를 마무리해 보세요.",
      });
    }
  }

  return compactCheckpoints(checkpoints);
}

function pushUniqueReason(reasons: string[], line: string) {
  if (!reasons.includes(line)) reasons.push(line);
}

function buildComparativeLeads(candidate: SlotCandidate, pool: SlotCandidate[]): string[] {
  if (pool.length <= 1) return [];

  const lines: string[] = [];
  const candidateKey = slotTimeKey(candidate.start);
  const totalCount = candidate.requiredIds.length + candidate.optionalIds.length;

  const earliest = pool.reduce((best, c) => (c.start.getTime() < best.start.getTime() ? c : best));
  if (candidateKey === slotTimeKey(earliest.start)) {
    lines.push("3개 후보 중 가장 이른 시간이에요.");
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

function compareCandidatesForDisplay(a: SlotCandidate, b: SlotCandidate) {
  const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
  if (rankDiff !== 0) return rankDiff;

  const checkpointDiff = a.checkpoints.length - b.checkpoints.length;
  if (checkpointDiff !== 0) return checkpointDiff;

  const softDiff = a.metrics.softPenalty - b.metrics.softPenalty;
  if (softDiff !== 0) return softDiff;

  const scoreDiff = b.metrics.compositeScore - a.metrics.compositeScore;
  if (Math.abs(scoreDiff) > 1e-9) return scoreDiff;

  return a.start.getTime() - b.start.getTime();
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
}) {
  const reasons: string[] = [];

  if (input.pool && input.pool.length > 1) {
    for (const line of buildComparativeLeads(input.candidate, input.pool)) {
      pushUniqueReason(reasons, line);
    }

    const maxRoomCount = Math.max(...input.pool.map((candidate) => candidate.metrics.roomCount));
    if (
      input.requiredRoom &&
      input.candidate.metrics.roomCount >= maxRoomCount &&
      maxRoomCount > 1 &&
      input.pool.filter((candidate) => candidate.metrics.roomCount >= maxRoomCount - 1e-9).length < input.pool.length
    ) {
      pushUniqueReason(reasons, "다른 후보보다 회의실 선택지가 많아요.");
    }
  }

  const {
    requiredAvailableCount,
    requiredCount,
    optionalAvailableCount,
    optionalCount,
    allCount,
    bufferOkCount,
    softPenalty,
    softTimeFlags,
    hasBackToBack,
  } = input;

  if (
    allCount > 0 &&
    requiredAvailableCount === requiredCount &&
    optionalAvailableCount === optionalCount
  ) {
    pushUniqueReason(reasons, "전 인원이 참석 가능해요.");
  }

  if (requiredCount > 0 && requiredAvailableCount === requiredCount) {
    pushUniqueReason(reasons, `필수 참석자 ${requiredCount}명 모두 참석 가능해요.`);
  }

  if (optionalCount > 0 && optionalAvailableCount === optionalCount) {
    pushUniqueReason(reasons, `선택 참석자 ${optionalCount}명도 모두 참석 가능해요.`);
  }

  const bufferThreshold = Math.ceil(allCount * RECOMMENDATION_PHILOSOPHY.bufferOkRatio);
  if (allCount > 0 && bufferOkCount >= bufferThreshold) {
    pushUniqueReason(reasons, `${allCount}명 중 ${bufferOkCount}명, 회의 전후 30분 일정이 비어 있어요.`);
  }

  if (
    softPenalty === 0 &&
    !softTimeFlags.beforeLeaving &&
    !softTimeFlags.afterLunch &&
    !softTimeFlags.justArrived &&
    !hasBackToBack
  ) {
    pushUniqueReason(reasons, "점심·퇴근 1시간 전·바로 앞뒤 회의 시간대가 아니에요.");
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
    return "이 시간대에 예약 가능한 유일한 회의실이에요.";
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
  score -= STATUS_RANK[candidate.status] * 1_000_000;
  return score;
}

export function generateSlots(request: RecommendationRequest, companySettings: CompanySettings) {
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

  const requiredExternalNoBuffer = requiredExternal.filter(
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

  const softFlags = getSoftTimeFlags(start, end, companySettings);
  const hasBackToBack = allIds.some(
    (id) =>
      personStatuses[id].state === "available" &&
      getAdjacentEvent(id, start, end, RECOMMENDATION_PHILOSOPHY.adjacentBufferMinutes, events),
  );
  const hasFatigue = allIds.some((id) => {
    if (personStatuses[id].state !== "available") return false;
    return getDayMeetingCount(id, start, events) >= RECOMMENDATION_PHILOSOPHY.fatigueMeetingThreshold;
  });
  const focusConflictCount = requiredMovable.filter(
    (id) => personStatuses[id].blocking?.type === "focus",
  ).length;

  const softPenalty = computeSoftPenalty({
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

  const bufferOkCount = allIds.filter(
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
    metrics,
    tier,
  };

  candidate.metrics.compositeScore = computeCompositeScore(candidate, request.purpose);
  candidate.validationReasons = buildPositiveValidationReasons(getValidationReasonInput(candidate));

  return candidate;
}

/** purpose metric + soft penalty 기반 후보 정렬 */
export function sortCandidates(candidates: SlotCandidate[], purpose: MeetingPurpose) {
  return candidates.slice().sort((a, b) => {
    const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (rankDiff !== 0) return rankDiff;
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
  const pool = visible.length > 0 ? visible : candidates.filter((c) => c.requiredIds.every(
    (id) => c.personStatuses[id].state !== "unavailable",
  ));
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

  const sortedForDisplay = result.slice().sort(compareCandidatesForDisplay);
  return sortedForDisplay.map((candidate) => ({
    ...candidate,
    validationReasons: buildPositiveValidationReasons({
      ...getValidationReasonInput(candidate),
      pool: sortedForDisplay,
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
]);

export function getCoordinationCheckpoints(candidate: SlotCandidate) {
  return candidate.checkpoints.filter((checkpoint) => COORDINATION_CHECKPOINT_TYPES.has(checkpoint.type));
}

export function getReferenceCheckpoints(candidate: SlotCandidate) {
  return candidate.checkpoints.filter((checkpoint) => !COORDINATION_CHECKPOINT_TYPES.has(checkpoint.type));
}

/** 조율 1건이면 확정 가능 — 필수 참석자 movable 충돌만 */
export function buildCandidateCoordinationSection(candidate: SlotCandidate) {
  if (candidate.tier !== 2) return null;
  if (countRequiredMovableCoordinationBlockers(candidate) !== 1) return null;

  const checkpoints = getCoordinationCheckpoints(candidate);
  if (checkpoints.length === 0) return null;

  return {
    headline: "1건만 조율하면 이 시간으로 확정할 수 있어요.",
    checkpoints,
  };
}

function countRequiredPeopleBlockers(input: {
  personStatuses: Record<string, PersonSlotStatus>;
  requiredIds: string[];
}) {
  return input.requiredIds.filter((id) => {
    const state = input.personStatuses[id].state;
    return state === "movable_conflict" || state === "external_conflict";
  }).length;
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
  if (input.requiredHardUnavailable.length > 0 || input.externalOnlyDayMissingBuffer) {
    return 3;
  }

  const peopleBlockers = countRequiredPeopleBlockers(input);
  if (peopleBlockers >= 2) return 3;

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
  const slots = generateSlots(request, companySettings);

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
