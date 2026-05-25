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

export function ProfilePage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch real profile data from backend
  const { data: profile, isLoading } = useQuery({
    queryKey: ['myProfile'],
    queryFn: profileService.getMyProfile,
    enabled: !!user,
  });

  const { register, handleSubmit, reset } = useForm();

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

  if (isLoading) {
    return <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>Cargando perfil...</div>;
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
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>{user?.role === 'cliente' ? 'Cliente Registrado' : 'Administrador'}</p>
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
