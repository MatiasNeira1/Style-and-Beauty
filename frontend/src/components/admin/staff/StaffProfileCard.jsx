import { User, Mail, Phone, Calendar, Briefcase, Star } from 'lucide-react';
import { Badge } from '../../ui/Badge.jsx';

export function StaffProfileCard({ staff }) {
  if (!staff) return null;

  const fullName = `${staff.nombre || ''} ${staff.apellidos || ''}`.trim() || 'Sin nombre';
  const initials = fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const specialtyName = staff.especialidad?.nombre || staff.nombreEspecialidad || 'Sin asignar';

  return (
    <div className="card staff-profile-drawer">
      {/* ── Header ────────────────────────────────── */}
      <div className="staff-profile-header">
        <div className="staff-avatar">{initials}</div>
        <div className="staff-profile-meta">
          <h3>{fullName}</h3>
          <span>
            <Badge tone="primary">{specialtyName}</Badge>
          </span>
        </div>
      </div>

      {/* ── Información personal ──────────────────── */}
      <div className="staff-info-grid">
        <div className="staff-info-item">
          <label><Mail size={11} /> Email</label>
          <span>{staff.emailContacto || '—'}</span>
        </div>
        <div className="staff-info-item">
          <label><Phone size={11} /> Teléfono</label>
          <span>{staff.telefono || '—'}</span>
        </div>
        <div className="staff-info-item">
          <label><User size={11} /> RUT</label>
          <span>{staff.rut || '—'}</span>
        </div>
        <div className="staff-info-item">
          <label><Calendar size={11} /> Nacimiento</label>
          <span>{staff.fechaNacimiento || '—'}</span>
        </div>
        <div className="staff-info-item">
          <label><Briefcase size={11} /> Experiencia</label>
          <span>{staff.experienciaAnios ? `${staff.experienciaAnios} años` : '—'}</span>
        </div>
        <div className="staff-info-item">
          <label><Star size={11} /> Género</label>
          <span>{staff.genero || '—'}</span>
        </div>
      </div>

      {/* ── Biografía ─────────────────────────────── */}
      {staff.biografia && (
        <div style={{ marginTop: '0.75rem' }}>
          <label style={{
            color: 'var(--color-muted)',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            Perfil curricular
          </label>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, margin: '0.3rem 0 0', color: 'var(--color-ink-soft)' }}>
            {staff.biografia}
          </p>
        </div>
      )}
    </div>
  );
}
