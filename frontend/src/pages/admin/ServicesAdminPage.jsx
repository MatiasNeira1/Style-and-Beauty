import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Clock, Edit3, Image as ImageIcon, Save, Scissors, Tag, Trash2, X } from 'lucide-react';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { AdminKpiCard, AdminKpiGrid, AdminPageHeader, AdminSkeleton, AdminStatusBadge } from '../../components/admin/AdminPrimitives.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { SafeImage } from '../../components/ui/SafeImage.jsx';
import { catalogService } from '../../services/catalogService.js';
import { formatCurrencyCLP } from '../../utils/adminFormatters.js';

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

function serviceImage(service) {
  return service.imagenUrl || service.imageUrl || service.imagen_url || service.imagen;
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageError, setImageError] = useState('');

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ['services-admin'],
    queryFn: catalogService.listServices,
  });

  const services = Array.isArray(data) ? data : [];
  const activeServices = services.filter((service) => service.activo !== false);
  const categories = new Set(services.map((service) => service.categoria).filter(Boolean));
  const averagePrice = services.length ? services.reduce((sum, service) => sum + Number(service.precio_total || 0), 0) / services.length : 0;

  useEffect(() => {
    if (!imageFile) return undefined;
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const validateAndSetImage = (file) => {
    setImageError('');
    if (!file) {
      setImageFile(null);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageError('Solo se permiten imagenes JPG, PNG o WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('La imagen no puede superar 5 MB.');
      return;
    }
    setImageFile(file);
  };

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const servicePayload = toServicePayload(payload);
      let savedService;
      if (editingServiceId) {
        savedService = await catalogService.updateService(editingServiceId, servicePayload);
      } else {
        savedService = await catalogService.createService(servicePayload);
      }

      if (imageFile) {
        return catalogService.uploadServiceImage(getServiceId(savedService) || editingServiceId, imageFile);
      }

      return savedService;
    },
    onSuccess: () => {
      setForm(initialForm);
      setEditingServiceId(null);
      setImageFile(null);
      setImagePreview('');
      setImageError('');
      queryClient.invalidateQueries({ queryKey: ['services-admin'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: catalogService.deleteService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services-admin'] }),
  });

  const imageMutation = useMutation({
    mutationFn: ({ serviceId, file }) => catalogService.uploadServiceImage(serviceId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services-admin'] }),
  });

  const deleteImageMutation = useMutation({
    mutationFn: catalogService.deleteServiceImage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services-admin'] }),
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (imageError) return;
    saveMutation.mutate(form);
  };

  const startEditing = (service) => {
    setEditingServiceId(getServiceId(service));
    setImageFile(null);
    setImagePreview(serviceImage(service) || '');
    setImageError('');
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
    setImageFile(null);
    setImagePreview('');
    setImageError('');
  };

  const handleTableImageChange = (service, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    imageMutation.mutate({ serviceId: getServiceId(service), file });
  };

  return (
    <div className="admin-dashboard">
      <AdminPageHeader
        eyebrow="Gestion"
        title="Catalogo de servicios"
        description="Visualiza, crea y edita la oferta de tratamientos disponibles."
      />

      <AdminKpiGrid>
        <AdminKpiCard icon={Scissors} title="Servicios" value={services.length} trend={7} microcopy={`${activeServices.length} activos`} tone="rose" />
        <AdminKpiCard icon={Tag} title="Categorias" value={categories.size} trend={3} microcopy="Oferta segmentada" tone="gold" />
        <AdminKpiCard icon={Clock} title="Duracion media" value={`${Math.round(services.reduce((sum, item) => sum + Number(item.duracion_minutos || 0), 0) / Math.max(services.length, 1))} min`} trend={0} microcopy="Base para agenda" tone="sage" />
        <AdminKpiCard icon={Save} title="Precio promedio" value={formatCurrencyCLP(averagePrice)} trend={5} microcopy="Ticket potencial" tone="ink" />
      </AdminKpiGrid>

      <form className="admin-panel" onSubmit={handleSubmit}>
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
        <div className="admin-image-field">
          <SafeImage src={imagePreview} alt="Imagen del servicio" />
          <label className="button button-ghost button-sm staff-file-button">
            <span className="button-content"><Camera size={14} /> Imagen</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => validateAndSetImage(event.target.files?.[0])} />
          </label>
          {imageError && <p className="admin-alert compact">{imageError}</p>}
        </div>
        {saveMutation.isError && <p className="admin-alert">{saveMutation.error.message}</p>}
        {(imageMutation.isError || deleteImageMutation.isError) && <p className="admin-alert">{imageMutation.error?.message || deleteImageMutation.error?.message}</p>}
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
        <AdminSkeleton rows={5} />
      ) : isError ? (
        <p className="admin-alert">{error.message}</p>
      ) : (
        <DataTable
          columns={[
            {
              key: 'nombre',
              label: 'Servicio',
              render: (row) => (
                <div className="admin-media-cell">
                  <SafeImage src={serviceImage(row)} alt={row.nombre || 'Servicio'} />
                  <div className="flex flex-col">
                    <span className="font-bold text-ink">{row.nombre || 'Servicio sin nombre'}</span>
                    {row.descripcion && <span className="text-xs text-ink-soft font-normal max-w-sm truncate">{row.descripcion}</span>}
                  </div>
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
              render: (row) => formatCurrencyCLP(row.monto_fianza || 0),
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
            { key: 'activo', label: 'Estado', render: (row) => <AdminStatusBadge status={row.activo ? 'ACTIVO' : 'INACTIVO'} /> },
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
                    <label className="button button-ghost button-sm staff-file-button">
                      <span className="button-content"><Camera size={14} /> Imagen</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleTableImageChange(row, event)} />
                    </label>
                    <Button type="button" size="sm" variant="ghost" onClick={() => deleteImageMutation.mutate(serviceId)} disabled={deleteImageMutation.isPending || !serviceImage(row)}>
                      <ImageIcon size={14} />
                      Quitar
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
          emptyMessage="No hay servicios registrados. Crea el primer tratamiento para habilitar la agenda."
        />
      )}
    </div>
  );
}
