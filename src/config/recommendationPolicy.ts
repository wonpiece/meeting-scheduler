/**
 * 회의 일정 추천 정책 (Recommendation Policy)
 *
 * - Hard block: 점심시간 겹침 슬롯 제외, 필수 참석자 hard unavailable 제외
 * - Soft condition: 출퇴근·점심 직후·외근·연속회의·집중근무 등은 점수 감점 + Checkpoints
 * - 목적(purpose): 제목·설명·참석자·길이로 자동 추론, 정렬에만 사용
 * - 최종 3후보: 가장 추천 / 가장 빠르게 진행 가능 / 참여율 최고
 */

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
  | "fatigue";

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

export interface CalendarEvent {
  id: string;
  start: string;
  end: string;
  type?: string;
  movable?: boolean;
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
  validationReasons: string[];
  checkpoints: Checkpoint[];
  metrics: CandidateMetrics;
  profileKey?: CandidateProfileKey;
  profileLabel?: string;
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
  beforeLeaving: 12,
  afterLunch: 10,
  fatigue: 8,
  optionalUnavailable: 7,
  backToBack: 6,
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

  return {
    justArrived: startH >= commuteIn && startH < commuteIn + RECOMMENDATION_PHILOSOPHY.commuteBufferMinutes / 60,
    beforeLeaving: endH > commuteOut - RECOMMENDATION_PHILOSOPHY.beforeLeavingHours && endH <= commuteOut,
    afterLunch: startH >= lunchEnd && startH < afterLunchEnd,
  };
}

function isHardConflict(event: CalendarEvent) {
  return !event.movable && !isExternalType(event.type);
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

  const movableConflict = conflicts.find((e) => e.movable === true);
  if (movableConflict) return { state: "movable_conflict", conflicts, blocking: movableConflict };

  const hardConflict = conflicts.find(isHardConflict);
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

function getAdjacentEvent(
  personId: string,
  slotStart: Date,
  slotEnd: Date,
  bufferMin: number,
  events: Record<string, CalendarEvent[]>,
) {
  const personEvents = events[personId] || [];
  const beforeWindowStart = addMin(slotStart, -bufferMin);
  const afterWindowEnd = addMin(slotEnd, bufferMin);
  return personEvents.find((e) => {
    const es = toDate(e.start);
    const ee = toDate(e.end);
    return (ee <= slotStart && ee > beforeWindowStart) || (es >= slotEnd && es < afterWindowEnd);
  });
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
  const targetPeople = crossTeam ? otherTeamAttendees : allAttendees;

  const scoreRoom = (room: Room) =>
    targetPeople.filter((p) => p.tower === room.tower && p.floor === room.floor).length * 2 +
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

/** 확정 행동 강령(Checkpoints) — 사용자가 바로 행동할 수 있는 문장 */
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
  } = input;
  const checkpoints: Checkpoint[] = [];

  if (softFlags.afterLunch) {
    checkpoints.push({
      type: "after_lunch",
      title: "점심 직후 시간",
      description:
        "식곤증으로 집중력이 흐려지기 쉬운 시간입니다. 발표식 진행 대신 토론이나 질의응답 방식으로 회의를 구성하세요.",
    });
  }
  if (softFlags.justArrived) {
    checkpoints.push({
      type: "just_arrived",
      title: "출근 직후 시간",
      description:
        "출근 직후라 회의 맥락 파악이 어려울 수 있습니다. 참석자들이 미리 준비할 수 있도록 회의 전날 안건을 공유하세요.",
    });
  }
  if (softFlags.beforeLeaving) {
    checkpoints.push({
      type: "before_leaving",
      title: "퇴근 직전 시간",
      description:
        "퇴근 직전 시간대이므로 정시 종료가 필수입니다. 정해진 회의 시간을 엄격히 준수하여 진행하세요.",
    });
  }

  requiredExternalIds.forEach((id) => {
    const person = people.find((p) => p.id === id);
    if (!person) return;
    checkpoints.push({
      type: "required_external",
      targetPersonId: id,
      title: `${person.name}님 외근`,
      description: `${person.name}님의 외근 이동 시간(전후 2시간)을 고려해 추천된 일정입니다. 지금 ${person.name}님께 온라인 참석 가능 여부를 확인하고 확정하세요.`,
    });
  });

  allIds.forEach((id) => {
    if (personStatuses[id].state !== "available") return;
    const adj = getAdjacentEvent(
      id,
      start,
      input.end,
      RECOMMENDATION_PHILOSOPHY.adjacentBufferMinutes,
      events,
    );
    if (!adj) return;
    const roomName = selectedRoom?.name ?? "회의실";
    checkpoints.push({
      type: "back_to_back_meeting",
      targetPersonId: id,
      title: "연속 회의",
      description: `이전 일정과 바로 연결되는 시간입니다. 다음 회의로의 빠른 이동을 위해 가장 가까운 ${roomName}을 배정했습니다.`,
    });
  });

  optionalIds
    .filter((id) => personStatuses[id].state !== "available")
    .forEach((id) => {
      const person = people.find((p) => p.id === id);
      if (!person) return;
      const isExternal = personStatuses[id].conflicts.some((e) => isExternalType(e.type));
      if (isExternal) {
        checkpoints.push({
          type: "external_day",
          targetPersonId: id,
          title: `${person.name}님 외근`,
          description: `${person.name}님의 외근 이동 시간(전후 2시간)을 고려해 추천된 일정입니다. 지금 ${person.name}님께 온라인 참석 가능 여부를 확인하고 확정하세요.`,
        });
      } else {
        checkpoints.push({
          type: "optional_unavailable",
          targetPersonId: id,
          title: `${person.name}님 불참 가능`,
          description: `다른 대안이 없어 선택 참석자가 불참하는 시간대로 추천되었습니다. ${person.name}님께 양해를 구하고, 회의 종료 후 요약본을 공유하세요.`,
        });
      }
    });

  requiredIds
    .filter((id) => personStatuses[id].state === "movable_conflict")
    .forEach((id) => {
      const person = people.find((p) => p.id === id);
      if (!person) return;
      const blockingType = personStatuses[id].blocking?.type;
      if (blockingType === "focus") {
        checkpoints.push({
          type: "focus_conflict",
          targetPersonId: id,
          title: `${person.name}님 집중 근무`,
          description: `${person.name}님의 집중 근무 시간과 겹치는 유일한 대안입니다. ${person.name}님께 해당 시간의 집중 근무 일정 이동이 가능한지 지금 확인하세요.`,
        });
      } else {
        checkpoints.push({
          type: "coordination_needed",
          targetPersonId: id,
          title: `${person.name}님 일정 조율`,
          description: `${person.name}님의 기존 일정과 겹치는 유일한 대안입니다. ${person.name}님께 해당 시간 참석 가능 여부를 지금 확인하세요.`,
        });
      }
    });

  allIds.forEach((id) => {
    if (personStatuses[id].state !== "available") return;
    const dayCount = getDayMeetingCount(id, start, events);
    if (dayCount < RECOMMENDATION_PHILOSOPHY.fatigueMeetingThreshold) return;
    const person = people.find((p) => p.id === id);
    if (!person) return;
    checkpoints.push({
      type: "fatigue",
      targetPersonId: id,
      title: `${person.name}님 미팅 과다`,
      description: `${person.name}님에게 이미 하루 미팅이 많은 날입니다. 회의 시간을 엄수하고 불필요한 안건은 과감히 생략하세요.`,
    });
  });

  return checkpoints;
}

