import { adminInputStyle, cardStyle, secondaryButtonStyle, sectionTitleStyle } from "./adminStyles";

export function TeamsSection({ teams, setTeams, icons }) {
  const { Trash2, Plus } = icons;

  const updateTeam = (index, value) =>
    setTeams((prev) => prev.map((team, idx) => (idx === index ? value : team)));

  const removeTeam = (index) => setTeams((prev) => prev.filter((_, idx) => idx !== index));

  const addTeam = () => setTeams((prev) => [...prev, "새 팀"]);

  return (
    <div style={cardStyle}>
      <div style={sectionTitleStyle}>팀</div>
      {teams.map((team, index) => (
        <div key={index} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input value={team} onChange={(e) => updateTeam(index, e.target.value)} style={adminInputStyle} />
          <button onClick={() => removeTeam(index)} style={{ border: "none", background: "none", cursor: "pointer" }}>
            <Trash2 size={16} color="#F95C5C" />
          </button>
        </div>
      ))}
      <button onClick={addTeam} style={{ ...secondaryButtonStyle, width: "100%" }}>
        <Plus size={15} /> 팀 추가
      </button>
    </div>
  );
}
