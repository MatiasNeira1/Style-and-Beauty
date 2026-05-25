import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { UserRound } from 'lucide-react';

export function StaffSelector({ staff = [], selectedId, onSelect }) {
  return (
    <div className="grid-list">
      {staff.map((member) => (
        <button
          key={member.idPersona || member.idStaff || member.id || member.nombre}
          className={(member.idPersona || member.idStaff || member.id || member.nombre) === selectedId ? 'chip active' : 'chip'}
          onClick={() => onSelect?.(member)}
        >
          {`${member.nombre || member.name || 'Profesional'} ${member.apellidos || ''}`.trim()}
        </button>
        <Card key={member.id || member.nombre} className={(member.id || member.nombre) === selectedId ? 'active-staff-card' : ''}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ 
              width: '4rem', 
              height: '4rem', 
              borderRadius: '50%', 
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {member.foto ? (
                <img src={member.foto} alt={member.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <UserRound size={28} color="var(--color-ink-soft)" />
              )}
            </div>
            <div>
              <h3 style={{ margin: '0.2rem 0 0.1rem' }}>{member.nombre || member.name}</h3>
              <span className="card-kicker">{member.rol || 'Especialista'}</span>
            </div>
          </div>
          
          <p style={{ fontSize: '0.9rem', marginBottom: '1.2rem', minHeight: '2.7rem' }}>
            {member.bio || 'Profesional dedicado a brindarte la mejor experiencia y resultados excepcionales.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <Button variant="ghost" size="sm" onClick={() => alert(`Conoce más sobre ${member.nombre}`)}>
              Saber más
            </Button>
            <Button 
              size="sm" 
              onClick={() => onSelect?.(member)}
              style={(member.id || member.nombre) === selectedId ? { background: 'var(--color-champagne)' } : {}}
            >
              {(member.id || member.nombre) === selectedId ? 'Seleccionado' : 'Agendar'}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
