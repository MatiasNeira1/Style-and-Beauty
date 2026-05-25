import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { authService } from '../../services/authService.js';
import { profileService } from '../../services/profileService.js';

const initialForm = {
  rut: '',
  nombre: '',
  apellidos: '',
  fechaNacimiento: '',
  genero: '',
  telefono: '',
  emailContacto: '',
  password: '',
  idEspecialidad: '',
};

export function StaffAdminPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ['profiles-staff'],
    queryFn: profileService.listStaff,
  });

  const { data: specialtiesData = [], isLoading: isLoadingSpecialties } = useQuery({
    queryKey: ['profiles-specialties'],
    queryFn: profileService.listSpecialties,
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const user = await authService.createUser({
        email: payload.emailContacto,
        password: payload.password,
        rol: 'STAFF',
      });

      const profilePayload = { ...payload };
      delete profilePayload.password;

      return profileService.createStaff({
        ...profilePayload,
        idAuth: user.uid,
        idEspecialidad: Number(profilePayload.idEspecialidad),
      });
    },
    onSuccess: () => {
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ['profiles-staff'] });
    },
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    createMutation.mutate(form);
  };

  const staff = Array.isArray(data) ? data : [];
  const specialties = Array.isArray(specialtiesData) ? specialtiesData : [];

  return (
    <div className="stack">
      <SectionTitle eyebrow="Admin" title="Staff">
        Gestiona los perfiles del equipo desde ms-perfiles.
      </SectionTitle>

      <form className="card stack" onSubmit={handleSubmit}>
        <h3>Crear staff</h3>
        <div className="form-grid">
          <Input label="RUT" id="staff-rut" name="rut" value={form.rut} onChange={handleChange} required />
          <Input label="Nombre" id="staff-nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
          <Input label="Apellidos" id="staff-apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} />
          <Input label="Email" id="staff-email" name="emailContacto" type="email" value={form.emailContacto} onChange={handleChange} required />
          <Input label="Contraseña temporal" id="staff-password" name="password" type="password" minLength="6" value={form.password} onChange={handleChange} required />
          <Input label="Telefono" id="staff-telefono" name="telefono" value={form.telefono} onChange={handleChange} />
          <Input label="Fecha nacimiento" id="staff-fecha" name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={handleChange} />
          <Input label="Genero" id="staff-genero" name="genero" value={form.genero} onChange={handleChange} />
          <Input
            as="select"
            label="Especialidad"
            id="staff-especialidad"
            name="idEspecialidad"
            value={form.idEspecialidad}
            onChange={handleChange}
            required
            disabled={isLoadingSpecialties}
          >
            <option value="">{isLoadingSpecialties ? 'Cargando especialidades...' : 'Seleccionar especialidad'}</option>
            {specialties.map((specialty) => (
              <option key={specialty.idEspecialidad} value={specialty.idEspecialidad}>
                {specialty.nombre}
              </option>
            ))}
          </Input>
        </div>
        {!isLoadingSpecialties && specialties.length === 0 && (
          <p className="admin-alert">No hay especialidades disponibles para asignar staff.</p>
        )}
        {createMutation.isError && <p className="admin-alert">{createMutation.error.message}</p>}
        <Button type="submit" disabled={createMutation.isPending || isLoadingSpecialties || specialties.length === 0}>
          {createMutation.isPending ? 'Creando...' : 'Crear staff'}
        </Button>
      </form>

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <p className="admin-alert">{error.message}</p>
      ) : (
        <DataTable
          columns={[
            { key: 'nombre', label: 'Nombre', render: (row) => `${row.nombre || ''} ${row.apellidos || ''}`.trim() || 'Sin nombre' },
            { key: 'emailContacto', label: 'Email' },
            { key: 'telefono', label: 'Telefono' },
            { key: 'especialidad', label: 'Especialidad', render: (row) => row.especialidad?.nombre || row.idEspecialidad || 'Sin especialidad' },
          ]}
          rows={staff}
        />
      )}
    </div>
  );
}
