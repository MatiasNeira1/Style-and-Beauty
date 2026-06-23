import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CalendarClock, UserRound, Save, Activity, Stethoscope, Star, MessageSquarePlus, CheckCircle, Camera } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { useAuth } from '../../store/AuthContext.jsx';
import { authService } from '../../services/authService.js';
import { firebaseAuthService } from '../../services/firebaseAuthService.js';
import { profileService } from '../../services/profileService.js';
import { reservationService } from '../../services/reservationService.js';
import { isProfileNotFoundError } from '../../services/apiClient.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RESERVATION_DEPOSIT_CLP, formatCLP } from '../../utils/priceUtils.js';
import { isValidChilePhone, normalizeChilePhone } from '../../utils/phoneUtils.js';
import { formatRut, normalizeRut, validateRut } from '../../utils/rutUtils.js';

const MIN_CLIENT_AGE = 15;

const monthOptions = [
  ['01', 'Enero'],
  ['02', 'Febrero'],
  ['03', 'Marzo'],
  ['04', 'Abril'],
  ['05', 'Mayo'],
  ['06', 'Junio'],
  ['07', 'Julio'],
  ['08', 'Agosto'],
  ['09', 'Septiembre'],
  ['10', 'Octubre'],
  ['11', 'Noviembre'],
  ['12', 'Diciembre'],
];

function toIsoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function getMaxBirthDateIso() {
  const today = new Date();
  return toIsoDate(new Date(today.getFullYear() - MIN_CLIENT_AGE, today.getMonth(), today.getDate()));
}

function parseIsoDate(value) {
  if (!value) return {};
  const [year, month, day] = value.split('-');
  return { year, month, day };
}

function daysInMonth(year, month) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function isMinimumAge(value) {
  return Boolean(value) && value <= getMaxBirthDateIso();
}

function profileFormErrorMessage(err) {
  const message = String(err?.message || '').toLowerCase();
  if (message.includes('rut') || message.includes('correo') || message.includes('email') || message.includes('edad')) {
    return err.message;
  }
  return 'No fue posible guardar tu perfil. Revisa los datos e intenta nuevamente.';
}

function ProfileHero({ missing = false }) {
  return (
    <section className="page-hero page-hero-profile">
      <div className="page-hero-media" />
      <div className="page-hero-overlay" />
      <div className="page-hero-content">
        <span className="card-kicker">Perfil cliente</span>
        <h1>{missing ? 'Completa tu espacio Style & Beauty' : 'Tu información, reservas y cuidado personal'}</h1>
        <p>
          {missing
            ? 'Asocia tu cuenta autenticada con un perfil cliente para reservar, contactar al equipo y mantener tus datos al día.'
            : 'Gestiona tus datos personales y mantén tu experiencia preparada para cada visita.'}
        </p>
      </div>
    </section>
  );
}

function BirthDateSelects({ value, onChange, error }) {
  const maxDate = getMaxBirthDateIso();
  const max = parseIsoDate(maxDate);

  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  // Sync with outer value when it changes to a valid date
  useEffect(() => {
    if (value) {
      const parsed = parseIsoDate(value);
      if (parsed.year && parsed.month && parsed.day) {
        setYear(parsed.year);
        setMonth(parsed.month);
        setDay(parsed.day);
      }
    } else {
      if (!value && year && month && day) {
        setYear('');
        setMonth('');
        setDay('');
      }
    }
  }, [day, month, value, year]);

  const years = Array.from({ length: 101 }, (_, index) => String(Number(max.year) - index));
  const maxMonthForYear = year === max.year ? Number(max.month) : 12;
  const availableMonths = monthOptions.filter(([m]) => Number(m) <= maxMonthForYear);
  const maxDayForMonth = year === max.year && month === max.month
    ? Number(max.day)
    : daysInMonth(year, month);
  const availableDays = Array.from({ length: maxDayForMonth }, (_, index) => String(index + 1).padStart(2, '0'));

  const handleYearChange = (e) => {
    const val = e.target.value;
    setYear(val);
    setMonth('');
    setDay('');
    onChange('');
  };

  const handleMonthChange = (e) => {
    const val = e.target.value;
    setMonth(val);
    setDay('');
    onChange('');
  };

  const handleDayChange = (e) => {
    const val = e.target.value;
    setDay(val);
    if (!year || !month || !val) {
      onChange('');
      return;
    }
    const isoDate = `${year}-${month}-${val}`;
    onChange(isoDate <= maxDate ? isoDate : '');
  };

  return (
    <div className="profile-birthdate-field">
      <span>Fecha de nacimiento</span>
      <div className="profile-birthdate-grid">
        <select aria-label="Año de nacimiento" value={year} onChange={handleYearChange} required>
          <option value="">Año</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select aria-label="Mes de nacimiento" value={month} onChange={handleMonthChange} disabled={!year} required>
          <option value="">Mes</option>
          {availableMonths.map(([m, label]) => <option key={m} value={m}>{label}</option>)}
        </select>
        <select aria-label="Día de nacimiento" value={day} onChange={handleDayChange} disabled={!year || !month} required>
          <option value="">Día</option>
          {availableDays.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <small>{error || `Edad mínima: ${MIN_CLIENT_AGE} años.`}</small>
    </div>
  );
}

function ProfileAvatar({ photoUrl, onChangePhoto, disabled = false, initials = '', hint = '' }) {
  return (
    <div className="profile-photo-control">
      <div className="profile-photo-avatar">
        {photoUrl ? (
          <img src={photoUrl} alt="Foto de perfil" />
        ) : (
          <div className="profile-photo-placeholder">
            {initials ? <span>{initials}</span> : <UserRound size={48} />}
          </div>
        )}
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onChangePhoto} disabled={disabled} className="profile-photo-button">
        <Camera size={15} /> Cambiar foto
      </Button>
      {hint && <span className="profile-photo-hint">{hint}</span>}
    </div>
  );
}

