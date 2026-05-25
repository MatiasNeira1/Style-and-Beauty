export function StaffSelector({ staff = [], selectedId, onSelect }) {
  return (
    <div className="chip-group">
      {staff.map((member) => (
        <button
          key={member.idPersona || member.idStaff || member.id || member.nombre}
          className={(member.idPersona || member.idStaff || member.id || member.nombre) === selectedId ? 'chip active' : 'chip'}
          onClick={() => onSelect?.(member)}
        >
          {`${member.nombre || member.name || 'Profesional'} ${member.apellidos || ''}`.trim()}
        </button>
      ))}
    </div>
  );
}
