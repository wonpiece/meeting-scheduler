import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  PURPOSE_DEFAULT,
  buildPositiveValidationReasons,
  buildRecommendationRequest,
  buildCandidateCoordinationHint,
  buildCandidateCoordinationSection,
  buildCoordinationDraftMessage,
  formatRelativeWeekdayLabel,
  generateCandidates,
  getOccasionScheduleDefaults,
  getRecommendationWeekDays,
  getReferenceCheckpoints,
  getRoomAssignmentReasonForCandidate,
  getValidationReasonInput,
  hourToTimeStr,
  inferMeetingOccasion,
  isCandidateSelectable,
  isRequiredAttendanceMet,
  resolveCheckpointBlockingEvent,
} from "./config/recommendationPolicy";
import { regeneratePersonDemoEvents } from "./admin/regenerateEvents";
import {
  COLOR_PALETTE,
  DEFAULT_COMPANY_SETTINGS,
  generateInitialEventsAndRsvp,
  JOBS_BASE,
  ME_ID,
  PEOPLE_BASE,
  ROOM_EVENTS,
  ROOMS_BASE,
  TEAMS_BASE,
  TOWERS,
  WEEK_DAYS,
} from "./mock";
import { AdminPanel } from "./admin/AdminPanel";
import { resolveJobShort, personMatchesRoleSearch } from "./admin/jobUtils";
import { PersonMeta } from "./components/PersonMeta";
import {
  AI_RESULTS_DELAY_MS,
  AI_STEP_ACTIVE_MS,
  AI_STEP_DONE_HOLD_MS,
  AiThinkingStepList,
  getAiLoadingStepCount,
} from "./components/AiThinkingLoader";
import arrowLeftIcon from "./assets/icons/icon-arrow-left-small-mono.svg?raw";
import arrowRightIcon from "./assets/icons/icon-arrow-right-small-mono.svg?raw";
import closeIcon from "./assets/icons/icon-x-mono.svg?raw";
import plusIcon from "./assets/icons/icon-plus-mono.svg?raw";
import searchIcon from "./assets/icons/icon-search-mono.svg?raw";
import checkIcon from "./assets/icons/icon-check-mono.svg?raw";
import calendarCheckIcon from "./assets/icons/icon-check.svg?raw";
import checkpointDotIcon from "./assets/icons/icon-checkpoint-dot-mono.svg?raw";
import exclamationCircleIcon from "./assets/icons/icon-exclamation-circle-mono.svg?raw";
import calendarIcon from "./assets/icons/icon-calendar-check-mono.svg?raw";
import clockIcon from "./assets/icons/icon-clock-mono.svg?raw";
import pinIcon from "./assets/icons/icon-pin-location-mono.svg?raw";
import binIcon from "./assets/icons/icon-bin-mono.svg?raw";
import circleIcon from "./assets/icons/icon-circle-empty-mono.svg?raw";
import checkCircleIcon from "./assets/icons/icon-check-circle-line-mono.svg?raw";
import checkCircleFilledIcon from "./assets/icons/icon-check-circle-mono.svg?raw";
import pencilIcon from "./assets/icons/icon-pencil-mono.svg?raw";
import copyIconUrl from "./assets/icons/icon-copy-mono.png";
import settingIcon from "./assets/icons/icon-setting-mono.svg?raw";
import arrowDownIcon from "./assets/icons/icon-arrow-down.svg?raw";
import arrowUpIcon from "./assets/icons/icon-arrow-up.svg?raw";

const ICONS = {
  ChevronLeft: arrowLeftIcon, ChevronRight: arrowRightIcon, ChevronDown: arrowDownIcon, ChevronUp: arrowUpIcon, X: closeIcon, Plus: plusIcon, Search: searchIcon, Check: checkIcon,
  CalendarCheck: calendarCheckIcon,
  CalendarCheck2: calendarIcon, Clock: clockIcon, MapPin: pinIcon, Trash2: binIcon, Circle: circleIcon,
  CheckCircle2: checkCircleIcon, CheckCircleFilled: checkCircleFilledIcon,   Pencil: pencilIcon, Settings: settingIcon,
  CheckpointDot: checkpointDotIcon,
  ExclamationCircle: exclamationCircleIcon,
};
const normalizeSvg = (svg) => svg
  .replace(/width="[^"]*"/i, 'width="100%"')
  .replace(/height="[^"]*"/i, 'height="100%"')
  .replace(/fill="(?!none)[^"]*"/gi, 'fill="currentColor"')
  .replace(/stroke="(?!none)[^"]*"/gi, 'stroke="currentColor"');

function SvgIcon({ name, size = 24, color = "currentColor", style, ...props }) {
  const svg = ICONS[name];
  return (
    <span
      aria-hidden="true"
      {...props}
      style={{ width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color, lineHeight: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: normalizeSvg(svg) }}
    />
  );
}
const ChevronLeft = (p) => <SvgIcon name="ChevronLeft" {...p} />;
const ChevronRight = (p) => <SvgIcon name="ChevronRight" {...p} />;
const ChevronDown = (p) => <SvgIcon name="ChevronDown" {...p} />;
const ChevronUp = (p) => <SvgIcon name="ChevronUp" {...p} />;
const X = (p) => <SvgIcon name="X" {...p} />;
const Plus = (p) => <SvgIcon name="Plus" {...p} />;
const Search = (p) => <SvgIcon name="Search" {...p} />;
const Check = (p) => <SvgIcon name="Check" {...p} />;
const CalendarCheck = (p) => <SvgIcon name="CalendarCheck" {...p} />;
const CheckpointDot = (p) => <SvgIcon name="CheckpointDot" {...p} />;
const ExclamationCircle = (p) => <SvgIcon name="ExclamationCircle" {...p} />;
const CalendarCheck2 = (p) => <SvgIcon name="CalendarCheck2" {...p} />;
const Clock = (p) => <SvgIcon name="Clock" {...p} />;
const MapPin = (p) => <SvgIcon name="MapPin" {...p} />;
const Trash2 = (p) => <SvgIcon name="Trash2" {...p} />;
const Circle = (p) => <SvgIcon name="Circle" {...p} />;
const CheckCircle2 = (p) => <SvgIcon name="CheckCircle2" {...p} />;
const CheckCircleFilled = (p) => <SvgIcon name="CheckCircleFilled" {...p} />;
const Pencil = (p) => <SvgIcon name="Pencil" {...p} />;
const Copy = ({ size = 24, style, ...props }) => (
  <img
    src={copyIconUrl}
    alt=""
    aria-hidden="true"
    width={size}
    height={size}
    style={{ display: "inline-block", flexShrink: 0, lineHeight: 0, ...style }}
    {...props}
  />
);
const Settings = (p) => <SvgIcon name="Settings" {...p} />;

/* ============================================================
   DESIGN TOKENS (Figma MCP로 추출한 실제 값)
   ============================================================ */

const C = {
  blue: "#3182f6",
  blue200: "#e7f0fe",
  gray100: "#f2f4f6",
  gray300: "#d1d5db",
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
  success: "#10B981",
  green500: "#10B981",
};

const FONT = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";

function sortByKoreanName(a, b) {
  return a.name.localeCompare(b.name, "ko");
}

function personMatchesAttendeeQuery(person, query, jobs) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [person.name, person.team].some((value) => value.toLowerCase().includes(q))
    || personMatchesRoleSearch(jobs, person.role, query);
}

function sortAttendeeSearchResults(people, query, visibleIds, excludeIds = [], jobs = []) {
  const visibleSet = new Set(visibleIds);
  const excludeSet = new Set(excludeIds);
  const filtered = (query.trim()
    ? people.filter((p) => personMatchesAttendeeQuery(p, query, jobs))
    : [...people]
  ).filter((p) => !excludeSet.has(p.id));

  return filtered.sort((a, b) => {
    if (a.id === ME_ID) return -1;
    if (b.id === ME_ID) return 1;
    const aPriority = visibleSet.has(a.id) ? 0 : 1;
    const bPriority = visibleSet.has(b.id) ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return sortByKoreanName(a, b);
  });
}

function OptionalAttendeeToggle({ isOptional, onToggle }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        border: "none",
        borderRadius: 8,
        height: 26,
        padding: "0 8px",
        background: hover ? "#e4e7ea" : C.bg2,
        color: C.ink900,
        fontFamily: FONT,
        fontSize: 13,
        cursor: "pointer",
        transition: "background 0.15s ease",
      }}
    >
      {isOptional ? <CheckCircleFilled size={14} color={C.blue} /> : <CheckCircle2 size={14} color={C.ink500} />}
      선택 참여
    </button>
  );
}

function AttendeeSearchRow({ person, jobs, isAdded, isActive, isHovered, onHover, onLeave, onToggle, innerRef }) {
  const highlighted = isHovered || isActive;
  return (
    <div
      ref={innerRef}
      onClick={() => onToggle(person.id)}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        margin: "0 -8px",
        padding: 8,
        borderRadius: 10,
        background: highlighted ? HOVER_OVERLAY : "transparent",
        transition: "background 0.15s ease",
      }}
    >
      <Avatar person={person} />
      <PersonMeta
        name={`${person.name}${person.id === ME_ID ? " (나)" : ""}`}
        team={person.team}
        roleShort={resolveJobShort(jobs, person.role)}
        isHost={person.id === ME_ID}
      />
      {isAdded ? <CheckCircleFilled size={20} color={C.green500} /> : <Circle size={20} color={C.border} />}
    </div>
  );
}

function RoomListRow({ room, isSelected, isHovered, onHover, onLeave, onSelect, bleed = true }) {
  const highlighted = isHovered || isSelected;
  return (
    <div
      onClick={() => onSelect(room.id)}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        margin: bleed ? "0 -8px" : 0,
        padding: 8,
        borderRadius: 10,
        background: highlighted ? HOVER_OVERLAY : "transparent",
        transition: "background 0.15s ease",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: C.bg2,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <MapPin size={16} color={C.ink500} />
      </div>
      <PersonMeta name={roomLabel(room)} team={`${room.capacity}인 수용`} />
      {isSelected ? <CheckCircleFilled size={20} color={C.green500} /> : <Circle size={20} color={C.border} />}
    </div>
  );
}

function WizardAttendeeRow({ person, jobs, isOptional, onToggleOptional, onRemove }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "0 -8px",
        padding: 8,
        borderRadius: 10,
        background: hover ? HOVER_OVERLAY : "transparent",
        transition: "background 0.15s ease",
      }}
    >
      <Avatar person={person} />
      <PersonMeta
        name={person.name}
        team={person.team}
        roleShort={resolveJobShort(jobs, person.role)}
        isHost={person.id === ME_ID}
      />
      <OptionalAttendeeToggle isOptional={isOptional} onToggle={onToggleOptional} />
      <button type="button" onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
        <X size={14} color={C.ink500} />
      </button>
    </div>
  );
}

const MODAL_WIDTH = 460;
const RECOMMEND_MODAL_WIDTH = 528;
const RECOMMEND_PAGER_BTN_SIZE = 36;
const RECOMMEND_PAGER_GAP = 12;
const WIZARD_MODAL_MIN_HEIGHT = 560;
const WIZARD_DETAILS_REVEAL_MAX = 1600;
const WIZARD_DETAILS_REVEAL_MS = 490;
const WIZARD_DETAILS_REVEAL_TRANSITION = `max-height ${WIZARD_DETAILS_REVEAL_MS}ms cubic-bezier(0.4, 0, 0.2, 1), opacity 0.36s ease, transform 0.36s cubic-bezier(0.4, 0, 0.2, 1)`;
const HOVER_OVERLAY = "rgba(17,24,39,0.02)";
const REASON_ROW_HEIGHT = 20;
const REFERENCE_CHECKPOINT_ROW_HEIGHT = 23;
const COORDINATION_CHECKPOINT_ROW_HEIGHT = 20;
const CHECKPOINT_SECTION_HEADER = 54;
const COORDINATION_SECTION_HEADLINE_HEIGHT = 22;
const COORDINATION_SECTION_GAP = 12;
const SECTION_GAP = 40;
const COORDINATION_SECTION_MARGIN = SECTION_GAP;
/** 상대 요일 라벨(이번 주 화요일 등) ↔ 추천 사유 목록 */
const REASON_LIST_MARGIN_TOP = 28;
const CHECKPOINT_SECTION_MARGIN = SECTION_GAP;
const ROOM_SECTION_MARGIN = SECTION_GAP;
const ROOM_PICKER_LABEL_HEIGHT = 30;
const ROOM_PICKER_BUTTON_HEIGHT = 48;
const ROOM_PICKER_BLOCK_HEIGHT = ROOM_PICKER_LABEL_HEIGHT + ROOM_PICKER_BUTTON_HEIGHT;
const RECOMMEND_EXIT_MS = 200;
const RECOMMEND_HEADER_MORPH_MS = 220;
const RECOMMEND_RESULTS_ENTER_MS = 280;
const RECOMMEND_MODAL_SIZE_ANIM_MS = 480;
const RECOMMEND_EXIT_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const RECOMMEND_EXIT_TRANSITION = `opacity ${RECOMMEND_EXIT_MS}ms ease, transform ${RECOMMEND_EXIT_MS}ms ${RECOMMEND_EXIT_EASE}`;
const REASON_ROW_GAP = 12;
const CHECKPOINT_ROW_GAP = 12;
const RECOMMENDATION_TOP_BAR_HEIGHT = 69;
const RECOMMENDATION_FOOTER_HEIGHT = 80;
const RECOMMENDATION_HEIGHT_BUFFER = 32;

function estimateReferenceCheckpointRowHeight(checkpoint) {
  const text = `${checkpoint.title ?? ""} ${checkpoint.description ?? ""}`.trim();
  const approxCharsPerLine = 34;
  const lines = Math.max(1, Math.ceil(text.length / approxCharsPerLine));
  return lines * REFERENCE_CHECKPOINT_ROW_HEIGHT;
}

function referenceCheckpointBlockHeight(checkpoints) {
  if (checkpoints.length === 0) return 0;
  const rowsH = checkpoints.reduce(
    (sum, checkpoint) => sum + estimateReferenceCheckpointRowHeight(checkpoint),
    0,
  );
  return (
    CHECKPOINT_SECTION_HEADER
    + rowsH
    + (checkpoints.length - 1) * CHECKPOINT_ROW_GAP
  );
}

function getRecommendationDateSectionHeight(hasCoordinationHint) {
  const pagerH = 20;
  const dateBlockH = 16 + 28 + 8 + 18;
  const hintH = hasCoordinationHint ? 20 : 0;
  return SECTION_GAP + pagerH + dateBlockH + hintH;
}

const STORAGE_KEYS = {
  people: "meeting-scheduler:people-v5",
  events: "meeting-scheduler:events-v23",
  jobs: "meeting-scheduler:jobs",
  companySettings: "meeting-scheduler:company-settings-v2",
  rooms: "meeting-scheduler:rooms",
  teams: "meeting-scheduler:teams",
  rsvp: "meeting-scheduler:rsvp-v3",
  durationPresets: "meeting-scheduler:duration-presets-v1",
};

function readStored(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function usePersistentState(key, fallback) {
  const [value, setValue] = useState(() => readStored(key, fallback));
  const setPersistentValue = (nextValue) => {
    setValue((currentValue) => {
      const resolvedValue = typeof nextValue === "function" ? nextValue(currentValue) : nextValue;
      writeStored(key, resolvedValue);
      return resolvedValue;
    });
  };
  return [value, setPersistentValue];
}

function useNowMinute() {
  const [now, setNow] = useState(() => new Date());
  React.useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function getTimeOfDayTop(now) {
  return (now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600) * HOUR_HEIGHT;
}

function getCalendarInitialScrollTop(now, companySettings) {
  const currentHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const commuteIn = companySettings?.commuteIn ?? DEFAULT_COMPANY_SETTINGS.commuteIn;
  const commuteOut = companySettings?.commuteOut ?? DEFAULT_COMPANY_SETTINGS.commuteOut;
  const inWorkHours = currentHour >= commuteIn && currentHour < commuteOut;
  if (inWorkHours) {
    // 업무 시간: 출근 1시간 전을 상단에 두고, 위로 16px 여백
    return Math.max(0, (commuteIn - 1) * HOUR_HEIGHT - CALENDAR_NOW_SCROLL_TOP_OFFSET);
  }
  // 업무 외: 현재 시각 기준 스크롤 유지
  return Math.max(0, getTimeOfDayTop(now) - CALENDAR_NOW_SCROLL_TOP_OFFSET);
}

const CURRENT_TIME_COLOR = "#ea4335";

/* ============================================================
   1. DATA MODEL — seed는 src/mock/seedData.ts, 생성은 src/mock/eventGenerator.ts
   ============================================================ */

const timeStrToHour = (str) => {
  const [h, m] = str.split(":").map(Number);
  return h + m / 60;
};

function openNativeTimePicker(input) {
  if (!input) return;
  input.focus();
  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
    } catch {
      // showPicker can throw if not triggered by user gesture in some browsers
    }
  }
}

function normalizeCompanySettings(value) {
  const source = value && typeof value === "object" ? value : {};
  const asHour = (candidate, fallback) => {
    const number = Number(candidate);
    return Number.isFinite(number) ? Math.min(24, Math.max(0, number)) : fallback;
  };
  return {
    lunchStart: asHour(source.lunchStart, DEFAULT_COMPANY_SETTINGS.lunchStart),
    lunchEnd: asHour(source.lunchEnd, DEFAULT_COMPANY_SETTINGS.lunchEnd),
    commuteIn: asHour(source.commuteIn, DEFAULT_COMPANY_SETTINGS.commuteIn),
    commuteOut: asHour(source.commuteOut, DEFAULT_COMPANY_SETTINGS.commuteOut),
  };
}
const TYPE_LABEL = { meeting: "미팅", focus: "집중 근무", personal: "개인 일정", external: "외근", ooo: "휴가/OOO", lunch: "점심" };
const DAY_LABEL = ["월", "화", "수", "목", "금", "토", "일"];
const CALENDAR_WEEKDAY_COUNT = 5;
const CALENDAR_WEEKEND_EXPAND_MS = 380;
const CALENDAR_WEEKEND_EXPAND_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const HOUR_HEIGHT = 72;
const CALENDAR_BODY_HEIGHT = 24 * HOUR_HEIGHT;
/** Initial scroll: align current-time indicator near top with minimal past-hour padding */
const CALENDAR_NOW_SCROLL_TOP_OFFSET = 16;

/* ============================================================
   2. DATE HELPERS
   ============================================================ */

