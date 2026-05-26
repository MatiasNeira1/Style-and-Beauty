import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User, CalendarClock, Image, AlertCircle, LogOut
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { StaffFormModal } from '../../components/admin/staff/StaffFormModal.jsx';
import { StaffWorkSchedule } from '../../components/admin/staff/StaffWorkSchedule.jsx';
import { StaffPortfolioGallery } from '../../components/admin/staff/StaffPortfolioGallery.jsx';
import { staffService } from '../../services/staffService.js';
import { useAuth } from '../../store/AuthContext.jsx';

// Import our new subcomponents
import { StaffHeaderBanner } from './StaffHeaderBanner.jsx';
import { StaffPortalProfile } from './StaffPortalProfile.jsx';
import { StaffPortalFooter } from './StaffPortalFooter.jsx';

import '../../styles/staff.css';

const TABS = {
  PROFILE: 'profile',
  SCHEDULE: 'schedule',
  PORTFOLIO: 'portfolio',
};

export function StaffPortalPage() {
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  // ── UI State ──────────────────────────────────────
  const [showFormModal, setShowFormModal] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS.PROFILE);

  // ── Data Queries ──────────────────────────────────
  const {
    data: staffList = [],
    isLoading: isLoadingList,
    isError: isListError,
    error: listError,
  } = useQuery({
    queryKey: ['staff-list'],
    queryFn: staffService.listStaff,
  });

  const { data: specialtiesData = [] } = useQuery({
    queryKey: ['staff-specialties'],
    queryFn: staffService.listSpecialties,
  });

  // Find the currently logged-in staff member by matching their idAuth
  const realStaff = staffList.find((s) => s.idAuth === user?.uid);

  // Fallback mock staff in case backend is offline
  const mockStaff = {
    idStaff: "11111111-1111-1111-1111-111111111111",
    idAuth: user?.uid || "mock-uid",
    nombre: user?.email ? user.email.split('@')[0].toUpperCase() : "Staff",
    apellidos: "Staffi",
    rut: "21904025",
    emailContacto: user?.email || "stafftest@gmail.com",
    telefono: "222222222",
    fechaNacimiento: "1999-02-22",
    genero: "Femenino",
    experienciaAnios: "5",
    especialidad: {
      idEspecialidad: 1,
      nombre: "Cosmetóloga",
      descripcion: "Especialista en cosmetología y estética premium."
    },
    descripcionPerfil: "Aún no has agregado una biografía curricular. Escribe sobre ti, tu trayectoria y pasiones haciendo clic en \"Editar Perfil\" arriba."
  };

  const currentStaff = realStaff || (window.location.hostname === 'localhost' ? mockStaff : null);

  const { data: scheduleData = [], isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['staff-schedules', currentStaff?.idStaff],
    queryFn: () => staffService.listSchedules(currentStaff.idStaff),
    enabled: Boolean(currentStaff?.idStaff && !isListError),
  });

  const { data: portfolioData = [], isLoading: isLoadingPortfolio } = useQuery({
    queryKey: ['staff-portfolio', currentStaff?.idStaff],
    queryFn: () => staffService.listPortfolio(currentStaff.idStaff),
    enabled: Boolean(currentStaff?.idStaff && !isListError),
  });

  // ── Mutations ─────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data) =>
      staffService.updateSelf({
        ...data,
        idEspecialidad: Number(data.idEspecialidad),
        experienciaAnios: data.experienciaAnios ? Number(data.experienciaAnios) : null,
      }),
    onSuccess: () => {
      setShowFormModal(false);
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: (jornadas) =>
      staffService.saveSchedules(currentStaff.idStaff, jornadas),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['staff-schedules', currentStaff?.idStaff],
      });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: (file) => staffService.uploadPortfolioImage(currentStaff.idStaff, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['staff-portfolio', currentStaff?.idStaff],
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (idFoto) => staffService.deletePortfolioImage(idFoto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['staff-portfolio', currentStaff?.idStaff],
      });
    },
  });

  // ── Callbacks ─────────────────────────────────────
  const handleFormSubmit = useCallback(
    async (formData) => {
      await updateMutation.mutateAsync({
        ...currentStaff,
        ...formData,
      });
    },
    [currentStaff, updateMutation],
  );

  const handleUpload = useCallback(
    async (file) => {
      await uploadImageMutation.mutateAsync(file);
    },
    [uploadImageMutation],
  );

  const handleDeleteImage = useCallback(
    async (idFoto) => {
      await deleteImageMutation.mutateAsync(idFoto);
    },
    [deleteImageMutation],
  );

  // ── Loading & Errors ──────────────────────────────
  const isLoading = isLoadingSchedule || isLoadingPortfolio;

  if (isLoadingList || (currentStaff && isLoading)) {
    return (
      <div className="flex-center animate-fade-in" style={{ minHeight: '60vh' }}>
        <Loader />
      </div>
    );
  }

  if (isListError && window.location.hostname !== 'localhost') {
    return (
      <div className="admin-container animate-fade-in" style={{ padding: '2.5rem var(--page-x)' }}>
        <div className="admin-alert error" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem', borderRadius: '12px' }}>
          <AlertCircle size={20} />
          <span>Error al cargar datos del personal: {listError?.message}</span>
        </div>
      </div>
    );
  }

  if (!currentStaff) {
    return (
      <div className="stack flex-center animate-fade-in" style={{ minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
        <div className="card glass-card" style={{ padding: '3rem 2rem', maxWidth: '480px', border: '1px solid rgba(25, 20, 23, 0.08)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
            Perfil no encontrado
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            No pudimos asociar tu cuenta de acceso con un perfil profesional activo en la base de datos. Por favor, contacta al administrador del sistema.
          </p>
          <Button variant="ghost" onClick={logout} style={{ border: '1px solid rgba(169, 52, 84, 0.2)', color: 'var(--color-primary-strong)' }}>
            <LogOut size={16} style={{ marginRight: '0.5rem' }} />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    );
  }

  const fullName = `${currentStaff.nombre || ''} ${currentStaff.apellidos || ''}`.trim() || 'Sin nombre';
  const initials = fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const specialtyName = currentStaff.especialidad?.nombre || currentStaff.nombreEspecialidad || 'Sin especialidad';

  const mockSpecialties = [
    { idEspecialidad: 1, nombre: "Cosmetóloga", descripcion: "Especialista en cuidado de la piel." },
    { idEspecialidad: 2, nombre: "Peluquero/a", descripcion: "Corte y peinado capilar." },
    { idEspecialidad: 3, nombre: "Barbero/a", descripcion: "Corte y cuidado masculino." },
    { idEspecialidad: 4, nombre: "Colorista", descripcion: "Especialista en tinturas." },
  ];

  const specialties = (specialtiesData && specialtiesData.length > 0)
    ? specialtiesData
    : (window.location.hostname === 'localhost' ? mockSpecialties : []);

  const schedules = scheduleData.map((s) => ({
    diaSemana: s.diaSemana,
    horaInicio: s.horaInicio.slice(0, 5),
    horaFin: s.horaFin.slice(0, 5),
    activo: s.activo,
  }));

  const portfolio = portfolioData.map((p) => ({
    idFoto: p.idFoto,
    urlFoto: p.urlFoto,
  }));

  return (
    <div className="admin-container animate-fade-in" style={{ padding: '7.5rem var(--page-x) 4rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* ── Banner / Header (Sub-componente) ── */}
      <StaffHeaderBanner 
        currentStaff={currentStaff}
        fullName={fullName}
        onEditProfile={() => setShowFormModal(true)}
        onLogout={logout}
      />

      {/* ── Tabs Navigation ── */}
      <div className="staff-tabs" style={{ marginBottom: '2rem', borderBottom: '2px solid rgba(25, 20, 23, 0.08)' }}>
        <button
          className={`staff-tab ${activeTab === TABS.PROFILE ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.PROFILE)}
        >
          <User size={15} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
          Mi Perfil Curricular
        </button>
        <button
          className={`staff-tab ${activeTab === TABS.SCHEDULE ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.SCHEDULE)}
        >
          <CalendarClock size={15} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
          Jornada Laboral Fija
        </button>
        <button
          className={`staff-tab ${activeTab === TABS.PORTFOLIO ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.PORTFOLIO)}
        >
          <Image size={15} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
          Mi Portfolio de Trabajos
        </button>
      </div>

      {/* ── Tab Content ── */}
      <div className="staff-content-area animate-fade-in">
        {activeTab === TABS.PROFILE && (
          <StaffPortalProfile 
            currentStaff={currentStaff}
            fullName={fullName}
            initials={initials}
            specialtyName={specialtyName}
          />
        )}

        {activeTab === TABS.SCHEDULE && (
          <div className="card glass-card" style={{ padding: '2rem', border: '1px solid rgba(25, 20, 23, 0.08)', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.85)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.03)' }}>
            <StaffWorkSchedule
              schedules={schedules}
              onSave={(jornadas) => scheduleMutation.mutate(jornadas)}
              isSaving={scheduleMutation.isPending}
            />
          </div>
        )}

        {activeTab === TABS.PORTFOLIO && (
          <div className="card glass-card" style={{ padding: '2rem', border: '1px solid rgba(25, 20, 23, 0.08)', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.85)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.03)' }}>
            <StaffPortfolioGallery
              images={portfolio}
              onUpload={handleUpload}
              onDelete={handleDeleteImage}
              isUploading={uploadImageMutation.isPending}
            />
          </div>
        )}
      </div>

      {/* ── Modal para editar perfil propio ── */}
      <StaffFormModal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleFormSubmit}
        initialData={currentStaff}
        specialties={specialties}
        isLoading={updateMutation.isPending}
      />

      {/* ── Footer Integrado y Alineado (Sub-componente) ── */}
      <StaffPortalFooter />
    </div>
  );
}
