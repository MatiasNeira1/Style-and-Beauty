import { useEffect, useState } from 'react';
import { Briefcase, ImagePlus, Mail, User } from 'lucide-react';
import { Modal } from '../../ui/Modal.jsx';
import { Button } from '../../ui/Button.jsx';
import { Input } from '../../ui/Input.jsx';
import { SafeImage } from '../../ui/SafeImage.jsx';

function validateRut(rut) {
  if (!rut || typeof rut !== 'string') return false;
  const cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleanRut.length < 2) return false;

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);

  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDv = 11 - (sum % 11);
  const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : String(expectedDv);

  return calculatedDv === dv;
}

function hasChileanRutFormat(rut) {
  return /^\d{1,2}\.\d{3}\.\d{3}-[0-9K]$/.test(String(rut || '').toUpperCase());
}

function isBlank(value) {
  return String(value ?? '').trim() === '';
}

function formatRut(value) {
  if (!value) return '';
  const clean = value.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);
  if (clean.length <= 1) return clean;

  const dv = clean.slice(-1);
  const body = clean.slice(0, -1);
  let formattedBody = body;

  if (body.length > 6) {
    formattedBody = `${body.slice(0, body.length - 6)}.${body.slice(body.length - 6, body.length - 3)}.${body.slice(body.length - 3)}`;
  } else if (body.length > 3) {
    formattedBody = `${body.slice(0, body.length - 3)}.${body.slice(body.length - 3)}`;
  }

  return `${formattedBody}-${dv}`;
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function chileanPhoneDigits(value) {
  return onlyDigits(value).slice(0, 11);
}

function hasChileanPhoneFormat(value) {
  return /^56[2-9]\d{8}$/.test(chileanPhoneDigits(value));
}

const defaultValues = {
  rut: '',
  nombre: '',
  apellidos: '',
  emailContacto: '',
  password: '',
  telefono: '',
  fechaNacimiento: '',
  genero: '',
  idEspecialidad: '',
  descripcionPerfil: '',
  experienciaAnios: '',
  sinImagenPorAhora: false,
};

function dateInputValue(value) {
  if (!value) return '';
  const asString = String(value);
  const isoMatch = asString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const localMatch = asString.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (localMatch) return `${localMatch[3]}-${localMatch[2]}-${localMatch[1]}`;
  return asString;
}

function valuesFromStaff(initialData, options = {}) {
  const strictStaffProfile = Boolean(options.strictStaffProfile);

  return initialData
    ? {
        ...defaultValues,
        ...initialData,
        rut: initialData.rut ? formatRut(String(initialData.rut)) : '',
        fechaNacimiento: dateInputValue(initialData.fechaNacimiento),
        genero: initialData.genero ? String(initialData.genero).toUpperCase() : '',
        idEspecialidad: String(initialData.idEspecialidad || initialData.especialidad?.idEspecialidad || ''),
        descripcionPerfil: initialData.descripcionPerfil || initialData.biografia || '',
        telefono: strictStaffProfile ? chileanPhoneDigits(initialData.telefono) : initialData.telefono || '',
        experienciaAnios: initialData.experienciaAnios != null ? String(initialData.experienciaAnios) : '',
      }
    : defaultValues;
}

function validateForm(values, isEditMode, options = {}) {
  const nextErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const strictStaffProfile = Boolean(options.strictStaffProfile);

  if (isBlank(values.rut)) {
    nextErrors.rut = 'El RUT es obligatorio';
  } else if (strictStaffProfile && !hasChileanRutFormat(values.rut)) {
    nextErrors.rut = 'Usa formato chileno: 12.345.678-9';
  } else if (!validateRut(values.rut)) {
    nextErrors.rut = 'Ingresa un RUT valido';
  }

  if (isBlank(values.nombre)) {
    nextErrors.nombre = 'El nombre es obligatorio';
  }

  if (strictStaffProfile && isBlank(values.apellidos)) {
    nextErrors.apellidos = 'Los apellidos son obligatorios';
  }

  if (isBlank(values.emailContacto)) {
    nextErrors.emailContacto = 'El email es obligatorio';
  } else if (!emailPattern.test(values.emailContacto)) {
    nextErrors.emailContacto = 'Email invalido';
  }

  if (!isEditMode && (isBlank(values.password) || values.password.length < 6)) {
    nextErrors.password = 'La contrasena es obligatoria (min. 6 caracteres)';
  }

  const phoneValue = strictStaffProfile ? chileanPhoneDigits(values.telefono) : values.telefono;

  if (strictStaffProfile && isBlank(phoneValue)) {
    nextErrors.telefono = 'El telefono es obligatorio';
  } else if (strictStaffProfile && !hasChileanPhoneFormat(phoneValue)) {
    nextErrors.telefono = 'Ingresa un telefono chileno valido, por ejemplo 56912345678';
  } else if (values.telefono && !/^\+?[0-9\s-]{8,18}$/.test(values.telefono)) {
    nextErrors.telefono = 'Formato esperado: +56 9 1234 5678';
  }

  if (strictStaffProfile && isBlank(values.fechaNacimiento)) {
    nextErrors.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
  } else if (values.fechaNacimiento && !/^\d{4}-\d{2}-\d{2}$/.test(values.fechaNacimiento)) {
    nextErrors.fechaNacimiento = 'Formato esperado: AAAA-MM-DD';
  }

  if (strictStaffProfile && isBlank(values.genero)) {
    nextErrors.genero = 'Selecciona un genero';
  }

  if (isBlank(values.idEspecialidad)) {
    nextErrors.idEspecialidad = 'Selecciona una especialidad';
  }

  if (strictStaffProfile && isBlank(values.experienciaAnios)) {
    nextErrors.experienciaAnios = 'Los anos de experiencia son obligatorios';
  } else if (values.experienciaAnios && Number(values.experienciaAnios) < 0) {
    nextErrors.experienciaAnios = 'La experiencia no puede ser negativa';
  } else if (values.experienciaAnios && Number.isNaN(Number(values.experienciaAnios))) {
    nextErrors.experienciaAnios = 'Ingresa un numero valido';
  }

  return nextErrors;
}