const toDate = (s) => new Date(s);
const addMin = (date, min) => new Date(date.getTime() + min * 60000);
const pad2 = (n) => String(n).padStart(2, "0");
const toLocalISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
const CALENDAR_TIME_COL_WIDTH = 64;
function decHourToKorean(h) {
  const totalMin = Math.round(h * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  const period = hh < 12 ? "오전" : "오후";
  const hh12 = hh % 12 === 0 ? 12 : hh % 12;
  return mm === 0 ? `${period} ${hh12}시` : `${period} ${hh12}시 ${mm}분`;
}
function isWeekendDate(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
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
function isSameCalendarDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}
function getDemoTodayStr() {
  return dateOnlyStr(new Date());
}

function getDefaultCustomSchedule(dateStr = getDemoTodayStr()) {
  const now = new Date();
  const hasRemainder = now.getMinutes() > 0 || now.getSeconds() > 0 || now.getMilliseconds() > 0;
  const startHour = Math.min(23, hasRemainder ? now.getHours() + 1 : now.getHours());
  const endHour = Math.min(24, startHour + 1);
  return {
    dateStr,
    startHour,
    endHour,
    durationMinutes: Math.max(30, Math.round((endHour - startHour) * 60)),
  };
}
const fmtAmPmPart = (d, includePeriod = true) => {
  const h = d.getHours();
  const period = h < 12 ? "오전" : "오후";
  const hh = h % 12 === 0 ? 12 : h % 12;
  const time = `${hh}시${d.getMinutes() ? ` ${d.getMinutes()}분` : ""}`;
  return includePeriod ? `${period} ${time}` : time;
};
const fmtAmPm = (d) => fmtAmPmPart(d, true);
const fmtAmPmRange = (start, end, separator = "~") => {
  const startPeriod = start.getHours() < 12 ? "오전" : "오후";
  const endPeriod = end.getHours() < 12 ? "오전" : "오후";
  if (startPeriod === endPeriod) {
    return `${startPeriod} ${fmtAmPmPart(start, false)}${separator}${fmtAmPmPart(end, false)}`;
  }
  return `${fmtAmPmPart(start)}${separator}${fmtAmPmPart(end)}`;
};
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
const fmtDate = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY[d.getDay()]})`;

/* ============================================================
   3. UI PRIMITIVES (Figma 토큰 그대로)
   ============================================================ */

function Avatar({ person, size = 32 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size, background: person.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: person.avatarText }}>{person.name[0]}</span>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, style, type = "button", compact = false, ...rest }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type={type}
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...rest}
      style={{
        background: hover && !disabled ? "#2b74de" : C.blue,
        color: C.white,
        border: "none",
        borderRadius: 10,
        height: compact ? 42 : 48,
        minHeight: compact ? 42 : 48,
        padding: compact ? "0 12px" : "0 32px",
        boxSizing: "border-box",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        fontWeight: 500,
        fontSize: 17,
        lineHeight: 1,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.3 : 1,
        minWidth: compact ? 120 : 140,
        transition: "background 0.15s ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
function SecondaryButton({ children, onClick, disabled, style, type = "button", compact = false }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover && !disabled ? "#e4e7ea" : C.bg2,
        color: C.ink900,
        border: "none",
        borderRadius: 10,
        height: compact ? 42 : 46,
        padding: compact ? "2px 12px" : "2px 32px",
        fontFamily: FONT,
        fontWeight: 500,
        fontSize: 17,
        cursor: disabled ? "default" : "pointer",
        minWidth: compact ? 120 : 140,
        transition: "background 0.15s ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
function OutlineSurfaceButton({ children, onClick, style, type = "button", defaultBackground = C.white, ...rest }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: `1px solid ${C.border}`,
        background: hover ? C.bg2 : defaultBackground,
        transition: "background 0.15s ease",
        cursor: "pointer",
        boxSizing: "border-box",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
function Toggle({ options, value, onChange }) {
  const [hoverKey, setHoverKey] = useState(null);
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {options.map(([label, val]) => (
        <button
          type="button"
          key={label}
          onClick={() => onChange(val)}
          onMouseEnter={() => setHoverKey(label)}
          onMouseLeave={() => setHoverKey(null)}
          style={{
            height: 36,
            borderRadius: 8,
            border: "none",
            padding: "8px 12px",
            fontFamily: FONT,
            fontWeight: 500,
            fontSize: 15,
            cursor: "pointer",
            background: value === val ? C.blue200 : hoverKey === label ? "#e4e7ea" : C.bg2,
            color: value === val ? C.blue : C.ink900,
            transition: "background 0.15s ease",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function formatDurationPresetLabel(minutes) {
  if (minutes % 60 === 0) return `${minutes / 60}시간`;
  return `${minutes}분`;
}

const MAX_CUSTOM_DURATION_PRESETS = 5;
const BUILTIN_DURATION_PRESETS = new Set([30, 60]);

function normalizeDurationPresets(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const next = [];
  for (const item of value) {
    const minutes = Math.round(Number(item));
    if (!Number.isFinite(minutes) || minutes < 1) continue;
    if (BUILTIN_DURATION_PRESETS.has(minutes)) continue;
    if (seen.has(minutes)) continue;
    seen.add(minutes);
    next.push(minutes);
    if (next.length >= MAX_CUSTOM_DURATION_PRESETS) break;
  }
  return next;
}

function pushDurationPreset(list, minutes) {
  const normalized = Math.round(Number(minutes));
  if (!Number.isFinite(normalized) || normalized < 1) return normalizeDurationPresets(list);
  if (BUILTIN_DURATION_PRESETS.has(normalized)) return normalizeDurationPresets(list);
  return normalizeDurationPresets([normalized, ...normalizeDurationPresets(list)]);
}

function DurationInputDialog({ onClose, onConfirm, zIndex = 70 }) {
  const [hours, setHours] = useState("");
  const [mins, setMins] = useState("");
  const hoursInputRef = useRef(null);

  useEffect(() => {
    hoursInputRef.current?.focus();
  }, []);

  const hoursNum = hours === "" ? 0 : Number(hours);
  const minsNum = mins === "" ? 0 : Number(mins);
  const totalMinutes = Math.round(hoursNum * 60 + minsNum);
  const canConfirm = Number.isFinite(hoursNum) && Number.isFinite(minsNum)
    && hoursNum >= 0 && minsNum >= 0
    && totalMinutes >= 1;

  const confirm = () => {
    if (!canConfirm) return;
    onConfirm(totalMinutes);
  };

  const sanitizeInt = (raw) => raw.replace(/[^\d]/g, "");

  const unitLabelStyle = {
    flexShrink: 0,
    fontFamily: FONT,
    fontWeight: 500,
    fontSize: 15,
    fontStyle: "normal",
    color: C.ink800,
    lineHeight: "20px",
  };

  const inputStyle = {
    flex: 1,
    minWidth: 0,
    width: "100%",
    height: 36,
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    padding: "0 12px",
    fontFamily: FONT,
    fontWeight: 500,
    fontSize: 15,
    color: C.ink900,
    outline: "none",
    boxSizing: "border-box",
  };

  const unitGroupStyle = {
    display: "flex",
    alignItems: "center",
    gap: 4,
    flex: "1 1 0",
    minWidth: 0,
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        background: "rgba(17,24,39,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="duration-input-dialog-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.white,
          borderRadius: 24,
          width: 280,
          maxWidth: "94vw",
          padding: 20,
          boxSizing: "border-box",
        }}
      >
        <div
          id="duration-input-dialog-title"
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 17,
            color: C.ink900,
            textAlign: "left",
            lineHeight: 1.4,
          }}
        >
          소요 시간을 입력해 주세요
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, width: "100%" }}>
          <div style={unitGroupStyle}>
            <input
              ref={hoursInputRef}
              type="text"
              inputMode="numeric"
              aria-label="시간"
              value={hours}
              onChange={(e) => setHours(sanitizeInt(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirm();
                }
              }}
              style={inputStyle}
            />
            <span style={unitLabelStyle}>시간</span>
          </div>
          <div style={unitGroupStyle}>
            <input
              type="text"
              inputMode="numeric"
              aria-label="분"
              value={mins}
              onChange={(e) => setMins(sanitizeInt(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirm();
                }
              }}
              style={inputStyle}
            />
            <span style={unitLabelStyle}>분</span>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <PrimaryButton compact disabled={!canConfirm} onClick={confirm} style={{ width: "100%", minWidth: 0 }}>
            확인
          </PrimaryButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function WizardDurationToggle({ dateStr, startHour, endHour, durationMinutes, durationPreset, onSelectPreset, onOpenCustom, onClearCustom }) {
  const [hoverKey, setHoverKey] = useState(null);
  const [showDurationInput, setShowDurationInput] = useState(false);
  const [customDurationPresets, setCustomDurationPresets] = usePersistentState(
    STORAGE_KEYS.durationPresets,
    [],
  );
  const savedPresets = normalizeDurationPresets(customDurationPresets);
  const customReady = durationPreset === "custom" && startHour != null && endHour != null;
  const customLabel = customReady
    ? formatScheduleLabel(dateStr, startHour, durationMinutes, endHour)
    : null;
  const selectedCustomMinutes = typeof durationPreset === "number" && !BUILTIN_DURATION_PRESETS.has(durationPreset)
    ? durationPreset
    : null;
  const visibleCustomPresets = selectedCustomMinutes != null && !savedPresets.includes(selectedCustomMinutes)
    ? [selectedCustomMinutes, ...savedPresets].slice(0, MAX_CUSTOM_DURATION_PRESETS)
    : savedPresets;

  const pillStyle = (selected, hoverLabel) => ({
    height: 36,
    borderRadius: 8,
    border: "none",
    padding: "8px 12px",
    fontFamily: FONT,
    fontWeight: 500,
    fontSize: 15,
    cursor: "pointer",
    background: selected ? C.blue200 : hoverKey === hoverLabel ? "#e4e7ea" : C.bg2,
    color: selected ? C.blue : C.ink900,
    transition: "background 0.15s ease",
  });

  if (customReady) {
    return (
      <div
        style={{
          height: 36,
          borderRadius: 8,
          padding: "0 8px 0 12px",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: C.blue200,
          color: C.blue,
        }}
      >
        <button
          type="button"
          onClick={onOpenCustom}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            margin: 0,
            fontFamily: FONT,
            fontWeight: 500,
            fontSize: 15,
            color: C.blue,
            cursor: "pointer",
            lineHeight: "20px",
          }}
        >
          {customLabel}
        </button>
        <button
          type="button"
          aria-label="직접 선택 시간 초기화"
          onClick={onClearCustom}
          style={{
            background: "none",
            border: "none",
            padding: 2,
            margin: 0,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 0,
          }}
        >
          <X size={14} color={C.blue} />
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => onSelectPreset(60)}
            onMouseEnter={() => setHoverKey("1시간")}
            onMouseLeave={() => setHoverKey(null)}
            style={pillStyle(durationPreset === 60, "1시간")}
          >
            1시간
          </button>
          <button
            type="button"
            onClick={() => onSelectPreset(30)}
            onMouseEnter={() => setHoverKey("30분")}
            onMouseLeave={() => setHoverKey(null)}
            style={pillStyle(durationPreset === 30, "30분")}
          >
            30분
          </button>
          {visibleCustomPresets.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => onSelectPreset(minutes)}
              onMouseEnter={() => setHoverKey(`custom-${minutes}`)}
              onMouseLeave={() => setHoverKey(null)}
              style={pillStyle(durationPreset === minutes, `custom-${minutes}`)}
            >
              {formatDurationPresetLabel(minutes)}
            </button>
          ))}
          <button
            type="button"
            aria-label="소요 시간 직접 입력"
            onClick={() => setShowDurationInput(true)}
            onMouseEnter={() => setHoverKey("add-duration")}
            onMouseLeave={() => setHoverKey(null)}
            style={{
              ...pillStyle(false, "add-duration"),
              width: 36,
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={16} color={C.ink900} />
          </button>
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: 13,
            fontStyle: "normal",
            color: C.ink500,
            lineHeight: "18px",
          }}
        >
          소요시간에 맞춰 확정 가능한 일정을 찾아드릴게요.
        </div>
      </div>
      {showDurationInput && (
        <DurationInputDialog
          onClose={() => setShowDurationInput(false)}
          onConfirm={(minutes) => {
            setCustomDurationPresets((prev) => pushDurationPreset(prev, minutes));
            onSelectPreset(minutes);
            setShowDurationInput(false);
          }}
        />
      )}
    </>
  );
}

/* ============================================================
   5. APP
   ============================================================ */

const EMPTY_WIZARD = {
  step: "base",
  title: "",
  dateStr: getDemoTodayStr(),
  startHour: 10,
  endHour: 11,
  durationMinutes: 60,
  durationPreset: 60,
  roomRequired: true,
  forcedRoomId: null,
  purpose: PURPOSE_DEFAULT,
  attendees: { yj: "required" },
  search: "",
  editGroupId: null,
  basePhase: "title",
  recommendSettingsOpen: false,
  avoidSoftTimes: true,
  avoidBusyDays: true,
};

function inferDurationPreset(durationMinutes) {
  if (durationMinutes === 60) return 60;
  if (durationMinutes === 30) return 30;
  if (typeof durationMinutes === "number" && durationMinutes > 0) return durationMinutes;
  return "custom";
}

function dateToWizardFields(start, end) {
  const dateStr = `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`;
  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;
  const durationMinutes = Math.max(30, Math.round((end.getTime() - start.getTime()) / 60000));
  return { dateStr, startHour, endHour, durationMinutes };
}

function wizardFromMeeting(groupId, title, meta) {
  const start = toDate(meta.start);
  const end = toDate(meta.end);
  const { dateStr, startHour, endHour, durationMinutes } = dateToWizardFields(start, end);
  const attendees = {};
  (meta.requiredIds ?? []).forEach((id) => { attendees[id] = "required"; });
  (meta.optionalIds ?? []).forEach((id) => { attendees[id] = "optional"; });
  return {
    step: "quickBase",
    origin: "toolbar",
    editGroupId: groupId,
    basePhase: "details",
    title,
    dateStr,
    startHour,
    endHour,
    durationMinutes,
    durationPreset: inferDurationPreset(durationMinutes),
    roomRequired: Boolean(meta.room),
    forcedRoomId: meta.room?.id ?? null,
    attendees: Object.keys(attendees).length > 0 ? attendees : { [ME_ID]: "required" },
  };
}

function wizardBaseStep(origin) {
  return origin === "toolbar" || origin === "calendar" ? "quickBase" : "base";
}

function returnToBaseWizard(wizard, extra = {}) {
  return {
    ...wizard,
    step: wizardBaseStep(wizard.origin),
    basePhase: "details",
    ...extra,
  };
}

function WizardDatetimeStep({ wizard, setWizard, onClose, disableBackdropClose, exitConfirm }) {
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);
  const hasStart = wizard.startHour != null;
  const hasEnd = wizard.endHour != null;

  useEffect(() => {
    if (wizard.startHour == null || wizard.endHour != null) return;
    const endHour = Math.min(24, wizard.startHour + 1);
    setWizard((w) => {
      if (w == null || w.startHour == null || w.endHour != null) return w;
      return {
        ...w,
        endHour,
        durationMinutes: Math.round((endHour - w.startHour) * 60),
      };
    });
  }, [wizard.startHour, wizard.endHour, setWizard]);

  const updateStart = (value) => {
    if (!value) {
      setWizard({ ...wizard, startHour: null, endHour: null, durationMinutes: "custom" });
      return;
    }
    const nextStart = timeStrToHour(value);
    const nextEnd = hasEnd
      ? Math.max(wizard.endHour, nextStart + 0.5)
      : Math.min(24, nextStart + 1);
    setWizard({
      ...wizard,
      startHour: nextStart,
      endHour: nextEnd,
      durationMinutes: Math.round((nextEnd - nextStart) * 60),
    });
  };
  const updateEnd = (value) => {
    if (!value) {
      setWizard({ ...wizard, endHour: null, durationMinutes: "custom" });
      return;
    }
    const nextEnd = timeStrToHour(value);
    if (!hasStart) {
      setWizard({ ...wizard, endHour: nextEnd, durationMinutes: "custom" });
      return;
    }
    const safeEnd = Math.max(nextEnd, wizard.startHour + 0.5);
    setWizard({ ...wizard, endHour: safeEnd, durationMinutes: Math.round((safeEnd - wizard.startHour) * 60) });
  };
  const inputWrap = { ...fieldButtonStyle, padding: "0 12px", cursor: "pointer", gap: 8 };
  const inputInner = { border: "none", outline: "none", background: "transparent", color: C.black, fontFamily: FONT, fontWeight: 500, fontSize: 17, width: "100%", flex: 1, minWidth: 0 };
  const timeFieldWrap = { position: "relative", flex: 1, minWidth: 0, display: "flex", alignItems: "center", cursor: "pointer" };
  const timePlaceholder = { position: "absolute", left: 0, color: C.ink500, fontFamily: FONT, fontWeight: 500, fontSize: 17, pointerEvents: "none", zIndex: 0 };
  const datetimeReady = hasStart && hasEnd;
  return (
    <Overlay onClose={onClose} disableBackdropClose={disableBackdropClose} exitConfirm={exitConfirm}>
      <PanelHeader title="언제로 할까요?" onClose={onClose} />
      <div style={{ padding: "10px 24px", display: "flex", flexDirection: "column", gap: SECTION_GAP }}>
        <Field label="날짜">
          <div className="wizard-outline-control" style={{ ...inputWrap, cursor: "text" }}>
            <CalendarCheck2 size={20} color={C.ink600} />
            <input type="date" className="wizard-datetime-input" value={wizard.dateStr || getDemoTodayStr()} onChange={(e) => setWizard({ ...wizard, dateStr: e.target.value })} style={inputInner} />
          </div>
        </Field>
        <Field label="시작 시간">
          <div className="wizard-outline-control" style={inputWrap} onClick={() => openNativeTimePicker(startTimeRef.current)}>
            <Clock size={20} color={C.ink600} />
            <div style={timeFieldWrap}>
              {!hasStart && <span style={timePlaceholder}>시작 시간 선택</span>}
              <input
                ref={startTimeRef}
                type="time"
                className="wizard-datetime-input"
                value={hasStart ? hourToTimeStr(wizard.startHour) : ""}
                onChange={(e) => updateStart(e.target.value)}
                onClick={(e) => {
                  e.stopPropagation();
                  openNativeTimePicker(e.currentTarget);
                }}
                style={{ ...inputInner, color: hasStart ? C.black : "transparent", position: "relative", zIndex: 1 }}
              />
            </div>
          </div>
        </Field>
        <Field label="종료 시간">
          <div className="wizard-outline-control" style={inputWrap} onClick={() => openNativeTimePicker(endTimeRef.current)}>
            <Clock size={20} color={C.ink600} />
            <div style={timeFieldWrap}>
              {!hasEnd && <span style={timePlaceholder}>종료 시간 선택</span>}
              <input
                ref={endTimeRef}
                type="time"
                className="wizard-datetime-input"
                value={hasEnd ? hourToTimeStr(wizard.endHour) : ""}
                min={hasStart ? hourToTimeStr(wizard.startHour + 0.5) : undefined}
                onChange={(e) => updateEnd(e.target.value)}
                onClick={(e) => {
                  e.stopPropagation();
                  openNativeTimePicker(e.currentTarget);
                }}
                style={{ ...inputInner, color: hasEnd ? C.black : "transparent", position: "relative", zIndex: 1 }}
              />
            </div>
          </div>
        </Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "20px 24px 24px 24px", marginTop: "auto" }}>
        <SecondaryButton
          compact
          onClick={() => {
            if (wizard.durationRestore) {
              setWizard(returnToBaseWizard(wizard, {
                ...wizard.durationRestore,
                durationRestore: undefined,
              }));
              return;
            }
            setWizard(returnToBaseWizard(wizard));
          }}
        >
          이전
        </SecondaryButton>
        <PrimaryButton
          compact
          disabled={!datetimeReady}
          onClick={() => setWizard(returnToBaseWizard(wizard, {
            durationPreset: "custom",
            durationRestore: undefined,
          }))}
        >
          확인
        </PrimaryButton>
      </div>
    </Overlay>
  );
}

function eventsExcludingGroup(events, groupId) {
  if (!groupId) return events;
  const next = {};
  Object.entries(events).forEach(([personId, list]) => {
    next[personId] = list.filter((event) => event.groupId !== groupId);
  });
  return next;
}

let cachedInitialSeed = null;
function createInitialSeed() {
  if (!cachedInitialSeed) {
    const settings = normalizeCompanySettings(readStored(STORAGE_KEYS.companySettings, DEFAULT_COMPANY_SETTINGS));
    const people = readStored(STORAGE_KEYS.people, PEOPLE_BASE);
    cachedInitialSeed = generateInitialEventsAndRsvp(people, settings, ME_ID, ROOMS_BASE);
  }
  return cachedInitialSeed;
}

function createInitialEvents() {
  return createInitialSeed().events;
}

function createInitialRsvp() {
  return createInitialSeed().rsvp;
}

const TOAST_ENTER_MS = 280;
const TOAST_HOLD_MS = 2000;
const TOAST_EXIT_MS = 280;

function ToastBanner({ message, viewDetail, onDismiss, onViewDetail }) {
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    const leaveTimer = setTimeout(() => setLeaving(true), TOAST_ENTER_MS + TOAST_HOLD_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(leaveTimer);
    };
  }, []);

  useEffect(() => {
    if (!leaving) return undefined;
    const timer = setTimeout(onDismiss, TOAST_EXIT_MS);
    return () => clearTimeout(timer);
  }, [leaving, onDismiss]);

  const animating = leaving || !entered;
  const slideMs = leaving ? TOAST_EXIT_MS : TOAST_ENTER_MS;

  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        left: "50%",
        transform: entered && !leaving
          ? "translate(-50%, 0)"
          : "translate(-50%, calc(-100% - 32px))",
        opacity: entered && !leaving ? 1 : 0,
        transition: animating
          ? `transform ${slideMs}ms ${leaving ? "ease-in" : "ease-out"}, opacity ${slideMs}ms ${leaving ? "ease-in" : "ease-out"}`
          : "none",
        background: C.ink900,
        color: C.white,
        borderRadius: 9999,
        padding: "18px 24px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: FONT,
        fontWeight: 500,
        fontSize: 17,
        zIndex: 100,
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        pointerEvents: entered && !leaving ? "auto" : "none",
      }}
    >
      <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.green500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Check size={13} color={C.white} />
      </div>
      <span>{message}</span>
      {viewDetail && (
        <button
          type="button"
          onClick={onViewDetail}
          style={{
            background: "none",
            border: "none",
            color: C.white,
            fontFamily: FONT,
            fontWeight: 500,
            fontSize: 17,
            textDecoration: "underline",
            textUnderlineOffset: 2,
            cursor: "pointer",
            padding: 0,
            flexShrink: 0,
          }}
        >
          보기
        </button>
      )}
    </div>
  );
}

export default function MeetingSchedulerApp() {
  const [people, setPeople] = usePersistentState(STORAGE_KEYS.people, PEOPLE_BASE);
  const [events, setEvents] = usePersistentState(STORAGE_KEYS.events, createInitialEvents());
  const [visibleIds, setVisibleIds] = useState([ME_ID]);
  const [wizard, setWizard] = useState(null);
  const [frozenRecommendations, setFrozenRecommendations] = useState(null);
  const [wizardSession, setWizardSession] = useState(0);
  const openWizard = (initial) => {
    setWizardSession((session) => session + 1);
    setFrozenRecommendations(null);
    setWizard({
      ...EMPTY_WIZARD,
      ...initial,
      dateStr: initial.dateStr ?? getDemoTodayStr(),
      step: initial.step ?? wizardBaseStep(initial.origin),
    });
  };
  const closeWizard = () => {
    setWizardSession((session) => session + 1);
    setFrozenRecommendations(null);
    setWizard(null);
  };
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState(null);
  const toastIdRef = useRef(0);
  const [highlightGroupId, setHighlightGroupId] = useState(null);
  const highlightClearRef = useRef(null);
  const pulseCreatedMeeting = (groupId) => {
    if (!groupId) return;
    if (highlightClearRef.current) clearTimeout(highlightClearRef.current);
    setHighlightGroupId(groupId);
    highlightClearRef.current = setTimeout(() => {
      setHighlightGroupId(null);
      highlightClearRef.current = null;
    }, 2000);
  };
  useEffect(() => () => {
    if (highlightClearRef.current) clearTimeout(highlightClearRef.current);
  }, []);
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [showWeekend, setShowWeekend] = useState(() => isWeekendDate(new Date()));
  const [miniCalendarResetKey, setMiniCalendarResetKey] = useState(0);
  const selectCalendarWeek = (date) => {
    setShowWeekend(isWeekendDate(date));
    setWeekStart(mondayOf(date));
  };
  const goToToday = () => {
    const today = new Date();
    setShowWeekend(isWeekendDate(today));
    setWeekStart(mondayOf(today));
    setMiniCalendarResetKey((key) => key + 1);
  };
  const [rsvp, setRsvp] = usePersistentState(STORAGE_KEYS.rsvp, createInitialRsvp()); // `${groupId}:${personId}` -> 'yes' | 'no'
  const [showAdmin, setShowAdmin] = useState(false);
  const [companySettings, setCompanySettings] = usePersistentState(
    STORAGE_KEYS.companySettings,
    normalizeCompanySettings(readStored(STORAGE_KEYS.companySettings, DEFAULT_COMPANY_SETTINGS)),
  );
  const [rooms, setRooms] = usePersistentState(STORAGE_KEYS.rooms, ROOMS_BASE);
  const [teams, setTeams] = usePersistentState(STORAGE_KEYS.teams, TEAMS_BASE);
  const [jobs, setJobs] = usePersistentState(STORAGE_KEYS.jobs, JOBS_BASE);

  const showToast = (message, viewDetail) => {
    toastIdRef.current += 1;
    setToast({ message, viewDetail, id: toastIdRef.current });
  };

  const openCreatedMeeting = (viewDetail) => {
    const { meta, title, groupId, personId } = viewDetail;
    setDetail({
      personId,
      ev: {
        title,
        groupId,
        meetingMeta: meta,
        start: meta.start,
        end: meta.end,
        type: "meeting",
        visibility: "public",
      },
    });
    setToast(null);
  };

  const toggleVisible = (id) => setVisibleIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const resetAllCalendarEvents = () => {
    setVisibleIds([ME_ID]);
    setEvents((prev) => people.reduce(
      (acc, person) => (person.id === ME_ID ? acc : regeneratePersonDemoEvents(acc, person)),
      prev,
    ));
  };

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
    setRsvp((prev) => {
      const prefix = `${groupId}:`;
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith(prefix)) delete next[key];
      });
      return next;
    });
  };
  const applyAutoRsvpForCreatedMeeting = (groupId, attendeeIds) => {
    setRsvp((prev) => {
      const next = { ...prev };
      attendeeIds.forEach((id) => {
        next[`${groupId}:${id}`] = "yes";
      });
      return next;
    });
  };
  const updateEvent = (personId, eventId, patch) => {
    setEvents((prev) => {
      const list = prev[personId] || [];
      const target = list.find((e) => e.id === eventId);
      if (!target) return prev;
      const next = { ...prev };
      if (target.groupId) {
        Object.keys(prev).forEach((id) => {
          next[id] = prev[id].map((e) => (e.groupId === target.groupId ? { ...e, ...patch } : e));
        });
      } else {
        next[personId] = list.map((e) => (e.id === eventId ? { ...e, ...patch } : e));
      }
      return next;
    });
  };
  const updateMeetingGroup = (groupId, { title, start, end, requiredIds, optionalIds, room, checkpoints, attendeeIds }) => {
    const sharedMeta = {
      requiredIds,
      optionalIds,
      room,
      start,
      end,
    };
    const eventPayloadBase = {
      title,
      start,
      end,
      visibility: "public",
      type: "meeting",
      movable: false,
      room,
    };
    const attendeeSet = new Set(attendeeIds);

    setEvents((prev) => {
      const next = { ...prev };
      Object.keys(prev).forEach((personId) => {
        next[personId] = (prev[personId] || []).filter(
          (event) => event.groupId !== groupId || attendeeSet.has(personId),
        );
      });
      attendeeIds.forEach((personId) => {
        const meetingMeta = {
          ...sharedMeta,
          checkpoints: personId === ME_ID ? (checkpoints ?? []) : [],
        };
        const eventPayload = { ...eventPayloadBase, meetingMeta };
        const existing = (next[personId] || []).find((event) => event.groupId === groupId);
        if (existing) {
          next[personId] = next[personId].map((event) => (
            event.groupId === groupId ? { ...event, ...eventPayload } : event
          ));
        } else {
          next[personId] = [...(next[personId] || []), { ...eventPayload, id: `${groupId}-${personId}`, groupId }];
        }
      });
      return next;
    });

    setRsvp((prev) => {
      const prefix = `${groupId}:`;
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith(prefix) && !attendeeSet.has(key.slice(prefix.length))) {
          delete next[key];
        }
      });
      attendeeIds.forEach((id) => {
        if (!next[`${groupId}:${id}`]) next[`${groupId}:${id}`] = "yes";
      });
      return next;
    });
  };
  const openMeetingEditor = (groupId, meta, title) => {
    setDetail(null);
    openWizard(wizardFromMeeting(groupId, title, meta));
  };
  const saveMeetingFromWizard = ({
    editGroupId,
    title,
    start,
    end,
    requiredIds,
    optionalIds,
    room,
    checkpoints,
  }) => {
    const attendeeIds = [...requiredIds, ...optionalIds];
    const meetingMeta = { requiredIds, optionalIds, room, checkpoints: checkpoints ?? [], start, end };
    if (editGroupId) {
      updateMeetingGroup(editGroupId, {
        title,
        start,
        end,
        requiredIds,
        optionalIds,
        room,
        checkpoints,
        attendeeIds,
      });
      return { groupId: editGroupId, meta: meetingMeta, title, personId: ME_ID };
    }
    const groupId = `mtg-${Date.now()}`;
    setEvents((prev) => {
      const next = { ...prev };
      const sharedMeta = { requiredIds, optionalIds, room, start, end };
      attendeeIds.forEach((personId) => {
        const meetingMeta = {
          ...sharedMeta,
          checkpoints: personId === ME_ID ? (checkpoints ?? []) : [],
        };
        next[personId] = [...(next[personId] || []), {
          title,
          start,
          end,
          visibility: "public",
          type: "meeting",
          movable: false,
          room,
          meetingMeta,
          id: `${groupId}-${personId}`,
          groupId,
        }];
      });
      return next;
    });
    applyAutoRsvpForCreatedMeeting(groupId, attendeeIds);
    return { groupId, meta: meetingMeta, title, personId: ME_ID };
  };
  const openBlockingEventFromCheckpoint = (checkpoint, proposal) => {
    const resolved = resolveCheckpointBlockingEvent(checkpoint, events);
    if (!resolved) return;
    const owner = people.find((p) => p.id === resolved.personId);
    const coordinationDraft = proposal && owner && wizard && resolved.personId !== ME_ID
      ? buildCoordinationDraftMessage({
        ownerFullName: owner.name,
        blockingTitle: resolved.event.title,
        blockingStart: toDate(resolved.event.start),
        blockingEnd: toDate(resolved.event.end),
        proposedTitle: proposal.proposedTitle,
        proposedStart: proposal.proposedStart,
        proposedEnd: proposal.proposedEnd,
      })
      : undefined;
    setDetail({
      personId: resolved.personId,
      ev: resolved.event,
      allowReschedule: true,
      coordinationDraft,
    });
  };

  const weekRangeEnd = showWeekend ? addDays(weekStart, 6) : addDays(weekStart, CALENDAR_WEEKDAY_COUNT - 1);
  const weekRangeLabel = `${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 - ${weekRangeEnd.getMonth() + 1}월 ${weekRangeEnd.getDate()}일`;

  return (
    <div style={{ fontFamily: FONT, color: C.ink900, background: C.white, display: "flex", flexDirection: "column", width: "100%", minWidth: 0, height: "100%", overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 44, alignItems: "center", flexShrink: 0, minHeight: 36 }}>
        <div style={{ width: SIDEBAR_WIDTH, minWidth: SIDEBAR_WIDTH, flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarCheck2 size={20} color={C.ink900} />
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 21, color: C.ink900 }}>회사 캘린더</span>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 19, color: C.ink900, whiteSpace: "nowrap" }}>{weekRangeLabel}</span>
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              <CalendarWeekNavButton onClick={() => setWeekStart((w) => addDays(w, -7))} aria-label="이전 주">
                <ChevronLeft size={20} color={C.ink600} />
              </CalendarWeekNavButton>
              <CalendarWeekNavButton onClick={() => setWeekStart((w) => addDays(w, 7))} aria-label="다음 주">
                <ChevronRight size={20} color={C.ink600} />
              </CalendarWeekNavButton>
            </div>
            <OutlineSurfaceButton
              onClick={goToToday}
              defaultBackground="transparent"
              style={{
                borderRadius: 8,
                height: 36,
                padding: "8px 12px",
                fontFamily: FONT,
                fontWeight: 500,
                fontSize: 15,
                color: C.ink900,
                flexShrink: 0,
              }}
            >
              오늘
            </OutlineSurfaceButton>
          </div>
          <OutlineSurfaceButton
            data-tour="admin-settings"
            aria-label="관리"
            onClick={() => setShowAdmin(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Settings size={14} color={C.ink500} />
          </OutlineSurfaceButton>
        </div>
      </div>
      <div style={{ display: "flex", gap: 44, flex: 1, minHeight: 0, overflow: "hidden", paddingTop: 24 }}>
        <Sidebar people={people} visibleIds={visibleIds} toggleVisible={toggleVisible} onResetAllCalendars={resetAllCalendarEvents} onCreate={() => openWizard({ step: "quickBase", origin: "toolbar", roomRequired: true })} weekStart={weekStart} onSelectCalendarWeek={selectCalendarWeek} miniCalendarResetKey={miniCalendarResetKey} />
        <CalendarGrid
          people={people} visibleIds={visibleIds} events={events} weekStart={weekStart} showWeekend={showWeekend} rsvp={rsvp} companySettings={companySettings}
          highlightGroupId={highlightGroupId}
          onEmptyClick={(day, hour) => openWizard({
            origin: "calendar",
            dateStr: day,
            startHour: hour,
            endHour: hour + 1,
            durationMinutes: 60,
            durationPreset: "custom",
            attendees: { [ME_ID]: "required" },
          })}
          onEventClick={(personId, ev) => {
            closeWizard();
            setDetail({ personId, ev });
          }}
        />
      </div>

      {wizard && (
        <CreationWizard key={wizardSession} wizard={wizard} setWizard={setWizard} frozenCandidates={frozenRecommendations} setFrozenCandidates={setFrozenRecommendations} stackModalOpen={Boolean(detail)} people={people} jobs={jobs} events={eventsExcludingGroup(events, wizard.editGroupId)} companySettings={companySettings} rooms={rooms} visibleIds={visibleIds} onClose={closeWizard}
          onOpenBlockingEvent={openBlockingEventFromCheckpoint}
          onQuickCreate={(title, dateStr, startHour, durationMinutes, attendeeIds, roomId) => {
            const start = `${dateStr}T${hourToTimeStr(startHour)}:00`;
            const end = toLocalISO(addMin(toDate(start), durationMinutes));
            const room = rooms.find((r) => r.id === roomId);
            const requiredIds = attendeeIds.filter((id) => wizard.attendees[id] === "required");
            const optionalIds = attendeeIds.filter((id) => wizard.attendees[id] === "optional");
            const saved = saveMeetingFromWizard({
              editGroupId: wizard.editGroupId,
              title: title || "새 일정",
              start,
              end,
              requiredIds: requiredIds.length ? requiredIds : attendeeIds,
              optionalIds,
              room,
              checkpoints: [],
            });
            closeWizard();
            pulseCreatedMeeting(saved?.groupId);
            showToast(wizard.editGroupId ? "일정이 수정되었어요." : "일정이 생성되었어요.", saved);
          }}
          onConfirm={(candidate, requiredIds, optionalIds, title) => {
            const saved = saveMeetingFromWizard({
              editGroupId: wizard.editGroupId,
              title,
              start: toLocalISO(candidate.start),
              end: toLocalISO(candidate.end),
              requiredIds,
              optionalIds,
              room: candidate.selectedRoom,
              checkpoints: candidate.checkpoints,
            });
            closeWizard();
            pulseCreatedMeeting(saved?.groupId);
            showToast(wizard.editGroupId ? "일정이 수정되었어요." : "일정이 생성되었어요.", saved);
          }} />
      )}

      {detail && (
        detail.ev.meetingMeta ? (
          <ConfirmedDetailModal personId={detail.personId} data={{ meta: detail.ev.meetingMeta, title: detail.ev.title, groupId: detail.ev.groupId }} people={people} onClose={() => setDetail(null)}
            overlayZIndex={wizard ? 70 : 55}
            onEdit={detail.personId === ME_ID ? () => openMeetingEditor(detail.ev.groupId, detail.ev.meetingMeta, detail.ev.title) : undefined}
            onDelete={detail.personId === ME_ID ? () => { deleteMeetingGroup(detail.ev.groupId); setDetail(null); } : undefined}
            rsvp={rsvp} setRsvp={setRsvp} />
        ) : (
          <EventDetailModal
            personId={detail.personId}
            ev={detail.ev}
            people={people}
            events={events}
            jobs={jobs}
            allowReschedule={detail.allowReschedule}
            coordinationDraft={detail.coordinationDraft}
            overlayZIndex={wizard ? 70 : 55}
            onReschedule={(patch) => {
              updateEvent(detail.personId, detail.ev.id, patch);
              setDetail(null);
              if (detail.allowReschedule && detail.personId === ME_ID) {
                showToast("일정을 변경했어요.");
              }
            }}
            onClose={() => setDetail(null)}
            onCopySuggestion={() => showToast("텍스트를 복사했어요.")}
            onDelete={() => {
              if (detail.ev.groupId) deleteMeetingGroup(detail.ev.groupId);
              else setEvents((prev) => ({ ...prev, [detail.personId]: prev[detail.personId].filter((e) => e.id !== detail.ev.id) }));
              setDetail(null);
              if (detail.allowReschedule && detail.personId === ME_ID) {
                showToast("일정을 삭제했어요.");
              }
            }}
          />
        )
      )}

      {toast && (
        <ToastBanner
          key={toast.id}
          message={toast.message}
          viewDetail={toast.viewDetail}
          onDismiss={() => setToast(null)}
          onViewDetail={() => openCreatedMeeting(toast.viewDetail)}
        />
      )}

      {showAdmin && (
        <AdminPanel
          people={people}
          setPeople={setPeople}
          setEvents={setEvents}
          jobs={jobs}
          setJobs={setJobs}
          companySettings={companySettings}
          setCompanySettings={setCompanySettings}
          rooms={rooms}
          setRooms={setRooms}
          teams={teams}
          setTeams={setTeams}
          towers={TOWERS}
          meId={ME_ID}
          colorPalette={COLOR_PALETTE}
          icons={{ Trash2, Plus }}
          Avatar={Avatar}
          normalizeCompanySettings={normalizeCompanySettings}
          timeStrToHour={timeStrToHour}
          onClose={() => setShowAdmin(false)}
        />
      )}
    </div>
  );
}

/* ---------- Sidebar (미니 캘린더 + 캘린더 목록) ---------- */

const MINI_CALENDAR_CELL = 34;
const SIDEBAR_WIDTH = MINI_CALENDAR_CELL * 7;

function MiniMonthDay({ day, isWeekend, isToday, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        border: "none",
        margin: 0,
        width: MINI_CALENDAR_CELL,
        height: MINI_CALENDAR_CELL,
        boxSizing: "border-box",
        padding: 0,
        background: "transparent",
        cursor: "pointer",
        fontFamily: FONT,
        fontSize: 15,
        fontWeight: isToday ? 700 : 500,
        color: isToday ? C.blue : isWeekend ? C.ink400 : C.ink900,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: "20px",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 28,
          height: 28,
          borderRadius: 8,
          background: hover ? C.bg2 : "transparent",
          pointerEvents: "none",
          transition: "background 0.15s ease",
        }}
      />
      <span style={{ position: "relative" }}>{day}</span>
    </button>
  );
}

function MiniMonth({ weekStart, onSelectCalendarWeek, miniCalendarResetKey = 0 }) {
  const [viewMonth, setViewMonth] = useState(() => new Date(weekStart.getFullYear(), weekStart.getMonth(), 1));
  const [navHover, setNavHover] = useState(null);

  React.useEffect(() => {
    setViewMonth(new Date(weekStart.getFullYear(), weekStart.getMonth(), 1));
  }, [weekStart.getFullYear(), weekStart.getMonth()]);

  React.useEffect(() => {
    if (miniCalendarResetKey === 0) return;
    const today = new Date();
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }, [miniCalendarResetKey]);

  const displayYear = viewMonth.getFullYear();
  const displayMonth = viewMonth.getMonth();
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const firstDow = (new Date(displayYear, displayMonth, 1).getDay() + 6) % 7;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const cells = [...Array(firstDow).fill(null), ...days];
  const today = new Date();

  const navBtnStyle = (side) => ({
    border: "none",
    background: navHover === side ? C.bg2 : "none",
    borderRadius: 6,
    width: 24,
    height: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  });

  const miniCalendarGridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(7, ${MINI_CALENDAR_CELL}px)`,
    width: MINI_CALENDAR_CELL * 7,
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 16, color: C.ink900 }}>
          {displayYear}년 {displayMonth + 1}월
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            type="button"
            aria-label="이전 달"
            onClick={() => setViewMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            onMouseEnter={() => setNavHover("left")}
            onMouseLeave={() => setNavHover(null)}
            style={navBtnStyle("left")}
          >
            <ChevronLeft size={14} color={C.ink600} />
          </button>
          <button
            type="button"
            aria-label="다음 달"
            onClick={() => setViewMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            onMouseEnter={() => setNavHover("right")}
            onMouseLeave={() => setNavHover(null)}
            style={navBtnStyle("right")}
          >
            <ChevronRight size={14} color={C.ink600} />
          </button>
        </div>
      </div>
      <div style={{ ...miniCalendarGridStyle, rowGap: 10, fontSize: 11, color: C.ink600, marginBottom: 10 }}>
        {["월", "화", "수", "목", "금", "토", "일"].map((d, i) => (
          <span
            key={d}
            style={{
              width: MINI_CALENDAR_CELL,
              height: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: i >= 5 ? C.ink500 : C.ink600,
            }}
          >
            {d}
          </span>
        ))}
      </div>
      <div style={{ ...miniCalendarGridStyle, rowGap: 6 }}>
        {cells.map((d, i) => {
          if (!d) return <span key={i} aria-hidden="true" style={{ width: MINI_CALENDAR_CELL, height: MINI_CALENDAR_CELL }} />;
          const col = i % 7;
          const isWeekend = col >= 5;
          const isToday = isSameCalendarDay(new Date(displayYear, displayMonth, d), today);
          return (
            <MiniMonthDay
              key={i}
              day={d}
              isWeekend={isWeekend}
              isToday={isToday}
              onClick={() => onSelectCalendarWeek(new Date(displayYear, displayMonth, d))}
            />
          );
        })}
      </div>
    </div>
  );
}

