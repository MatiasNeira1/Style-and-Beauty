import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { AdminKpiCard, AdminKpiGrid, AdminPageHeader, AdminSkeleton, AdminStatusBadge } from '../../components/admin/AdminPrimitives.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { authService } from '../../services/authService.js';
import { TOKEN_KEY } from '../../services/apiClient.js';
import { profileService } from '../../services/profileService.js';
import { ShieldCheck, UserPlus, Users } from 'lucide-react';

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
  fotoUrl: '',
  cvUrl: '',
  descripcionPerfil: '',
};

const USER_TYPES = {
  CLIENTE: {
    label: 'Cliente',
    listQueryKey: ['profiles-clients'],
    listQueryFn: profileService.listClients,
    createProfile: profileService.createClient,
  },
  STAFF: {
    label: 'Staff',
    listQueryKey: ['profiles-staff'],
    listQueryFn: profileService.listStaff,
    createProfile: profileService.createStaff,
  },
};

export function ClientsAdminPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [selectedType, setSelectedType] = useState('CLIENTE');
  const hasToken = Boolean(window.localStorage.getItem(TOKEN_KEY));
  const selectedTypeConfig = USER_TYPES[selectedType];

  const clientsQuery = useQuery({
    queryKey: USER_TYPES.CLIENTE.listQueryKey,
    queryFn: USER_TYPES.CLIENTE.listQueryFn,
    enabled: hasToken,
  });

  const staffQuery = useQuery({
    queryKey: USER_TYPES.STAFF.listQueryKey,
    queryFn: USER_TYPES.STAFF.listQueryFn,
    enabled: hasToken,
  });

  const { data: specialtiesData = [], isLoading: isLoadingSpecialties } = useQuery({
    queryKey: ['profiles-specialties'],
    queryFn: profileService.listSpecialties,
    enabled: hasToken && selectedType === 'STAFF',
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      await profileService.validateAvailability({
        ...payload,
        tipoPerfil: selectedType,
      });

      const user = await authService.createUser({
        email: payload.emailContacto,
        password: payload.password,
        rol: selectedType,
      });

      const profilePayload = { ...payload };
      delete profilePayload.password;
      const normalizedPayload = {
        ...profilePayload,
        idAuth: user.uid,
      };

      if (selectedType === 'STAFF') {
        normalizedPayload.idEspecialidad = Number(profilePayload.idEspecialidad);
      } else {
        delete normalizedPayload.idEspecialidad;
        delete normalizedPayload.fotoUrl;
        delete normalizedPayload.cvUrl;
        delete normalizedPayload.descripcionPerfil;
      }

      return selectedTypeConfig.createProfile(normalizedPayload);
    },
    onSuccess: () => {
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: selectedTypeConfig.listQueryKey });
    },
  });

  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
    setForm(initialForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    createMutation.mutate(form);
  };

  const selectedQuery = selectedType === 'STAFF' ? staffQuery : clientsQuery;
  const users = Array.isArray(selectedQuery.data) ? selectedQuery.data : [];
  const specialties = Array.isArray(specialtiesData) ? specialtiesData : [];
  const canCreate =
    hasToken &&
    !createMutation.isPending &&
    (selectedType === 'CLIENTE' || (!isLoadingSpecialties && specialties.length > 0));
  const clients = Array.isArray(clientsQuery.data) ? clientsQuery.data : [];
  const staff = Array.isArray(staffQuery.data) ? staffQuery.data : [];

  return (
    <div className="admin-dashboard">
      <AdminPageHeader
        eyebrow="Gestion"
        title="Clientes y profesionales"
        description="Gestiona perfiles desde una sola vista y separa clientes, staff y administracion operativa."
      />

      <AdminKpiGrid>
        <AdminKpiCard icon={Users} title="Clientes" value={clients.length} trend={11} microcopy="Base de atencion" tone="rose" />
        <AdminKpiCard icon={ShieldCheck} title="Profesionales" value={staff.length} trend={5} microcopy="Equipo activo" tone="sage" />
        <AdminKpiCard icon={UserPlus} title="Vista actual" value={selectedTypeConfig.label} trend={0} microcopy={`${users.length} registros visibles`} tone="gold" />
      </AdminKpiGrid>

      <form className="admin-panel" onSubmit={handleSubmit}>
        <h3>Crear {selectedTypeConfig.label.toLowerCase()}</h3>
        <div className="form-grid">
          <Input as="select" label="Tipo de usuario" id="user-type" name="tipoPerfil" value={selectedType} onChange={handleTypeChange}>
            {Object.entries(USER_TYPES).map(([value, type]) => (
              <option key={value} value={value}>
                {type.label}
              </option>
            ))}
          </Input>
          <Input label="RUT" id="user-rut" name="rut" value={form.rut} onChange={handleChange} required />
          <Input label="Nombre" id="user-nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
          <Input label="Apellidos" id="user-apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} />
          <Input label="Email" id="user-email" name="emailContacto" type="email" value={form.emailContacto} onChange={handleChange} required />
          <Input label="Contraseña temporal" id="user-password" name="password" type="password" minLength="6" value={form.password} onChange={handleChange} required />
          <Input label="Telefono" id="user-telefono" name="telefono" value={form.telefono} onChange={handleChange} />
          <Input label="Fecha nacimiento" id="user-fecha" name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={handleChange} />
          <Input label="Genero" id="user-genero" name="genero" value={form.genero} onChange={handleChange} />
          {selectedType === 'STAFF' && (
            <Input
              as="select"
              label="Especialidad"
              id="user-especialidad"
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
          )}
          {selectedType === 'STAFF' && (
            <>
              <Input label="Foto URL" id="user-foto" name="fotoUrl" value={form.fotoUrl} onChange={handleChange} />
              <Input label="CV URL" id="user-cv" name="cvUrl" value={form.cvUrl} onChange={handleChange} />
              <Input label="Descripcion profesional" id="user-descripcion-perfil" name="descripcionPerfil" value={form.descripcionPerfil} onChange={handleChange} />
            </>
          )}
        </div>
        {selectedType === 'STAFF' && !isLoadingSpecialties && specialties.length === 0 && (
          <p className="admin-alert">No hay especialidades disponibles para asignar staff.</p>
        )}
        {createMutation.isError && <p className="admin-alert">{createMutation.error.message}</p>}
        <Button type="submit" disabled={!canCreate}>
          {createMutation.isPending ? 'Creando...' : `Crear ${selectedTypeConfig.label.toLowerCase()}`}
        </Button>
      </form>

      {!hasToken ? (
        <p className="admin-alert">Necesitas iniciar sesión con un usuario ADMIN para listar usuarios.</p>
      ) : selectedQuery.isLoading ? (
        <AdminSkeleton rows={5} />
      ) : selectedQuery.isError ? (
        <p className="admin-alert">{selectedQuery.error.message}</p>
      ) : (
        <DataTable
          columns={[
            { key: 'tipoPerfil', label: 'Tipo', render: () => <AdminStatusBadge status={selectedType}>{selectedTypeConfig.label}</AdminStatusBadge> },
            { key: 'nombre', label: 'Nombre', render: (row) => `${row.nombre || ''} ${row.apellidos || ''}`.trim() || 'Sin nombre' },
            { key: 'emailContacto', label: 'Email' },
            { key: 'telefono', label: 'Telefono' },
            selectedType === 'STAFF'
              ? { key: 'especialidad', label: 'Especialidad', render: (row) => row.especialidad?.nombre || row.idEspecialidad || 'Sin especialidad' }
              : { key: 'puntosFidelidad', label: 'Puntos', render: (row) => row.puntosFidelidad ?? 0 },
          ]}
          rows={users}
          emptyMessage="No hay usuarios para este filtro."
        />
      )}
    </div>
  );
}
