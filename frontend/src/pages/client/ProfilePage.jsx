import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CalendarClock, UserRound, Save, Activity, Stethoscope } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { useAuth } from '../../store/AuthContext.jsx';
import { authService } from '../../services/authService.js';
import { firebaseAuthService } from '../../services/firebaseAuthService.js';
import { profileService } from '../../services/profileService.js';
import { reservationService } from '../../services/reservationService.js';
import { isProfileNotFoundError } from '../../services/apiClient.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RESERVATION_DEPOSIT_CLP, formatCLP } from '../../utils/priceUtils.js';

const MIN_CLIENT_AGE = 15;

function validateRut(rut) {
  if (!rut || typeof rut !== 'string') return false;
  // Limpiar puntos, guiones y espacios
  const cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleanRut.length < 2) return false;
  
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDv = 11 - (sum % 11);
  let calculatedDv = '';
  if (expectedDv === 11) {
    calculatedDv = '0';
  } else if (expectedDv === 10) {
    calculatedDv = 'K';
  } else {
    calculatedDv = String(expectedDv);
  }
  
  return calculatedDv === dv;
}

function formatRut(value) {
  if (!value) return '';
  let clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length === 0) return '';
  clean = clean.slice(0, 9);
  
  if (clean.length <= 1) {
    return clean;
  }
  
  const dv = clean.slice(-1);
  const body = clean.slice(0, -1);
  
  let formattedBody = '';
  if (body.length <= 3) {
    formattedBody = body;
  } else if (body.length <= 6) {
    formattedBody = body.slice(0, body.length - 3) + '.' + body.slice(body.length - 3);
  } else {
    formattedBody = body.slice(0, body.length - 6) + '.' + body.slice(body.length - 6, body.length - 3) + '.' + body.slice(body.length - 3);
  }
  
  return formattedBody + '-' + dv;
}

function validatePhone(value) {
  if (!value) return true;
  return /^\+?[0-9\s-]{8,18}$/.test(value.trim());
}

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

function compressImage(file, maxWidth = 80, maxHeight = 80, quality = 0.5) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const minSize = Math.min(width, height);
        canvas.width = maxWidth;
        canvas.height = maxHeight;
        const ctx = canvas.getContext('2d');
        
        const sx = (width - minSize) / 2;
        const sy = (height - minSize) / 2;
        
        ctx.drawImage(img, sx, sy, minSize, minSize, 0, 0, maxWidth, maxHeight);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

function ProfilePictureUpload({ photoUrl, onPhotoChange }) {
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        onPhotoChange(compressed);
      } catch (err) {
        console.error('Error compressing image:', err);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
      <label style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', display: 'block', border: '2px solid var(--color-primary-light)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'all 0.2s ease-in-out', margin: '0 auto' }}>
        <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        {photoUrl ? (
          <img src={photoUrl} alt="Foto de perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'rgba(212, 122, 158, 0.08)', color: 'var(--color-primary-strong)', display: 'grid', placeItems: 'center' }}>
            <UserRound size={40} />
          </div>
        )}
        <div 
          style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'rgba(0, 0, 0, 0.4)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#fff', 
            opacity: 0, 
            transition: 'opacity 0.2s ease' 
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
        >
          <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Cambiar</span>
        </div>
      </label>
      <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Haz clic para cambiar foto</span>
    </div>
  );
}

