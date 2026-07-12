import { createJob, inferJobShort } from "./jobUtils";
import { regeneratePersonDemoEvents } from "./regenerateEvents";
import { adminInputStyle, cardStyle, secondaryButtonStyle, sectionTitleStyle } from "./adminStyles";

export function JobsSection({ jobs, setJobs, people, setPeople, setEvents, icons }) {
  const { Trash2, Plus } = icons;

  const updateJobName = (id, name) => {
    const previous = jobs.find((job) => job.id === id);
    const nextShort = inferJobShort(name);
    setJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, name, short: nextShort } : job)),
    );
    if (previous && previous.name !== name) {
      setPeople((prev) =>
        prev.map((person) => (person.role === previous.name ? { ...person, role: name } : person)),
      );
    }
  };

  const updateJobShort = (id, short) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, short: short.toUpperCase().slice(0, 5) } : job)),
    );
  };

  const removeJob = (id) => {
    if (jobs.length <= 1) return;
    const removed = jobs.find((job) => job.id === id);
    if (!removed) return;

    const nextJobs = jobs.filter((job) => job.id !== id);
    const fallbackRole = nextJobs[0].name;
    setJobs(nextJobs);

    const affected = people.filter((person) => person.role === removed.name);
    if (affected.length === 0) return;

    setPeople((prev) =>
      prev.map((person) =>
        person.role === removed.name ? { ...person, role: fallbackRole } : person,
      ),
    );
    setEvents((prev) =>
      affected.reduce(
        (acc, person) => regeneratePersonDemoEvents(acc, { ...person, role: fallbackRole }),
        prev,
      ),
    );
  };

  const addJob = () => setJobs((prev) => [...prev, createJob("New Role")]);

  return (
    <div style={cardStyle}>
      <div style={sectionTitleStyle}>직무 (Role)</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {jobs.map((job) => (
          <div key={job.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 32px", gap: 8 }}>
            <input
              value={job.name}
              onChange={(e) => updateJobName(job.id, e.target.value)}
              style={adminInputStyle}
              placeholder="직무명 (영문)"
            />
            <input
              value={job.short}
              onChange={(e) => updateJobShort(job.id, e.target.value)}
              style={adminInputStyle}
              title="축약명 (자동 생성 가능)"
            />
            <button onClick={() => removeJob(job.id)} style={{ border: "none", background: "none", cursor: "pointer" }}>
              <Trash2 size={16} color="#F95C5C" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={addJob} style={{ ...secondaryButtonStyle, width: "100%", marginTop: 8 }}>
        <Plus size={15} /> 직무 추가
      </button>
    </div>
  );
}
