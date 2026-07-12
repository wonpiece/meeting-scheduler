import { useCallback, useEffect, useRef, useState } from 'react';
import { ONBOARDING_STEPS } from './onboardingCopy';
import arrowLeftIcon from '../assets/icons/icon-arrow-left-small-mono.svg?raw';
import arrowRightIcon from '../assets/icons/icon-arrow-right-small-mono.svg?raw';

const FONT = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";
const BG_GRAY100 = '#f2f4f6';
const BG_BLUE100 = '#e9effb';
const BG_TRANSITION_MS = 400;
const SLIDE_MS = 480;
const SUBTITLE_FONT_SIZE = 28;
const SUBTITLE_LINE_HEIGHT = 1.4;
const SUBTITLE_LINE_COUNT = 2;
const SUBTITLE_SLOT_HEIGHT = SUBTITLE_FONT_SIZE * SUBTITLE_LINE_HEIGHT * SUBTITLE_LINE_COUNT;
const INDICATOR_SUBTITLE_GAP = 100;
const SUBTITLE_HEADLINE_GAP = 32;
const FIRST_STEP_BLANK_MS = 320;
const FIRST_STEP_FADE_MS = 520;
const FIRST_STEP_STAGGER_MS = 1000;
const FIRST_STEP_BUTTON_STAGGER_MS = 800;
const HEADLINE_DELAY_MS_BY_STEP = {
  1: 800,
  2: 800,
  3: 350,
};
const NAV_ICON_SIZE = 16;
const NAV_BOTTOM_GAP = 40;
const C = {
  blue: '#3182f6',
  ink900: '#323742',
  ink500: '#8d949f',
  white: '#ffffff',
  bg2: '#eff1f3',
};

const NAV_ICONS = {
  left: arrowLeftIcon,
  right: arrowRightIcon,
};

function normalizeSvg(svg) {
  return svg
    .replace(/width="[^"]*"/i, 'width="100%"')
    .replace(/height="[^"]*"/i, 'height="100%"')
    .replace(/fill="(?!none)[^"]*"/gi, 'fill="currentColor"')
    .replace(/stroke="(?!none)[^"]*"/gi, 'stroke="currentColor"');
}

function NavArrowIcon({ direction, color }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: NAV_ICON_SIZE,
        height: NAV_ICON_SIZE,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        lineHeight: 0,
        transition: 'color 0.15s ease',
      }}
      dangerouslySetInnerHTML={{ __html: normalizeSvg(NAV_ICONS[direction]) }}
    />
  );
}

function getHeadlineDelay(stepIndex) {
  return HEADLINE_DELAY_MS_BY_STEP[stepIndex] ?? 800;
}

function NavArrowButton({ direction, disabled, onClick, label }) {
  const [hover, setHover] = useState(false);
  const color = disabled ? '#c8ccd2' : hover ? C.ink900 : C.ink500;

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: 'none',
        background: !disabled && hover ? C.bg2 : 'transparent',
        borderRadius: 8,
        width: 32,
        height: 32,
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.15s ease, transform 0.15s ease',
        transform: !disabled && hover ? 'scale(1.06)' : 'scale(1)',
      }}
    >
      <NavArrowIcon direction={direction} color={color} />
    </button>
  );
}

function OnboardingButton({ children, onClick }) {
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
        background: hover ? '#2b74de' : C.blue,
        color: C.white,
        border: 'none',
        borderRadius: 16,
        height: 56,
        minWidth: 160,
        padding: '0 32px',
        fontFamily: FONT,
        fontWeight: 600,
        fontSize: 19,
        lineHeight: 1.4,
        cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
    >
      {children}
    </button>
  );
}

