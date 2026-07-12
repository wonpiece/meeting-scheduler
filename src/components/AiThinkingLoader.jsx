import { C, FONT } from "../admin/adminStyles";

export const AI_THINKING_STEPS = [
  { loading: "회의 목적 파악하는 중", done: "회의 목적 파악 완료" },
  { loading: "참석자 확인하는 중", done: "참석자 확인 완료" },
  { loading: "외근 및 빈 시간 확인하는 중", done: "외근 및 빈 시간 확인 완료" },
  { loading: "예약 가능 회의실 찾는 중", done: "예약 가능 회의실 확보 완료" },
  { loading: "식사 · 출퇴근 시간 배려 중", done: "식사 · 출퇴근 시간 배려 완료" },
];

export const AI_LOADING_STEP_COUNT = AI_THINKING_STEPS.length;
/** Active item shimmer / spinner duration before marking complete */
export const AI_STEP_ACTIVE_MS = 1600;
/** Pause on completed row before revealing the next one */
export const AI_STEP_DONE_HOLD_MS = 550;
export const AI_RESULTS_DELAY_MS = 620;

function AiThinkingStepRow({ step, state, Check, Spinner }) {
  const isDone = state === "done";
  const isActive = state === "active";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: FONT,
        fontSize: 15,
        color: C.ink900,
      }}
    >
      <span style={{ width: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {isDone ? (
          <span style={{ width: 16, height: 16, borderRadius: "50%", background: C.blue, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Check size={10} color={C.white} />
          </span>
        ) : (
          <Spinner />
        )}
      </span>
      <span
        className={isActive ? "ai-shimmer-loading-step" : undefined}
        style={{
          transition: "opacity 0.22s ease",
          opacity: isDone ? 0.72 : 1,
          ...(isActive ? { "--ai-shimmer-duration": `${AI_STEP_ACTIVE_MS}ms` } : {}),
        }}
      >
        {isDone ? step.done : step.loading}
      </span>
    </div>
  );
}

export function AiThinkingStepList({ loadingStepIndex, loadingStepPhase, Check, Spinner }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {AI_THINKING_STEPS.map((step, index) => {
        let state = "pending";
        if (index < loadingStepIndex) state = "done";
        else if (index === loadingStepIndex) state = loadingStepPhase === "working" ? "active" : "done";
        if (state === "pending") return null;
        return (
          <AiThinkingStepRow
            key={step.loading}
            step={step}
            state={state}
            Check={Check}
            Spinner={Spinner}
          />
        );
      })}
    </div>
  );
}
