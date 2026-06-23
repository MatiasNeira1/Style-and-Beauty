import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, KeyRound, LogOut, Save, ShieldCheck, UserRound } from 'lucide-react';
import { AdminErrorState, AdminPageHeader, AdminSkeleton } from '../../components/admin/AdminPrimitives.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { isProfileNotFoundError } from '../../services/apiClient.js';
import { firebaseAuthService } from '../../services/firebaseAuthService.js';
import { profileService } from '../../services/profileService.js';
import { useAuth } from '../../store/AuthContext.jsx';
import { isValidChilePhone, normalizeChilePhone } from '../../utils/phoneUtils.js';
import { formatRut, normalizeRut, validateRut } from '../../utils/rutUtils.js';

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PASSWORD_MIN_LENGTH = 6;
const passwordInitialState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

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

function validateProfileImage(file) {
  if (!file) return 'Selecciona una imagen antes de continuar.';
  if (!ALLOWED_PROFILE_IMAGE_TYPES.includes(file.type)) return 'Solo se permiten imagenes JPG, JPEG, PNG o WEBP.';
  if (file.size > MAX_PROFILE_IMAGE_SIZE) return 'La imagen no puede superar 5 MB.';
  return '';
}

function getFirebasePasswordMessage(error) {
  const code = error?.code || '';
  const messages = {
    'auth/wrong-password': 'La contraseña actual no es correcta',
    'auth/invalid-credential': 'La contraseña actual no es correcta',
    'auth/requires-recent-login': 'Tu sesión expiró. Vuelve a iniciar sesión',
    'auth/user-token-expired': 'Tu sesión expiró. Vuelve a iniciar sesión',
    'auth/user-not-found': 'Tu sesión expiró. Vuelve a iniciar sesión',
    'auth/weak-password': 'La nueva contraseña debe tener al menos 6 caracteres',
    'auth/too-many-requests': 'Demasiados intentos. Intenta nuevamente en unos minutos.',
    'auth/network-request-failed': 'No fue posible cambiar la contraseña. Intenta nuevamente',
  };
  return messages[code] || 'No fue posible cambiar la contraseña. Intenta nuevamente';
}

