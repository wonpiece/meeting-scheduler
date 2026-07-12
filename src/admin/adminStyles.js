export const C = {
  blue: "#3182f6",
  blue200: "#e7f0fe",
  ink900: "#323742",
  ink800: "#4c525d",
  ink600: "#6b7280",
  ink500: "#8d949f",
  border: "#e5e7eb",
  bg2: "#eff1f3",
  white: "#ffffff",
};

export const FONT = "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";

export const adminInputStyle = {
  width: "100%",
  height: 38,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: "0 10px",
  fontFamily: FONT,
  fontSize: 14,
  boxSizing: "border-box",
};

export const adminLabel = {
  fontFamily: FONT,
  fontSize: 12,
  color: C.ink500,
  marginBottom: 4,
};

export const cardStyle = {
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  padding: 16,
};

export const secondaryButtonStyle = {
  padding: "13px 20px",
  background: "#F2F0E9",
  color: "#1C1C1A",
  border: "none",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: FONT,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};

export const sectionTitleStyle = {
  fontWeight: 700,
  fontSize: 14,
  marginBottom: 12,
  fontFamily: FONT,
  color: C.ink900,
};
