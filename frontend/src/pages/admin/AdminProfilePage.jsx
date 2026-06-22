import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, LogOut, Save, ShieldCheck, UserRound } from 'lucide-react';
import { AdminErrorState, AdminPageHeader, AdminSkeleton } from '../../components/admin/AdminPrimitives.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { isProfileNotFoundError } from '../../services/apiClient.js';
import { profileService } from '../../services/profileService.js';
import { useAuth } from '../../store/AuthContext.jsx';
import { formatRut, normalizeRut, validateRut } from '../../utils/rutUtils.js';

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

function validatePhone(value) {
  if (!value) return true;
  return /^\+?[0-9\s-]{8,18}$/.test(value.trim());
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
  const [photoPreview, setPhotoPreview] = useState('');

  const profileQuery = useQuery({
    queryKey: ['my-profile'],
    queryFn: profileService.getMyProfile,
    enabled: Boolean(user),
    retry: false,
  });

  const profile = profileQuery.data || {};
  const profileNotFound = profileQuery.isError && isProfileNotFoundError(profileQuery.error);
  const displayName = joinName(profile, user);
  const initials = getInitials(displayName) || 'AD';
  const email = getProfileEmail(profile, user);
  const hasRealEmail = Boolean(email && email !== 'No disponible');
  const role = getProfileRole(profile, user);
  const createdAt = profile.fechaCreacion || profile.createdAt || profile.fechaRegistro || profile.created_at;
  const canEditProfile = Boolean(profileQuery.data) && !profileQuery.isError;
  const missingIdentityFields = canEditProfile
    ? [
        !profile.nombre && 'nombre',
        !profile.apellidos && 'apellido',
        !profile.rut && 'RUT',
        !hasRealEmail && 'email',
      ].filter(Boolean)
    : [];
  const hasMissingIdentity = missingIdentityFields.length > 0;

  const defaultValues = useMemo(() => ({
    nombre: profile.nombre || '',
    apellidos: profile.apellidos || '',
    rut: profile.rut ? formatRut(profile.rut) : '',
    emailContacto: email === 'No disponible' ? '' : email,
    telefono: profile.telefono || '',
  }), [email, profile.apellidos, profile.nombre, profile.rut, profile.telefono]);

  const { register, handleSubmit, reset, setValue } = useForm({ defaultValues });

  useEffect(() => {
    setPhotoPreview(profile?.fotoUrl || '');
  }, [profile?.fotoUrl]);

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const updateMutation = useMutation({
    mutationFn: async (values) => {
      if (!validatePhone(values.telefono)) {
        throw new Error('Ingresa un telefono valido, por ejemplo +56 9 1234 5678.');
      }

      if (hasMissingIdentity) {
        if (!values.nombre?.trim() || !values.apellidos?.trim() || !values.rut?.trim()) {
          throw new Error('Faltan datos obligatorios por completar.');
        }
        if (!validateRut(values.rut)) {
          throw new Error('Ingresa un RUT válido.');
        }
        const idAuth = profile.idAuth || user?.uid;
        if (!idAuth) {
          throw new Error('El backend no entrego idAuth para completar identidad.');
        }
        return profileService.updateProfileByAuthId(idAuth, {
          nombre: values.nombre.trim(),
          apellidos: values.apellidos.trim(),
          rut: normalizeRut(values.rut),
          emailContacto: values.emailContacto || user?.email,
          telefono: values.telefono?.trim() || '',
        });
      }

      return profileService.updateMyProfile({
        telefono: values.telefono?.trim() || '',
      });
    },
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

  const photoMutation = useMutation({
    mutationFn: async (file) => {
      if (!canEditProfile) {
        throw new Error('La foto solo puede guardarse cuando el perfil existe en el backend.');
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('Solo se permiten imagenes JPG, PNG o WEBP.');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no puede superar 5 MB.');
      }
      return profileService.uploadMyPhoto(file);
    },
    onSuccess: (updatedProfile) => {
      const mergedProfile = { ...profile, ...updatedProfile };
      queryClient.setQueryData(['my-profile'], mergedProfile);
      queryClient.setQueryData(['auth-session', user?.uid], mergedProfile);
      setPhotoPreview(updatedProfile?.fotoUrl || '');
      setErrorMsg('');
      setSuccessMsg('Perfil actualizado correctamente');
    },
    onError: (err) => {
      setSuccessMsg('');
      setErrorMsg(err?.message || 'La imagen no pudo guardarse. Sube una imagen válida.');
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

      {profileNotFound && (
        <div className="admin-success-alert" role="status">
          Esta cuenta administrativa no tiene un perfil cliente asociado. Puedes operar con los datos de autenticacion; la edicion se habilitara cuando exista un perfil compatible.
        </div>
      )}

      {hasMissingIdentity && (
        <div className="admin-alert" role="alert">
          Faltan datos obligatorios por completar.
        </div>
      )}

      {profileQuery.isError && !profileNotFound && (
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
          <label className="admin-profile-avatar-large admin-profile-avatar-upload" title="Cambiar foto de perfil">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={!canEditProfile || photoMutation.isPending}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) photoMutation.mutate(file);
              }}
            />
            {photoPreview ? <img src={photoPreview} alt="Foto de perfil" /> : initials}
            <span><Camera size={14} /> Cambiar</span>
          </label>
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
                placeholder="Camila"
                disabled={!canEditProfile || updateMutation.isPending || Boolean(profile.nombre)}
                {...register('nombre')}
              />
              <Input
                id="admin-profile-apellidos"
                label="Apellidos"
                placeholder="Gonzalez Perez"
                disabled={!canEditProfile || updateMutation.isPending || Boolean(profile.apellidos)}
                {...register('apellidos')}
              />
              <Input
                id="admin-profile-rut"
                label="RUT"
                placeholder="12.345.678-9"
                disabled={!canEditProfile || updateMutation.isPending || Boolean(profile.rut)}
                {...register('rut', {
                  onChange: (event) => setValue('rut', formatRut(event.target.value)),
                  onBlur: (event) => setValue('rut', formatRut(event.target.value), { shouldValidate: true }),
                })}
              />
              <Input
                id="admin-profile-email"
                label="Email"
                placeholder="correo@dominio.cl"
                type="email"
                disabled
                {...register('emailContacto')}
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
