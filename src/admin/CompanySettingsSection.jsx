import { hourToTimeStr } from "../config/recommendationPolicy";
import { adminInputStyle, adminLabel, cardStyle, sectionTitleStyle } from "./adminStyles";

const TIME_FIELDS = [
  ["점심 시작", "lunchStart"],
  ["점심 종료", "lunchEnd"],
  ["출근 시간", "commuteIn"],
  ["퇴근 시간", "commuteOut"],
];

export function CompanySettingsSection({ companySettings, onUpdateField }) {
  return (
    <div style={cardStyle}>
      <div style={sectionTitleStyle}>회사 설정</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {TIME_FIELDS.map(([label, field]) => (
          <div key={field}>
            <div style={adminLabel}>{label}</div>
            <input
              type="time"
              value={hourToTimeStr(companySettings[field])}
              onChange={(e) => onUpdateField(field, e.target.value)}
              style={adminInputStyle}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