function SidebarCheckbox({ checked, hover, checkedColor = C.ink900 }) {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: 4,
        background: checked ? checkedColor : "none",
        border: checked ? "none" : `1.5px solid ${hover ? C.blue : C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "border-color 0.15s ease",
        flexShrink: 0,
      }}
    >
      {checked && <CalendarCheck size={14} color={C.white} />}
    </div>
  );
}

function CalendarListItem({ person, checked, onToggle }) {
  const [hover, setHover] = useState(false);
  const isMe = person.id === ME_ID;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: "flex", alignItems: "center" }}
    >
      <div
        onClick={onToggle}
        style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", flex: 1, minWidth: 0 }}
      >
        <SidebarCheckbox checked={checked} hover={hover} checkedColor={person.avatarText} />
        <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 15, color: C.ink900 }}>
          {person.name}{isMe ? " (나)" : ""}
        </span>
      </div>
    </div>
  );
}

function Sidebar({ people, visibleIds, toggleVisible, onResetAllCalendars, onCreate, weekStart, onSelectCalendarWeek, miniCalendarResetKey }) {
  const sortedPeople = useMemo(() => {
    const me = people.find((p) => p.id === ME_ID);
    const rest = people.filter((p) => p.id !== ME_ID).sort(sortByKoreanName);
    return me ? [me, ...rest] : rest;
  }, [people]);
  const hasOtherVisible = visibleIds.some((id) => id !== ME_ID);
  return (
    <div style={{ width: SIDEBAR_WIDTH, minWidth: SIDEBAR_WIDTH, flexShrink: 0, display: "flex", flexDirection: "column" }}>
      <PrimaryButton
        data-tour="create-schedule"
        onClick={onCreate}
        style={{
          width: "100%",
          minWidth: "100%",
          maxWidth: "100%",
          height: 48,
          minHeight: 48,
          boxSizing: "border-box",
          alignSelf: "stretch",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: 28,
          padding: "0 16px",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        <Plus size={18} color={C.white} />
        <span style={{ lineHeight: 1 }}>일정 추가하기</span>
      </PrimaryButton>
      <MiniMonth weekStart={weekStart} onSelectCalendarWeek={onSelectCalendarWeek} miniCalendarResetKey={miniCalendarResetKey} />
      <div style={{ marginTop: 40 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 16, color: C.ink900 }}>캘린더 목록</div>
          {hasOtherVisible && (
            <button
              type="button"
              className="calendar-list-reset-btn"
              onClick={onResetAllCalendars}
            >
              초기화
            </button>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sortedPeople.map((p) => (
            <CalendarListItem
              key={p.id}
              person={p}
              checked={visibleIds.includes(p.id)}
              onToggle={() => toggleVisible(p.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Calendar grid ---------- */

function CalendarNowIndicator({ top, variant = "day" }) {
  if (variant === "time") {
    return (
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: top - 5,
          right: -5,
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: CURRENT_TIME_COLOR,
          zIndex: 4,
          pointerEvents: "none",
        }}
      />
    );
  }

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: top - 1,
        left: 0,
        right: 0,
        height: 2,
        background: CURRENT_TIME_COLOR,
        zIndex: 4,
        pointerEvents: "none",
      }}
    />
  );
}

function CalendarWeekNavButton({ onClick, children, ...rest }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: "none",
        background: hover ? C.bg2 : "none",
        borderRadius: 6,
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

function CalendarGrid({ people, visibleIds, events, weekStart, showWeekend, rsvp, companySettings, highlightGroupId, onEmptyClick, onEventClick }) {
  const hours = [];
  for (let h = 0; h <= 23; h++) hours.push(h);
  const hourText = (h) => (h < 12 ? `오전 ${h === 0 ? 12 : h}시` : `오후 ${h === 12 ? 12 : h - 12}시`);
  const scrollRef = React.useRef(null);
  const didInitialScrollRef = React.useRef(false);
  const now = useNowMinute();

  React.useEffect(() => {
    if (!scrollRef.current || didInitialScrollRef.current) return;
    const el = scrollRef.current;
    el.scrollTop = getCalendarInitialScrollTop(new Date(), companySettings);
    didInitialScrollRef.current = true;
  }, [companySettings.commuteIn, companySettings.commuteOut]);

  const displayDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const displayDays = displayDates.map(dateOnlyStr);
  const todayStr = getDemoTodayStr();
  const nowTop = getTimeOfDayTop(now);
  const showNowIndicator = displayDays.includes(todayStr);
  const calendarGridColumns = `${CALENDAR_TIME_COL_WIDTH}px repeat(${CALENDAR_WEEKDAY_COUNT}, minmax(0, 1fr)) ${showWeekend ? "repeat(2, minmax(0, 1fr))" : "0fr 0fr"}`;
  const calendarGridTransition = `grid-template-columns ${CALENDAR_WEEKEND_EXPAND_MS}ms ${CALENDAR_WEEKEND_EXPAND_EASE}`;

  const renderDayHeader = (date, dayIndex) => {
    const isWeekendCol = dayIndex >= CALENDAR_WEEKDAY_COUNT;
    const isToday = isSameCalendarDay(date, new Date());
    return (
      <div
        key={displayDays[dayIndex]}
        style={{
          textAlign: "center",
          paddingTop: 0,
          paddingRight: 0,
          paddingBottom: 16,
          paddingLeft: 0,
          overflow: "hidden",
          opacity: isWeekendCol && !showWeekend ? 0 : 1,
          transition: `opacity ${CALENDAR_WEEKEND_EXPAND_MS}ms ease`,
        }}
      >
        <div style={{ fontFamily: FONT, fontSize: 17, color: isToday ? C.blue : isWeekendCol ? C.ink400 : C.ink500, marginBottom: 4 }}>{DAY_LABEL[dayIndex]}</div>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 25, color: isToday ? C.blue : isWeekendCol ? C.ink400 : C.ink900 }}>{date.getDate()}</div>
      </div>
    );
  };

  const renderDayColumn = (day, dayIndex) => {
    const isWeekendCol = dayIndex >= CALENDAR_WEEKDAY_COUNT;
    return (
      <div
        key={day}
        style={{
          position: "relative",
          borderLeft: `1px solid ${C.bg2}`,
          minHeight: CALENDAR_BODY_HEIGHT,
          overflow: "hidden",
          opacity: isWeekendCol && !showWeekend ? 0 : 1,
          pointerEvents: isWeekendCol && !showWeekend ? "none" : "auto",
          transition: `opacity ${CALENDAR_WEEKEND_EXPAND_MS}ms ease`,
        }}
      >
        {/* 비선호 시간 배경 밴드 (회사 공통 설정 기반 위치) */}
        <div style={{ position: "absolute", top: companySettings.lunchStart * HOUR_HEIGHT, height: (companySettings.lunchEnd - companySettings.lunchStart) * HOUR_HEIGHT, left: 0, right: 0, background: "rgba(17,24,39,0.02)", pointerEvents: "none" }}>
          <div style={{ padding: 8, fontSize: 13, color: C.ink500, fontFamily: FONT }}>점심</div>
        </div>
        <div style={{ position: "absolute", top: companySettings.commuteOut * HOUR_HEIGHT, height: HOUR_HEIGHT, left: 0, right: 0, background: "rgba(17,24,39,0.02)", pointerEvents: "none" }}>
          <div style={{ padding: 8, fontSize: 13, color: C.ink500, fontFamily: FONT }}>퇴근</div>
        </div>
        <div style={{ position: "absolute", top: (companySettings.commuteOut + 1) * HOUR_HEIGHT, height: (24 - companySettings.commuteOut - 1) * HOUR_HEIGHT, left: 0, right: 0, background: "rgba(17,24,39,0.02)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, height: companySettings.commuteIn * HOUR_HEIGHT, left: 0, right: 0, background: "rgba(17,24,39,0.02)", pointerEvents: "none" }}>
          <div style={{ padding: 8, fontSize: 13, color: C.ink500, fontFamily: FONT }}>출근</div>
        </div>

        {hours.map((h) => (
          <div key={h} onClick={() => onEmptyClick(day, h)} style={{ height: HOUR_HEIGHT, borderBottom: `1px solid ${C.bg2}`, cursor: "pointer", position: "relative", zIndex: 1 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = HOVER_OVERLAY; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }} />
        ))}

        {day === todayStr && showNowIndicator && <CalendarNowIndicator top={nowTop} />}

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
            const accent = person.avatarText;
            let bg = accent;
            let textColor = C.white;
            let secondaryColor = C.white;
            let border = "none";
            let boxShadow = "none";
            let strike = false;
            if (isConfirmedMeeting) {
              if (rsvpStatus === "yes") {
                // 면 타입 — 진한 컬러 유지
              } else if (rsvpStatus === "no") {
                bg = C.bg2;
                textColor = C.ink400;
                secondaryColor = C.ink400;
                strike = true;
              } else {
                // 라인 타입 — RSVP 미응답
                bg = C.white;
                textColor = C.ink900;
                secondaryColor = C.ink500;
                border = `1px solid ${accent}`;
              }
            }
            const isFillType = !isConfirmedMeeting || rsvpStatus === "yes";
            if (isFillType) {
              boxShadow = `inset 0 0 0 1px ${C.white}`;
            }
            const isRevealing = Boolean(highlightGroupId && ev.groupId === highlightGroupId);
            const revealClass = isRevealing
              ? (isFillType ? "calendar-event-reveal--fill" : "calendar-event-reveal--line")
              : undefined;

            return (
              <div
                key={ev.id}
                className={revealClass}
                onClick={(evt) => { evt.stopPropagation(); onEventClick(personId, ev); }}
                style={{
                  position: "absolute", top, left: 4 + offset, right: 4, height, zIndex: isRevealing ? 5 : 3, cursor: "pointer",
                  background: isRevealing && isFillType ? C.white : bg,
                  border: isRevealing && !isFillType ? `1px solid transparent` : border,
                  boxShadow, borderRadius: 8, padding: border === "none" ? 8 : 6, overflow: "hidden",
                  boxSizing: "border-box",
                  ...(isRevealing ? {
                    "--event-reveal-bg": bg,
                    "--event-reveal-accent": accent,
                  } : null),
                }}
              >
                <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: isCompact ? "row" : "column", alignItems: isCompact ? "center" : "stretch", gap: isCompact ? 6 : 0, minWidth: 0 }}>
                  <div
                    className={isRevealing && isFillType ? "calendar-event-reveal-title" : undefined}
                    style={{
                      fontFamily: FONT,
                      fontSize: 13,
                      fontWeight: 500,
                      color: isRevealing && isFillType ? C.ink900 : textColor,
                      flexShrink: 0,
                      textDecoration: strike ? "line-through" : "none",
                    }}
                  >
                    {ev.title}
                  </div>
                  <div
                    className={isRevealing && isFillType ? "calendar-event-reveal-sub" : undefined}
                    style={{
                      fontFamily: FONT,
                      fontSize: 13,
                      color: isRevealing && isFillType ? C.ink500 : secondaryColor,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      minWidth: 0,
                      flex: isCompact ? 1 : undefined,
                    }}
                  >
                    {fmtAmPmRange(s, e)}
                  </div>
                </div>
              </div>
            );
          });
        })}
      </div>
    );
  };

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          transform: showWeekend ? "translateX(-12px)" : "translateX(0)",
          transition: `transform ${CALENDAR_WEEKEND_EXPAND_MS}ms ${CALENDAR_WEEKEND_EXPAND_EASE}`,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: calendarGridColumns,
            flexShrink: 0,
            transition: calendarGridTransition,
          }}
        >
          <div />
          {displayDates.map((date, i) => renderDayHeader(date, i))}
        </div>
        <div
          ref={scrollRef}
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: calendarGridColumns,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            borderTop: `1px solid ${C.border}`,
            transition: calendarGridTransition,
          }}
        >
          <div style={{ minHeight: CALENDAR_BODY_HEIGHT, position: "relative" }}>
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_HEIGHT, fontSize: 13, fontFamily: FONT, fontWeight: 500, color: C.ink500, textAlign: "right", paddingRight: 8, whiteSpace: "nowrap", transform: "translateY(-8px)" }}>
                {hourText(h)}
              </div>
            ))}
            {showNowIndicator && <CalendarNowIndicator top={nowTop} variant="time" />}
          </div>
          {displayDays.map((day, i) => renderDayColumn(day, i))}
        </div>
      </div>
    </div>
  );
}

/* ---------- shared modal shell ---------- */

function WizardExitConfirmDialog({ onCancel, onConfirm, zIndex = 60 }) {
  const [confirmHover, setConfirmHover] = useState(false);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        background: "rgba(17,24,39,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-exit-confirm-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.white,
          borderRadius: 24,
          width: 280,
          maxWidth: "94vw",
          padding: 20,
          boxSizing: "border-box",
        }}
      >
        <div
          id="wizard-exit-confirm-title"
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 17,
            color: C.ink900,
            textAlign: "left",
            lineHeight: 1.4,
          }}
        >
          일정 추가를 그만할까요?
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <SecondaryButton compact onClick={onCancel} style={{ flex: 1, minWidth: 0 }}>닫기</SecondaryButton>
          <button
            type="button"
            onClick={onConfirm}
            onMouseEnter={() => setConfirmHover(true)}
            onMouseLeave={() => setConfirmHover(false)}
            style={{
              flex: 1,
              minWidth: 0,
              background: confirmHover ? "#e5484d" : "#f04452",
              color: C.white,
              border: "none",
              borderRadius: 10,
              height: 42,
              padding: "2px 12px",
              fontFamily: FONT,
              fontWeight: 500,
              fontSize: 17,
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
          >
            그만하기
          </button>
        </div>
      </div>
    </div>
  );
}

const MODAL_FOOTER_DIVIDER_FADE_MS = 200;

function useModalScrollBottomFade(watchKey) {
  const ref = useRef(null);
  const [showDivider, setShowDivider] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || watchKey == null) {
      setShowDivider(false);
      return undefined;
    }

    const update = () => {
      const overflow = el.scrollHeight - el.clientHeight > 1;
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowDivider(overflow && remaining > 1);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    const mo = typeof MutationObserver !== "undefined" ? new MutationObserver(update) : null;
    mo?.observe(el, { childList: true, subtree: true, characterData: true });

    return () => {
      el.removeEventListener("scroll", update);
      ro?.disconnect();
      mo?.disconnect();
    };
  }, [watchKey]);

  return { ref, showDivider };
}

function ModalFooterScrollDivider({ visible }) {
  return (
    <div
      aria-hidden
      style={{
        height: 1,
        flexShrink: 0,
        background: C.border,
        opacity: visible ? 1 : 0,
        transition: `opacity ${MODAL_FOOTER_DIVIDER_FADE_MS}ms ease`,
        pointerEvents: "none",
      }}
    />
  );
}

/** 스크롤 본문 + 하단에 더 있을 때만 버튼 위 디바이더 표시. scrollable=false면 일반 블록. */
function ModalScrollArea({ children, style, watchKey, scrollable = true }) {
  const { ref, showDivider } = useModalScrollBottomFade(scrollable ? watchKey : null);
  if (!scrollable) {
    return <div style={style}>{children}</div>;
  }
  return (
    <>
      <div ref={ref} style={style}>{children}</div>
      <ModalFooterScrollDivider visible={showDivider} />
    </>
  );
}

function Overlay({ children, onClose, width = MODAL_WIDTH, minHeight, height, animateSize = false, disableBackdropClose = false, exitConfirm, zIndex = 50, sideNavLeft = null, sideNavRight = null }) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleBackdropClick = (event) => {
    event.stopPropagation();
    if (disableBackdropClose) {
      if (exitConfirm) setShowExitConfirm(true);
      return;
    }
    onClose?.();
  };

  const modalPanel = (
    <div
      style={{
        background: C.white,
        borderRadius: 24,
        width,
        minHeight: minHeight ?? undefined,
        height: height ?? undefined,
        maxWidth: "94vw",
        maxHeight: "88vh",
        overflow: "hidden",
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        transition:
          animateSize && height != null
            ? `height ${RECOMMEND_MODAL_SIZE_ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1), min-height ${RECOMMEND_MODAL_SIZE_ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1), width ${RECOMMEND_MODAL_SIZE_ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
            : undefined,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );

  return createPortal(
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(17,24,39,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex,
          padding: 16,
        }}
        onClick={handleBackdropClick}
      >
        {sideNavLeft || sideNavRight ? (
          <div
            style={{ display: "flex", alignItems: "center", gap: RECOMMEND_PAGER_GAP, maxWidth: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            {sideNavLeft}
            {modalPanel}
            {sideNavRight}
          </div>
        ) : (
          modalPanel
        )}
      </div>
      {showExitConfirm && exitConfirm && (
        <WizardExitConfirmDialog
          zIndex={zIndex + 10}
          onCancel={() => setShowExitConfirm(false)}
          onConfirm={() => {
            setShowExitConfirm(false);
            exitConfirm.onConfirm?.();
          }}
        />
      )}
    </>,
    document.body,
  );
}
const MODAL_HEADER_INSET = 24;
const MODAL_HEADER_ICON_SIZE = 16;
const MODAL_HEADER_ICON_GAP = 20;
const MODAL_HEADER_ICON_HOVER_SIZE = 24;
const modalHeaderIconBtnStyle = {
  background: "none",
  border: "none",
  padding: 0,
  margin: 0,
  width: MODAL_HEADER_ICON_SIZE,
  height: MODAL_HEADER_ICON_SIZE,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  lineHeight: 0,
};
function ModalHeaderIconButton({ onClick, children, disabled = false, title, ariaLabel, style }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...modalHeaderIconBtnStyle,
        position: "relative",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        overflow: "visible",
        ...style,
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: MODAL_HEADER_ICON_HOVER_SIZE,
          height: MODAL_HEADER_ICON_HOVER_SIZE,
          marginTop: -MODAL_HEADER_ICON_HOVER_SIZE / 2,
          marginLeft: -MODAL_HEADER_ICON_HOVER_SIZE / 2,
          borderRadius: 6,
          background: C.bg2,
          opacity: hover && !disabled ? 1 : 0,
          pointerEvents: "none",
        }}
      />
      <span style={{ position: "relative", zIndex: 1, display: "inline-flex", lineHeight: 0 }}>
        {children}
      </span>
    </button>
  );
}
function ModalCloseButton({ onClick, iconColor = C.ink600, size = 16, anchored = false }) {
  return (
    <ModalHeaderIconButton
      onClick={onClick}
      ariaLabel="닫기"
      style={{
        position: anchored ? "absolute" : "relative",
        top: anchored ? MODAL_HEADER_INSET : undefined,
        right: anchored ? MODAL_HEADER_INSET : undefined,
        zIndex: anchored ? 5 : undefined,
      }}
    >
      <X size={size} color={iconColor} />
    </ModalHeaderIconButton>
  );
}
function PanelHeader({ title, onClose, showClose = true }) {
  return (
    <div style={{ position: "relative", padding: `${MODAL_HEADER_INSET}px ${MODAL_HEADER_INSET}px 20px ${MODAL_HEADER_INSET}px` }}>
      <span className="panel-header-title">{title}</span>
      {showClose && <ModalCloseButton onClick={onClose} anchored />}
    </div>
  );
}
function PanelHeaderWithActions({ title, onClose, onDelete, onEdit, editDisabled = false }) {
  const actionBarWidth = MODAL_HEADER_ICON_SIZE * 3 + MODAL_HEADER_ICON_GAP * 2;
  return (
    <div style={{ position: "relative", padding: `${MODAL_HEADER_INSET}px ${MODAL_HEADER_INSET}px 20px ${MODAL_HEADER_INSET}px` }}>
      <span className="panel-header-title" style={{ display: "block", paddingRight: actionBarWidth }}>{title}</span>
      <div style={{ position: "absolute", top: MODAL_HEADER_INSET, right: MODAL_HEADER_INSET, display: "flex", alignItems: "center", gap: MODAL_HEADER_ICON_GAP, height: MODAL_HEADER_ICON_SIZE }}>
        <ModalHeaderIconButton onClick={onDelete} ariaLabel="삭제">
          <Trash2 size={MODAL_HEADER_ICON_SIZE} color={C.ink500} />
        </ModalHeaderIconButton>
        {onEdit ? (
          <ModalHeaderIconButton onClick={onEdit} disabled={editDisabled} ariaLabel="수정">
            <Pencil size={MODAL_HEADER_ICON_SIZE} color={C.ink500} />
          </ModalHeaderIconButton>
        ) : (
          <ModalHeaderIconButton disabled title="수정 기능은 준비 중이에요" ariaLabel="수정">
            <Pencil size={MODAL_HEADER_ICON_SIZE} color={C.ink500} />
          </ModalHeaderIconButton>
        )}
        <ModalHeaderIconButton onClick={onClose} ariaLabel="닫기">
          <X size={MODAL_HEADER_ICON_SIZE} color={C.ink600} />
        </ModalHeaderIconButton>
      </div>
    </div>
  );
}

