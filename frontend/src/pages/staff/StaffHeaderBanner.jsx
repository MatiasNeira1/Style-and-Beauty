import { Award, Pencil, LogOut } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';

export function StaffHeaderBanner({ currentStaff, fullName, onEditProfile, onLogout }) {
  return (
    <div className="card glass-card" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(255, 255, 255, 0.4)', background: 'linear-gradient(135deg, rgba(255, 248, 244, 0.6) 0%, rgba(255, 255, 255, 0.85) 100%)', boxShadow: '0 8px 32px rgba(25, 20, 23, 0.04)' }}>
      <div className="staff-header">
        <div className="staff-header-info">
          <span className="staff-stat-pill" style={{ display: 'inline-flex', marginBottom: '0.5rem', background: 'rgba(169, 52, 84, 0.08)', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.78rem' }}>
            <Award size={14} style={{ marginRight: '0.35rem' }} /> Portal del Estilista
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', color: 'var(--color-ink)', fontWeight: 400, margin: '0.5rem 0 0.2rem' }}>
            ¡Hola, {currentStaff.nombre}!
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.92rem', margin: 0 }}>
            Este es tu panel privado. Aquí puedes autogestionar tus horarios, biografía profesional y portafolio de trabajos realizados.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button onClick={onEditProfile} style={{ background: 'var(--color-primary)', color: '#fff', border: 0, padding: '0.6rem 1.2rem', fontWeight: 600 }}>
            <Pencil size={15} style={{ marginRight: '0.5rem' }} />
            Editar Perfil
          </Button>
          <Button variant="ghost" onClick={onLogout} style={{ border: '1px solid rgba(169, 52, 84, 0.2)', color: 'var(--color-primary-strong)', padding: '0.6rem 1.2rem', fontWeight: 600 }}>
            <LogOut size={15} style={{ marginRight: '0.5rem' }} />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
