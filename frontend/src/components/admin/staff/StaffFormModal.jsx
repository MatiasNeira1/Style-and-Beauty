import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Briefcase, Shield } from 'lucide-react';
import { Modal } from '../../ui/Modal.jsx';
import { Button } from '../../ui/Button.jsx';
import { Input } from '../../ui/Input.jsx';

const staffSchema = z.object({
  rut: z.string().min(1, 'El RUT es obligatorio'),
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
};

export function StaffFormModal({ open, onClose, onSubmit, initialData, specialties = [], isLoading }) {
  const isEditMode = Boolean(initialData);

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
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          ...defaultValues,
          ...initialData,
          idEspecialidad: String(initialData.idEspecialidad || initialData.especialidad?.idEspecialidad || ''),
        }
      : defaultValues,
  });

  const onFormSubmit = (data) => {
    onSubmit(data, isEditMode);
    reset(defaultValues);
  };

  const handleClose = () => {
    reset(defaultValues);
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
          <div className="staff-form-grid">
            <Input
              label="RUT"
              id="staff-form-rut"
              error={errors.rut?.message}
              {...register('rut')}
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
