import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Edit3, Plus, Save, Scissors, Tag, Trash2, Users, X } from 'lucide-react';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { AdminEmptyState, AdminKpiCard, AdminKpiGrid, AdminPageHeader, AdminSkeleton, AdminStatusBadge } from '../../components/admin/AdminPrimitives.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { catalogService } from '../../services/catalogService.js';
import { profileService } from '../../services/profileService.js';
import { formatCurrencyCLP, fullName } from '../../utils/adminFormatters.js';

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

function getStaffId(staff) {
  return staff.idPersona || staff.idStaff || staff.id;
}

function toServicePayload(form) {
  return {
    nombre: form.nombre.trim(),
    descripcion: form.descripcion?.trim() || '',
    detallerservicio: form.detallerservicio?.trim() || '',
    categoria: form.categoria.trim(),
    manual_uso_url: form.manual_uso_url?.trim() || '',
    duracion_minutos: Number(form.duracion_minutos),
    holgura_minutos: form.holgura_minutos === '' ? null : Number(form.holgura_minutos),
    precio_total: Number(form.precio_total),
    monto_fianza: form.monto_fianza === '' ? 0 : Number(form.monto_fianza),
    activo: form.activo === 'true',
  };
}

function formFromService(service) {
  return {
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
  };
}

function selectedStaffNames(staff, ids) {
  const idSet = new Set(ids.map(String));
  return staff
    .filter((member) => idSet.has(String(getStaffId(member))))
    .map((member) => fullName(member) || member.emailContacto || 'Profesional');
}

