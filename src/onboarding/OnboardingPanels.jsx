import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AiThinkingStepList, AI_LOADING_STEP_COUNT, AI_STEP_ACTIVE_MS, AI_STEP_DONE_HOLD_MS } from '../components/AiThinkingLoader';
import { FACTOR_COPY, MOCK_CANDIDATES, MOCK_COORDINATION, MOCK_MEETING, PURPOSE_FLOW } from './onboardingCopy';
import searchIcon from '../assets/icons/icon-search-mono.svg?raw';
import xIcon from '../assets/icons/icon-x-mono.svg?raw';
import checkIcon from '../assets/icons/icon-check-mono.svg?raw';
import checkpointDotIcon from '../assets/icons/icon-checkpoint-dot-mono.svg?raw';
import exclamationIcon from '../assets/icons/icon-exclamation-circle-mono.svg?raw';
import chevronRightIcon from '../assets/icons/icon-arrow-right-small-mono.svg?raw';
import calendarIcon from '../assets/icons/icon-calendar-check-mono.svg?raw';
import clockIcon from '../assets/icons/icon-clock-mono.svg?raw';
import copyIcon from '../assets/icons/icon-copy-mono.svg?raw';

export const FONT = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";
export const BG_GRAY100 = '#f2f4f6';
export const BG_BLUE100 = '#e9effb';
export const BLUE200 = '#e7f0fe';
export const C = {
  blue: '#3182f6',
  blue500: '#3182f6',
  ink1000: '#191f28',
  ink900: '#323742',
  ink800: '#4c525d',
  ink600: '#6b7280',
  ink500: '#8d949f',
  black: '#111827',
  border: '#e5e7eb',
  bg2: '#eff1f3',
  white: '#ffffff',
  gray100: BG_GRAY100,
  gray300: '#d1d5db',
  disabled: '#c8ccd2',
  green500: '#10B981',
};

/** Shared entrance for onboarding right-side graphics (create / purpose / find / act). */
export const GRAPHIC_ENTER = {
  from: 'translateY(20px) scale(0.96)',
  to: 'translateY(0) scale(1)',
  origin: 'top left',
  transition: 'opacity 0.65s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
};
export const PAD = 100;
export const SUBTITLE_HEADLINE_GAP = 24;
export const HEADLINE_BOTTOM_PAD = 80;
export const FADE_MS = 480;

const MODAL_SHADOW = '0 18px 48px rgba(25, 31, 40, 0.02), 0 4px 12px rgba(25, 31, 40, 0.01)';
const MODAL_DROP_SHADOW = 'drop-shadow(0 18px 48px rgba(25, 31, 40, 0.02)) drop-shadow(0 4px 12px rgba(25, 31, 40, 0.01))';
const CREATE_MODAL_WIDTH = 460;
const CREATE_MODAL_SCALE = 1.5;
/** Match CreationWizard recommend results width, then scale up. */
const RECOMMEND_MODAL_WIDTH = 528;
const RECOMMEND_MODAL_SCALE = 1.55;
/** Keep modal shadow from being clipped by parents. */
const MODAL_SHADOW_INSET = 32;
/** Reserve space so floating Next (bottom: 100) doesn't collide with modals. */
const NEXT_BUTTON_CLEARANCE = 96;
/** Content-sized recommend shells — avoid stretching into Next clearance gap. */
const LOADING_MODAL_NATURAL_H = 360;
const CONFIRM_MODAL_NATURAL_H = 600;
const RECOMMEND_CONTENT_TOP_PAD = 32;
const BELOW_WEEKDAY_CONTENT_MARGIN = 28;
const SECTION_GAP = 40;
const REASON_ROW_GAP = 12;
const HOVER_OVERLAY = 'rgba(17,24,39,0.02)';
/** Purpose board content height (unscaled) — chips + 5 priority rows. */
const PURPOSE_CONTENT_H = 560;

function normalizeSvg(svg) {
  return svg
    .replace(/width="[^"]*"/i, 'width="100%"')
    .replace(/height="[^"]*"/i, 'height="100%"')
    .replace(/fill="(?!none)[^"]*"/gi, 'fill="currentColor"')
    .replace(/stroke="(?!none)[^"]*"/gi, 'stroke="currentColor"');
}

function SvgIcon({ svg, size = 16, color = C.ink500 }) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        lineHeight: 0,
        flexShrink: 0,
      }}
      dangerouslySetInnerHTML={{ __html: normalizeSvg(svg) }}
    />
  );
}

export function Fade({ show, children, style, duration = FADE_MS }) {
  return (
    <div
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(8px)',
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
        pointerEvents: show ? 'auto' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Subtitle({ children, show = true }) {
  return (
    <Fade show={show}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 34,
          lineHeight: 1.4,
          color: C.ink1000,
        }}
      >
        {children}
      </div>
    </Fade>
  );
}

export function Headline({ children, show = true, style }) {
  return (
    <Fade show={show} style={style}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 46,
          lineHeight: 1.35,
          color: C.ink1000,
        }}
      >
        {children}
      </div>
    </Fade>
  );
}

function FactorColumn({ kind, detailLines = 1, show }) {
  const copy = FACTOR_COPY[kind];
  const [visibleLines, setVisibleLines] = useState(1);

  useEffect(() => {
    if (!show) {
      setVisibleLines(1);
      return undefined;
    }
    if (detailLines <= 1) {
      setVisibleLines(1);
      return undefined;
    }
    setVisibleLines(1);
    const timers = [];
    for (let i = 2; i <= detailLines; i += 1) {
      timers.push(window.setTimeout(() => setVisibleLines(i), (i - 1) * 260));
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [detailLines, show]);

  const lines = Array.from({ length: visibleLines }, (_, i) => `${kind}-${i}`);

  return (
    <Fade show={show} style={{ flex: '1 1 0', minWidth: 0, width: '100%' }}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 30,
          lineHeight: 1.35,
          color: C.ink900,
          marginBottom: 20,
        }}
      >
        {copy.label}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 38,
          lineHeight: 1.35,
          color: C.ink900,
          marginBottom: 16,
        }}
      >
        {copy.title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {lines.map((key, index) => (
          <div
            key={key}
            style={{
              fontFamily: FONT,
              fontWeight: 400,
              fontSize: 26,
              lineHeight: 1.4,
              color: C.ink900,
              opacity: visibleLines > 1 ? Math.max(0.4, 1 - index * 0.07) : 1,
              marginTop: index === 0 ? 0 : 10 + (index - 1) * 2,
            }}
          >
            {copy.detail}
          </div>
        ))}
      </div>
    </Fade>
  );
}

