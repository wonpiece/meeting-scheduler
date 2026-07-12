import React, { useState, useMemo } from "react";
import arrowLeftIcon from "./assets/icons/icon-arrow-left-small-mono.svg";
import arrowRightIcon from "./assets/icons/icon-arrow-right-small-mono.svg";
import closeIcon from "./assets/icons/icon-x-mono.svg";
import plusIcon from "./assets/icons/icon-plus-mono.svg";
import searchIcon from "./assets/icons/icon-search-mono.svg";
import checkIcon from "./assets/icons/icon-check-mono.svg";
import calendarIcon from "./assets/icons/icon-calendar-check-mono.svg";
import clockIcon from "./assets/icons/icon-clock-mono.svg";
import pinIcon from "./assets/icons/icon-pin-location-mono.svg";
import binIcon from "./assets/icons/icon-bin-mono.svg";
import circleIcon from "./assets/icons/icon-circle-empty-mono.svg";
import checkCircleIcon from "./assets/icons/icon-check-circle-line-mono.svg";
import pencilIcon from "./assets/icons/icon-pencil-mono.svg";
import settingIcon from "./assets/icons/icon-setting-mono.svg";

const ICONS = {
  ChevronLeft: arrowLeftIcon, ChevronRight: arrowRightIcon, X: closeIcon, Plus: plusIcon, Search: searchIcon, Check: checkIcon,
  CalendarCheck2: calendarIcon, Clock: clockIcon, MapPin: pinIcon, Trash2: binIcon, Circle: circleIcon,
  CheckCircle2: checkCircleIcon, Pencil: pencilIcon, Settings: settingIcon,
};
function SvgIcon({ name, size = 24, color = "currentColor", style, ...props }) {
  return <span aria-hidden="true" {...props} style={{ width: size, height: size, display: "inline-block", flexShrink: 0, backgroundColor: color, WebkitMask: `url(${ICONS[name]}) center / contain no-repeat`, mask: `url(${ICONS[name]}) center / contain no-repeat`, ...style }} />;
}
const ChevronLeft = (p) => <SvgIcon name="ChevronLeft" {...p} />;
const ChevronRight = (p) => <SvgIcon name="ChevronRight" {...p} />;
const X = (p) => <SvgIcon name="X" {...p} />;
const Plus = (p) => <SvgIcon name="Plus" {...p} />;
const Search = (p) => <SvgIcon name="Search" {...p} />;
const Check = (p) => <SvgIcon name="Check" {...p} />;
const CalendarCheck2 = (p) => <SvgIcon name="CalendarCheck2" {...p} />;
const Clock = (p) => <SvgIcon name="Clock" {...p} />;
const MapPin = (p) => <SvgIcon name="MapPin" {...p} />;
const Trash2 = (p) => <SvgIcon name="Trash2" {...p} />;
const Circle = (p) => <SvgIcon name="Circle" {...p} />;
const CheckCircle2 = (p) => <SvgIcon name="CheckCircle2" {...p} />;
const Pencil = (p) => <SvgIcon name="Pencil" {...p} />;
const Settings = (p) => <SvgIcon name="Settings" {...p} />;

/* ============================================================
   DESIGN TOKENS (Figma MCP로 추출한 실제 값)
   ============================================================ */

const C = {
  blue: "#3182f6",
  blue200: "#e7f0fe",
  ink900: "#323742",
  ink800: "#4c525d",
  ink600: "#6b7280",
  ink500: "#8d949f",
  ink400: "#b9bdc5",
  black: "#111827",
  border: "#e5e7eb",
  bg2: "#eff1f3",
  white: "#ffffff",
  confirmed: "#4b44ac",
  eventBg: "#e6ebfb",
};

const FONT = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";

/* ============================================================
   1. DATA MODEL — Figma 디자인의 실제 인물명/아바타 색상 그대로 사용
   ============================================================ */

const TEAMS_BASE = ["사업실", "플랫폼팀", "그로스팀", "경영지원실"];
const TOWERS = ["미르타워", "solar타워"];

const PEOPLE_BASE = [
  { id: "yj", name: "김지원", team: "사업실", role: "프로덕트 디자이너", tower: "미르타워", floor: 5, avatarBg: "#e6ebfb", avatarText: "#48429f" },
  { id: "ky", name: "강유정", team: "사업실", role: "백엔드 엔지니어", tower: "미르타워", floor: 6, avatarBg: "#fceded", avatarText: "#b62c2c" },
  { id: "sm", name: "신미르", team: "사업실", role: "프론트엔드 엔지니어", tower: "미르타워", floor: 6, avatarBg: "#e3f4f0", avatarText: "#0f766e" },
  { id: "yc", name: "이예찬", team: "사업실", role: "프로덕트 매니저", tower: "미르타워", floor: 5, avatarBg: "#fbf3d1", avatarText: "#ae5b1c" },
  { id: "kj", name: "김정민", team: "그로스팀", role: "Business Developer", tower: "solar타워", floor: 3, avatarBg: "#eef8d9", avatarText: "#4d7c0f" },
  { id: "ys", name: "염은솔", team: "그로스팀", role: "오퍼레이션 매니저", tower: "solar타워", floor: 3, avatarBg: "#f3ebfc", avatarText: "#7f31c2" },
];
const ME_ID = "yj";
const DEFAULT_COMPANY_SETTINGS = { lunchStart: 13, lunchEnd: 14.25, commuteIn: 9, commuteOut: 19 };
const COLOR_PALETTE = [
  { avatarBg: "#e6ebfb", avatarText: "#48429f" }, { avatarBg: "#fceded", avatarText: "#b62c2c" },
  { avatarBg: "#e3f4f0", avatarText: "#0f766e" }, { avatarBg: "#fbf3d1", avatarText: "#ae5b1c" },
  { avatarBg: "#eef8d9", avatarText: "#4d7c0f" }, { avatarBg: "#f3ebfc", avatarText: "#7f31c2" },
  { avatarBg: "#e0f2fe", avatarText: "#0369a1" }, { avatarBg: "#fee2e2", avatarText: "#b91c1c" },
];

const INITIAL_EVENTS = {
  yj: [
    { id: "e1", title: "위클리 플래닝", start: "2026-07-13T10:00:00", end: "2026-07-13T11:00:00", visibility: "public", type: "meeting", movable: false },
    { id: "e1b", title: "팀 리더 싱크", start: "2026-07-13T13:00:00", end: "2026-07-13T14:00:00", visibility: "public", type: "meeting", movable: false },
    { id: "e1c", title: "채용 인터뷰", start: "2026-07-13T16:00:00", end: "2026-07-13T17:00:00", visibility: "private", type: "meeting", movable: false },
    { id: "e2", title: "점심", start: "2026-07-14T12:00:00", end: "2026-07-14T13:00:00", visibility: "private", type: "lunch", movable: false },
    { id: "e3", title: "임원 보고", start: "2026-07-16T09:00:00", end: "2026-07-16T09:30:00", visibility: "public", type: "meeting", movable: false },
  ],
  ky: [
    { id: "e4a", title: "스탠드업", start: "2026-07-15T09:00:00", end: "2026-07-15T09:30:00", visibility: "public", type: "meeting", movable: false },
    { id: "e4b", title: "코드 리뷰", start: "2026-07-15T10:00:00", end: "2026-07-15T10:30:00", visibility: "public", type: "meeting", movable: false },
    { id: "e4c", title: "PR 논의", start: "2026-07-15T13:00:00", end: "2026-07-15T13:30:00", visibility: "public", type: "meeting", movable: false },
    { id: "e5", title: "집중 근무", start: "2026-07-14T11:00:00", end: "2026-07-14T13:00:00", visibility: "public", type: "focus", movable: true },
    { id: "e6", title: "배포 점검", start: "2026-07-16T16:30:00", end: "2026-07-16T17:30:00", visibility: "public", type: "meeting", movable: false },
  ],
  sm: [
    { id: "e7", title: "디자인 QA", start: "2026-07-13T15:30:00", end: "2026-07-13T16:30:00", visibility: "public", type: "meeting", movable: false },
    { id: "e8", title: "개인 일정", start: "2026-07-17T09:00:00", end: "2026-07-17T10:00:00", visibility: "private", type: "personal", movable: false },
  ],
  yc: [
    { id: "e9x", title: "스프린트 리뷰", start: "2026-07-15T14:00:00", end: "2026-07-15T15:00:00", visibility: "public", type: "meeting", movable: false },
    { id: "e9", title: "리서치 정리", start: "2026-07-14T09:00:00", end: "2026-07-14T10:30:00", visibility: "public", type: "focus", movable: true },
    { id: "e10", title: "타 팀 미팅", start: "2026-07-16T13:30:00", end: "2026-07-16T14:30:00", visibility: "public", type: "meeting", movable: false },
  ],
  kj: [
    { id: "e14", title: "파트너사 외근", start: "2026-07-15T09:00:00", end: "2026-07-15T18:00:00", visibility: "public", type: "external", movable: false },
    { id: "e15", title: "영업 미팅", start: "2026-07-16T10:00:00", end: "2026-07-16T11:00:00", visibility: "public", type: "meeting", movable: false },
  ],
  ys: [
    { id: "e11", title: "픽업 운영 점검", start: "2026-07-15T15:00:00", end: "2026-07-15T15:30:00", visibility: "public", type: "meeting", movable: false },
    { id: "e12", title: "운영 이슈 대응", start: "2026-07-14T10:00:00", end: "2026-07-14T11:30:00", visibility: "private", type: "meeting", movable: false },
    { id: "e13", title: "OOO", start: "2026-07-17T09:00:00", end: "2026-07-17T19:00:00", visibility: "public", type: "ooo", movable: false },
  ],
};

