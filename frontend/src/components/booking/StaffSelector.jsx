export function StaffSelector({ staff = [], selectedId, onSelect }) {
  return (
    <div className="chip-group">
      {staff.map((member) => (
        <button
          key={member.id}
          className={member.id === selectedId ? 'chip active' : 'chip'}
          onClick={() => onSelect?.(member)}
        >
          {member.name}
        </button>
      ))}
    </div>
  );
}
