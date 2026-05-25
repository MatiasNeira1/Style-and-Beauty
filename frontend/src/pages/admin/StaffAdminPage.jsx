import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users, Plus, Eye, Pencil, Trash2, CalendarClock, Image,
} from 'lucide-react';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { StaffFormModal } from '../../components/admin/staff/StaffFormModal.jsx';
import { StaffProfileCard } from '../../components/admin/staff/StaffProfileCard.jsx';
import { StaffWorkSchedule } from '../../components/admin/staff/StaffWorkSchedule.jsx';
import { StaffPortfolioGallery } from '../../components/admin/staff/StaffPortfolioGallery.jsx';
import { StaffDeleteDialog } from '../../components/admin/staff/StaffDeleteDialog.jsx';
import { staffService } from '../../services/staffService.js';
import { authService } from '../../services/authService.js';

const TABS = {
  PROFILE: 'profile',
  SCHEDULE: 'schedule',
  PORTFOLIO: 'portfolio',
};

export function StaffAdminPage() {
  const queryClient = useQueryClient();

  // ── UI State ──────────────────────────────────────
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.PROFILE);

  // ── Data Queries ──────────────────────────────────
  const {
    data: staffData = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['staff-list'],
    queryFn: staffService.listStaff,
  });

  const { data: specialtiesData = [] } = useQuery({
    queryKey: ['staff-specialties'],
    queryFn: staffService.listSpecialties,
  });

  const { data: scheduleData = [] } = useQuery({
    queryKey: ['staff-schedules', selectedStaff?.idStaff],
    queryFn: () => staffService.listSchedules(selectedStaff.idStaff),
    enabled: Boolean(selectedStaff?.idStaff),
  });

  const { data: portfolioData = [] } = useQuery({
    queryKey: ['staff-portfolio', selectedStaff?.idStaff],
    queryFn: () => staffService.listPortfolio(selectedStaff.idStaff),
    enabled: Boolean(selectedStaff?.idStaff),
  });

  // ── Mutations ─────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      // 1. Create auth user
      const user = await authService.createUser({
        email: payload.emailContacto,
        password: payload.password,
        rol: 'STAFF',
      });
      // 2. Create profile
      const { password, ...profilePayload } = payload;
      return staffService.createStaff({
        ...profilePayload,
        idAuth: user.uid,
        idEspecialidad: Number(profilePayload.idEspecialidad),
      });
    },
    onSuccess: () => {
      setShowFormModal(false);
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ idAuth, data }) =>
      staffService.updateStaff(idAuth, {
        ...data,
        idEspecialidad: Number(data.idEspecialidad),
      }),
    onSuccess: () => {
      setShowFormModal(false);
      setEditingStaff(null);
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (staff) => staffService.deleteStaff(staff.idAuth),
    onSuccess: () => {
      setStaffToDelete(null);
      if (selectedStaff?.idAuth === staffToDelete?.idAuth) {
        setSelectedStaff(null);
      }
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: (jornadas) =>
      staffService.saveSchedules(selectedStaff.idStaff, jornadas),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['staff-schedules', selectedStaff?.idStaff],
      });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: (file) =>
      staffService.uploadPortfolioImage(selectedStaff.idStaff, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['staff-portfolio', selectedStaff?.idStaff],
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId) =>
      staffService.deletePortfolioImage(selectedStaff.idStaff, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['staff-portfolio', selectedStaff?.idStaff],
      });
    },
  });

  // ── Handlers ──────────────────────────────────────
  const handleFormSubmit = (data, isEdit) => {
    if (isEdit && editingStaff) {
      updateMutation.mutate({ idAuth: editingStaff.idAuth, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (staff) => {
    setEditingStaff(staff);
    setShowFormModal(true);
  };

  const handleView = (staff) => {
    setSelectedStaff(staff);
    setActiveTab(TABS.PROFILE);
  };

  const handleUpload = useCallback(
    (file) => uploadImageMutation.mutateAsync(file),
    [uploadImageMutation]
  );

  const handleDeleteImage = useCallback(
    (imageId) => deleteImageMutation.mutate(imageId),
    [deleteImageMutation]
  );

  const staff = Array.isArray(staffData) ? staffData : [];
  const specialties = Array.isArray(specialtiesData) ? specialtiesData : [];
  const schedules = Array.isArray(scheduleData) ? scheduleData : [];
  const portfolio = Array.isArray(portfolioData) ? portfolioData : [];

  // ── Table Columns ─────────────────────────────────
  const columns = [
    {
      key: 'nombre',
      label: 'Profesional',
      render: (row) => {
        const name = `${row.nombre || ''} ${row.apellidos || ''}`.trim() || 'Sin nombre';
        const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="staff-avatar" style={{ width: '2.4rem', height: '2.4rem', fontSize: '0.82rem' }}>
              {initials}
            </div>
            <div style={{ display: 'grid', gap: '0.1rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{name}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                {row.emailContacto || ''}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'telefono',
      label: 'Teléfono',
    },
    {
      key: 'especialidad',
      label: 'Especialidad',
      render: (row) => (
        <Badge tone="primary">
          {row.especialidad?.nombre || row.nombreEspecialidad || 'Sin asignar'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (row) => (
        <div className="staff-table-row-actions">
          <button
            className="staff-action-btn"
            onClick={() => handleView(row)}
            title="Ver perfil"
            aria-label={`Ver perfil de ${row.nombre}`}
          >
            <Eye size={15} />
          </button>
          <button
            className="staff-action-btn"
            onClick={() => handleEdit(row)}
            title="Editar"
            aria-label={`Editar ${row.nombre}`}
          >
            <Pencil size={15} />
          </button>
          <button
            className="staff-action-btn danger"
            onClick={() => setStaffToDelete(row)}
            title="Eliminar"
            aria-label={`Eliminar ${row.nombre}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="stack">
      {/* ── Header ──────────────────────────────────── */}
      <div className="staff-header">
        <div className="staff-header-info">
          <span>MS02 · Staff Service</span>
          <h1>Equipo Profesional</h1>
          <p>Gestiona perfiles, jornadas laborales y portfolio de trabajos realizados.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="staff-stat-pill">
            <Users size={16} />
            {staff.length} Profesionales
          </div>
          <Button
            onClick={() => {
              setEditingStaff(null);
              setShowFormModal(true);
            }}
            size="sm"
          >
            <Plus size={16} />
            Nuevo Profesional
          </Button>
        </div>
      </div>

      {/* ── Error Alert ─────────────────────────────── */}
      {(createMutation.isError || updateMutation.isError || deleteMutation.isError) && (
        <p className="admin-alert">
          {createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message}
        </p>
      )}

      {/* ── Content Area ────────────────────────────── */}
      <div className={`staff-admin-detail-layout ${selectedStaff ? 'has-drawer' : ''}`}>
        {/* ── Table ──────────────────────────────── */}
        <div>
          {isLoading ? (
            <Loader />
          ) : isError ? (
            <p className="admin-alert">{error.message}</p>
          ) : (
            <DataTable columns={columns} rows={staff} />
          )}
        </div>

        {/* ── Detail Panel ───────────────────────── */}
        {selectedStaff && (
          <div className="stack staff-profile-drawer">
            {/* Tabs */}
            <div className="staff-tabs">
              <button
                className={`staff-tab ${activeTab === TABS.PROFILE ? 'active' : ''}`}
                onClick={() => setActiveTab(TABS.PROFILE)}
              >
                <Eye size={13} style={{ marginRight: '0.35rem', verticalAlign: '-2px' }} />
                Perfil
              </button>
              <button
                className={`staff-tab ${activeTab === TABS.SCHEDULE ? 'active' : ''}`}
                onClick={() => setActiveTab(TABS.SCHEDULE)}
              >
                <CalendarClock size={13} style={{ marginRight: '0.35rem', verticalAlign: '-2px' }} />
                Jornada
              </button>
              <button
                className={`staff-tab ${activeTab === TABS.PORTFOLIO ? 'active' : ''}`}
                onClick={() => setActiveTab(TABS.PORTFOLIO)}
              >
                <Image size={13} style={{ marginRight: '0.35rem', verticalAlign: '-2px' }} />
                Portfolio
              </button>
            </div>

            {/* Tab content */}
            {activeTab === TABS.PROFILE && (
              <StaffProfileCard staff={selectedStaff} />
            )}
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

            {/* Close detail panel */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedStaff(null)}
              style={{ justifySelf: 'center' }}
            >
              Cerrar panel
            </Button>
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────── */}
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
      />

      <StaffDeleteDialog
        open={Boolean(staffToDelete)}
        staff={staffToDelete}
        onConfirm={(s) => deleteMutation.mutate(s)}
        onClose={() => setStaffToDelete(null)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
