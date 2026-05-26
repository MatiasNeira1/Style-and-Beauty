import { BookOpen, FileText, Mail, Phone, Calendar, Briefcase, User, Award, CalendarClock, Image } from 'lucide-react';

export function StaffPortalProfile({ currentStaff, fullName, initials, specialtyName }) {
  return (
    <div className="staff-admin-detail-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
      {/* Tarjeta de Perfil Curricular Premium */}
      <div className="card glass-card" style={{ padding: '2rem', border: '1px solid rgba(25, 20, 23, 0.08)', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.85)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.03)' }}>
        {/* Header de la Tarjeta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            height: '4.8rem',
            width: '4.8rem',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-champagne))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontFamily: 'var(--font-serif)',
            fontSize: '1.6rem',
            fontWeight: '700',
            boxShadow: '0 6px 20px rgba(169, 52, 84, 0.25)',
            border: '3px solid #fff'
          }}>
            {initials}
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>
              {fullName}
            </h3>
            <span className="staff-stat-pill" style={{ display: 'inline-flex', fontSize: '0.8rem', padding: '0.25rem 0.75rem', marginTop: '0.65rem', fontWeight: 700, background: 'rgba(169, 52, 84, 0.08)', color: 'var(--color-primary)' }}>
              {specialtyName}
            </span>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid rgba(25, 20, 23, 0.08)', margin: '1.5rem 0' }} />

        {/* Biografía */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            <BookOpen size={14} />
            Biografía / Perfil Curricular
          </div>
          {currentStaff.descripcionPerfil ? (
            <div style={{ position: 'relative', paddingLeft: '1rem', borderLeft: '3px solid var(--color-champagne)' }}>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--color-ink-soft)', fontStyle: 'italic', margin: 0 }}>
                "{currentStaff.descripcionPerfil}"
              </p>
            </div>
          ) : (
            <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', fontStyle: 'italic', margin: 0 }}>
              Aún no has agregado una biografía curricular. Escribe sobre ti, tu trayectoria y pasiones haciendo clic en "Editar Perfil" arriba.
            </p>
          )}
        </div>

        <hr style={{ border: 0, borderTop: '1px solid rgba(25, 20, 23, 0.08)', margin: '1.5rem 0' }} />

        {/* Información Personal Detallada */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            <FileText size={14} />
            Información de Contacto y Personal
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(25, 20, 23, 0.02)', padding: '0.75rem 1rem', borderRadius: '12px', display: 'grid', gap: '0.2rem', border: '1px solid rgba(25, 20, 23, 0.03)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Mail size={12} /> Email
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ink)', wordBreak: 'break-all' }}>
                {currentStaff.emailContacto || '—'}
              </span>
            </div>

            <div style={{ background: 'rgba(25, 20, 23, 0.02)', padding: '0.75rem 1rem', borderRadius: '12px', display: 'grid', gap: '0.2rem', border: '1px solid rgba(25, 20, 23, 0.03)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Phone size={12} /> Teléfono
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                {currentStaff.telefono || '—'}
              </span>
            </div>

            <div style={{ background: 'rgba(25, 20, 23, 0.02)', padding: '0.75rem 1rem', borderRadius: '12px', display: 'grid', gap: '0.2rem', border: '1px solid rgba(25, 20, 23, 0.03)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <FileText size={12} /> RUT
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                {currentStaff.rut || '—'}
              </span>
            </div>

            <div style={{ background: 'rgba(25, 20, 23, 0.02)', padding: '0.75rem 1rem', borderRadius: '12px', display: 'grid', gap: '0.2rem', border: '1px solid rgba(25, 20, 23, 0.03)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Calendar size={12} /> Nacimiento
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                {currentStaff.fechaNacimiento || '—'}
              </span>
            </div>

            <div style={{ background: 'rgba(25, 20, 23, 0.02)', padding: '0.75rem 1rem', borderRadius: '12px', display: 'grid', gap: '0.2rem', border: '1px solid rgba(25, 20, 23, 0.03)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Briefcase size={12} /> Experiencia
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                {currentStaff.experienciaAnios ? `${currentStaff.experienciaAnios} años` : '—'}
              </span>
            </div>

            <div style={{ background: 'rgba(25, 20, 23, 0.02)', padding: '0.75rem 1rem', borderRadius: '12px', display: 'grid', gap: '0.2rem', border: '1px solid rgba(25, 20, 23, 0.03)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <User size={12} /> Género
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                {currentStaff.genero || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta de Guías y Reglas del Salón */}
      <div className="card glass-card" style={{ padding: '2rem', border: '1px solid rgba(25, 20, 23, 0.08)', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.85)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.03)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-primary)', margin: '0 0 0.5rem' }}>
            <Award size={18} /> Reglas y Recursos del Estilista
          </h3>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--color-ink-soft)', margin: 0 }}>
            Como miembro oficial de nuestro equipo, tienes el control total para destacar tu marca personal en el salón:
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem', background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(25, 20, 23, 0.05)' }}>
            <div style={{ background: 'rgba(169, 52, 84, 0.08)', color: 'var(--color-primary)', height: '2.2rem', width: '2.2rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={16} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.15rem', fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-ink)' }}>Biografía Profesional</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-muted)', lineHeight: 1.4 }}>Describe tu experiencia, certificaciones y estilo único. Los clientes podrán leerla al momento de reservar su cita contigo.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(25, 20, 23, 0.05)' }}>
            <div style={{ background: 'rgba(169, 52, 84, 0.08)', color: 'var(--color-primary)', height: '2.2rem', width: '2.2rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CalendarClock size={16} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.15rem', fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-ink)' }}>Jornada Laboral Fija</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-muted)', lineHeight: 1.4 }}>Indica los días que trabajas y tus horas de atención. El motor inteligente bloqueará o habilitará automáticamente tus horas de reserva.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(25, 20, 23, 0.05)' }}>
            <div style={{ background: 'rgba(169, 52, 84, 0.08)', color: 'var(--color-primary)', height: '2.2rem', width: '2.2rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Image size={16} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.15rem', fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-ink)' }}>Mi Portfolio Digital</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-muted)', lineHeight: 1.4 }}>Sube fotos en alta resolución de tus cortes, tinturas y peinados realizados. ¡Es tu mejor carta de presentación frente al cliente!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
