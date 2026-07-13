import { useCallback, useEffect, useRef, useState } from 'react';
import arrowRightAndroidIcon from '../assets/icons/icon-arrow-right-android-mono.svg?raw';
import {
  BG_BLUE100,
  BG_GRAY100,
  C,
  CoordinationActionMock,
  CreateMeetingMock,
  FactorSections,
  Fade,
  FONT,
  Headline,
  LoadingToConfirmMock,
  PAD,
  PurposePriorityMock,
  SUBTITLE_HEADLINE_GAP,
  HEADLINE_BOTTOM_PAD,
  Subtitle,
} from './OnboardingPanels';

const SLIDE_MS = 480;
const BG_TRANSITION_MS = 500;

const SCENE = {
  cover: 1,
  factors: 2,
  multiply: 3,
  judgment: 4,
  whatIf: 5,
  enterInfo: 6,
  purpose: 7,
  find: 8,
  propose: 9,
  act: 10,
  finale: 11,
};

function normalizeSvg(svg) {
  return svg
    .replace(/width="[^"]*"/i, 'width="100%"')
    .replace(/height="[^"]*"/i, 'height="100%"')
    .replace(/fill="(?!none)[^"]*"/gi, 'fill="currentColor"')
    .replace(/stroke="(?!none)[^"]*"/gi, 'stroke="currentColor"');
}

function NextButton({ enabled, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        if (!enabled) return;
        onClick?.();
      }}
      disabled={!enabled}
      onMouseEnter={() => enabled && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'absolute',
        right: 100,
        bottom: 100,
        zIndex: 3,
        border: 'none',
        background: enabled ? (hover ? '#1b64da' : C.blue500) : C.gray300,
        color: enabled ? C.white : C.ink500,
        borderRadius: 9999,
        padding: '26px 46px 26px 48px',
        fontFamily: FONT,
        fontSize: 26,
        fontWeight: 600,
        lineHeight: 1.2,
        cursor: enabled ? 'pointer' : 'default',
        boxShadow: '0 10px 28px rgba(25, 31, 40, 0.16), 0 2px 8px rgba(25, 31, 40, 0.08)',
        transition: 'background 0.55s ease, color 0.55s ease, box-shadow 0.55s ease, transform 0.2s ease',
        transform: enabled && hover ? 'translateY(-1px)' : 'translateY(0)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      다음
      <span
        aria-hidden="true"
        style={{
          width: 24,
          height: 24,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'currentColor',
          lineHeight: 0,
        }}
        dangerouslySetInnerHTML={{ __html: normalizeSvg(arrowRightAndroidIcon) }}
      />
    </button>
  );
}

function StartButton({ onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: 'none',
        background: hover ? '#1b64da' : C.blue500,
        color: C.white,
        borderRadius: 9999,
        padding: '26px 48px',
        fontFamily: FONT,
        fontSize: 26,
        fontWeight: 600,
        lineHeight: 1.2,
        cursor: 'pointer',
        boxShadow: '0 10px 28px rgba(25, 31, 40, 0.16), 0 2px 8px rgba(25, 31, 40, 0.08)',
        transition: 'background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
        transform: hover ? 'translateY(-1px)' : 'translateY(0)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      시작하기
    </button>
  );
}

function useSceneTimeline(activeKey, delaysMs, instant = false) {
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const delaysKey = delaysMs ? delaysMs.join(',') : '';
  const totalSteps = delaysMs?.length ?? 0;

  useEffect(() => {
    if (!activeKey || !delaysMs?.length) {
      setStep(0);
      setReady(false);
      return undefined;
    }

    if (instant) {
      setStep(totalSteps);
      setReady(true);
      return undefined;
    }

    setStep(0);
    setReady(false);
    const timers = [];
    let elapsed = 0;
    delaysMs.forEach((delay, index) => {
      elapsed += delay;
      timers.push(
        window.setTimeout(() => {
          setStep(index + 1);
          if (index === delaysMs.length - 1) setReady(true);
        }, elapsed),
      );
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- delaysKey captures delaysMs
  }, [activeKey, delaysKey, instant, totalSteps]);

  return { step, ready };
}

/** Mount then fade in — for sequential line reveals. */
function AppearHeadline({ children, style }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), 30);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <Headline show={show} style={style}>
      {children}
    </Headline>
  );
}

