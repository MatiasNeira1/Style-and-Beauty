import { memo } from 'react';
import { SafeImage } from '../ui/SafeImage.jsx';

function fullName(person) {
  return `${person.nombre || ''} ${person.apellidos || ''}`.trim() || 'Especialista';
}

function professionalId(person) {
  return person.id || person.idProfesional || person.emailContacto || fullName(person);
}

function ProfessionalProfilesComponent({
  professionals = [],
  emptyText = 'Pronto asignaremos especialistas para esta categoria.',
  onSelect,
  onViewProfile,
  selectedId,
  actionLabel = 'Seleccionar',
}) {
  return (
    <div className="professional-profiles">
      {professionals.length === 0 ? (
        <p className="professional-empty">{emptyText}</p>
      ) : (
        professionals.map((member) => {
          const id = professionalId(member);
          const selected = selectedId && id === selectedId;

          return (
            <article key={id} className={`professional-profile ${selected ? 'is-selected' : ''}`}>
              <SafeImage src={member.imageUrl || member.fotoUrl || member.foto} alt={fullName(member)} />
              <div>
                <h3>{fullName(member)}</h3>
                <span>{member.emailContacto || member.especialidad?.nombre || 'Especialista'}</span>

                {member.activo !== undefined && (
                  <small className={member.activo ? 'professional-status active' : 'professional-status inactive'}>
                    {member.activo ? 'Activo' : 'No disponible'}
                  </small>
                )}

                <p>
                  {member.descripcionPerfil ||
                    member.especialidad?.descripcion ||
                    'Especialista certificado del equipo Style & Beauty.'}
                </p>

                <div className="professional-profile-actions">
                  {member.cvUrl && (
                    <a className="text-link" href={member.cvUrl} target="_blank" rel="noreferrer">
                      Ver CV
                    </a>
                  )}

                  {onViewProfile && (
                    <button
                      type="button"
                      onClick={() => onViewProfile(member)}
                      className="button button-sm button-secondary"
                    >
                      Ver perfil
                    </button>
                  )}

                  {onSelect && (
                    <button
                      type="button"
                      onClick={() => onSelect(member)}
                      className="button button-sm"
                      disabled={member.activo === false}
                      style={{ marginLeft: 'auto' }}
                    >
                      {selected ? 'Seleccionado' : actionLabel}
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}

export const ProfessionalProfiles = memo(ProfessionalProfilesComponent);
