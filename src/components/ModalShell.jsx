import { C, FONT } from "../admin/adminStyles";

export function Overlay({ children, onClose, width = 460, minHeight }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,24,39,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.white,
          borderRadius: 24,
          width,
          minHeight,
          maxWidth: "94vw",
          maxHeight: "88vh",
          overflowY: "auto",
          fontFamily: FONT,
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function PanelHeader({ title, onClose }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "24px 24px 20px 24px",
      }}
    >
      <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 21, color: C.ink900 }}>{title}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        ✕
      </button>
    </div>
  );
}
