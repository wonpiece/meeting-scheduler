import { generateInitialEvents } from "./eventGenerator";
import { DEFAULT_COMPANY_SETTINGS } from "./companyDefaults";
import type { MockPerson } from "./types";

export const ME_ID = "yj";

export const TEAMS_BASE = ["사업실", "플랫폼팀", "그로스팀", "경영지원실"];
export const TOWERS = ["미르타워", "solar타워"];

export const JOBS_BASE = [
  { id: "pm", name: "Product Manager", short: "PM" },
  { id: "pd", name: "Product Designer", short: "PD" },
  { id: "om", name: "Operations Manager", short: "OM" },
  { id: "fe", name: "Frontend", short: "FE" },
  { id: "be", name: "Backend", short: "BE" },
  { id: "bdm", name: "Business Development Manager", short: "BDM" },
];

export const PEOPLE_BASE: MockPerson[] = [
  { id: "yj", name: "김지원", team: "사업실", role: "Product Designer", tower: "미르타워", floor: 5, avatarBg: "#e6ebfb", avatarText: "#7d7abe" },
  { id: "ky", name: "강유정", team: "사업실", role: "Backend", tower: "미르타워", floor: 6, avatarBg: "#fceded", avatarText: "#cd6c6c" },
  { id: "sm", name: "신미르", team: "사업실", role: "Frontend", tower: "미르타워", floor: 6, avatarBg: "#e3f4f0", avatarText: "#56a099" },
  { id: "yc", name: "이예찬", team: "사업실", role: "Product Manager", tower: "미르타워", floor: 5, avatarBg: "#fbf3d1", avatarText: "#c88e58" },
  { id: "kj", name: "김정민", team: "그로스팀", role: "Business Development Manager", tower: "solar타워", floor: 3, avatarBg: "#eef8d9", avatarText: "#83a552" },
  { id: "ys", name: "염은솔", team: "그로스팀", role: "Operations Manager", tower: "solar타워", floor: 3, avatarBg: "#f3ebfc", avatarText: "#a66fd5" },
  { id: "jh", name: "박준호", team: "플랫폼팀", role: "Backend", tower: "미르타워", floor: 7, avatarBg: "#e0f2fe", avatarText: "#0369a1" },
  { id: "hr", name: "한소희", team: "플랫폼팀", role: "Frontend", tower: "미르타워", floor: 7, avatarBg: "#fce7f3", avatarText: "#be185d" },
  { id: "dw", name: "박도윤", team: "플랫폼팀", role: "Product Manager", tower: "미르타워", floor: 7, avatarBg: "#fef3c7", avatarText: "#b45309" },
  { id: "es", name: "윤은서", team: "경영지원실", role: "Operations Manager", tower: "solar타워", floor: 2, avatarBg: "#ede9fe", avatarText: "#6d28d9" },
];

export const COLOR_PALETTE = [
  { avatarBg: "#e6ebfb", avatarText: "#7d7abe" },
  { avatarBg: "#fceded", avatarText: "#cd6c6c" },
  { avatarBg: "#e3f4f0", avatarText: "#56a099" },
  { avatarBg: "#fbf3d1", avatarText: "#c88e58" },
  { avatarBg: "#eef8d9", avatarText: "#83a552" },
  { avatarBg: "#f3ebfc", avatarText: "#a66fd5" },
  { avatarBg: "#e0f2fe", avatarText: "#7d7abe" },
  { avatarBg: "#fee2e2", avatarText: "#cd6c6c" },
];

export { DEFAULT_COMPANY_SETTINGS } from "./companyDefaults";

export const ROOMS_BASE = [
  { id: "r1", name: "5층 포커스룸", tower: "미르타워", floor: 5, capacity: 8 },
  { id: "r2", name: "6층 라운지룸", tower: "미르타워", floor: 6, capacity: 6 },
  { id: "r3", name: "7층 세미나룸", tower: "미르타워", floor: 7, capacity: 10 },
  { id: "r4", name: "3층 미팅룸", tower: "solar타워", floor: 3, capacity: 6 },
];

export const ROOM_EVENTS = {
  r1: [],
  r2: [
    { id: "re2", start: "2026-07-15T14:30:00", end: "2026-07-15T16:30:00" },
    { id: "re3", start: "2026-07-16T09:00:00", end: "2026-07-16T10:00:00" },
  ],
  r3: [{ id: "re4", start: "2026-07-14T13:00:00", end: "2026-07-14T15:00:00" }],
};

export const INITIAL_EVENTS = generateInitialEvents(PEOPLE_BASE, DEFAULT_COMPANY_SETTINGS);

export const WEEK_DAYS = ["2026-07-13", "2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17"];
