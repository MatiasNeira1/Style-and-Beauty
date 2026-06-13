import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { UserRound, Save, Activity, Stethoscope } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { useAuth } from '../../store/AuthContext.jsx';
import { authService } from '../../services/authService.js';
import { firebaseAuthService } from '../../services/firebaseAuthService.js';
import { profileService } from '../../services/profileService.js';
import { isProfileNotFoundError } from '../../services/apiClient.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
  const selected = parseIsoDate(value);
  const years = Array.from({ length: 101 }, (_, index) => String(Number(max.year) - index));
  const maxMonthForYear = selected.year === max.year ? Number(max.month) : 12;
  const availableMonths = monthOptions.filter(([month]) => Number(month) <= maxMonthForYear);
  const maxDayForMonth = selected.year === max.year && selected.month === max.month
    ? Number(max.day)
    : daysInMonth(selected.year, selected.month);
  const availableDays = Array.from({ length: maxDayForMonth }, (_, index) => String(index + 1).padStart(2, '0'));

  const update = (part, nextValue) => {
    const next = {
      year: part === 'year' ? nextValue : selected.year,
      month: part === 'month' ? nextValue : selected.month,
      day: part === 'day' ? nextValue : selected.day,
    };

    if (part === 'year') {
      next.month = '';
      next.day = '';
    }
    if (part === 'month') {
      next.day = '';
    }

    if (!next.year || !next.month || !next.day) {
      onChange('');
      return;
    }

    const isoDate = `${next.year}-${next.month}-${next.day}`;
    onChange(isoDate <= maxDate ? isoDate : '');
  };

  return (
    <div className="profile-birthdate-field">
      <span>Fecha de nacimiento</span>
      <div className="profile-birthdate-grid">
        <select aria-label="Año de nacimiento" value={selected.year || ''} onChange={(event) => update('year', event.target.value)} required>
          <option value="">Año</option>
          {years.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
        <select aria-label="Mes de nacimiento" value={selected.month || ''} onChange={(event) => update('month', event.target.value)} disabled={!selected.year} required>
          <option value="">Mes</option>
          {availableMonths.map(([month, label]) => <option key={month} value={month}>{label}</option>)}
        </select>
        <select aria-label="Día de nacimiento" value={selected.day || ''} onChange={(event) => update('day', event.target.value)} disabled={!selected.year || !selected.month} required>
          <option value="">Día</option>
          {availableDays.map((day) => <option key={day} value={day}>{day}</option>)}
        </select>
      </div>
      <small>{error || `Edad mínima: ${MIN_CLIENT_AGE} años.`}</small>
    </div>
  );
}

function profileRoleLabel(user, profile) {
  const role = String(user?.rol || user?.role || profile?.tipoPerfil || '').toUpperCase();
  if (role === 'ADMIN') return 'Administrador';
  if (role === 'STAFF') return 'Staff';
  return 'Cliente Registrado';
}

export function ProfilePage() {
  const { user, logout, setSession } = useAuth();
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch real profile data from backend
  const { data: profile, isLoading, error: profileError } = useQuery({
    queryKey: ['myProfile'],
    queryFn: profileService.getMyProfile,
    enabled: !!user,
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

  const updateMutation = useMutation({
    mutationFn: profileService.updateMyProfile,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['myProfile'], updatedProfile);
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

            {errorMsg && <div className="admin-alert">{errorMsg}</div>}

            {successMsg && <div className="success-alert">{successMsg}</div>}

            <form onSubmit={handleSubmit((values) => createProfileMutation.mutate(values))} className="profile-completion-form">
              <div className="profile-form-grid">
                <Input label="RUT" {...register('rut', { required: true })} placeholder="12.345.678-9" required />
                <Input label="Nombre" {...register('nombre', { required: true })} placeholder="Tu nombre" required />
                <Input label="Apellidos" {...register('apellidos')} placeholder="Tus apellidos" />
                <Input label="Email de contacto" {...register('emailContacto', { required: true })} type="email" placeholder="tuemail@correo.com" required />
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
                <Input label="Telefono" {...register('telefono')} placeholder="+56 9 1234 5678" />
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

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

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

        <form onSubmit={handleSubmit(onSubmit)} className="stack" style={{ gap: '2rem' }}>
          
          <Card>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--color-ink)' }}>
              <UserRound size={20} color="var(--color-primary-strong)" /> Información Personal
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="field">
                <label>Nombre</label>
                <Input {...register('nombre')} placeholder="Tu nombre" />
              </div>
              <div className="field">
                <label>Apellidos</label>
                <Input {...register('apellidos')} placeholder="Tus apellidos" />
              </div>
              <div className="field">
                <label>Teléfono</label>
                <Input {...register('telefono')} placeholder="+56 9 5861 2677" />
              </div>
              <div className="field">
                <label>Email de Contacto</label>
                <Input {...register('emailContacto')} type="email" placeholder="ejemplo@correo.com" />
              </div>
            </div>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Card className="profile-card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(212, 122, 158, 0.1)', color: 'var(--color-primary-strong)', display: 'grid', placeItems: 'center', margin: '0 auto 1.5rem' }}>
            <UserRound size={40} />
          </div>
          <h3 style={{ marginBottom: '0.5rem' }}>{profile?.nombre || user?.email}</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>{profileRoleLabel(user, profile)}</p>
          <Button variant="ghost" onClick={logout} style={{ width: '100%', color: '#b91c1c', borderColor: '#fca5a5' }}>
            Cerrar Sesión
          </Button>
        </Card>

        {profile?.puntosFidelidad !== undefined && (
          <Card style={{ padding: '1.5rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-ink)' }}>
              <Activity size={18} color="var(--color-primary-strong)" /> Puntos de Fidelidad
            </h4>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary-strong)' }}>
              {profile.puntosFidelidad} <span style={{ fontSize: '1rem', color: 'var(--color-muted)', fontWeight: 500 }}>pts</span>
            </p>
          </Card>
        )}
        </div>
      </section>
    </>
  );
}
