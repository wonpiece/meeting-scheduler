import { C, FONT } from "../admin/adminStyles";

export function RoleTag({ short }) {
  return (
    <span
      style={{
        padding: "2px 7px",
        borderRadius: 999,
        background: C.bg2,
        color: C.ink800,
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {short}
    </span>
  );
}

/** 이름 | 팀 | 직무 축약명 태그 */
export function PersonMeta({ name, team, roleShort, nameStyle, compact = false }) {
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: compact ? 0 : 2,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontFamily: FONT, fontSize: 13, color: C.ink500 }}>{team}</span>
        <span style={{ fontFamily: FONT, fontSize: 12, color: C.ink500 }}>|</span>
        <RoleTag short={roleShort} />
      </div>
    </div>
  );
}
