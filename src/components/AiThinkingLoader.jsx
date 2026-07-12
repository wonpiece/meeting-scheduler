import { C, FONT } from "../admin/adminStyles";

export const AI_THINKING_STEPS = [
  { loading: "회의 목적 파악하는 중", done: "회의 목적 파악 완료" },
  { loading: "참석자 명단 확인하는 중", done: "참석자 명단 확인 완료" },
  { loading: "외근 및 빈 시간 찾는 중", done: "외근 및 빈 시간 확보 완료" },
  { loading: "예약 가능 회의실 찾는 중", done: "예약 가능 회의실 확보 완료" },
  { loading: "식사·출퇴근 시간 배려 중", done: "식사·출퇴근 시간 배려 완료" },
];

export const AI_LOADING_STEP_COUNT = AI_THINKING_STEPS.length;
export const AI_STEP_DURATION_MS = 260;
export const AI_RESULTS_DELAY_MS = 280;

function AiThinkingStepRow({ step, state, Check, Spinner }) {
  const isDone = state === "done";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: FONT,
        fontSize: 15,
        color: isDone ? C.ink500 : C.ink900,
      }}
    >
      <span style={{ width: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {isDone ? <Check size={16} color="#22c55e" /> : <Spinner />}
      </span>
      <span
        style={{
          transition: "opacity 0.22s ease, color 0.22s ease",
          opacity: 1,
        }}
      >
        {isDone ? step.done : step.loading}
      </span>
    </div>
  );
}

export function AiThinkingStepList({ loadingStep, Check, Spinner }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {AI_THINKING_STEPS.map((step, index) => {
        const state = index < loadingStep ? "done" : index === loadingStep ? "active" : "pending";
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
