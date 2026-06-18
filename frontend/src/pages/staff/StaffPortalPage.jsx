import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CalendarX,
  ChevronRight,
  Eye,
  Image,
  LogOut,
  Menu,
  Save,
  Scissors,
  User,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { StaffFormModal } from '../../components/admin/staff/StaffFormModal.jsx';
import { StaffPortfolioGallery } from '../../components/admin/staff/StaffPortfolioGallery.jsx';
import { StaffWorkSchedule } from '../../components/admin/staff/StaffWorkSchedule.jsx';
import { ProfessionalProfileModal } from '../../components/professionals/ProfessionalProfileModal.jsx';
import { normalizeProfessional } from '../../hooks/useProfessionals.js';
import { profileService } from '../../services/profileService.js';
import { serviceCatalogService } from '../../services/serviceCatalogService.js';
import { staffService } from '../../services/staffService.js';
import { useAuth } from '../../store/AuthContext.jsx';
import { StaffDashboard } from './StaffDashboard.jsx';
import { StaffPortalProfile } from './StaffPortalProfile.jsx';
import '../../styles/staff.css';

const TABS = {
  DASHBOARD: 'dashboard',
  AGENDA: 'agenda',
  HISTORY: 'history',
  PROFILE: 'profile',
  SCHEDULE: 'schedule',
  PORTFOLIO: 'portfolio',
  VACATIONS: 'vacations',
};

const TAB_VALUES = new Set(Object.values(TABS));

function viewFromSearch(value) {
  return TAB_VALUES.has(value) ? value : TABS.DASHBOARD;
}