function normalizedValues(values) {
  return {
    ...values,
    rut: String(values.rut || '').trim(),
    nombre: String(values.nombre || '').trim(),
    apellidos: String(values.apellidos || '').trim(),
    emailContacto: String(values.emailContacto || '').trim(),
    telefono: String(values.telefono || '').trim(),
    fechaNacimiento: String(values.fechaNacimiento || '').trim(),
    genero: String(values.genero || '').trim(),
    idEspecialidad: String(values.idEspecialidad || '').trim(),
    descripcionPerfil: String(values.descripcionPerfil || '').trim(),
    experienciaAnios: String(values.experienciaAnios || '').trim(),
  };
}

export function StaffFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  specialties = [],
  isLoading,
  errorMessage,
  showPhotoField = true,
  showBioField = true,
  strictStaffProfileValidation = false,
}) {
  const isEditMode = Boolean(initialData);
  const [formValues, setFormValues] = useState(() => valuesFromStaff(initialData, {
    strictStaffProfile: strictStaffProfileValidation,
  }));
  const [errors, setErrors] = useState({});
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    setFormValues(valuesFromStaff(initialData, {
      strictStaffProfile: strictStaffProfileValidation,
    }));
    setErrors({});
    setSelectedPhoto(null);
    setPhotoError('');
  }, [initialData, open, strictStaffProfileValidation]);

  useEffect(() => {
    if (!selectedPhoto) {
      setPhotoPreview(initialData?.fotoUrl || initialData?.imageUrl || '');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedPhoto);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [initialData, selectedPhoto]);

  const updateField = (field, transform) => (event) => {
    const nextValue = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormValues((current) => ({
      ...current,
      [field]: transform ? transform(nextValue) : nextValue,
    }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    setPhotoError('');

    if (!file) {
      setSelectedPhoto(null);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError('Solo se permiten imagenes JPG, PNG o WEBP.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('La imagen no puede superar 5 MB.');
      event.target.value = '';
      return;
    }

    setSelectedPhoto(file);
    setFormValues((current) => ({ ...current, sinImagenPorAhora: false }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (photoError) return;

    const cleanValues = normalizedValues(formValues);
    if (strictStaffProfileValidation) {
      cleanValues.telefono = chileanPhoneDigits(cleanValues.telefono);
    }
    const nextErrors = validateForm(cleanValues, isEditMode, {
      strictStaffProfile: strictStaffProfileValidation,
    });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const existingPhoto = initialData?.fotoUrl || initialData?.imageUrl || '';
    if (showPhotoField && !selectedPhoto && !existingPhoto && !formValues.sinImagenPorAhora) {
      setPhotoError('Sube una foto o marca Sin imagen por ahora.');
      return;
    }

    await onSubmit({ ...cleanValues, sinImagenPorAhora: Boolean(formValues.sinImagenPorAhora), fotoFile: selectedPhoto }, isEditMode);
  };

  const handleClose = () => {
    setFormValues(defaultValues);
    setErrors({});
    setSelectedPhoto(null);
    setPhotoError('');
    onClose();
  };

  return (
    <Modal open={open} title={isEditMode ? 'Editar Profesional' : 'Nuevo Profesional'} onClose={handleClose}>
      <form className="staff-modal-form" onSubmit={handleSubmit}>
        {errorMessage && <p className="admin-alert">{errorMessage}</p>}

        <div className="staff-form-section">
          <div className="staff-form-section-title">
            <User size={14} />
            Datos personales
          </div>
          {showPhotoField && (
            <div className="staff-photo-picker-row">
              <label className="staff-photo-picker">
                <SafeImage src={photoPreview} alt="Foto del profesional" />
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
                <span><ImagePlus size={15} /> Cambiar foto</span>
              </label>
              <label className="staff-no-photo-option">
                <input
                  type="checkbox"
                  checked={Boolean(formValues.sinImagenPorAhora)}
                  onChange={updateField('sinImagenPorAhora')}
                  disabled={Boolean(selectedPhoto)}
                />
                <span>Sin imagen por ahora</span>
              </label>
              {photoError && <p className="staff-photo-error">{photoError}</p>}
            </div>
          )}
          <div className="staff-form-grid">
            <Input
              label="RUT"
              id="staff-form-rut"
              placeholder="12.345.678-9"
              error={errors.rut}
              value={formValues.rut}
              onChange={updateField('rut', formatRut)}
            />
            <Input label="Nombre" id="staff-form-nombre" placeholder="Valentina" error={errors.nombre} value={formValues.nombre} onChange={updateField('nombre')} />
            <Input label="Apellidos" id="staff-form-apellidos" placeholder="Rojas Soto" error={errors.apellidos} value={formValues.apellidos} onChange={updateField('apellidos')} />
            <Input label="Fecha de nacimiento" id="staff-form-fecha" type="date" hint="Formato AAAA-MM-DD" error={errors.fechaNacimiento} value={formValues.fechaNacimiento} onChange={updateField('fechaNacimiento')} />
            <Input label="Genero" id="staff-form-genero" as="select" error={errors.genero} value={formValues.genero} onChange={updateField('genero')}>
              <option value="">Seleccionar</option>
              <option value="FEMENINO">Femenino</option>
              <option value="MASCULINO">Masculino</option>
              <option value="OTRO">Otro</option>
            </Input>
          </div>
        </div>

        <div className="staff-form-section">
          <div className="staff-form-section-title">
            <Mail size={14} />
            Contacto
          </div>
          <div className="staff-form-grid">
            <Input label="Email" id="staff-form-email" type="email" placeholder="correo@dominio.cl" error={errors.emailContacto} value={formValues.emailContacto} onChange={updateField('emailContacto')} />
            <Input
              label="Telefono"
              id="staff-form-telefono"
              placeholder={strictStaffProfileValidation ? '56912345678' : '+56 9 1234 5678'}
              error={errors.telefono}
              value={formValues.telefono}
              onChange={updateField('telefono', strictStaffProfileValidation ? chileanPhoneDigits : undefined)}
              type="tel"
              inputMode={strictStaffProfileValidation ? 'numeric' : 'tel'}
              pattern={strictStaffProfileValidation ? '56[2-9][0-9]{8}' : undefined}
              maxLength={strictStaffProfileValidation ? 11 : undefined}
              autoComplete="tel"
            />
            {!isEditMode && (
              <Input label="Contrasena temporal" id="staff-form-password" type="password" placeholder="Minimo 6 caracteres" error={errors.password} value={formValues.password} onChange={updateField('password')} />
            )}
          </div>
        </div>

        <div className="staff-form-section">
          <div className="staff-form-section-title">
            <Briefcase size={14} />
            Perfil profesional
          </div>
          <div className="staff-form-grid">
            <Input label="Especialidad" id="staff-form-especialidad" as="select" error={errors.idEspecialidad} value={formValues.idEspecialidad} onChange={updateField('idEspecialidad')}>
              <option value="">Seleccionar especialidad</option>
              {specialties.map((specialty) => (
                <option key={specialty.idEspecialidad} value={specialty.idEspecialidad}>
                  {specialty.nombre}
                </option>
              ))}
            </Input>
            <Input label="Anos de experiencia" id="staff-form-experiencia" type="number" min="0" placeholder="Ej. 4" error={errors.experienciaAnios} value={formValues.experienciaAnios} onChange={updateField('experienciaAnios')} />
          </div>
          {showBioField && (
            <Input
              label="Biografia / Perfil curricular"
              id="staff-form-bio"
              as="textarea"
              rows={3}
              placeholder="Incluye experiencia, certificaciones, especialidades o condiciones"
              value={formValues.descripcionPerfil}
              onChange={updateField('descripcionPerfil')}
            />
          )}
        </div>

        <div className="staff-form-footer">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? isEditMode ? 'Actualizando...' : 'Creando...'
              : isEditMode ? 'Guardar cambios' : 'Crear profesional'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
