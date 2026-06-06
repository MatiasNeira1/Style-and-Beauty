import { Fragment } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrencyCLP } from '../../utils/adminFormatters.js';
import { AdminEmptyState } from './AdminPrimitives.jsx';

const chartColors = ['#bf5b84', '#e2b47e', '#9bb098', '#7a1e38', '#d47a9e', '#51474c'];
const axisTick = { fill: '#82787c', fontSize: 12, fontWeight: 700 };

function PremiumTooltip({ active, payload, label, currency = false }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="admin-chart-tooltip">
      <strong>{label}</strong>
      {payload.map((entry) => (
        <span key={entry.dataKey}>
          <i style={{ background: entry.color }} />
          <b>{entry.name}</b>
          {currency ? formatCurrencyCLP(entry.value) : entry.value}
        </span>
      ))}
    </div>
  );
}

export function RevenueChart({ data = [] }) {
  if (!data.length) return <AdminEmptyState compact title="Sin ingresos para graficar" description="Cuando existan pagos, veras la evolucion del periodo aqui." />;
  return (
    <div className="admin-chart-height">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 14, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#bf5b84" stopOpacity={0.32} />
              <stop offset="95%" stopColor="#bf5b84" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(81,71,76,.10)" vertical={false} strokeDasharray="4 8" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} dy={8} />
          <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} tickLine={false} axisLine={false} tick={axisTick} width={54} />
          <Tooltip content={<PremiumTooltip currency />} />
          <Legend iconType="circle" wrapperStyle={{ color: '#51474c', fontWeight: 800, fontSize: 12, paddingTop: 12 }} />
          <Area type="monotone" dataKey="anterior" name="Periodo anterior" stroke="#e2b47e" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
          <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#bf5b84" strokeWidth={3} fill="url(#revenueFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProfessionalPerformanceChart({ data = [] }) {
  if (!data.length) return <AdminEmptyState compact title="Sin desempeno profesional disponible" description="Asigna reservas a profesionales para comparar su rendimiento." />;
  return (
    <div className="admin-chart-height compact">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 18, left: 12, bottom: 0 }}>
          <CartesianGrid stroke="rgba(81,71,76,.10)" horizontal={false} strokeDasharray="4 8" />
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={axisTick} width={98} />
          <Tooltip content={<PremiumTooltip currency />} />
          <Bar dataKey="ingresos" name="Ingresos" radius={[0, 12, 12, 0]} background={{ fill: 'rgba(25,20,23,.04)', radius: 12 }}>
            {data.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ServiceDistributionChart({ data = [] }) {
  if (!data.length) return <AdminEmptyState compact title="Sin servicios para distribuir" description="La distribucion aparecera cuando existan reservas o pagos asociados." />;
  return (
    <div className="admin-donut-layout">
      <div className="admin-chart-height compact">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3} stroke="rgba(255,255,255,.85)" strokeWidth={3}>
              {data.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
            </Pie>
            <Tooltip content={<PremiumTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="admin-chart-legend">
        {data.map((item, index) => (
          <span key={item.name}>
            <i style={{ background: chartColors[index % chartColors.length] }} />
            {item.name} <strong>{item.value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

export function AppointmentStatusChart({ data = [] }) {
  if (!data.length) return <AdminEmptyState compact title="Sin estados operativos" description="Los estados se completaran al cargar reservas." />;
  return (
    <div className="admin-status-bars">
      {data.map((item, index) => (
        <div key={item.name}>
          <span>{item.name}</span>
          <strong>{item.value}</strong>
          <i style={{ width: `${Math.min(item.percent, 100)}%`, background: chartColors[index % chartColors.length] }} />
        </div>
      ))}
    </div>
  );
}

export function WeeklyOccupancyHeatmap({ data = [] }) {
  const slots = ['09:00', '11:00', '14:00', '16:00', '18:00'];
  if (!data.length) return <AdminEmptyState compact title="Sin ocupacion semanal" description="El mapa se activara con datos historicos de agenda." />;
  return (
    <div className="admin-heatmap">
      <div />
      {slots.map((slot) => <span key={slot}>{slot}</span>)}
      {data.map((row) => (
        <Fragment key={row.day}>
          <strong key={`${row.day}-label`}>{row.day}</strong>
          {row.values.map((value, index) => (
            <i
              key={`${row.day}-${index}`}
              aria-label={`${row.day} ${slots[index]} ocupacion ${value}%`}
              style={{ opacity: 0.22 + value / 130 }}
              title={`${row.day} ${slots[index]}: ${value}%`}
            />
          ))}
        </Fragment>
      ))}
    </div>
  );
}