export function FactorSections({ showRequired, showSoft, multiplyCount = 1 }) {
  return (
    <div
      style={{
        marginTop: 0,
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        alignSelf: 'stretch',
        width: '100%',
        flex: 1,
        minHeight: 0,
      }}
    >
      <FactorColumn kind="required" show={showRequired} detailLines={showRequired ? multiplyCount : 1} />
      <FactorColumn kind="soft" show={showSoft} detailLines={showSoft ? multiplyCount : 1} />
    </div>
  );
}

function MockCheck({ size = 10, color = C.white }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MockSpinner() {
  return (
    <span
      style={{
        width: 14,
        height: 14,
        border: `2px solid ${C.border}`,
        borderTopColor: C.blue,
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
}

export function MockPanelShell({ children, width = 420, height, style }) {
  return (
    <div
      style={{
        width,
        height,
        maxWidth: '100%',
        background: C.white,
        borderRadius: 24,
        boxShadow: MODAL_SHADOW,
        overflow: 'hidden',
        pointerEvents: 'none',
        userSelect: 'none',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
        ...style,
      }}
      aria-hidden
    >
      {children}
    </div>
  );
}

function MockField({ label, labelSuffix, action, children }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 12,
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
          <div className="modal-section-label" style={{ color: C.ink900, fontSize: 13 }}>{label}</div>
          {labelSuffix != null && labelSuffix !== '' ? (
            <div className="modal-section-label modal-section-label-accent" style={{ fontSize: 13 }}>{labelSuffix}</div>
          ) : null}
        </div>
        {action ?? null}
      </div>
      {children}
    </div>
  );
}

function MockAttendeeRow({ person, visible = true }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 8,
        borderRadius: 10,
        minWidth: 0,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.45s ease',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 32,
          background: person.avatarBg,
          color: person.avatarText,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 11,
        }}
      >
        {person.name.slice(0, 1)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: C.ink900, lineHeight: 1.3 }}>
          {person.name}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 11, color: C.ink500, lineHeight: 1.3 }}>
          {person.team} · {person.roleShort}
        </div>
      </div>
    </div>
  );
}

/**
 * Real quickBase wizard mock for onboarding.
 * Fixed shell height; attendees fade in once (no loop / no height growth).
 * Next enables when title typing finishes (onTitleDone).
 */
export function CreateMeetingMock({ play = false, instant = false, onTitleDone }) {
  const containerRef = useRef(null);
  const playedRef = useRef(false);
  const titleDoneNotifiedRef = useRef(false);
  const onTitleDoneRef = useRef(onTitleDone);
  onTitleDoneRef.current = onTitleDone;
  const [entered, setEntered] = useState(instant);
  const [typedLen, setTypedLen] = useState(instant ? MOCK_MEETING.title.length : 0);
  const [detailsRevealed, setDetailsRevealed] = useState(instant);
  const [visibleAttendeeCount, setVisibleAttendeeCount] = useState(
    instant ? MOCK_MEETING.attendees.length : 0,
  );
  const [fitScale, setFitScale] = useState(CREATE_MODAL_SCALE);
  const [avail, setAvail] = useState({ w: 720, h: 640 });

  const titleShown = MOCK_MEETING.title.slice(0, typedLen);
  const titleDone = typedLen >= MOCK_MEETING.title.length;
  const allAttendees = MOCK_MEETING.attendees;
  const shownCount = Math.max(0, visibleAttendeeCount);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const update = () => {
      const availW = Math.max(0, el.clientWidth - MODAL_SHADOW_INSET * 2);
      const availH = Math.max(0, el.clientHeight - MODAL_SHADOW_INSET * 2 - NEXT_BUTTON_CLEARANCE);
      if (availW <= 0 || availH <= 0) return;
      const scale = Math.min(CREATE_MODAL_SCALE, availW / CREATE_MODAL_WIDTH, availH / 420);
      setFitScale(Math.max(0.72, scale));
      setAvail({ w: availW, h: availH });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (instant) {
      playedRef.current = true;
      titleDoneNotifiedRef.current = true;
      setEntered(true);
      setTypedLen(MOCK_MEETING.title.length);
      setDetailsRevealed(true);
      setVisibleAttendeeCount(MOCK_MEETING.attendees.length);
      onTitleDoneRef.current?.();
      return undefined;
    }
    if (!play) {
      playedRef.current = false;
      titleDoneNotifiedRef.current = false;
      setEntered(false);
      setTypedLen(0);
      setDetailsRevealed(false);
      setVisibleAttendeeCount(0);
      return undefined;
    }
    // Restart allowed only after leaving (play=false). While playing, do not re-run.
    if (playedRef.current) return undefined;

    let cancelled = false;
    const timers = [];
    // Force from→to so GRAPHIC_ENTER always paints (matches other pages).
    setEntered(false);
    timers.push(
      window.setTimeout(() => {
        if (!cancelled) setEntered(true);
      }, 40),
    );

    const typeStartMs = 700;
    const cps = 12;
    const typeInterval = Math.max(40, 1000 / cps);
    timers.push(
      window.setTimeout(() => {
        if (cancelled) return;
        let i = 0;
        const id = window.setInterval(() => {
          if (cancelled) {
            window.clearInterval(id);
            return;
          }
          i += 1;
          setTypedLen(i);
          if (i >= MOCK_MEETING.title.length) {
            window.clearInterval(id);
            if (!titleDoneNotifiedRef.current) {
              titleDoneNotifiedRef.current = true;
              playedRef.current = true;
              onTitleDoneRef.current?.();
            }
          }
        }, typeInterval);
        timers.push(id);
      }, typeStartMs),
    );

    const typeDoneMs = typeStartMs + MOCK_MEETING.title.length * typeInterval + 450;
    timers.push(
      window.setTimeout(() => {
        if (cancelled) return;
        if (!titleDoneNotifiedRef.current) {
          titleDoneNotifiedRef.current = true;
          playedRef.current = true;
          setTypedLen(MOCK_MEETING.title.length);
          onTitleDoneRef.current?.();
        }
        setDetailsRevealed(true);
      }, typeDoneMs),
    );

    const peopleStartMs = typeDoneMs + 400;
    timers.push(
      window.setTimeout(() => {
        if (!cancelled) setVisibleAttendeeCount(allAttendees.length);
      }, peopleStartMs),
    );

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [play, instant, allAttendees]);

  // Fixed final height: header + title + attendees (6) + bottom +40.
  const headerH = 69;
  const titleBlockH = 78;
  const bodyPadY = 10 + 24;
  const attendeeSearchH = 72;
  const attendeeGridH = 16 + Math.ceil(allAttendees.length / 2) * 52;
  const attendeesBottomExtra = 40;
  const detailsH = SECTION_GAP + attendeeSearchH + attendeeGridH + attendeesBottomExtra;
  const naturalH = headerH + bodyPadY + titleBlockH + detailsH;
  const maxCssH = avail.h / fitScale;
  const cssH = Math.min(maxCssH, Math.max(190, naturalH));
  const layoutW = CREATE_MODAL_WIDTH * fitScale;
  const layoutH = cssH * fitScale;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        minHeight: 0,
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        overflow: 'visible',
        boxSizing: 'border-box',
        padding: `0 ${MODAL_SHADOW_INSET}px ${MODAL_SHADOW_INSET}px`,
      }}
    >
      <div
        style={{
          width: layoutW,
          height: layoutH,
          maxWidth: '100%',
          maxHeight: '100%',
          position: 'relative',
          overflow: 'visible',
          opacity: entered ? 1 : 0,
          transform: entered ? GRAPHIC_ENTER.to : GRAPHIC_ENTER.from,
          transition: GRAPHIC_ENTER.transition,
          transformOrigin: GRAPHIC_ENTER.origin,
          pointerEvents: 'none',
          userSelect: 'none',
          filter: MODAL_DROP_SHADOW,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: CREATE_MODAL_WIDTH,
            height: cssH,
            transform: `scale(${fitScale})`,
            transformOrigin: 'top left',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <MockPanelShell
            width={CREATE_MODAL_WIDTH}
            height="100%"
            style={{
              maxHeight: '100%',
              minHeight: 0,
              flex: 1,
              overflow: 'hidden',
              boxShadow: 'none',
            }}
          >
            <div style={{ position: 'relative', padding: '24px 24px 20px', flexShrink: 0 }}>
              <span className="panel-header-title" style={{ fontSize: 19 }}>어떤 일정을 추가할까요?</span>
              <span
                style={{
                  position: 'absolute',
                  top: 24,
                  right: 24,
                  width: 16,
                  height: 16,
                  display: 'inline-flex',
                }}
              >
                <SvgIcon svg={xIcon} size={16} color={C.ink600} />
              </span>
            </div>

            <div
              style={{
                padding: '10px 24px 24px',
                flex: '1 1 auto',
                minHeight: 0,
                overflowX: 'hidden',
                overflowY: 'auto',
              }}
            >
              <MockField label="제목">
                <div
                  className="wizard-title-input"
                  style={{
                    height: 46,
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontFamily: FONT,
                    fontWeight: 500,
                    fontSize: 15,
                    width: '100%',
                    boxSizing: 'border-box',
                    color: titleShown ? C.ink900 : C.ink500,
                    display: 'flex',
                    alignItems: 'center',
                    border: `1px solid ${titleDone || typedLen > 0 ? C.blue : C.border}`,
                  }}
                >
                  {titleShown || (
                    <span style={{ color: C.ink500 }}>일정 이름을 입력해 주세요.</span>
                  )}
                  {!titleDone && entered && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: 2,
                        height: 18,
                        marginLeft: 1,
                        background: C.blue,
                        animation: 'onboarding-caret-blink 1s step-end infinite',
                      }}
                    />
                  )}
                </div>
              </MockField>

              <div
                style={{
                  marginTop: SECTION_GAP,
                  marginLeft: -8,
                  marginRight: -8,
                  paddingLeft: 8,
                  paddingRight: 8,
                  opacity: detailsRevealed ? 1 : 0,
                  transition: 'opacity 0.5s ease',
                  pointerEvents: 'none',
                }}
              >
                <MockField label="참석자" labelSuffix={shownCount >= 1 ? shownCount : null}>
                  <div
                    className="wizard-outline-control"
                    style={{
                      height: 46,
                      borderRadius: 10,
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: C.white,
                      width: '100%',
                      boxSizing: 'border-box',
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 15, color: C.ink500, flex: 1, textAlign: 'left' }}>
                      참석자 찾기
                    </span>
                    <SvgIcon svg={searchIcon} size={18} color={C.ink500} />
                  </div>
                  <div style={{ margin: '16px -4px 0', padding: '0 4px 40px' }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        columnGap: 8,
                        rowGap: 4,
                      }}
                    >
                      {allAttendees.map((person, index) => (
                        <MockAttendeeRow
                          key={person.id}
                          person={person}
                          visible={index < shownCount}
                        />
                      ))}
                    </div>
                  </div>
                </MockField>
              </div>
            </div>
          </MockPanelShell>
          <style>{'@keyframes onboarding-caret-blink { 50% { opacity: 0; } }'}</style>
        </div>
      </div>
    </div>
  );
}

