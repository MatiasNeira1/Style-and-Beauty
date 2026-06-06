import { Link } from 'react-router-dom';
import { AlertCircle, Clock, ExternalLink, Sparkles } from 'lucide-react';
import {
  AppointmentStatusChart,
  ProfessionalPerformanceChart,
  RevenueChart,
  ServiceDistributionChart,
  WeeklyOccupancyHeatmap,
} from '../../components/admin/AdminCharts.jsx';
import {
  AdminChartCard,
  AdminEmptyState,
  AdminErrorState,
  AdminKpiCard,
  AdminKpiGrid,
  AdminPageHeader,
  AdminSkeleton,
  AdminStatusBadge,
} from '../../components/admin/AdminPrimitives.jsx';
import { useAdminDashboardMetrics } from '../../hooks/admin/useAdminDashboardMetrics.js';
import { formatTime } from '../../utils/adminFormatters.js';

function RangeFilter() {
  const ranges = ['7 dias', '30 dias', 'Mes', 'Año'];
  return (
    <div className="admin-segmented" aria-label="Rango de metricas">
      {ranges.map((range, index) => (
        <button key={range} type="button" className={index === 0 ? 'active' : ''} aria-pressed={index === 0}>
          {range}
        </button>
      ))}
    </div>
  );
}

function ProfessionalCard({ professional }) {
  const initials = professional.name.split(' ').slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  return (
    <article className="admin-professional-card">
      <div className="admin-professional-avatar">{initials}</div>
      <div>
        <h4>{professional.name}</h4>
        <span>{professional.specialty}</span>
      </div>
      <AdminStatusBadge status={professional.status}>{professional.status}</AdminStatusBadge>
      <dl>
        <div><dt>Reservas hoy</dt><dd>{professional.reservations}</dd></div>
        <div><dt>Proxima</dt><dd>{professional.nextBooking ? formatTime(professional.nextBooking.fechaHoraInicio) : 'Sin agenda'}</dd></div>
      </dl>
      <Link to="/admin/staff">Gestionar <ExternalLink size={14} /></Link>
    </article>
  );
}

export function AdminDashboard() {
  const { metrics, isLoading, isError, error } = useAdminDashboardMetrics();

  if (isLoading) {
    return (
      <div className="admin-dashboard">
        <AdminPageHeader title="Resumen operativo y financiero" description="Cargando indicadores del centro de estetica." />
        <AdminSkeleton rows={8} />
      </div>
    );
  }

  if (isError) {
    return <AdminErrorState message={error?.message} />;
  }

  return (
    <div className="admin-dashboard">
      <AdminPageHeader
        title="Resumen operativo y financiero"
        description="Control diario de agenda, caja, equipo y servicios de Style & Beauty."
        meta={<RangeFilter />}
      />

      <AdminKpiGrid variant="three">
        {metrics.kpis.map((kpi) => <AdminKpiCard key={kpi.title} {...kpi} />)}
      </AdminKpiGrid>

      <div className="admin-dashboard-grid main">
        <AdminChartCard title="Ganancias del centro" description="Serie historica preparada para analytics agregado del backend." action={<Sparkles size={18} />}>
          <RevenueChart data={metrics.revenueSeries} />
        </AdminChartCard>

        <AdminChartCard title="Estado operativo" description="Reservas segun etapa de atencion.">
          <AppointmentStatusChart data={metrics.appointmentStatus} />
        </AdminChartCard>
      </div>

      <div className="admin-dashboard-grid secondary">
        <AdminChartCard title="Desempeno de profesionales" description="Ranking visual por ingresos estimados.">
          <ProfessionalPerformanceChart data={metrics.staffPerformance} />
        </AdminChartCard>

        <AdminChartCard title="Distribucion de servicios" description="Categorias con mayor actividad.">
          <ServiceDistributionChart data={metrics.serviceDistribution} />
        </AdminChartCard>

        <AdminChartCard title="Ocupacion semanal" description="Horas con mayor demanda operativa.">
          <WeeklyOccupancyHeatmap data={metrics.weeklyOccupancy} />
        </AdminChartCard>
      </div>

      <div className="admin-dashboard-grid operations">
        <section className="admin-panel wide">
          <header>
            <div>
              <h3>Equipo de hoy</h3>
              <p>Profesionales con actividad, disponibilidad y proxima atencion.</p>
            </div>
            <Link to="/admin/staff">Ver equipo</Link>
          </header>
          <div className="admin-professional-grid">
            {metrics.professionalsToday.length ? metrics.professionalsToday.map((professional) => (
              <ProfessionalCard key={professional.id} professional={professional} />
            )) : (
              <AdminEmptyState
                compact
                title="Sin profesionales cargados"
                description="Agrega especialistas para ver disponibilidad y desempeno del equipo."
                action={<Link to="/admin/staff" className="admin-empty-action">Gestionar profesionales</Link>}
              />
            )}
          </div>
        </section>

        <section className="admin-panel">
          <header>
            <div>
              <h3>Proximas reservas</h3>
              <p>Cola operativa inmediata.</p>
            </div>
            <Clock size={18} />
          </header>
          <div className="admin-reservation-list">
            {metrics.nextBookings.length ? metrics.nextBookings.map((booking, index) => (
              <article key={booking.idCita || booking.id || index}>
                <span>{formatTime(booking.fechaHoraInicio)}</span>
                <strong>Reserva #{booking.idCita || booking.id || index + 1}</strong>
                <AdminStatusBadge status={booking.estadoCita} />
              </article>
            )) : (
              <AdminEmptyState
                compact
                title="No hay reservas proximas"
                description="La cola operativa esta libre para este rango."
                action={<Link to="/admin/agenda" className="admin-empty-action">Ver agenda</Link>}
              />
            )}
          </div>
        </section>

        <section className="admin-panel">
          <header>
            <div>
              <h3>Alertas operativas</h3>
              <p>Puntos que requieren seguimiento.</p>
            </div>
            <AlertCircle size={18} />
          </header>
          <div className="admin-alert-list">
            {metrics.alerts.map((alert) => (
              <span key={alert}><i />{alert}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