function UnderlineEventButton({ children, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "none",
        border: "none",
        color: hover ? C.ink500 : C.ink900,
        fontFamily: FONT,
        fontWeight: 400,
        fontSize: 15,
        lineHeight: "20px",
        textDecoration: "underline",
        textUnderlineOffset: 2,
        cursor: "pointer",
        padding: 0,
        margin: 0,
        transition: "color 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}

function CheckpointTitleDescription({ checkpoint, checked = false, lineHeight = `${REFERENCE_CHECKPOINT_ROW_HEIGHT}px` }) {
  const textColor = checked ? C.ink400 : C.ink900;
  const descColor = checked ? C.ink400 : C.ink800;
  const strike = checked ? "line-through" : "none";

  return (
    <div style={{ fontFamily: FONT, fontSize: 15, color: textColor, lineHeight, fontWeight: 400 }}>
      {checkpoint.title ? (
        <>
          <span style={{ fontWeight: 500, textDecoration: strike }}>{checkpoint.title}</span>
          {checkpoint.description ? (
            <span style={{ marginLeft: 6, color: descColor, fontWeight: 400, textDecoration: strike }}>{checkpoint.description}</span>
          ) : null}
        </>
      ) : (
        <span style={{ textDecoration: strike }}>{checkpoint.description}</span>
      )}
    </div>
  );
}

function ReferenceCheckpointRow({ checkpoint }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
      <span
        style={{
          width: 16,
          height: REFERENCE_CHECKPOINT_ROW_HEIGHT,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <CheckpointDot size={16} color={C.ink500} />
      </span>
      <div style={{ fontFamily: FONT, fontSize: 15, color: C.ink900, lineHeight: `${REFERENCE_CHECKPOINT_ROW_HEIGHT}px` }}>
        <span style={{ fontWeight: 500 }}>{checkpoint.title}</span>
        {checkpoint.description ? (
          <span style={{ fontWeight: 400, marginLeft: 6, color: C.ink800 }}>{checkpoint.description}</span>
        ) : null}
      </div>
    </div>
  );
}

function CoordinationCheckpointRow({ checkpoint, onOpenBlockingEvent }) {
  const eventTitle = checkpoint.blockingEventTitle;
  const eventLabel = eventTitle && checkpoint.blockingEventAttendeeCount != null
    ? `${eventTitle} (${checkpoint.blockingEventAttendeeCount}명)`
    : eventTitle;
  const canOpen = eventLabel && onOpenBlockingEvent;

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
      <ExclamationCircle size={16} color={C.ink500} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ fontFamily: FONT, fontSize: 15, color: C.ink900, lineHeight: "20px" }}>
        {canOpen ? (
          <>
            {checkpoint.actorLabel ? `${checkpoint.actorLabel} ` : null}
            <UnderlineEventButton onClick={() => onOpenBlockingEvent(checkpoint)}>
              {eventLabel}
            </UnderlineEventButton>
            {checkpoint.description}
          </>
        ) : (
          <>
            {checkpoint.actorLabel ? `${checkpoint.actorLabel} ` : null}
            <span>{checkpoint.title}</span>
            {checkpoint.description && (
              <span style={{ display: "block", fontSize: 13, color: C.ink600, marginTop: 4, lineHeight: "18px" }}>
                {checkpoint.description}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- (QuickAddModal was merged into the unified CreationWizard) ---------- */

const EVENT_DETAIL_SECTION_GAP = SECTION_GAP;

function EventDetailModal({ personId, ev, people, events, jobs, onClose, onDelete, allowReschedule, onReschedule, coordinationDraft, onCopySuggestion, overlayZIndex = 50 }) {
  const start = toDate(ev.start);
  const end = toDate(ev.end);
  const isOwnEvent = personId === ME_ID;
  const canEditSchedule = isOwnEvent && (allowReschedule || ev.movable || ev.type === "focus");
  const [editing, setEditing] = useState(isOwnEvent && Boolean(allowReschedule));
  const showOwnRescheduleGuide = isOwnEvent && allowReschedule && !editing;
  const [dateStr, setDateStr] = useState(() => dateOnlyStr(start));
  const [startTime, setStartTime] = useState(hourToTimeStr(start.getHours() + start.getMinutes() / 60));
  const [endTime, setEndTime] = useState(hourToTimeStr(end.getHours() + end.getMinutes() / 60));

  const saveReschedule = () => {
    if (!onReschedule) return;
    const nextStartDate = toDate(`${dateStr}T${startTime}:00`);
    const nextEndDate = toDate(`${dateStr}T${endTime}:00`);
    if (nextEndDate <= nextStartDate) return;
    onReschedule({ start: toLocalISO(nextStartDate), end: toLocalISO(nextEndDate) });
  };

  const attendeeIds = useMemo(() => {
    if (ev.meetingMeta) {
      return [
        ...(ev.meetingMeta.requiredIds ?? []),
        ...(ev.meetingMeta.optionalIds ?? []),
      ];
    }
    if (ev.groupId) {
      return people
        .filter((p) => (events[p.id] || []).some((item) => item.groupId === ev.groupId))
        .map((p) => p.id);
    }
    return [personId];
  }, [ev, personId, people, events]);
  const attendeePeople = attendeeIds.map((id) => people.find((p) => p.id === id)).filter(Boolean);
  const room = ev.room ?? ev.meetingMeta?.room;
  const showRoom = ev.type === "meeting" || !!room;

  const copyCoordinationDraft = async (event) => {
    event?.stopPropagation();
    if (!coordinationDraft) return;
    try {
      await navigator.clipboard.writeText(coordinationDraft);
      onCopySuggestion?.();
    } catch {
      onCopySuggestion?.();
    }
  };

  const hasAttendeeSection = attendeePeople.length > 0 && !editing;
  const hasCoordinationSection = Boolean(coordinationDraft && !editing);
  const hasRescheduleGuideSection = showOwnRescheduleGuide && !coordinationDraft;
  const hasFollowingDetailSection = hasAttendeeSection || hasCoordinationSection || hasRescheduleGuideSection;

  return (
    <Overlay onClose={onClose} zIndex={overlayZIndex}>
      {isOwnEvent ? (
        <PanelHeaderWithActions
          title={ev.title}
          onClose={onClose}
          onDelete={onDelete}
          onEdit={canEditSchedule ? () => setEditing((v) => !v) : undefined}
        />
      ) : (
        <PanelHeader title={ev.title} onClose={onClose} />
      )}
      <div style={{ padding: `0 24px ${hasFollowingDetailSection ? 0 : 24}px`, display: "flex", flexDirection: "column", gap: 10 }}>
        {!editing ? (
          <>
            <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 15, color: C.ink900 }}>
              <CalendarCheck2 size={16} color={C.ink500} /> {fmtDate(start)}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 15, color: C.ink900 }}>
              <Clock size={16} color={C.ink500} /> {fmtAmPmRange(start, end, " - ")}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: FONT, fontSize: 14, color: C.ink600 }}>
              날짜
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                style={{ height: 40, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0 12px", fontFamily: FONT, fontSize: 15, color: C.ink900 }}
              />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: FONT, fontSize: 14, color: C.ink600 }}>
                시작
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{ height: 40, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0 12px", fontFamily: FONT, fontSize: 15, color: C.ink900 }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: FONT, fontSize: 14, color: C.ink600 }}>
                종료
                <input
                  type="time"
                  value={endTime}
                  min={startTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{ height: 40, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0 12px", fontFamily: FONT, fontSize: 15, color: C.ink900 }}
                />
              </label>
            </div>
          </div>
        )}
        {showRoom && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 15, color: C.ink900 }}>
            <MapPin size={16} color={C.ink500} />
            {room ? `${roomLabel(room)} (${room.capacity}인)` : "회의실 없음"}
          </div>
        )}
      </div>

      {editing && canEditSchedule && (
        <div style={{ padding: "0 24px 24px", borderTop: `1px solid ${C.bg2}` }}>
          <PrimaryButton compact onClick={saveReschedule} style={{ width: "100%" }}>일정 저장</PrimaryButton>
        </div>
      )}

      {hasAttendeeSection && (
        <div style={{ padding: `${EVENT_DETAIL_SECTION_GAP}px 24px ${hasCoordinationSection || hasRescheduleGuideSection ? 0 : 48}px` }}>
          <div className="modal-section-label" style={{ marginBottom: 12, color: C.ink900 }}>참석자</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 16px" }}>
            {attendeePeople.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar person={p} />
                <PersonMeta
                  name={p.name}
                  team={p.team}
                  roleShort={resolveJobShort(jobs, p.role)}
                  isHost={p.id === personId}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {hasCoordinationSection && (
        <div style={{ padding: `${EVENT_DETAIL_SECTION_GAP}px 24px 48px` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.ink900 }}>이렇게 보내보세요</div>
            <button
              type="button"
              aria-label="메시지 복사"
              onClick={copyCoordinationDraft}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                margin: 0,
                cursor: "pointer",
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 500,
                color: C.ink600,
                lineHeight: "18px",
              }}
            >
              <Copy size={12} />
              복사
            </button>
          </div>
          <div
            style={{
              marginTop: 12,
              borderRadius: 10,
              background: C.gray100,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: C.ink900, wordBreak: "keep-all" }}>
              {coordinationDraft}
            </div>
          </div>
        </div>
      )}

      {hasRescheduleGuideSection && (
        <div style={{ padding: `${EVENT_DETAIL_SECTION_GAP}px 24px 48px` }}>
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.ink900 }}>일정을 옮겨 보세요</div>
          <div
            style={{
              marginTop: 12,
              borderRadius: 10,
              background: C.gray100,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: C.ink900, wordBreak: "keep-all" }}>
              겹치는 일정을 다른 시간으로 옮기면 추천 후보와 맞출 수 있어요.
            </div>
          </div>
          <PrimaryButton compact onClick={() => setEditing(true)} style={{ marginTop: 16, width: "100%" }}>
            일정 변경
          </PrimaryButton>
        </div>
      )}
    </Overlay>
  );
}

