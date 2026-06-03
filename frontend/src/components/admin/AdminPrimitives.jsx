import { AlertTriangle, ArrowDownRight, ArrowUpRight, Inbox } from 'lucide-react';
import { formatPercentage, getStatusBadgeVariant, getTrendVariant } from '../../utils/adminFormatters.js';

export function AdminPageHeader({ eyebrow = 'Administracion', title, description, actions, meta }) {
  return (
    <div className="admin-page-header">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      <div className="admin-page-header-actions">
        {meta}
        {actions}
      </div>
    </div>
  );
}

export function AdminKpiCard({ icon: Icon, title, value, trend = 0, microcopy, tone = 'rose' }) {
  const trendVariant = getTrendVariant(trend);
  const TrendIcon = trendVariant === 'negative' ? ArrowDownRight : ArrowUpRight;
  return (
    <article className={`admin-kpi-card tone-${tone}`}>
      <div className="admin-kpi-icon">{Icon && <Icon size={22} />}</div>
      <div className="admin-kpi-body">
        <span>{title}</span>
        <strong>{value}</strong>
        <div className={`admin-trend ${trendVariant}`}>
          <TrendIcon size={15} />
          {Number(trend) === 0 ? 'Sin variacion relevante' : `${formatPercentage(trend)} vs periodo anterior`}
        </div>
        {microcopy && <small>{microcopy}</small>}
      </div>
    </article>
  );
}

export function AdminKpiGrid({ children, className = '', variant = 'auto' }) {
  return (
    <div className={`admin-kpi-grid admin-kpi-grid-${variant} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function AdminChartCard({ title, description, action, children }) {
  return (
    <section className="admin-chart-card">
      <header>
        <div>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function AdminStatusBadge({ status, children }) {
  const variant = getStatusBadgeVariant(status);
  return <span className={`admin-status-badge ${variant}`} aria-label={`Estado ${children || status || 'Sin estado'}`}>{children || status || 'Sin estado'}</span>;
}

export function AdminEmptyState({ title = 'No hay datos disponibles', description, action, compact = false }) {
  return (
    <div className={`admin-empty-state ${compact ? 'compact' : ''}`}>
      <Inbox size={28} />
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function AdminErrorState({ title, message = 'No fue posible cargar esta informacion.', actions }) {
  return (
    <div className="admin-error-state">
      <AlertTriangle size={20} />
      <div>
        {title && <strong>{title}</strong>}
        <span>{message}</span>
      </div>
      {actions && <div className="admin-error-actions">{actions}</div>}
    </div>
  );
}

export function AdminSkeleton({ rows = 4 }) {
  return (
    <div className="admin-skeleton" aria-label="Cargando informacion">
      {Array.from({ length: rows }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}
