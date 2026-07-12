import { adminInputStyle, cardStyle, secondaryButtonStyle, sectionTitleStyle } from "./adminStyles";

export function RoomsSection({ rooms, setRooms, towers, icons }) {
  const { Trash2, Plus } = icons;

  const updateRoom = (id, patch) =>
    setRooms((prev) => prev.map((room) => (room.id === id ? { ...room, ...patch } : room)));

  const removeRoom = (id) => setRooms((prev) => prev.filter((room) => room.id !== id));

  const addRoom = () =>
    setRooms((prev) => [
      ...prev,
      { id: `r${Date.now()}`, name: "새 회의실", tower: towers[0], floor: 1, capacity: 4 },
    ]);

  return (
    <div style={cardStyle}>
      <div style={sectionTitleStyle}>회의실</div>
      {rooms.map((room) => (
        <div
          key={room.id}
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 56px 56px 32px",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <input
            value={room.name}
            onChange={(e) => updateRoom(room.id, { name: e.target.value })}
            style={adminInputStyle}
          />
          <select
            value={room.tower}
            onChange={(e) => updateRoom(room.id, { tower: e.target.value })}
            style={adminInputStyle}
          >
            {towers.map((tower) => (
              <option key={tower}>{tower}</option>
            ))}
          </select>
          <input
            type="number"
            value={room.floor}
            onChange={(e) => updateRoom(room.id, { floor: Number(e.target.value) })}
            style={adminInputStyle}
          />
          <input
            type="number"
            value={room.capacity}
            onChange={(e) => updateRoom(room.id, { capacity: Number(e.target.value) })}
            style={adminInputStyle}
          />
          <button onClick={() => removeRoom(room.id)} style={{ border: "none", background: "none", cursor: "pointer" }}>
            <Trash2 size={16} color="#F95C5C" />
          </button>
        </div>
      ))}
      <button onClick={addRoom} style={{ ...secondaryButtonStyle, width: "100%" }}>
        <Plus size={15} /> 회의실 추가
      </button>
    </div>
  );
}
