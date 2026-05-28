import { UserRound } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Card } from '../ui/Card.jsx';

function getStaffId(member) {
  return member.idPersona || member.idStaff || member.id || member.nombre;
}

export function StaffSelector({ staff = [], selectedId, onSelect }) {
  return (
    <div className="grid-list">
      {staff.map((member) => {
        const id = getStaffId(member);
        const name = `${member.nombre || member.name || 'Profesional'} ${member.apellidos || ''}`.trim();

        return (
          <Card key={id} className={id === selectedId ? 'active-staff-card' : ''}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '4rem',
                  height: '4rem',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {member.foto ? (
                  <img src={member.foto} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <UserRound size={28} color="var(--color-ink-soft)" />
                )}
              </div>
              <div>
                <h3 style={{ margin: '0.2rem 0 0.1rem' }}>{name}</h3>
                <span className="card-kicker">{member.rol || 'Especialista'}</span>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', marginBottom: '1.2rem', minHeight: '2.7rem' }}>
              {member.bio || 'Profesional dedicado a brindarte la mejor experiencia y resultados excepcionales.'}
            </p>

            <Button size="sm" onClick={() => onSelect?.(member)} style={id === selectedId ? { background: 'var(--color-champagne)' } : {}}>
              {id === selectedId ? 'Seleccionado' : 'Agendar'}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
