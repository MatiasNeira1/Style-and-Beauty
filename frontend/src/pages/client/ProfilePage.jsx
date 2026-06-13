import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { UserRound, Save, Activity, Stethoscope } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { useAuth } from '../../store/AuthContext.jsx';
import { profileService } from '../../services/profileService.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

function profileRoleLabel(user, profile) {
  const role = String(user?.rol || user?.role || profile?.tipoPerfil || '').toUpperCase();
  if (role === 'ADMIN') return 'Administrador';
  if (role === 'STAFF') return 'Staff';
  return 'Cliente Registrado';
}

export function ProfilePage() {
  const { user, logout } = useAuth();
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

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      emailContacto: user?.email || '',
      genero: 'no_especifica',
    },
  });

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
    mutationFn: (values) => profileService.createProfile({
      ...values,
      emailContacto: values.emailContacto || user?.email,
      tipoPerfil: 'CLIENTE',
    }),
    onSuccess: async (createdProfile) => {
      queryClient.setQueryData(['myProfile'], createdProfile);
      queryClient.setQueryData(['my-profile'], createdProfile);
      await queryClient.invalidateQueries({ queryKey: ['auth-session', user?.uid] });
      setSuccessMsg('Perfil creado correctamente.');
    },
    onError: (err) => {
      setErrorMsg(err.message || 'No fue posible crear tu perfil.');
    },
  });

  if (isLoading) {
    return <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>Cargando perfil...</div>;
  }

  if (profileError?.status === 404) {
    return (
      <section className="page-section">
        <Card className="client-auth-card" style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h2>Tu cuenta no tiene perfil asociado</h2>
          <p>La sesion esta activa. Completa estos datos una sola vez para asociar tu usuario Firebase con tu perfil cliente.</p>

          {errorMsg && (
            <div style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ background: '#ecfdf5', color: '#065f46', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit((values) => createProfileMutation.mutate(values))} className="stack" style={{ gap: '1.25rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="field">
                <label>RUT</label>
                <Input {...register('rut', { required: true })} placeholder="12.345.678-9" required />
              </div>
              <div className="field">
                <label>Nombre</label>
                <Input {...register('nombre', { required: true })} placeholder="Tu nombre" required />
              </div>
              <div className="field">
                <label>Apellidos</label>
                <Input {...register('apellidos')} placeholder="Tus apellidos" />
              </div>
              <div className="field">
                <label>Email de contacto</label>
                <Input {...register('emailContacto', { required: true })} type="email" placeholder="tuemail@correo.com" required />
              </div>
              <div className="field">
                <label>Fecha de nacimiento</label>
                <Input {...register('fechaNacimiento', { required: true })} type="date" required />
              </div>
              <div className="field">
                <label>Genero</label>
                <Input {...register('genero', { required: true })} as="select" required>
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                  <option value="otro">Otro</option>
                  <option value="no_especifica">Prefiero no decirlo</option>
                </Input>
              </div>
              <div className="field">
                <label>Telefono</label>
                <Input {...register('telefono')} placeholder="+56 9 1234 5678" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button type="button" variant="ghost" onClick={logout}>Cerrar sesion</Button>
              <Button type="submit" disabled={createProfileMutation.isPending}>
                {createProfileMutation.isPending ? 'Creando perfil...' : 'Crear mi perfil cliente'}
              </Button>
            </div>
          </form>
        </Card>
      </section>
    );
  }

  if (profileError) {
    return (
      <section className="page-section">
        <Card className="client-auth-card">
          <h2>No pudimos cargar tu perfil</h2>
          <p>{profileError.message || 'Intenta nuevamente en unos minutos.'}</p>
          <Button onClick={logout}>Cerrar sesion</Button>
        </Card>
      </section>
    );
  }

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  return (
    <section className="page-section two-column" style={{ padding: '6rem var(--page-x)' }}>
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
  );
}
