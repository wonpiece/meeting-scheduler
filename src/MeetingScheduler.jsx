import React, { useState, useMemo } from "react";
import {
  PURPOSE_DEFAULT,
  buildRecommendationRequest,
  generateCandidates,
  hourToTimeStr,
} from "./config/recommendationPolicy";
import {
  COLOR_PALETTE,
  DEFAULT_COMPANY_SETTINGS,
  INITIAL_EVENTS,
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
import { resolveJobShort } from "./admin/jobUtils";
import { PersonMeta } from "./components/PersonMeta";
import {
  AI_LOADING_STEP_COUNT,
  AI_RESULTS_DELAY_MS,
  AI_STEP_DURATION_MS,
  AiThinkingStepList,
} from "./components/AiThinkingLoader";
import arrowLeftIcon from "./assets/icons/icon-arrow-left-small-mono.svg?raw";
import arrowRightIcon from "./assets/icons/icon-arrow-right-small-mono.svg?raw";
import closeIcon from "./assets/icons/icon-x-mono.svg?raw";
import plusIcon from "./assets/icons/icon-plus-mono.svg?raw";
import searchIcon from "./assets/icons/icon-search-mono.svg?raw";
import checkIcon from "./assets/icons/icon-check-mono.svg?raw";
import calendarIcon from "./assets/icons/icon-calendar-check-mono.svg?raw";
import clockIcon from "./assets/icons/icon-clock-mono.svg?raw";
import pinIcon from "./assets/icons/icon-pin-location-mono.svg?raw";
import binIcon from "./assets/icons/icon-bin-mono.svg?raw";
import circleIcon from "./assets/icons/icon-circle-empty-mono.svg?raw";
import checkCircleIcon from "./assets/icons/icon-check-circle-line-mono.svg?raw";
import checkCircleFilledIcon from "./assets/icons/icon-check-circle-mono.svg?raw";
import pencilIcon from "./assets/icons/icon-pencil-mono.svg?raw";
import settingIcon from "./assets/icons/icon-setting-mono.svg?raw";

const ICONS = {
  ChevronLeft: arrowLeftIcon, ChevronRight: arrowRightIcon, X: closeIcon, Plus: plusIcon, Search: searchIcon, Check: checkIcon,
  CalendarCheck2: calendarIcon, Clock: clockIcon, MapPin: pinIcon, Trash2: binIcon, Circle: circleIcon,
  CheckCircle2: checkCircleIcon, CheckCircleFilled: checkCircleFilledIcon, Pencil: pencilIcon, Settings: settingIcon,
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
const CheckCircleFilled = (p) => <SvgIcon name="CheckCircleFilled" {...p} />;
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

const STORAGE_KEYS = {
  people: "meeting-scheduler:people-v2",
  events: "meeting-scheduler:events-v5",
  jobs: "meeting-scheduler:jobs",
  companySettings: "meeting-scheduler:company-settings",
  rooms: "meeting-scheduler:rooms",
  teams: "meeting-scheduler:teams",
  rsvp: "meeting-scheduler:rsvp",
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

/* ============================================================
   1. DATA MODEL — seed는 src/mock/seedData.ts, 생성은 src/mock/eventGenerator.ts
   ============================================================ */

const timeStrToHour = (str) => {
  const [h, m] = str.split(":").map(Number);
  return h + m / 60;
};

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
const DAY_LABEL = ["월", "화", "수", "목", "금"];
const HOUR_HEIGHT = 72;

/* ============================================================
   2. DATE HELPERS
   ============================================================ */

const toDate = (s) => new Date(s);
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
   3. UI PRIMITIVES (Figma 토큰 그대로)
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

const EMPTY_WIZARD = { step: "base", title: "", dateStr: "2026-07-12", startHour: 10, endHour: 11, durationMinutes: 60, roomRequired: true, forcedRoomId: null, purpose: PURPOSE_DEFAULT, attendees: { yj: "required" }, search: "" };

export default function MeetingSchedulerApp() {
  const [people, setPeople] = usePersistentState(STORAGE_KEYS.people, PEOPLE_BASE);
  const [events, setEvents] = usePersistentState(STORAGE_KEYS.events, INITIAL_EVENTS);
  const [visibleIds, setVisibleIds] = useState([ME_ID]);
  const [wizard, setWizard] = useState(null);
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState(null);
  const [weekStart, setWeekStart] = useState(mondayOf(new Date(2026, 6, 13)));
  const [rsvp, setRsvp] = usePersistentState(STORAGE_KEYS.rsvp, {}); // `${groupId}:${personId}` -> 'yes' | 'no'
  const [showAdmin, setShowAdmin] = useState(false);
  const [companySettings, setCompanySettings] = usePersistentState(
    STORAGE_KEYS.companySettings,
    normalizeCompanySettings(readStored(STORAGE_KEYS.companySettings, DEFAULT_COMPANY_SETTINGS)),
  );
  const [rooms, setRooms] = usePersistentState(STORAGE_KEYS.rooms, ROOMS_BASE);
  const [teams, setTeams] = usePersistentState(STORAGE_KEYS.teams, TEAMS_BASE);
  const [jobs, setJobs] = usePersistentState(STORAGE_KEYS.jobs, JOBS_BASE);

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
          <Settings size={17} /> 관리
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
        <CreationWizard wizard={wizard} setWizard={setWizard} people={people} jobs={jobs} events={events} companySettings={companySettings} rooms={rooms} onClose={() => setWizard(null)}
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

function CreationWizard({ wizard, setWizard, people, jobs, events, companySettings, rooms, onClose, onConfirm, onQuickCreate }) {
  const [index, setIndex] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [candidatesVisible, setCandidatesVisible] = useState(false);
  const [searchActiveIndex, setSearchActiveIndex] = useState(0);
  const [selectedRoomByCandidate, setSelectedRoomByCandidate] = useState({});

  const requiredIds = Object.keys(wizard.attendees).filter((id) => wizard.attendees[id] === "required");
  const optionalIds = Object.keys(wizard.attendees).filter((id) => wizard.attendees[id] === "optional");

  const normalizedCompanySettings = useMemo(
    () => normalizeCompanySettings(companySettings),
    [companySettings],
  );

  const request = useMemo(
    () => buildRecommendationRequest({
      title: wizard.title,
      description: wizard.description,
      durationMinutes: wizard.durationMinutes,
      weekDays: WEEK_DAYS,
      companySettings: normalizedCompanySettings,
      roomRequired: wizard.roomRequired !== false,
      forcedRoomId: wizard.forcedRoomId,
      requiredIds,
      optionalIds,
      people,
      organizerId: ME_ID,
    }),
    [wizard.title, wizard.description, wizard.durationMinutes, wizard.roomRequired, wizard.forcedRoomId, requiredIds.join(","), optionalIds.join(","), normalizedCompanySettings, people],
  );

  const candidates = useMemo(
    () => (wizard.step === 3
      ? generateCandidates(request, people, events, normalizedCompanySettings, rooms, {
        organizerId: ME_ID,
        roomEvents: ROOM_EVENTS,
        fallbackRooms: ROOMS_BASE,
      })
      : []),
    [wizard.step, request, people, events, normalizedCompanySettings, rooms],
  );
  const current = candidates[Math.min(index, Math.max(0, candidates.length - 1))];
  const currentKey = current ? `${current.start.getTime()}-${current.end.getTime()}` : "";
  const selectedRoomId = current ? (selectedRoomByCandidate[currentKey] || current.selectedRoom?.id) : undefined;
  const currentWithRoom = current ? {
    ...current,
    selectedRoom: current.availableRooms.find((room) => room.id === selectedRoomId) || current.selectedRoom,
  } : current;

  const addAttendee = (id) => setWizard((w) => ({ ...w, attendees: { ...w.attendees, [id]: "required" } }));
  const removeAttendee = (id) => setWizard((w) => { const next = { ...w.attendees }; delete next[id]; return { ...w, attendees: next }; });
  const toggleOptional = (id) => setWizard((w) => ({ ...w, attendees: { ...w.attendees, [id]: w.attendees[id] === "optional" ? "required" : "optional" } }));

  const goToLoading = () => {
    setLoadingStep(0);
    setIndex(0);
    setCandidatesVisible(false);
    setWizard({ ...wizard, step: "loading" });
  };
  React.useEffect(() => {
    if (wizard.step !== "loading") return;
    if (loadingStep >= AI_LOADING_STEP_COUNT) {
      const t = setTimeout(() => setWizard((w) => ({ ...w, step: 3 })), AI_RESULTS_DELAY_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setLoadingStep((s) => s + 1), AI_STEP_DURATION_MS);
    return () => clearTimeout(t);
  }, [wizard.step, loadingStep]);

  React.useEffect(() => {
    if (wizard.step !== 3) {
      setCandidatesVisible(false);
      return;
    }
    const t = setTimeout(() => setCandidatesVisible(true), 40);
    return () => clearTimeout(t);
  }, [wizard.step]);

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
            {selectedPeople.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
                {selectedPeople.map((p) => {
                  const isOptional = wizard.attendees[p.id] === "optional";
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar person={p} />
                      <PersonMeta
                        name={`${p.name}${p.id === ME_ID ? " · 주최자" : ""}`}
                        team={p.team}
                        roleShort={resolveJobShort(jobs, p.role)}
                      />
                      {p.id !== ME_ID && (
                        <>
                          <button onClick={() => toggleOptional(p.id)} style={{ display: "flex", alignItems: "center", gap: 4, border: "none", borderRadius: 8, height: 30, padding: "0 10px", background: C.bg2, color: isOptional ? C.blue : C.ink500, fontFamily: FONT, fontSize: 13, cursor: "pointer" }}>
                            {isOptional ? <CheckCircleFilled size={14} color={C.blue} /> : <Circle size={14} color={C.ink500} />}
                            선택 참여
                          </button>
                          <button onClick={() => removeAttendee(p.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={14} color={C.ink500} /></button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Field>
          <Field label="시간">
            <Toggle options={[["1시간", 60], ["30분", 30], ["직접 선택", "custom"]]} value={wizard.durationMinutes} onChange={(v) => v === "custom" ? setWizard({ ...wizard, endHour: wizard.startHour + wizard.durationMinutes / 60, step: "datetime" }) : setWizard({ ...wizard, durationMinutes: v, endHour: wizard.startHour + v / 60 })} />
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
                      <PersonMeta
                        name={`${p.name}${p.id === ME_ID ? " · 주최자" : ""}`}
                        team={p.team}
                        roleShort={resolveJobShort(jobs, p.role)}
                      />
                      {p.id !== ME_ID && (
                        <>
                          <button onClick={() => toggleOptional(p.id)} style={{ display: "flex", alignItems: "center", gap: 4, border: "none", borderRadius: 8, height: 30, padding: "0 10px", background: C.bg2, color: isOptional ? C.blue : C.ink500, fontFamily: FONT, fontSize: 13, cursor: "pointer" }}>
                            {isOptional ? <CheckCircleFilled size={14} color={C.blue} /> : <Circle size={14} color={C.ink500} />}
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
    const endHour = wizard.endHour ?? (wizard.startHour + wizard.durationMinutes / 60);
    const updateStart = (value) => {
      const nextStart = timeStrToHour(value);
      const minEnd = nextStart + 0.5;
      const nextEnd = Math.max(endHour, minEnd);
      setWizard({ ...wizard, startHour: nextStart, endHour: nextEnd, durationMinutes: Math.round((nextEnd - nextStart) * 60) });
    };
    const updateEnd = (value) => {
      const nextEnd = timeStrToHour(value);
      const safeEnd = Math.max(nextEnd, wizard.startHour + 0.5);
      setWizard({ ...wizard, endHour: safeEnd, durationMinutes: Math.round((safeEnd - wizard.startHour) * 60) });
    };
    const inputWrap = { ...fieldButtonStyle, padding: "0 12px", cursor: "text" };
    const inputInner = { border: "none", outline: "none", background: "transparent", color: C.black, fontFamily: FONT, fontWeight: 500, fontSize: 17, width: "100%" };
    return (
      <Overlay onClose={onClose} minHeight={560}>
        <PanelHeader title="언제로 할까요?" onClose={onClose} />
        <div style={{ padding: "10px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
          <Field label="날짜">
            <div style={inputWrap}>
              <CalendarCheck2 size={20} color={C.ink900} />
              <input type="date" value={wizard.dateStr} onChange={(e) => setWizard({ ...wizard, dateStr: e.target.value })} style={inputInner} />
            </div>
          </Field>
          <Field label="시작 시간">
            <div style={inputWrap}>
              <Clock size={20} color={C.ink900} />
              <input type="time" value={hourToTimeStr(wizard.startHour)} onChange={(e) => updateStart(e.target.value)} style={inputInner} />
            </div>
          </Field>
          <Field label="종료 시간">
            <div style={inputWrap}>
              <Clock size={20} color={C.ink900} />
              <input type="time" value={hourToTimeStr(endHour)} min={hourToTimeStr(wizard.startHour + 0.5)} onChange={(e) => updateEnd(e.target.value)} style={inputInner} />
            </div>
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
                  <PersonMeta name={p.name} team={p.team} roleShort={resolveJobShort(jobs, p.role)} />
                  {isAdded ? <CheckCircleFilled size={20} color="#22c55e" /> : <Circle size={20} color={C.border} />}
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
                {isSelected ? <CheckCircleFilled size={18} color={C.blue} /> : <Circle size={18} color={C.border} />}
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
          <AiThinkingStepList loadingStep={loadingStep} Check={Check} Spinner={Spinner} />
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
        <div style={{ padding: 40, textAlign: "center", color: C.ink500, fontSize: 14, opacity: candidatesVisible ? 1 : 0, transition: "opacity 0.35s ease" }}>조건에 맞는 후보를 찾지 못했어요. 조건을 수정해 주세요.</div>
      ) : (
        <div style={{ opacity: candidatesVisible ? 1 : 0, transition: "opacity 0.35s ease" }}>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.blue }}>{current.profileLabel || "확정 가능 일정"}</span>
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

          {current.requiredRoom && <RoomPicker current={currentWithRoom} selectedRoomId={selectedRoomId} onSelectRoom={(roomId) => setSelectedRoomByCandidate((prev) => ({ ...prev, [currentKey]: roomId }))} />}

          <div style={{ display: "flex", justifyContent: "flex-end", padding: "20px 24px 24px 24px", marginTop: "auto" }}>
            <PrimaryButton disabled={current.status === "not_recommended"} onClick={() => onConfirm(currentWithRoom, requiredIds, optionalIds, wizard.title)}>선택하기</PrimaryButton>
          </div>
        </div>
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

function RoomPicker({ current, selectedRoomId, onSelectRoom }) {
  const [open, setOpen] = useState(false);
  const room = current.availableRooms.find((r) => r.id === selectedRoomId) || current.selectedRoom;
  return (
    <div style={{ padding: "0 24px", position: "relative" }}>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, color: C.ink900, marginBottom: 12 }}>회의실</div>
      {room ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", background: C.white, cursor: "pointer", textAlign: "left", fontFamily: FONT }}
          >
            <div>
              <div style={{ fontFamily: FONT, fontSize: 15, color: C.black }}>{roomLabel(room)} ({room.capacity}인)</div>
              <div style={{ fontFamily: FONT, fontSize: 11, color: C.blue }}>{current.roomReason}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.ink600, fontSize: 13 }}>
              변경 <ChevronRight size={14} color={C.ink600} style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }} />
            </div>
          </button>
          {open && (
            <div style={{ marginTop: 8, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", background: C.white, boxShadow: "0 8px 24px rgba(17,24,39,0.08)" }}>
              {current.availableRooms.map((candidateRoom) => {
                const selected = candidateRoom.id === room.id;
                return (
                  <button
                    type="button"
                    key={candidateRoom.id}
                    onClick={() => { onSelectRoom(candidateRoom.id); setOpen(false); }}
                    style={{ width: "100%", border: "none", borderBottom: `1px solid ${C.bg2}`, padding: "12px", display: "flex", alignItems: "center", gap: 10, background: selected ? C.blue200 : C.white, cursor: "pointer", textAlign: "left", fontFamily: FONT }}
                  >
                    <MapPin size={18} color={selected ? C.blue : C.ink600} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, color: C.ink900 }}>{roomLabel(candidateRoom)}</div>
                      <div style={{ fontSize: 12, color: C.ink500 }}>{candidateRoom.capacity}인 수용</div>
                    </div>
                    {selected && <CheckCircleFilled size={18} color={C.blue} />}
                  </button>
                );
              })}
            </div>
          )}
        </>
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
            {meta.checkpoints.map((c, i) => (
              <label key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", cursor: "pointer" }}>
                <div onClick={() => toggleCheck(i)} style={{ width: 16, height: 16, border: `1px solid ${C.border}`, borderRadius: 4, marginTop: 1, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: checks[i] ? C.ink600 : "none" }}>
                  {checks[i] && <Check size={11} color={C.white} />}
                </div>
                <span style={{ fontFamily: FONT, fontSize: 15, color: checks[i] ? C.ink400 : C.ink900, textDecoration: checks[i] ? "line-through" : "none" }}>
                  {c.description}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </Overlay>
  );
}
