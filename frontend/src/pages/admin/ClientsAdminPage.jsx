import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { AdminKpiCard, AdminKpiGrid, AdminPageHeader, AdminSkeleton, AdminStatusBadge } from '../../components/admin/AdminPrimitives.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { authService } from '../../services/authService.js';
import { TOKEN_KEY } from '../../services/apiClient.js';
import { profileService } from '../../services/profileService.js';
import { ShieldCheck, UserPlus, Users, X } from 'lucide-react';
import { fullName } from '../../utils/adminFormatters.js';

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
  sinImagenPorAhora: false,
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

function getUserId(user) {
  return user.idPersona || user.idCliente || user.idStaff || user.id || user.idAuth;
}

function normalizeBirthDate(value) {
  if (!value || /^\d{4}-\d{2}-\d{2}$/.test(value)) return value || null;
  const parts = value.split(/[-/]/);
  if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return value;
}

function UserCreateModal({
  open,
  form,
  selectedType,
  specialties,
  isLoadingSpecialties,
  isSaving,
  error,
  onClose,
  onSubmit,
  onTypeChange,
  onChange,
}) {
  const typeConfig = USER_TYPES[selectedType];
  return (
    <Modal open={open} title={`Agregar ${typeConfig.label.toLowerCase()}`} onClose={onClose}>
      <form className="admin-modal-form" onSubmit={onSubmit}>
        <div className="admin-modal-section form-grid">
          <Input as="select" label="Tipo de usuario" id="user-type" name="tipoPerfil" value={selectedType} onChange={onTypeChange}>
            {Object.entries(USER_TYPES).map(([value, type]) => <option key={value} value={value}>{type.label}</option>)}
          </Input>
          <Input label="RUT" id="user-rut" name="rut" value={form.rut} onChange={onChange} required />
          <Input label="Nombre" id="user-nombre" name="nombre" value={form.nombre} onChange={onChange} required />
          <Input label="Apellidos" id="user-apellidos" name="apellidos" value={form.apellidos} onChange={onChange} />
          <Input label="Email" id="user-email" name="emailContacto" type="email" value={form.emailContacto} onChange={onChange} required />
          <Input label="Contrasena temporal" id="user-password" name="password" type="password" minLength="6" value={form.password} onChange={onChange} required />
          <Input label="Telefono" id="user-telefono" name="telefono" value={form.telefono} onChange={onChange} />
          <Input label="Fecha nacimiento" id="user-fecha" name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={onChange} />
          <Input as="select" label="Genero" id="user-genero" name="genero" value={form.genero} onChange={onChange}>
            <option value="">Seleccionar</option>
            <option value="femenino">Femenino</option>
            <option value="masculino">Masculino</option>
            <option value="otro">Otro</option>
            <option value="no_especifica">Prefiere no decir</option>
          </Input>
          {selectedType === 'STAFF' && (
            <Input as="select" label="Especialidad" id="user-especialidad" name="idEspecialidad" value={form.idEspecialidad} onChange={onChange} required disabled={isLoadingSpecialties}>
              <option value="">{isLoadingSpecialties ? 'Cargando especialidades...' : 'Seleccionar especialidad'}</option>
              {specialties.map((specialty) => <option key={specialty.idEspecialidad} value={specialty.idEspecialidad}>{specialty.nombre}</option>)}
            </Input>
          )}
          {selectedType === 'STAFF' && (
            <>
              <Input label="Foto URL" id="user-foto" name="fotoUrl" value={form.fotoUrl} onChange={onChange} />
              <Input label="CV URL" id="user-cv" name="cvUrl" value={form.cvUrl} onChange={onChange} />
              <Input label="Descripcion profesional" id="user-descripcion-perfil" name="descripcionPerfil" value={form.descripcionPerfil} onChange={onChange} />
              <label className="admin-checkbox-row">
                <input type="checkbox" name="sinImagenPorAhora" checked={form.sinImagenPorAhora} onChange={onChange} />
                <span>Sin imagen por ahora</span>
              </label>
            </>
          )}
        </div>
        {selectedType === 'STAFF' && !isLoadingSpecialties && specialties.length === 0 && (
          <p className="admin-alert">No hay especialidades disponibles para asignar staff.</p>
        )}
        {error && <p className="admin-alert">{error.message}</p>}
        <div className="admin-modal-actions">
          <Button type="button" variant="ghost" onClick={onClose}><X size={16} /> Cancelar</Button>
          <Button type="submit" disabled={isSaving || (selectedType === 'STAFF' && (!form.fotoUrl && !form.sinImagenPorAhora))}>
            {isSaving ? 'Creando...' : `Agregar ${typeConfig.label.toLowerCase()}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function UserDetailModal({ user, selectedType, onClose, onPromote, isPromoting }) {
  const typeConfig = USER_TYPES[selectedType];
  return (
    <Modal open={Boolean(user)} title="Detalle de usuario" onClose={onClose}>
      {user && (
        <div className="admin-detail-modal">
          <div className="admin-detail-hero">
            <div>
              <span>{typeConfig.label}</span>
              <h3>{fullName(user) || 'Usuario sin nombre'}</h3>
              <p>{user.emailContacto || 'Sin email registrado'}</p>
            </div>
            <AdminStatusBadge status={selectedType}>{typeConfig.label}</AdminStatusBadge>
          </div>
          <div className="admin-detail-grid">
            <div><span>RUT</span><strong>{user.rut || 'No disponible'}</strong></div>
            <div><span>Telefono</span><strong>{user.telefono || 'No disponible'}</strong></div>
            <div><span>Genero</span><strong>{user.genero || 'No disponible'}</strong></div>
            <div><span>ID Auth</span><strong>{user.idAuth || 'No disponible'}</strong></div>
          </div>
          {selectedType === 'STAFF' ? (
            <section>
              <h4>Especialidad</h4>
              <p>{user.especialidad?.nombre || user.nombreEspecialidad || 'Sin especialidad'}</p>
            </section>
          ) : (
            <section>
              <h4>Fidelizacion</h4>
              <p>{user.puntosFidelidad ?? 0} puntos acumulados.</p>
            </section>
          )}
          <div className="admin-modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>Cerrar</Button>
            <Button type="button" variant="ghost" onClick={() => onPromote(user)} disabled={isPromoting || !user.idAuth}>
              <ShieldCheck size={16} /> Hacer ADMIN
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function ClientsAdminPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [selectedType, setSelectedType] = useState('CLIENTE');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const hasToken = Boolean(window.localStorage.getItem(TOKEN_KEY));
  const selectedTypeConfig = USER_TYPES[selectedType];

  const clientsQuery = useQuery({ queryKey: USER_TYPES.CLIENTE.listQueryKey, queryFn: USER_TYPES.CLIENTE.listQueryFn, enabled: hasToken });
  const staffQuery = useQuery({ queryKey: USER_TYPES.STAFF.listQueryKey, queryFn: USER_TYPES.STAFF.listQueryFn, enabled: hasToken });
  const { data: specialtiesData = [], isLoading: isLoadingSpecialties } = useQuery({
    queryKey: ['profiles-specialties'],
    queryFn: profileService.listSpecialties,
    enabled: hasToken && selectedType === 'STAFF',
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const payloadWithNormalizedDate = { ...payload, fechaNacimiento: normalizeBirthDate(payload.fechaNacimiento) };
      await profileService.validateAvailability({ ...payloadWithNormalizedDate, tipoPerfil: selectedType });
      const user = await authService.createUser({
        email: payloadWithNormalizedDate.emailContacto,
        password: payloadWithNormalizedDate.password,
        rol: selectedType,
      });

      const profilePayload = { ...payloadWithNormalizedDate };
      delete profilePayload.password;
      const normalizedPayload = { ...profilePayload, idAuth: user.uid };

      if (selectedType === 'STAFF') {
        normalizedPayload.idEspecialidad = Number(profilePayload.idEspecialidad);
        normalizedPayload.sinImagenPorAhora = Boolean(profilePayload.sinImagenPorAhora);
      } else {
        delete normalizedPayload.idEspecialidad;
        delete normalizedPayload.fotoUrl;
        delete normalizedPayload.cvUrl;
        delete normalizedPayload.descripcionPerfil;
        delete normalizedPayload.sinImagenPorAhora;
      }

      return selectedTypeConfig.createProfile(normalizedPayload);
    },
    onSuccess: () => {
      setForm(initialForm);
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: selectedTypeConfig.listQueryKey });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-snapshot'] });
    },
  });

  const promoteMutation = useMutation({
    mutationFn: async ({ idAuth, rol }) => {
      if (!idAuth) throw new Error('El usuario no tiene una cuenta de Firebase asociada.');
      return authService.assignRole({ uid: idAuth, rol });
    },
  });

  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
    setForm(initialForm);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    createMutation.mutate(form);
  };

  const selectedQuery = selectedType === 'STAFF' ? staffQuery : clientsQuery;
  const users = Array.isArray(selectedQuery.data) ? selectedQuery.data : [];
  const specialties = Array.isArray(specialtiesData) ? specialtiesData : [];
  const clients = Array.isArray(clientsQuery.data) ? clientsQuery.data : [];
  const staff = Array.isArray(staffQuery.data) ? staffQuery.data : [];

  return (
    <div className="admin-dashboard">
      <AdminPageHeader
        eyebrow="Gestion"
        title="Clientes y usuarios"
        description="Gestiona perfiles sin exponer formularios sensibles en la vista principal."
        actions={<Button type="button" size="sm" onClick={() => setCreateOpen(true)}><UserPlus size={16} /> Agregar usuario</Button>}
      />

      <AdminKpiGrid>
        <AdminKpiCard icon={Users} title="Clientes" value={clients.length} trend={0} microcopy="Base de atencion" tone="rose" />
        <AdminKpiCard icon={ShieldCheck} title="Profesionales" value={staff.length} trend={0} microcopy="Equipo activo" tone="sage" />
        <AdminKpiCard icon={UserPlus} title="Vista actual" value={selectedTypeConfig.label} trend={0} microcopy={`${users.length} registros visibles`} tone="gold" />
      </AdminKpiGrid>

      <section className="admin-panel compact-panel">
        <header>
          <div>
            <h3>Directorio</h3>
            <p>Selecciona el tipo de usuario y abre una fila para ver acciones.</p>
          </div>
          <div className="admin-segmented">
            {Object.entries(USER_TYPES).map(([value, type]) => (
              <button key={value} type="button" className={selectedType === value ? 'active' : ''} onClick={() => setSelectedType(value)}>
                {type.label}
              </button>
            ))}
          </div>
        </header>
      </section>

      {!hasToken ? (
        <p className="admin-alert">Necesitas iniciar sesion con un usuario ADMIN para listar usuarios.</p>
      ) : selectedQuery.isLoading ? (
        <AdminSkeleton rows={5} />
      ) : selectedQuery.isError ? (
        <p className="admin-alert">{selectedQuery.error.message}</p>
      ) : (
        <DataTable
          compact
          onRowClick={(row) => setSelectedUser(row)}
          getRowKey={(row) => getUserId(row)}
          getRowLabel={(row) => `Ver detalle de ${fullName(row) || row.emailContacto || 'usuario'}`}
          columns={[
            { key: 'tipoPerfil', label: 'Tipo', render: () => <AdminStatusBadge status={selectedType}>{selectedTypeConfig.label}</AdminStatusBadge> },
            { key: 'nombre', label: 'Nombre', render: (row) => fullName(row) || 'Sin nombre' },
            { key: 'emailContacto', label: 'Email', render: (row) => row.emailContacto || 'Sin email' },
            { key: 'telefono', label: 'Telefono', render: (row) => row.telefono || 'Sin telefono' },
            selectedType === 'STAFF'
              ? { key: 'especialidad', label: 'Especialidad', render: (row) => row.especialidad?.nombre || row.idEspecialidad || 'Sin especialidad' }
              : { key: 'puntosFidelidad', label: 'Puntos', render: (row) => row.puntosFidelidad ?? 0 },
          ]}
          rows={users}
          emptyMessage="No hay usuarios para este filtro."
        />
      )}

      <UserCreateModal
        open={createOpen}
        form={form}
        selectedType={selectedType}
        specialties={specialties}
        isLoadingSpecialties={isLoadingSpecialties}
        isSaving={createMutation.isPending}
        error={createMutation.error}
        onClose={() => {
          setCreateOpen(false);
          setForm(initialForm);
        }}
        onSubmit={handleSubmit}
        onTypeChange={handleTypeChange}
        onChange={handleChange}
      />

      <UserDetailModal
        user={selectedUser}
        selectedType={selectedType}
        onClose={() => setSelectedUser(null)}
        onPromote={(row) => promoteMutation.mutate({ idAuth: row.idAuth, rol: 'ADMIN' })}
        isPromoting={promoteMutation.isPending}
      />

      {promoteMutation.isSuccess && <p className="admin-success-alert">Rol ADMIN asignado correctamente.</p>}
      {promoteMutation.isError && <p className="admin-alert">{promoteMutation.error.message}</p>}
    </div>
  );
}