export default function OnboardingIntro({ exiting = false, onStartReveal, onExitComplete }) {
  const [scene, setScene] = useState(SCENE.cover);
  const [doneScenes, setDoneScenes] = useState(() => new Set());
  const exitCompletedRef = useRef(false);
  const sceneInstant = doneScenes.has(scene);

  const sceneCover = useSceneTimeline(
    scene === SCENE.cover ? 'cover' : '',
    [400, 700],
    scene === SCENE.cover && sceneInstant,
  );
  const scene1 = useSceneTimeline(scene === SCENE.factors ? '1' : '', [400, 700, 800, 900], scene === SCENE.factors && sceneInstant);
  const scene2 = useSceneTimeline(
    scene === SCENE.multiply ? '2' : '',
    // headline → multiply start (당겨서) → copy lines finish (5 × 260ms + buffer)
    [700, 550, 1500],
    scene === SCENE.multiply && sceneInstant,
  );
  const scene3 = useSceneTimeline(scene === SCENE.judgment ? '3' : '', [500, 900, 900], scene === SCENE.judgment && sceneInstant);
  const scene4 = useSceneTimeline(
    scene === SCENE.whatIf ? '4' : '',
    // 만약 → 확정할 수 있는 시간 → 근거 → (2.7s) 의사결정 문구 → nextEnabled +0.3s
    [350, 650, 700, 1000],
    scene === SCENE.whatIf && sceneInstant,
  );
  const scene6 = useSceneTimeline(scene === SCENE.purpose ? '6' : '', [500, 1200], scene === SCENE.purpose && sceneInstant);
  const sceneFinale = useSceneTimeline(scene === SCENE.finale ? 'finale' : '', [400, 700, 700], scene === SCENE.finale && sceneInstant);

  const [createModalPlay, setCreateModalPlay] = useState(false);
  const [scene5Ready, setScene5Ready] = useState(false);
  const [enterHeadStep, setEnterHeadStep] = useState(0);

  useEffect(() => {
    if (scene !== SCENE.enterInfo) {
      setCreateModalPlay(false);
      setScene5Ready(false);
      setEnterHeadStep(0);
      return undefined;
    }
    if (sceneInstant) {
      setEnterHeadStep(2);
      setCreateModalPlay(true);
      setScene5Ready(true);
      return undefined;
    }

    setScene5Ready(false);
    setCreateModalPlay(false);
    setEnterHeadStep(0);

    const timers = [];
    const at = (ms, fn) => {
      timers.push(window.setTimeout(fn, ms));
    };

    at(400, () => setEnterHeadStep(1));
    at(400 + 500, () => setEnterHeadStep(2));
    // Right graphic enters after headlines — same GRAPHIC_ENTER beat as other pages
    at(400 + 500 + 280, () => setCreateModalPlay(true));

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [scene, sceneInstant]);

  const handleCreateTitleDone = useCallback(() => {
    setScene5Ready(true);
  }, []);

  const [scene6AnimDone, setScene6AnimDone] = useState(false);
  useEffect(() => {
    if (scene !== SCENE.purpose) {
      setScene6AnimDone(false);
      return undefined;
    }
    if (sceneInstant) {
      setScene6AnimDone(true);
      return undefined;
    }
    setScene6AnimDone(false);
    return undefined;
  }, [scene, sceneInstant]);

  const handlePurposeReady = useCallback(() => {
    setScene6AnimDone(true);
  }, []);

  // Find: headlines + loading only
  const [findHeadStep, setFindHeadStep] = useState(0);
  const [findShowLoading, setFindShowLoading] = useState(false);
  const [findLoadingDone, setFindLoadingDone] = useState(false);
  const [scene7Ready, setScene7Ready] = useState(false);
  const findSkipAnim = sceneInstant || findLoadingDone;
  useEffect(() => {
    if (scene !== SCENE.find) {
      setFindHeadStep(0);
      setFindShowLoading(false);
      setScene7Ready(false);
      return undefined;
    }
    if (findSkipAnim) {
      setFindHeadStep(1);
      setFindShowLoading(true);
      setScene7Ready(true);
      return undefined;
    }

    const timers = [];
    const at = (ms, fn) => {
      timers.push(window.setTimeout(fn, ms));
    };

    at(400, () => setFindHeadStep(1));
    at(400 + 700, () => {
      setFindShowLoading(true);
      setScene7Ready(true);
    });

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [scene, findSkipAnim]);

  const handleFindLoadingComplete = useCallback(() => {
    setFindLoadingDone(true);
  }, []);

  // Propose: headlines + recommend modal candidate cycle
  const [proposeHeadStep, setProposeHeadStep] = useState(0);
  // 0 idle · 1 cand0 · 2 cand1 · 3 cand0 hold
  const [proposeModalStep, setProposeModalStep] = useState(0);
  const [scene8Ready, setScene8Ready] = useState(false);
  useEffect(() => {
    if (scene !== SCENE.propose) {
      setProposeHeadStep(0);
      setProposeModalStep(0);
      setScene8Ready(false);
      return undefined;
    }
    if (sceneInstant) {
      setProposeHeadStep(3);
      setProposeModalStep(3);
      setScene8Ready(true);
      return undefined;
    }

    const timers = [];
    const at = (ms, fn) => {
      timers.push(window.setTimeout(fn, ms));
    };

    at(400, () => setProposeHeadStep(1));
    at(400 + 700, () => setProposeHeadStep(2));
    at(400 + 700 + 700, () => {
      setProposeHeadStep(3);
      setScene8Ready(true);
    });

    const modalStartMs = 400 + 700 + 700 + 500;
    at(modalStartMs, () => setProposeModalStep(1));
    at(modalStartMs + 3800, () => setProposeModalStep(2));
    at(modalStartMs + 3800 + 3800, () => setProposeModalStep(3));

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [scene, sceneInstant]);

  const [actPlay, setActPlay] = useState(false);
  const [scene9Ready, setScene9Ready] = useState(false);
  useEffect(() => {
    if (scene !== SCENE.act) {
      setActPlay(false);
      setScene9Ready(false);
      return undefined;
    }
    if (sceneInstant) {
      setActPlay(true);
      setScene9Ready(true);
      return undefined;
    }
    setActPlay(false);
    setScene9Ready(false);
    const t = window.setTimeout(() => setActPlay(true), 480);
    return () => window.clearTimeout(t);
  }, [scene, sceneInstant]);

  const handleActMockComplete = useCallback(() => {
    setScene9Ready(true);
  }, []);

  const isAutoAdvanceScene = false;
  const showFloatingNext = scene >= SCENE.cover && scene < SCENE.finale;

  const sceneReady =
    scene === SCENE.cover
      ? sceneCover.ready
      : scene === SCENE.factors
        ? scene1.ready
        : scene === SCENE.multiply
          ? scene2.ready
          : scene === SCENE.judgment
            ? scene3.ready
            : scene === SCENE.whatIf
              ? scene4.ready
              : scene === SCENE.enterInfo
                ? scene5Ready
                : scene === SCENE.purpose
                  ? scene6AnimDone
                  : scene === SCENE.find
                    ? scene7Ready
                    : scene === SCENE.propose
                      ? scene8Ready
                      : scene === SCENE.act
                        ? scene9Ready
                        : false;

  const [nextEnabled, setNextEnabled] = useState(false);
  const nextEnabledRef = useRef(false);
  const sceneRef = useRef(scene);
  nextEnabledRef.current = nextEnabled;
  sceneRef.current = scene;

  useEffect(() => {
    if (!sceneReady || scene === SCENE.finale || isAutoAdvanceScene) {
      setNextEnabled(false);
      return undefined;
    }
    if (sceneInstant) {
      setNextEnabled(true);
      return undefined;
    }
    setNextEnabled(false);
    // Cover: enable as soon as headlines are ready so arrow keys match the button.
    const delayMs =
      scene === SCENE.find
      || scene === SCENE.propose
      || scene === SCENE.cover
      || scene === SCENE.act
        ? 0
        : 300;
    const t = window.setTimeout(() => setNextEnabled(true), delayMs);
    return () => window.clearTimeout(t);
  }, [sceneReady, scene, sceneInstant, isAutoAdvanceScene]);

  useEffect(() => {
    if (!isAutoAdvanceScene || !sceneReady || exiting) return undefined;
    const delay = sceneInstant ? 800 : 500;
    const t = window.setTimeout(() => {
      setDoneScenes((prev) => {
        if (prev.has(scene)) return prev;
        const next = new Set(prev);
        next.add(scene);
        return next;
      });
      setScene((s) => Math.min(s + 1, SCENE.finale));
    }, delay);
    return () => window.clearTimeout(t);
  }, [isAutoAdvanceScene, sceneReady, sceneInstant, exiting, scene]);

  const goNextScene = useCallback(() => {
    if (sceneRef.current >= SCENE.finale) return;
    if (isAutoAdvanceScene) return;
    if (!nextEnabledRef.current) return;
    const currentScene = sceneRef.current;
    setDoneScenes((prev) => {
      if (prev.has(currentScene)) return prev;
      const next = new Set(prev);
      next.add(currentScene);
      return next;
    });
    setScene((s) => Math.min(s + 1, SCENE.finale));
  }, [isAutoAdvanceScene]);

  const goPrevScene = useCallback(() => {
    if (sceneRef.current <= SCENE.cover) return;
    setScene((s) => Math.max(s - 1, SCENE.cover));
  }, []);

  useEffect(() => {
    if (!exiting) {
      exitCompletedRef.current = false;
      return undefined;
    }
    const timer = window.setTimeout(() => {
      if (exitCompletedRef.current) return;
      exitCompletedRef.current = true;
      onExitComplete?.();
    }, SLIDE_MS + 50);
    return () => window.clearTimeout(timer);
  }, [exiting, onExitComplete]);

  useEffect(() => {
    if (exiting) return undefined;
    const onKeyDown = (event) => {
      if (event.repeat) return;
      const target = event.target;
      if (
        target instanceof HTMLElement
        && (target.isContentEditable
          || target.tagName === 'INPUT'
          || target.tagName === 'TEXTAREA'
          || target.tagName === 'SELECT')
      ) {
        return;
      }

      const key = event.key;
      const isArrowRight = key === 'ArrowRight' || key === 'Right';
      const isArrowLeft = key === 'ArrowLeft' || key === 'Left';
      const isAdvanceKey = key === 'Enter' || key === ' ' || key === 'Spacebar';

      if (isArrowLeft) {
        event.preventDefault();
        event.stopPropagation();
        goPrevScene();
        return;
      }

      // Cover: → · All scenes: Space / Enter (→ also advances when Next is available)
      if ((isArrowRight || isAdvanceKey) && sceneRef.current !== SCENE.finale) {
        if (!nextEnabledRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        goNextScene();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [exiting, goNextScene, goPrevScene]);

  const handleTransitionEnd = (event) => {
    if (!exiting || event.target !== event.currentTarget) return;
    if (event.propertyName !== 'transform') return;
    if (exitCompletedRef.current) return;
    exitCompletedRef.current = true;
    onExitComplete?.();
  };

  const bgBlue = (scene === SCENE.whatIf && scene4.step >= 4) || scene >= SCENE.enterInfo;
  const isFinale = scene === SCENE.finale;
  const showRight =
    scene === SCENE.enterInfo
    || scene === SCENE.purpose
    || scene === SCENE.find
    || scene === SCENE.propose
    || scene === SCENE.act;

  return (
    <div
      onTransitionEnd={handleTransitionEnd}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 250,
        background: bgBlue ? BG_BLUE100 : BG_GRAY100,
        boxSizing: 'border-box',
        padding: PAD,
        transform: exiting ? 'translateY(100%)' : 'translateY(0)',
        transition: [
          `transform ${SLIDE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          `background ${BG_TRANSITION_MS}ms ease`,
        ].join(', '),
        pointerEvents: exiting ? 'none' : 'auto',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {!isFinale && showFloatingNext && (
        <NextButton enabled={nextEnabled} onClick={goNextScene} />
      )}

      {isFinale ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: PAD,
            boxSizing: 'border-box',
            textAlign: 'center',
            pointerEvents: 'none',
            transform: 'translateY(-40px)',
          }}
        >
          <Fade show={sceneFinale.step >= 1}>
            <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 46, lineHeight: 1.35, color: C.ink1000 }}>
              고민 없는 확정 과정
            </div>
          </Fade>
          <Fade show={sceneFinale.step >= 2}>
            <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 46, lineHeight: 1.35, color: C.ink1000 }}>
              직접 경험해 보실래요?
            </div>
          </Fade>
          <div style={{ marginTop: 32, pointerEvents: 'auto' }}>
            <Fade show={sceneFinale.step >= 3}>
              <StartButton onClick={onStartReveal} />
            </Fade>
          </div>
        </div>
      ) : (
        <div
          style={{
            height: '100%',
            minHeight: 0,
            display: 'flex',
            gap: 32,
            alignItems: 'stretch',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              flex: showRight ? '0 1 52%' : '1 1 auto',
              minWidth: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
            }}
          >
            {scene === SCENE.cover && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, width: '100%' }}>
                <Subtitle show={sceneCover.step >= 1}>2026</Subtitle>
                <div style={{ marginTop: SUBTITLE_HEADLINE_GAP, paddingBottom: HEADLINE_BOTTOM_PAD }}>
                  <Headline show={sceneCover.step >= 2}>Product Designer Challenge</Headline>
                </div>
              </div>
            )}

            {scene === SCENE.factors && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, width: '100%' }}>
                <Subtitle show={scene1.step >= 1}>회의 주선자는 회의 일정을 잡을 때</Subtitle>
                <div style={{ marginTop: SUBTITLE_HEADLINE_GAP, paddingBottom: HEADLINE_BOTTOM_PAD }}>
                  <Headline show={scene1.step >= 2}>
                    <span style={{ color: C.blue500 }}>필수 요소</span>
                    와{' '}
                    <span style={{ color: C.blue500 }}>정성 요소</span>
                    를 고려해서 일정을 잡아요
                  </Headline>
                </div>
                <FactorSections
                  showRequired={scene1.step >= 3}
                  showSoft={scene1.step >= 4}
                  multiplyCount={1}
                />
              </div>
            )}

            {scene === SCENE.multiply && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, width: '100%' }}>
                <Subtitle show>인원이 늘어나면</Subtitle>
                <div style={{ marginTop: SUBTITLE_HEADLINE_GAP, paddingBottom: HEADLINE_BOTTOM_PAD }}>
                  <Headline show={scene2.step >= 1}>
                    고려해야 할 요소도 <span style={{ color: C.ink600 }}>복합적으로</span> 늘어나요
                  </Headline>
                </div>
                <FactorSections
                  showRequired
                  showSoft
                  multiplyCount={scene2.step >= 2 || sceneInstant ? 6 : 1}
                />
              </div>
            )}

            {scene === SCENE.judgment && (
              <>
                <Subtitle show={scene3.step >= 1}>결국</Subtitle>
                <div style={{ marginTop: SUBTITLE_HEADLINE_GAP, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {scene3.step >= 2 && (
                    <AppearHeadline>회의를 주선할 때마다</AppearHeadline>
                  )}
                  {scene3.step >= 3 && (
                    <AppearHeadline>
                      <span style={{ color: C.ink600 }}>이 시간으로 정해도 되는지</span> 판단해야 해요
                    </AppearHeadline>
                  )}
                </div>
              </>
            )}

            {scene === SCENE.whatIf && (
              <>
                <Subtitle show={scene4.step >= 1}>만약</Subtitle>
                <div style={{ marginTop: SUBTITLE_HEADLINE_GAP, display: 'flex', flexDirection: 'column' }}>
                  <Headline show={scene4.step >= 2}>
                    이 시간이{' '}
                    <span style={{ color: C.blue500 }}>확정할 수 있는 시간</span>
                    임을
                  </Headline>
                  <Headline show={scene4.step >= 3} style={{ marginTop: 4 }}>
                    <span style={{ color: C.blue500 }}>근거</span>
                    와 함께 알려준다면?
                  </Headline>
                  <Headline show={scene4.step >= 4} style={{ marginTop: 64 }}>
                    판단이 쉬워지지 않을까요?
                  </Headline>
                </div>
              </>
            )}

            {scene === SCENE.enterInfo && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                <Headline show={enterHeadStep >= 1}>회의를 잡을 때</Headline>
                <Headline show={enterHeadStep >= 2}>입력한 정보에 따라</Headline>
              </div>
            )}

            {scene === SCENE.purpose && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                <Headline show={scene6.step >= 1}>목적에 맞춰서</Headline>
                <Headline show={scene6.step >= 1}>우선순위를 검토하고</Headline>
              </div>
            )}

            {scene === SCENE.find && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                <Headline show={findHeadStep >= 1}>일정을 확정하는</Headline>
                <Headline show={findHeadStep >= 1}>과정과 근거를 통해</Headline>
              </div>
            )}

            {scene === SCENE.propose && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                <Headline show={proposeHeadStep >= 1}>동료들의 상황을</Headline>
                <Headline show={proposeHeadStep >= 2}>더 쉽게 판단하고</Headline>
                <Headline show={proposeHeadStep >= 3}>회의를 잡을 수 있어요</Headline>
              </div>
            )}

            {scene === SCENE.act && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                <Headline show>회의가 성사되도록</Headline>
                <Headline show>항상 도와드릴게요</Headline>
              </div>
            )}
          </div>

          {showRight && (
            <div
              style={{
                flex: '1 1 48%',
                minWidth: 0,
                minHeight: 0,
                height: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                overflow: 'visible',
                transform: 'translateX(-40px)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: 0,
                  maxHeight: '100%',
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  overflow: 'visible',
                }}
              >
                {scene === SCENE.enterInfo && createModalPlay && (
                  <CreateMeetingMock
                    key={sceneInstant ? 'create-done' : 'create-play'}
                    play
                    instant={sceneInstant}
                    onTitleDone={handleCreateTitleDone}
                  />
                )}
                {scene === SCENE.purpose && (scene6.step >= 1 || sceneInstant) && (
                  <PurposePriorityMock
                    active={scene6.step >= 2 || scene6.ready || sceneInstant}
                    instant={sceneInstant}
                    onReady={handlePurposeReady}
                  />
                )}
                {scene === SCENE.find && findShowLoading && (
                  <LoadingToConfirmMock
                    key="loading"
                    stage="loading"
                    instant={findSkipAnim}
                    onLoadingComplete={handleFindLoadingComplete}
                    highlightSection={null}
                  />
                )}
                {scene === SCENE.propose && proposeModalStep >= 1 && (
                  <LoadingToConfirmMock
                    key="confirm"
                    stage="confirm"
                    instant={sceneInstant}
                    candidateIndex={
                      sceneInstant
                        ? 0
                        : proposeModalStep >= 3
                          ? 0
                          : proposeModalStep >= 2
                            ? 1
                            : 0
                    }
                    highlightSection={null}
                  />
                )}
                {scene === SCENE.act && (
                  <CoordinationActionMock
                    play={actPlay}
                    instant={sceneInstant}
                    onComplete={handleActMockComplete}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { SLIDE_MS as ONBOARDING_SLIDE_MS };
