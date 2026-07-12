import { C, FONT } from "../admin/adminStyles";

/** 이름 + 주최자 · 소속 · 직무 */
export function PersonMeta({ name, team, roleShort, isHost = false, nameStyle, compact = false }) {
  const metaLine = [isHost ? "주최자" : null, team, roleShort].filter(Boolean).join(" · ");

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: compact ? 13 : 15,
          color: C.ink900,
          ...nameStyle,
        }}
      >
        {name}
      </div>
      {metaLine && (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 13,
            color: C.ink500,
            marginTop: compact ? 0 : 2,
          }}
        >
          {metaLine}
        </div>
      )}
    </div>
  );
}