function ProfilePhotoModal({ open, currentPhoto, previewPhoto, file, error, isSaving, initials, onFileChange, onClose, onSave }) {
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';
    if (selectedFile) onFileChange(selectedFile);
  };

  const renderAvatar = (src) => (
    src ? <img src={src} alt="Foto de perfil" /> : (
      <div className="profile-photo-placeholder">
        {initials ? <span>{initials}</span> : <UserRound size={48} />}
      </div>
    )
  );

  return (
    <Modal open={open} title="Cambiar foto de perfil" onClose={onClose} closeDisabled={isSaving} className="profile-photo-modal">
      <form className="profile-photo-modal-form" onSubmit={onSave}>
        <div className="profile-photo-modal-previews">
          <figure>
            <div className="profile-photo-modal-avatar">{renderAvatar(currentPhoto)}</div>
            <figcaption>Foto actual</figcaption>
          </figure>
          <figure>
            <div className="profile-photo-modal-avatar preview">{renderAvatar(previewPhoto || currentPhoto)}</div>
            <figcaption>{file ? 'Nueva foto' : 'Vista previa'}</figcaption>
          </figure>
        </div>

        <label className="button button-ghost profile-photo-file-button">
          <Camera size={16} /> Seleccionar imagen
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} disabled={isSaving} />
        </label>
        <p className="profile-photo-modal-hint">JPG, PNG o WEBP · máximo 5 MB</p>
        {error && <p className="admin-alert compact">{error}</p>}

        <div className="profile-photo-modal-actions">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button type="submit" disabled={isSaving || !file}>{isSaving ? 'Guardando...' : 'Guardar cambios'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function profileRoleLabel(user, profile) {
  const role = resolveProfileRole(user, profile);
  if (isAdminRole(role)) return 'Administrador';
  if (isStaffRole(role)) return 'Staff';
  return 'Cliente Registrado';
}

function normalizeRole(value = '') {
  const role = String(value || '').trim().toUpperCase();
  if (['ADMINISTRADOR', 'ADMINISTRATOR'].includes(role)) return 'ADMIN';
  if (['PROFESIONAL', 'PROFESSIONAL', 'EMPLEADO', 'EMPLOYEE'].includes(role)) return 'STAFF';
  if (role === 'CLIENT') return 'CLIENTE';
  return role;
}

function isAdminRole(role) {
  return normalizeRole(role) === 'ADMIN';
}

function isStaffRole(role) {
  return normalizeRole(role) === 'STAFF';
}

function isClientRoleValue(role) {
  return normalizeRole(role) === 'CLIENTE';
}

function inferRoleFromProfile(profile) {
  if (!profile) return '';
  if (profile.tipoPerfil) return profile.tipoPerfil;
  if (profile.especialidad || profile.holguraCitaMinutos !== undefined || profile.cvUrl || profile.descripcionPerfil) return 'STAFF';
  if (profile.puntosFidelidad !== undefined || profile.fichaTecnica !== undefined || profile.fotoUrl !== undefined) return 'CLIENTE';
  return '';
}

function resolveProfileRole(user, profile) {
  return normalizeRole(user?.rol || user?.role || inferRoleFromProfile(profile));
}

function formatAppointmentDate(value) {
  if (!value) return 'Fecha por confirmar';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha por confirmar';
  return new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: '2-digit', month: 'short' }).format(date);
}

function formatAppointmentTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