function validatePasswordForm(values) {
  const errors = {};
  if (!values.currentPassword) errors.currentPassword = 'Ingresa tu contraseña actual.';
  if (!values.newPassword) errors.newPassword = 'Ingresa una nueva contraseña.';
  if (!values.confirmPassword) errors.confirmPassword = 'Repite la nueva contraseña.';
  if (values.newPassword && values.newPassword.length < PASSWORD_MIN_LENGTH) {
    errors.newPassword = `La nueva contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (values.currentPassword && values.newPassword && values.currentPassword === values.newPassword) {
    errors.newPassword = 'La nueva contraseña debe ser distinta a la actual.';
  }
  if (values.newPassword && values.confirmPassword && values.newPassword !== values.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
  }
  return errors;
}

function ReadOnlyItem({ label, value }) {
  return (
    <div className="admin-readonly-item">
      <span>{label}</span>
      <strong>{value || 'No disponible'}</strong>
    </div>
  );
}

function ChangePasswordModal({ open, onClose, onSuccess }) {
  const [values, setValues] = useState(passwordInitialState);
  const [fieldErrors, setFieldErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const closeTimerRef = useRef(null);

  const resetState = () => {
    setValues(passwordInitialState);
    setFieldErrors({});
    setStatusMessage('');
    setIsSuccess(false);
    setIsSubmitting(false);
  };

  useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!open) {
      setValues(passwordInitialState);
      setFieldErrors({});
      setStatusMessage('');
      setIsSuccess(false);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
    setStatusMessage('');
    setIsSuccess(false);
  };

  const handleClose = () => {
    if (isSubmitting || isSuccess) return;
    resetState();
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validatePasswordForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setStatusMessage('');
      setIsSuccess(false);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setStatusMessage('');
    setIsSuccess(false);

    try {
      await firebaseAuthService.changePassword(values.currentPassword, values.newPassword);
      setStatusMessage('Contraseña actualizada correctamente');
      setIsSuccess(true);
      setValues(passwordInitialState);
      closeTimerRef.current = window.setTimeout(() => {
        onSuccess();
      }, 900);
    } catch (error) {
      const message = getFirebasePasswordMessage(error);
      if (['auth/wrong-password', 'auth/invalid-credential'].includes(error?.code)) {
        setFieldErrors({ currentPassword: message });
      } else if (error?.code === 'auth/weak-password') {
        setFieldErrors({ newPassword: message });
      } else {
        setStatusMessage(message);
      }
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} title="Cambiar contraseña" onClose={handleClose} closeDisabled={isSubmitting || isSuccess} className="admin-password-modal">
      <form className="admin-modal-form admin-password-modal-form" onSubmit={handleSubmit}>
        <div className="admin-modal-section form-grid admin-password-field-grid">
          <Input
            id="admin-current-password"
            label="Contraseña actual"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            value={values.currentPassword}
            onChange={handleChange}
            error={fieldErrors.currentPassword}
            disabled={isSubmitting || isSuccess}
            required
          />
          <Input
            id="admin-new-password"
            label="Nueva contraseña"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            value={values.newPassword}
            onChange={handleChange}
            error={fieldErrors.newPassword}
            disabled={isSubmitting || isSuccess}
            minLength={PASSWORD_MIN_LENGTH}
            required
          />
          <Input
            id="admin-confirm-password"
            label="Repetir nueva contraseña"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={handleChange}
            error={fieldErrors.confirmPassword}
            disabled={isSubmitting || isSuccess}
            minLength={PASSWORD_MIN_LENGTH}
            required
          />
        </div>

        {statusMessage && (
          <p className={isSuccess ? 'admin-success-alert compact' : 'admin-alert compact'} role={isSuccess ? 'status' : 'alert'}>
            {statusMessage}
          </p>
        )}

        <div className="admin-modal-actions">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting || isSuccess}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting || isSuccess}>
            <KeyRound size={17} />
            {isSubmitting ? 'Cambiando...' : 'Cambiar contraseña'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function AdminProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const photoInputRef = useRef(null);

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
      if (!isValidChilePhone(values.telefono)) {
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
          telefono: normalizeChilePhone(values.telefono),
        });
      }

      return profileService.updateMyProfile({
        telefono: normalizeChilePhone(values.telefono),
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
      const validationError = validateProfileImage(file);
      if (validationError) {
        throw new Error(validationError);
      }
      return profileService.uploadMyPhoto(file);
    },
    onSuccess: (updatedProfile) => {
      const mergedProfile = { ...profile, ...updatedProfile };
      queryClient.setQueryData(['my-profile'], mergedProfile);
      queryClient.setQueryData(['auth-session', user?.uid], mergedProfile);
      setPhotoPreview(updatedProfile?.fotoUrl || '');
      setErrorMsg('');
      setSuccessMsg('Imagen actualizada correctamente');
    },
    onError: (err) => {
      setSuccessMsg('');
      const knownValidationError = [
        'Selecciona una imagen antes de continuar.',
        'Solo se permiten imagenes JPG, JPEG, PNG o WEBP.',
        'La imagen no puede superar 5 MB.',
        'La foto solo puede guardarse cuando el perfil existe en el backend.',
      ].includes(err?.message);
      setErrorMsg(knownValidationError ? err.message : 'No fue posible actualizar la imagen. Intenta nuevamente.');
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

  const handlePhotoButtonClick = () => {
    if (!canEditProfile || photoMutation.isPending) return;
    photoInputRef.current?.click();
  };

  const handlePhotoFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || photoMutation.isPending) return;
    setSuccessMsg('');
    setErrorMsg('');
    photoMutation.mutate(file);
  };

  const handlePasswordSuccess = () => {
    setPasswordModalOpen(false);
    setErrorMsg('');
    setSuccessMsg('Contraseña actualizada correctamente');
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
          <div className="admin-profile-avatar-control">
            <div className="admin-profile-avatar-large" aria-label="Foto de perfil">
              {photoPreview ? <img src={photoPreview} alt="Foto de perfil" /> : <span>{initials}</span>}
            </div>
            <input
              ref={photoInputRef}
              className="admin-profile-photo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={!canEditProfile || photoMutation.isPending}
              onChange={handlePhotoFileChange}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="admin-profile-image-button"
              onClick={handlePhotoButtonClick}
              disabled={!canEditProfile || photoMutation.isPending}
            >
              <Camera size={15} />
              {photoMutation.isPending ? 'Subiendo imagen...' : 'Cambiar imagen'}
            </Button>
            {!canEditProfile && (
              <small className="admin-profile-photo-hint">Disponible cuando tu perfil esté activo.</small>
            )}
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

        <div className="admin-profile-main-column">
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

          <section className="admin-profile-card admin-profile-security-card">
            <header className="admin-profile-card-header">
              <div>
                <span>Seguridad</span>
                <h3>Contraseña y acceso</h3>
                <p>Administra el acceso de esta cuenta.</p>
              </div>
              <ShieldCheck size={24} />
            </header>

            <div className="admin-profile-security-actions">
              <div>
                <strong>Cambio seguro con contraseña actual</strong>
                <span>Requiere confirmar tu contraseña actual.</span>
              </div>
              <Button type="button" variant="ghost" onClick={() => setPasswordModalOpen(true)}>
                <KeyRound size={17} />
                Cambiar contraseña
              </Button>
            </div>
          </section>
        </div>
      </div>

      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={handlePasswordSuccess}
      />
    </div>
  );
}
