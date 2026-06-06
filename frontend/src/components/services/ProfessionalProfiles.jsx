import { SafeImage } from '../ui/SafeImage.jsx';

function fullName(person) {
  return `${person.nombre || ''} ${person.apellidos || ''}`.trim() || 'Especialista';
}

export function ProfessionalProfiles({ professionals = [], emptyText = 'Pronto asignaremos especialistas para esta categoria.' }) {
  return (
    <div className="professional-profiles">
      {professionals.length === 0 ? (
        <p className="professional-empty">{emptyText}</p>
      ) : (
        professionals.map((member) => (
          <article key={member.idPersona || member.idStaff || member.idAuth} className="professional-profile">
            <SafeImage src={member.imageUrl || member.fotoUrl || member.foto} alt={fullName(member)} />
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
