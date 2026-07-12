import { buildOneOnOneTitle, personFirstName, pickPeerName } from "./anonymizedNames";
import { COMMON_EVENT_BLOCKS } from "./commonEvents";
import {
  COMMUTE_BUFFER_HOURS,
  DEFAULT_COMPANY_SETTINGS,
  type CompanyScheduleSettings,
} from "./companyDefaults";
import { getRoleTemplate } from "./roleTemplates";
import type {
  DemoRoom,
  DraftScheduleItem,
  GeneratedCalendarEvent,
  MockPerson,
  PersonCalendarTraits,
  RandomFn,
  ScheduleBlock,
  TitleMode,
} from "./types";

/** 데모 기준 다음 주 월요일 (2026-07-13) */
export const MOCK_BASE_MONDAY = new Date(2026, 6, 13);
export const MOCK_WEEK_COUNT = 3;

const MIN_EVENT_DURATION_MIN = 30;
const TIME_SNAP_MIN = 10;
/** 구성원별 주간 일정 목표량 — 약 15% 감소 */
const VOLUME_SCALE = 0.85;

type GeneratorBounds = {
  lunchStart: number;
  lunchEnd: number;
  bizEnd: number;
  commuteOutBandStart: number;
  earliestEventStart: number;
};

function createGeneratorBounds(settings: CompanyScheduleSettings): GeneratorBounds {
  return {
    lunchStart: settings.lunchStart,
    lunchEnd: settings.lunchEnd,
    bizEnd: settings.commuteOut,
    commuteOutBandStart: settings.commuteOut,
    earliestEventStart: settings.commuteIn + COMMUTE_BUFFER_HOURS,
  };
}

let generatorBounds = createGeneratorBounds(DEFAULT_COMPANY_SETTINGS);

export function configureEventGenerator(settings: CompanyScheduleSettings) {
  generatorBounds = createGeneratorBounds(settings);
}

function snapDurationMinutes(minutes: number) {
  return Math.max(MIN_EVENT_DURATION_MIN, Math.round(minutes / TIME_SNAP_MIN) * TIME_SNAP_MIN);
}

function snapStartHour(hour: number) {
  const totalMin = Math.round(hour * 60);
  return Math.round(totalMin / TIME_SNAP_MIN) * TIME_SNAP_MIN / 60;
}

function clampScheduleStart(start: number, durationMinutes: number) {
  const maxStart = generatorBounds.bizEnd - durationMinutes / 60;
  const clamped = Math.max(generatorBounds.earliestEventStart, Math.min(maxStart, start));
  return snapStartHour(clamped);
}

function sanitizeScheduleItem(item: DraftScheduleItem): DraftScheduleItem | null {
  const duration = snapDurationMinutes(item.duration);
  const start = clampScheduleStart(item.start, duration);
  if (start < generatorBounds.earliestEventStart) return null;
  if (item.category === "lunch" || item.type === "lunch") {
    if (!fitsInLunchWindow(start, duration)) return null;
  } else if (overlapsReservedCompanyTime(start, duration)) {
    return null;
  }
  return { ...item, start, duration };
}

function isLunchBlock(block: ScheduleBlock) {
  return block.category === "lunch" || block.type === "lunch";
}

function lunchWindowDurationMinutes() {
  return Math.round((generatorBounds.lunchEnd - generatorBounds.lunchStart) * 60);
}

function lunchSlotStarts(): number[] {
  const { lunchStart, lunchEnd } = generatorBounds;
  const span = lunchEnd - lunchStart;
  if (span <= 0.5) return [snapStartHour(lunchStart)];
  const mid = lunchStart + span / 2;
  return [lunchStart, mid].map(snapStartHour);
}

function fitsInLunchWindow(start: number, durationMinutes: number) {
  const end = start + durationMinutes / 60;
  return start >= generatorBounds.lunchStart - 1e-9 && end <= generatorBounds.lunchEnd + 1e-9;
}

/** 회사 점심·출근·퇴근 시간대와 겹치지 않는지 (관리 탭 회사 설정 기준) */
function overlapsReservedCompanyTime(start: number, durationMinutes: number) {
  const { lunchStart, lunchEnd, bizEnd, commuteOutBandStart, earliestEventStart } = generatorBounds;
  const end = start + durationMinutes / 60;
  if (start < earliestEventStart) return true;
  if (start < lunchEnd && end > lunchStart) return true;
  if (start < bizEnd && end > commuteOutBandStart) return true;
  if (end > bizEnd) return true;
  return false;
}

