function fullName(person) {
  return `${person.nombre || ''} ${person.apellidos || ''}`.trim() || 'Especialista';
}

function initials(person) {
  return fullName(person)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function ProfessionalProfiles({ professionals = [], emptyText = 'Pronto asignaremos especialistas para esta categoria.', onSelect }) {
  return (
    <div className="professional-profiles">
      {professionals.length === 0 ? (
        <p className="professional-empty">{emptyText}</p>
      ) : (
        professionals.map((member) => (
          <article key={member.idPersona || member.idStaff || member.idAuth} className="professional-profile">
            {member.fotoUrl ? (
              <img src={member.fotoUrl} alt={fullName(member)} loading="lazy" />
            ) : (
              <span className="professional-initials">{initials(member)}</span>
            )}
            <div>
              <h3>{fullName(member)}</h3>
              <span>{member.especialidad?.nombre || 'Especialista'}</span>
              <p>{member.descripcionPerfil || member.especialidad?.descripcion || 'Especialista certificado del equipo Style & Beauty.'}</p>
              
              <div style={{ marginTop: '0.8rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {member.cvUrl && (
                  <a className="text-link" href={member.cvUrl} target="_blank" rel="noreferrer">
                    Ver CV
                  </a>
                )}
                {onSelect && (
                  <button 
                    onClick={() => onSelect(member)}
                    className="button button-sm"
                    style={{ marginLeft: 'auto' }}
                  >
                    Ver horarios
                  </button>
                )}
              </div>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
