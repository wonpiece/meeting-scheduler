import { useState } from "react";
import { Overlay, PanelHeader } from "../components/ModalShell";
import { C, FONT, primaryButtonStyle } from "./adminStyles";
import { CompanyTab } from "./CompanyTab";
import { MembersTab } from "./MembersTab";

const TABS = [
  ["회사", "company"],
  ["구성원", "people"],
];

export function AdminPanel({
  people,
  setPeople,
  setEvents,
  jobs,
  setJobs,
  companySettings,
  setCompanySettings,
  rooms,
  setRooms,
  teams,
  setTeams,
  towers,
  meId,
  colorPalette,
  icons,
  Avatar,
  normalizeCompanySettings,
  timeStrToHour,
  onClose,
}) {
  const [tab, setTab] = useState("company");

  return (
    <Overlay onClose={onClose} width={680}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          maxHeight: "88vh",
          minHeight: 0,
        }}
      >
        <PanelHeader title="관리" onClose={onClose} />
        <div style={{ display: "flex", gap: 8, padding: "0 24px 16px", flexShrink: 0 }}>
          {TABS.map(([label, value]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              style={{
                flex: 1,
                height: 42,
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                fontFamily: FONT,
                fontSize: 15,
                fontWeight: 600,
                background: tab === value ? C.blue200 : C.bg2,
                color: tab === value ? C.blue : C.ink800,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          style={{
            padding: "0 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {tab === "company" ? (
            <CompanyTab
              companySettings={companySettings}
              setCompanySettings={setCompanySettings}
              jobs={jobs}
              setJobs={setJobs}
              people={people}
              setPeople={setPeople}
              setEvents={setEvents}
              teams={teams}
              setTeams={setTeams}
              rooms={rooms}
              setRooms={setRooms}
              towers={towers}
              icons={icons}
              normalizeCompanySettings={normalizeCompanySettings}
              timeStrToHour={timeStrToHour}
            />
          ) : (
            <MembersTab
              people={people}
              setPeople={setPeople}
              setEvents={setEvents}
              jobs={jobs}
              teams={teams}
              towers={towers}
              meId={meId}
              colorPalette={colorPalette}
              icons={icons}
              Avatar={Avatar}
            />
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "16px 24px 24px",
            borderTop: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <button type="button" onClick={onClose} style={primaryButtonStyle}>
            저장
          </button>
        </div>
      </div>
    </Overlay>
  );
}
