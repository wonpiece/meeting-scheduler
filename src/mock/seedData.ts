import { generateInitialEvents } from "./eventGenerator";
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
  { id: "yj", name: "김지원", team: "사업실", role: "Product Designer", tower: "미르타워", floor: 5, avatarBg: "#e6ebfb", avatarText: "#48429f" },
  { id: "ky", name: "강유정", team: "사업실", role: "Backend", tower: "미르타워", floor: 6, avatarBg: "#fceded", avatarText: "#b62c2c" },
  { id: "sm", name: "신미르", team: "사업실", role: "Frontend", tower: "미르타워", floor: 6, avatarBg: "#e3f4f0", avatarText: "#0f766e" },
  { id: "yc", name: "이예찬", team: "사업실", role: "Product Manager", tower: "미르타워", floor: 5, avatarBg: "#fbf3d1", avatarText: "#ae5b1c" },
  { id: "kj", name: "김정민", team: "그로스팀", role: "Business Development Manager", tower: "solar타워", floor: 3, avatarBg: "#eef8d9", avatarText: "#4d7c0f" },
  { id: "ys", name: "염은솔", team: "그로스팀", role: "Operations Manager", tower: "solar타워", floor: 3, avatarBg: "#f3ebfc", avatarText: "#7f31c2" },
];

export const COLOR_PALETTE = [
  { avatarBg: "#e6ebfb", avatarText: "#48429f" },
  { avatarBg: "#fceded", avatarText: "#b62c2c" },
  { avatarBg: "#e3f4f0", avatarText: "#0f766e" },
  { avatarBg: "#fbf3d1", avatarText: "#ae5b1c" },
  { avatarBg: "#eef8d9", avatarText: "#4d7c0f" },
  { avatarBg: "#f3ebfc", avatarText: "#7f31c2" },
  { avatarBg: "#e0f2fe", avatarText: "#0369a1" },
  { avatarBg: "#fee2e2", avatarText: "#b91c1c" },
];

export const DEFAULT_COMPANY_SETTINGS = {
  lunchStart: 13,
  lunchEnd: 14.25,
  commuteIn: 9,
  commuteOut: 19,
};

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

export const INITIAL_EVENTS = generateInitialEvents(PEOPLE_BASE);

export const WEEK_DAYS = ["2026-07-13", "2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17"];
