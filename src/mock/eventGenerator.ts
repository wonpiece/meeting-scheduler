import { buildOneOnOneTitle, personFirstName, pickPeerName } from "./anonymizedNames";
import { COMMON_EVENT_BLOCKS } from "./commonEvents";
import { getRoleTemplate } from "./roleTemplates";
import type {
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

const BIZ_START = 9;
const BIZ_END = 19.5;

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
  return items.some((item) => item.day === day && start < item.start + item.duration / 60 && item.start < end);
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
  if (mode === "designPrefix") return `[D] ${base}`;
  if (mode === "productPrefix") return `[P] ${base}`;
  return base;
}

function applyPersonStartOffset(
  start: number,
  traits: PersonCalendarTraits,
  random: RandomFn,
  duration: number,
  skipJitter: boolean,
) {
  if (skipJitter) return Math.max(BIZ_START, Math.min(BIZ_END - duration / 60, start + traits.startOffset * 0.3));
  const jitter = pickWithRandom([-0.5, 0, 0, 0.25, 0.5], random);
  const morningAdjust = traits.morningPerson ? -0.25 : 0.25;
  const adjusted = start + traits.startOffset + jitter + morningAdjust;
  return Math.max(BIZ_START, Math.min(BIZ_END - duration / 60, adjusted));
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
  if (block.category === "daily" && !block.skipJitter) return traits.dailyHour;
  if (block.starts.length === 1) return block.starts[0];
  return pickWithRandom(block.starts, random);
}

function pickPersonDuration(block: ScheduleBlock, random: RandomFn, traits: PersonCalendarTraits) {
  const durations = block.durations.map((d) => Math.max(15, d + traits.durationBias));
  return pickWithRandom(durations, random);
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
    dailyHour: 9 + Math.floor(random() * 4) * 0.5,
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
  const start = applyPersonStartOffset(rawStart, traits, random, duration, block.skipJitter ?? false);

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
    starts: [13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17],
    durations: [25, 30],
    titles: ["1:1"],
    titleMode: "oneOnOne",
  };

  for (let day = 0; day < 5; day += 1) {
    const shiftedDay = shiftDay(day, traits.weeklyDayShift);
    const count = range[0] + Math.floor(random() * (range[1] - range[0] + 1));
    let placed = 0;
    let guard = 0;
    while (placed < count && guard < 30) {
      guard += 1;
      const start = pickWithRandom(oneOnOneBlock.starts, random);
      if (
        addScheduleItem(schedule, oneOnOneBlock, person, random, traits, false, shiftedDay, start)
      ) placed += 1;
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
  const scaledMin = Math.max(5, Math.round(minCount * weekMod.countScale) + personTraits.meetingCountBias);
  const scaledMax = Math.max(scaledMin, Math.round(maxCount * weekMod.countScale) + personTraits.meetingCountBias);
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
    const boost = weekMod.oneOnOneBoost ?? 0;
    const [lo, hi] = template.fragmentedOneOnOnePerDay;
    const adjLo = Math.max(1, lo + Math.round(boost * 2));
    const adjHi = Math.max(adjLo, hi + Math.round(boost * 2));
    injectFragmentedOneOnOnes(schedule, person, week, random, personTraits, [adjLo, adjHi]);
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
        starts: [12, 12.5, 13],
        durations: [60, 90],
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
        starts: [17.5, 18, 18.5],
        durations: [60, 90],
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

  return schedule.sort((a, b) => a.day - b.day || a.start - b.start);
}

function formatLocalDateTime(d: Date) {
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}:00`;
}

function makeDateTime(baseMonday: Date, weekOffset: number, day: number, hour: number) {
  const d = new Date(baseMonday);
  d.setDate(d.getDate() + weekOffset * 7 + day);
  d.setHours(Math.floor(hour), Math.round((hour % 1) * 60), 0, 0);
  return d;
}

/** 구성원 3주치 일정 — 주차·개인 seed마다 다른 패턴 */
export function generateRoleEventsForPerson(person: MockPerson): GeneratedCalendarEvent[] {
  const traits = derivePersonTraits(person);
  const events: GeneratedCalendarEvent[] = [];
  const baseMonday = MOCK_BASE_MONDAY;

  for (let week = 0; week < MOCK_WEEK_COUNT; week += 1) {
    const schedule = buildWeekSchedule(person, week, traits);
    schedule.forEach((item, index) => {
      const start = makeDateTime(baseMonday, week, item.day, item.start);
      const end = new Date(start.getTime() + item.duration * 60000);
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

export function generateInitialEvents(people: MockPerson[]) {
  return Object.fromEntries(people.map((person) => [person.id, generateRoleEventsForPerson(person)]));
}
