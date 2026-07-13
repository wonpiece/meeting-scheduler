import { useCallback, useLayoutEffect, useState } from 'react';
import { TOUR_STEPS } from './onboardingCopy';

const FONT = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";
const TOOLTIP_WIDTH = 380;
const ENTER_OFFSET_Y = 16;
const ENTER_DURATION_MS = 280;
const POINTER_DOT_SIZE = 10;
const POINTER_LINE_HEIGHT = 2;
const POINTER_BUTTON_OVERLAP = 4;
const POINTER_GAP = { right: 24, left: 40 };
const C = {
  blue: '#3182f6',
  panel: '#323742',
  white: '#ffffff',
};

function TourButton({ children, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? '#2b74de' : C.blue,
        color: C.white,
        border: 'none',
        borderRadius: 10,
        height: 36,
        minWidth: 50,
        padding: '0 14px',
        fontFamily: FONT,
        fontWeight: 500,
        fontSize: 13,
        lineHeight: 1.4,
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 0.15s ease',
      }}
    >
      {children}
    </button>
  );
}

function getAnchorRect(targetId) {
  const el = document.querySelector(`[data-tour="${targetId}"]`);
  return el ? el.getBoundingClientRect() : null;
}

function TourPointer({ direction, offsetY, gap }) {
  const dotSize = POINTER_DOT_SIZE;
  const lineLength = gap + POINTER_BUTTON_OVERLAP - dotSize;
  const pointsRight = direction === 'right';

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: offsetY,
        ...(pointsRight
          ? { right: 0, transform: 'translate(100%, -50%)' }
          : { left: 0, transform: 'translate(-100%, -50%)' }),
        display: 'flex',
        alignItems: 'center',
        flexDirection: pointsRight ? 'row' : 'row-reverse',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: lineLength,
          height: POINTER_LINE_HEIGHT,
          background: C.panel,
          borderRadius: 1,
          flexShrink: 0,
        }}
      />
      <div
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: C.panel,
          flexShrink: 0,
        }}
      />
    </div>
  );
}

function getTooltipPosition(anchor, placement) {
  const arrowOffset = anchor.height / 2;
  if (placement === 'right') {
    return {
      top: anchor.top,
      left: anchor.right + POINTER_GAP.right,
      arrowDirection: 'left',
      arrowOffset,
      arrowGap: POINTER_GAP.right,
    };
  }
  return {
    top: anchor.top,
    left: anchor.left - POINTER_GAP.left - TOOLTIP_WIDTH,
    arrowDirection: 'right',
    arrowOffset,
    arrowGap: POINTER_GAP.left,
  };
}

export default function OnboardingTour({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [anchor, setAnchor] = useState(null);
  const [entered, setEntered] = useState(false);
  const step = TOUR_STEPS[stepIndex];
  const total = TOUR_STEPS.length;
  const isLast = stepIndex >= total - 1;

  const measureAnchor = useCallback(() => {
    setAnchor(getAnchorRect(step.target));
  }, [step.target]);

  useLayoutEffect(() => {
    measureAnchor();
    const timer = window.setTimeout(measureAnchor, 0);
    window.addEventListener('resize', measureAnchor);
    window.addEventListener('scroll', measureAnchor, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', measureAnchor);
      window.removeEventListener('scroll', measureAnchor, true);
    };
  }, [measureAnchor]);

  useLayoutEffect(() => {
    setEntered(false);
    if (!anchor) return undefined;
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setEntered(true));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [stepIndex, anchor]);

  const advance = () => {
    if (isLast) {
      onComplete?.();
      return;
    }
    setStepIndex((index) => index + 1);
  };

  const handleBackdropClick = () => {
    if (step.dismissOnBackdrop) advance();
  };

  if (!anchor) return null;

  const position = getTooltipPosition(anchor, step.placement);
  const bodyLines = step.textLines ?? (step.text ? [step.text] : []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
      }}
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="앱 사용 안내"
        onClick={(event) => event.stopPropagation()}
        style={{
          position: 'fixed',
          width: TOOLTIP_WIDTH,
          minHeight: 152,
          top: position.top,
          left: position.left,
          transform: entered ? 'translateY(0)' : `translateY(${ENTER_OFFSET_Y}px)`,
          opacity: entered ? 1 : 0,
          transition: `opacity ${ENTER_DURATION_MS}ms ease-out, transform ${ENTER_DURATION_MS}ms ease-out`,
          background: C.panel,
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 12px 32px rgba(17, 24, 39, 0.24)',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          overflow: 'visible',
        }}
      >
        <TourPointer
          direction={position.arrowDirection}
          offsetY={position.arrowOffset}
          gap={position.arrowGap}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {step.title && (
            <div
              style={{
                fontFamily: FONT,
                fontSize: 15,
                fontWeight: 600,
                lineHeight: 1.5,
                color: C.white,
                wordBreak: 'keep-all',
              }}
            >
              {step.title}
            </div>
          )}
          {bodyLines.length > 0 && (
            <div
              style={{
                fontFamily: FONT,
                fontSize: 15,
                fontWeight: 500,
                lineHeight: 1.5,
                color: C.white,
                wordBreak: 'keep-all',
              }}
            >
              {bodyLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
          <TourButton onClick={advance}>{step.cta}</TourButton>
        </div>
      </div>
    </div>
  );
}
