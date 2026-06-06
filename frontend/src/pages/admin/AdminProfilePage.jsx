import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, Save, ShieldCheck, UserRound } from 'lucide-react';
import { AdminErrorState, AdminPageHeader, AdminSkeleton } from '../../components/admin/AdminPrimitives.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { profileService } from '../../services/profileService.js';
import { useAuth } from '../../store/AuthContext.jsx';

function joinName(profile, user) {
  const profileName = [profile?.nombre, profile?.apellidos].filter(Boolean).join(' ');
  return profileName || user?.nombre || user?.displayName || user?.email || 'Usuario autenticado';
}

function getInitials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatDate(value) {
  if (!value) return 'No disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No disponible';
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
}

function getProfileEmail(profile, user) {
  return profile?.emailContacto || profile?.correo || profile?.email || user?.email || 'No disponible';
}

function getProfileRole(profile, user) {
  return profile?.rol || profile?.tipoPerfil || user?.rol || user?.role || 'No disponible';
}

function ReadOnlyItem({ label, value }) {
  return (
    <div className="admin-readonly-item">
      <span>{label}</span>
      <strong>{value || 'No disponible'}</strong>
    </div>
  );
}

export function AdminProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const profileQuery = useQuery({
    queryKey: ['my-profile'],
    queryFn: profileService.getMyProfile,
    enabled: Boolean(user),
    retry: false,
  });

  const profile = profileQuery.data || {};
  const displayName = joinName(profile, user);
  const initials = getInitials(displayName) || 'AD';
  const email = getProfileEmail(profile, user);
  const role = getProfileRole(profile, user);
  const createdAt = profile.fechaCreacion || profile.createdAt || profile.fechaRegistro || profile.created_at;
  const canEditProfile = Boolean(profileQuery.data) && !profileQuery.isError;

  const defaultValues = useMemo(() => ({
    nombre: profile.nombre || '',
    apellidos: profile.apellidos || '',
    telefono: profile.telefono || '',
  }), [profile.apellidos, profile.nombre, profile.telefono]);

  const { register, handleSubmit, reset } = useForm({ defaultValues });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const updateMutation = useMutation({
    mutationFn: (values) => profileService.updateMyProfile({
      nombre: values.nombre?.trim() || '',
      apellidos: values.apellidos?.trim() || '',
      telefono: values.telefono?.trim() || '',
    }),
    onSuccess: (updatedProfile) => {
      const mergedProfile = { ...profile, ...updatedProfile };
      queryClient.setQueryData(['my-profile'], mergedProfile);
      queryClient.setQueryData(['auth-session', user?.uid], mergedProfile);
      setErrorMsg('');
      setSuccessMsg('Perfil actualizado correctamente.');
    },
    onError: (err) => {
      setSuccessMsg('');
      setErrorMsg(err?.message || 'Error al actualizar perfil.');
    },
  });

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  const onSubmit = (values) => {
    setSuccessMsg('');
    setErrorMsg('');
    updateMutation.mutate(values);
  };

  if (profileQuery.isLoading) {
    return (
      <div className="admin-profile-page">
        <AdminPageHeader
          eyebrow="Cuenta"
          title="Perfil y configuracion"
          description="Cargando los datos de la cuenta autenticada."
        />
        <AdminSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="admin-profile-page">
      <AdminPageHeader
        eyebrow="Cuenta"
        title="Perfil y configuracion"
        description="Datos personales de la cuenta autenticada y acciones seguras de sesion."
        actions={(
          <button type="button" className="admin-secondary-action admin-profile-logout" onClick={handleLogout}>
            <LogOut size={17} />
            Cerrar sesion
          </button>
        )}
      />

      {profileQuery.isError && (
        <AdminErrorState
          title="No fue posible cargar el perfil"
          message={profileQuery.error?.message || 'Intenta nuevamente cuando el backend este disponible.'}
          actions={<button type="button" className="admin-primary-action" onClick={() => profileQuery.refetch()}>Reintentar</button>}
        />
      )}

      {successMsg && <div className="admin-success-alert" role="status">{successMsg}</div>}
      {errorMsg && <AdminErrorState title="No se pudo guardar" message={errorMsg} />}

      <div className="admin-profile-grid">
        <aside className="admin-profile-card admin-profile-summary">
          <div className="admin-profile-avatar-large" aria-hidden="true">
            {initials}
          </div>
          <div>
            <h3>{displayName}</h3>
            <p>{email}</p>
          </div>
          <span className="admin-profile-role">
            <ShieldCheck size={15} />
            {role}
          </span>
          <div className="admin-readonly-grid compact">
            <ReadOnlyItem label="Correo" value={email} />
            <ReadOnlyItem label="Rol" value={role} />
            <ReadOnlyItem label="Telefono" value={profile.telefono} />
            <ReadOnlyItem label="Creacion" value={formatDate(createdAt)} />
          </div>
          <Button type="button" variant="ghost" className="admin-profile-logout-button" onClick={handleLogout}>
            <LogOut size={17} />
            Cerrar sesion
          </Button>
        </aside>

        <section className="admin-profile-card">
          <header className="admin-profile-card-header">
            <div>
              <span>Datos editables</span>
              <h3>Informacion personal</h3>
              <p>Solo se editan campos seguros soportados por el backend actual.</p>
            </div>
            <UserRound size={24} />
          </header>

          <form className="admin-profile-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="admin-profile-field-grid">
              <Input
                id="admin-profile-nombre"
                label="Nombre"
                placeholder="Nombre"
                disabled={!canEditProfile || updateMutation.isPending}
                {...register('nombre')}
              />
              <Input
                id="admin-profile-apellidos"
                label="Apellido"
                placeholder="Apellido"
                disabled={!canEditProfile || updateMutation.isPending}
                {...register('apellidos')}
              />
              <Input
                id="admin-profile-telefono"
                label="Telefono"
                placeholder="+56 9 1234 5678"
                disabled={!canEditProfile || updateMutation.isPending}
                {...register('telefono')}
              />
            </div>

            <div className="admin-readonly-grid">
              <ReadOnlyItem label="Correo autenticado" value={email} />
              <ReadOnlyItem label="Rol de acceso" value={role} />
            </div>

            <div className="admin-profile-actions">
              {!canEditProfile && (
                <span>No se puede editar hasta recuperar el perfil desde el backend.</span>
              )}
              <Button type="submit" disabled={!canEditProfile || updateMutation.isPending}>
                <Save size={18} />
                {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
