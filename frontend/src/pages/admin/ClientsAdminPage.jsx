import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { AdminKpiCard, AdminKpiGrid, AdminPageHeader, AdminSkeleton, AdminStatusBadge } from '../../components/admin/AdminPrimitives.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { authService } from '../../services/authService.js';
import { TOKEN_KEY } from '../../services/apiClient.js';
import { profileService } from '../../services/profileService.js';
import { Search, ShieldCheck, UserPlus, Users, X } from 'lucide-react';
import { fullName } from '../../utils/adminFormatters.js';
import { chilePhoneDigits, isValidChilePhone, normalizeChilePhone } from '../../utils/phoneUtils.js';
import { formatRut, normalizeRut, validateRut } from '../../utils/rutUtils.js';

const initialForm = {
  rut: '',
  nombre: '',
  apellidos: '',
  fechaNacimiento: '',
  genero: '',
  telefono: '',
  emailContacto: '',
  password: '',
};

const CLIENT_CONFIG = {
  label: 'Cliente',
  listQueryKey: ['profiles-clients'],
  listQueryFn: profileService.listClients,
  createProfile: profileService.createClient,
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

function validatePhone(value) {
  if (!value) return true;
  return isValidChilePhone(value);
}

function validateClientForm(form) {
  if (!form.rut?.trim()) return 'El RUT es obligatorio.';
  if (!validateRut(form.rut)) return 'Ingresa un RUT válido.';
  if (!form.nombre?.trim()) return 'El nombre es obligatorio.';
  if (!form.apellidos?.trim()) return 'El apellido es obligatorio.';
  if (!form.emailContacto?.trim()) return 'El email es obligatorio.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailContacto.trim())) return 'Ingresa un email valido, por ejemplo correo@dominio.cl.';
  if (!form.fechaNacimiento) return 'La fecha de nacimiento es obligatoria.';
  if (!form.genero) return 'Selecciona el genero.';
  if (!form.password || form.password.length < 6) return 'La contrasena temporal debe tener al menos 6 caracteres.';
  if (!validatePhone(form.telefono)) return 'Ingresa un telefono valido, por ejemplo +56 9 1234 5678.';
  return '';
}

function UserCreateModal({
  open,
  form,
  isSaving,
  formError,
  error,
  onClose,
  onSubmit,
  onChange,
}) {
  return (
    <Modal open={open} title="Agregar cliente" onClose={onClose}>
      <form className="admin-modal-form" onSubmit={onSubmit}>
        <div className="admin-modal-section form-grid">
          <Input label="RUT" id="user-rut" name="rut" value={form.rut} onChange={onChange} placeholder="12.345.678-9" required />
          <Input label="Nombre" id="user-nombre" name="nombre" value={form.nombre} onChange={onChange} placeholder="Camila" required />
          <Input label="Apellidos" id="user-apellidos" name="apellidos" value={form.apellidos} onChange={onChange} placeholder="Gonzalez Perez" required />
          <Input label="Email" id="user-email" name="emailContacto" type="email" value={form.emailContacto} onChange={onChange} placeholder="correo@dominio.cl" required />
          <Input label="Contrasena temporal" id="user-password" name="password" type="password" minLength="6" value={form.password} onChange={onChange} placeholder="Minimo 6 caracteres" required />
          <Input label="Telefono" id="user-telefono" name="telefono" value={form.telefono} onChange={onChange} placeholder="+56 9 1234 5678" />
          <Input label="Fecha nacimiento" id="user-fecha" name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={onChange} required />
          <Input as="select" label="Genero" id="user-genero" name="genero" value={form.genero} onChange={onChange}>
            <option value="">Seleccionar</option>
            <option value="femenino">Femenino</option>
            <option value="masculino">Masculino</option>
            <option value="otro">Otro</option>
            <option value="no_especifica">Prefiere no decir</option>
          </Input>
        </div>
        {formError && <p className="admin-alert">{formError}</p>}
        {error && <p className="admin-alert">{error.message}</p>}
        <div className="admin-modal-actions">
          <Button type="button" variant="ghost" onClick={onClose}><X size={16} /> Cancelar</Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Creando...' : 'Agregar cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function UserDetailModal({ user, onClose, onPromote, isPromoting }) {
  return (
    <Modal open={Boolean(user)} title="Detalle de usuario" onClose={onClose}>
      {user && (
        <div className="admin-detail-modal">
          <div className="admin-detail-hero">
            <div>
              <span>Cliente</span>
              <h3>{fullName(user) || 'Usuario sin nombre'}</h3>
              <p>{user.emailContacto || 'Sin email registrado'}</p>
            </div>
            <AdminStatusBadge status="CLIENTE">Cliente</AdminStatusBadge>
          </div>
          <div className="admin-detail-grid">
            <div><span>RUT</span><strong>{user.rut ? formatRut(user.rut) : 'No disponible'}</strong></div>
            <div><span>Telefono</span><strong>{user.telefono || 'No disponible'}</strong></div>
            <div><span>Genero</span><strong>{user.genero || 'No disponible'}</strong></div>
            <div><span>ID Auth</span><strong>{user.idAuth || 'No disponible'}</strong></div>
          </div>
          <section>
            <h4>Fidelizacion</h4>
            <p>{user.puntosFidelidad ?? 0} puntos acumulados.</p>
          </section>
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
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState('');
  const hasToken = Boolean(window.localStorage.getItem(TOKEN_KEY));

  const clientsQuery = useQuery({ queryKey: CLIENT_CONFIG.listQueryKey, queryFn: CLIENT_CONFIG.listQueryFn, enabled: hasToken });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const payloadWithNormalizedDate = {
        ...payload,
        rut: normalizeRut(payload.rut),
        telefono: payload.telefono ? normalizeChilePhone(payload.telefono) : '',
        fechaNacimiento: normalizeBirthDate(payload.fechaNacimiento),
      };
      await profileService.validateAvailability({ ...payloadWithNormalizedDate, tipoPerfil: 'CLIENTE' });
      const user = await authService.createUser({
        email: payloadWithNormalizedDate.emailContacto,
        password: payloadWithNormalizedDate.password,
        rol: 'CLIENTE',
      });

      const profilePayload = { ...payloadWithNormalizedDate };
      delete profilePayload.password;
      const normalizedPayload = { ...profilePayload, idAuth: user.uid };

      return CLIENT_CONFIG.createProfile(normalizedPayload);
    },
    onSuccess: () => {
      setForm(initialForm);
      setFormError('');
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: CLIENT_CONFIG.listQueryKey });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-snapshot'] });
    },
  });

  const promoteMutation = useMutation({
    mutationFn: async ({ idAuth, rol }) => {
      if (!idAuth) throw new Error('El usuario no tiene una cuenta de Firebase asociada.');
      return authService.assignRole({ uid: idAuth, rol });
    },
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = name === 'rut' ? formatRut(value) : name === 'telefono' ? chilePhoneDigits(value) : value;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : nextValue }));
    setFormError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationMessage = validateClientForm(form);
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }
    setFormError('');
    createMutation.mutate(form);
  };

  const clients = useMemo(() => (Array.isArray(clientsQuery.data) ? clientsQuery.data : []), [clientsQuery.data]);
  const filteredClients = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter((client) => [
      fullName(client),
      client.emailContacto,
      client.email,
      client.telefono,
      client.rut,
      getUserId(client),
    ].filter(Boolean).join(' ').toLowerCase().includes(needle));
  }, [clients, searchTerm]);
  const withEmail = clients.filter((client) => client.emailContacto || client.email).length;
  const missingPhone = clients.filter((client) => !client.telefono).length;

  return (
    <div className="admin-dashboard">
      <AdminPageHeader
        eyebrow="Gestion"
        title="Clientes"
        description="Gestiona perfiles de clientes sin mezclar el flujo de profesionales."
        actions={<Button type="button" size="sm" onClick={() => setCreateOpen(true)}><UserPlus size={16} /> Agregar usuario</Button>}
      />

      <AdminKpiGrid>
        <AdminKpiCard icon={Users} title="Clientes" value={clients.length} trend={0} microcopy="Base de atencion" tone="rose" />
        <AdminKpiCard icon={ShieldCheck} title="Con email" value={withEmail} trend={0} microcopy="Contactables" tone="sage" />
        <AdminKpiCard icon={UserPlus} title="Sin telefono" value={missingPhone} trend={0} microcopy="Datos por completar" tone="gold" />
      </AdminKpiGrid>

      <section className="admin-panel compact-panel">
        <header>
          <div>
            <h3>Directorio</h3>
            <p>Busca por nombre, email, telefono o RUT. Abre una fila para ver acciones.</p>
          </div>
          {searchTerm && <button type="button" className="admin-text-button" onClick={() => setSearchTerm('')}>Limpiar filtros</button>}
        </header>
        <div className="admin-local-filter-grid single">
          <label className="field admin-search-field">
            <span>Buscar cliente</span>
            <div className="admin-filter-search">
              <Search size={16} />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Nombre, email, telefono o RUT" />
            </div>
          </label>
        </div>
      </section>

      {!hasToken ? (
        <p className="admin-alert">Necesitas iniciar sesion con un usuario ADMIN para listar usuarios.</p>
      ) : clientsQuery.isLoading ? (
        <AdminSkeleton rows={5} />
      ) : clientsQuery.isError ? (
        <p className="admin-alert">{clientsQuery.error.message}</p>
      ) : (
        <DataTable
          compact
          onRowClick={(row) => setSelectedUser(row)}
          getRowKey={(row) => getUserId(row)}
          getRowLabel={(row) => `Ver detalle de ${fullName(row) || row.emailContacto || 'usuario'}`}
          columns={[
            { key: 'tipoPerfil', label: 'Tipo', render: () => <AdminStatusBadge status="CLIENTE">Cliente</AdminStatusBadge> },
            { key: 'nombre', label: 'Nombre', render: (row) => fullName(row) || 'Sin nombre' },
            { key: 'emailContacto', label: 'Email', render: (row) => row.emailContacto || 'Sin email' },
            { key: 'telefono', label: 'Telefono', render: (row) => row.telefono || 'Sin telefono' },
            { key: 'rut', label: 'RUT', render: (row) => row.rut ? formatRut(row.rut) : 'Sin RUT' },
            { key: 'puntosFidelidad', label: 'Puntos', render: (row) => row.puntosFidelidad ?? 0 },
          ]}
          rows={filteredClients}
          emptyMessage="No hay clientes para este filtro."
        />
      )}

      <UserCreateModal
        open={createOpen}
        form={form}
        isSaving={createMutation.isPending}
        formError={formError}
        error={createMutation.error}
        onClose={() => {
          setCreateOpen(false);
          setForm(initialForm);
          setFormError('');
        }}
        onSubmit={handleSubmit}
        onChange={handleChange}
      />

      <UserDetailModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onPromote={(row) => promoteMutation.mutate({ idAuth: row.idAuth, rol: 'ADMIN' })}
        isPromoting={promoteMutation.isPending}
      />

      {promoteMutation.isSuccess && <p className="admin-success-alert">Rol ADMIN asignado correctamente.</p>}
      {promoteMutation.isError && <p className="admin-alert">{promoteMutation.error.message}</p>}
    </div>
  );
}
