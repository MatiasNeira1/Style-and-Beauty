import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Camera, Eye, Image, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { AdminPagination } from '../../components/admin/AdminPagination.jsx';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { AdminKpiCard, AdminKpiGrid, AdminPageHeader, AdminSkeleton } from '../../components/admin/AdminPrimitives.jsx';
import { StaffDeleteDialog } from '../../components/admin/staff/StaffDeleteDialog.jsx';
import { StaffFormModal } from '../../components/admin/staff/StaffFormModal.jsx';
import { StaffPortfolioGallery } from '../../components/admin/staff/StaffPortfolioGallery.jsx';
import { StaffProfileCard } from '../../components/admin/staff/StaffProfileCard.jsx';
import { StaffWorkSchedule } from '../../components/admin/staff/StaffWorkSchedule.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { SafeImage } from '../../components/ui/SafeImage.jsx';
import { compareNewestByFields, useAdminPagination } from '../../hooks/useAdminPagination.js';
import { authService } from '../../services/authService.js';
import { STAFF_QUERY_OPTIONS, staffService } from '../../services/staffService.js';

const TABS = {
  PROFILE: 'profile',
  SCHEDULE: 'schedule',
  PORTFOLIO: 'portfolio',
};

function getStaffId(staff) {
  return staff?.idStaff || staff?.idPersona || staff?.id;
}

function staffFullName(staff) {
  return `${staff?.nombre || ''} ${staff?.apellidos || ''}`.trim() || 'Sin nombre';
}

function staffPhoto(staff) {
  return staff?.fotoUrl || staff?.imageUrl || staff?.foto;
}

function staffSpecialty(staff) {
  return staff?.especialidad?.nombre || staff?.especialidad || staff?.nombreEspecialidad || 'Sin asignar';
}