function TextBlock({ lines, fontSize, fontWeight, color, marginTop = 0, marginBottom = 0, style }) {
  if (!lines?.length) return null;
  return (
    <div style={{ marginTop, marginBottom, textAlign: 'center', ...style }}>
      {lines.map((line) => (
        <div
          key={line}
          style={{
            fontFamily: FONT,
            fontSize,
            fontWeight,
            lineHeight: 1.4,
            color,
            whiteSpace: 'pre-wrap',
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

function introFadeStyle(stepIndex, visibleStage, headlineRevealedForStep, element) {
  if (stepIndex === 0) {
    const stageMap = { indicator: 1, subtitle: 1, headline: 2, button: 3 };
    const stage = stageMap[element];
    return {
      opacity: visibleStage >= stage ? 1 : 0,
      transition: `opacity ${FIRST_STEP_FADE_MS}ms ease-out`,
    };
  }

  if (element === 'headline') {
    const visible = headlineRevealedForStep === stepIndex;
    return {
      opacity: visible ? 1 : 0,
      transition: visible ? `opacity ${FIRST_STEP_FADE_MS}ms ease-out` : 'none',
    };
  }

  return undefined;
}

function getStepBackground(stepIndex, headlineRevealedForStep) {
  if (stepIndex <= 1) return BG_GRAY100;
  if (stepIndex === 2) {
    return headlineRevealedForStep === 2 ? BG_BLUE100 : BG_GRAY100;
  }
  return BG_BLUE100;
}

function SkipButton({ onClick, disabled }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'absolute',
        top: 40,
        right: 40,
        border: 'none',
        background: !disabled && hover ? C.bg2 : 'none',
        borderRadius: 8,
        padding: '4px 8px',
        margin: 0,
        fontFamily: FONT,
        fontSize: 17,
        fontWeight: 400,
        lineHeight: 1.4,
        color: disabled ? '#c8ccd2' : hover ? C.ink900 : C.ink500,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'color 0.15s ease, background 0.15s ease',
      }}
    >
      건너뛰기
    </button>
  );
}

export default function OnboardingIntro({ exiting = false, onStartReveal, onExitComplete, onSkip }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [firstStepVisibleStage, setFirstStepVisibleStage] = useState(0);
  const [headlineRevealedForStep, setHeadlineRevealedForStep] = useState(-1);
  const exitCompletedRef = useRef(false);
  const step = ONBOARDING_STEPS[stepIndex];
  const total = ONBOARDING_STEPS.length;
  const isLast = stepIndex === total - 1;

  const isFirst = stepIndex === 0;

  const goPrev = useCallback(() => {
    setStepIndex((index) => Math.max(0, index - 1));
  }, []);

  const goNext = useCallback(() => {
    if (isLast) {
      onStartReveal?.();
      return;
    }
    setStepIndex((index) => index + 1);
  }, [isLast, onStartReveal]);

  const handleTransitionEnd = (event) => {
    if (!exiting || event.target !== event.currentTarget) return;
    if (event.propertyName !== 'transform') return;
    if (exitCompletedRef.current) return;
    exitCompletedRef.current = true;
    onExitComplete?.();
  };

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
    if (stepIndex === 0) {
      setHeadlineRevealedForStep(-1);
      setFirstStepVisibleStage(0);
      const stageDelays = [
        FIRST_STEP_BLANK_MS,
        FIRST_STEP_BLANK_MS + FIRST_STEP_STAGGER_MS,
        FIRST_STEP_BLANK_MS + FIRST_STEP_STAGGER_MS + FIRST_STEP_BUTTON_STAGGER_MS,
      ];
      const timers = [1, 2, 3].map((stage, index) =>
        window.setTimeout(() => setFirstStepVisibleStage(stage), stageDelays[index]),
      );
      return () => timers.forEach((timer) => window.clearTimeout(timer));
    }

    setFirstStepVisibleStage(3);
    const timer = window.setTimeout(
      () => setHeadlineRevealedForStep(stepIndex),
      getHeadlineDelay(stepIndex),
    );
    return () => window.clearTimeout(timer);
  }, [stepIndex]);

  useEffect(() => {
    if (exiting) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'ArrowLeft') {
        if (stepIndex === 0) return;
        event.preventDefault();
        goPrev();
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [exiting, goNext, goPrev, stepIndex]);

  return (
    <div
      onTransitionEnd={handleTransitionEnd}
      onClick={() => {
        if (!exiting) goNext();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 250,
        background: getStepBackground(stepIndex, headlineRevealedForStep),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 24px 40px',
        boxSizing: 'border-box',
        transform: exiting ? 'translateY(100%)' : 'translateY(0)',
        transition: [
          `transform ${SLIDE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          `background ${BG_TRANSITION_MS}ms ease`,
        ].join(', '),
        pointerEvents: exiting ? 'none' : 'auto',
        overflowY: 'auto',
        cursor: 'pointer',
      }}
    >
      <SkipButton onClick={onSkip} disabled={exiting} />

      <div
        style={{
          width: '100%',
          maxWidth: 720,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 20,
            fontWeight: 500,
            lineHeight: 1.4,
            color: C.ink500,
            ...introFadeStyle(stepIndex, firstStepVisibleStage, headlineRevealedForStep, 'indicator'),
          }}
        >
          {stepIndex + 1} / {total}
        </div>

        <div
          style={{
            marginTop: INDICATOR_SUBTITLE_GAP,
            minHeight: SUBTITLE_SLOT_HEIGHT,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            ...introFadeStyle(stepIndex, firstStepVisibleStage, headlineRevealedForStep, 'subtitle'),
          }}
        >
          <TextBlock
            lines={step.subtitle}
            fontSize={SUBTITLE_FONT_SIZE}
            fontWeight={600}
            color={C.ink900}
          />
        </div>

        <TextBlock
          lines={step.headline}
          fontSize={40}
          fontWeight={600}
          color={C.ink900}
          marginTop={SUBTITLE_HEADLINE_GAP}
          marginBottom={48}
          style={introFadeStyle(stepIndex, firstStepVisibleStage, headlineRevealedForStep, 'headline')}
        />

        <div style={introFadeStyle(stepIndex, firstStepVisibleStage, headlineRevealedForStep, 'button')}>
          <OnboardingButton onClick={goNext}>{step.cta}</OnboardingButton>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: NAV_BOTTOM_GAP,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <NavArrowButton
          direction="left"
          label="이전"
          disabled={isFirst}
          onClick={goPrev}
        />
        <NavArrowButton
          direction="right"
          label={isLast ? '시작하기' : '다음'}
          disabled={false}
          onClick={goNext}
        />
      </div>
    </div>
  );
}

export { SLIDE_MS as ONBOARDING_SLIDE_MS };
