import { useState } from "react";
import { Overlay, PanelHeader } from "../components/ModalShell";
import { C, FONT } from "./adminStyles";
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
      <PanelHeader title="관리" onClose={onClose} />
      <div style={{ display: "flex", gap: 8, padding: "0 24px 16px" }}>
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
          padding: "0 24px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxHeight: "66vh",
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
    </Overlay>
  );
}
