import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { staffService } from '../../services/staffService.js';
import {
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  CalendarClock,
  FileText,
  Image,
  Mail,
  MessageSquare,
  Phone,
  Star,
  User,
} from 'lucide-react';

function displayValue(value) {
  return value || '-';
}

function ProfileFact({ icon: Icon, label, value }) {
  return (
    <div className="staff-profile-fact">
      <span>
        <Icon size={13} />
        {label}
      </span>
      <strong>{displayValue(value)}</strong>
    </div>
  );
}

function ShortcutCard({ icon: Icon, title, description, onClick }) {
  return (
    <button type="button" className="staff-shortcut-card" onClick={onClick}>
      <span className="staff-shortcut-icon">
        <Icon size={17} />
      </span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </button>
  );
}

export function StaffPortalProfile({ currentStaff, fullName, initials, specialtyName, onNavigate, onEditProfile }) {
  const [showSatisfactionComments, setShowSatisfactionComments] = useState(false);

  const staffId = currentStaff?.idStaff || currentStaff?.idPersona || currentStaff?.id;

  const { data: appointments = [] } = useQuery({
    queryKey: ['staff-appointments-ratings', staffId],
    queryFn: () => staffService.listStaffAppointments(staffId),
    enabled: Boolean(staffId),
  });

  const evaluatedAppointments = appointments.filter((c) => c.calificacion != null);
  const averageRating = evaluatedAppointments.length > 0
    ? (evaluatedAppointments.reduce((acc, c) => acc + c.calificacion, 0) / evaluatedAppointments.length).toFixed(1)
    : null;

  return (
    <div className="staff-profile-stack">
      <div className="staff-profile-layout">
        <section className="staff-profile-card">
          <div className="staff-profile-hero">
            <div className="staff-profile-identity">
              <div className="staff-profile-avatar">
                {initials}
              </div>
              <div>
                <span>Perfil propio</span>
                <h3>{fullName}</h3>
                <p>{specialtyName}</p>
              </div>
            </div>
            <button className="staff-profile-edit-button" type="button" onClick={onEditProfile}>
              <User size={15} />
              Editar perfil
            </button>
          </div>

          <div className="staff-profile-facts">
            <ProfileFact icon={Mail} label="Email" value={currentStaff.emailContacto} />
            <ProfileFact icon={Phone} label="Telefono" value={currentStaff.telefono} />
            <ProfileFact icon={FileText} label="RUT" value={currentStaff.rut} />
            <ProfileFact icon={Calendar} label="Nacimiento" value={currentStaff.fechaNacimiento} />
            <ProfileFact icon={Briefcase} label="Experiencia" value={currentStaff.experienciaAnios ? `${currentStaff.experienciaAnios} anos` : ''} />
            <ProfileFact icon={User} label="Genero" value={currentStaff.genero} />
          </div>
        </section>

        <section className="staff-profile-card">
          <div className="staff-resource-heading">
            <Award size={18} />
            <div>
              <span>Recursos del profesional</span>
              <h3>Gestiona tu presencia publica</h3>
              <p>Estos accesos abren los editores conectados a tu perfil, agenda y portfolio.</p>
            </div>
          </div>

          <div className="staff-shortcut-list">
            <ShortcutCard
              icon={BookOpen}
              title="Biografia Profesional"
              description="Edita tu perfil curricular desde Mi Portfolio Digital."
              onClick={() => onNavigate?.('portfolio')}
            />
            <ShortcutCard
              icon={CalendarClock}
              title="Jornada Laboral Fija"
              description="Configura dias y horas disponibles para reservas."
              onClick={() => onNavigate?.('schedule')}
            />
            <ShortcutCard
              icon={Image}
              title="Mi Portfolio Digital"
              description="Sube, revisa y elimina fotos de trabajos realizados."
              onClick={() => onNavigate?.('portfolio')}
            />
          </div>
        </section>
      </div>

      <section className="staff-satisfaction-card">
        <div className="staff-satisfaction-copy">
          <span>Nivel de satisfacción</span>
          <h3>Nivel de satisfacción de clientes</h3>
          <p>Calificaciones y comentarios reales de los clientes atendidos.</p>
        </div>
        <div className="staff-satisfaction-score" aria-label={averageRating ? `Calificación promedio de ${averageRating}` : "Sin evaluaciones reales registradas"}>
          <strong>{averageRating || 'S/N'}</strong>
          <span>{averageRating ? 'promedio real' : 'sin evaluar'}</span>
        </div>
        <div className="staff-satisfaction-stars" aria-hidden="true" style={{ display: 'flex', color: '#e2b47e' }}>
          {Array.from({ length: 5 }).map((_, index) => {
            const starValue = index + 1;
            const isFilled = averageRating ? starValue <= Math.round(Number(averageRating)) : false;
            return (
              <Star
                key={index}
                size={22}
                fill={isFilled ? "#e2b47e" : "none"}
                color={isFilled ? "#e2b47e" : "#d1d5db"}
              />
            );
          })}
        </div>
        <button
          type="button"
          className="staff-satisfaction-button"
          aria-expanded={showSatisfactionComments}
          onClick={() => setShowSatisfactionComments((visible) => !visible)}
        >
          <MessageSquare size={16} />
          Ver comentarios y recomendaciones ({evaluatedAppointments.length})
        </button>
        {showSatisfactionComments && (
          <div className="staff-satisfaction-comments" style={{ width: '100%' }}>
            <strong>Comentarios y recomendaciones hacia el staff</strong>
            {evaluatedAppointments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem', width: '100%' }}>
                {evaluatedAppointments.map((c) => (
                  <div key={c.idCita} style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: 'var(--color-bg-secondary, #f9fafb)', border: '1px solid var(--color-border, #e5e7eb)', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <div style={{ display: 'flex', color: '#e2b47e' }}>
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            size={14}
                            fill={idx < c.calificacion ? '#e2b47e' : 'none'}
                            color={idx < c.calificacion ? '#e2b47e' : '#d1d5db'}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-muted, #6b7280)' }}>
                        {c.fechaHoraInicio ? new Date(c.fechaHoraInicio).toLocaleDateString() : ''}
                      </span>
                    </div>
                    {c.comentarioCalificacion && (
                      <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--color-text, #1f2937)', fontStyle: 'italic' }}>
                        "{c.comentarioCalificacion}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>Aun no hay comentarios publicados por clientes para este profesional.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
