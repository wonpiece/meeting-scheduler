import { CompanySettingsSection } from "./CompanySettingsSection";
import { JobsSection } from "./JobsSection";
import { RoomsSection } from "./RoomsSection";
import { TeamsSection } from "./TeamsSection";

export function CompanyTab({
  companySettings,
  setCompanySettings,
  jobs,
  setJobs,
  people,
  setPeople,
  setEvents,
  teams,
  setTeams,
  rooms,
  setRooms,
  towers,
  icons,
  normalizeCompanySettings,
  timeStrToHour,
}) {
  const updateCompanySetting = (field, rawValue) => {
    const parsed = timeStrToHour(rawValue);
    if (!Number.isFinite(parsed)) return;
    setCompanySettings((current) => normalizeCompanySettings({ ...current, [field]: parsed }));
  };

  return (
    <>
      <CompanySettingsSection companySettings={companySettings} onUpdateField={updateCompanySetting} />
      <JobsSection
        jobs={jobs}
        setJobs={setJobs}
        people={people}
        setPeople={setPeople}
        setEvents={setEvents}
        icons={icons}
      />
      <TeamsSection teams={teams} setTeams={setTeams} icons={icons} />
      <RoomsSection rooms={rooms} setRooms={setRooms} towers={towers} icons={icons} />
    </>
  );
}