function ServiceFormModal({
  open,
  mode,
  form,
  step,
  onStepChange,
  onClose,
  onSubmit,
  onChange,
  staff,
  selectedStaffIds,
  onToggleStaff,
  categories,
  isSaving,
  error,
}) {
  const title = mode === 'edit' ? 'Editar servicio' : 'Agregar servicio';
  const canGoInfo = Boolean(form.categoria);
  const canGoStaff = Boolean(
    form.nombre
    && form.categoria
    && Number(form.duracion_minutos) > 0
    && Number(form.precio_total) >= 0
  );
  const canSave = canGoStaff && selectedStaffIds.length > 0;

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form className="admin-modal-form" onSubmit={onSubmit}>
        <div className="admin-modal-steps" aria-label="Pasos del servicio">
          {['Categoria', 'Informacion', 'Profesionales'].map((label, index) => (
            <button
              key={label}
              type="button"
              className={step === index + 1 ? 'active' : ''}
              onClick={() => onStepChange(index + 1)}
              disabled={(index + 1 === 2 && !canGoInfo) || (index + 1 === 3 && !canGoStaff)}
            >
              {index + 1}. {label}
            </button>
          ))}
        </div>

        {step === 1 && (
          <div className="admin-modal-section">
            <p className="admin-modal-hint">Selecciona primero la categoria para ordenar el formulario y la asignacion operativa.</p>
            <Input
              as="select"
              label="Categoria"
              id="service-category"
              name="categoria"
              value={form.categoria}
              onChange={onChange}
              required
            >
              <option value="">Seleccionar categoria</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              {!categories.includes(form.categoria) && form.categoria && <option value={form.categoria}>{form.categoria}</option>}
            </Input>
            <Input label="Nueva categoria" id="service-category-new" name="categoria" value={form.categoria} onChange={onChange} placeholder="Ej. Facial premium" />
          </div>
        )}

        {step === 2 && (
          <div className="admin-modal-section form-grid">
            <Input label="Nombre" id="service-name" name="nombre" value={form.nombre} onChange={onChange} required />
            <Input label="Duracion minutos" id="service-duration" name="duracion_minutos" type="number" min="1" value={form.duracion_minutos} onChange={onChange} required />
            <Input label="Holgura minutos" id="service-buffer" name="holgura_minutos" type="number" min="0" value={form.holgura_minutos} onChange={onChange} />
            <Input label="Precio total" id="service-price" name="precio_total" type="number" min="0" step="100" value={form.precio_total} onChange={onChange} required />
            <Input label="Monto fianza" id="service-deposit" name="monto_fianza" type="number" min="0" step="100" value={form.monto_fianza} onChange={onChange} />
            <Input as="select" label="Estado" id="service-active" name="activo" value={form.activo} onChange={onChange}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </Input>
            <Input label="Manual URL" id="service-manual" name="manual_uso_url" value={form.manual_uso_url} onChange={onChange} />
            <Input label="Descripcion" id="service-description" name="descripcion" value={form.descripcion} onChange={onChange} />
            <Input label="Detalles del servicio" id="service-details" name="detallerservicio" value={form.detallerservicio} onChange={onChange} />
          </div>
        )}

        {step === 3 && (
          <div className="admin-modal-section">
            <p className="admin-modal-hint">Selecciona al menos un profesional. Esta asociacion alimenta la reserva publica por servicio.</p>
            <div className="admin-check-list">
              {staff.length ? staff.map((member) => {
                const id = getStaffId(member);
                const checked = selectedStaffIds.map(String).includes(String(id));
                return (
                  <label key={id}>
                    <input type="checkbox" checked={checked} onChange={() => onToggleStaff(id)} />
                    <span>
                      <strong>{fullName(member) || 'Profesional'}</strong>
                      <small>{member.especialidad?.nombre || member.emailContacto || 'Sin especialidad'}</small>
                    </span>
                  </label>
                );
              }) : (
                <AdminEmptyState compact title="Sin profesionales disponibles" description="Crea profesionales antes de asociarlos a servicios." />
              )}
            </div>
          </div>
        )}

        {error && <p className="admin-alert">{error.message}</p>}

        <div className="admin-modal-actions">
          <Button type="button" variant="ghost" onClick={onClose}><X size={16} /> Cancelar</Button>
          {step > 1 && <Button type="button" variant="ghost" onClick={() => onStepChange(step - 1)}>Volver</Button>}
          {step < 3 ? (
            <Button type="button" onClick={() => onStepChange(step + 1)} disabled={(step === 1 && !canGoInfo) || (step === 2 && !canGoStaff)}>
              Continuar
            </Button>
          ) : (
            <Button type="submit" disabled={!canSave || isSaving}>
              <Save size={16} />
              {isSaving ? 'Guardando...' : 'Guardar servicio'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

function ServiceDetailModal({ service, staff, relations = [], onClose, onEdit, onDelete, isDeleting }) {
  const serviceId = service ? getServiceId(service) : null;
  const relatedIds = relations.map((relation) => relation.idStaff);
  const names = selectedStaffNames(staff, relatedIds);

  return (
    <Modal open={Boolean(service)} title="Detalle del servicio" onClose={onClose}>
      {service && (
        <div className="admin-detail-modal">
          <div className="admin-detail-hero">
            <div>
              <span>{service.categoria || 'Sin categoria'}</span>
              <h3>{service.nombre || 'Servicio sin nombre'}</h3>
              <p>{service.descripcion || 'Sin descripcion registrada.'}</p>
            </div>
            <AdminStatusBadge status={service.activo === false ? 'INACTIVO' : 'ACTIVO'} />
          </div>
          <div className="admin-detail-grid">
            <div><span>Precio</span><strong>{formatCurrencyCLP(service.precio_total || 0)}</strong></div>
            <div><span>Fianza</span><strong>{formatCurrencyCLP(service.monto_fianza || 0)}</strong></div>
            <div><span>Duracion</span><strong>{service.duracion_minutos || 0} min</strong></div>
            <div><span>Holgura</span><strong>{service.holgura_minutos ?? 0} min</strong></div>
          </div>
          <section>
            <h4>Detalles</h4>
            <p>{service.detallerservicio || 'Sin detalles adicionales.'}</p>
          </section>
          <section>
            <h4>Profesionales asociados</h4>
            {names.length ? (
              <div className="admin-chip-row">{names.map((name) => <span key={name}>{name}</span>)}</div>
            ) : (
              <p>No hay profesionales asociados a este servicio.</p>
            )}
          </section>
          <div className="admin-modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>Cerrar</Button>
            <Button type="button" variant="ghost" onClick={() => onEdit(service)}><Edit3 size={16} /> Editar</Button>
            <Button type="button" variant="ghost" onClick={() => onDelete(serviceId)} disabled={isDeleting}><Trash2 size={16} /> Eliminar</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function ServicesAdminPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [modalStep, setModalStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);

  const servicesQuery = useQuery({ queryKey: ['services-admin'], queryFn: catalogService.listServices });
  const staffQuery = useQuery({ queryKey: ['profiles-staff'], queryFn: profileService.listStaff });
  const detailRelationsQuery = useQuery({
    queryKey: ['service-staff-relations', getServiceId(selectedService || editingService || {})],
    queryFn: () => catalogService.listCatalogStaffByService(getServiceId(selectedService || editingService)),
    enabled: Boolean(getServiceId(selectedService || editingService || {})),
  });

  const services = useMemo(() => (Array.isArray(servicesQuery.data) ? servicesQuery.data : []), [servicesQuery.data]);
  const staff = useMemo(() => (Array.isArray(staffQuery.data) ? staffQuery.data : []), [staffQuery.data]);
  const relations = useMemo(() => (Array.isArray(detailRelationsQuery.data) ? detailRelationsQuery.data : []), [detailRelationsQuery.data]);
  const activeServices = services.filter((service) => service.activo !== false);
  const categories = useMemo(() => [...new Set(services.map((service) => service.categoria).filter(Boolean))].sort(), [services]);

  useEffect(() => {
    if (modalOpen && modalMode === 'edit' && relations.length) {
      setSelectedStaffIds(relations.map((relation) => relation.idStaff).filter(Boolean));
    }
  }, [modalMode, modalOpen, relations]);

  const resetModal = () => {
    setModalOpen(false);
    setModalMode('create');
    setModalStep(1);
    setEditingService(null);
    setForm(initialForm);
    setSelectedStaffIds([]);
  };

  const openCreate = () => {
    setSelectedService(null);
    setForm(initialForm);
    setSelectedStaffIds([]);
    setModalMode('create');
    setModalStep(1);
    setModalOpen(true);
  };

  const openEdit = (service) => {
    setSelectedService(null);
    setEditingService(service);
    setForm(formFromService(service));
    setSelectedStaffIds([]);
    setModalMode('edit');
    setModalStep(1);
    setModalOpen(true);
  };

  const syncStaffAssignments = async (serviceId, nextStaffIds) => {
    const currentRelations = await catalogService.listCatalogStaffByService(serviceId);
    const currentIds = new Set((Array.isArray(currentRelations) ? currentRelations : []).map((relation) => String(relation.idStaff)));
    const nextIds = new Set(nextStaffIds.map(String));

    await Promise.all([
      ...[...nextIds]
        .filter((idStaff) => !currentIds.has(idStaff))
        .map((idStaff) => catalogService.assignStaffToService(serviceId, idStaff)),
      ...[...currentIds]
        .filter((idStaff) => !nextIds.has(idStaff))
        .map((idStaff) => catalogService.removeStaffFromService(serviceId, idStaff)),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = toServicePayload(form);
      const savedService = modalMode === 'edit'
        ? await catalogService.updateService(getServiceId(editingService), payload)
        : await catalogService.createService(payload);
      const serviceId = getServiceId(savedService) || getServiceId(editingService);
      await syncStaffAssignments(serviceId, selectedStaffIds);
      return savedService;
    },
    onSuccess: () => {
      resetModal();
      queryClient.invalidateQueries({ queryKey: ['services-admin'] });
      queryClient.invalidateQueries({ queryKey: ['service-staff-relations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-snapshot'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: catalogService.deleteService,
    onSuccess: () => {
      setSelectedService(null);
      queryClient.invalidateQueries({ queryKey: ['services-admin'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-snapshot'] });
    },
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const toggleStaff = (idStaff) => {
    setSelectedStaffIds((current) => (
      current.map(String).includes(String(idStaff))
        ? current.filter((id) => String(id) !== String(idStaff))
        : [...current, idStaff]
    ));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    saveMutation.mutate();
  };

  return (
    <div className="admin-dashboard">
      <AdminPageHeader
        eyebrow="Gestion"
        title="Catalogo de servicios"
        description="Administra tratamientos y los profesionales habilitados para realizarlos."
        actions={<Button type="button" size="sm" onClick={openCreate}><Plus size={16} /> Agregar servicio</Button>}
      />

      <AdminKpiGrid>
        <AdminKpiCard icon={Scissors} title="Servicios" value={services.length} trend={0} microcopy={`${activeServices.length} activos`} tone="rose" />
        <AdminKpiCard icon={Tag} title="Categorias" value={categories.length} trend={0} microcopy="Oferta segmentada" tone="gold" />
        <AdminKpiCard icon={Clock} title="Duracion media" value={`${Math.round(services.reduce((sum, item) => sum + Number(item.duracion_minutos || 0), 0) / Math.max(services.length, 1))} min`} trend={0} microcopy="Base para agenda" tone="sage" />
        <AdminKpiCard icon={Users} title="Equipo disponible" value={staff.length} trend={0} microcopy="Profesionales reales" tone="ink" />
      </AdminKpiGrid>

      {servicesQuery.isLoading ? (
        <AdminSkeleton rows={5} />
      ) : servicesQuery.isError ? (
        <p className="admin-alert">{servicesQuery.error.message}</p>
      ) : (
        <DataTable
          compact
          onRowClick={(service) => setSelectedService(service)}
          getRowKey={(service) => getServiceId(service)}
          getRowLabel={(service) => `Ver detalle de ${service.nombre || 'servicio'}`}
          columns={[
            {
              key: 'nombre',
              label: 'Servicio',
              render: (row) => (
                <div className="admin-table-main-cell">
                  <strong>{row.nombre || 'Servicio sin nombre'}</strong>
                  <span>{row.descripcion || row.detallerservicio || 'Sin descripcion'}</span>
                </div>
              ),
            },
            { key: 'categoria', label: 'Categoria', render: (row) => row.categoria || 'Sin categoria' },
            { key: 'duracion_minutos', label: 'Duracion', render: (row) => `${row.duracion_minutos || 0} min` },
            { key: 'precio_total', label: 'Precio', render: (row) => formatCurrencyCLP(row.precio_total || 0) },
            { key: 'activo', label: 'Estado', render: (row) => <AdminStatusBadge status={row.activo === false ? 'INACTIVO' : 'ACTIVO'} /> },
          ]}
          rows={services}
          emptyMessage="No hay servicios registrados. Agrega un servicio y asocialo a profesionales para habilitar reservas."
        />
      )}

      <ServiceFormModal
        open={modalOpen}
        mode={modalMode}
        form={form}
        step={modalStep}
        onStepChange={setModalStep}
        onClose={resetModal}
        onSubmit={handleSubmit}
        onChange={handleChange}
        staff={staff}
        selectedStaffIds={selectedStaffIds}
        onToggleStaff={toggleStaff}
        categories={categories}
        isSaving={saveMutation.isPending}
        error={saveMutation.error}
      />

      <ServiceDetailModal
        service={selectedService}
        staff={staff}
        relations={relations}
        onClose={() => setSelectedService(null)}
        onEdit={openEdit}
        onDelete={(serviceId) => deleteMutation.mutate(serviceId)}
        isDeleting={deleteMutation.isPending}
      />

      {saveMutation.isError && !modalOpen && <p className="admin-alert">{saveMutation.error.message}</p>}
      {deleteMutation.isError && <p className="admin-alert">{deleteMutation.error.message}</p>}
      {!servicesQuery.isLoading && !services.length && (
        <AdminEmptyState compact title="Catalogo vacio" description="Usa Agregar servicio para crear el primer tratamiento." />
      )}
    </div>
  );
}