/* ---------- Creation wizard ---------- */

const roomLabel = (r) => `${r.tower} ${r.name}`;

function formatScheduleLabel(dateStr, startHour, durationMinutes, endHour) {
  const d = toDate((dateStr || getDemoTodayStr()) + "T00:00:00");
  const datePart = `${d.getMonth() + 1}월 ${d.getDate()}일`;
  if (startHour == null || endHour == null) {
    return `${datePart} · 시간 선택`;
  }
  return `${datePart} ${hourToTimeStr(startHour)}~${hourToTimeStr(endHour)}`;
}
const fieldButtonStyle = { height: 46, borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, background: C.white, cursor: "pointer", width: "100%", boxSizing: "border-box", fontFamily: FONT };

function wizardTitleInputStyle() {
  return {
    height: 46,
    borderRadius: 10,
    padding: "8px 12px",
    fontFamily: FONT,
    fontWeight: 500,
    fontSize: 17,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };
}

function wizardDetailsRevealStyle(revealed) {
  const sectionGap = SECTION_GAP;
  // 추천 조건 설정 호버 등이 모달 패딩 쪽으로 8px 나가도 레이아웃(텍스트 기준선)은 유지
  const hoverBleedX = 8;
  return {
    display: "flex",
    flexDirection: "column",
    gap: sectionGap,
    marginTop: revealed ? sectionGap : 0,
    marginLeft: -hoverBleedX,
    marginRight: -hoverBleedX,
    paddingLeft: hoverBleedX,
    paddingRight: hoverBleedX,
    overflow: "hidden",
    maxHeight: revealed ? WIZARD_DETAILS_REVEAL_MAX : 0,
    opacity: revealed ? 1 : 0,
    transform: revealed ? "translateY(0)" : "translateY(16px)",
    transition: WIZARD_DETAILS_REVEAL_TRANSITION,
    pointerEvents: revealed ? "auto" : "none",
  };
}

function FieldNavButton({ onClick, children }) {
  return (
    <button
      type="button"
      className="wizard-outline-control"
      onClick={onClick}
      style={fieldButtonStyle}
    >
      {children}
    </button>
  );
}

function applyWizardTitleChange(wizard, title, companySettings) {
  const defaults = getOccasionScheduleDefaults(title, companySettings, wizard.durationMinutes);
  const next = { ...wizard, title };
  // 점심/회식 제목이면 회의실만 자동 해제. 시간 자동 설정은 하지 않음.
  if (defaults.occasion !== "default") {
    next.roomRequired = false;
    next.forcedRoomId = null;
  }
  return next;
}