function isLocalDevHost() {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

const MENU_GROUPS = [
  {
    label: 'Operacion',
    items: [
      {
        key: TABS.DASHBOARD,
        label: 'Dashboard',
        icon: BarChart3,
        eyebrow: 'Staff',
        title: 'Resumen operativo',
        description: 'Citas, clientes atendidos, servicios realizados y ganancias asociadas a tu agenda.',
      },
      {
        key: TABS.AGENDA,
        label: 'Agenda',
        icon: CalendarRange,
        eyebrow: 'Agenda',
        title: 'Citas asignadas',
        description: 'Lectura de tus citas de hoy y de la semana actual.',
      },
      {
        key: TABS.HISTORY,
        label: 'Historial',
        icon: CalendarDays,
        eyebrow: 'Historial',
        title: 'Servicios atendidos',
        description: 'Registro de fecha, cliente, servicio, profesional, estado y precio.',
      },
    ],
  },
  {
    label: 'Gestion personal',
    items: [
      {
        key: TABS.PROFILE,
        label: 'Perfil',
        icon: User,
        eyebrow: 'Perfil',
        title: 'Perfil profesional',
        description: 'Informacion curricular visible para reservas y administracion interna.',
      },
      {
        key: TABS.SCHEDULE,
        label: 'Jornada',
        icon: CalendarClock,
        eyebrow: 'Disponibilidad',
        title: 'Jornada laboral',
        description: 'Horarios fijos de atencion del profesional.',
      },
      {
        key: TABS.PORTFOLIO,
        label: 'Portfolio',
        icon: Image,
        eyebrow: 'Portfolio',
        title: 'Trabajos realizados',
        description: 'Galeria profesional del staff.',
      },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      {
        key: TABS.VACATIONS,
        label: 'Solicitud de Vacaciones',
        icon: CalendarX,
        eyebrow: 'Proximamente',
        title: 'Solicitud de Vacaciones',
        description: 'Vista reservada para enviar y revisar periodos de descanso.',
      },
    ],
  },
];

const mockSpecialties = [
  { idEspecialidad: 1, nombre: 'Peluqueria', descripcion: 'Servicios de peluqueria, tratamiento y asesoria de estilo.' },
  { idEspecialidad: 2, nombre: 'Nails', descripcion: 'Manicure, nail art, esmaltado y cuidado de unas.' },
  { idEspecialidad: 3, nombre: 'Cabello', descripcion: 'Corte, coloracion, peinado y cuidado capilar.' },
  { idEspecialidad: 4, nombre: 'Cuidados de la piel', descripcion: 'Limpiezas, tratamientos faciales y cuidado dermatocosmetico.' },
  { idEspecialidad: 5, nombre: 'Spa', descripcion: 'Servicios de relajacion, bienestar y cuidado corporal.' },
  { idEspecialidad: 6, nombre: 'Maquillaje', descripcion: 'Maquillaje social, profesional y asesoria de imagen.' },
];

function formatPanelDate(date = new Date()) {
  return new Intl.DateTimeFormat('es-CL', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(date).toUpperCase();
}

function staffResourceId(staff) {
  return staff?.idStaff || staff?.idPersona || staff?.id;
}

function sameId(left, right) {
  return left != null && right != null && String(left) === String(right);
}

function serviceId(service) {
  return service?.id_servicio || service?.idServicio || service?.id;
}

function optionalValue(value) {
  return value === '' || value === undefined ? undefined : value;
}

const DAY_LABELS = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miercoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sabado',
  7: 'Domingo',
};

function scheduleLabel(schedule) {
  const day = DAY_LABELS[Number(schedule?.diaSemana)] || 'Dia';
  const start = String(schedule?.horaInicio || '').slice(0, 5);
  const end = String(schedule?.horaFin || '').slice(0, 5);
  if (!start || !end) return day;
  return `${day} ${start}-${end}`;
}

function publicScheduleLabels(schedules = []) {
  return schedules
    .filter((schedule) => schedule?.activo !== false)
    .sort((left, right) => Number(left?.diaSemana || 0) - Number(right?.diaSemana || 0))
    .map(scheduleLabel)
    .filter(Boolean);
}

function nextHoursFromSchedules(schedules = []) {
  return schedules
    .filter((schedule) => schedule?.activo !== false && schedule?.horaInicio)
    .sort((left, right) => Number(left?.diaSemana || 0) - Number(right?.diaSemana || 0))
    .map((schedule) => String(schedule.horaInicio).slice(0, 5))
    .filter(Boolean)
    .slice(0, 4);
}

async function listServicesForStaff(staffId) {
  if (!staffService.isValidUuid(staffId)) return [];

  const services = await serviceCatalogService.listServices();
  if (!Array.isArray(services) || services.length === 0) return [];

  const relationResults = await Promise.allSettled(
    services
      .filter((service) => service?.activo !== false && serviceCatalogService.isValidUuid(serviceId(service)))
      .map(async (service) => {
        const idServicio = serviceId(service);
        const relations = await serviceCatalogService.listCatalogStaffByService(idServicio);
        const isAssigned = Array.isArray(relations)
          && relations.some((relation) => relation?.activo !== false && sameId(relation?.idStaff, staffId));

        return isAssigned ? service : null;
      }),
  );

  return relationResults
    .filter((result) => result.status === 'fulfilled' && result.value)
    .map((result) => result.value);
}

function normalizeDate(value) {
  if (!value) return undefined;
  const asString = String(value);
  const isoMatch = asString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const localMatch = asString.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (localMatch) return `${localMatch[3]}-${localMatch[2]}-${localMatch[1]}`;
  return asString;
}

function buildProfilePayload(data) {
  return {
    rut: data.rut,
    nombre: data.nombre,
    apellidos: optionalValue(data.apellidos),
    fechaNacimiento: normalizeDate(data.fechaNacimiento),
    genero: optionalValue(data.genero),
    telefono: optionalValue(data.telefono),
    emailContacto: data.emailContacto,
    idEspecialidad: data.idEspecialidad ? Number(data.idEspecialidad) : undefined,
    descripcionPerfil: optionalValue(data.descripcionPerfil),
    experienciaAnios: data.experienciaAnios ? Number(data.experienciaAnios) : undefined,
  };
}

export function StaffPortalPage() {
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFormModal, setShowFormModal] = useState(false);
  const [showPublicPreview, setShowPublicPreview] = useState(false);
  const [activeTab, setActiveTab] = useState(() => viewFromSearch(searchParams.get('view')));
  const [portfolioBio, setPortfolioBio] = useState('');

  useEffect(() => {
    setActiveTab(viewFromSearch(searchParams.get('view')));
  }, [searchParams]);

  const handleTabChange = useCallback(
    (tab) => {
      const nextTab = viewFromSearch(tab);
      setActiveTab(nextTab);
      setSearchParams(nextTab === TABS.DASHBOARD ? {} : { view: nextTab });
    },
    [setSearchParams],
  );

  const {
    data: ownProfile,
    isLoading: isLoadingProfile,
    isError: isProfileError,
    error: profileError,
  } = useQuery({
    queryKey: ['staff-self-profile', user?.uid],
    queryFn: profileService.getMyProfile,
    enabled: Boolean(user?.uid),
  });

  const { data: specialtiesData = [] } = useQuery({
    queryKey: ['staff-specialties'],
    queryFn: staffService.listSpecialties,
  });

  const mockStaff = {
    idStaff: '11111111-1111-1111-8111-111111111111',
    idAuth: user?.uid || 'mock-uid',
    nombre: user?.email ? user.email.split('@')[0].toUpperCase() : 'Staff',
    apellidos: 'Staff',
    rut: '21904025',
    emailContacto: user?.email || 'stafftest@gmail.com',
    telefono: '222222222',
    fechaNacimiento: '1999-02-22',
    genero: 'Femenino',
    experienciaAnios: '5',
    especialidad: {
      idEspecialidad: 1,
      nombre: 'Peluqueria',
      descripcion: 'Servicios de peluqueria, tratamiento y asesoria de estilo.',
    },
    descripcionPerfil: 'Aun no has agregado una biografia curricular.',
  };

  const currentStaff = ownProfile || (isLocalDevHost() ? mockStaff : null);
  const currentStaffResourceId = staffResourceId(currentStaff);

  useEffect(() => {
    setPortfolioBio(currentStaff?.descripcionPerfil || '');
  }, [currentStaff?.descripcionPerfil, currentStaffResourceId]);

  const { data: scheduleData = [], isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['staff-schedules', currentStaffResourceId],
    queryFn: () => staffService.listSchedules(currentStaffResourceId),
    enabled: Boolean(currentStaffResourceId && !isProfileError && [TABS.SCHEDULE, TABS.PORTFOLIO].includes(activeTab)),
  });

  const { data: portfolioData = [], isLoading: isLoadingPortfolio } = useQuery({
    queryKey: ['staff-portfolio', currentStaffResourceId],
    queryFn: () => staffService.listPortfolio(currentStaffResourceId),
    enabled: Boolean(currentStaffResourceId && !isProfileError && activeTab === TABS.PORTFOLIO),
  });

  const { data: publicPreviewProfile } = useQuery({
    queryKey: ['staff-public-profile-preview', currentStaffResourceId],
    queryFn: () => staffService.getStaffById(currentStaffResourceId),
    enabled: Boolean(staffService.isValidUuid(currentStaffResourceId) && !isProfileError && activeTab === TABS.PORTFOLIO),
  });

  const {
    data: associatedServices = [],
    isLoading: isLoadingAssociatedServices,
    isError: isAssociatedServicesError,
  } = useQuery({
    queryKey: ['staff-associated-services', currentStaffResourceId],
    queryFn: () => listServicesForStaff(currentStaffResourceId),
    enabled: Boolean(currentStaffResourceId && !isProfileError && activeTab === TABS.PORTFOLIO),
  });

  const updateMutation = useMutation({
    mutationFn: (data) =>
      staffService.updateSelf(buildProfilePayload(data)),
    onSuccess: () => {
      setShowFormModal(false);
      queryClient.invalidateQueries({ queryKey: ['staff-self-profile', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['staff-public-profile-preview', currentStaffResourceId] });
      queryClient.invalidateQueries({ queryKey: ['professionals-public'] });
    },
  });

  const bioMutation = useMutation({
    mutationFn: () => staffService.updateSelf({ descripcionPerfil: optionalValue(portfolioBio) || '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-self-profile', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['staff-public-profile-preview', currentStaffResourceId] });
      queryClient.invalidateQueries({ queryKey: ['professionals-public'] });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: (jornadas) => staffService.saveSchedules(currentStaffResourceId, jornadas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-schedules', currentStaffResourceId] });
      queryClient.invalidateQueries({ queryKey: ['staff-public-profile-preview', currentStaffResourceId] });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: (file) => staffService.uploadPortfolioImage(currentStaffResourceId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-portfolio', currentStaffResourceId] });
      queryClient.invalidateQueries({ queryKey: ['staff-public-profile-preview', currentStaffResourceId] });
      queryClient.invalidateQueries({ queryKey: ['professionals-public'] });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId) => staffService.deletePortfolioImage(currentStaffResourceId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-portfolio', currentStaffResourceId] });
      queryClient.invalidateQueries({ queryKey: ['staff-public-profile-preview', currentStaffResourceId] });
      queryClient.invalidateQueries({ queryKey: ['professionals-public'] });
    },
  });

  const handleFormSubmit = useCallback(
    async (formData) => {
      await updateMutation.mutateAsync(formData);
    },
    [updateMutation],
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

  const previewSource = publicPreviewProfile || currentStaff;
  const previewPortfolio = currentStaff
    ? (portfolioData.length > 0 ? portfolioData : previewSource?.portfolioImages || previewSource?.portfolio || [])
    : [];
  const previewBio = currentStaff
    ? portfolioBio || previewSource?.descripcionPerfil || currentStaff.descripcionPerfil || ''
    : '';
  const previewScheduleLabels = publicScheduleLabels(scheduleData);
  const previewNextHours = nextHoursFromSchedules(scheduleData);
  const previewProfessional = currentStaff
    ? normalizeProfessional({
      ...previewSource,
      ...currentStaff,
      idPersona: currentStaffResourceId,
      idStaff: currentStaffResourceId,
      descripcionPerfil: previewBio,
      biografiaProfesional: previewBio,
      perfilCurricular: previewBio,
      portfolioImages: previewPortfolio,
      serviciosAsociados: associatedServices,
      horariosPublicos: previewScheduleLabels,
      proximasHoras: previewNextHours.length ? previewNextHours : previewSource?.proximasHoras,
      proximaHora: previewNextHours[0] || previewSource?.proximaHora,
      fotoUrl: previewSource?.fotoUrl || currentStaff.fotoUrl || currentStaff.foto,
      imageUrl: previewSource?.imageUrl || previewSource?.fotoUrl || currentStaff.fotoUrl || currentStaff.foto,
    })
    : null;

  const isLoading =
    (activeTab === TABS.SCHEDULE && isLoadingSchedule) ||
    (activeTab === TABS.PORTFOLIO && isLoadingPortfolio);

  if (isLoadingProfile || (currentStaff && isLoading)) {
    return (
      <div className="flex-center animate-fade-in" style={{ minHeight: '60vh' }}>
        <Loader />
      </div>
    );
  }

  if (isProfileError && !isLocalDevHost()) {
    return (
      <div className="admin-container animate-fade-in" style={{ padding: '2.5rem var(--page-x)' }}>
        <div className="admin-alert error" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem', borderRadius: '12px' }}>
          <AlertCircle size={20} />
          <span>Error al cargar datos del personal: {profileError?.message}</span>
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
            No pudimos asociar tu cuenta de acceso con un perfil profesional activo en la base de datos. Contacta al administrador del sistema.
          </p>
          <Button variant="ghost" onClick={logout} style={{ border: '1px solid rgba(169, 52, 84, 0.2)', color: 'var(--color-primary-strong)' }}>
            <LogOut size={16} style={{ marginRight: '0.5rem' }} />
            Cerrar sesion
          </Button>
        </div>
      </div>
    );
  }

  const fullName = `${currentStaff.nombre || ''} ${currentStaff.apellidos || ''}`.trim() || 'Sin nombre';
  const initials = fullName
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  const specialtyName = currentStaff.especialidad?.nombre || currentStaff.nombreEspecialidad || 'Sin especialidad';
  const specialties = specialtiesData.length > 0
    ? specialtiesData
    : (isLocalDevHost() ? mockSpecialties : []);

  const schedules = scheduleData.map((schedule) => ({
    diaSemana: schedule.diaSemana,
    horaInicio: schedule.horaInicio?.slice(0, 5) || '09:00',
    horaFin: schedule.horaFin?.slice(0, 5) || '18:00',
    activo: schedule.activo,
  }));

  const portfolio = portfolioData.map((photo) => ({
    id: photo.idFoto || photo.id || photo.idPortfolio,
    url: photo.urlFoto || photo.url || photo.imageUrl,
  }));

  const portfolioErrorMessage = uploadImageMutation.error?.message || deleteImageMutation.error?.message;

  const activeMeta = MENU_GROUPS
    .flatMap((group) => group.items)
    .find((item) => item.key === activeTab) || MENU_GROUPS[0].items[0];

  const renderActiveView = () => {
    if (activeTab === TABS.DASHBOARD) {
      return <StaffDashboard currentStaff={currentStaff} fullName={fullName} view="dashboard" />;
    }

    if (activeTab === TABS.AGENDA) {
      return <StaffDashboard currentStaff={currentStaff} fullName={fullName} view="agenda" />;
    }

    if (activeTab === TABS.HISTORY) {
      return <StaffDashboard currentStaff={currentStaff} fullName={fullName} view="history" />;
    }

    if (activeTab === TABS.PROFILE) {
      return (
        <div className="staff-view-stack">
          <StaffPortalProfile
            currentStaff={currentStaff}
            fullName={fullName}
            initials={initials}
            specialtyName={specialtyName}
            onNavigate={handleTabChange}
            onEditProfile={() => setShowFormModal(true)}
          />
        </div>
      );
    }

    if (activeTab === TABS.SCHEDULE) {
      return (
        <section className="staff-management-panel">
          {scheduleMutation.isError && (
            <p className="admin-alert">
              {scheduleMutation.error?.message || 'No se pudo guardar la jornada.'}
            </p>
          )}
          <StaffWorkSchedule
            schedules={schedules}
            onSave={(jornadas) => scheduleMutation.mutate(jornadas)}
            isSaving={scheduleMutation.isPending}
            readOnly
          />
        </section>
      );
    }

    if (activeTab === TABS.PORTFOLIO) {
      return (
        <section className="staff-management-panel">
          <div className="staff-public-preview-card">
            <div className="staff-public-preview-copy">
              <div className="staff-public-preview-icon">
                <Eye size={20} />
              </div>
              <div>
                <span>Vista previa del perfil</span>
                <h3>Ver perfil publico</h3>
                <p>Ficha publica de reservas y profesionales.</p>
              </div>
            </div>
            {isAssociatedServicesError && (
              <p className="staff-public-preview-warning">
                Servicios asociados no disponibles temporalmente.
              </p>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowPublicPreview(true)}
              disabled={!previewProfessional || isLoadingAssociatedServices}
            >
              <Eye size={15} />
              {isLoadingAssociatedServices ? 'Preparando...' : 'Vista previa del perfil'}
            </Button>
          </div>
          <div className="staff-bio-editor">
            <div className="staff-dashboard-panel-header">
              <div>
                <span>Perfil curricular</span>
                <h3>Biografia profesional</h3>
                <p>Este texto aparece en tu perfil publico y al revisar profesionales.</p>
              </div>
              <BookOpen size={18} />
            </div>
            {bioMutation.isError && (
              <p className="admin-alert">
                {bioMutation.error?.message || 'No se pudo guardar la biografia.'}
              </p>
            )}
            <textarea
              className="staff-bio-textarea"
              value={portfolioBio}
              onChange={(event) => setPortfolioBio(event.target.value)}
              rows={5}
              placeholder="Describe experiencia, certificaciones, tecnica, estilo y los servicios donde mas destacas."
            />
            <div className="staff-editor-actions">
              <Button
                type="button"
                size="sm"
                onClick={() => bioMutation.mutate()}
                disabled={bioMutation.isPending}
              >
                <Save size={14} />
                {bioMutation.isPending ? 'Guardando...' : 'Guardar biografia'}
              </Button>
            </div>
          </div>
          <StaffPortfolioGallery
            images={portfolio}
            onUpload={handleUpload}
            onDelete={handleDeleteImage}
            isUploading={uploadImageMutation.isPending}
            errorMessage={portfolioErrorMessage}
          />
        </section>
      );
    }

    return (
      <div className="staff-vacation-placeholder">
        <div className="staff-vacation-icon">
          <CalendarX size={28} />
        </div>
        <div>
          <span>Proximamente</span>
          <h3>Solicitud de Vacaciones</h3>
          <p>
            Esta vista quedara disponible para revisar solicitudes y enviar nuevos periodos de descanso.
          </p>
        </div>
      </div>
    );
  };

  return (
    <section className="staff-shell animate-fade-in">
      <aside className="staff-sidebar">
        <div className="staff-sidebar-brand">
          <div className="staff-brand-mark">
            <Scissors size={18} />
          </div>
          <div>
            <strong>Style & Beauty</strong>
            <span>Staff Center</span>
          </div>
        </div>

        <nav className="staff-sidebar-nav" aria-label="Navegacion staff">
          {MENU_GROUPS.map((group) => (
            <div className="staff-sidebar-group" key={group.label}>
              <span>{group.label}</span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;

                return (
                  <button
                    className={`staff-sidebar-link ${isActive ? 'active' : ''}`}
                    key={item.key}
                    onClick={() => handleTabChange(item.key)}
                    type="button"
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                    {isActive && <ChevronRight size={15} />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="staff-account-card">
          <div className="staff-account-main">
            <div className="staff-account-avatar">{initials || 'S'}</div>
            <div>
              <strong>{currentStaff.emailContacto || user?.email || fullName}</strong>
              <span>
                <BriefcaseBusiness size={13} />
                {specialtyName}
              </span>
            </div>
          </div>
          <button className="staff-logout-button" onClick={logout} type="button">
            <LogOut size={15} />
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="staff-main">
        <header className="staff-topbar">
          <div className="staff-topbar-title">
            <button className="staff-icon-button" type="button" aria-label="Menu staff">
              <Menu size={18} />
            </button>
            <div>
              <span>{formatPanelDate()}</span>
              <strong>Panel Staff</strong>
            </div>
          </div>
          <div className="staff-topbar-actions">
            <button className="staff-icon-button" type="button" aria-label="Notificaciones">
              <Bell size={17} />
            </button>
            <button className="staff-icon-button" onClick={logout} type="button" aria-label="Cerrar sesion">
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <div className="staff-main-content">
          <div className="staff-page-heading">
            <span>{activeMeta.eyebrow}</span>
            <h1>{activeMeta.title}</h1>
            <p>{activeMeta.description}</p>
          </div>

          <div className="staff-content-area animate-fade-in">
            {renderActiveView()}
          </div>
        </div>
      </main>

      {showFormModal && (
        <StaffFormModal
          open={showFormModal}
          onClose={() => setShowFormModal(false)}
          onSubmit={handleFormSubmit}
          initialData={currentStaff}
          specialties={specialties}
          isLoading={updateMutation.isPending}
          errorMessage={updateMutation.error?.message}
          showPhotoField={false}
          showBioField={false}
        />
      )}
      {showPublicPreview && (
        <ProfessionalProfileModal
          professional={previewProfessional}
          onClose={() => setShowPublicPreview(false)}
        />
      )}
    </section>
  );
}