function appointmentStatusLabel(status = '') {
  return String(status || 'Pendiente')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function isDepositPaid(status = '') {
  return ['CONFIRMADA', 'PAGADA', 'PAGADO', 'AUTORIZADA', 'PAID', 'AUTHORIZED'].includes(String(status).toUpperCase());
}

function reservationQueryMessage(error) {
  if (error?.status === 404) {
    return {
      tone: 'neutral',
      message: 'Completa tu perfil para visualizar tus próximas reservas.',
    };
  }
  if (error?.status === 403) {
    return {
      tone: 'neutral',
      message: 'Esta sección está disponible para perfiles cliente.',
    };
  }
  if (error?.status >= 500) {
    return {
      tone: 'error',
      message: 'No pudimos cargar tus próximas reservas. Intenta nuevamente más tarde.',
    };
  }
  return {
    tone: 'error',
    message: 'No pudimos cargar tus próximas reservas. Intenta nuevamente más tarde.',
  };
}

function UpcomingAppointmentsCard({ query, accessState = 'client' }) {
  const appointments = Array.isArray(query.data) ? query.data : [];
  const controlledMessage = accessState === 'incomplete'
    ? 'Completa tu perfil para visualizar tus próximas reservas.'
    : accessState === 'not-client'
      ? 'Esta sección está disponible para perfiles cliente.'
      : '';
  const errorState = query.isError ? reservationQueryMessage(query.error) : null;

  return (
    <Card className="upcoming-appointments-card">
      <h4>
        <CalendarClock size={18} color="var(--color-primary-strong)" />
        Próximas horas agendadas
      </h4>

      {controlledMessage && <p className="profile-empty-state">{controlledMessage}</p>}
      {!controlledMessage && query.isLoading && <p className="profile-empty-state">Cargando próximas horas...</p>}
      {!controlledMessage && errorState && (
        <p className={errorState.tone === 'error' ? 'admin-alert' : 'profile-empty-state'}>{errorState.message}</p>
      )}
      {!controlledMessage && !query.isLoading && !query.isError && appointments.length === 0 && (
        <p className="profile-empty-state">No tienes próximas horas agendadas.</p>
      )}

      {!controlledMessage && !query.isLoading && !query.isError && appointments.length > 0 && (
        <div className="upcoming-appointments-list">
          {appointments.map((appointment) => {
            const status = appointment.estadoCita || appointment.estado || 'PENDIENTE_PAGO';
            const start = appointment.fechaHoraInicio || appointment.inicio;
            const end = appointment.fechaHoraFinAtencion || appointment.fechaHoraFin || appointment.fin;
            const deposit = appointment.abonoReserva ?? appointment.abono ?? RESERVATION_DEPOSIT_CLP;

            return (
              <article key={appointment.idCita || `${start}-${appointment.idServicio}`} className="upcoming-appointment-item">
                <div>
                  <strong>{appointment.servicioNombre || appointment.servicio || 'Servicio'}</strong>
                  <span>{appointment.profesionalNombre || appointment.profesional || 'Profesional por confirmar'}</span>
                </div>
                <dl>
                  <div>
                    <dt>Fecha</dt>
                    <dd>{formatAppointmentDate(start)}</dd>
                  </div>
                  <div>
                    <dt>Horario</dt>
                    <dd>{formatAppointmentTime(start)}{end ? ` - ${formatAppointmentTime(end)}` : ''}</dd>
                  </div>
                  <div>
                    <dt>Estado</dt>
                    <dd>{appointmentStatusLabel(status)}</dd>
                  </div>
                  <div>
                    <dt>Valor servicio</dt>
                    <dd>{formatCLP(appointment.valorServicio || appointment.precio || 0)}</dd>
                  </div>
                  <div>
                    <dt>{isDepositPaid(status) ? 'Abono pagado' : 'Abono pendiente'}</dt>
                    <dd>{formatCLP(deposit)}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </Card>
  );
}


function PastAppointmentItem({ appointment, onEvaluate }) {
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const start = appointment.fechaHoraInicio || appointment.inicio;
  const end = appointment.fechaHoraFinAtencion || appointment.fechaHoraFin || appointment.fin;
  
  const calificacion = appointment.calificacion;
  const comentarioCalificacion = appointment.comentarioCalificacion;

  const ratingDescriptions = {
    1: 'Muy malo',
    2: 'Malo',
    3: 'Aceptable',
    4: 'Bueno',
    5: '¡Excelente!'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await onEvaluate(appointment.idCita, rating, comment);
      setIsRatingOpen(false);
    } catch (err) {
      setSubmitError(err?.message || 'No se pudo guardar la calificación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article className="upcoming-appointment-item past-appointment-item" style={{ borderLeft: '4px solid var(--color-sage)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <strong style={{ fontSize: '1.05rem', color: 'var(--color-ink)' }}>{appointment.servicioNombre || appointment.servicio || 'Servicio'}</strong>
          <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
            Con {appointment.profesionalNombre || appointment.profesional || 'Profesional'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            background: 'rgba(155, 176, 152, 0.15)',
            color: '#4f694c',
            padding: '0.25rem 0.6rem',
            borderRadius: '100px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <CheckCircle size={12} /> Finalizada
          </span>
        </div>
      </div>
      
      <dl style={{ margin: '1rem 0 0.5rem 0' }}>
        <div>
          <dt>Fecha</dt>
          <dd>{formatAppointmentDate(start)}</dd>
        </div>
        <div>
          <dt>Horario</dt>
          <dd>{formatAppointmentTime(start)}{end ? ` - ${formatAppointmentTime(end)}` : ''}</dd>
        </div>
        <div>
          <dt>Precio</dt>
          <dd>{formatCLP(appointment.valorServicio || appointment.precio || 0)}</dd>
        </div>
      </dl>

      {/* Rating Display / Action */}
      <div className="past-appointment-rating-section" style={{ borderTop: '1px dashed var(--color-line)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
        {calificacion !== null && calificacion !== undefined ? (
          // Already rated
          <div className="rated-display" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-ink-soft)' }}>Tu evaluación:</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    fill={star <= calificacion ? '#e2b47e' : 'none'}
                    color={star <= calificacion ? '#e2b47e' : '#d1d5db'}
                  />
                ))}
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>({calificacion}/5)</span>
            </div>
            {comentarioCalificacion && (
              <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--color-ink-soft)', background: 'var(--color-bg-deep)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-xs)', marginTop: '0.25rem' }}>
                &ldquo;{comentarioCalificacion}&rdquo;
              </p>
            )}
          </div>
        ) : (
          // Not rated yet
          <>
            {!isRatingOpen ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRatingOpen(true)}
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-primary-strong)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--color-primary-glow)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'none'
                }}
              >
                <MessageSquarePlus size={14} /> Evaluar experiencia
              </Button>
            ) : (
              <form onSubmit={handleSubmit} className="stack" style={{ gap: '0.75rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ink-soft)' }}>
                    ¿Cómo calificarías el servicio?
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            transition: 'transform 0.15s ease'
                          }}
                        >
                          <Star
                            size={22}
                            fill={(hoverRating || rating) >= star ? '#e2b47e' : 'none'}
                            color={(hoverRating || rating) >= star ? '#e2b47e' : '#d1d5db'}
                            style={{
                              transform: (hoverRating || rating) === star ? 'scale(1.15)' : 'scale(1)',
                              transition: 'transform 0.15s ease'
                            }}
                          />
                        </button>
                      ))}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary-strong)' }}>
                      {ratingDescriptions[hoverRating || rating]}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-ink-soft)' }}>
                    Comentario (Opcional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Cuéntanos más sobre el resultado, la atención..."
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.85rem',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--color-line)',
                      minHeight: '60px',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {submitError && (
                  <p className="admin-alert error" style={{ margin: 0, padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
                    {submitError}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsRatingOpen(false);
                      setSubmitError('');
                    }}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                  >
                    {isSubmitting ? 'Guardando...' : 'Enviar'}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </article>
  );
}

function PastAppointmentsCard({ query, onEvaluate, accessState = 'client' }) {
  const appointments = Array.isArray(query.data) ? query.data : [];
  const controlledMessage = accessState === 'incomplete'
    ? 'Completa tu perfil para visualizar tu historial de citas.'
    : accessState === 'not-client'
      ? 'Esta sección está disponible para perfiles cliente.'
      : '';

  return (
    <Card className="upcoming-appointments-card past-appointments-card">
      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-ink)' }}>
        <CheckCircle size={18} color="var(--color-sage)" />
        Historial de citas atendidas
      </h4>

      {controlledMessage && <p className="profile-empty-state">{controlledMessage}</p>}
      {!controlledMessage && query.isLoading && <p className="profile-empty-state">Cargando historial...</p>}
      {!controlledMessage && query.isError && <p className="admin-alert">No pudimos cargar tu historial de citas. Intenta nuevamente más tarde.</p>}
      {!controlledMessage && !query.isLoading && !query.isError && appointments.length === 0 && (
        <p className="profile-empty-state">No tienes citas finalizadas en tu historial.</p>
      )}

      {!controlledMessage && !query.isLoading && !query.isError && appointments.length > 0 && (
        <div className="upcoming-appointments-list past-appointments-list">
          {appointments.map((appointment) => (
            <PastAppointmentItem
              key={appointment.idCita}
              appointment={appointment}
              onEvaluate={onEvaluate}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

export function ProfilePage() {
  const { user, logout, setSession } = useAuth();
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [photoUploadPending, setPhotoUploadPending] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [hasPendingProfileData, setHasPendingProfileData] = useState(false);
  const authRole = normalizeRole(user?.rol || user?.role || '');
  const isAdminAccount = isAdminRole(authRole);
  const isStaffAccount = isStaffRole(authRole);

  // Fetch real profile data from backend
  const { data: profile, isLoading, error: profileError } = useQuery({
    queryKey: ['myProfile'],
    queryFn: profileService.getMyProfile,
    enabled: Boolean(user && !isAdminAccount),
    retry: false,
  });
  const resolvedRole = resolveProfileRole(user, profile);
  const isResolvedClient = isClientRoleValue(resolvedRole);
  const profileContactEmail = profile?.emailContacto || user?.email || '';
  const reservationProfileIncomplete = Boolean(profile) && (
    !profile?.rut
    || !profile?.nombre
    || !profile?.apellidos
    || !profileContactEmail
    || !profile?.fechaNacimiento
  );
  const reservationsAccessState = reservationProfileIncomplete
    ? 'incomplete'
    : isResolvedClient
      ? 'client'
      : 'not-client';
  const canQueryClientReservations = Boolean(
    user
    && profile?.idPersona
    && isResolvedClient
    && !reservationProfileIncomplete
    && !profileError
  );

  useEffect(() => {
    if (!photoFile) setPhotoPreview(profile?.fotoUrl || '');
  }, [photoFile, profile?.fotoUrl]);

  useEffect(() => {
    if (!photoFile) return undefined;
    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile]);

  const upcomingAppointmentsQuery = useQuery({
    queryKey: ['my-upcoming-reservations', profile?.idPersona],
    queryFn: reservationService.listMyUpcomingReservations,
    enabled: canQueryClientReservations,
    retry: false,
  });

  const historyAppointmentsQuery = useQuery({
    queryKey: ['my-history-reservations', profile?.idPersona],
    queryFn: reservationService.listMyHistoryReservations,
    enabled: canQueryClientReservations,
    retry: false,
  });

  const evaluateMutation = useMutation({
    mutationFn: ({ appointmentId, rating, comment }) =>
      reservationService.evaluateReservation(appointmentId, rating, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-history-reservations', profile?.idPersona] });
    },
  });

  const handleEvaluate = async (appointmentId, rating, comment) => {
    await evaluateMutation.mutateAsync({ appointmentId, rating, comment });
  };

  const handlePhoneChange = (event) => {
    const { value } = event.target;
    let cleanValue = value.replace(/[^0-9+\s]/g, '');
    const digitsOnly = cleanValue.replace(/[^\d]/g, '');
    if (digitsOnly.length > 11) {
      let digitCount = 0;
      let truncated = '';
      for (let i = 0; i < cleanValue.length; i++) {
        const char = cleanValue[i];
        if (/\d/.test(char)) {
          if (digitCount < 11) {
            truncated += char;
            digitCount++;
          }
        } else {
          truncated += char;
        }
      }
      cleanValue = truncated;
    }
    if (cleanValue.length > 15) {
      cleanValue = cleanValue.slice(0, 15);
    }
    setValue('telefono', cleanValue, { shouldValidate: true, shouldDirty: true });
  };

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      emailContacto: user?.email || '',
      genero: 'no_especifica',
      fechaNacimiento: '',
    },
  });
  const birthDateValue = watch('fechaNacimiento');
  const watchedValues = watch();

  // Reset form when profile data loads
  useEffect(() => {
    if (profile) {
      reset({
        nombre: profile.nombre || '',
        apellidos: profile.apellidos || '',
        telefono: profile.telefono || '',
        emailContacto: profile.emailContacto || '',
        alergias: profile.fichaTecnica?.alergias || '',
        medicamentos: profile.fichaTecnica?.medicamentos || '',
        afeccionesPiel: profile.fichaTecnica?.afeccionesPiel || '',
      });
    }
  }, [profile, reset]);

  // Pre-populate completion form with pending registration data if no profile exists
  useEffect(() => {
    if (isProfileNotFoundError(profileError) && !isAdminAccount && !isStaffAccount) {
      try {
        const stored = window.localStorage.getItem('style_beauty_pending_profile')
          || window.sessionStorage.getItem('style_beauty_pending_profile');
        if (stored) {
          const pending = JSON.parse(stored);
          setHasPendingProfileData(true);
          reset({
            rut: pending.rut ? formatRut(pending.rut) : '',
            nombre: pending.nombre || '',
            apellidos: pending.apellidos || '',
            emailContacto: pending.emailContacto || user?.email || '',
            genero: pending.genero || 'no_especifica',
            fechaNacimiento: pending.fechaNacimiento || '',
            telefono: pending.telefono || '',
          });
        }
      } catch (err) {
        console.error('Error parsing pending profile data:', err);
      }
    }
  }, [isAdminAccount, isStaffAccount, profileError, reset, user]);

  const handlePhotoChange = (file) => {
    setPhotoError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoFile(null);
      setPhotoError('Selecciona una imagen JPG, PNG o WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoFile(null);
      setPhotoError('La imagen no puede superar 5 MB.');
      return;
    }
    setPhotoFile(file);
  };

  const openPhotoModal = () => {
    setPhotoError('');
    setPhotoFile(null);
    setPhotoPreview(profile?.fotoUrl || '');
    setPhotoModalOpen(true);
  };

  const closePhotoModal = () => {
    if (photoUploadPending) return;
    setPhotoModalOpen(false);
    setPhotoFile(null);
    setPhotoError('');
    setPhotoPreview(profile?.fotoUrl || '');
  };

  const uploadSelectedPhoto = async () => {
    if (!photoFile) return null;
    setPhotoUploadPending(true);
    setPhotoError('');
    try {
      const updatedProfile = await profileService.uploadMyPhoto(photoFile);
      const persistedUrl = updatedProfile?.fotoUrl || '';
      queryClient.setQueryData(['myProfile'], updatedProfile);
      queryClient.setQueryData(['my-profile'], updatedProfile);
      setPhotoPreview(persistedUrl);
      setPhotoFile(null);
      return updatedProfile;
    } catch (error) {
      setPhotoError(error.message || 'No se pudo actualizar la foto de perfil.');
      throw error;
    } finally {
      setPhotoUploadPending(false);
    }
  };

  const handlePhotoSave = async (event) => {
    event.preventDefault();
    if (!photoFile) {
      setPhotoError('Selecciona una imagen antes de guardar.');
      return;
    }
    try {
      await uploadSelectedPhoto();
      setPhotoModalOpen(false);
      setSuccessMsg('Foto actualizada correctamente.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      // El error permanece visible dentro del modal.
    }
  };

  const updateMutation = useMutation({
    mutationFn: profileService.updateMyProfile,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['myProfile'], updatedProfile);
      queryClient.setQueryData(['my-profile'], updatedProfile);
      setSuccessMsg('Perfil actualizado correctamente.');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Error al actualizar el perfil.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  });

  const createProfileMutation = useMutation({
    mutationFn: async (values) => {
      if (!user?.uid) {
        throw new Error('Debes iniciar sesion para completar tu perfil.');
      }
      
      // Guardar en Firestore la información de perfil final
      const { getFirestore, doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { firebaseApp } = await import('../../services/firebaseClient.js');
      const db = getFirestore(firebaseApp);
      const userDocRef = doc(db, 'usuarios', user.uid);
      await setDoc(userDocRef, {
        email: user.email,
        rol: 'cliente',
        nombre: values.nombre,
        apellidos: values.apellidos || '',
        rut: normalizeRut(values.rut),
        telefono: normalizeChilePhone(values.telefono),
        fechaNacimiento: values.fechaNacimiento || '',
        genero: values.genero || '',
        estado: 'activo',
        fechaRegistro: serverTimestamp(),
      });

      await authService.registerClient({ uid: user.uid });
      const session = await firebaseAuthService.refreshSession();
      setSession({
        ...session,
        user: {
          ...(session?.user || user),
          rol: 'CLIENTE',
          role: 'cliente',
        },
        claims: {
          ...(session?.claims || {}),
          rol: 'CLIENTE',
          role: 'CLIENTE',
        },
      });
      const createdProfile = await profileService.createProfile({
        ...values,
        rut: normalizeRut(values.rut),
        emailContacto: values.emailContacto || user?.email,
        genero: values.genero || 'no_especifica',
        tipoPerfil: 'CLIENTE',
      });
      queryClient.setQueryData(['myProfile'], createdProfile);
      queryClient.setQueryData(['my-profile'], createdProfile);
      return createdProfile;
    },
    onSuccess: async (createdProfile) => {
      queryClient.setQueryData(['myProfile'], createdProfile);
      queryClient.setQueryData(['my-profile'], createdProfile);
      await queryClient.invalidateQueries({ queryKey: ['auth-session', user?.uid] });
      setSuccessMsg('Perfil creado correctamente.');
      try {
        window.localStorage.removeItem('style_beauty_pending_profile');
        window.sessionStorage.removeItem('style_beauty_pending_profile');
      } catch (storageErr) {
        console.warn('Failed to remove pending profile data from storage:', storageErr);
      }
    },
    onError: (err) => {
      setErrorMsg(profileFormErrorMessage(err));
    },
  });

  if (isAdminAccount) {
    return (
      <>
        <ProfileHero />
        <section className="page-section profile-completion-section">
          <Card className="client-auth-card profile-missing-role-card">
            <UserRound size={42} />
            <h2>Perfil administrativo</h2>
            <p>Esta cuenta administrativa no tiene perfil cliente asociado.</p>
            <small>Cuenta autenticada: {user?.email || 'sin correo disponible'}</small>
            <Button type="button" variant="ghost" onClick={logout}>Cerrar sesión</Button>
          </Card>
        </section>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <ProfileHero />
        <div style={{ minHeight: '40vh', display: 'grid', placeItems: 'center' }}>Cargando perfil...</div>
      </>
    );
  }

  if (isProfileNotFoundError(profileError)) {
    if (isStaffAccount) {
      return (
        <>
          <ProfileHero />
          <section className="page-section profile-completion-section">
            <Card className="client-auth-card profile-missing-role-card">
              <UserRound size={42} />
              <h2>Perfil profesional no disponible</h2>
              <p>Esta cuenta no tiene un perfil profesional asociado. Solicita al administrador revisar tu registro.</p>
              <small>Cuenta autenticada: {user?.email || 'sin correo disponible'}</small>
              <Button type="button" variant="ghost" onClick={logout}>Cerrar sesión</Button>
            </Card>
          </section>
        </>
      );
    }

    const isMissingIdentity = ['rut', 'nombre', 'apellidos', 'emailContacto', 'fechaNacimiento']
      .some((field) => !String(watchedValues?.[field] || '').trim());

    return (
      <>
        <ProfileHero missing />
        <section className="page-section profile-completion-section">
          <Card className="profile-completion-card">
            <div className="profile-completion-heading">
              <span className="card-kicker">Cuenta autenticada</span>
              <h2>Completa tu perfil cliente</h2>
              <p>Tu cuenta ya existe. Guardaremos estos datos para asociarla a reservas, contacto y beneficios.</p>
            </div>

            {isMissingIdentity && <div className="admin-alert">Faltan datos obligatorios por completar.</div>}
            {errorMsg && <div className="admin-alert">{errorMsg}</div>}

            {successMsg && <div className="success-alert">{successMsg}</div>}

            <form onSubmit={handleSubmit((values) => createProfileMutation.mutate(values))} className="profile-completion-form">
              <ProfileAvatar
                photoUrl={photoPreview}
                disabled
                hint="Podrás agregar una foto después de crear tu perfil cliente."
                initials={`${watchedValues?.nombre?.[0] || ''}${watchedValues?.apellidos?.[0] || ''}`.toUpperCase()}
              />
              
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-ink)' }}>
                  <UserRound size={18} color="var(--color-primary-strong)" /> Información Personal
                </h3>
                <div className="profile-form-grid">
                  <Input 
                    label="RUT" 
                    readOnly={hasPendingProfileData}
                    {...register('rut', { 
                      required: 'El RUT es obligatorio.',
                      validate: (value) => validateRut(value) || 'El RUT no es válido (ej: 12.345.678-9).',
                      onChange: (e) => {
                        setValue('rut', formatRut(e.target.value));
                      },
                      onBlur: (e) => {
                        setValue('rut', formatRut(e.target.value), { shouldValidate: true });
                      },
                    })} 
                    placeholder="12.345.678-9" 
                    required 
                    error={errors.rut?.message}
                  />
                  <Input
                    label="Nombre"
                    readOnly={hasPendingProfileData}
                    {...register('nombre', { required: 'El nombre es obligatorio.' })}
                    placeholder="Camila"
                    required
                    error={errors.nombre?.message}
                  />
                  <Input
                    label="Apellidos"
                    readOnly={hasPendingProfileData}
                    {...register('apellidos', { required: 'El apellido es obligatorio.' })}
                    placeholder="Gonzalez Perez"
                    required
                    error={errors.apellidos?.message}
                  />
                  <Input
                    label="Email de contacto"
                    readOnly={hasPendingProfileData}
                    {...register('emailContacto', {
                      required: 'El email es obligatorio.',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Formato esperado: correo@dominio.cl.' },
                    })}
                    type="email"
                    placeholder="correo@dominio.cl"
                    required
                    error={errors.emailContacto?.message}
                  />
                  <input type="hidden" {...register('fechaNacimiento', {
                    required: 'Selecciona tu fecha de nacimiento.',
                    validate: (value) => isMinimumAge(value) || `Debes tener al menos ${MIN_CLIENT_AGE} años.`,
                  })} />
                  <BirthDateSelects
                    value={birthDateValue}
                    onChange={(value) => setValue('fechaNacimiento', value, { shouldValidate: true, shouldDirty: true })}
                    error={errors.fechaNacimiento?.message}
                  />
                  <Input label="Genero" {...register('genero', { required: true })} as="select" required>
                    <option value="femenino">Femenino</option>
                    <option value="masculino">Masculino</option>
                    <option value="otro">Otro</option>
                    <option value="no_especifica">Prefiero no decirlo</option>
                  </Input>
                  <Input
                    label="Telefono"
                    readOnly={hasPendingProfileData}
                    {...register('telefono', {
                      validate: (value) => isValidChilePhone(value) || 'Formato esperado: +56 9 1234 5678.',
                      onChange: handlePhoneChange,
                    })}
                    placeholder="+56 9 1234 5678"
                    error={errors.telefono?.message}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-ink)' }}>
                  <Stethoscope size={18} color="var(--color-primary-strong)" /> Ficha Clínica (Opcional)
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '1.25rem' }}>
                  Esta información es confidencial y solo la utiliza nuestro personal profesional para adaptar tus tratamientos.
                </p>
                <div className="stack" style={{ gap: '1rem' }}>
                  <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Alergias</label>
                    <Input as="textarea" {...register('alergias')} placeholder="Indica si tienes alergias a productos o componentes..." style={{ minHeight: '80px' }} />
                  </div>
                  <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Medicamentos de consumo regular</label>
                    <Input as="textarea" {...register('medicamentos')} placeholder="Específica medicamentos que puedan interferir con químicos o tratamientos..." style={{ minHeight: '80px' }} />
                  </div>
                  <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Afecciones de la Piel o Cuero Cabelludo</label>
                    <Input as="textarea" {...register('afeccionesPiel')} placeholder="Ej: Rosácea, dermatitis, sensibilidad severa..." style={{ minHeight: '80px' }} />
                  </div>
                </div>
              </div>

              <div className="profile-completion-actions">
                <Button type="button" variant="ghost" onClick={logout}>Cerrar sesion</Button>
                <Button type="submit" disabled={createProfileMutation.isPending || photoUploadPending}>
                  {createProfileMutation.isPending ? 'Creando perfil...' : 'Crear mi perfil cliente'}
                </Button>
              </div>
            </form>
          </Card>
        </section>
      </>
    );
  }

  if (profileError) {
    return (
      <>
        <ProfileHero />
        <section className="page-section">
          <Card className="client-auth-card">
            <h2>No pudimos cargar tu perfil</h2>
            <p>Intenta nuevamente en unos minutos. Si el problema continúa, vuelve a iniciar sesión.</p>
            <Button onClick={logout}>Cerrar sesion</Button>
          </Card>
        </section>
      </>
    );
  }

  const onSubmit = async (data) => {
    try {
      await updateMutation.mutateAsync({
        telefono: normalizeChilePhone(data.telefono),
        alergias: data.alergias,
        medicamentos: data.medicamentos,
        afeccionesPiel: data.afeccionesPiel,
      });
    } catch {
      // Los mensajes de error se muestran desde la mutación o la subida de foto.
    }
  };
  const loyaltyPoints = Number(profile?.puntosFidelidad ?? 0);
  const existingProfileEmail = profileContactEmail;
  const missingIdentityFields = [
    !profile?.nombre && 'nombre',
    !profile?.apellidos && 'apellido',
    !profile?.rut && 'RUT',
    !existingProfileEmail && 'email',
    !profile?.fechaNacimiento && 'fecha de nacimiento',
  ].filter(Boolean);
  const hasMissingIdentity = missingIdentityFields.length > 0;

  return (
    <>
      <ProfileHero />
      <section className="page-section two-column profile-page-layout">
        <div className="stack">
          <SectionTitle eyebrow="Cliente" title="Tu Perfil">
            Gestiona tu información personal y ficha clínica para brindarte un servicio seguro y personalizado.
          </SectionTitle>

        {successMsg && (
          <div style={{ background: '#ecfdf5', color: '#065f46', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            {successMsg}
          </div>
        )}
        
        {errorMsg && (
          <div style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            {errorMsg}
          </div>
        )}

        {hasMissingIdentity && (
          <div className="admin-alert">
            Faltan datos obligatorios por completar. Los campos de identidad existentes quedan bloqueados; para completar datos faltantes se requiere soporte del backend para edicion de identidad.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="stack" style={{ gap: '2rem' }}>
          
          <Card>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--color-ink)' }}>
              <UserRound size={20} color="var(--color-primary-strong)" /> Información Personal
            </h3>
            <div className="profile-readonly-grid">
              <div className="field">
                <label>Nombre</label>
                <Input value={profile?.nombre || ''} readOnly aria-readonly="true" />
              </div>
              <div className="field">
                <label>Apellidos</label>
                <Input value={profile?.apellidos || ''} readOnly aria-readonly="true" />
              </div>
              <div className="field">
                <label>RUT</label>
                <Input value={profile?.rut ? formatRut(profile.rut) : ''} readOnly aria-readonly="true" />
              </div>
              <div className="field">
                <label>Email de contacto</label>
                <Input value={profile?.emailContacto || user?.email || ''} type="email" readOnly aria-readonly="true" />
              </div>
              <div className="field">
                <label>Teléfono</label>
                <Input
                  {...register('telefono', {
                    validate: (value) => isValidChilePhone(value) || 'Formato esperado: +56 9 1234 5678.',
                    onChange: handlePhoneChange,
                  })}
                  placeholder="+56 9 1234 5678"
                  error={errors.telefono?.message}
                />
              </div>
              <div className="field">
                <label>Fecha de nacimiento</label>
                <Input value={profile?.fechaNacimiento || ''} readOnly aria-readonly="true" />
              </div>
            </div>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: '1rem' }}>
              Los datos de identidad quedan bloqueados despues de crear el perfil. Si necesitas corregirlos, solicita el cambio al equipo administrativo.
            </p>
          </Card>

          <Card>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--color-ink)' }}>
              <Stethoscope size={20} color="var(--color-primary-strong)" /> Ficha Clínica (Restringida)
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', marginBottom: '1.5rem' }}>
              Esta información es confidencial y solo la utiliza nuestro personal profesional para adaptar tus tratamientos.
            </p>
            <div className="stack" style={{ gap: '1rem' }}>
              <div className="field">
                <label>Alergias (Opcional)</label>
                <Input as="textarea" {...register('alergias')} placeholder="Indica si tienes alergias a productos o componentes..." style={{ minHeight: '80px' }} />
              </div>
              <div className="field">
                <label>Medicamentos de consumo regular</label>
                <Input as="textarea" {...register('medicamentos')} placeholder="Específica medicamentos que puedan interferir con químicos o tratamientos..." style={{ minHeight: '80px' }} />
              </div>
              <div className="field">
                <label>Afecciones de la Piel o Cuero Cabelludo</label>
                <Input as="textarea" {...register('afeccionesPiel')} placeholder="Ej: Rosácea, dermatitis, sensibilidad severa..." style={{ minHeight: '80px' }} />
              </div>
            </div>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" disabled={updateMutation.isPending} style={{ padding: '0.8rem 2rem' }}>
              {updateMutation.isPending ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
            </Button>
          </div>
        </form>
        </div>

        <div className="profile-side-stack">
        <Card className="profile-card" style={{ textAlign: 'center', padding: '2rem' }}>
          <ProfileAvatar
            photoUrl={photoPreview}
            onChangePhoto={openPhotoModal}
            disabled={photoUploadPending}
            hint="La imagen se guarda en tu perfil."
            initials={`${profile?.nombre?.[0] || ''}${profile?.apellidos?.[0] || ''}`.toUpperCase()}
          />
          <h3 style={{ marginBottom: '0.5rem' }}>{profile?.nombre || user?.email}</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>{profileRoleLabel(user, profile)}</p>
          <Button variant="ghost" onClick={logout} style={{ width: '100%', color: '#b91c1c', borderColor: '#fca5a5' }}>
            Cerrar Sesión
          </Button>
        </Card>

        <Card style={{ padding: '1.5rem' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-ink)' }}>
            <Activity size={18} color="var(--color-primary-strong)" /> Puntos de Fidelidad
          </h4>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary-strong)' }}>
            {loyaltyPoints} <span style={{ fontSize: '1rem', color: 'var(--color-muted)', fontWeight: 500 }}>pts</span>
          </p>
        </Card>

        <UpcomingAppointmentsCard query={upcomingAppointmentsQuery} accessState={reservationsAccessState} />
        <PastAppointmentsCard query={historyAppointmentsQuery} accessState={reservationsAccessState} onEvaluate={handleEvaluate} />
        </div>
      </section>

      <ProfilePhotoModal
        open={photoModalOpen}
        currentPhoto={profile?.fotoUrl || ''}
        previewPhoto={photoPreview}
        file={photoFile}
        error={photoError}
        isSaving={photoUploadPending}
        initials={`${profile?.nombre?.[0] || ''}${profile?.apellidos?.[0] || ''}`.toUpperCase()}
        onFileChange={handlePhotoChange}
        onClose={closePhotoModal}
        onSave={handlePhotoSave}
      />
    </>
  );
}