function CreationWizard({ wizard, setWizard, frozenCandidates: frozenCandidatesProp, setFrozenCandidates: setFrozenCandidatesProp, stackModalOpen = false, people, jobs, events, companySettings, rooms, visibleIds, onClose, onConfirm, onQuickCreate, onOpenBlockingEvent }) {
  const [index, setIndex] = useState(0);
  const pinnedCandidateKeyRef = React.useRef(null);
  const [frozenCandidatesFallback, setFrozenCandidatesFallback] = useState(null);
  const frozenCandidates = setFrozenCandidatesProp ? frozenCandidatesProp : frozenCandidatesFallback;
  const setFrozenCandidatesState = setFrozenCandidatesProp ?? setFrozenCandidatesFallback;
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [loadingStepPhase, setLoadingStepPhase] = useState("working");
  const [loadingExiting, setLoadingExiting] = useState(false);
  const [headerRevealed, setHeaderRevealed] = useState(false);
  const [resultsEntering, setResultsEntering] = useState(false);
  const [searchActiveIndex, setSearchActiveIndex] = useState(-1);
  const [selectedRoomByCandidate, setSelectedRoomByCandidate] = useState({});
  const [pagerHover, setPagerHover] = useState(null);
  const [hoveredAttendeeId, setHoveredAttendeeId] = useState(null);
  const attendeeRowRefs = React.useRef(new Map());
  const detailsRevealed = wizard.basePhase === "details";
  const attendeesSnapshotRef = React.useRef(null);
  const prevWizardStepRef = React.useRef(wizard.step);
  const revealStartedRef = React.useRef(false);
  const recommendationsLockedRef = React.useRef(false);
  const titleInputRef = React.useRef(null);

  const restoreRecommendationsView = React.useCallback(() => {
    recommendationsLockedRef.current = true;
    setLoadingExiting(true);
    setHeaderRevealed(true);
    setResultsEntering(true);
    revealStartedRef.current = true;
    setWizard((w) => {
      if (w == null) return w;
      return w.step === 3 && w.recommendationsReady
        ? w
        : { ...w, step: 3, returnToRecommendations: false, recommendationsReady: true };
    });
  }, [setWizard]);

  React.useLayoutEffect(() => {
    if (wizard.step !== 3 || !wizard.recommendationsReady) return;
    if (headerRevealed && resultsEntering && loadingExiting) {
      recommendationsLockedRef.current = true;
      return;
    }
    restoreRecommendationsView();
  }, [wizard.step, wizard.recommendationsReady, headerRevealed, resultsEntering, loadingExiting, restoreRecommendationsView]);

  React.useEffect(() => {
    if (wizard.step === "attendees" && prevWizardStepRef.current !== "attendees") {
      attendeesSnapshotRef.current = { ...wizard.attendees };
    }
    prevWizardStepRef.current = wizard.step;
  }, [wizard.step, wizard.attendees]);

  React.useEffect(() => {
    if (wizard.step !== "quickBase" && wizard.step !== "base") return;
    if (detailsRevealed) return;
    const timer = window.setTimeout(() => titleInputRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [wizard.step, detailsRevealed]);

  const backFromAttendees = () => {
    setWizard(returnToBaseWizard(wizard, {
      attendees: attendeesSnapshotRef.current ? { ...attendeesSnapshotRef.current } : wizard.attendees,
      search: "",
    }));
  };

  const requiredIds = Object.keys(wizard.attendees).filter((id) => wizard.attendees[id] === "required");
  const optionalIds = Object.keys(wizard.attendees).filter((id) => wizard.attendees[id] === "optional");
  const attendeeCountAll = Object.keys(wizard.attendees).length;
  const isSoloAttendee = attendeeCountAll === 1 && Boolean(wizard.attendees[ME_ID]);
  const roomRequired = wizard.roomRequired !== false;
  const avoidSoftTimes = wizard.avoidSoftTimes !== false;
  const meetingOccasion = inferMeetingOccasion(wizard.title || "");
  const loadingStepCount = getAiLoadingStepCount({
    soloOnly: isSoloAttendee,
    roomRequired,
    avoidSoftTimes,
    occasion: meetingOccasion,
  });

  const normalizedCompanySettings = useMemo(
    () => normalizeCompanySettings(companySettings),
    [companySettings],
  );

  const resolvedDurationMinutes = wizard.durationMinutes === "custom" && wizard.startHour != null && wizard.endHour != null
    ? Math.max(30, Math.round((wizard.endHour - wizard.startHour) * 60))
    : wizard.durationMinutes;

  const recommendationWeekDays = useMemo(
    () => getRecommendationWeekDays(getDemoTodayStr(), WEEK_DAYS),
    [],
  );

  const request = useMemo(
    () => buildRecommendationRequest({
      title: wizard.title,
      description: wizard.description,
      durationMinutes: resolvedDurationMinutes,
      weekDays: recommendationWeekDays,
      companySettings: normalizedCompanySettings,
      roomRequired: wizard.roomRequired !== false,
      forcedRoomId: wizard.forcedRoomId,
      requiredIds,
      optionalIds,
      people,
      organizerId: ME_ID,
    }),
    [wizard.title, wizard.description, resolvedDurationMinutes, recommendationWeekDays, wizard.roomRequired, wizard.forcedRoomId, requiredIds.join(","), optionalIds.join(","), normalizedCompanySettings, people],
  );

  const inRecommendationFlow = wizard.step === "loading" || wizard.step === 3;

  const candidateGenerationOptions = useMemo(() => ({
    organizerId: ME_ID,
    roomEvents: ROOM_EVENTS,
    fallbackRooms: ROOMS_BASE,
  }), []);

  const buildCandidates = React.useCallback(
    () => generateCandidates(request, people, events, normalizedCompanySettings, rooms, {
      ...candidateGenerationOptions,
      // 현재 시각 이전 슬롯은 추천하지 않음 (출근 시각이 아닌 now 기준)
      notBefore: new Date(),
      softPreferences: {
        avoidSoftTimes: wizard.avoidSoftTimes !== false,
        avoidBusyDays: wizard.avoidBusyDays !== false,
      },
    }),
    [request, people, events, normalizedCompanySettings, rooms, candidateGenerationOptions, wizard.avoidSoftTimes, wizard.avoidBusyDays],
  );

  React.useEffect(() => {
    if (wizard.step === "loading" || wizard.step === 3 || wizard.returnToRecommendations) return;
    setFrozenCandidatesState(null);
  }, [wizard.step, wizard.returnToRecommendations, setFrozenCandidatesState]);

  const candidates = useMemo(() => {
    if (!inRecommendationFlow) return [];
    return frozenCandidates ?? buildCandidates();
  }, [inRecommendationFlow, frozenCandidates, buildCandidates]);
  const attendeeSearchResults = useMemo(() => {
    if (wizard.step !== "attendees") return [];
    return sortAttendeeSearchResults(people, wizard.search || "", visibleIds, [], jobs);
  }, [wizard.step, wizard.search, people, visibleIds, jobs]);
  const current = candidates[Math.min(index, Math.max(0, candidates.length - 1))];
  const handleOpenBlockingEvent = (checkpoint) => {
    if (!onOpenBlockingEvent || !current) return;
    pinnedCandidateKeyRef.current = `${current.start.getTime()}-${current.end.getTime()}`;
    onOpenBlockingEvent(checkpoint, {
      proposedTitle: wizard.title?.trim() || "새 일정",
      proposedStart: current.start,
      proposedEnd: current.end,
    });
  };
  const currentRequiredMet = current ? isRequiredAttendanceMet(current) : true;
  const currentSelectable = current ? isCandidateSelectable(current) : false;
  const candidateCoordinationHint = current ? buildCandidateCoordinationHint(current) : null;
  const candidateCoordinationSection = current ? buildCandidateCoordinationSection(current) : null;
  const referenceCheckpoints = current ? getReferenceCheckpoints(current) : [];
  const currentKey = current ? `${current.start.getTime()}-${current.end.getTime()}` : "";
  const selectedRoomId = current ? (selectedRoomByCandidate[currentKey] || current.selectedRoom?.id) : undefined;
  const currentWithRoom = current ? (() => {
    const selectedRoom = current.availableRooms.find((room) => room.id === selectedRoomId) || current.selectedRoom;
    return {
      ...current,
      selectedRoom,
      roomReason: getRoomAssignmentReasonForCandidate(current, selectedRoom, people, ME_ID) ?? current.roomReason,
    };
  })() : current;
  const displayValidationReasons = useMemo(() => {
    if (!current) return [];
    return buildPositiveValidationReasons({
      ...getValidationReasonInput(current, currentWithRoom?.roomReason),
      pool: candidates,
      occasion: current.occasion,
    });
  }, [current, candidates, currentWithRoom?.roomReason, current?.occasion]);
  const recommendationLayout = useMemo(() => {
    if (!candidates.length || !current) return null;

    const blockHeight = (rowHeight, gap, count) => (
      count <= 0 ? 0 : count * rowHeight + (count - 1) * gap
    );
    const reasonsBlockHeight = (c) => {
      if (buildCandidateCoordinationSection(c)) return 0;
      const reasonCount = buildPositiveValidationReasons({
        ...getValidationReasonInput(c),
        pool: candidates,
        occasion: c.occasion,
      }).length;
      return blockHeight(REASON_ROW_HEIGHT, REASON_ROW_GAP, reasonCount);
    };
    const checkpointBlockHeight = (checkpoints) => referenceCheckpointBlockHeight(checkpoints);
    const coordinationBlockHeight = (c) => {
      const section = buildCandidateCoordinationSection(c);
      if (!section) return 0;
      return (
        COORDINATION_SECTION_MARGIN +
        COORDINATION_SECTION_HEADLINE_HEIGHT +
        COORDINATION_SECTION_GAP +
        blockHeight(COORDINATION_CHECKPOINT_ROW_HEIGHT, CHECKPOINT_ROW_GAP, section.checkpoints.length)
      );
    };

    const getCandidateHeights = (c) => {
      const coordinationH = coordinationBlockHeight(c);
      const reasonsH = reasonsBlockHeight(c);
      const referenceH = checkpointBlockHeight(getReferenceCheckpoints(c));
      const hasCoordination = coordinationH > 0;
      const hasReasons = !hasCoordination && reasonsH > 0;
      const hasReference = referenceH > 0;
      const bodyH =
        coordinationH +
        (hasReasons ? REASON_LIST_MARGIN_TOP + reasonsH : 0) +
        (hasReference ? CHECKPOINT_SECTION_MARGIN + referenceH : 0);
      const roomH = c.requiredRoom ? ROOM_SECTION_MARGIN + ROOM_PICKER_BLOCK_HEIGHT : 0;
      const dateSectionH = getRecommendationDateSectionHeight(Boolean(buildCandidateCoordinationHint(c)));
      return { bodyH, roomH, scrollBelowDateH: bodyH + roomH, dateSectionH };
    };

    const allHeights = candidates.map(getCandidateHeights);
    const maxScrollBelowDateH = Math.max(...allHeights.map((h) => h.scrollBelowDateH));
    const maxDateSectionH = Math.max(...allHeights.map((h) => h.dateSectionH));

    const currentHeights = getCandidateHeights(current);
    const currentCoordinationH = coordinationBlockHeight(current);
    const currentReasonsH = reasonsBlockHeight(current);
    const currentReferenceCheckpointH = checkpointBlockHeight(getReferenceCheckpoints(current));
    const hasCoordinationSection = currentCoordinationH > 0;
    const hasReasonsSection = !hasCoordinationSection && currentReasonsH > 0;
    const hasReferenceSection = currentReferenceCheckpointH > 0;

    const fixedModalHeight =
      RECOMMENDATION_TOP_BAR_HEIGHT +
      maxDateSectionH +
      maxScrollBelowDateH +
      RECOMMENDATION_FOOTER_HEIGHT +
      RECOMMENDATION_HEIGHT_BUFFER;

    return {
      showReferenceSection: hasReferenceSection,
      showCoordinationSection: hasCoordinationSection,
      showReasonsSection: hasReasonsSection,
      showRoomSection: Boolean(current.requiredRoom),
      scrollBelowDateMinHeight: maxScrollBelowDateH,
      scrollContentPad: maxScrollBelowDateH - currentHeights.scrollBelowDateH + (maxDateSectionH - currentHeights.dateSectionH),
      dateSectionMinHeight: undefined,
      dateSectionPad: 0,
      modalHeight: fixedModalHeight,
    };
  }, [candidates, current]);
  const addAttendee = (id) => setWizard((w) => ({ ...w, attendees: { ...w.attendees, [id]: "required" } }));
  const removeAttendee = (id) => setWizard((w) => { const next = { ...w.attendees }; delete next[id]; return { ...w, attendees: next }; });
  const toggleOptional = (id) => setWizard((w) => ({ ...w, attendees: { ...w.attendees, [id]: w.attendees[id] === "optional" ? "required" : "optional" } }));
  const openAttendeesStep = () => setWizard({ ...wizard, step: "attendees", search: "" });

  React.useEffect(() => {
    if (wizard.step !== "attendees") setHoveredAttendeeId(null);
  }, [wizard.step]);

  React.useEffect(() => {
    const hasSearchQuery = Boolean(wizard.search?.trim());
    setSearchActiveIndex(
      attendeeSearchResults.length > 0 && hasSearchQuery ? 0 : -1,
    );
    setHoveredAttendeeId(null);
  }, [wizard.search, visibleIds.join(","), attendeeSearchResults.length]);

  const handleAttendeeSearchKeyDown = React.useCallback((e) => {
    if (wizard.step !== "attendees" || attendeeSearchResults.length === 0) return;
    const hasSearchQuery = Boolean(wizard.search?.trim());
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHoveredAttendeeId(null);
      setSearchActiveIndex((i) => (i < 0 ? 0 : Math.min(attendeeSearchResults.length - 1, i + 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHoveredAttendeeId(null);
      setSearchActiveIndex((i) => {
        if (i <= 0) return hasSearchQuery ? 0 : -1;
        return i - 1;
      });
    } else if (e.key === "Enter") {
      if (searchActiveIndex < 0) return;
      e.preventDefault();
      const person = attendeeSearchResults[searchActiveIndex];
      if (!person) return;
      if (wizard.attendees[person.id]) removeAttendee(person.id);
      else addAttendee(person.id);
    }
  }, [wizard.step, wizard.search, attendeeSearchResults, searchActiveIndex, wizard.attendees]);

  React.useEffect(() => {
    if (wizard.step !== "attendees" || searchActiveIndex < 0) return;
    attendeeRowRefs.current.get(searchActiveIndex)?.scrollIntoView({ block: "nearest" });
  }, [wizard.step, searchActiveIndex, attendeeSearchResults.length]);

  React.useEffect(() => {
    if (wizard.step !== "attendees") return;
    const handler = (e) => {
      if (attendeeSearchResults.length === 0) return;
      if (document.activeElement?.tagName === "INPUT") return;
      handleAttendeeSearchKeyDown(e);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [wizard.step, attendeeSearchResults.length, handleAttendeeSearchKeyDown]);

  const backToRecommendations = restoreRecommendationsView;

  const goToLoading = ({ refresh = false } = {}) => {
    if (!refresh && (wizard.recommendationsReady || recommendationsLockedRef.current) && frozenCandidates) {
      backToRecommendations();
      return;
    }
    if (refresh) {
      recommendationsLockedRef.current = false;
      setWizard((w) => (w == null ? w : { ...w, recommendationsReady: false }));
    }
    setFrozenCandidatesState(buildCandidates());
    setLoadingStepIndex(0);
    setLoadingStepPhase("working");
    setIndex(0);
    setLoadingExiting(false);
    setHeaderRevealed(false);
    setResultsEntering(false);
    revealStartedRef.current = false;
    setWizard((w) => (w == null ? w : { ...w, step: "loading", returnToRecommendations: false }));
  };

  const disableBackdropClose =
    stackModalOpen ||
    wizard.step === "attendees" ||
    wizard.step === "loading" ||
    wizard.step === 3 ||
    Boolean(wizard.returnToRecommendations);
  const wizardExitConfirm = disableBackdropClose ? { onConfirm: onClose } : undefined;

  React.useEffect(() => {
    if (wizard.step === 3 && resultsEntering && frozenCandidates) {
      recommendationsLockedRef.current = true;
    }
  }, [wizard.step, resultsEntering, frozenCandidates]);

  React.useEffect(() => {
    if (wizard.step !== "loading") return;
    if (wizard.returnToRecommendations) return;
    if (wizard.recommendationsReady && frozenCandidates) {
      backToRecommendations();
    }
  }, [wizard.step, wizard.recommendationsReady, wizard.returnToRecommendations, frozenCandidates, backToRecommendations]);

  React.useEffect(() => {
    if (wizard.step !== 3 || !current) return;
    pinnedCandidateKeyRef.current = `${current.start.getTime()}-${current.end.getTime()}`;
  }, [wizard.step, current?.start?.getTime(), current?.end?.getTime()]);

  React.useEffect(() => {
    if (wizard.step !== 3 || !candidates.length || !pinnedCandidateKeyRef.current) return;
    const pinnedIdx = candidates.findIndex(
      (candidate) => `${candidate.start.getTime()}-${candidate.end.getTime()}` === pinnedCandidateKeyRef.current,
    );
    if (pinnedIdx >= 0) {
      setIndex((prev) => (prev === pinnedIdx ? prev : pinnedIdx));
    }
  }, [candidates, wizard.step]);

  React.useEffect(() => {
    if (wizard.step !== "loading" && wizard.step !== 3) {
      setLoadingStepIndex(0);
      setLoadingStepPhase("working");
      setLoadingExiting(false);
      setHeaderRevealed(false);
      setResultsEntering(false);
      revealStartedRef.current = false;
    }
  }, [wizard.step]);

  React.useEffect(() => {
    if (wizard.step !== "loading") return;
    if (recommendationsLockedRef.current && frozenCandidates) return;
    if (loadingStepIndex >= loadingStepCount) return;

    if (loadingStepPhase === "working") {
      const t = setTimeout(() => setLoadingStepPhase("completed"), AI_STEP_ACTIVE_MS);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setLoadingStepIndex((i) => i + 1);
      setLoadingStepPhase("working");
    }, AI_STEP_DONE_HOLD_MS);
    return () => clearTimeout(t);
  }, [wizard.step, loadingStepIndex, loadingStepPhase, loadingStepCount]);

  React.useEffect(() => {
    if (wizard.step !== "loading") return;
    if (recommendationsLockedRef.current && frozenCandidates) return;
    if (loadingStepIndex < loadingStepCount) return;
    if (revealStartedRef.current) return;
    revealStartedRef.current = true;

    const tFade = setTimeout(() => setLoadingExiting(true), AI_RESULTS_DELAY_MS);
    const tHeader = setTimeout(() => setHeaderRevealed(true), AI_RESULTS_DELAY_MS + RECOMMEND_EXIT_MS);
    const tResults = setTimeout(() => {
      setResultsEntering(true);
      setWizard((w) => (w == null ? w : { ...w, step: 3, recommendationsReady: true }));
    }, AI_RESULTS_DELAY_MS + RECOMMEND_EXIT_MS + RECOMMEND_HEADER_MORPH_MS);

    return () => {
      clearTimeout(tFade);
      clearTimeout(tHeader);
      clearTimeout(tResults);
    };
  }, [wizard.step, loadingStepIndex, setWizard, loadingStepCount]);

  React.useEffect(() => {
    if (wizard.step !== "loading") return;
    if (recommendationsLockedRef.current && frozenCandidates) return;
    if (loadingStepIndex < loadingStepCount) return;
    if (headerRevealed && resultsEntering) return;

    const recovery = setTimeout(() => {
      revealStartedRef.current = true;
      setLoadingExiting(true);
      setHeaderRevealed(true);
      setResultsEntering(true);
      setWizard((w) => (
        w == null || w.step !== "loading"
          ? w
          : { ...w, step: 3, recommendationsReady: true }
      ));
    }, AI_RESULTS_DELAY_MS + RECOMMEND_EXIT_MS + RECOMMEND_HEADER_MORPH_MS + 200);

    return () => clearTimeout(recovery);
  }, [wizard.step, loadingStepIndex, headerRevealed, resultsEntering, setWizard, loadingStepCount]);

  React.useEffect(() => {
    const handler = (e) => {
      if (!resultsEntering) return;
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      else if (e.key === "ArrowRight") setIndex((i) => Math.min(candidates.length - 1, i + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [wizard.step, candidates.length, resultsEntering]);

  const scheduleLabel = formatScheduleLabel(wizard.dateStr, wizard.startHour, wizard.durationMinutes, wizard.endHour);

  const isManualSchedule = (
    (wizard.durationPreset === "custom" || wizard.durationMinutes === "custom")
    && wizard.dateStr
    && wizard.startHour != null
    && wizard.endHour != null
  );

  const handleNext = () => {
    if (isManualSchedule) {
      onQuickCreate(
        wizard.title,
        wizard.dateStr,
        wizard.startHour,
        resolvedDurationMinutes,
        Object.keys(wizard.attendees),
        wizard.roomRequired ? wizard.forcedRoomId : null,
      );
      return;
    }
    if (wizard.returnToRecommendations) {
      goToLoading({ refresh: true });
      return;
    }
    if (attendeeCountAll > 0) {
      if (recommendationsLockedRef.current) {
        backToRecommendations();
        return;
      }
      goToLoading();
    }
  };

  const handleBasePrimaryNext = () => {
    if (!wizard.title.trim()) return;
    if (wizard.basePhase !== "details") {
      setWizard({ ...wizard, basePhase: "details" });
      return;
    }
    handleNext();
  };

  const handleBaseFormSubmit = (e) => {
    e.preventDefault();
    if (e.nativeEvent?.isComposing) return;
    handleBasePrimaryNext();
  };

  const preventEnterDuringComposition = (e) => {
    if (e.key === "Enter" && e.nativeEvent?.isComposing) e.preventDefault();
  };

  if (wizard.step === "quickBase") {
    const selectedPeople = people.filter((p) => wizard.attendees[p.id]);
    return (
      <Overlay onClose={onClose} width={MODAL_WIDTH} disableBackdropClose={disableBackdropClose} exitConfirm={wizardExitConfirm}>
        <form onSubmit={handleBaseFormSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, maxHeight: "88vh" }}>
          <div style={{ flexShrink: 0 }}>
            <PanelHeader title={wizard.returnToRecommendations ? "조건 수정" : "어떤 일정을 추가할까요?"} onClose={onClose} showClose={!wizard.returnToRecommendations} />
          </div>
          <ModalScrollArea
            scrollable={detailsRevealed}
            watchKey={`${detailsRevealed}-${wizard.recommendSettingsOpen}-${attendeeCountAll}-${roomRequired}`}
            style={detailsRevealed
              ? { padding: "10px 24px", flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }
              : { padding: "10px 24px", flexShrink: 0 }}
          >
            <Field label="제목">
              <input
                ref={titleInputRef}
                className="wizard-title-input"
                placeholder="일정 이름을 입력해 주세요."
                value={wizard.title}
                onChange={(e) => setWizard(applyWizardTitleChange(wizard, e.target.value, normalizedCompanySettings))}
                onKeyDown={preventEnterDuringComposition}
                style={wizardTitleInputStyle()}
              />
            </Field>
            <div style={wizardDetailsRevealStyle(detailsRevealed)}>
              {detailsRevealed && (
                <>
              <Field label="참석자" labelSuffix={attendeeCountAll >= 2 ? attendeeCountAll : null}>
                <FieldNavButton onClick={openAttendeesStep}>
                  <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 17, color: C.ink500, flex: 1, textAlign: "left" }}>참석자 찾기</span>
                  <Search size={18} color={C.ink500} />
                </FieldNavButton>
                {attendeeCountAll >= 2 && (
                  <div style={{ margin: "20px -8px 0", padding: "0 8px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {selectedPeople.map((p) => (
                        <WizardAttendeeRow
                          key={p.id}
                          person={p}
                          jobs={jobs}
                          isOptional={wizard.attendees[p.id] === "optional"}
                          onToggleOptional={() => toggleOptional(p.id)}
                          onRemove={() => removeAttendee(p.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </Field>
              <Field
                label="소요시간"
                action={(
                  <button
                    type="button"
                    className="wizard-duration-custom-link"
                    onClick={() => {
                      const hasCustomSchedule = wizard.durationPreset === "custom"
                        && wizard.startHour != null
                        && wizard.endHour != null;
                      const schedule = hasCustomSchedule
                        ? {
                          dateStr: wizard.dateStr || getDemoTodayStr(),
                          startHour: wizard.startHour,
                          endHour: wizard.endHour,
                          durationMinutes: wizard.durationMinutes === "custom"
                            ? Math.max(30, Math.round((wizard.endHour - wizard.startHour) * 60))
                            : wizard.durationMinutes,
                        }
                        : getDefaultCustomSchedule();
                      setWizard({
                        ...wizard,
                        ...schedule,
                        durationPreset: "custom",
                        durationRestore: {
                          dateStr: wizard.dateStr,
                          startHour: wizard.startHour,
                          endHour: wizard.endHour,
                          durationMinutes: wizard.durationMinutes,
                          durationPreset: wizard.durationPreset ?? inferDurationPreset(wizard.durationMinutes),
                        },
                        step: "datetime",
                      });
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      margin: 0,
                      flexShrink: 0,
                      fontFamily: FONT,
                      fontWeight: 400,
                      fontSize: 14,
                      fontStyle: "normal",
                      fontSynthesis: "none",
                      color: C.ink500,
                      textDecoration: "underline",
                      textDecorationThickness: 1,
                      textUnderlineOffset: 2,
                      cursor: "pointer",
                      lineHeight: "20px",
                    }}
                  >
                    직접 선택
                  </button>
                )}
              >
                <WizardDurationToggle
                  dateStr={wizard.dateStr}
                  startHour={wizard.startHour}
                  endHour={wizard.endHour}
                  durationMinutes={wizard.durationMinutes}
                  durationPreset={wizard.durationPreset ?? inferDurationPreset(wizard.durationMinutes)}
                  onSelectPreset={(minutes) => {
                    const startHour = wizard.startHour ?? 10;
                    setWizard({
                      ...wizard,
                      durationPreset: minutes,
                      durationMinutes: minutes,
                      startHour,
                      endHour: startHour + minutes / 60,
                    });
                  }}
                  onOpenCustom={() => {
                    const hasCustomSchedule = wizard.durationPreset === "custom"
                      && wizard.startHour != null
                      && wizard.endHour != null;
                    const schedule = hasCustomSchedule
                      ? {
                        dateStr: wizard.dateStr || getDemoTodayStr(),
                        startHour: wizard.startHour,
                        endHour: wizard.endHour,
                        durationMinutes: wizard.durationMinutes === "custom"
                          ? Math.max(30, Math.round((wizard.endHour - wizard.startHour) * 60))
                          : wizard.durationMinutes,
                      }
                      : getDefaultCustomSchedule();
                    setWizard({
                      ...wizard,
                      ...schedule,
                      durationPreset: "custom",
                      durationRestore: {
                        dateStr: wizard.dateStr,
                        startHour: wizard.startHour,
                        endHour: wizard.endHour,
                        durationMinutes: wizard.durationMinutes,
                        durationPreset: wizard.durationPreset ?? inferDurationPreset(wizard.durationMinutes),
                      },
                      step: "datetime",
                    });
                  }}
                  onClearCustom={() => {
                    const startHour = wizard.startHour ?? 10;
                    setWizard({
                      ...wizard,
                      durationPreset: 60,
                      durationMinutes: 60,
                      startHour,
                      endHour: startHour + 1,
                    });
                  }}
                />
              </Field>
              <Field label="회의실">
                <Toggle options={[["필요", true], ["필요없음", false]]} value={roomRequired} onChange={(v) => setWizard({ ...wizard, roomRequired: v, forcedRoomId: v ? wizard.forcedRoomId : null })} />
              </Field>
              <RecommendationSettingsSection wizard={wizard} setWizard={setWizard} />
                </>
              )}
            </div>
          </ModalScrollArea>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "20px 24px 24px", flexShrink: 0 }}>
            {wizard.returnToRecommendations && detailsRevealed && (
              <SecondaryButton compact onClick={backToRecommendations}>취소</SecondaryButton>
            )}
            <PrimaryButton compact type="submit" disabled={!wizard.title.trim()}>
              {wizard.returnToRecommendations && detailsRevealed ? "적용" : "다음"}
            </PrimaryButton>
          </div>
        </form>
      </Overlay>
    );
  }

  if (wizard.step === "base") {
    const roomRequired = wizard.roomRequired !== false;
    return (
      <Overlay onClose={onClose} disableBackdropClose={disableBackdropClose} exitConfirm={wizardExitConfirm}>
        <form onSubmit={handleBaseFormSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, maxHeight: "88vh" }}>
          <div style={{ flexShrink: 0 }}>
            <PanelHeader title={wizard.returnToRecommendations ? "조건 수정" : "어떤 일정을 추가할까요?"} onClose={onClose} showClose={!wizard.returnToRecommendations} />
          </div>
          <ModalScrollArea
            scrollable={detailsRevealed}
            watchKey={`${detailsRevealed}-${attendeeCountAll}-${roomRequired}-${wizard.dateStr}-${wizard.startHour}-${wizard.endHour}`}
            style={detailsRevealed
              ? { padding: "10px 24px", flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }
              : { padding: "10px 24px", flexShrink: 0 }}
          >
            <Field label="제목">
              <input
                ref={titleInputRef}
                className="wizard-title-input"
                placeholder="일정 이름을 입력해 주세요."
                value={wizard.title}
                onChange={(e) => setWizard(applyWizardTitleChange(wizard, e.target.value, normalizedCompanySettings))}
                onKeyDown={preventEnterDuringComposition}
                style={wizardTitleInputStyle()}
              />
            </Field>
            <div style={wizardDetailsRevealStyle(detailsRevealed)}>
              {detailsRevealed && (
                <>
              <Field label="일정">
                <button type="button" className="wizard-outline-control" onClick={() => setWizard({ ...wizard, step: "datetime" })} style={fieldButtonStyle}>
                  <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 17, color: C.black, flex: 1, textAlign: "left" }}>{scheduleLabel}</span>
                  <Search size={18} color={C.ink500} />
                </button>
              </Field>
              <Field label="참석자" labelSuffix={attendeeCountAll >= 2 ? attendeeCountAll : null}>
                <FieldNavButton onClick={openAttendeesStep}>
                  <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 17, color: C.ink500, flex: 1, textAlign: "left" }}>
                    참석자 찾기
                  </span>
                  <Search size={18} color={C.ink500} />
                </FieldNavButton>
                {attendeeCountAll >= 2 && (
                  <div style={{ margin: "20px -8px 0", padding: "0 8px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {people.filter((p) => wizard.attendees[p.id]).map((p) => (
                        <WizardAttendeeRow
                          key={p.id}
                          person={p}
                          jobs={jobs}
                          isOptional={wizard.attendees[p.id] === "optional"}
                          onToggleOptional={() => toggleOptional(p.id)}
                          onRemove={() => removeAttendee(p.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </Field>
              <Field label="회의실">
                <Toggle options={[["필요", true], ["필요없음", false]]} value={roomRequired} onChange={(v) => setWizard({ ...wizard, roomRequired: v, forcedRoomId: v ? wizard.forcedRoomId : null })} />
              </Field>
                </>
              )}
            </div>
          </ModalScrollArea>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "20px 24px 24px", flexShrink: 0 }}>
            {wizard.returnToRecommendations && detailsRevealed && (
              <SecondaryButton compact onClick={backToRecommendations}>취소</SecondaryButton>
            )}
            <PrimaryButton compact type="submit" disabled={!wizard.title.trim()}>
              {wizard.returnToRecommendations && detailsRevealed ? "적용" : "다음"}
            </PrimaryButton>
          </div>
        </form>
      </Overlay>
    );
  }

  if (wizard.step === "datetime") {
    return (
      <WizardDatetimeStep
        wizard={wizard}
        setWizard={setWizard}
        onClose={onClose}
        disableBackdropClose={disableBackdropClose}
        exitConfirm={wizardExitConfirm}
      />
    );
  }

  if (wizard.step === "attendees") {
    const selectedPeople = people
      .filter((p) => wizard.attendees[p.id])
      .sort((a, b) => {
        if (a.id === ME_ID) return -1;
        if (b.id === ME_ID) return 1;
        return sortByKoreanName(a, b);
      });
    const totalAttendeeCount = selectedPeople.length;
    const toggleAttendeeInSearch = (id) => {
      if (wizard.attendees[id]) removeAttendee(id); else addAttendee(id);
    };
    return (
      <Overlay onClose={onClose} minHeight={WIZARD_MODAL_MIN_HEIGHT} height={WIZARD_MODAL_MIN_HEIGHT} disableBackdropClose={disableBackdropClose} exitConfirm={wizardExitConfirm}>
        <PanelHeader title="참석자 추가" onClose={onClose} />
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 24px 0", display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div className="modal-section-label" style={{ color: C.ink900 }}>참석자</div>
              <div className="modal-section-label modal-section-label-accent">{totalAttendeeCount}</div>
            </div>
            <div className="wizard-outline-control" style={{ height: 46, borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, boxSizing: "border-box", background: C.white }}>
              <Search size={18} color={C.ink500} />
              <input
                autoFocus
                className="wizard-search-input"
                placeholder="이름, 팀, 직무명으로 검색"
                value={wizard.search}
                onChange={(e) => setWizard({ ...wizard, search: e.target.value })}
                onKeyDown={handleAttendeeSearchKeyDown}
                style={{ border: "none", outline: "none", fontFamily: FONT, fontWeight: 500, fontSize: 17, color: C.black, flex: 1, minWidth: 0 }}
              />
            </div>
          </div>

          <ModalScrollArea
            watchKey={`${wizard.search}-${attendeeSearchResults.length}-${selectedPeople.length}`}
            style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: selectedPeople.length > 0 ? "12px 24px 16px" : "12px 24px 0" }}
          >
            <div style={{ margin: "0 -8px", padding: "0 8px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {attendeeSearchResults.map((p, rowIndex) => (
                  <AttendeeSearchRow
                    key={p.id}
                    person={p}
                    jobs={jobs}
                    isAdded={!!wizard.attendees[p.id]}
                    isActive={searchActiveIndex >= 0 && rowIndex === searchActiveIndex}
                    isHovered={hoveredAttendeeId === p.id}
                    onHover={() => setHoveredAttendeeId(p.id)}
                    onLeave={() => setHoveredAttendeeId(null)}
                    onToggle={toggleAttendeeInSearch}
                    innerRef={(el) => {
                      if (el) attendeeRowRefs.current.set(rowIndex, el);
                      else attendeeRowRefs.current.delete(rowIndex);
                    }}
                  />
                ))}
              </div>
            </div>
          </ModalScrollArea>
        </div>
        {selectedPeople.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "12px 24px 0", flexShrink: 0 }}>
            {selectedPeople.map((p) => (
              <div key={p.id} style={{ border: `1px solid ${C.border}`, borderRadius: 6, height: 28, padding: "7px 8px", display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: C.ink900, cursor: "pointer" }} onClick={() => removeAttendee(p.id)}>
                {p.name} <X size={13} color={C.ink500} />
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "20px 24px 24px", flexShrink: 0 }}>
          <SecondaryButton compact onClick={backFromAttendees}>이전</SecondaryButton>
          <PrimaryButton compact
            onClick={() => setWizard(returnToBaseWizard(wizard, { search: "" }))}
            style={{ opacity: totalAttendeeCount === 0 ? 0.3 : 1 }}
          >
            {totalAttendeeCount === 0 ? "추가하기" : `${totalAttendeeCount}명 추가`}
          </PrimaryButton>
        </div>
      </Overlay>
    );
  }

  if (wizard.step === "room") {
    return (
      <Overlay onClose={onClose} disableBackdropClose={disableBackdropClose} exitConfirm={wizardExitConfirm}>
        <PanelHeader title="회의실을 선택해 주세요" onClose={onClose} />
        <div style={{ padding: "10px 24px 24px 24px" }}>
          <div style={{ margin: "0 -8px", padding: "0 8px", display: "flex", flexDirection: "column", gap: 4 }}>
            {rooms.map((r) => (
              <RoomListRow
                key={r.id}
                room={r}
                isSelected={wizard.forcedRoomId === r.id}
                isHovered={false}
                onHover={() => {}}
                onLeave={() => {}}
                onSelect={(roomId) => setWizard({ ...wizard, forcedRoomId: wizard.forcedRoomId === roomId ? null : roomId })}
              />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "20px 24px 24px 24px", marginTop: "auto" }}>
          <SecondaryButton compact onClick={() => setWizard(returnToBaseWizard(wizard, { step: "base" }))}>이전</SecondaryButton>
          <PrimaryButton compact onClick={() => setWizard(returnToBaseWizard(wizard, { step: "base" }))}>선택</PrimaryButton>
        </div>
      </Overlay>
    );
  }

  if (wizard.step === "loading" || wizard.step === 3) {
    const recommendPagerBtnStyle = (disabled, side) => ({
      border: `1px solid ${C.gray300}`,
      borderRadius: 9999,
      width: RECOMMEND_PAGER_BTN_SIZE,
      height: RECOMMEND_PAGER_BTN_SIZE,
      padding: 0,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: !disabled && pagerHover === side ? C.bg2 : C.white,
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.35 : 1,
      transition: "background 0.15s ease",
    });

    const modalHeight = headerRevealed
      ? (recommendationLayout?.modalHeight ?? WIZARD_MODAL_MIN_HEIGHT)
      : WIZARD_MODAL_MIN_HEIGHT;
    const modalWidth = headerRevealed ? RECOMMEND_MODAL_WIDTH : MODAL_WIDTH;
    const showRecommendPager = headerRevealed && resultsEntering && candidates.length > 0;

    return (
      <>
      <Overlay
        onClose={onClose}
        width={modalWidth}
        minHeight={WIZARD_MODAL_MIN_HEIGHT}
        height={modalHeight}
        animateSize={headerRevealed && !resultsEntering}
        disableBackdropClose={disableBackdropClose}
        exitConfirm={wizardExitConfirm}
        sideNavLeft={showRecommendPager ? (
          <button
            type="button"
            aria-label="이전 제안"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            onMouseEnter={() => setPagerHover("left")}
            onMouseLeave={() => setPagerHover(null)}
            style={recommendPagerBtnStyle(index === 0, "left")}
          >
            <ChevronLeft size={14} color={C.ink900} />
          </button>
        ) : null}
        sideNavRight={showRecommendPager ? (
          <button
            type="button"
            aria-label="다음 제안"
            onClick={() => setIndex((i) => Math.min(candidates.length - 1, i + 1))}
            disabled={index === candidates.length - 1}
            onMouseEnter={() => setPagerHover("right")}
            onMouseLeave={() => setPagerHover(null)}
            style={recommendPagerBtnStyle(index === candidates.length - 1, "right")}
          >
            <ChevronRight size={14} color={C.ink900} />
          </button>
        ) : null}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
        {/* 로딩 헤더 → 제안 헤더 morph */}
        <div style={{ position: "relative", flexShrink: 0, overflow: "hidden" }}>
          <div
            style={{
              opacity: loadingExiting ? 0 : 1,
              transform: loadingExiting ? "translateY(-14px)" : "translateY(0)",
              transition: RECOMMEND_EXIT_TRANSITION,
              position: headerRevealed ? "absolute" : "relative",
              inset: 0,
              pointerEvents: headerRevealed || loadingExiting ? "none" : "auto",
            }}
          >
            <PanelHeader title={wizard.title} onClose={onClose} />
          </div>
          <div
            style={{
              opacity: headerRevealed ? 1 : 0,
              transform: headerRevealed ? "translateY(0)" : "translateY(8px)",
              transition: `opacity ${RECOMMEND_HEADER_MORPH_MS}ms ease 0.03s, transform ${RECOMMEND_HEADER_MORPH_MS}ms ${RECOMMEND_EXIT_EASE} 0.03s`,
              position: headerRevealed ? "relative" : "absolute",
              inset: 0,
              pointerEvents: headerRevealed ? "auto" : "none",
            }}
          >
            <div style={{ position: "relative", padding: `${MODAL_HEADER_INSET}px ${MODAL_HEADER_INSET}px 20px ${MODAL_HEADER_INSET}px`, borderBottom: `1px solid ${C.bg2}`, zIndex: 2 }}>
              <span style={{ fontFamily: FONT, fontSize: 15, color: C.ink600, display: "block", paddingRight: 8 }}>
                {wizard.title} · {Object.keys(wizard.attendees).length}인
                <span
                  onClick={() => setWizard(returnToBaseWizard(wizard, { returnToRecommendations: true }))}
                  style={{
                    marginLeft: 6,
                    textDecoration: "underline",
                    textUnderlineOffset: 2,
                    cursor: "pointer",
                  }}
                >
                  조건 수정
                </span>
              </span>
              <ModalCloseButton onClick={onClose} anchored />
            </div>
          </div>
        </div>

        {/* 로딩 영역 — fade out + slide up */}
        <div
          style={{
            opacity: loadingExiting ? 0 : 1,
            transform: loadingExiting ? "translateY(-14px)" : "translateY(0)",
            maxHeight: loadingExiting ? 0 : 320,
            overflow: "hidden",
            transition: `${RECOMMEND_EXIT_TRANSITION}, max-height ${RECOMMEND_EXIT_MS}ms ease`,
            flexShrink: 0,
          }}
        >
          <div style={{ padding: "10px 24px 40px 24px" }}>
            <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.ink900, marginBottom: 24 }}>
              {isSoloAttendee ? "내 일정에서 가능한 시간을 찾아볼게요" : "가능한 일정을 찾아볼게요"}
            </div>
            <AiThinkingStepList
              loadingStepIndex={loadingStepIndex}
              loadingStepPhase={loadingStepPhase}
              soloOnly={isSoloAttendee}
              roomRequired={roomRequired}
              avoidSoftTimes={avoidSoftTimes}
              occasion={meetingOccasion}
              Check={Check}
              Spinner={Spinner}
            />
          </div>
        </div>

        {/* 제안 영역 — dissolve + slide up */}
        {headerRevealed && (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              opacity: resultsEntering ? 1 : 0,
              transform: resultsEntering ? "translateY(0)" : "translateY(12px)",
              transition: `opacity ${RECOMMEND_RESULTS_ENTER_MS}ms ease, transform ${RECOMMEND_RESULTS_ENTER_MS}ms ${RECOMMEND_EXIT_EASE}`,
              pointerEvents: resultsEntering ? "auto" : "none",
            }}
          >
            {candidates.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", color: C.ink900, fontSize: 15, flex: 1, lineHeight: 1.5 }}>
                <div style={{ fontFamily: FONT, fontWeight: 600, marginBottom: 8 }}>바로 확정 가능한 시간은 없어요.</div>
                <div style={{ fontFamily: FONT, color: C.ink500, fontSize: 14 }}>참석자나 시간 조건을 바꾸면 만들 수 있는지 다시 찾아볼게요.</div>
              </div>
            ) : current ? (
              <>
                <ModalScrollArea
                  watchKey={`${currentKey}-${index}-${candidates.length}-${selectedRoomId}-${recommendationLayout?.showRoomSection}-${recommendationLayout?.showReferenceSection}`}
                  style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
                >
                  <div
                    style={{
                      padding: `${SECTION_GAP}px 24px 0`,
                      display: "flex",
                      flexDirection: "column",
                      boxSizing: "border-box",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: currentRequiredMet ? C.blue : C.ink900 }}>
                        {currentRequiredMet ? "확정 가능 일정" : "확인 필요 일정"}
                      </span>
                      <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.ink900 }}>{index + 1} / {candidates.length}</span>
                    </div>
                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 21, color: C.black }}>{current.start.getMonth() + 1}월 {current.start.getDate()}일 {fmtAmPmRange(current.start, current.end)}</div>
                      <div style={{ fontFamily: FONT, fontSize: 13, color: C.ink800 }}>{formatRelativeWeekdayLabel(current.start, getDemoTodayStr())}</div>
                      {candidateCoordinationHint && (
                        <div style={{ fontFamily: FONT, fontSize: 14, color: C.ink600, lineHeight: "20px" }}>{candidateCoordinationHint}</div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      minHeight: recommendationLayout?.scrollBelowDateMinHeight ?? 0,
                      paddingBottom: (recommendationLayout?.scrollContentPad ?? 0) + SECTION_GAP,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {candidateCoordinationSection && (
                      <div style={{ padding: "0 24px", marginTop: COORDINATION_SECTION_MARGIN }}>
                        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.ink900, lineHeight: `${COORDINATION_SECTION_HEADLINE_HEIGHT}px` }}>
                          {candidateCoordinationSection.headline}
                        </div>
                        <div style={{ marginTop: COORDINATION_SECTION_GAP, display: "flex", flexDirection: "column", gap: CHECKPOINT_ROW_GAP }}>
                          {candidateCoordinationSection.checkpoints.map((c, i) => (
                            <CoordinationCheckpointRow
                              key={i}
                              checkpoint={c}
                              onOpenBlockingEvent={handleOpenBlockingEvent}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {!candidateCoordinationSection && displayValidationReasons.length > 0 && (
                      <div style={{ padding: "0 24px", marginTop: REASON_LIST_MARGIN_TOP, display: "flex", flexDirection: "column", gap: REASON_ROW_GAP }}>
                        {displayValidationReasons.map((r, i) => (
                          <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", fontSize: 15, lineHeight: "20px", color: C.ink900 }}>
                            <Check size={16} color={C.blue} style={{ flexShrink: 0, marginTop: 2 }} /><span>{r}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {recommendationLayout?.showReferenceSection && referenceCheckpoints.length > 0 && (
                      <div style={{ padding: "0 24px", marginTop: CHECKPOINT_SECTION_MARGIN }}>
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.ink900, lineHeight: "20px" }}>
                            참고할 점
                          </div>
                          <div style={{ fontFamily: FONT, fontSize: 13, color: C.ink500, marginTop: 4, lineHeight: "18px" }}>
                            확정 시 챙겨드릴게요.
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: CHECKPOINT_ROW_GAP }}>
                          {referenceCheckpoints.map((c, i) => (
                            <ReferenceCheckpointRow key={i} checkpoint={c} />
                          ))}
                        </div>
                      </div>
                    )}

                    {recommendationLayout?.showRoomSection && (
                      <div style={{ marginTop: ROOM_SECTION_MARGIN, position: "relative", zIndex: 2 }}>
                        <RoomPicker current={currentWithRoom} selectedRoomId={selectedRoomId} onSelectRoom={(roomId) => setSelectedRoomByCandidate((prev) => ({ ...prev, [currentKey]: roomId }))} />
                      </div>
                    )}

                  </div>
                </ModalScrollArea>

                <div style={{ display: "flex", justifyContent: "flex-end", padding: "20px 24px 24px", flexShrink: 0 }}>
                  <PrimaryButton compact disabled={!currentSelectable} onClick={() => onConfirm(currentWithRoom, requiredIds, optionalIds, wizard.title)}>선택하기</PrimaryButton>
                </div>
              </>
            ) : null}
          </div>
        )}
        </div>
      </Overlay>
      </>
    );
  }

  return null;
}

function Spinner() {
  return (
    <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(49, 130, 246, 0.18)", borderTopColor: C.blue, animation: "spin 0.8s linear infinite" }}>
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}

function Field({ label, labelSuffix, action, children }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 12,
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
          <div className="modal-section-label" style={{ color: C.ink900 }}>{label}</div>
          {labelSuffix != null && labelSuffix !== "" ? (
            <div className="modal-section-label modal-section-label-accent">{labelSuffix}</div>
          ) : null}
        </div>
        {action ?? null}
      </div>
      {children}
    </div>
  );
}

function RecommendationSettingCheckbox({ checked, title, description, onToggle }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        width: "100%",
        padding: 0,
        margin: 0,
        border: "none",
        background: "none",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          background: checked ? C.blue : "none",
          border: checked ? "none" : `1.5px solid ${hover ? C.blue : C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color 0.15s ease",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {checked && <Check size={14} color={C.white} />}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 15, color: C.ink900, lineHeight: 1.4 }}>
          {title}
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, color: C.ink600, lineHeight: 1.4 }}>
          {description}
        </div>
      </div>
    </button>
  );
}

function RecommendationSettingsSection({ wizard, setWizard }) {
  const open = Boolean(wizard.recommendSettingsOpen);
  const [headerHover, setHeaderHover] = useState(false);
  return (
    // 상하 호버 패딩은 섹션 gap 40에 포함되지 않도록 상쇄
    <div style={{ marginTop: -14 }}>
      <button
        type="button"
        onClick={() => setWizard({ ...wizard, recommendSettingsOpen: !open })}
        onMouseEnter={() => setHeaderHover(true)}
        onMouseLeave={() => setHeaderHover(false)}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          width: "calc(100% + 16px)",
          margin: "0 -8px",
          padding: "14px 8px",
          border: "none",
          borderRadius: 10,
          background: headerHover ? HOVER_OVERLAY : "transparent",
          cursor: "pointer",
          transition: "background 0.15s ease",
          boxSizing: "border-box",
        }}
      >
        <div className="modal-section-label" style={{ color: C.ink900 }}>추천 조건 설정</div>
        <span style={{ display: "inline-flex" }}>
          {open ? <ChevronUp size={18} color={C.ink500} /> : <ChevronDown size={18} color={C.ink500} />}
        </span>
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          <RecommendationSettingCheckbox
            checked={wizard.avoidSoftTimes !== false}
            title="비선호 시간 추천 줄이기"
            description="출근 직후, 퇴근 직전, 점심 직후 시간을 낮은 우선순위로 고려해요."
            onToggle={() => setWizard({ ...wizard, avoidSoftTimes: wizard.avoidSoftTimes === false })}
          />
          <RecommendationSettingCheckbox
            checked={wizard.avoidBusyDays !== false}
            title="일정 많은 날 추천 줄이기"
            description="연속 회의 혹은 미팅이 3개 이상 있는 날을 낮은 우선순위로 고려해요."
            onToggle={() => setWizard({ ...wizard, avoidBusyDays: wizard.avoidBusyDays === false })}
          />
        </div>
      )}
    </div>
  );
}

function RoomPicker({ current, selectedRoomId, onSelectRoom }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [hoveredRoomId, setHoveredRoomId] = useState(null);
  const rootRef = React.useRef(null);
  const room = current.availableRooms.find((r) => r.id === selectedRoomId) || current.selectedRoom;

  React.useEffect(() => {
    if (!open || !rootRef.current) return;
    rootRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
        setHoveredRoomId(null);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} style={{ padding: "0 24px", zIndex: open ? 40 : undefined }}>
      <div className="modal-section-label" style={{ color: C.ink900, marginBottom: 12 }}>회의실</div>
      {room ? (
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
              width: "100%",
              border: `1px solid ${hover ? C.blue : C.border}`,
              borderRadius: 10,
              padding: "14px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: C.white,
              cursor: "pointer",
              textAlign: "left",
              fontFamily: FONT,
              transition: "border-color 0.15s ease",
            }}
          >
            <div>
              <div style={{ fontFamily: FONT, fontSize: 15, color: C.black, lineHeight: "20px" }}>{roomLabel(room)} ({room.capacity}인)</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.ink600, fontSize: 13, flexShrink: 0 }}>
              변경 <ChevronRight size={14} color={C.ink500} style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }} />
            </div>
          </button>
          {open && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: "calc(100% + 8px)",
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                overflow: "hidden",
                background: C.white,
                boxShadow: "0 8px 24px rgba(17,24,39,0.12)",
                zIndex: 50,
                padding: "8px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {current.availableRooms.map((candidateRoom) => (
                  <RoomListRow
                    key={candidateRoom.id}
                    room={candidateRoom}
                    bleed={false}
                    isSelected={candidateRoom.id === room.id}
                    isHovered={hoveredRoomId === candidateRoom.id}
                    onHover={() => setHoveredRoomId(candidateRoom.id)}
                    onLeave={() => setHoveredRoomId(null)}
                    onSelect={(roomId) => {
                      onSelectRoom(roomId);
                      setOpen(false);
                      setHoveredRoomId(null);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: C.ink600, fontSize: 15, lineHeight: "20px" }}>
          예약 가능한 회의실이 없어요. 라운지에서 진행해 보거나, 다른 일자를 추천받아 보세요.
        </div>
      )}
    </div>
  );
}

function CheckpointRow({ checkpoint, checked, onToggle }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}
    >
      <SidebarCheckbox checked={checked} hover={hover} />
      <CheckpointTitleDescription checkpoint={checkpoint} checked={checked} lineHeight="20px" />
    </div>
  );
}

/* ---------- Confirmed detail (참석자 + 챙길 점) ---------- */

function ConfirmedDetailModal({ personId, data, people, onClose, onDelete, onEdit, rsvp, setRsvp, overlayZIndex = 55 }) {
  const { meta, title, groupId } = data;
  const start = toDate(meta.start), end = toDate(meta.end);
  const [checks, setChecks] = useState({});
  const requiredPeople = (meta.requiredIds ?? []).map((id) => people.find((p) => p.id === id)).filter(Boolean);
  const optionalPeople = (meta.optionalIds ?? []).map((id) => people.find((p) => p.id === id)).filter(Boolean);
  const checkpoints = personId === ME_ID ? (meta.checkpoints ?? []) : [];
  const hasCheckpointsSection = checkpoints.length > 0;

  const toggleCheck = (i) => setChecks((c) => ({ ...c, [i]: !c[i] }));
  const rsvpKey = (id) => `${groupId}:${id}`;
  const cycleRsvp = (id) => setRsvp((r) => {
    const key = rsvpKey(id);
    const cur = r[key] || "pending";
    const next = cur === "pending" ? "yes" : cur === "yes" ? "no" : "pending";
    return { ...r, [key]: next };
  });

  return (
    <Overlay onClose={onClose} zIndex={overlayZIndex}>
      {onDelete ? (
        <PanelHeaderWithActions title={title} onClose={onClose} onDelete={onDelete} onEdit={onEdit} />
      ) : (
        <PanelHeader title={title} onClose={onClose} />
      )}
      <div style={{ padding: "0 24px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 15, color: C.ink900 }}>
          <CalendarCheck2 size={16} color={C.ink500} /> {fmtDate(start)} {formatRelativeWeekdayLabel(start, getDemoTodayStr())}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 15, color: C.ink900 }}>
          <Clock size={16} color={C.ink500} /> {fmtAmPmRange(start, end, " - ")}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 15, color: C.ink900 }}>
          <MapPin size={16} color={C.ink500} />
          {meta.room ? `${roomLabel(meta.room)} (${meta.room.capacity}인)` : "회의실 없음"}
        </div>
      </div>

      <div style={{ padding: `${EVENT_DETAIL_SECTION_GAP}px 24px ${hasCheckpointsSection ? 0 : 48}px` }}>
        <div className="modal-section-label" style={{ marginBottom: 12, color: C.ink900 }}>참석자</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 16px" }}>
          {[...requiredPeople, ...optionalPeople].map((p) => {
            const isOptional = optionalPeople.includes(p);
            const isHost = p.id === ME_ID;
            const status = rsvp[rsvpKey(p.id)] || "pending";
            const badgeStatus = isHost ? "yes" : status;
            const statusLabel = badgeStatus === "yes" ? "참석" : badgeStatus === "no" ? "불참" : "미응답";
            const showRsvpBadge = isOptional || isHost;
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{ position: "relative", cursor: isOptional && !isHost ? "pointer" : "default" }}
                  onClick={() => isOptional && !isHost && cycleRsvp(p.id)}
                >
                  <Avatar person={p} />
                  {showRsvpBadge && (
                    <div style={{ position: "absolute", bottom: -2, right: -2, width: 16, height: 16, borderRadius: "50%", background: C.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {badgeStatus === "yes" && <div style={{ width: 14, height: 14, borderRadius: "50%", background: C.green500, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={9} color={C.white} /></div>}
                      {badgeStatus === "no" && <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={9} color={C.white} /></div>}
                      {badgeStatus === "pending" && <div style={{ width: 14, height: 14, borderRadius: "50%", background: C.ink400, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 5, height: 5, borderRadius: "50%", background: C.white }} /></div>}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 15, color: C.ink900 }}>{p.name}</div>
                  <div style={{ fontFamily: FONT, fontSize: 14, color: C.ink500 }}>
                    {isHost
                      ? (isOptional ? <>주최자 · 선택 참여 · <span style={{ fontWeight: 500 }}>{statusLabel}</span></> : "주최자")
                      : isOptional ? <>선택 참여 · <span style={{ fontWeight: 500 }}>{statusLabel}</span></> : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {hasCheckpointsSection && (
        <div style={{ padding: `${EVENT_DETAIL_SECTION_GAP}px 24px 48px` }}>
          <div style={{ marginBottom: 12 }}>
            <span className="modal-section-label" style={{ color: C.ink900 }}>챙길 점 <span style={{ color: C.ink500, fontWeight: 400 }}>(나만 보임)</span></span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {checkpoints.map((c, i) => (
              <CheckpointRow
                key={i}
                checkpoint={c}
                checked={!!checks[i]}
                onToggle={() => toggleCheck(i)}
              />
            ))}
          </div>
        </div>
      )}
    </Overlay>
  );
}
