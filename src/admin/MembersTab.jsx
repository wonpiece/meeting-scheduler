import { resolveJobShort } from "./jobUtils";
import { regeneratePersonDemoEvents } from "./regenerateEvents";
import { adminInputStyle, adminLabel, cardStyle, secondaryButtonStyle } from "./adminStyles";
import { PersonMeta } from "../components/PersonMeta";

export function MembersTab({
  people,
  setPeople,
  setEvents,
  jobs,
  teams,
  towers,
  meId,
  colorPalette,
  icons,
  Avatar,
}) {
  const { Trash2, Plus } = icons;

  const updatePerson = (id, patch) =>
    setPeople((prev) => prev.map((person) => (person.id === id ? { ...person, ...patch } : person)));

  const updatePersonRole = (person, role) => {
    const nextPerson = { ...person, role };
    updatePerson(person.id, { role });
    setEvents((prev) => regeneratePersonDemoEvents(prev, nextPerson));
  };

  const removePerson = (id) => {
    if (id === meId) return;
    setPeople((prev) => prev.filter((person) => person.id !== id));
    setEvents((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addPerson = () => {
    const color = colorPalette[people.length % colorPalette.length];
    const person = {
      id: `p${Date.now()}`,
      name: "새 팀원",
      team: teams[0] || "",
      role: jobs[0]?.name || "",
      tower: towers[0],
      floor: 5,
      avatarBg: color.avatarBg,
      avatarText: color.avatarText,
    };
    setPeople((prev) => [...prev, person]);
    setEvents((prev) => regeneratePersonDemoEvents(prev, person));
  };

  return (
    <>
      {people.map((person) => (
        <div key={person.id} style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Avatar person={person} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <input
                value={person.name}
                onChange={(e) => updatePerson(person.id, { name: e.target.value })}
                style={{ ...adminInputStyle, fontWeight: 600, marginBottom: 6 }}
              />
              <PersonMeta
                name={person.name}
                team={person.team}
                roleShort={resolveJobShort(jobs, person.role)}
                compact
                nameStyle={{ display: "none" }}
              />
            </div>
            {person.id !== meId && (
              <button
                onClick={() => removePerson(person.id)}
                style={{ border: "none", background: "none", cursor: "pointer" }}
              >
                <Trash2 size={16} color="#F95C5C" />
              </button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <div style={adminLabel}>팀</div>
              <select
                value={person.team}
                onChange={(e) => updatePerson(person.id, { team: e.target.value })}
                style={adminInputStyle}
              >
                {teams.map((team) => (
                  <option key={team}>{team}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={adminLabel}>직무</div>
              <select
                value={person.role}
                onChange={(e) => updatePersonRole(person, e.target.value)}
                style={adminInputStyle}
              >
                {jobs.map((job) => (
                  <option key={job.id} value={job.name}>
                    {job.name} ({job.short})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div style={adminLabel}>타워</div>
              <select
                value={person.tower}
                onChange={(e) => updatePerson(person.id, { tower: e.target.value })}
                style={adminInputStyle}
              >
                {towers.map((tower) => (
                  <option key={tower}>{tower}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={adminLabel}>층</div>
              <input
                type="number"
                value={person.floor}
                onChange={(e) => updatePerson(person.id, { floor: Number(e.target.value) })}
                style={adminInputStyle}
              />
            </div>
          </div>
        </div>
      ))}
      <button onClick={addPerson} style={{ ...secondaryButtonStyle, width: "100%" }}>
        <Plus size={15} /> 새 팀원 추가
      </button>
    </>
  );
}