function buildValidationReasons(input: {
  purpose: MeetingPurpose;
  profileLabel?: string;
  requiredAvailableCount: number;
  requiredCount: number;
  optionalAvailableCount: number;
  optionalCount: number;
  allCount: number;
  bufferOkCount: number;
  softPenalty: number;
  participationScore: number;
}) {
  const reasons: string[] = [];

  if (input.profileLabel) reasons.push(input.profileLabel);

  if (input.requiredAvailableCount === input.requiredCount) {
    reasons.push("필수 참석자 전원이 참석할 수 있어요.");
  }
  if (input.bufferOkCount >= Math.ceil(input.allCount * RECOMMENDATION_PHILOSOPHY.bufferOkRatio)) {
    reasons.push("참석자 대부분에게 전후 30분 여유가 있어요.");
  }
  if (input.softPenalty === 0) {
    reasons.push("점심 직후 · 퇴근 직전 시간을 피했어요.");
  }
  if (input.purpose === "decision" && input.requiredAvailableCount === input.requiredCount) {
    reasons.push("결정에 필요한 참석자가 모두 가능한 시간이에요.");
  }
  if (input.purpose === "ideation" && input.optionalAvailableCount === input.optionalCount) {
    reasons.push("아이디어 논의에 필요한 인원이 가장 많이 모일 수 있어요.");
  }
  if (input.participationScore >= 0.99 && input.optionalCount > 0) {
    reasons.push("선택 참석자까지 모두 참석 가능한 시간이에요.");
  }

  return reasons;
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
  const roomReason = crossTeam
    ? "타 팀 참석자와 가까운 회의실이에요."
    : "참석자들이 이동하기 가까운 회의실이에요.";

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
  });

  let status: CandidateStatus;
  if (requiredHardUnavailable.length > 0 || externalOnlyDayMissingBuffer) status = "not_recommended";
  else if (!roomOk) status = "needs_coordination";
  else if (checkpoints.length > 0 || requiredExternal.length > 0 || requiredMovable.length > 0) {
    status = "has_checkpoints";
  } else status = "ready";

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
    validationReasons: [],
    checkpoints,
    metrics,
  };

  candidate.metrics.compositeScore = computeCompositeScore(candidate, request.purpose);
  candidate.validationReasons = buildValidationReasons({
    purpose: request.purpose,
    requiredAvailableCount: requiredAvailable.length,
    requiredCount: requiredIds.length,
    optionalAvailableCount: optionalAvailable.length,
    optionalCount: optionalIds.length,
    allCount: allIds.length,
    bufferOkCount,
    softPenalty,
    participationScore,
  });

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
): SlotCandidate[] {
  const visible = candidates.filter((c) => c.status !== "not_recommended");
  if (visible.length === 0) return [];

  const sorted = sortCandidates(visible, purpose);
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
      validationReasons: buildValidationReasons({
        purpose,
        profileLabel: CANDIDATE_PROFILE_LABELS[profileKey],
        requiredAvailableCount: Math.round(candidate.metrics.requiredAvailable * candidate.requiredIds.length),
        requiredCount: candidate.requiredIds.length,
        optionalAvailableCount: Math.round(candidate.metrics.optionalAvailable * candidate.optionalIds.length),
        optionalCount: candidate.optionalIds.length,
        allCount: candidate.requiredIds.length + candidate.optionalIds.length,
        bufferOkCount: candidate.metrics.bufferCount,
        softPenalty: candidate.metrics.softPenalty,
        participationScore: candidate.metrics.participationScore,
      }),
    });
  };

  assign(
    pickUniqueCandidate(sorted, usedKeys, (a, b) => b.metrics.compositeScore - a.metrics.compositeScore),
    "best",
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

  for (const candidate of sorted) {
    if (result.length >= RECOMMENDATION_PHILOSOPHY.maxCandidates) break;
    const key = slotTimeKey(candidate.start);
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);
    result.push(candidate);
  }

  return result;
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

  return pickProfiledCandidates(evaluated, request.purpose);
}