const ROOMS_BASE = [
  { id: "r1", name: "5층 포커스룸", tower: "미르타워", floor: 5, capacity: 8 },
  { id: "r2", name: "6층 라운지룸", tower: "미르타워", floor: 6, capacity: 6 },
  { id: "r3", name: "7층 세미나룸", tower: "미르타워", floor: 7, capacity: 10 },
  { id: "r4", name: "3층 미팅룸", tower: "solar타워", floor: 3, capacity: 6 },
];
const ROOM_EVENTS = {
  r1: [],
  r2: [
    { id: "re2", start: "2026-07-15T14:30:00", end: "2026-07-15T16:30:00" },
    { id: "re3", start: "2026-07-16T09:00:00", end: "2026-07-16T10:00:00" },
  ],
  r3: [{ id: "re4", start: "2026-07-14T13:00:00", end: "2026-07-14T15:00:00" }],
};

const PURPOSE_DEFAULT = "decision";
const TYPE_LABEL = { meeting: "미팅", focus: "집중 근무", personal: "개인 일정", external: "외근", ooo: "휴가/OOO", lunch: "점심" };
const WEEK_DAYS = ["2026-07-13", "2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17"];
const DAY_LABEL = ["월", "화", "수", "목", "금"];
const BIZ_START = 9;
const BIZ_END = 19;
const HOUR_HEIGHT = 72;

/* ============================================================
   2. DATE HELPERS
   ============================================================ */

