import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { staffService } from '../../services/staffService.js';

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

  // ---------- Fetch real appointment data for this staff ----------
  const staffId = currentStaff?.idStaff || currentStaff?.idPersona;

  const { data: appointments = [] } = useQuery({
    queryKey: ['staff-appointments', staffId],
    queryFn: () => staffService.listStaffAppointments(staffId),
    enabled: !!staffId && staffService.isValidUuid(staffId),
    staleTime: 60_000,
  });

  // ---------- Calculate real average rating ----------
  const ratedAppointments = appointments.filter(
    (a) => a.calificacion != null && a.estadoCita === 'FINALIZADA'
  );

  const averageRating =
    ratedAppointments.length > 0
      ? (
          ratedAppointments.reduce((sum, a) => sum + a.calificacion, 0) /
          ratedAppointments.length
        ).toFixed(1)
      : null;

  const comments = ratedAppointments
    .filter((a) => a.comentarioCalificacion)
    .map((a) => ({
      id: a.idCita,
      text: a.comentarioCalificacion,
      rating: a.calificacion,
      clientName: a.nombreCliente || 'Cliente',
    }));

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
          <span>Estadisticas de satisfaccion de usuarios</span>
          <h3>Nivel de satisfaccion de clientes</h3>
          <p>Calificaciones y comentarios reales de los clientes atendidos.</p>
        </div>
        <div
          className="staff-satisfaction-score"
          aria-label={averageRating ? `Calificación promedio de ${averageRating}` : 'Sin evaluaciones reales registradas'}
        >
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
                fill={isFilled ? '#e2b47e' : 'none'}
                color={isFilled ? '#e2b47e' : '#d1d5db'}
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
          Ver comentarios y recomendaciones ({ratedAppointments.length})
        </button>
        {showSatisfactionComments && (
          <div className="staff-satisfaction-comments">
            <strong>Comentarios y recomendaciones hacia el staff</strong>
            {comments.length === 0 ? (
              <p>Aun no hay comentarios publicados por clientes para este profesional.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0' }}>
                {comments.map((c) => (
                  <li
                    key={c.id}
                    style={{
                      padding: '0.6rem 0',
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < c.rating ? '#e2b47e' : 'none'}
                          color={i < c.rating ? '#e2b47e' : '#d1d5db'}
                        />
                      ))}
                      <span style={{ fontSize: '0.8rem', opacity: 0.6, marginLeft: '0.4rem' }}>{c.clientName}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{c.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