const WEEK_COUNT_MODIFIERS = [
  { countScale: 1, focusBoost: 0, externalBoost: 0, oneOnOneBoost: 0 },
  { countScale: 0.9, focusBoost: -0.06, externalBoost: 0.08, oneOnOneBoost: 0.1 },
  { countScale: 1.08, focusBoost: 0.1, externalBoost: -0.04, oneOnOneBoost: -0.05 },
];

export function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededRandom(seed: number): RandomFn {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWithRandom<T>(list: T[], random: RandomFn): T {
  return list[Math.floor(random() * list.length) % list.length];
}

function pickWeightedBlock(blocks: ScheduleBlock[], random: RandomFn, traits: PersonCalendarTraits) {
  const weights = blocks.map((block) => {
    const base = block.weight ?? 1;
    const traitWeight = traits.poolWeights[block.category] ?? 1;
    return base * traitWeight;
  });
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return blocks[0];
  let roll = random() * total;
  for (let i = 0; i < blocks.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return blocks[i];
  }
  return blocks[blocks.length - 1];
}

function overlapsGenerated(items: DraftScheduleItem[], day: number, start: number, duration: number) {
  const end = start + duration / 60;
  const gap = 5 / 60;
  return items.some(
    (item) =>
      item.day === day &&
      start < item.start + item.duration / 60 + gap &&
      item.start < end + gap,
  );
}

function shiftDay(day: number, shift: number) {
  return Math.max(0, Math.min(4, day + shift));
}

function resolveTitle(
  block: ScheduleBlock,
  person: MockPerson,
  random: RandomFn,
  traits: PersonCalendarTraits,
): string {
  const base = pickWithRandom(block.titles, random);
  const mode: TitleMode = block.titleMode ?? "plain";

  if (mode === "oneOnOne") {
    const self = personFirstName(person.name);
    const peer = pickPeerName([self], random);
    return buildOneOnOneTitle(self, peer);
  }
  return base;
}

function applyPersonStartOffset(
  start: number,
  traits: PersonCalendarTraits,
  random: RandomFn,
  duration: number,
  skipJitter: boolean,
) {
  const maxStart = generatorBounds.bizEnd - duration / 60;
  if (skipJitter) {
    const adjusted = Math.max(
      generatorBounds.earliestEventStart,
      start + traits.startOffset * 0.3,
    );
    const snapped = snapStartHour(adjusted);
    if (snapped < generatorBounds.earliestEventStart || snapped > maxStart) return null;
    return snapped;
  }
  const jitter = pickWithRandom([-0.5, 0, 0, 0.25, 0.5], random);
  const morningAdjust = traits.morningPerson ? -0.25 : 0.25;
  const adjusted = start + traits.startOffset + jitter + morningAdjust;
  const snapped = snapStartHour(adjusted);
  if (snapped < generatorBounds.earliestEventStart || snapped > maxStart) return null;
  return snapped;
}

function pickPersonDay(block: ScheduleBlock, random: RandomFn, traits: PersonCalendarTraits, fixedDay?: number) {
  if (fixedDay != null) return fixedDay;

  const weightedDays = block.days.map((day) => {
    const shifted = shiftDay(day, traits.weeklyDayShift);
    return { day: shifted, weight: traits.dayWeights[shifted] ?? 1 };
  });
  const total = weightedDays.reduce((sum, item) => sum + item.weight, 0);
  let roll = random() * total;
  for (const item of weightedDays) {
    roll -= item.weight;
    if (roll <= 0) return item.day;
  }
  return weightedDays[weightedDays.length - 1].day;
}

function pickPersonStart(block: ScheduleBlock, random: RandomFn, traits: PersonCalendarTraits) {
  if (isLunchBlock(block)) {
    return pickWithRandom(lunchSlotStarts(), random);
  }
  if (block.category === "daily" && !block.skipJitter) return traits.dailyHour;
  const eligibleStarts = block.starts.filter((hour) => hour >= generatorBounds.earliestEventStart);
  if (eligibleStarts.length === 0) return generatorBounds.earliestEventStart;
  if (eligibleStarts.length === 1) return eligibleStarts[0];
  return pickWithRandom(eligibleStarts, random);
}

function pickPersonDuration(block: ScheduleBlock, random: RandomFn, traits: PersonCalendarTraits) {
  if (isLunchBlock(block)) {
    const maxDur = lunchWindowDurationMinutes();
    const durations = block.durations
      .map((d) => Math.min(snapDurationMinutes(Math.max(MIN_EVENT_DURATION_MIN, d + traits.durationBias)), maxDur))
      .filter((d) => d >= MIN_EVENT_DURATION_MIN && d <= maxDur);
    if (durations.length === 0) return Math.min(maxDur, MIN_EVENT_DURATION_MIN);
    return pickWithRandom(durations, random);
  }
  const durations = block.durations.map((d) => Math.max(MIN_EVENT_DURATION_MIN, d + traits.durationBias));
  return snapDurationMinutes(pickWithRandom(durations, random));
}

function blockActiveThisWeek(block: ScheduleBlock, week: number) {
  if (!block.weeks || block.weeks.length === 0) return true;
  return block.weeks.includes(week);
}

function shouldPlaceBlock(block: ScheduleBlock, random: RandomFn) {
  if (block.probability == null) return true;
  return random() < block.probability;
}

/** 구성원 고유 seed → 개인별 캘린더 성향 */
export function derivePersonTraits(person: MockPerson): PersonCalendarTraits {
  const random = seededRandom(hashString(`${person.id}|${person.name}|${person.team}|${person.floor}|${person.role}|v3`));

  const roleExternalBoost =
    person.role === "Business Development Manager" ? 1.5 :
    person.role === "Product Manager" ? 0.55 :
    person.role.includes("Designer") ? 0.45 : 0.25;

  return {
    meetingCountBias: Math.floor(random() * 7) - 3,
    morningPerson: random() > 0.38,
    startOffset: (random() - 0.5) * 1.5,
    lunchMeetingChance: 0.15 + random() * 0.45,
    personalChance: 0.1 + random() * 0.32,
    focusAffinity: random(),
    oneOnOneAffinity: person.role === "Product Manager" ? 0.65 + random() * 0.35 : random() * 0.6,
    externalAffinity: random() * roleExternalBoost,
    dayWeights: Array.from({ length: 5 }, () => 0.35 + random() * 1.1),
    dailyHour: generatorBounds.earliestEventStart + Math.floor(random() * 3) * 0.5,
    weeklyDayShift: Math.floor(random() * 3) - 1,
    durationBias: Math.floor(random() * 5) * 10 - 20,
    poolWeights: {
      daily: 0.6 + random() * 0.9,
      weekly: 0.55 + random() * 0.95,
      oneOnOne: 0.35 + random() * (person.role === "Product Manager" ? 1.2 : 0.55),
      focus: 0.45 + random() * traitsFocus(person, random),
      external: 0.25 + random() * roleExternalBoost,
      lunch: 0.25 + random() * 0.85,
      personal: 0.12 + random() * 0.55,
      sync: 0.45 + random() * 0.95,
      review: 0.45 + random() * 0.95,
      common: 0.5 + random() * 0.8,
    },
  };
}

function traitsFocus(person: MockPerson, random: RandomFn) {
  if (person.role === "Product Designer") return 0.95 + random();
  if (person.role === "Backend") return 0.85 + random() * 0.4;
  if (person.role === "Frontend") return 0.55 + random() * 0.45;
  if (person.role === "Product Manager") return 0.35 + random() * 0.4;
  return 0.15 + random() * 0.45;
}

function resolveEventType(block: ScheduleBlock, random: RandomFn): DraftScheduleItem["type"] {
  if (block.type && (!block.typeChance || random() < block.typeChance)) return block.type;
  return "meeting";
}

function addScheduleItem(
  schedule: DraftScheduleItem[],
  block: ScheduleBlock,
  person: MockPerson,
  random: RandomFn,
  traits: PersonCalendarTraits,
  force = false,
  fixedDay?: number,
  fixedStart?: number,
) {
  if (!shouldPlaceBlock(block, random) && !force) return false;

  const day = pickPersonDay(block, random, traits, fixedDay);
  const duration = pickPersonDuration(block, random, traits);
  const rawStart = fixedStart ?? pickPersonStart(block, random, traits);
  let start: number | null;
  if (fixedStart != null) {
    const snapped = snapStartHour(fixedStart);
    start = snapped >= generatorBounds.earliestEventStart && snapped <= generatorBounds.bizEnd - duration / 60 ? snapped : null;
  } else {
    start = applyPersonStartOffset(
      rawStart,
      traits,
      random,
      duration,
      (block.skipJitter ?? false) || isLunchBlock(block),
    );
  }
  if (start == null || start < generatorBounds.earliestEventStart) return false;

  const isLunch = isLunchBlock(block);
  if (isLunch) {
    if (!fitsInLunchWindow(start, duration)) return false;
  } else if (overlapsReservedCompanyTime(start, duration)) {
    return false;
  }

  if (!force && block.category === "oneOnOne") {
    const dayCount = schedule.filter((item) => item.day === day && item.category === "oneOnOne").length;
    if (dayCount >= 3) return false;
  }

  if (!force && overlapsGenerated(schedule, day, start, duration)) return false;

  schedule.push({
    day,
    start,
    duration,
    title: resolveTitle(block, person, random, traits),
    type: resolveEventType(block, random),
    movable: block.movable ?? false,
    category: block.category,
  });
  return true;
}

function injectCommonEvents(
  schedule: DraftScheduleItem[],
  person: MockPerson,
  week: number,
  random: RandomFn,
  traits: PersonCalendarTraits,
) {
  COMMON_EVENT_BLOCKS.forEach((block) => {
    if (!blockActiveThisWeek(block, week)) return;
    if (block.repeatEachDay) {
      block.days.forEach((day) => {
        const shiftedDay = shiftDay(day, traits.weeklyDayShift);
        addScheduleItem(schedule, block, person, random, traits, false, shiftedDay);
      });
      return;
    }
    addScheduleItem(schedule, block, person, random, traits);
  });
}

/** PM 등: 평일마다 파편화된 짧은 1:1 슬롯 추가 */
function injectFragmentedOneOnOnes(
  schedule: DraftScheduleItem[],
  person: MockPerson,
  week: number,
  random: RandomFn,
  traits: PersonCalendarTraits,
  range: [number, number],
) {
  const oneOnOneBlock: ScheduleBlock = {
    id: "fragmented-1on1",
    category: "oneOnOne",
    days: [0, 1, 2, 3, 4],
    starts: [14.5, 15.25, 16, 16.75],
    durations: [30],
    titles: ["1:1"],
    titleMode: "oneOnOne",
    skipJitter: true,
  };

  for (let day = 0; day < 5; day += 1) {
    const shiftedDay = shiftDay(day, traits.weeklyDayShift);
    const count = Math.min(range[0] + Math.floor(random() * (range[1] - range[0] + 1)), 2);
    let placed = 0;
    for (const start of oneOnOneBlock.starts) {
      if (placed >= count) break;
      if (addScheduleItem(schedule, oneOnOneBlock, person, random, traits, false, shiftedDay, start)) {
        placed += 1;
      }
    }
  }
}

function fulfillMinPerWeek(
  schedule: DraftScheduleItem[],
  pools: ScheduleBlock[],
  person: MockPerson,
  week: number,
  random: RandomFn,
  traits: PersonCalendarTraits,
) {
  pools.filter((block) => block.minPerWeek).forEach((block) => {
    if (!blockActiveThisWeek(block, week)) return;
    const current = schedule.filter((item) => item.category === block.category).length;
    const need = (block.minPerWeek ?? 0) - current;
    for (let i = 0; i < need && i < 20; i += 1) {
      addScheduleItem(schedule, block, person, random, traits);
    }
  });
}

/** 1주치 더미 일정 — person seed + week seed로 변동성 확보 */
export function buildWeekSchedule(person: MockPerson, week: number, traits?: PersonCalendarTraits): DraftScheduleItem[] {
  const template = getRoleTemplate(person.role);
  if (!template) return [];

  const personTraits = traits ?? derivePersonTraits(person);
  const random = seededRandom(hashString(`${person.id}|${person.name}|${week}|v3`));
  const weekMod = WEEK_COUNT_MODIFIERS[week] ?? WEEK_COUNT_MODIFIERS[0];
  const schedule: DraftScheduleItem[] = [];

  injectCommonEvents(schedule, person, week, random, personTraits);

  template.anchors.forEach((anchor) => {
    if (!blockActiveThisWeek(anchor, week)) return;
    if (anchor.repeatEachDay) {
      anchor.days.forEach((day) => {
        const shiftedDay = shiftDay(day, personTraits.weeklyDayShift);
        addScheduleItem(schedule, anchor, person, random, personTraits, false, shiftedDay);
      });
      return;
    }
    addScheduleItem(schedule, anchor, person, random, personTraits);
  });

  const [minCount, maxCount] = template.weeklyRange;
  const scaledMin = Math.max(5, Math.round(minCount * weekMod.countScale * VOLUME_SCALE) + personTraits.meetingCountBias);
  const scaledMax = Math.max(scaledMin, Math.round(maxCount * weekMod.countScale * VOLUME_SCALE) + personTraits.meetingCountBias);
  const target = scaledMin + Math.floor(random() * (scaledMax - scaledMin + 1));

  let guard = 0;
  while (schedule.length < target && guard < 200) {
    guard += 1;
    const block = pickWeightedBlock(template.pools, random, personTraits);
    if (!blockActiveThisWeek(block, week)) continue;
    addScheduleItem(schedule, block, person, random, personTraits);
  }

  fulfillMinPerWeek(schedule, template.pools, person, week, random, personTraits);

  if (template.fragmentedOneOnOnePerDay) {
    const [lo, hi] = template.fragmentedOneOnOnePerDay;
    injectFragmentedOneOnOnes(schedule, person, week, random, personTraits, [lo, hi]);
  }

  const focusChance = Math.min(
    0.95,
    template.focusChance + weekMod.focusBoost + personTraits.focusAffinity * 0.18,
  );
  if (random() < focusChance && !schedule.some((item) => item.type === "focus")) {
    const focusPools = template.pools.filter((pool) => pool.category === "focus" && blockActiveThisWeek(pool, week));
    if (focusPools.length) addScheduleItem(schedule, pickWithRandom(focusPools, random), person, random, personTraits);
  }

  if (random() < personTraits.lunchMeetingChance) {
    addScheduleItem(
      schedule,
      {
        id: "extra-lunch",
        category: "lunch",
        days: [0, 1, 2, 3, 4],
        starts: lunchSlotStarts(),
        durations: [30, Math.min(60, lunchWindowDurationMinutes())],
        titles: ["점심먹어요🍓", "조별 랜덤런치!", "런치 해요 🍚"],
        type: "lunch",
      },
      person,
      random,
      personTraits,
    );
  }

  if (random() < personTraits.personalChance) {
    addScheduleItem(
      schedule,
      {
        id: "extra-personal",
        category: "personal",
        days: [0, 1, 2, 3, 4],
        starts: [16, 16.5, 17],
        durations: [30, 60],
        titles: ["개인 일정", "개인 운동", "바쁨"],
        type: "personal",
      },
      person,
      random,
      personTraits,
    );
  }

  if (person.role === "Business Development Manager" && random() < personTraits.externalAffinity * 0.5) {
    const externalPools = template.pools.filter((pool) => pool.category === "external" && blockActiveThisWeek(pool, week));
    if (externalPools.length) addScheduleItem(schedule, pickWithRandom(externalPools, random), person, random, personTraits);
  }

  return dedupeSchedule(
    schedule
      .map((item) => sanitizeScheduleItem(item))
      .filter((item): item is DraftScheduleItem => item != null)
      .sort((a, b) => a.day - b.day || a.start - b.start),
  );
}

function dedupeSchedule(schedule: DraftScheduleItem[]) {
  const seen = new Set<string>();
  return schedule.filter((item) => {
    const key = `${item.day}|${item.start.toFixed(3)}|${item.duration}|${item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatLocalDateTime(d: Date) {
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}:00`;
}

function makeDateTime(baseMonday: Date, weekOffset: number, day: number, hour: number) {
  const snappedHour = snapStartHour(
    Math.max(generatorBounds.earliestEventStart, Math.min(generatorBounds.bizEnd, hour)),
  );
  const d = new Date(baseMonday);
  d.setDate(d.getDate() + weekOffset * 7 + day);
  d.setHours(Math.floor(snappedHour), Math.round((snappedHour % 1) * 60), 0, 0);
  return d;
}

/** 구성원 3주치 일정 — 주차·개인 seed마다 다른 패턴 */
export function generateRoleEventsForPerson(
  person: MockPerson,
  companySettings: CompanyScheduleSettings = DEFAULT_COMPANY_SETTINGS,
): GeneratedCalendarEvent[] {
  configureEventGenerator(companySettings);
  const traits = derivePersonTraits(person);
  const events: GeneratedCalendarEvent[] = [];
  const baseMonday = MOCK_BASE_MONDAY;

  for (let week = 0; week < MOCK_WEEK_COUNT; week += 1) {
    const schedule = buildWeekSchedule(person, week, traits);
    schedule.forEach((item, index) => {
      const start = makeDateTime(baseMonday, week, item.day, item.start);
      const end = new Date(start.getTime() + snapDurationMinutes(item.duration) * 60000);
      events.push({
        id: `role-${person.id}-w${week}-${index}-${hashString(`${item.title}-${item.start}`) % 100000}`,
        title: item.title,
        start: formatLocalDateTime(start),
        end: formatLocalDateTime(end),
        visibility: "public",
        type: item.type,
        movable: item.movable,
        roleDemo: true,
      });
    });
  }

  return events;
}

export function generateInitialEvents(
  people: MockPerson[],
  companySettings: CompanyScheduleSettings = DEFAULT_COMPANY_SETTINGS,
) {
  configureEventGenerator(companySettings);
  return Object.fromEntries(people.map((person) => [person.id, generateRoleEventsForPerson(person)]));
}

function hasTimeOverlap(events: GeneratedCalendarEvent[], start: string, end: string) {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  return events.some((ev) => {
    const evStart = new Date(ev.start).getTime();
    const evEnd = new Date(ev.end).getTime();
    return startMs < evEnd && endMs > evStart;
  });
}

function pickRoomForPerson(person: MockPerson, rooms: DemoRoom[], seed: number): DemoRoom {
  const sameTower = rooms.filter((r) => r.tower === person.tower);
  const pool = sameTower.length > 0 ? sameTower : rooms;
  const sameFloor = pool.filter((r) => r.floor === person.floor);
  const candidates = sameFloor.length > 0 && seed % 10 < 7 ? sameFloor : pool;
  return candidates[seed % candidates.length] ?? rooms[0];
}

function assignDemoRooms(
  eventsByPerson: Record<string, GeneratedCalendarEvent[]>,
  people: MockPerson[],
  rooms: DemoRoom[],
) {
  if (rooms.length === 0) return;

  const personById = Object.fromEntries(people.map((p) => [p.id, p]));
  for (const [personId, personEvents] of Object.entries(eventsByPerson)) {
    const person = personById[personId];
    if (!person) continue;

    for (const ev of personEvents) {
      if (ev.type !== "meeting" || ev.room) continue;
      const roll = hashString(`${ev.id}:room`) % 100;
      if (roll >= 85) continue;
      ev.room = pickRoomForPerson(person, rooms, hashString(`${ev.id}:${personId}`) % 1000);
    }
  }
}

/** 확정 미팅(groupId) + 참석자 메타 — 1:1은 solo movable, 팀 미팅은 다중 참석자 */
function injectDemoGroupMeetings(
  eventsByPerson: Record<string, GeneratedCalendarEvent[]>,
  people: MockPerson[],
  meId: string,
  rooms: DemoRoom[],
): { events: Record<string, GeneratedCalendarEvent[]>; rsvp: Record<string, "yes" | "no"> } {
  const rsvp: Record<string, "yes" | "no"> = {};
  const personById = Object.fromEntries(people.map((p) => [p.id, p]));
  let groupIndex = 0;

  const applyMeetingMeta = (event: GeneratedCalendarEvent, attendeeIds: string[]) => {
    const host = personById[attendeeIds[0]];
    const room = event.room ?? (host && rooms.length > 0
      ? pickRoomForPerson(host, rooms, hashString(`${event.groupId}:room`) % 1000)
      : undefined);
    if (room) event.room = room;
    event.meetingMeta = {
      requiredIds: attendeeIds,
      optionalIds: [],
      room,
      checkpoints: [],
      start: event.start,
      end: event.end,
    };
  };

  const isOneOnOneMeeting = (title: string) => title.includes("1:1");

  const isAllHandsTitle = (title: string) => /올핸즈|all-?hands/i.test(title);

  const isDailyScrumTitle = (title: string) => (
    /팀 데일리|데일리\s*스크럼|데일리스크럼|daily scrum|데일리 스탠드업|daily stand/i.test(title)
  );

  const isTeamMeetingTitle = (title: string) => (
    /스크럼|Daily|싱크|플래닝|회의|리뷰|킥오프|얼라인|미팅|캘리브레이션/i.test(title)
    && !isOneOnOneMeeting(title)
    && !isAllHandsTitle(title)
  );

  const teammatesFor = (personId: string, count: number) => {
    const person = personById[personId];
    if (!person) return [];
    return people
      .filter((p) => p.id !== personId && p.team === person.team)
      .map((p) => ({ id: p.id, sort: hashString(`${personId}:${p.id}`) % 1000 }))
      .sort((a, b) => a.sort - b.sort)
      .slice(0, count)
      .map((item) => item.id);
  };

  const companyAttendeesFor = (hostId: string, totalCount: number, seed: string) => {
    const mates = people
      .filter((p) => p.id !== hostId)
      .map((p) => ({ id: p.id, sort: hashString(`${seed}:${p.id}`) % 1000 }))
      .sort((a, b) => a.sort - b.sort)
      .slice(0, Math.max(0, totalCount - 1))
      .map((item) => item.id);
    return [hostId, ...mates];
  };

  const availableMatesFor = (personId: string, ev: GeneratedCalendarEvent, count: number) =>
    teammatesFor(personId, count).filter((mateId) => {
      const mateEvents = eventsByPerson[mateId] ?? [];
      return !hasTimeOverlap(mateEvents, ev.start, ev.end);
    });

  const attachGroupMeeting = (
    hostId: string,
    sourceEvent: GeneratedCalendarEvent,
    mateIds: string[],
  ) => {
    const groupId = `demo-mtg-${groupIndex++}`;
    sourceEvent.groupId = groupId;
    const attendeeIds = [hostId, ...mateIds];
    applyMeetingMeta(sourceEvent, attendeeIds);

    for (const mateId of mateIds) {
      const mateEvents = eventsByPerson[mateId] ?? [];
      if (hasTimeOverlap(mateEvents, sourceEvent.start, sourceEvent.end)) continue;
      eventsByPerson[mateId] = [
        ...mateEvents,
        {
          ...sourceEvent,
          id: `${groupId}-${mateId}`,
          groupId,
          roleDemo: true,
        },
      ];
      const mateEv = eventsByPerson[mateId].find((item) => item.groupId === groupId);
      if (mateEv) applyMeetingMeta(mateEv, attendeeIds);

      const mateRsvpRoll = hashString(`${groupId}:${mateId}`) % 100;
      if (mateRsvpRoll >= 78) {
        rsvp[`${groupId}:${mateId}`] = mateRsvpRoll >= 92 ? "no" : "yes";
      }
    }

    const hostRsvpRoll = hashString(`${groupId}:${hostId}`) % 100;
    if (hostRsvpRoll >= 75) {
      rsvp[`${groupId}:${hostId}`] = hostRsvpRoll >= 90 ? "no" : "yes";
    }
  };

  const attachTeamMeeting = (
    hostId: string,
    sourceEvent: GeneratedCalendarEvent,
    preferredMateCount: number,
    options: { allowSyntheticMeta?: boolean } = {},
  ) => {
    const mates = availableMatesFor(hostId, sourceEvent, preferredMateCount);
    if (mates.length > 0) {
      attachGroupMeeting(hostId, sourceEvent, mates);
      return;
    }
    if (!options.allowSyntheticMeta) return;
    const syntheticMates = teammatesFor(hostId, preferredMateCount);
    if (syntheticMates.length >= 2) {
      applyMeetingMeta(sourceEvent, [hostId, ...syntheticMates]);
    }
  };

  // 1) 1:1 → solo 참석자 메타 + movable
  for (const [personId, personEvents] of Object.entries(eventsByPerson)) {
    for (const ev of personEvents) {
      if (ev.type !== "meeting" || ev.groupId) continue;
      if (!isOneOnOneMeeting(ev.title)) continue;
      ev.movable = true;
      applyMeetingMeta(ev, [personId]);
    }
  }

  // 2) 올핸즈 · 데일리 · 팀 미팅 → 참석자 메타 보강
  for (const [personId, personEvents] of Object.entries(eventsByPerson)) {
    for (const ev of personEvents) {
      if (ev.type !== "meeting" || ev.groupId || ev.meetingMeta) continue;

      if (isAllHandsTitle(ev.title)) {
        const totalCount = 10 + (hashString(`${ev.id}:allhands`) % 6);
        const attendeeIds = companyAttendeesFor(personId, totalCount, ev.id);
        const mates = attendeeIds.filter((id) => id !== personId);
        const attachableMates = mates.filter((mateId) => {
          const mateEvents = eventsByPerson[mateId] ?? [];
          return !hasTimeOverlap(mateEvents, ev.start, ev.end);
        });
        if (attachableMates.length >= 4) {
          attachGroupMeeting(personId, ev, attachableMates);
        } else {
          applyMeetingMeta(ev, attendeeIds);
        }
        continue;
      }

      if (isDailyScrumTitle(ev.title)) {
        attachTeamMeeting(personId, ev, 3, { allowSyntheticMeta: true });
        continue;
      }

      if (!isTeamMeetingTitle(ev.title)) continue;

      const roll = hashString(`${ev.id}:${ev.start}:group`) % 100;
      if (roll >= 40) continue;

      attachTeamMeeting(personId, ev, 2 + (roll % 2), { allowSyntheticMeta: true });
    }
  }

  // 2b) 팀 성격인데 참석자 메타가 없는 미팅 보정
  for (const [personId, personEvents] of Object.entries(eventsByPerson)) {
    for (const ev of personEvents) {
      if (ev.type !== "meeting" || ev.meetingMeta) continue;
      if (isAllHandsTitle(ev.title)) {
        applyMeetingMeta(ev, companyAttendeesFor(personId, 12, ev.id));
        continue;
      }
      if (isDailyScrumTitle(ev.title)) {
        const mates = teammatesFor(personId, 3);
        if (mates.length >= 2) applyMeetingMeta(ev, [personId, ...mates.slice(0, 3)]);
        continue;
      }
      if (isTeamMeetingTitle(ev.title)) {
        const mates = teammatesFor(personId, 2 + (hashString(`${ev.id}:fix`) % 2));
        if (mates.length >= 2) applyMeetingMeta(ev, [personId, ...mates]);
      }
    }
  }

  // 3) 데모 주 고정 팀 미팅 (다음 주 월~수)
  const anchorMeetings = [
    {
      title: "사업실 주간 싱크",
      start: "2026-07-14T14:00:00",
      end: "2026-07-14T15:00:00",
      team: "사업실",
      hosts: ["yc", "yj", "sm", "ky"],
    },
    {
      title: "플랫폼팀 스프린트 리뷰",
      start: "2026-07-15T15:00:00",
      end: "2026-07-15T16:00:00",
      team: "플랫폼팀",
      hosts: ["dw", "jh", "hr"],
    },
    {
      title: "그로스팀 KPI 리뷰",
      start: "2026-07-16T11:00:00",
      end: "2026-07-16T12:00:00",
      team: "그로스팀",
      hosts: ["kj", "ys"],
    },
  ];

  for (const anchor of anchorMeetings) {
    const attendeeIds = anchor.hosts.filter((id) => personById[id]);
    if (attendeeIds.length < 2) continue;

    const groupId = `demo-mtg-${groupIndex++}`;
    for (const personId of attendeeIds) {
      const personEvents = eventsByPerson[personId] ?? [];
      if (hasTimeOverlap(personEvents, anchor.start, anchor.end)) continue;

      const ev: GeneratedCalendarEvent = {
        id: `${groupId}-${personId}`,
        title: anchor.title,
        start: anchor.start,
        end: anchor.end,
        visibility: "public",
        type: "meeting",
        movable: false,
        groupId,
        roleDemo: true,
      };
      eventsByPerson[personId] = [...personEvents, ev];
      applyMeetingMeta(ev, attendeeIds);
    }
  }

  return { events: eventsByPerson, rsvp };
}

export function generateInitialEventsAndRsvp(
  people: MockPerson[],
  companySettings: CompanyScheduleSettings = DEFAULT_COMPANY_SETTINGS,
  meId = "yj",
  rooms: DemoRoom[] = [],
) {
  const events = generateInitialEvents(people, companySettings);
  assignDemoRooms(events, people, rooms);
  return injectDemoGroupMeetings(events, people, meId, rooms);
}
