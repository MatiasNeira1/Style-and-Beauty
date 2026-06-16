import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const staffSchema = z.object({
  rut: z.string().min(1, 'El RUT es obligatorio').refine((val) => validateRut(val), {
    message: 'El RUT no es válido (ej: 12.345.678-9)',
  }),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().optional(),
  emailContacto: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
  telefono: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  genero: z.string().optional(),
  idEspecialidad: z.string().min(1, 'Selecciona una especialidad'),
  descripcionPerfil: z.string().optional(),
  experienciaAnios: z.string().optional(),
  sinImagenPorAhora: z.boolean().optional(),
});

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

export function StaffFormModal({ open, onClose, onSubmit, initialData, specialties = [], isLoading }) {
  const isEditMode = Boolean(initialData);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoError, setPhotoError] = useState('');

  const schema = isEditMode
    ? staffSchema.omit({ password: true })
    : staffSchema.refine((data) => data.password && data.password.length >= 6, {
        message: 'La contraseña es obligatoria (mín. 6 caracteres)',
        path: ['password'],
      });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          ...defaultValues,
          ...initialData,
          idEspecialidad: String(initialData.idEspecialidad || initialData.especialidad?.idEspecialidad || ''),
          descripcionPerfil: initialData.descripcionPerfil || initialData.biografia || '',
          experienciaAnios: initialData.experienciaAnios != null ? String(initialData.experienciaAnios) : '',
        }
      : defaultValues,
  });

  useEffect(() => {
    reset(initialData
      ? {
          ...defaultValues,
          ...initialData,
          idEspecialidad: String(initialData.idEspecialidad || initialData.especialidad?.idEspecialidad || ''),
          descripcionPerfil: initialData.descripcionPerfil || initialData.biografia || '',
          experienciaAnios: initialData.experienciaAnios != null ? String(initialData.experienciaAnios) : '',
        }
      : defaultValues);
    setSelectedPhoto(null);
    setPhotoError('');
  }, [initialData, open, reset]);

  useEffect(() => {
    if (!selectedPhoto) {
      setPhotoPreview(initialData?.fotoUrl || initialData?.imageUrl || '');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedPhoto);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [initialData, selectedPhoto]);

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
    setValue('sinImagenPorAhora', false);
  };

  const onFormSubmit = (data) => {
    if (photoError) return;
    const existingPhoto = initialData?.fotoUrl || initialData?.imageUrl || '';
    if (!selectedPhoto && !existingPhoto && !data.sinImagenPorAhora) {
      setPhotoError('Sube una foto o marca Sin imagen por ahora.');
      return;
    }
    onSubmit({ ...data, sinImagenPorAhora: Boolean(data.sinImagenPorAhora), fotoFile: selectedPhoto }, isEditMode);
    reset(defaultValues);
    setSelectedPhoto(null);
  };

  const handleClose = () => {
    reset(defaultValues);
    setSelectedPhoto(null);
    setPhotoError('');
    onClose();
  };

  return (
    <Modal
      open={open}
      title={isEditMode ? 'Editar Profesional' : 'Nuevo Profesional'}
      onClose={handleClose}
    >
      <form className="staff-modal-form" onSubmit={handleSubmit(onFormSubmit)}>
        {/* ── Datos Personales ─────────────────────── */}
        <div className="staff-form-section">
          <div className="staff-form-section-title">
            <User size={14} />
            Datos Personales
          </div>
          <div className="staff-photo-picker-row">
            <label className="staff-photo-picker">
              <SafeImage src={photoPreview} alt="Foto del profesional" />
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
              <span><ImagePlus size={15} /> Cambiar foto</span>
            </label>
            <label className="staff-no-photo-option">
              <input type="checkbox" {...register('sinImagenPorAhora')} disabled={Boolean(selectedPhoto)} />
              <span>Sin imagen por ahora</span>
            </label>
            {photoError && <p className="staff-photo-error">{photoError}</p>}
          </div>
          <div className="staff-form-grid">
            <Input
              label="RUT"
              id="staff-form-rut"
              error={errors.rut?.message}
              {...register('rut', {
                onChange: (e) => {
                  setValue('rut', formatRut(e.target.value));
                }
              })}
            />
            <Input
              label="Nombre"
              id="staff-form-nombre"
              error={errors.nombre?.message}
              {...register('nombre')}
            />
            <Input
              label="Apellidos"
              id="staff-form-apellidos"
              error={errors.apellidos?.message}
              {...register('apellidos')}
            />
            <Input
              label="Fecha de Nacimiento"
              id="staff-form-fecha"
              type="date"
              {...register('fechaNacimiento')}
            />
            <Input
              label="Género"
              id="staff-form-genero"
              as="select"
              {...register('genero')}
            >
              <option value="">Seleccionar</option>
              <option value="FEMENINO">Femenino</option>
              <option value="MASCULINO">Masculino</option>
              <option value="OTRO">Otro</option>
            </Input>
          </div>
        </div>

        {/* ── Contacto ────────────────────────────── */}
        <div className="staff-form-section">
          <div className="staff-form-section-title">
            <Mail size={14} />
            Contacto
          </div>
          <div className="staff-form-grid">
            <Input
              label="Email"
              id="staff-form-email"
              type="email"
              error={errors.emailContacto?.message}
              {...register('emailContacto')}
            />
            <Input
              label="Teléfono"
              id="staff-form-telefono"
              error={errors.telefono?.message}
              {...register('telefono')}
            />
            {!isEditMode && (
              <Input
                label="Contraseña temporal"
                id="staff-form-password"
                type="password"
                error={errors.password?.message}
                {...register('password')}
              />
            )}
          </div>
        </div>

        {/* ── Profesional ─────────────────────────── */}
        <div className="staff-form-section">
          <div className="staff-form-section-title">
            <Briefcase size={14} />
            Perfil Profesional
          </div>
          <div className="staff-form-grid">
            <Input
              label="Especialidad"
              id="staff-form-especialidad"
              as="select"
              error={errors.idEspecialidad?.message}
              {...register('idEspecialidad')}
            >
              <option value="">Seleccionar especialidad</option>
              {specialties.map((s) => (
                <option key={s.idEspecialidad} value={s.idEspecialidad}>
                  {s.nombre}
                </option>
              ))}
            </Input>
            <Input
              label="Años de experiencia"
              id="staff-form-experiencia"
              type="number"
              min="0"
              {...register('experienciaAnios')}
            />
          </div>
          <Input
            label="Biografía / Perfil curricular"
            id="staff-form-bio"
            as="textarea"
            rows={3}
            placeholder="Describe la experiencia y habilidades del profesional..."
            {...register('descripcionPerfil')}
          />
        </div>

        {/* ── Actions ─────────────────────────────── */}
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