function profileRoleLabel(user, profile) {
  const role = String(user?.rol || user?.role || profile?.tipoPerfil || '').toUpperCase();
  if (role === 'ADMIN') return 'Administrador';
  if (role === 'STAFF') return 'Staff';
  return 'Cliente Registrado';
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

function UpcomingAppointmentsCard({ query }) {
  const appointments = Array.isArray(query.data) ? query.data : [];

  return (
    <Card className="upcoming-appointments-card">
      <h4>
        <CalendarClock size={18} color="var(--color-primary-strong)" />
        Próximas horas agendadas
      </h4>

      {query.isLoading && <p className="profile-empty-state">Cargando próximas horas...</p>}
      {query.isError && <p className="admin-alert">No pudimos cargar tus próximas horas agendadas.</p>}
      {!query.isLoading && !query.isError && appointments.length === 0 && (
        <p className="profile-empty-state">No tienes próximas horas agendadas.</p>
      )}

      {!query.isLoading && !query.isError && appointments.length > 0 && (
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

function StarRating({ value, onChange, disabled }) {
  return (
    <div style={{ display: 'flex', gap: '0.2rem' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange?.(star)}
          style={{
            background: 'none',
            border: 'none',
            cursor: disabled ? 'default' : 'pointer',
            padding: '2px',
            color: star <= value ? '#e2b47e' : '#d1d5db',
            transition: 'color 0.15s',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={star <= value ? '#e2b47e' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function PastAppointmentsCard() {
  const queryClient = useQueryClient();
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});

  const { data: finalized = [], isLoading, isError } = useQuery({
    queryKey: ['my-finalized-appointments'],
    queryFn: reservationService.listFinalized,
    staleTime: 30_000,
  });

  const evaluateMutation = useMutation({
    mutationFn: ({ id, calificacion, comentario }) =>
      reservationService.evaluateReservation(id, { calificacion, comentario }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-finalized-appointments'] });
    },
  });

  const pendingRating = finalized.filter((a) => a.calificacion == null);
  const alreadyRated = finalized.filter((a) => a.calificacion != null);

  if (isLoading) return null;
  if (isError) return null;
  if (finalized.length === 0) return null;

  return (
    <Card style={{ padding: '1.5rem' }}>
      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-ink)' }}>
        <Stethoscope size={18} color="var(--color-primary-strong)" /> Evalúa a tu profesional
      </h4>

      {pendingRating.length === 0 && (
        <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}>
          Ya evaluaste todas tus citas finalizadas. ¡Gracias!
        </p>
      )}

      {pendingRating.map((appointment) => {
        const currentRating = ratings[appointment.idCita] || 0;
        const currentComment = comments[appointment.idCita] || '';
        const isPending = evaluateMutation.isPending && evaluateMutation.variables?.id === appointment.idCita;

        return (
          <div
            key={appointment.idCita}
            style={{
              padding: '0.8rem',
              marginBottom: '0.6rem',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.02)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <strong style={{ fontSize: '0.85rem' }}>{appointment.nombreServicio || 'Servicio'}</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', margin: '0.2rem 0 0.5rem' }}>
              {appointment.nombreCliente ? `Profesional: ${appointment.nombreCliente}` : ''}
              {appointment.fechaHoraInicio ? ` — ${formatAppointmentDate(appointment.fechaHoraInicio)}` : ''}
            </p>

            <StarRating
              value={currentRating}
              onChange={(val) => setRatings((prev) => ({ ...prev, [appointment.idCita]: val }))}
              disabled={isPending}
            />

            <textarea
              placeholder="Comentario (opcional)"
              value={currentComment}
              onChange={(e) => setComments((prev) => ({ ...prev, [appointment.idCita]: e.target.value }))}
              disabled={isPending}
              style={{
                width: '100%',
                marginTop: '0.5rem',
                padding: '0.4rem',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '6px',
                fontSize: '0.85rem',
                resize: 'vertical',
                minHeight: '40px',
              }}
            />

            <Button
              type="button"
              disabled={currentRating === 0 || isPending}
              onClick={() =>
                evaluateMutation.mutate({
                  id: appointment.idCita,
                  calificacion: currentRating,
                  comentario: currentComment || null,
                })
              }
              style={{ marginTop: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            >
              {isPending ? 'Enviando...' : 'Enviar valoración'}
            </Button>
          </div>
        );
      })}

      {alreadyRated.length > 0 && (
        <details style={{ marginTop: '0.8rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-primary-strong)' }}>
            Ver mis valoraciones anteriores ({alreadyRated.length})
          </summary>
          {alreadyRated.map((a) => (
            <div key={a.idCita} style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '0.85rem' }}>
              <strong>{a.nombreServicio}</strong>
              <span style={{ marginLeft: '0.5rem', color: '#e2b47e' }}>{'★'.repeat(a.calificacion)}{'☆'.repeat(5 - a.calificacion)}</span>
              {a.comentarioCalificacion && <p style={{ margin: '0.2rem 0 0', color: 'var(--color-muted)' }}>{a.comentarioCalificacion}</p>}
            </div>
          ))}
        </details>
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

  useEffect(() => {
    if (user?.photoURL) {
      setPhotoPreview(user.photoURL);
    }
  }, [user]);

  // Fetch real profile data from backend
  const { data: profile, isLoading, error: profileError } = useQuery({
    queryKey: ['myProfile'],
    queryFn: profileService.getMyProfile,
    enabled: !!user,
    retry: false,
  });

  const upcomingAppointmentsQuery = useQuery({
    queryKey: ['my-upcoming-reservations', profile?.idPersona],
    queryFn: reservationService.listMyUpcomingReservations,
    enabled: Boolean(profile?.idPersona && !profileError),
    retry: false,
  });

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
    if (isProfileNotFoundError(profileError)) {
      try {
        const stored = window.localStorage.getItem('style_beauty_pending_profile')
          || window.sessionStorage.getItem('style_beauty_pending_profile');
        if (stored) {
          const pending = JSON.parse(stored);
          reset({
            rut: pending.rut || '',
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
  }, [profileError, reset, user]);

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
      if (photoPreview && photoPreview !== user?.photoURL) {
        try {
          const sessionWithPhoto = await firebaseAuthService.updatePhoto(photoPreview);
          setSession(sessionWithPhoto);
        } catch (photoErr) {
          console.warn('Failed to upload profile photo to Firebase Auth:', photoErr);
        }
      }
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
      return profileService.createProfile({
        ...values,
        emailContacto: values.emailContacto || user?.email,
        genero: values.genero || 'no_especifica',
        tipoPerfil: 'CLIENTE',
      });
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

  if (isLoading) {
    return (
      <>
        <ProfileHero />
        <div style={{ minHeight: '40vh', display: 'grid', placeItems: 'center' }}>Cargando perfil...</div>
      </>
    );
  }

  if (isProfileNotFoundError(profileError)) {
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
              <ProfilePictureUpload photoUrl={photoPreview} onPhotoChange={setPhotoPreview} />
              
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-ink)' }}>
                  <UserRound size={18} color="var(--color-primary-strong)" /> Información Personal
                </h3>
                <div className="profile-form-grid">
                  <Input 
                    label="RUT" 
                    {...register('rut', { 
                      required: 'El RUT es obligatorio.',
                      validate: (value) => validateRut(value) || 'El RUT no es válido (ej: 12.345.678-9).',
                      onChange: (e) => {
                        setValue('rut', formatRut(e.target.value));
                      }
                    })} 
                    placeholder="12.345.678-9" 
                    required 
                    error={errors.rut?.message}
                  />
                  <Input
                    label="Nombre"
                    {...register('nombre', { required: 'El nombre es obligatorio.' })}
                    placeholder="Camila"
                    required
                    error={errors.nombre?.message}
                  />
                  <Input
                    label="Apellidos"
                    {...register('apellidos', { required: 'El apellido es obligatorio.' })}
                    placeholder="Gonzalez Perez"
                    required
                    error={errors.apellidos?.message}
                  />
                  <Input
                    label="Email de contacto"
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
                    {...register('telefono', {
                      validate: (value) => validatePhone(value) || 'Formato esperado: +56 9 1234 5678.',
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
                <Button type="submit" disabled={createProfileMutation.isPending}>
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
    if (photoPreview && photoPreview !== user?.photoURL) {
      try {
        const sessionWithPhoto = await firebaseAuthService.updatePhoto(photoPreview);
        setSession(sessionWithPhoto);
      } catch (photoErr) {
        console.warn('Failed to upload profile photo to Firebase Auth:', photoErr);
      }
    }
    updateMutation.mutate({
      telefono: data.telefono,
      alergias: data.alergias,
      medicamentos: data.medicamentos,
      afeccionesPiel: data.afeccionesPiel,
    });
  };
  const loyaltyPoints = Number(profile?.puntosFidelidad ?? 0);
  const existingProfileEmail = profile?.emailContacto || user?.email || '';
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
                <Input value={profile?.rut || ''} readOnly aria-readonly="true" />
              </div>
              <div className="field">
                <label>Email de contacto</label>
                <Input value={profile?.emailContacto || user?.email || ''} type="email" readOnly aria-readonly="true" />
              </div>
              <div className="field">
                <label>Teléfono</label>
                <Input
                  {...register('telefono', {
                    validate: (value) => validatePhone(value) || 'Formato esperado: +56 9 1234 5678.',
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
          <ProfilePictureUpload photoUrl={photoPreview} onPhotoChange={setPhotoPreview} />
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

        <UpcomingAppointmentsCard query={upcomingAppointmentsQuery} />
        <PastAppointmentsCard />
        </div>
      </section>
    </>
  );
}
