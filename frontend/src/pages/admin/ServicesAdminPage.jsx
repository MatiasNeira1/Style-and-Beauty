import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Edit3, Save, Scissors, Trash2, X } from 'lucide-react';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { catalogService } from '../../services/catalogService.js';

const initialForm = {
  nombre: '',
  descripcion: '',
  detallerservicio: '',
  categoria: '',
  manual_uso_url: '',
  duracion_minutos: '',
  holgura_minutos: '',
  precio_total: '',
  monto_fianza: '',
  activo: 'true',

};

function getServiceId(service) {
  return service.id_servicio || service.idServicio || service.id;
}

function toServicePayload(form) {
  return {
    nombre: form.nombre,
    descripcion: form.descripcion,
    detallerservicio: form.detallerservicio,
    categoria: form.categoria,
    manual_uso_url: form.manual_uso_url,
    duracion_minutos: Number(form.duracion_minutos),
    holgura_minutos: form.holgura_minutos === '' ? null : Number(form.holgura_minutos),
    precio_total: Number(form.precio_total),
    monto_fianza: Number(form.monto_fianza),
    activo: form.activo === 'true',
  };
}

export function ServicesAdminPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [editingServiceId, setEditingServiceId] = useState(null);

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ['services-admin'],
    queryFn: catalogService.listServices,
  });

  const services = Array.isArray(data) ? data : [];

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      const servicePayload = toServicePayload(payload);
      if (editingServiceId) {
        return catalogService.updateService(editingServiceId, servicePayload);
      }
      return catalogService.createService(servicePayload);
    },
    onSuccess: () => {
      setForm(initialForm);
      setEditingServiceId(null);
      queryClient.invalidateQueries({ queryKey: ['services-admin'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: catalogService.deleteService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services-admin'] }),
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    saveMutation.mutate(form);
  };

  const startEditing = (service) => {
    setEditingServiceId(getServiceId(service));
    setForm({
      nombre: service.nombre || '',
      descripcion: service.descripcion || '',
      detallerservicio: service.detallerservicio || '',
      categoria: service.categoria || '',
      manual_uso_url: service.manual_uso_url || '',
      duracion_minutos: service.duracion_minutos ?? '',
      holgura_minutos: service.holgura_minutos ?? '',
      precio_total: service.precio_total ?? '',
      monto_fianza: service.monto_fianza ?? '',
      activo: String(service.activo ?? true),
    });
  };

  const cancelEditing = () => {
    setEditingServiceId(null);
    setForm(initialForm);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-primary uppercase">Administracion</span>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight mt-1">Catalogo de Servicios</h1>
          <p className="text-sm text-ink-soft mt-1">Visualiza, crea y edita la oferta de tratamientos disponibles.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-2xl text-primary font-bold text-sm">
          <Scissors size={16} />
          <span>{services.length} Servicios</span>
        </div>
      </div>

      <form className="card stack" onSubmit={handleSubmit}>
        <h3>{editingServiceId ? 'Editar servicio' : 'Crear servicio'}</h3>
        <div className="form-grid">
          <Input label="Nombre" id="service-name" name="nombre" value={form.nombre} onChange={handleChange} required />
          <Input label="Categoria" id="service-category" name="categoria" value={form.categoria} onChange={handleChange} />
          <Input label="Duracion minutos" id="service-duration" name="duracion_minutos" type="number" min="1" value={form.duracion_minutos} onChange={handleChange} required />
          <Input label="Holgura minutos" id="service-buffer" name="holgura_minutos" type="number" min="0" value={form.holgura_minutos} onChange={handleChange} />
          <Input label="Precio total" id="service-price" name="precio_total" type="number" min="0" step="100" value={form.precio_total} onChange={handleChange} required />
          <Input label="Monto fianza" id="service-deposit" name="monto_fianza" type="number" min="0" step="100" value={form.monto_fianza} onChange={handleChange} required />
          <Input as="select" label="Estado" id="service-active" name="activo" value={form.activo} onChange={handleChange}>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </Input>
          <Input label="Manual de uso URL" id="service-manual" name="manual_uso_url" value={form.manual_uso_url} onChange={handleChange} />
          <Input label="Descripcion" id="service-description" name="descripcion" value={form.descripcion} onChange={handleChange} />
          <Input label="Detalles del servicio" id="service-details" name="detallerservicio" value={form.detallerservicio} onChange={handleChange} />
        </div>
        {saveMutation.isError && <p className="admin-alert">{saveMutation.error.message}</p>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saveMutation.isPending}>
            <Save size={16} />
            {saveMutation.isPending ? 'Guardando...' : editingServiceId ? 'Guardar cambios' : 'Crear servicio'}
          </Button>
          {editingServiceId && (
            <Button type="button" variant="ghost" onClick={cancelEditing}>
              <X size={16} />
              Cancelar
            </Button>
          )}
        </div>
      </form>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : isError ? (
        <p className="admin-alert">{error.message}</p>
      ) : (
        <DataTable
          columns={[
            {
              key: 'nombre',
              label: 'Servicio',
              render: (row) => (
                <div className="flex flex-col">
                  <span className="font-bold text-ink">{row.nombre || 'Servicio sin nombre'}</span>
                  {row.descripcion && <span className="text-xs text-ink-soft font-normal max-w-sm truncate">{row.descripcion}</span>}
                </div>
              ),
            },
            { key: 'categoria', label: 'Categoria', render: (row) => row.categoria || 'Sin categoria' },
            {
              key: 'precio_total',
              label: 'Precio',
              render: (row) => (
                <span className="text-ink font-bold">
                  {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(row.precio_total || 0)}
                </span>
              ),
            },
            {
              key: 'monto_fianza',
              label: 'Fianza',
              render: (row) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(row.monto_fianza || 0),
            },
            {
              key: 'detallerservicio',
              label: 'Detalles',
              render: (row) => (
                <span className="text-xs text-ink-soft font-normal">
                  {row.detallerservicio || 'Sin detalles'}
                </span>
              ),
            },
            {
              key: 'duracion_minutos',
              label: 'Duracion',
              render: (row) => (
                <div className="flex items-center gap-1.5 text-xs text-ink-soft font-bold">
                  <Clock size={14} className="text-primary" />
                  <span>{row.duracion_minutos || 0} mins</span>
                </div>
              ),
            },
            {
              key: 'holgura_minutos',
              label: 'Holgura',
              render: (row) => (
                <div className="flex items-center gap-1.5 text-xs text-ink-soft font-bold">
                  <Clock size={14} className="text-primary" />
                  <span>{row.holgura_minutos ?? 0} mins</span>
                </div>
              ),
            },
            { key: 'activo', label: 'Estado', render: (row) => (row.activo ? 'Activo' : 'Inactivo') },
            {
              key: 'acciones',
              label: 'Acciones',
              render: (row) => {
                const serviceId = getServiceId(row);
                return (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="ghost" onClick={() => startEditing(row)}>
                      <Edit3 size={14} />
                      Editar
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => deleteMutation.mutate(serviceId)} disabled={deleteMutation.isPending}>
                      <Trash2 size={14} />
                      Eliminar
                    </Button>
                  </div>
                );
              },
            },
          ]}
          rows={services}
        />
      )}
    </div>
  );
}