const toDate = (s) => new Date(s);
const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;
const addMin = (date, min) => new Date(date.getTime() + min * 60000);
const pad2 = (n) => String(n).padStart(2, "0");
const toLocalISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
const TODAY_DATE = 12; // 2026-07-12 (오늘)
function decHourToKorean(h) {
  const totalMin = Math.round(h * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  const period = hh < 12 ? "오전" : "오후";
  const hh12 = hh % 12 === 0 ? 12 : hh % 12;
  return mm === 0 ? `${period} ${hh12}시` : `${period} ${hh12}시 ${mm}분`;
}
function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function dateOnlyStr(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
const fmtAmPm = (d) => {
  const h = d.getHours();
  const period = h < 12 ? "오전" : "오후";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${hh}시${d.getMinutes() ? ` ${d.getMinutes()}분` : ""}`;
};
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
const fmtDate = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY[d.getDay()]})`;

/* ============================================================
   3. SLOT GENERATION & CANDIDATE LOGIC (로직 동일, 이름만 새 id 사용)
   ============================================================ */

function generateSlots(request, companySettings) {
  const cs = companySettings || DEFAULT_COMPANY_SETTINGS;
  const bizStart = cs.commuteIn, bizEnd = cs.commuteOut;
  const slots = [];
  const rangeStart = toDate(request.dateRangeStart);
  const rangeEnd = toDate(request.dateRangeEnd);
  let cursor = new Date(rangeStart);
  cursor.setHours(Math.floor(bizStart), (bizStart % 1) * 60, 0, 0);
  const lastDay = new Date(rangeEnd);
  while (cursor <= lastDay) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      for (let h = bizStart; h < bizEnd; h += 0.5) {
        const slotStart = new Date(cursor);
        slotStart.setHours(Math.floor(h), (h % 1) * 60, 0, 0);
        const slotEnd = addMin(slotStart, request.durationMinutes);
        const slotEndHour = slotEnd.getHours() + slotEnd.getMinutes() / 60;
        if (slotEndHour <= bizEnd) slots.push({ start: slotStart, end: slotEnd });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(Math.floor(bizStart), (bizStart % 1) * 60, 0, 0);
  }
  return slots;
}

function getPersonStatus(personId, slotStart, slotEnd, events) {
  const personEvents = events[personId] || [];
  const conflicts = personEvents.filter((e) => overlaps(slotStart, slotEnd, toDate(e.start), toDate(e.end)));
  if (conflicts.length === 0) return { state: "available", conflicts: [] };
  const hardConflict = conflicts.find((e) => e.type === "external" || e.type === "ooo" || e.movable === false);
  const movableConflict = conflicts.find((e) => e.movable === true);
  if (hardConflict) return { state: "unavailable", conflicts, blocking: hardConflict };
  if (movableConflict) return { state: "movable_conflict", conflicts, blocking: movableConflict };
  return { state: "unavailable", conflicts, blocking: conflicts[0] };
}
function getAdjacentEvent(personId, slotStart, slotEnd, bufferMin, events) {
  const personEvents = events[personId] || [];
  const beforeWindowStart = addMin(slotStart, -bufferMin);
  const afterWindowEnd = addMin(slotEnd, bufferMin);
  return personEvents.find((e) => {
    const es = toDate(e.start), ee = toDate(e.end);
    return (ee <= slotStart && ee > beforeWindowStart) || (es >= slotEnd && es < afterWindowEnd);
  });
}
function getAvailableRooms(slotStart, slotEnd, attendeeCount, roomPool) {
  return (roomPool || ROOMS_BASE).filter((room) => {
    if (room.capacity < attendeeCount) return false;
    const roomEvents = ROOM_EVENTS[room.id] || [];
    return !roomEvents.some((e) => overlaps(slotStart, slotEnd, toDate(e.start), toDate(e.end)));
  });
}
function getCompanyBurden(slotStart, slotEnd, companySettings) {
  const startH = slotStart.getHours() + slotStart.getMinutes() / 60;
  const endH = slotEnd.getHours() + slotEnd.getMinutes() / 60;
  const cs = companySettings || DEFAULT_COMPANY_SETTINGS;
  return {
    duringLunch: startH < cs.lunchEnd && endH > cs.lunchStart, // 점심시간과 겹침
    justArrived: startH === cs.commuteIn, // 출근 직후 첫 슬롯
    beforeLeaving: endH === cs.commuteOut, // 퇴근 직전 마지막 슬롯
  };
}
function getDayMeetingCount(personId, date, events) {
  const personEvents = events[personId] || [];
  const dayKey = date.toDateString();
  return personEvents.filter((e) => e.type !== "lunch" && toDate(e.start).toDateString() === dayKey).length;
}

function pickBestRoom(availableRooms, requiredIds, optionalIds, people) {
  if (availableRooms.length === 0) return { room: undefined, crossTeam: false };
  const organizer = people.find((p) => p.id === ME_ID);
  const allAttendees = [...requiredIds, ...optionalIds].map((id) => people.find((p) => p.id === id)).filter(Boolean);
  const otherTeamAttendees = allAttendees.filter((p) => p.team !== organizer?.team);
  const crossTeam = otherTeamAttendees.length > 0;
  const targetPeople = crossTeam ? otherTeamAttendees : allAttendees;
  const scoreRoom = (room) => targetPeople.filter((p) => p.tower === room.tower && p.floor === room.floor).length * 2
    + targetPeople.filter((p) => p.tower === room.tower).length;
  const sorted = availableRooms.slice().sort((a, b) => {
    const diff = scoreRoom(b) - scoreRoom(a);
    if (diff !== 0) return diff;
    return a.capacity - b.capacity;
  });
  return { room: sorted[0], crossTeam };
}

function evaluateSlot(slot, request, people, floorOf, events, companySettings, rooms) {
  const { start, end } = slot;
  const requiredIds = request.requiredIds;
  const optionalIds = request.optionalIds;
  const allIds = [...requiredIds, ...optionalIds];
  const personStatuses = {};
  allIds.forEach((id) => { personStatuses[id] = getPersonStatus(id, start, end, events); });

  const requiredAvailable = requiredIds.filter((id) => personStatuses[id].state === "available");
  const requiredMovable = requiredIds.filter((id) => personStatuses[id].state === "movable_conflict");
  const requiredHardUnavailable = requiredIds.filter((id) => personStatuses[id].state === "unavailable");
  const optionalAvailable = optionalIds.filter((id) => personStatuses[id].state === "available");
  const optionalUnavailable = optionalIds.filter((id) => personStatuses[id].state !== "available");

  const roomPool = request.forcedRoomId ? rooms.filter((r) => r.id === request.forcedRoomId) : rooms;
  const availableRooms = request.requiredRoom ? getAvailableRooms(start, end, allIds.length, roomPool) : roomPool;
  const roomOk = !request.requiredRoom ? true : availableRooms.length > 0;
  const checkpoints = [];

  // 회사 공통 점심시간 · 출퇴근 시간 겹침 확인
  const cb = getCompanyBurden(start, end, companySettings);
  const anyBurden = cb.duringLunch || cb.justArrived || cb.beforeLeaving;
  if (cb.duringLunch) checkpoints.push({ type: "soft_time", title: "회사 점심시간과 겹쳐요", description: "바로 깊은 논의에 들어가기 부담스러울 수 있어요." });
  if (cb.justArrived) checkpoints.push({ type: "soft_time", title: "출근 직후 시간이에요", description: "회의 준비 시간이 부족할 수 있어요." });
  if (cb.beforeLeaving) checkpoints.push({ type: "soft_time", title: "퇴근 직전 시간이에요", description: "논의가 길어질 경우 부담이 될 수 있어요." });

  allIds.forEach((id) => {
    if (personStatuses[id].state === "available") {
      const adj = getAdjacentEvent(id, start, end, 30, events);
      if (adj) {
        const person = people.find((p) => p.id === id);
        checkpoints.push({ type: "back_to_back_meeting", targetPersonId: id, title: `${person.name.slice(1)}님 연속 회의 후 참석`, description: "바로 논의에 참여할 수 있게 가까운 회의실로 잡아두었어요." });
      }
    }
  });
  optionalUnavailable.forEach((id) => {
    const person = people.find((p) => p.id === id);
    const isExternal = personStatuses[id].conflicts.some((e) => e.type === "external" || e.type === "ooo");
    if (isExternal) checkpoints.push({ type: "external_day", targetPersonId: id, title: `${person.name.slice(1)}님 외근 있는 날`, description: "시간은 가능하지만, 참석이 어려울 수 있어요." });
    else checkpoints.push({ type: "optional_unavailable", targetPersonId: id, title: `${person.name.slice(1)}님 겹치는 일정`, description: "회의에 참석하지 못할 경우, 회의록을 공유해 주세요." });
  });
  const tradeoffCopy = {
    decision: "결정에 필요한 시간이라 조율을 요청드려도 좋아요.",
    ideation: "이 시간 대신 다른 후보가 있다면 먼저 고려해보세요.",
    discussion: "논의 참여를 위해 집중 시간 일부를 조정해야 해요.",
    share_followup: "짧은 공유라면 이 시간도 괜찮아요.",
  };
  requiredMovable.forEach((id) => {
    const person = people.find((p) => p.id === id);
    const blockingType = personStatuses[id].blocking?.type;
    const contextLabel = blockingType === "focus" ? "집중 근무 시간과" : "기존 일정과";
    checkpoints.push({ type: "coordination_needed", targetPersonId: id, title: `${person.name.slice(1)}님 ${contextLabel} 겹쳐요`, description: tradeoffCopy[request.purpose] });
  });
  allIds.forEach((id) => {
    if (personStatuses[id].state === "available") {
      const dayCount = getDayMeetingCount(id, start, events);
      if (dayCount >= 3) {
        const person = people.find((p) => p.id === id);
        checkpoints.push({ type: "fatigue", targetPersonId: id, title: `${person.name.slice(1)}님 오늘 미팅이 많은 날이에요`, description: "컨디션을 고려해서 조금 여유 있게 진행해도 좋아요." });
      }
    }
  });

  let status;
  if (requiredHardUnavailable.length > 0) status = "not_recommended";
  else if (requiredMovable.length > 0 || !roomOk) status = "needs_coordination";
  else status = checkpoints.length > 0 ? "has_checkpoints" : "ready";

  const bufferOkCount = allIds.filter((id) => personStatuses[id].state === "available" && !getAdjacentEvent(id, start, end, 30, events)).length;
  const validationReasons = [];
  if (requiredAvailable.length === requiredIds.length) validationReasons.push("필수 참석자 전원이 참석할 수 있어요.");
  if (bufferOkCount >= Math.ceil(allIds.length * 0.6)) validationReasons.push("참석자 대부분에게 전후 30분 여유가 있어요.");
  if (!anyBurden) validationReasons.push("점심 직후 · 퇴근 직전 시간을 피했어요.");
  if (request.purpose === "decision" && requiredAvailable.length === requiredIds.length) validationReasons.push("결정에 필요한 참석자가 모두 가능한 시간이에요.");
  if (request.purpose === "ideation" && optionalAvailable.length === optionalIds.length) validationReasons.push("아이디어 논의에 필요한 인원이 가장 많이 모일 수 있어요.");

  const { room: defaultRoom, crossTeam } = pickBestRoom(availableRooms, requiredIds, optionalIds, people);
  const roomReason = crossTeam ? "타 팀 참석자와 가까운 회의실이에요." : "참석자들이 이동하기 가까운 회의실이에요.";

  return {
    start, end, status, personStatuses,
    requiredIds, optionalIds,
    availableRooms, selectedRoom: defaultRoom, roomReason, validationReasons, checkpoints,
    metrics: {
      requiredAvailable: requiredAvailable.length / (requiredIds.length || 1),
      roomAvailable: availableRooms.length > 0 ? 1 : 0,
      totalAvailable: (requiredAvailable.length + optionalAvailable.length) / (allIds.length || 1),
      optionalAvailable: optionalIds.length ? optionalAvailable.length / optionalIds.length : 1,
      roomCount: availableRooms.length,
      burdenAvoided: !anyBurden ? 1 : 0,
      bufferCount: bufferOkCount,
    },
  };
}

const STATUS_RANK = { ready: 0, has_checkpoints: 1, needs_coordination: 2, not_recommended: 3 };
const PURPOSE_ORDER = {
  decision: ["requiredAvailable", "roomAvailable", "totalAvailable", "burdenAvoided", "bufferCount"],
  ideation: ["requiredAvailable", "totalAvailable", "optionalAvailable", "burdenAvoided", "roomAvailable", "bufferCount"],
  discussion: ["requiredAvailable", "totalAvailable", "bufferCount", "burdenAvoided", "roomAvailable"],
  share_followup: ["requiredAvailable", "burdenAvoided", "bufferCount", "totalAvailable", "roomAvailable"],
};
function sortCandidates(candidates, purpose) {
  const order = PURPOSE_ORDER[purpose];
  return candidates.slice().sort((a, b) => {
    const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (rankDiff !== 0) return rankDiff;
    for (const key of order) {
      const diff = b.metrics[key] - a.metrics[key];
      if (Math.abs(diff) > 1e-9) return diff;
    }
    return a.start - b.start;
  });
}
function addComparativeReasons(finalCandidates) {
  if (finalCandidates.length === 0) return finalCandidates;
  const maxRoomCount = Math.max(...finalCandidates.map((c) => c.availableRooms.length));
  const hasVariance = finalCandidates.some((c) => c.availableRooms.length < maxRoomCount);
  const earliestReady = finalCandidates.find((c) => c.status === "ready" || c.status === "has_checkpoints");
  return finalCandidates.map((c) => {
    const reasons = [...c.validationReasons];
    if (c.availableRooms.length > 0) {
      if (maxRoomCount >= 2 && hasVariance && c.availableRooms.length === maxRoomCount) reasons.push("다른 후보보다 회의실 선택지가 많아요.");
      else if (c.availableRooms.length === 1) reasons.push("회의실을 예약할 수 있어요.");
    }
    if (earliestReady && c === earliestReady) reasons.push("가장 빠르게 확정할 수 있는 시간이에요.");
    return { ...c, validationReasons: reasons };
  });
}
function generateCandidates(request, people, events, companySettings, rooms) {
  const floorOf = {};
  people.forEach((p) => (floorOf[p.id] = p.floor));
  const slots = generateSlots(request, companySettings);
  const evaluated = slots.map((slot) => evaluateSlot(slot, request, people, floorOf, events, companySettings, rooms));
  const visible = evaluated.filter((c) => c.status !== "not_recommended");
  const sorted = sortCandidates(visible, request.purpose);
  const picked = [];
  for (const c of sorted) {
    if (!picked.some((p) => overlaps(c.start, c.end, p.start, p.end))) picked.push(c);
    if (picked.length >= 3) break;
  }
  return addComparativeReasons(picked);
}

/* ============================================================
   4. UI PRIMITIVES (Figma 토큰 그대로)
   ============================================================ */

function Avatar({ person, size = 32 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size, background: person.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: person.avatarText }}>{person.name[0]}</span>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, style }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        background: C.blue, color: C.white, border: "none", borderRadius: 10, height: 46,
        padding: "2px 32px", fontFamily: FONT, fontWeight: 500, fontSize: 17, cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.3 : 1, minWidth: 140, ...style,
      }}
    >
      {children}
    </button>
  );
}
function SecondaryButton({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{ background: C.bg2, color: C.ink900, border: "none", borderRadius: 10, height: 46, padding: "2px 32px", fontFamily: FONT, fontWeight: 500, fontSize: 17, cursor: "pointer", minWidth: 140, ...style }}>
      {children}
    </button>
  );
}
function Toggle({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {options.map(([label, val]) => (
        <button
          key={label} onClick={() => onChange(val)}
          style={{
            height: 36, borderRadius: 8, border: "none", padding: "8px 12px", fontFamily: FONT, fontWeight: 500, fontSize: 15, cursor: "pointer",
            background: value === val ? C.blue200 : C.bg2, color: value === val ? C.blue : C.ink900,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   5. APP
   ============================================================ */

const EMPTY_WIZARD = { step: "base", title: "", dateStr: "2026-07-12", startHour: 10, durationMinutes: 60, forcedRoomId: null, purpose: PURPOSE_DEFAULT, attendees: { yj: "required" }, search: "" };

export default function MeetingSchedulerApp() {
  const [people, setPeople] = useState(PEOPLE_BASE);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [visibleIds, setVisibleIds] = useState([ME_ID]);
  const [wizard, setWizard] = useState(null);
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState(null);
  const [weekStart, setWeekStart] = useState(mondayOf(new Date(2026, 6, 13)));
  const [rsvp, setRsvp] = useState({}); // `${groupId}:${personId}` -> 'yes' | 'no'
  const [showAdmin, setShowAdmin] = useState(false);
  const [companySettings, setCompanySettings] = useState(DEFAULT_COMPANY_SETTINGS);
  const [rooms, setRooms] = useState(ROOMS_BASE);
  const [teams, setTeams] = useState(TEAMS_BASE);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  };

  const toggleVisible = (id) => setVisibleIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const addEventsForAttendees = (attendeeIds, eventData, groupId) => {
    setEvents((prev) => {
      const next = { ...prev };
      attendeeIds.forEach((id) => { next[id] = [...(next[id] || []), { ...eventData, id: `${groupId || "mtg"}-${Date.now()}-${id}`, groupId }]; });
      return next;
    });
  };
  const deleteMeetingGroup = (groupId) => {
    setEvents((prev) => {
      const next = {};
      Object.keys(prev).forEach((id) => { next[id] = prev[id].filter((e) => e.groupId !== groupId); });
      return next;
    });
  };
  // 참석자가 나뿐일 때: 추천 없이 바로 그 시간에 일정 생성
  const quickCreate = (title, dateStr, startHour, durationMinutes, attendeeIds, roomId) => {
    const start = `${dateStr}T${hourToTimeStr(startHour)}:00`;
    const end = toLocalISO(addMin(toDate(start), durationMinutes));
    const room = rooms.find((r) => r.id === roomId);
    const groupId = attendeeIds.length > 1 ? `mtg-${Date.now()}` : undefined;
    addEventsForAttendees(attendeeIds, { title: title || "새 일정", start, end, visibility: "public", type: "meeting", movable: false, room }, groupId);
    showToast("일정이 생성되었어요.");
  };

  return (
    <div style={{ fontFamily: FONT, color: C.ink900, background: C.white, display: "flex", flexDirection: "column", width: "100%", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 0 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarCheck2 size={20} color={C.ink900} />
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 21, color: C.ink900 }}>회사 캘린더</span>
        </div>
        <button onClick={() => setShowAdmin(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", gap: 6, color: C.ink600, fontFamily: FONT, fontSize: 13 }}>
          <Settings size={17} /> 구성원 관리
        </button>
      </div>
      <div style={{ display: "flex", gap: 44 }}>
        <Sidebar people={people} visibleIds={visibleIds} toggleVisible={toggleVisible} onCreate={() => setWizard({ ...EMPTY_WIZARD, step: "quickBase", origin: "toolbar", roomRequired: true })} weekStart={weekStart} setWeekStart={setWeekStart} />
        <CalendarGrid
          people={people} visibleIds={visibleIds} events={events} weekStart={weekStart} setWeekStart={setWeekStart} rsvp={rsvp} companySettings={companySettings}
          onEmptyClick={(day, hour) => setWizard({ ...EMPTY_WIZARD, origin: "calendar", dateStr: day, startHour: hour })}
          onEventClick={(personId, ev) => setDetail({ personId, ev })}
        />
      </div>

      {detail && (
        detail.ev.meetingMeta ? (
          <ConfirmedDetailModal data={{ meta: detail.ev.meetingMeta, title: detail.ev.title, groupId: detail.ev.groupId }} people={people} onClose={() => setDetail(null)}
            onDelete={() => { deleteMeetingGroup(detail.ev.groupId); setDetail(null); }} rsvp={rsvp} setRsvp={setRsvp} />
        ) : (
          <EventDetailModal personId={detail.personId} ev={detail.ev} people={people} onClose={() => setDetail(null)}
            onDelete={() => { setEvents((prev) => ({ ...prev, [detail.personId]: prev[detail.personId].filter((e) => e.id !== detail.ev.id) })); setDetail(null); }} />
        )
      )}

      {wizard && (
        <CreationWizard wizard={wizard} setWizard={setWizard} people={people} events={events} companySettings={companySettings} rooms={rooms} onClose={() => setWizard(null)}
          onQuickCreate={(title, dateStr, startHour, durationMinutes, attendeeIds, roomId) => {
            quickCreate(title, dateStr, startHour, durationMinutes, attendeeIds, roomId);
            setWizard(null);
          }}
          onConfirm={(candidate, requiredIds, optionalIds, title) => {
            const attendeeIds = [...requiredIds, ...optionalIds];
            const groupId = `mtg-${Date.now()}`;
            const meetingMeta = { requiredIds, optionalIds, room: candidate.selectedRoom, checkpoints: candidate.checkpoints, start: toLocalISO(candidate.start), end: toLocalISO(candidate.end) };
            addEventsForAttendees(attendeeIds, { title, start: toLocalISO(candidate.start), end: toLocalISO(candidate.end), visibility: "public", type: "meeting", movable: false, meetingMeta }, groupId);
            setWizard(null);
            showToast("일정이 생성되었어요.");
          }} />
      )}

      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: C.ink900, color: C.white, borderRadius: 16, padding: "18px 24px", display: "flex", alignItems: "center", gap: 12, fontFamily: FONT, fontWeight: 500, fontSize: 17, zIndex: 100, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Check size={13} color={C.white} />
          </div>
          {toast}
        </div>
      )}

      {showAdmin && (
        <AdminPanel people={people} setPeople={setPeople} companySettings={companySettings} setCompanySettings={setCompanySettings}
          rooms={rooms} setRooms={setRooms} teams={teams} setTeams={setTeams} onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
}

/* ---------- Sidebar (미니 캘린더 + 캘린더 목록) ---------- */

function MiniMonth({ weekStart, setWeekStart }) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const firstDow = 2; // 2026-07-01은 수요일 (월=0 기준 인덱스 2)
  const cells = [...Array(firstDow).fill(null), ...days];
  const weekStartDate = weekStart.getDate();
  const weekEndDate = addDays(weekStart, 4).getDate();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 16, color: C.ink900 }}>2026년 7월</span>
        <div style={{ display: "flex", gap: 10 }}>
          <ChevronLeft size={14} color={C.ink600} />
          <ChevronRight size={14} color={C.ink600} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", rowGap: 10, fontSize: 11, color: C.ink600, textAlign: "center", marginBottom: 10 }}>
        {["월", "화", "수", "목", "금", "토", "일"].map((d, i) => (
          <span key={d} style={{ color: i >= 5 ? C.ink500 : C.ink600 }}>{d}</span>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", rowGap: 6, fontSize: 15, fontFamily: FONT, fontWeight: 500 }}>
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const isWeekend = (i % 7) >= 5;
          const isToday = d === TODAY_DATE;
          return (
            <div
              key={i}
              onClick={() => setWeekStart(mondayOf(new Date(2026, 6, d)))}
              style={{
                textAlign: "center", cursor: "pointer", padding: "6px 0", borderRadius: 8,
                background: "transparent",
                color: isToday ? C.blue : isWeekend ? C.ink400 : C.ink900,
                fontWeight: isToday ? 700 : 500,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(49,130,246,0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Sidebar({ people, visibleIds, toggleVisible, onCreate, weekStart, setWeekStart }) {
  return (
    <div style={{ width: 289, flexShrink: 0, display: "flex", flexDirection: "column", gap: 40, paddingTop: 14 }}>
      <PrimaryButton onClick={onCreate} style={{ width: "100%", minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Plus size={18} /> 일정 추가하기
      </PrimaryButton>
      <MiniMonth weekStart={weekStart} setWeekStart={setWeekStart} />
      <div>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 16, color: C.ink900, marginBottom: 16 }}>캘린더 목록</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {people.map((p) => {
            const checked = visibleIds.includes(p.id);
            return (
              <div key={p.id} onClick={() => toggleVisible(p.id)} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: checked ? p.avatarText : "none", border: checked ? "none" : `1.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {checked && <Check size={14} color={C.white} />}
                </div>
                <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 15, color: C.ink900 }}>{p.name}{p.id === ME_ID ? " (나)" : ""}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Calendar grid ---------- */

function CalendarGrid({ people, visibleIds, events, weekStart, setWeekStart, rsvp, companySettings, onEmptyClick, onEventClick }) {
  const hours = [];
  for (let h = 0; h <= 23; h++) hours.push(h);
  const hourText = (h) => (h < 12 ? `오전 ${h === 0 ? 12 : h}시` : `오후 ${h === 12 ? 12 : h - 12}시`);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = Math.max(0, (companySettings.commuteIn - 1) * HOUR_HEIGHT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayDates = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  const displayDays = displayDates.map(dateOnlyStr);
  const rangeLabel = `${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 - ${displayDates[4].getMonth() + 1}월 ${displayDates[4].getDate()}일`;

  const NavBtn = ({ onClick, children }) => {
    const [hover, setHover] = useState(false);
    return (
      <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ border: "none", background: hover ? C.bg2 : "none", borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        {children}
      </button>
    );
  };

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 21, color: C.ink900 }}>{rangeLabel}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <NavBtn onClick={() => setWeekStart((w) => addDays(w, -7))}><ChevronLeft size={20} color={C.ink600} /></NavBtn>
            <NavBtn onClick={() => setWeekStart((w) => addDays(w, 7))}><ChevronRight size={20} color={C.ink600} /></NavBtn>
          </div>
          <button onClick={() => setWeekStart(mondayOf(new Date(2026, 6, TODAY_DATE)))} style={{ border: `1px solid ${C.border}`, borderRadius: 8, height: 36, padding: "8px 12px", background: "none", fontFamily: FONT, fontWeight: 500, fontSize: 15, color: C.ink900, cursor: "pointer" }}>오늘</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "56px repeat(5, 1fr)" }}>
        <div />
        {displayDates.map((date, i) => {
          const isToday = date.getDate() === TODAY_DATE && date.getMonth() === 6;
          return (
            <div key={displayDays[i]} style={{ textAlign: "center", padding: "16px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: FONT, fontSize: 17, color: isToday ? C.blue : C.ink500, marginBottom: 4 }}>{DAY_LABEL[i]}</div>
              <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 25, color: isToday ? C.blue : C.ink900 }}>{date.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div ref={scrollRef} style={{ position: "relative", display: "grid", gridTemplateColumns: "56px repeat(5, 1fr)", maxHeight: 640, overflowY: "auto" }}>
        <div>
          {hours.map((h) => (
            <div key={h} style={{ height: HOUR_HEIGHT, fontSize: 13, fontFamily: FONT, fontWeight: 500, color: C.ink500, textAlign: "right", paddingRight: 10, transform: "translateY(-8px)" }}>
              {hourText(h)}
            </div>
          ))}
        </div>
        {displayDays.map((day) => (
          <div key={day} style={{ position: "relative", borderLeft: `1px solid ${C.bg2}` }}>
            {/* 비선호 시간 배경 밴드 (회사 공통 설정 기반 위치) */}
            <div style={{ position: "absolute", top: companySettings.lunchStart * HOUR_HEIGHT, height: (companySettings.lunchEnd - companySettings.lunchStart) * HOUR_HEIGHT, left: 0, right: 0, background: "rgba(17,24,39,0.02)", pointerEvents: "none" }}>
              <div style={{ padding: 8, fontSize: 13, color: C.ink500, fontFamily: FONT }}>회사 점심시간<br />{decHourToKorean(companySettings.lunchStart)}~{decHourToKorean(companySettings.lunchEnd)}</div>
            </div>
            <div style={{ position: "absolute", top: (companySettings.commuteOut - 1) * HOUR_HEIGHT, height: HOUR_HEIGHT, left: 0, right: 0, background: "rgba(17,24,39,0.02)", pointerEvents: "none" }}>
              <div style={{ padding: 8, fontSize: 13, color: C.ink500, fontFamily: FONT }}>퇴근 시간<br />{decHourToKorean(companySettings.commuteOut - 1)}~{decHourToKorean(companySettings.commuteOut)}</div>
            </div>
            <div style={{ position: "absolute", top: 0, height: companySettings.commuteIn * HOUR_HEIGHT, left: 0, right: 0, background: "rgba(17,24,39,0.02)", pointerEvents: "none" }}>
              <div style={{ padding: 8, fontSize: 13, color: C.ink500, fontFamily: FONT }}>출근 전<br />~{decHourToKorean(companySettings.commuteIn)}</div>
            </div>

            {hours.map((h) => (
              <div key={h} onClick={() => onEmptyClick(day, h)} style={{ height: HOUR_HEIGHT, borderBottom: `1px solid ${C.bg2}`, cursor: "pointer", position: "relative", zIndex: 1 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(49,130,246,0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")} />
            ))}

            {visibleIds.map((personId, pIdx) => {
              const person = people.find((p) => p.id === personId);
              const dayEvents = (events[personId] || []).filter((e) => e.start.startsWith(day));
              const offset = pIdx * 6;
              return dayEvents.map((ev) => {
                const s = toDate(ev.start), e = toDate(ev.end);
                const startH = s.getHours() + s.getMinutes() / 60;
                const endH = e.getHours() + e.getMinutes() / 60;
                const top = startH * HOUR_HEIGHT;
                const height = Math.max((endH - startH) * HOUR_HEIGHT - 4, 20);
                const isConfirmedMeeting = !!ev.groupId;
                const rsvpStatus = isConfirmedMeeting ? rsvp?.[`${ev.groupId}:${personId}`] : null;

                const durationMin = (e - s) / 60000;
                const isCompact = durationMin <= 30;
                let bg = person.avatarBg, textColor = C.ink900, secondaryColor = C.ink900, strike = false;
                if (rsvpStatus === "yes") { bg = person.avatarText; textColor = C.white; secondaryColor = C.white; }
                else if (rsvpStatus === "no") { bg = C.bg2; textColor = C.ink400; secondaryColor = C.ink400; strike = true; }

                return (
                  <div key={ev.id} onClick={(evt) => { evt.stopPropagation(); onEventClick(personId, ev); }}
                    style={{
                      position: "absolute", top, left: 4 + offset, right: 4, height, zIndex: 2, cursor: "pointer",
                      background: bg, borderRadius: 8, padding: 8, overflow: "hidden",
                    }}>
                    <div style={{ display: "flex", flexDirection: isCompact ? "row" : "column", alignItems: isCompact ? "center" : "stretch", gap: isCompact ? 6 : 0, minWidth: 0 }}>
                      <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: textColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: strike ? "line-through" : "none", minWidth: 0 }}>
                        {ev.title}
                      </div>
                      <div style={{ fontFamily: FONT, fontSize: 13, color: secondaryColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 0 }}>
                        {fmtAmPm(s)}~{fmtAmPm(e)}
                      </div>
                    </div>
                  </div>
                );
              });
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- shared modal shell ---------- */

function Overlay({ children, onClose, width = 460, minHeight }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }} onClick={onClose}>
      <div style={{ background: C.white, borderRadius: 24, width, minHeight, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto", fontFamily: FONT, display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
function PanelHeader({ title, onClose }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "24px 24px 20px 24px" }}>
      <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 21, color: C.ink900 }}>{title}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={16} color={C.ink900} /></button>
    </div>
  );
}
function PanelHeaderWithActions({ title, onClose, onDelete }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "24px 24px 20px 24px" }}>
      <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 21, color: C.ink900 }}>{title}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Trash2 size={17} color={C.ink600} /></button>
        <button disabled title="수정 기능은 준비 중이에요" style={{ background: "none", border: "none", cursor: "default", padding: 0, opacity: 0.4 }}><Pencil size={17} color={C.ink600} /></button>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={16} color={C.ink900} /></button>
      </div>
    </div>
  );
}

/* ---------- (QuickAddModal was merged into the unified CreationWizard) ---------- */

function EventDetailModal({ personId, ev, people, onClose, onDelete }) {
  const person = people.find((p) => p.id === personId);
  const start = toDate(ev.start), end = toDate(ev.end);
  return (
    <Overlay onClose={onClose}>
      <PanelHeaderWithActions title={ev.title} onClose={onClose} onDelete={onDelete} />
      <div style={{ padding: "0 24px 24px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 15, color: C.ink900 }}>
          <CalendarCheck2 size={16} color={C.ink900} /> {fmtDate(start)}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 15, color: C.ink900 }}>
          <Clock size={16} color={C.ink900} /> {fmtAmPm(start)} - {fmtAmPm(end)}
        </div>
        <div style={{ fontSize: 13, color: C.ink500 }}>{person.name} · {TYPE_LABEL[ev.type]}{ev.visibility === "private" ? " · 비공개" : ""}</div>
      </div>
    </Overlay>
  );
}

/* ---------- Creation wizard ---------- */

const roomLabel = (r) => `${r.tower} ${r.floor}층 ${r.name}`;

function formatScheduleLabel(dateStr, startHour, durationMinutes) {
  const d = toDate(dateStr + "T00:00:00");
  const endHour = startHour + durationMinutes / 60;
  const startPeriod = startHour < 12 ? "오전" : "오후";
  const endPeriod = endHour < 12 ? "오전" : "오후";
  const sh = startHour % 12 === 0 ? 12 : Math.floor(startHour % 12);
  const eh = endHour % 12 === 0 ? 12 : Math.floor(endHour % 12);
  const endLabel = endPeriod === startPeriod ? `${eh}시` : `${endPeriod} ${eh}시`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${startPeriod} ${sh}시~ ${endLabel}`;
}
const fieldButtonStyle = { height: 46, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, background: "none", cursor: "pointer", width: "100%", boxSizing: "border-box", fontFamily: FONT };

function CreationWizard({ wizard, setWizard, people, events, companySettings, rooms, onClose, onConfirm, onQuickCreate }) {
  const [index, setIndex] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [searchActiveIndex, setSearchActiveIndex] = useState(0);

  const requiredIds = Object.keys(wizard.attendees).filter((id) => wizard.attendees[id] === "required");
  const optionalIds = Object.keys(wizard.attendees).filter((id) => wizard.attendees[id] === "optional");

  const request = useMemo(() => ({
    title: wizard.title || "새 회의", purpose: wizard.purpose, durationMinutes: wizard.durationMinutes,
    dateRangeStart: WEEK_DAYS[0] + "T09:00:00", dateRangeEnd: WEEK_DAYS[4] + "T19:00:00",
    requiredRoom: wizard.roomRequired !== false, forcedRoomId: wizard.forcedRoomId, requiredIds, optionalIds,
  }), [wizard, requiredIds.join(","), optionalIds.join(",")]);

  const candidates = useMemo(() => (wizard.step === 3 ? generateCandidates(request, people, events, companySettings, rooms) : []), [wizard.step, request, events, companySettings, rooms]);
  const current = candidates[Math.min(index, Math.max(0, candidates.length - 1))];

  const addAttendee = (id) => setWizard((w) => ({ ...w, attendees: { ...w.attendees, [id]: "required" } }));
  const removeAttendee = (id) => setWizard((w) => { const next = { ...w.attendees }; delete next[id]; return { ...w, attendees: next }; });
  const toggleOptional = (id) => setWizard((w) => ({ ...w, attendees: { ...w.attendees, [id]: w.attendees[id] === "optional" ? "required" : "optional" } }));

  const LOADING_CHECKS = ["필수 참석자 가능 일자 조회", "회의실 가능 여부 확인", "부담 시간대 확인"];
  const goToLoading = () => {
    setWizard({ ...wizard, step: "loading" });
    setLoadingStep(0);
  };
  React.useEffect(() => {
    if (wizard.step !== "loading") return;
    if (loadingStep >= LOADING_CHECKS.length) {
      const t = setTimeout(() => setWizard((w) => ({ ...w, step: 3 })), 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setLoadingStep((s) => s + 1), 550);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizard.step, loadingStep]);

  React.useEffect(() => {
    if (wizard.step !== 3) return;
    const handler = (e) => {
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      else if (e.key === "ArrowRight") setIndex((i) => Math.min(candidates.length - 1, i + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [wizard.step, candidates.length]);

  const scheduleLabel = formatScheduleLabel(wizard.dateStr, wizard.startHour, wizard.durationMinutes);
  const attendeeCountAll = Object.keys(wizard.attendees).length;
  const selectedRoom = rooms.find((r) => r.id === wizard.forcedRoomId);

  const handleNext = () => {
    if (attendeeCountAll > 1) {
      goToLoading();
    } else {
      onQuickCreate(wizard.title, wizard.dateStr, wizard.startHour, wizard.durationMinutes, [ME_ID], wizard.forcedRoomId);
    }
  };

  if (wizard.step === "quickBase") {
    const selectedPeople = people.filter((p) => wizard.attendees[p.id]);
    const roomRequired = wizard.roomRequired !== false;
    return (
      <Overlay onClose={onClose} width={460} minHeight={560}>
        <PanelHeader title="어떤 일정을 추가할까요?" onClose={onClose} />
        <div style={{ padding: "10px 24px", display: "flex", flexDirection: "column", gap: 30 }}>
          <Field label="제목">
            <input autoFocus placeholder="일정 이름을 입력해 주세요." value={wizard.title} onChange={(e) => setWizard({ ...wizard, title: e.target.value })}
              style={{ height: 46, border: `1px solid ${wizard.title ? C.blue : C.border}`, borderRadius: 10, padding: "8px 12px", fontFamily: FONT, fontWeight: 500, fontSize: 17, outline: "none", width: "100%", boxSizing: "border-box" }} />
          </Field>
          <Field label="참석자">
            <button onClick={() => setWizard({ ...wizard, step: "attendees" })} style={fieldButtonStyle}>
              <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 17, color: selectedPeople.length > 1 ? C.black : C.ink500, flex: 1, textAlign: "left" }}>참석자 찾기</span>
              <Search size={18} color={C.ink500} />
            </button>
          </Field>
          <Field label="시간">
            <Toggle options={[["1시간", 60], ["30분", 30], ["직접 선택", "custom"]]} value={wizard.durationMinutes} onChange={(v) => v === "custom" ? setWizard({ ...wizard, step: "datetime" }) : setWizard({ ...wizard, durationMinutes: v })} />
          </Field>
          <Field label="회의실">
            <Toggle options={[["필요", true], ["필요없음", false]]} value={roomRequired} onChange={(v) => setWizard({ ...wizard, roomRequired: v, forcedRoomId: v ? wizard.forcedRoomId : null })} />
          </Field>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "20px 24px 24px", marginTop: "auto" }}>
          <PrimaryButton disabled={!wizard.title.trim()} onClick={handleNext}>다음</PrimaryButton>
        </div>
      </Overlay>
    );
  }

  if (wizard.step === "base") {
    return (
      <Overlay onClose={onClose} minHeight={560}>
        <PanelHeader title="어떤 일정을 추가할까요?" onClose={onClose} />
        <div style={{ padding: "10px 24px", display: "flex", flexDirection: "column", gap: 32 }}>
          <Field label="제목">
            <input autoFocus placeholder="일정 이름을 입력해 주세요." value={wizard.title} onChange={(e) => setWizard({ ...wizard, title: e.target.value })}
              style={{ height: 46, border: `1px solid ${wizard.title ? C.blue : C.border}`, borderRadius: 10, padding: "8px 12px", fontFamily: FONT, fontWeight: 500, fontSize: 17, outline: "none", width: "100%", boxSizing: "border-box" }} />
          </Field>

          <Field label="일정">
            <button onClick={() => setWizard({ ...wizard, step: "datetime" })} style={fieldButtonStyle}>
              <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 17, color: C.black, flex: 1, textAlign: "left" }}>{scheduleLabel}</span>
              <Search size={18} color={C.ink500} />
            </button>
          </Field>

          <Field label="참석자">
            <button onClick={() => setWizard({ ...wizard, step: "attendees" })} style={fieldButtonStyle}>
              <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 17, color: attendeeCountAll > 1 ? C.black : C.ink500, flex: 1, textAlign: "left" }}>
                참석자 찾기
              </span>
              <Search size={18} color={C.ink500} />
            </button>
            {people.filter((p) => wizard.attendees[p.id]).length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
                {people.filter((p) => wizard.attendees[p.id]).map((p) => {
                  const isOptional = wizard.attendees[p.id] === "optional";
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar person={p} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 15, color: C.ink900 }}>{p.name}{p.id === ME_ID && <span style={{ color: C.ink500, fontWeight: 400 }}> · 주최자</span>}</div>
                      </div>
                      {p.id !== ME_ID && (
                        <>
                          <button onClick={() => toggleOptional(p.id)} style={{ display: "flex", alignItems: "center", gap: 4, border: "none", borderRadius: 8, height: 30, padding: "0 10px", background: C.bg2, color: isOptional ? C.blue : C.ink500, fontFamily: FONT, fontSize: 13, cursor: "pointer" }}>
                            {isOptional ? <CheckCircle2 size={14} color={C.blue} /> : <Circle size={14} color={C.ink500} />}
                            선택 참여
                          </button>
                          <button onClick={() => removeAttendee(p.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                            <X size={14} color={C.ink500} />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Field>

          <Field label="회의실">
            <button onClick={() => setWizard({ ...wizard, step: "room" })} style={fieldButtonStyle}>
              <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 17, color: selectedRoom ? C.black : C.ink500, flex: 1, textAlign: "left" }}>
                {selectedRoom ? `${roomLabel(selectedRoom)} (${selectedRoom.capacity}인)` : "회의실 찾기"}
              </span>
              <Search size={18} color={C.ink500} />
            </button>
          </Field>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "20px 24px 24px 24px", marginTop: "auto" }}>
          <PrimaryButton disabled={!wizard.title.trim()} onClick={handleNext}>다음</PrimaryButton>
        </div>
      </Overlay>
    );
  }

  if (wizard.step === "datetime") {
    return (
      <Overlay onClose={onClose} minHeight={560}>
        <PanelHeader title="언제로 할까요?" onClose={onClose} />
        <div style={{ padding: "10px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
          <Field label="날짜">
            <input type="date" value={wizard.dateStr} onChange={(e) => setWizard({ ...wizard, dateStr: e.target.value })}
              style={{ ...fieldButtonStyle, color: C.black, cursor: "text" }} />
          </Field>
          <Field label="시작 시간">
            <input type="time" value={hourToTimeStr(wizard.startHour)} onChange={(e) => setWizard({ ...wizard, startHour: timeStrToHour(e.target.value) })}
              style={{ ...fieldButtonStyle, color: C.black, cursor: "text" }} />
          </Field>
          <Field label="시간">
            <Toggle options={[["1시간", 60], ["30분", 30]]} value={wizard.durationMinutes} onChange={(v) => setWizard({ ...wizard, durationMinutes: v })} />
          </Field>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "20px 24px 24px 24px", marginTop: "auto" }}>
          <SecondaryButton onClick={() => setWizard({ ...wizard, step: wizard.origin === "toolbar" ? "quickBase" : "base" })}>이전</SecondaryButton>
          <PrimaryButton onClick={() => setWizard({ ...wizard, step: wizard.origin === "toolbar" ? "quickBase" : "base" })}>확인</PrimaryButton>
        </div>
      </Overlay>
    );
  }

  if (wizard.step === "attendees") {
    const query = wizard.search || "";
    const results = people.filter((p) => p.id !== ME_ID && p.name.includes(query));
    const selectedPeople = people.filter((p) => wizard.attendees[p.id] && p.id !== ME_ID);
    const toggleAttendeeInSearch = (id) => {
      if (wizard.attendees[id]) removeAttendee(id); else addAttendee(id);
    };
    return (
      <Overlay onClose={onClose} minHeight={560}>
        <PanelHeader title="참석자 이름을 입력해 주세요" onClose={onClose} />
        <div style={{ padding: "10px 24px", display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
          <div style={{ height: 46, border: `1px solid ${C.blue}`, borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, boxSizing: "border-box" }}>
            <Search size={18} color={C.ink500} />
            <input autoFocus
              placeholder="이름으로 검색" value={wizard.search}
              onChange={(e) => setWizard({ ...wizard, search: e.target.value })}
              style={{ border: "none", outline: "none", fontFamily: FONT, fontWeight: 500, fontSize: 17, color: C.black, flex: 1, minWidth: 0 }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxHeight: 260, overflowY: "auto" }}>
            {results.map((p) => {
              const isAdded = !!wizard.attendees[p.id];
              return (
                <div key={p.id} onClick={() => toggleAttendeeInSearch(p.id)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <Avatar person={p} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 15, color: C.ink900 }}>{p.name}</div>
                    <div style={{ fontFamily: FONT, fontSize: 13, color: C.ink500 }}>{p.team} · {p.role}</div>
                  </div>
                  {isAdded ? <CheckCircle2 size={20} color="#22c55e" /> : <Circle size={20} color={C.border} />}
                </div>
              );
            })}
          </div>
        </div>
        {selectedPeople.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "8px 24px" }}>
            {selectedPeople.map((p) => (
              <div key={p.id} style={{ border: `1px solid ${C.border}`, borderRadius: 6, height: 28, padding: "7px 8px", display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: C.ink900, cursor: "pointer" }} onClick={() => removeAttendee(p.id)}>
                {p.name} <X size={13} color={C.ink500} />
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "20px 24px 24px 24px", marginTop: "auto" }}>
          <SecondaryButton onClick={() => setWizard({ ...wizard, step: wizard.origin === "toolbar" ? "quickBase" : "base" })}>이전</SecondaryButton>
          <PrimaryButton onClick={() => setWizard({ ...wizard, step: wizard.origin === "toolbar" ? "quickBase" : "base" })}>{selectedPeople.length}명 추가</PrimaryButton>
        </div>
      </Overlay>
    );
  }

  if (wizard.step === "room") {
    return (
      <Overlay onClose={onClose} minHeight={560}>
        <PanelHeader title="회의실을 선택해 주세요" onClose={onClose} />
        <div style={{ padding: "10px 24px 24px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          {rooms.map((r) => {
            const isSelected = wizard.forcedRoomId === r.id;
            return (
              <div key={r.id} onClick={() => setWizard({ ...wizard, forcedRoomId: isSelected ? null : r.id })}
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: 8, borderRadius: 8, background: isSelected ? C.bg2 : "none" }}>
                <MapPin size={18} color={C.ink600} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 15, color: C.ink900 }}>{roomLabel(r)}</div>
                  <div style={{ fontFamily: FONT, fontSize: 13, color: C.ink500 }}>{r.capacity}인 수용</div>
                </div>
                {isSelected ? <CheckCircle2 size={18} color={C.blue} /> : <Circle size={18} color={C.border} />}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "20px 24px 24px 24px", marginTop: "auto" }}>
          <SecondaryButton onClick={() => setWizard({ ...wizard, step: "base" })}>이전</SecondaryButton>
          <PrimaryButton onClick={() => setWizard({ ...wizard, step: "base" })}>선택</PrimaryButton>
        </div>
      </Overlay>
    );
  }

  if (wizard.step === "loading") {
    return (
      <Overlay onClose={onClose} minHeight={560}>
        <PanelHeader title={wizard.title} onClose={onClose} />
        <div style={{ padding: "10px 24px 40px 24px" }}>
          <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 15, color: C.ink900, marginBottom: 20 }}>가능한 일정을 찾아볼게요</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {LOADING_CHECKS.map((label, i) => {
              const state = i < loadingStep ? "done" : i === loadingStep ? "active" : "pending";
              if (state === "pending") return null;
              return (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT, fontSize: 15, color: state === "done" ? C.ink500 : C.ink900 }}>
                  {state === "done" ? <Check size={16} color="#22c55e" /> : <Spinner />}
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      </Overlay>
    );
  }

  // step 3: candidates
  return (
    <Overlay onClose={onClose} width={500} minHeight={560}>
      <div style={{ height: 1, background: C.bg2 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "24px 24px 20px 24px" }}>
        <span style={{ fontFamily: FONT, fontSize: 15, color: C.ink600 }}>
          {wizard.title} · {Object.keys(wizard.attendees).length}인{" "}
          <span onClick={() => setWizard({ ...wizard, step: wizard.origin === "toolbar" ? "quickBase" : "base" })} style={{ textDecoration: "underline", cursor: "pointer" }}>조건 수정</span>
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} color={C.ink900} /></button>
      </div>
      <div style={{ height: 1, background: C.bg2 }} />
      {candidates.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: C.ink500, fontSize: 14 }}>조건에 맞는 후보를 찾지 못했어요. 조건을 수정해 주세요.</div>
      ) : (
        <>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.blue }}>확정 가능 일정</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} style={{ border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, padding: 0, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "none", cursor: "pointer" }}><ChevronLeft size={18} color={C.ink900} /></button>
                <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 15, color: C.ink900 }}>{index + 1} / {candidates.length}</span>
                <button onClick={() => setIndex((i) => Math.min(candidates.length - 1, i + 1))} disabled={index === candidates.length - 1} style={{ border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, padding: 0, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "none", cursor: "pointer" }}><ChevronRight size={18} color={C.ink900} /></button>
              </div>
            </div>
            <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 21, color: C.black }}>{current.start.getMonth() + 1}월 {current.start.getDate()}일 {fmtAmPm(current.start)}~{fmtAmPm(current.end)}</div>
            <div style={{ fontFamily: FONT, fontSize: 13, color: C.ink800 }}>다음주 {WEEKDAY[current.start.getDay()]}요일</div>
          </div>

          <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {current.validationReasons.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 15, color: C.ink900 }}>
                <Check size={16} color={C.blue} /><span>{r}</span>
              </div>
            ))}
          </div>

          {current.checkpoints.length > 0 && (
            <div style={{ padding: "0 24px", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15 }}>확인할 점 <span style={{ color: C.blue }}>{current.checkpoints.length}</span></span>
                <Plus size={16} color={C.ink900} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {current.checkpoints.map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.ink400, marginTop: 6, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontFamily: FONT, fontSize: 15, color: C.ink900 }}>{c.title}</div>
                      <div style={{ fontFamily: FONT, fontSize: 13, color: C.ink600 }}>{c.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <RoomPicker current={current} />

          <div style={{ display: "flex", justifyContent: "flex-end", padding: "20px 24px 24px 24px", marginTop: "auto" }}>
            <PrimaryButton disabled={current.status === "not_recommended"} onClick={() => onConfirm(current, requiredIds, optionalIds, wizard.title)}>선택하기</PrimaryButton>
          </div>
        </>
      )}
    </Overlay>
  );
}

function Spinner() {
  return (
    <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${C.bg2}`, borderTopColor: C.blue, animation: "spin 0.8s linear infinite" }}>
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 15, color: C.ink900, marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function RoomPicker({ current }) {
  const [roomId, setRoomId] = useState(current.selectedRoom?.id);
  const room = current.availableRooms.find((r) => r.id === roomId) || current.selectedRoom;
  return (
    <div style={{ padding: "0 24px" }}>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, color: C.ink900, marginBottom: 12 }}>회의실</div>
      {room ? (
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: FONT, fontSize: 15, color: C.black }}>{roomLabel(room)} ({room.capacity}인)</div>
            <div style={{ fontFamily: FONT, fontSize: 11, color: C.blue }}>{current.roomReason}</div>
          </div>
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)} style={{ border: "none", background: "none", fontSize: 13, color: C.ink600 }}>
            {current.availableRooms.map((r) => <option key={r.id} value={r.id}>변경</option>)}
          </select>
        </div>
      ) : (
        <div style={{ color: C.ink500, fontSize: 14 }}>가능한 회의실 없음</div>
      )}
    </div>
  );
}

/* ---------- Confirmed detail (참석자 + 챙길 점) ---------- */

function ConfirmedDetailModal({ data, people, onClose, onDelete, rsvp, setRsvp }) {
  const { meta, title, groupId } = data;
  const start = toDate(meta.start), end = toDate(meta.end);
  const [checks, setChecks] = useState({});
  const requiredPeople = meta.requiredIds.map((id) => people.find((p) => p.id === id));
  const optionalPeople = meta.optionalIds.map((id) => people.find((p) => p.id === id));

  const toggleCheck = (i) => setChecks((c) => ({ ...c, [i]: !c[i] }));
  const rsvpKey = (id) => `${groupId}:${id}`;
  const cycleRsvp = (id) => setRsvp((r) => {
    const key = rsvpKey(id);
    const cur = r[key] || "pending";
    const next = cur === "pending" ? "yes" : cur === "yes" ? "no" : "pending";
    return { ...r, [key]: next };
  });

  return (
    <Overlay onClose={onClose}>
      <PanelHeaderWithActions title={title} onClose={onClose} onDelete={onDelete} />
      <div style={{ padding: "0 24px 24px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 15, color: C.ink900 }}>
          <CalendarCheck2 size={16} color={C.ink900} /> {fmtDate(start)} 다음주 {WEEKDAY[start.getDay()]}요일
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 15, color: C.ink900 }}>
          <Clock size={16} color={C.ink900} /> {fmtAmPm(start)} - {fmtAmPm(end)}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 15, color: C.ink900 }}>
          <MapPin size={16} color={C.ink900} /> {meta.room?.name} ({meta.room?.capacity}인) <span style={{ textDecoration: "underline", color: C.ink600, cursor: "pointer" }}>변경</span>
        </div>
      </div>

      <div style={{ padding: "20px 24px", borderTop: `1px solid ${C.bg2}` }}>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, marginBottom: 4 }}>참석자</div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: C.ink500, marginBottom: 16 }}>배지를 눌러 응답 상태를 바꿔볼 수 있어요 (데모용)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 16px" }}>
          {[...requiredPeople, ...optionalPeople].map((p) => {
            const isOptional = optionalPeople.includes(p);
            const status = rsvp[rsvpKey(p.id)] || "pending";
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ position: "relative", cursor: isOptional ? "pointer" : "default" }} onClick={() => isOptional && cycleRsvp(p.id)}>
                  <Avatar person={p} />
                  {isOptional && (
                    <div style={{ position: "absolute", bottom: -2, right: -2, width: 16, height: 16, borderRadius: "50%", background: C.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {status === "yes" && <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={9} color={C.white} /></div>}
                      {status === "no" && <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={9} color={C.white} /></div>}
                      {status === "pending" && <div style={{ width: 14, height: 14, borderRadius: "50%", background: C.ink400, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 5, height: 5, borderRadius: "50%", background: C.white }} /></div>}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 15, color: C.ink900 }}>{p.name}</div>
                  <div style={{ fontFamily: FONT, fontSize: 14, color: C.ink500 }}>
                    {p.id === ME_ID ? "주최자" : isOptional ? `선택 참여 · ${status === "yes" ? "참석" : status === "no" ? "불참" : "미응답"}` : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {meta.checkpoints.length > 0 && (
        <div style={{ padding: "20px 24px", borderTop: `1px solid ${C.bg2}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15 }}>챙길 점 <span style={{ color: C.ink500, fontWeight: 400 }}>(나만 보임)</span></span>
            <Plus size={16} color={C.ink900} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {meta.checkpoints.filter((c) => c.type !== "soft_time").map((c, i) => (
              <label key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", cursor: "pointer" }}>
                <div onClick={() => toggleCheck(i)} style={{ width: 16, height: 16, border: `1px solid ${C.border}`, borderRadius: 4, marginTop: 1, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: checks[i] ? C.ink600 : "none" }}>
                  {checks[i] && <Check size={11} color={C.white} />}
                </div>
                <span style={{ fontFamily: FONT, fontSize: 15, color: checks[i] ? C.ink400 : C.ink900, textDecoration: checks[i] ? "line-through" : "none" }}>
                  {c.type === "back_to_back_meeting" ? `${c.title.replace("연속 회의 후 참석", "")}에게 안건 미리 공유하기` :
                   c.type === "optional_unavailable" || c.type === "external_day" ? `회의 후, ${c.title.split("님")[0]}님에게 회의록 보내기` : c.title}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </Overlay>
  );
}

/* ---------- Admin panel: 구성원 관리 ---------- */

const hourToTimeStr = (h) => `${pad2(Math.floor(h))}:${pad2(Math.round((h % 1) * 60))}`;
const timeStrToHour = (str) => { const [h, m] = str.split(":").map(Number); return h + m / 60; };
const adminInputStyle = { width: "100%", height: 38, border: `1px solid ${C.border}`, borderRadius: 8, padding: "0 10px", fontFamily: FONT, fontSize: 14, boxSizing: "border-box" };
const adminLabel = { fontFamily: FONT, fontSize: 12, color: C.ink500, marginBottom: 4 };

function AdminPanel({ people, setPeople, companySettings, setCompanySettings, rooms, setRooms, teams, setTeams, onClose }) {
  const updatePerson = (id, patch) => setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const removePerson = (id) => { if (id === ME_ID) return; setPeople((prev) => prev.filter((p) => p.id !== id)); };
  const addPerson = () => {
    const color = COLOR_PALETTE[people.length % COLOR_PALETTE.length];
    const newId = `p${Date.now()}`;
    setPeople((prev) => [...prev, {
      id: newId, name: "새 팀원", team: teams[0] || "", role: "", tower: TOWERS[0], floor: 5,
      avatarBg: color.avatarBg, avatarText: color.avatarText,
    }]);
  };

  const updateRoom = (id, patch) => setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRoom = (id) => setRooms((prev) => prev.filter((r) => r.id !== id));
  const addRoom = () => setRooms((prev) => [...prev, { id: `r${Date.now()}`, name: "새 회의실", tower: TOWERS[0], floor: 1, capacity: 4 }]);

  const updateTeam = (i, value) => setTeams((prev) => prev.map((t, idx) => (idx === i ? value : t)));
  const removeTeam = (i) => setTeams((prev) => prev.filter((_, idx) => idx !== i));
  const addTeam = () => setTeams((prev) => [...prev, "새 팀"]);

  return (
    <Overlay onClose={onClose} width={640}>
      <PanelHeader title="구성원 관리" onClose={onClose} />
      <div style={{ padding: "0 24px 24px 24px", display: "flex", flexDirection: "column", gap: 20, maxHeight: "64vh", overflowY: "auto" }}>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>회사 설정</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={adminLabel}>점심 시작</div>
              <input type="time" value={hourToTimeStr(companySettings.lunchStart)} onChange={(e) => setCompanySettings((c) => ({ ...c, lunchStart: timeStrToHour(e.target.value) }))} style={adminInputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={adminLabel}>점심 종료</div>
              <input type="time" value={hourToTimeStr(companySettings.lunchEnd)} onChange={(e) => setCompanySettings((c) => ({ ...c, lunchEnd: timeStrToHour(e.target.value) }))} style={adminInputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={adminLabel}>출근 시간</div>
              <input type="time" value={hourToTimeStr(companySettings.commuteIn)} onChange={(e) => setCompanySettings((c) => ({ ...c, commuteIn: timeStrToHour(e.target.value) }))} style={adminInputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={adminLabel}>퇴근 시간</div>
              <input type="time" value={hourToTimeStr(companySettings.commuteOut)} onChange={(e) => setCompanySettings((c) => ({ ...c, commuteOut: timeStrToHour(e.target.value) }))} style={adminInputStyle} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.ink500, marginTop: 8 }}>회사 전체에 적용되는 공통 설정이에요. 캘린더 표시와 회의 후보 계산에 바로 반영돼요.</div>
        </div>

        <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>팀 목록</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {teams.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 8 }}>
                <input value={t} onChange={(e) => updateTeam(i, e.target.value)} style={{ ...adminInputStyle, flex: 1 }} />
                <button onClick={() => removeTeam(i)} style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={16} color="#b62c2c" /></button>
              </div>
            ))}
          </div>
          <button onClick={addTeam} style={{ ...SecondaryButtonStyle, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%" }}>
            <Plus size={15} /> 팀 추가
          </button>
        </div>

        <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>회의실 목록</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rooms.map((r) => (
              <div key={r.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input value={r.name} onChange={(e) => updateRoom(r.id, { name: e.target.value })} style={{ ...adminInputStyle, flex: 2 }} />
                <select value={r.tower} onChange={(e) => updateRoom(r.id, { tower: e.target.value })} style={{ ...adminInputStyle, flex: 1 }}>
                  {TOWERS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input type="number" value={r.floor} onChange={(e) => updateRoom(r.id, { floor: Number(e.target.value) })} style={{ ...adminInputStyle, width: 56 }} title="층" />
                <input type="number" value={r.capacity} onChange={(e) => updateRoom(r.id, { capacity: Number(e.target.value) })} style={{ ...adminInputStyle, width: 56 }} title="정원" />
                <button onClick={() => removeRoom(r.id)} style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={16} color="#b62c2c" /></button>
              </div>
            ))}
          </div>
          <button onClick={addRoom} style={{ ...SecondaryButtonStyle, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%" }}>
            <Plus size={15} /> 회의실 추가
          </button>
        </div>

        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14 }}>구성원</div>
        {people.map((p) => (
          <div key={p.id} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar person={p} />
              <input value={p.name} onChange={(e) => updatePerson(p.id, { name: e.target.value })}
                style={{ ...adminInputStyle, flex: 1, fontWeight: 600 }} />
              {p.id !== ME_ID && (
                <button onClick={() => removePerson(p.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <Trash2 size={16} color="#b62c2c" />
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={adminLabel}>팀</div>
                <select value={p.team || ""} onChange={(e) => updatePerson(p.id, { team: e.target.value })} style={adminInputStyle}>
                  {teams.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={adminLabel}>직무</div>
                <input value={p.role || ""} onChange={(e) => updatePerson(p.id, { role: e.target.value })} style={adminInputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={adminLabel}>타워</div>
                <select value={p.tower || TOWERS[0]} onChange={(e) => updatePerson(p.id, { tower: e.target.value })} style={adminInputStyle}>
                  {TOWERS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={adminLabel}>층</div>
                <input type="number" value={p.floor} onChange={(e) => updatePerson(p.id, { floor: Number(e.target.value) })} style={adminInputStyle} />
              </div>
            </div>
          </div>
        ))}
        <button onClick={addPerson} style={{ ...SecondaryButtonStyle, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Plus size={15} /> 새 팀원 추가
        </button>
      </div>
    </Overlay>
  );
}
const SecondaryButtonStyle = { padding: "13px 20px", background: "#F2F0E9", color: "#1C1C1A", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" };
