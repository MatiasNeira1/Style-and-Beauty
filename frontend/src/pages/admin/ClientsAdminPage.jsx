import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { authService } from '../../services/authService.js';
import { TOKEN_KEY } from '../../services/apiClient.js';
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
};

export function ClientsAdminPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const hasToken = Boolean(window.localStorage.getItem(TOKEN_KEY));

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ['profiles-clients'],
    queryFn: profileService.listClients,
    enabled: hasToken,
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const user = await authService.createUser({
        email: payload.emailContacto,
        password: payload.password,
        rol: 'CLIENTE',
      });

      const { password, ...profilePayload } = payload;
      return profileService.createClient({
        ...profilePayload,
        idAuth: user.uid,
      });
    },
    onSuccess: () => {
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ['profiles-clients'] });
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

  const clients = Array.isArray(data) ? data : [];

  return (
    <div className="stack">
      <SectionTitle eyebrow="Admin" title="Clientes">
        Gestiona los perfiles de clientes desde ms-perfiles.
      </SectionTitle>

      <form className="card stack" onSubmit={handleSubmit}>
        <h3>Crear cliente</h3>
        <div className="form-grid">
          <Input label="RUT" id="client-rut" name="rut" value={form.rut} onChange={handleChange} required />
          <Input label="Nombre" id="client-nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
          <Input label="Apellidos" id="client-apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} />
          <Input label="Email" id="client-email" name="emailContacto" type="email" value={form.emailContacto} onChange={handleChange} required />
          <Input label="Contrasena temporal" id="client-password" name="password" type="password" minLength="6" value={form.password} onChange={handleChange} required />
          <Input label="Telefono" id="client-telefono" name="telefono" value={form.telefono} onChange={handleChange} />
          <Input label="Fecha nacimiento" id="client-fecha" name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={handleChange} />
          <Input label="Genero" id="client-genero" name="genero" value={form.genero} onChange={handleChange} />
        </div>
        {createMutation.isError && <p className="admin-alert">{createMutation.error.message}</p>}
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creando...' : 'Crear cliente'}
        </Button>
      </form>

      {!hasToken ? (
        <p className="admin-alert">Necesitas iniciar sesion con un usuario ADMIN o STAFF para listar clientes.</p>
      ) : isLoading ? (
        <Loader />
      ) : isError ? (
        <p className="admin-alert">{error.message}</p>
      ) : (
        <DataTable
          columns={[
            { key: 'nombre', label: 'Cliente', render: (row) => `${row.nombre || ''} ${row.apellidos || ''}`.trim() || 'Sin nombre' },
            { key: 'emailContacto', label: 'Email' },
            { key: 'telefono', label: 'Telefono' },
            { key: 'puntosFidelidad', label: 'Puntos', render: (row) => row.puntosFidelidad ?? 0 },
          ]}
          rows={clients}
        />
      )}
    </div>
  );
}