export function PurposePriorityMock({ active = false, instant = false, onReady }) {
  const containerRef = useRef(null);
  const [activeId, setActiveId] = useState(PURPOSE_FLOW.purposes[0].id);
  const [tabPop, setTabPop] = useState(false);
  const [litCount, setLitCount] = useState(instant ? 99 : 0);
  const [poppingIndex, setPoppingIndex] = useState(-1);
  const [tabAnimKey, setTabAnimKey] = useState(0);
  const [interactive, setInteractive] = useState(instant);
  const [entered, setEntered] = useState(instant);
  const [fitScale, setFitScale] = useState(RECOMMEND_MODAL_SCALE);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const activePurpose = PURPOSE_FLOW.purposes.find((p) => p.id === activeId) ?? PURPOSE_FLOW.purposes[0];
  /** Same unscaled content width as recommend modal; scale fits available column. */
  const layoutW = RECOMMEND_MODAL_WIDTH * fitScale;
  const layoutH = PURPOSE_CONTENT_H * fitScale;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const update = () => {
      const availW = Math.max(0, el.clientWidth - MODAL_SHADOW_INSET * 2);
      const availH = Math.max(0, el.clientHeight - MODAL_SHADOW_INSET - NEXT_BUTTON_CLEARANCE);
      if (availW < 160 || availH < 200) return;
      const scale = Math.min(
        RECOMMEND_MODAL_SCALE,
        availW / RECOMMEND_MODAL_WIDTH,
        availH / PURPOSE_CONTENT_H,
      );
      setFitScale(Math.max(0.72, scale));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (instant) {
      setEntered(true);
      return undefined;
    }
    setEntered(false);
    const t = window.setTimeout(() => setEntered(true), 40);
    return () => window.clearTimeout(t);
  }, [instant]);

  useEffect(() => {
    if (instant) {
      setActiveId(PURPOSE_FLOW.purposes[0].id);
      setTabPop(false);
      setLitCount(99);
      setPoppingIndex(-1);
      setInteractive(true);
      onReadyRef.current?.();
      return undefined;
    }
    if (!active) {
      setActiveId(PURPOSE_FLOW.purposes[0].id);
      setTabPop(false);
      setLitCount(0);
      setPoppingIndex(-1);
      setInteractive(false);
      return undefined;
    }

    let cancelled = false;
    let purposeIndex = 0;
    const timers = [];
    const later = (ms, fn) => {
      const id = window.setTimeout(() => {
        if (cancelled) return;
        fn();
      }, ms);
      timers.push(id);
    };

    // Play all purposes once for demo; Next enables after first chip's cards finish.
    const TAB_POP_MS = 520;
    const ITEM_START_MS = 720;
    const ITEM_STAGGER_MS = 420;
    const HOLD_AFTER_MS = 1400;
    const ITEM_POP_MS = 360;
    let readyFired = false;

    const fireReady = () => {
      if (readyFired) return;
      readyFired = true;
      onReadyRef.current?.();
    };

    const finishInteractive = () => {
      setInteractive(true);
      setActiveId(PURPOSE_FLOW.purposes[0].id);
      setLitCount(99);
      setPoppingIndex(-1);
      setTabPop(false);
      fireReady();
    };

    const runPurpose = () => {
      if (cancelled) return;
      const purpose = PURPOSE_FLOW.purposes[purposeIndex];
      const itemCount = purpose.priorities.length;
      const isFirstPurpose = purposeIndex === 0;

      setActiveId(purpose.id);
      setLitCount(0);
      setPoppingIndex(-1);
      setTabPop(true);
      setTabAnimKey((k) => k + 1);

      later(TAB_POP_MS, () => setTabPop(false));

      for (let i = 0; i < itemCount; i += 1) {
        later(ITEM_START_MS + i * ITEM_STAGGER_MS, () => {
          setLitCount(i + 1);
          setPoppingIndex(i);
        });
      }

      if (isFirstPurpose) {
        const cardsDoneAt = ITEM_START_MS + (itemCount - 1) * ITEM_STAGGER_MS + ITEM_POP_MS;
        later(cardsDoneAt, fireReady);
      }

      const nextAt = ITEM_START_MS + (itemCount - 1) * ITEM_STAGGER_MS + HOLD_AFTER_MS;
      later(nextAt, () => {
        purposeIndex += 1;
        if (purposeIndex >= PURPOSE_FLOW.purposes.length) {
          finishInteractive();
          return;
        }
        runPurpose();
      });
    };

    runPurpose();

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [active, instant]);

  const selectPurpose = (purposeId) => {
    if (!interactive) return;
    setActiveId(purposeId);
    setLitCount(99);
    setPoppingIndex(-1);
    setTabPop(false);
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        pointerEvents: 'none',
        userSelect: interactive ? 'auto' : 'none',
        boxSizing: 'border-box',
        padding: `0 ${MODAL_SHADOW_INSET}px ${MODAL_SHADOW_INSET}px`,
        overflow: 'hidden',
      }}
    >
      <style>
        {`
          @keyframes onboarding-tab-pop {
            0% { transform: scale(1); }
            50% { transform: scale(1.04); }
            100% { transform: scale(1); }
          }
          @keyframes onboarding-item-pop {
            0% { transform: scale(0.97); opacity: 0.85; }
            55% { transform: scale(1.025); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .onboarding-tab-pop { animation: onboarding-tab-pop 0.44s ease-out 1; }
          .onboarding-item-pop { animation: onboarding-item-pop 0.38s ease-out 1; }
        `}
      </style>
      <div
        style={{
          width: layoutW,
          height: layoutH,
          maxWidth: '100%',
          position: 'relative',
          opacity: entered ? 1 : 0,
          transform: entered ? GRAPHIC_ENTER.to : GRAPHIC_ENTER.from,
          transition: GRAPHIC_ENTER.transition,
          transformOrigin: GRAPHIC_ENTER.origin,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: RECOMMEND_MODAL_WIDTH,
            height: PURPOSE_CONTENT_H,
            transform: `scale(${fitScale})`,
            transformOrigin: 'top left',
          }}
        >
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28, alignItems: 'center' }}>
            {PURPOSE_FLOW.purposes.map((purpose) => {
              const selected = purpose.id === activeId;
              return (
                <button
                  key={`${purpose.id}-${selected && tabPop ? tabAnimKey : 'idle'}`}
                  type="button"
                  className={selected && tabPop ? 'onboarding-tab-pop' : undefined}
                  disabled={!interactive}
                  onClick={(event) => {
                    event.stopPropagation();
                    selectPurpose(purpose.id);
                  }}
                  style={{
                    fontFamily: FONT,
                    fontSize: 15,
                    fontWeight: 600,
                    color: selected ? C.blue500 : C.ink900,
                    background: C.white,
                    border: selected ? `2px solid ${C.blue500}` : '2px solid transparent',
                    borderRadius: 999,
                    padding: '12px 18px',
                    transition: 'border-color 0.25s ease, color 0.25s ease, background 0.25s ease',
                    transformOrigin: 'center center',
                    cursor: interactive ? 'pointer' : 'default',
                    pointerEvents: interactive ? 'auto' : 'none',
                    boxSizing: 'border-box',
                    margin: 0,
                  }}
                >
                  {purpose.label}
                </button>
              );
            })}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 14, color: C.ink500, marginBottom: 14 }}>{activePurpose.hint}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', boxSizing: 'border-box' }}>
            {activePurpose.priorities.map((item, index) => {
              const lit = index < litCount;
              const popping = !interactive && index === poppingIndex;
              return (
                <div
                  key={`${activePurpose.id}-${index}${popping ? `-pop-${litCount}` : ''}`}
                  className={popping ? 'onboarding-item-pop' : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    width: '100%',
                    padding: '20px 20px 20px 28px',
                    borderRadius: 14,
                    background: lit ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
                    transition: 'background 0.25s ease',
                    transformOrigin: 'center center',
                    boxSizing: 'border-box',
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT,
                      fontSize: 16,
                      fontWeight: 600,
                      color: lit ? C.blue500 : C.ink600,
                      width: 20,
                      flexShrink: 0,
                      textAlign: 'center',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {index + 1}
                  </span>
                  <span style={{ fontFamily: FONT, fontSize: 17, fontWeight: 600, color: C.ink1000 }}>{item}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function FlashText({ active, children, style }) {
  return (
    <div className={active ? 'onboarding-text-flash' : undefined} style={style}>
      {children}
    </div>
  );
}

const CANDIDATE_FADE_OUT_MS = 480;
const CANDIDATE_FADE_IN_MS = 680;

export function LoadingToConfirmMock({
  stage,
  highlightSection,
  candidateIndex = 0,
  instant = false,
  onLoadingComplete,
}) {
  const containerRef = useRef(null);
  const shellRef = useRef(null);
  const loadingCompleteNotifiedRef = useRef(false);
  const onLoadingCompleteRef = useRef(onLoadingComplete);
  onLoadingCompleteRef.current = onLoadingComplete;
  const completedSteps = AI_LOADING_STEP_COUNT;
  const startCompleted = instant && stage === 'loading';
  const [loadingStepIndex, setLoadingStepIndex] = useState(startCompleted ? completedSteps : 0);
  const [loadingStepPhase, setLoadingStepPhase] = useState(startCompleted ? 'done' : 'working');
  const [entered, setEntered] = useState(instant);
  const [fitScale, setFitScale] = useState(RECOMMEND_MODAL_SCALE);
  const [avail, setAvail] = useState({ w: 720, h: 640 });
  const [shellH, setShellH] = useState(
    stage === 'loading' ? LOADING_MODAL_NATURAL_H : CONFIRM_MODAL_NATURAL_H,
  );
  const [contentIn, setContentIn] = useState(true);
  const [displayIndex, setDisplayIndex] = useState(
    Math.max(0, Math.min(candidateIndex, MOCK_CANDIDATES.length - 1)),
  );

  const targetIndex = Math.max(0, Math.min(candidateIndex, MOCK_CANDIDATES.length - 1));
  const candidate = MOCK_CANDIDATES[displayIndex];
  const isReady = candidate.status === 'ready';

  useEffect(() => {
    if (instant) {
      setEntered(true);
      return undefined;
    }
    setEntered(false);
    const t = window.setTimeout(() => setEntered(true), 40);
    return () => window.clearTimeout(t);
  }, [stage, instant]);

  useLayoutEffect(() => {
    if (stage === 'loading') {
      setShellH(LOADING_MODAL_NATURAL_H);
      return undefined;
    }
    const el = shellRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const update = () => {
      const h = Math.ceil(el.offsetHeight);
      if (h > 0) setShellH(h);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stage, displayIndex, contentIn]);

  useEffect(() => {
    if (stage !== 'confirm') {
      setDisplayIndex(targetIndex);
      setContentIn(true);
      return undefined;
    }
    if (targetIndex === displayIndex) return undefined;

    let cancelled = false;
    setContentIn(false);
    const swapTimer = window.setTimeout(() => {
      if (cancelled) return;
      setDisplayIndex(targetIndex);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) setContentIn(true);
        });
      });
    }, CANDIDATE_FADE_OUT_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(swapTimer);
    };
    // Only react to target changes; displayIndex equality is checked above.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: avoid restarting mid-fade on displayIndex update
  }, [targetIndex, stage]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const update = () => {
      const availW = Math.max(0, el.clientWidth - MODAL_SHADOW_INSET * 2);
      const availH = Math.max(0, el.clientHeight - MODAL_SHADOW_INSET - NEXT_BUTTON_CLEARANCE);
      if (availW < 160 || availH < 200) return;
      const naturalH = stage === 'loading' ? LOADING_MODAL_NATURAL_H : CONFIRM_MODAL_NATURAL_H;
      const scale = Math.min(
        RECOMMEND_MODAL_SCALE,
        availW / RECOMMEND_MODAL_WIDTH,
        availH / naturalH,
      );
      setFitScale(Math.max(0.72, scale));
      setAvail({ w: availW, h: availH });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stage]);

  useEffect(() => {
    if (stage !== 'loading') return undefined;
    if (instant) {
      setLoadingStepIndex(AI_LOADING_STEP_COUNT);
      setLoadingStepPhase('done');
      if (!loadingCompleteNotifiedRef.current) {
        loadingCompleteNotifiedRef.current = true;
        onLoadingCompleteRef.current?.();
      }
      return undefined;
    }
    loadingCompleteNotifiedRef.current = false;
    setLoadingStepIndex(0);
    setLoadingStepPhase('working');
    let step = 0;
    let phase = 'working';
    const tick = () => {
      if (phase === 'working') {
        phase = 'done';
        setLoadingStepPhase('done');
        if (step >= AI_LOADING_STEP_COUNT - 1) {
          if (!loadingCompleteNotifiedRef.current) {
            loadingCompleteNotifiedRef.current = true;
            onLoadingCompleteRef.current?.();
          }
          return null;
        }
        return AI_STEP_DONE_HOLD_MS;
      }
      step += 1;
      if (step >= AI_LOADING_STEP_COUNT) {
        return null;
      }
      phase = 'working';
      setLoadingStepIndex(step);
      setLoadingStepPhase('working');
      return AI_STEP_ACTIVE_MS;
    };
    let delay = AI_STEP_ACTIVE_MS;
    let timer = window.setTimeout(function loop() {
      delay = tick();
      if (delay == null) return;
      timer = window.setTimeout(loop, delay);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [stage, instant]);

  const reasonFlash = highlightSection === 'reasons';
  const checkpointFlash = highlightSection === 'checkpoints';
  const naturalCap = stage === 'loading' ? LOADING_MODAL_NATURAL_H : CONFIRM_MODAL_NATURAL_H;
  const maxCssH = avail.h / fitScale;
  const layoutCssH =
    stage === 'loading'
      ? Math.min(maxCssH, LOADING_MODAL_NATURAL_H)
      : Math.min(maxCssH, shellH > 0 ? shellH : naturalCap);
  const layoutW = RECOMMEND_MODAL_WIDTH * fitScale;
  const layoutH = layoutCssH * fitScale;
  const room = candidate.room;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        minHeight: 0,
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        overflow: 'visible',
        boxSizing: 'border-box',
        padding: `${0}px ${MODAL_SHADOW_INSET}px ${MODAL_SHADOW_INSET}px`,
      }}
    >
      <style>
        {`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes onboarding-text-flash {
            0% { opacity: 1; }
            35% { opacity: 0.22; }
            70% { opacity: 1; }
            100% { opacity: 1; }
          }
          .onboarding-text-flash {
            animation: onboarding-text-flash 0.9s ease-in-out 1;
          }
          .onboarding-ai-steps > div > div {
            font-size: 15px !important;
          }
        `}
      </style>
      <div
        style={{
          width: layoutW,
          height: layoutH,
          maxWidth: '100%',
          maxHeight: '100%',
          position: 'relative',
          overflow: 'visible',
          opacity: entered ? 1 : 0,
          transform: entered ? GRAPHIC_ENTER.to : GRAPHIC_ENTER.from,
          transition: GRAPHIC_ENTER.transition,
          transformOrigin: GRAPHIC_ENTER.origin,
          pointerEvents: 'none',
          userSelect: 'none',
          filter: MODAL_DROP_SHADOW,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: RECOMMEND_MODAL_WIDTH,
            height: layoutCssH,
            transform: `scale(${fitScale})`,
            transformOrigin: 'top left',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
          }}
        >
          <div ref={shellRef} style={{ flex: '0 0 auto', maxHeight: maxCssH }}>
          <MockPanelShell
            width={RECOMMEND_MODAL_WIDTH}
            height={stage === 'loading' ? LOADING_MODAL_NATURAL_H : 'auto'}
            style={{ maxHeight: maxCssH, minHeight: 0, overflow: 'hidden', boxShadow: 'none' }}
          >
            {stage === 'loading' ? (
              <>
                <div style={{ padding: '24px 24px 20px', flexShrink: 0 }}>
                  <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.ink1000 }}>{MOCK_MEETING.title}</div>
                </div>
                <div style={{ padding: '20px 24px 32px', minHeight: 0, overflow: 'hidden' }} className="onboarding-ai-steps">
                  <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.ink900, marginBottom: 24 }}>
                    가능한 일정을 찾아볼게요
                  </div>
                  <AiThinkingStepList
                    loadingStepIndex={loadingStepIndex}
                    loadingStepPhase={loadingStepPhase}
                    Check={MockCheck}
                    Spinner={MockSpinner}
                    reservePendingSpace
                  />
                </div>
              </>
            ) : (
              <>
                {/* Header — mirrors CreationWizard recommend header */}
                <div
                  style={{
                    position: 'relative',
                    padding: '24px 24px 20px',
                    borderBottom: `1px solid ${C.border}`,
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontFamily: FONT, fontSize: 15, color: C.ink600, display: 'block', paddingRight: 28 }}>
                    {MOCK_MEETING.recommendTitle}
                    <span style={{ marginLeft: 6, textDecoration: 'underline', textUnderlineOffset: 2 }}>조건 수정</span>
                  </span>
                  <span style={{ position: 'absolute', top: 24, right: 24, width: 16, height: 16, display: 'inline-flex' }}>
                    <SvgIcon svg={xIcon} size={16} color={C.ink600} />
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: '0 0 auto',
                  }}
                >
                  <div
                    style={{
                      minHeight: 0,
                      overflowY: 'visible',
                      opacity: contentIn ? 1 : 0,
                      transform: contentIn ? 'translateY(0)' : 'translateY(12px)',
                      transition: contentIn
                        ? `opacity ${CANDIDATE_FADE_IN_MS}ms ease, transform ${CANDIDATE_FADE_IN_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1)`
                        : `opacity ${CANDIDATE_FADE_OUT_MS}ms ease, transform ${CANDIDATE_FADE_OUT_MS}ms ease`,
                      willChange: 'opacity, transform',
                    }}
                  >
                    <div
                      style={{
                        padding: `${RECOMMEND_CONTENT_TOP_PAD}px 24px 0`,
                        display: 'flex',
                        flexDirection: 'column',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            fontFamily: FONT,
                            fontWeight: 600,
                            fontSize: 15,
                            color: isReady ? C.blue : C.ink900,
                          }}
                        >
                          {candidate.statusLabel}
                        </span>
                        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.ink900 }}>
                          {displayIndex + 1} / {MOCK_CANDIDATES.length}
                        </span>
                      </div>
                      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 21, color: C.black }}>
                          {candidate.dateLabel}
                        </div>
                        <div style={{ fontFamily: FONT, fontSize: 13, color: C.ink800 }}>{candidate.weekdayLabel}</div>
                        {candidate.coordinationHint && (
                          <div style={{ fontFamily: FONT, fontSize: 14, color: C.ink600, lineHeight: '20px' }}>
                            {candidate.coordinationHint}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ paddingBottom: SECTION_GAP, display: 'flex', flexDirection: 'column' }}>
                      {/* Ready: validation reasons */}
                      {isReady && candidate.reasons?.length > 0 && (
                        <FlashText
                          key={reasonFlash ? `reasons-flash-${displayIndex}` : `reasons-idle-${displayIndex}`}
                          active={reasonFlash}
                          flashKey={`reasons-${displayIndex}`}
                          style={{
                            padding: '0 24px',
                            marginTop: BELOW_WEEKDAY_CONTENT_MARGIN,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: REASON_ROW_GAP,
                          }}
                        >
                          {candidate.reasons.map((reason) => (
                            <div
                              key={reason}
                              style={{
                                display: 'flex',
                                gap: 6,
                                alignItems: 'flex-start',
                                fontSize: 15,
                                lineHeight: '20px',
                                color: C.ink900,
                                fontFamily: FONT,
                              }}
                            >
                              <span style={{ flexShrink: 0, marginTop: 2, display: 'inline-flex' }}>
                                <SvgIcon svg={checkIcon} size={16} color={C.blue} />
                              </span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </FlashText>
                      )}

                      {/* Ready: 참고할 점 */}
                      {isReady && candidate.references?.length > 0 && (
                        <div style={{ padding: '0 24px', marginTop: SECTION_GAP }}>
                          <div
                            style={{
                              fontFamily: FONT,
                              fontWeight: 600,
                              fontSize: 15,
                              color: C.ink900,
                              lineHeight: '20px',
                              marginBottom: 12,
                            }}
                          >
                            참고할 점
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: REASON_ROW_GAP }}>
                            {candidate.references.map((item) => (
                              <div key={item.title} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                <span
                                  style={{
                                    width: 16,
                                    height: 23,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  <SvgIcon svg={checkpointDotIcon} size={16} color={C.ink500} />
                                </span>
                                <div style={{ fontFamily: FONT, fontSize: 15, color: C.ink900, lineHeight: '23px' }}>
                                  <span style={{ fontWeight: 500 }}>{item.title}</span>
                                  {item.description ? (
                                    <span style={{ fontWeight: 400, marginLeft: 6, color: C.ink800 }}>{item.description}</span>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Needs coordination */}
                      {!isReady && (
                        <FlashText
                          key={checkpointFlash ? `coord-flash-${displayIndex}` : `coord-idle-${displayIndex}`}
                          active={checkpointFlash}
                          flashKey={`coord-${displayIndex}`}
                          style={{ padding: '0 24px', marginTop: BELOW_WEEKDAY_CONTENT_MARGIN }}
                        >
                          {candidate.coordinationHeadline && (
                            <div
                              style={{
                                fontFamily: FONT,
                                fontWeight: 600,
                                fontSize: 15,
                                color: C.ink900,
                                lineHeight: '22px',
                                marginBottom: 12,
                              }}
                            >
                              {candidate.coordinationHeadline}
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: REASON_ROW_GAP }}>
                            {(candidate.checkpoints || []).map((item) => (
                              <div key={item.text} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                <span style={{ flexShrink: 0, marginTop: 2, display: 'inline-flex' }}>
                                  <SvgIcon svg={exclamationIcon} size={16} color={C.ink500} />
                                </span>
                                <div style={{ fontFamily: FONT, fontSize: 15, color: C.ink900, lineHeight: '20px' }}>
                                  {item.text}
                                </div>
                              </div>
                            ))}
                          </div>
                        </FlashText>
                      )}

                      {/* RoomPicker closed state */}
                      {room && (
                        <div style={{ padding: '0 24px', marginTop: SECTION_GAP }}>
                          <div
                            className="modal-section-label"
                            style={{ color: C.ink900, marginBottom: 12, fontFamily: FONT, fontWeight: 600, fontSize: 15, lineHeight: '20px' }}
                          >
                            회의실
                          </div>
                          <div
                            style={{
                              width: '100%',
                              border: `1px solid ${C.border}`,
                              borderRadius: 10,
                              padding: '14px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: C.white,
                              boxSizing: 'border-box',
                            }}
                          >
                            <div style={{ fontFamily: FONT, fontSize: 15, color: C.black, lineHeight: '20px' }}>
                              {room.tower} {room.name} ({room.capacity}인)
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                color: C.ink600,
                                fontSize: 13,
                                flexShrink: 0,
                                fontFamily: FONT,
                              }}
                            >
                              변경
                              <SvgIcon svg={chevronRightIcon} size={14} color={C.ink500} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      padding: '20px 24px 24px',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        height: 42,
                        minWidth: 120,
                        padding: '0 12px',
                        borderRadius: 10,
                        background: C.blue,
                        color: C.white,
                        fontFamily: FONT,
                        fontWeight: 500,
                        fontSize: 17,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      선택하기
                    </div>
                  </div>
                </div>
              </>
            )}
          </MockPanelShell>
          </div>
        </div>
      </div>
    </div>
  );
}

const DETAIL_MODAL_WIDTH = 460;
const TOAST_ENTER_MS = 360;
const TOAST_HOLD_MS = 2400;
const TOAST_EXIT_MS = 360;
const PRESS_HOVER_BG = 'rgba(17, 24, 39, 0.04)';

/**
 * Play-once demo: 확인 필요(조율) 일정 → 안내 모달 → 복사 → 토스트.
 */
export function CoordinationActionMock({ play = false, instant = false, onComplete }) {
  const containerRef = useRef(null);
  const [fitScale, setFitScale] = useState(RECOMMEND_MODAL_SCALE);
  const [avail, setAvail] = useState({ w: 720, h: 640 });
  const [phase, setPhase] = useState(instant ? 'done' : 'idle');
  // idle | recommend | press | guide | copyPulse | toast | done
  const candidate = MOCK_CANDIDATES[2];
  const room = candidate.room;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const update = () => {
      const availW = Math.max(0, el.clientWidth - MODAL_SHADOW_INSET * 2);
      const availH = Math.max(0, el.clientHeight - MODAL_SHADOW_INSET - NEXT_BUTTON_CLEARANCE);
      if (availW < 200 || availH < 200) return;
      const scale = Math.min(RECOMMEND_MODAL_SCALE, availW / RECOMMEND_MODAL_WIDTH, availH / 420);
      setFitScale(Math.max(0.72, scale));
      setAvail({ w: availW, h: availH });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (instant) {
      setPhase('done');
      onComplete?.();
      return undefined;
    }
    if (!play) {
      setPhase('idle');
      return undefined;
    }

    const timers = [];
    const at = (ms, next) => {
      timers.push(window.setTimeout(() => setPhase(next), ms));
    };

    // Slower beat so each step is readable: recommend → press → guide → copy → toast
    at(80, 'recommend');
    at(2000, 'press');
    at(3200, 'guide');
    at(5400, 'copyPulse');
    at(6600, 'toast');
    timers.push(
      window.setTimeout(() => {
        setPhase('done');
        onComplete?.();
      }, 6600 + TOAST_ENTER_MS + TOAST_HOLD_MS + TOAST_EXIT_MS + 300),
    );

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [play, instant, onComplete]);

  const maxCssH = avail.h / fitScale;
  const cssH = Math.min(maxCssH, CONFIRM_MODAL_NATURAL_H);
  const layoutW = RECOMMEND_MODAL_WIDTH * fitScale;
  const layoutH = cssH * fitScale;
  const showRecommend = phase !== 'idle';
  const showGuide = phase === 'guide' || phase === 'copyPulse' || phase === 'toast' || phase === 'done';
  const showToast = !instant && (phase === 'toast' || phase === 'done');
  const pressing = phase === 'press';
  const pressHighlight = pressing || showGuide;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        minHeight: 0,
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        overflow: 'visible',
        boxSizing: 'border-box',
        padding: `${0}px ${MODAL_SHADOW_INSET}px ${MODAL_SHADOW_INSET}px`,
        position: 'relative',
      }}
    >
      <style>
        {`
          @keyframes onboarding-press-gray {
            0% { background: transparent; }
            35% { background: ${PRESS_HOVER_BG}; }
            100% { background: ${PRESS_HOVER_BG}; }
          }
        `}
      </style>

      <div
        style={{
          width: layoutW,
          height: layoutH,
          maxWidth: '100%',
          maxHeight: '100%',
          position: 'relative',
          overflow: 'visible',
          opacity: showRecommend ? 1 : 0,
          transform: showRecommend ? GRAPHIC_ENTER.to : GRAPHIC_ENTER.from,
          transition: GRAPHIC_ENTER.transition,
          transformOrigin: GRAPHIC_ENTER.origin,
          pointerEvents: 'none',
          userSelect: 'none',
          filter: MODAL_DROP_SHADOW,
        }}
      >
        {showToast && (
          <MockCopyToast message={MOCK_COORDINATION.toastMessage} leave={phase === 'done'} />
        )}

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: RECOMMEND_MODAL_WIDTH,
            height: cssH,
            transform: `scale(${fitScale})`,
            transformOrigin: 'top left',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <MockPanelShell
            width={RECOMMEND_MODAL_WIDTH}
            height="auto"
            style={{ maxHeight: cssH, minHeight: 0, overflow: 'hidden', boxShadow: 'none' }}
          >
            {/* Header — same as propose recommend modal */}
            <div
              style={{
                position: 'relative',
                padding: '24px 24px 20px',
                borderBottom: `1px solid ${C.border}`,
                flexShrink: 0,
              }}
            >
              <span style={{ fontFamily: FONT, fontSize: 15, color: C.ink600, display: 'block', paddingRight: 28 }}>
                {MOCK_MEETING.recommendTitle}
                <span style={{ marginLeft: 6, textDecoration: 'underline', textUnderlineOffset: 2 }}>조건 수정</span>
              </span>
              <span style={{ position: 'absolute', top: 24, right: 24, width: 16, height: 16, display: 'inline-flex' }}>
                <SvgIcon svg={xIcon} size={16} color={C.ink600} />
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', flex: '0 0 auto' }}>
              <div style={{ minHeight: 0 }}>
                <div
                  style={{
                    padding: `${RECOMMEND_CONTENT_TOP_PAD}px 24px 0`,
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.ink900 }}>
                      {candidate.statusLabel}
                    </span>
                    <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.ink900 }}>
                      3 / {MOCK_CANDIDATES.length}
                    </span>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 21, color: C.black }}>
                      {candidate.dateLabel}
                    </div>
                    <div style={{ fontFamily: FONT, fontSize: 13, color: C.ink800 }}>{candidate.weekdayLabel}</div>
                    {candidate.coordinationHint && (
                      <div style={{ fontFamily: FONT, fontSize: 14, color: C.ink600, lineHeight: '20px' }}>
                        {candidate.coordinationHint}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ paddingBottom: SECTION_GAP, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '0 24px', marginTop: BELOW_WEEKDAY_CONTENT_MARGIN }}>
                    {candidate.coordinationHeadline && (
                      <div
                        style={{
                          fontFamily: FONT,
                          fontWeight: 600,
                          fontSize: 15,
                          color: C.ink900,
                          lineHeight: '22px',
                          marginBottom: 12,
                        }}
                      >
                        {candidate.coordinationHeadline}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: REASON_ROW_GAP }}>
                      {(candidate.checkpoints || []).map((item, index) => (
                        <div
                          key={item.text}
                          style={{
                            display: 'flex',
                            gap: 6,
                            alignItems: 'flex-start',
                            padding: '10px 10px',
                            margin: '0 -10px',
                            borderRadius: 12,
                            background: index === 0 && pressHighlight ? PRESS_HOVER_BG : 'transparent',
                            animation: index === 0 && pressing ? 'onboarding-press-gray 0.7s ease-out 1' : undefined,
                            transition: 'background 0.4s ease',
                            outline: index === 0 && pressing ? `1.5px solid ${C.blue500}` : '1.5px solid transparent',
                          }}
                        >
                          <span style={{ flexShrink: 0, marginTop: 2, display: 'inline-flex' }}>
                            <SvgIcon svg={exclamationIcon} size={16} color={C.ink500} />
                          </span>
                          <div style={{ flex: 1, fontFamily: FONT, fontSize: 15, color: C.ink900, lineHeight: '20px' }}>
                            {item.text}
                          </div>
                          {index === 0 && (
                            <span style={{ flexShrink: 0, marginTop: 2, display: 'inline-flex', opacity: pressHighlight ? 1 : 0.45 }}>
                              <SvgIcon svg={chevronRightIcon} size={14} color={C.ink500} />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {room && (
                    <div style={{ padding: '0 24px', marginTop: SECTION_GAP }}>
                      <div
                        className="modal-section-label"
                        style={{ color: C.ink900, marginBottom: 12, fontFamily: FONT, fontWeight: 600, fontSize: 15, lineHeight: '20px' }}
                      >
                        회의실
                      </div>
                      <div
                        style={{
                          width: '100%',
                          border: `1px solid ${C.border}`,
                          borderRadius: 10,
                          padding: '14px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: C.white,
                          boxSizing: 'border-box',
                        }}
                      >
                        <div style={{ fontFamily: FONT, fontSize: 15, color: C.black, lineHeight: '20px' }}>
                          {room.tower} {room.name} ({room.capacity}인)
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            color: C.ink600,
                            fontSize: 13,
                            flexShrink: 0,
                            fontFamily: FONT,
                          }}
                        >
                          변경
                          <SvgIcon svg={chevronRightIcon} size={14} color={C.ink500} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  padding: '20px 24px 24px',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    height: 42,
                    minWidth: 120,
                    padding: '0 12px',
                    borderRadius: 10,
                    background: C.blue,
                    color: C.white,
                    fontFamily: FONT,
                    fontWeight: 500,
                    fontSize: 17,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  선택하기
                </div>
              </div>
            </div>
          </MockPanelShell>

          {/* Guide detail — same scaled space as recommend modal so flex centers correctly */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: showGuide ? 'rgba(25, 31, 40, 0.16)' : 'rgba(25, 31, 40, 0)',
              opacity: showGuide ? 1 : 0,
              transition: 'opacity 0.55s ease, background 0.55s ease',
              borderRadius: 24,
              overflow: 'hidden',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: DETAIL_MODAL_WIDTH,
                maxWidth: '92%',
                transform: showGuide ? 'translateY(0)' : 'translateY(18px)',
                opacity: showGuide ? 1 : 0,
                transition: 'opacity 0.6s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
                filter: MODAL_DROP_SHADOW,
                flexShrink: 0,
              }}
            >
              <MockPanelShell width="100%" style={{ boxShadow: 'none', maxWidth: DETAIL_MODAL_WIDTH }}>
                <div style={{ position: 'relative', padding: '24px 24px 16px' }}>
                  <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 19, color: C.ink1000 }}>
                    {MOCK_COORDINATION.eventTitle}
                  </span>
                  <div style={{ fontFamily: FONT, fontSize: 13, color: C.ink600, marginTop: 6 }}>
                    {MOCK_COORDINATION.owner.name} · {MOCK_COORDINATION.owner.team}
                  </div>
                  <span style={{ position: 'absolute', top: 24, right: 24, display: 'inline-flex' }}>
                    <SvgIcon svg={xIcon} size={16} color={C.ink600} />
                  </span>
                </div>
                <div style={{ padding: '20px 24px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 15, color: C.ink900, fontFamily: FONT }}>
                    <SvgIcon svg={calendarIcon} size={16} color={C.ink500} />
                    {MOCK_COORDINATION.dateLabel}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 15, color: C.ink900, fontFamily: FONT }}>
                    <SvgIcon svg={clockIcon} size={16} color={C.ink500} />
                    {MOCK_COORDINATION.timeLabel}
                  </div>
                </div>
                <div style={{ padding: `${SECTION_GAP}px 24px 40px` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.ink900 }}>
                      {MOCK_COORDINATION.guideTitle}
                    </div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontFamily: FONT,
                        fontSize: 13,
                        fontWeight: 500,
                        color: C.ink600,
                        lineHeight: '18px',
                      }}
                    >
                      <SvgIcon svg={copyIcon} size={12} color="currentColor" />
                      복사
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 12,
                      borderRadius: 10,
                      background: C.gray100,
                      padding: '12px 14px',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: FONT,
                        fontSize: 13,
                        lineHeight: '20px',
                        color: C.ink900,
                        wordBreak: 'keep-all',
                      }}
                    >
                      {MOCK_COORDINATION.draft}
                    </div>
                  </div>
                </div>
              </MockPanelShell>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockCopyToast({ message, leave = false }) {
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!leave) return undefined;
    setLeaving(true);
    return undefined;
  }, [leave]);

  const visible = entered && !leaving;
  const slideMs = leaving ? TOAST_EXIT_MS : TOAST_ENTER_MS;

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: visible
          ? 'translate(-50%, 0) scale(1)'
          : 'translate(-50%, calc(-100% - 20px)) scale(0.96)',
        opacity: visible ? 1 : 0,
        transition: `transform ${slideMs}ms ${leaving ? 'ease-in' : 'ease-out'}, opacity ${slideMs}ms ${leaving ? 'ease-in' : 'ease-out'}`,
        transformOrigin: 'center top',
        background: C.ink900,
        color: C.white,
        borderRadius: 9999,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: FONT,
        fontWeight: 500,
        fontSize: 14,
        zIndex: 6,
        boxShadow: '0 10px 28px rgba(0,0,0,0.16)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: C.green500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <SvgIcon svg={checkIcon} size={11} color={C.white} />
      </div>
      <span>{message}</span>
    </div>
  );
}