function normalizeText(value = '') {
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function summaryValue(isLoading, isError, value) {
  if (isLoading) return '...';
  if (isError || value == null) return 'N/D';
  return value;
}

export function StaffAdminPage() {
  const queryClient = useQueryClient();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.PROFILE);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffStatusFilter, setStaffStatusFilter] = useState('TODOS');

  const selectedStaffId = getStaffId(selectedStaff);
  const staffQuery = useQuery({ queryKey: ['staff-list'], queryFn: staffService.listStaff, ...STAFF_QUERY_OPTIONS });
  const summaryQuery = useQuery({ queryKey: ['staff-summary'], queryFn: staffService.getStaffSummary, ...STAFF_QUERY_OPTIONS });
  const specialtiesQuery = useQuery({ queryKey: ['staff-specialties'], queryFn: staffService.listSpecialties, ...STAFF_QUERY_OPTIONS });
  const selectedStaffDetailQuery = useQuery({
    queryKey: ['staff-detail', selectedStaffId],
    queryFn: () => staffService.getStaffById(selectedStaffId),
    enabled: Boolean(staffService.isValidUuid(selectedStaffId)),
    ...STAFF_QUERY_OPTIONS,
  });
  const scheduleQuery = useQuery({
    queryKey: ['staff-schedules', selectedStaffId],
    queryFn: () => staffService.listSchedules(selectedStaffId),
    enabled: Boolean(activeTab === TABS.SCHEDULE && staffService.isValidUuid(selectedStaffId)),
    ...STAFF_QUERY_OPTIONS,
  });
  const portfolioQuery = useQuery({
    queryKey: ['staff-portfolio', selectedStaffId],
    queryFn: () => staffService.listPortfolio(selectedStaffId),
    enabled: Boolean(activeTab === TABS.PORTFOLIO && staffService.isValidUuid(selectedStaffId)),
    ...STAFF_QUERY_OPTIONS,
  });
  const staff = useMemo(() => (Array.isArray(staffQuery.data) ? staffQuery.data : []), [staffQuery.data]);
  const selectedStaffDetail = useMemo(() => {
    if (!selectedStaff) return null;
    return selectedStaffDetailQuery.data ? { ...selectedStaff, ...selectedStaffDetailQuery.data } : selectedStaff;
  }, [selectedStaff, selectedStaffDetailQuery.data]);

  const invalidateStaff = () => {
    queryClient.invalidateQueries({ queryKey: ['staff-list'] });
    queryClient.invalidateQueries({ queryKey: ['staff-summary'] });
    queryClient.invalidateQueries({ queryKey: ['staff-detail'] });
    queryClient.invalidateQueries({ queryKey: ['professionals-public'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard-snapshot'] });
  };

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { fotoFile, password, sinImagenPorAhora, ...profilePayload } = payload;
      const user = await authService.createUser({
        email: payload.emailContacto,
        password,
        rol: 'STAFF',
      });
      const createdStaff = await staffService.createStaff({
        ...profilePayload,
        sinImagenPorAhora: Boolean(sinImagenPorAhora || fotoFile),
        idAuth: user.uid || user.idAuth || user.id,
        idEspecialidad: Number(profilePayload.idEspecialidad),
        experienciaAnios: profilePayload.experienciaAnios ? Number(profilePayload.experienciaAnios) : null,
      });

      if (fotoFile) {
        return staffService.uploadStaffPhoto(getStaffId(createdStaff), fotoFile);
      }

      return createdStaff;
    },
    onSuccess: () => {
      setShowFormModal(false);
      invalidateStaff();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ idAuth, staffId, data }) => {
      const { fotoFile, sinImagenPorAhora, ...profilePayload } = data;
      const updatedStaff = await staffService.updateStaff(idAuth, {
        ...profilePayload,
        sinImagenPorAhora: Boolean(sinImagenPorAhora),
        idEspecialidad: Number(profilePayload.idEspecialidad),
        experienciaAnios: profilePayload.experienciaAnios ? Number(profilePayload.experienciaAnios) : null,
      });

      if (fotoFile) {
        return staffService.uploadStaffPhoto(staffId || getStaffId(updatedStaff), fotoFile);
      }

      return updatedStaff;
    },
    onSuccess: (updatedStaff) => {
      setShowFormModal(false);
      setEditingStaff(null);
      setSelectedStaff((current) => (getStaffId(current) === getStaffId(updatedStaff) ? { ...current, ...updatedStaff } : current));
      invalidateStaff();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (staff) => staffService.deleteStaff(staff.idAuth),
    onSuccess: () => {
      setStaffToDelete(null);
      setSelectedStaff(null);
      invalidateStaff();
    },
  });

  const staffPhotoMutation = useMutation({
    mutationFn: ({ staffId, file }) => staffService.uploadStaffPhoto(staffId, file),
    onSuccess: (updatedStaff) => {
      setSelectedStaff((current) => (getStaffId(current) === getStaffId(updatedStaff) ? { ...current, ...updatedStaff } : current));
      invalidateStaff();
    },
  });

  const deleteStaffPhotoMutation = useMutation({
    mutationFn: (staffId) => staffService.deleteStaffPhoto(staffId),
    onSuccess: (updatedStaff) => {
      setSelectedStaff((current) => (getStaffId(current) === getStaffId(updatedStaff) ? { ...current, ...updatedStaff } : current));
      invalidateStaff();
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: (jornadas) => staffService.saveSchedules(selectedStaffId, jornadas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-schedules', selectedStaffId] });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: (file) => staffService.uploadPortfolioImage(selectedStaffId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-portfolio', selectedStaffId] });
      queryClient.invalidateQueries({ queryKey: ['staff-detail', selectedStaffId] });
      invalidateStaff();
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId) => staffService.deletePortfolioImage(selectedStaffId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-portfolio', selectedStaffId] });
      queryClient.invalidateQueries({ queryKey: ['staff-detail', selectedStaffId] });
      invalidateStaff();
    },
  });

  const handleFormSubmit = (data, isEdit) => {
    if (isEdit && editingStaff) {
      return updateMutation.mutateAsync({ idAuth: editingStaff.idAuth, staffId: getStaffId(editingStaff), data });
    } else {
      return createMutation.mutateAsync(data);
    }
  };

  const handlePhotoChange = (staffMember, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    staffPhotoMutation.mutate({ staffId: getStaffId(staffMember), file });
  };

  const handleUpload = useCallback((file) => uploadImageMutation.mutateAsync(file), [uploadImageMutation]);
  const handleDeleteImage = useCallback((imageId) => deleteImageMutation.mutate(imageId), [deleteImageMutation]);

  const specialties = useMemo(() => (Array.isArray(specialtiesQuery.data) ? specialtiesQuery.data : []), [specialtiesQuery.data]);
  const schedules = useMemo(() => (Array.isArray(scheduleQuery.data) ? scheduleQuery.data : []), [scheduleQuery.data]);
  const portfolio = useMemo(() => (Array.isArray(portfolioQuery.data) ? portfolioQuery.data : []), [portfolioQuery.data]);
  const staffSummary = summaryQuery.data || {};
  const filteredStaff = useMemo(() => {
    const needle = normalizeText(staffSearch.trim());
    return staff.filter((member) => {
      const haystack = [
        staffFullName(member),
        member.emailContacto,
        member.telefono,
        staffSpecialty(member),
      ].map(normalizeText).join(' ');
      const matchesSearch = needle ? haystack.includes(needle) : true;
      const matchesStatus = staffStatusFilter === 'TODOS'
        ? true
        : staffStatusFilter === 'ACTIVO'
          ? member.activo !== false
          : member.activo === false;
      return matchesSearch && matchesStatus;
    }).sort(compareNewestByFields(
      ['createdAt', 'created_at', 'fechaCreacion', 'fecha_creacion', 'fechaRegistro', 'updatedAt', 'updated_at', 'fechaActualizacion', 'fecha_actualizacion'],
      getStaffId,
    ));
  }, [staff, staffSearch, staffStatusFilter]);
  const hasActiveStaffFilters = staffSearch || staffStatusFilter !== 'TODOS';
  const staffPagination = useAdminPagination(
    filteredStaff,
    `${staffSearch}|${staffStatusFilter}`,
  );

  const columns = [
    {
      key: 'nombre',
      label: 'Profesional',
      render: (row) => {
        const name = staffFullName(row);
        const initials = name.split(' ').slice(0, 2).map((word) => word[0]).join('').toUpperCase();
        return (
          <div className="admin-staff-cell">
            <div className="staff-avatar admin-staff-avatar">
              {staffPhoto(row) ? <SafeImage src={staffPhoto(row)} alt={name} /> : initials}
            </div>
            <div>
              <span>{name}</span>
              <small>{staffSpecialty(row)}</small>
            </div>
          </div>
        );
      },
    },
    {
      key: 'experienciaAnios',
      label: 'Experiencia',
      render: (row) => row.experienciaAnios ? `${row.experienciaAnios} años` : 'Sin dato',
    },
    {
      key: 'especialidad',
      label: 'Especialidad',
      render: (row) => <Badge tone="primary">{staffSpecialty(row)}</Badge>,
    },
    {
      key: 'activo',
      label: 'Estado',
      render: (row) => <Badge tone={row.activo === false ? 'neutral' : 'success'}>{row.activo === false ? 'Inactivo' : 'Activo'}</Badge>,
    },
  ];

  return (
    <div className="admin-dashboard">
      <AdminPageHeader
        eyebrow="Gestion"
        title="Equipo profesional"
        description="Gestiona perfiles, jornadas laborales y portfolio de trabajos realizados."
        actions={(
          <Button
            onClick={() => {
              setEditingStaff(null);
              setShowFormModal(true);
            }}
            size="sm"
          >
            <Plus size={16} />
            Agregar profesional
          </Button>
        )}
      />

      <AdminKpiGrid>
        <AdminKpiCard icon={Users} title="Profesionales" value={summaryValue(summaryQuery.isLoading, summaryQuery.isError, staffSummary.total)} trend={0} microcopy="Perfiles registrados" tone="rose" />
        <AdminKpiCard icon={CalendarClock} title="Activos" value={summaryValue(summaryQuery.isLoading, summaryQuery.isError, staffSummary.activos)} trend={0} microcopy="Profesionales disponibles en el sistema" tone="sage" />
        <AdminKpiCard icon={Image} title="Portfolio" value={summaryValue(summaryQuery.isLoading, summaryQuery.isError, staffSummary.conPortfolio)} trend={0} microcopy="Profesionales con trabajos visibles" tone="gold" />
      </AdminKpiGrid>

      {(createMutation.isError || updateMutation.isError || deleteMutation.isError || staffPhotoMutation.isError || deleteStaffPhotoMutation.isError) && (
        <p className="admin-alert">
          {createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message || staffPhotoMutation.error?.message || deleteStaffPhotoMutation.error?.message}
        </p>
      )}

      <section className="admin-panel compact-panel">
        <header>
          <div>
            <h3>Busqueda y filtros</h3>
            <p>Busca por nombre o especialidad.</p>
          </div>
          {hasActiveStaffFilters && (
            <button
              type="button"
              className="admin-text-button"
              onClick={() => {
                setStaffSearch('');
                setStaffStatusFilter('TODOS');
              }}
            >
              Limpiar filtros
            </button>
          )}
        </header>
        <div className="admin-local-filter-grid">
          <label className="field admin-search-field">
            <span>Buscar</span>
            <div className="admin-filter-search">
              <Search size={16} />
              <input value={staffSearch} onChange={(event) => setStaffSearch(event.target.value)} placeholder="Nombre o especialidad" />
            </div>
          </label>
          <Input as="select" label="Estado" id="staff-status-filter" value={staffStatusFilter} onChange={(event) => setStaffStatusFilter(event.target.value)}>
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </Input>
        </div>
      </section>

      {staffQuery.isLoading ? (
        <AdminSkeleton rows={5} />
      ) : staffQuery.isError ? (
        <p className="admin-alert">{staffQuery.error.message}</p>
      ) : (
        <div className="admin-paginated-section">
          <DataTable
            compact
            columns={columns}
            rows={staffPagination.paginatedItems}
            emptyMessage={hasActiveStaffFilters ? 'No encontramos resultados con los filtros seleccionados.' : 'No hay profesionales registrados.'}
            onRowClick={(row) => { setSelectedStaff(row); setActiveTab(TABS.PROFILE); }}
            getRowKey={(row) => getStaffId(row)}
            getRowLabel={(row) => `Ver detalle de ${staffFullName(row)}`}
          />
          <AdminPagination
            page={staffPagination.page}
            pageSize={staffPagination.pageSize}
            totalItems={staffPagination.totalItems}
            itemLabel="profesionales"
            onPageChange={staffPagination.setPage}
          />
        </div>
      )}

      <Modal open={Boolean(selectedStaff)} title="Detalle profesional" onClose={() => setSelectedStaff(null)}>
        {selectedStaff && (
          <div className="stack staff-profile-drawer modal-detail-panel">
            <div className="staff-tabs">
              <button type="button" className={`staff-tab ${activeTab === TABS.PROFILE ? 'active' : ''}`} onClick={() => setActiveTab(TABS.PROFILE)}>
                <Eye size={13} /> Perfil
              </button>
              <button type="button" className={`staff-tab ${activeTab === TABS.SCHEDULE ? 'active' : ''}`} onClick={() => setActiveTab(TABS.SCHEDULE)}>
                <CalendarClock size={13} /> Jornada
              </button>
              <button type="button" className={`staff-tab ${activeTab === TABS.PORTFOLIO ? 'active' : ''}`} onClick={() => setActiveTab(TABS.PORTFOLIO)}>
                <Image size={13} /> Portfolio
              </button>
            </div>

            <div className="staff-detail-actions">
              <Button type="button" size="sm" variant="ghost" onClick={() => { setEditingStaff(selectedStaffDetail); setShowFormModal(true); }} disabled={selectedStaffDetailQuery.isLoading || !selectedStaffDetail?.idAuth}>
                <Pencil size={14} /> Editar
              </Button>
              <label className="button button-ghost button-sm staff-file-button">
                <span className="button-content"><Camera size={14} /> Cambiar foto</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handlePhotoChange(selectedStaffDetail, event)} />
              </label>
              <Button type="button" size="sm" variant="ghost" onClick={() => deleteStaffPhotoMutation.mutate(selectedStaffId)} disabled={deleteStaffPhotoMutation.isPending || !staffPhoto(selectedStaffDetail)}>
                <Image size={14} /> Eliminar foto
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setStaffToDelete(selectedStaffDetail)} disabled={selectedStaffDetailQuery.isLoading || !selectedStaffDetail?.idAuth}>
                <Trash2 size={14} /> Eliminar
              </Button>
            </div>

            {selectedStaffDetailQuery.isError && <p className="admin-alert">No fue posible cargar el detalle del profesional.</p>}
            {activeTab === TABS.PROFILE && <StaffProfileCard staff={selectedStaffDetail} />}
            {activeTab === TABS.SCHEDULE && (
              <StaffWorkSchedule
                schedules={schedules}
                onSave={(jornadas) => scheduleMutation.mutate(jornadas)}
                isSaving={scheduleMutation.isPending}
              />
            )}
            {activeTab === TABS.PORTFOLIO && (
              <StaffPortfolioGallery
                images={portfolio}
                onUpload={handleUpload}
                onDelete={handleDeleteImage}
                isUploading={uploadImageMutation.isPending}
              />
            )}

            <Button variant="ghost" size="sm" onClick={() => setSelectedStaff(null)} className="admin-centered-action">
              Cerrar
            </Button>
          </div>
        )}
      </Modal>

      <StaffFormModal
        open={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingStaff(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingStaff}
        specialties={specialties}
        isLoading={createMutation.isPending || updateMutation.isPending}
        errorMessage={createMutation.error?.message || updateMutation.error?.message}
      />

      <StaffDeleteDialog
        open={Boolean(staffToDelete)}
        staff={staffToDelete}
        onConfirm={(staffMember) => deleteMutation.mutate(staffMember)}
        onClose={() => setStaffToDelete(null)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
