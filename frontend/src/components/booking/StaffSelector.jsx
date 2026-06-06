import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { SafeImage } from '../ui/SafeImage.jsx';

function getStaffId(member) {
  return member.idPersona || member.idStaff || member.id || member.nombre;
}

export function StaffSelector({ staff = [], selectedId, onSelect }) {
  if (!staff.length) {
    return (
      <Card className="client-empty-state">
        <h3>No hay profesionales disponibles</h3>
        <p>Selecciona otro servicio o revisa nuevamente mas tarde.</p>
      </Card>
    );
  }

  return (
    <div className="grid-list">
      {staff.map((member) => {
        const id = getStaffId(member);
        const isSelected = id === selectedId;
        const fullName = `${member.nombre || member.name || 'Profesional'} ${member.apellidos || ''}`.trim();
        return (
          <Card key={id} className={`staff-card ${isSelected ? 'active-staff-card' : ''}`}>
            <div className="staff-card-header">
              <div className="staff-avatar">
                <SafeImage src={member.imageUrl || member.foto || member.fotoUrl} alt={fullName} />
              </div>
              <div>
                <h3>{fullName}</h3>
                <span className="card-kicker">{member.especialidad?.nombre || member.rol || 'Especialista'}</span>
              </div>
            </div>

            <p>{member.descripcionPerfil || member.bio || 'Profesional dedicado a entregarte una experiencia segura y personalizada.'}</p>

            <Button
              type="button"
              size="sm"
              variant={isSelected ? 'primary' : 'ghost'}
              onClick={() => onSelect?.(member)}
            >
              {isSelected ? 'Seleccionado' : 'Elegir profesional'}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
