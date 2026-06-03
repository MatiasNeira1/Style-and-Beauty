import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { paymentService } from '../../services/paymentService.js';
import { CreditCard, DollarSign, ShieldCheck, WalletCards } from 'lucide-react';
import { AdminChartCard, AdminErrorState, AdminKpiCard, AdminKpiGrid, AdminPageHeader, AdminSkeleton, AdminStatusBadge } from '../../components/admin/AdminPrimitives.jsx';
import { RevenueChart, ServiceDistributionChart } from '../../components/admin/AdminCharts.jsx';
import { formatCurrencyCLP } from '../../utils/adminFormatters.js';

function getAmount(row) {
  return Number(row.monto || row.montoTotal || row.total || 0);
}

function isPaid(row) {
  return ['aprobado', 'pagado', 'completado', 'exitoso'].includes(String(row.estado || 'aprobado').toLowerCase());
}

export function PaymentsAdminPage() {
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [methodFilter, setMethodFilter] = useState('TODOS');
  const [dateFilter, setDateFilter] = useState('');
  const { data = [], isLoading, isError, refetch } = useQuery({ queryKey: ['payments-admin'], queryFn: paymentService.listTransactions });
  const payments = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const paymentMethods = useMemo(() => [...new Set(payments.map((row) => row.metodoPago || row.tipoPago).filter(Boolean))], [payments]);
  const filteredPayments = payments.filter((row) => {
    const paymentDate = row.fechaPago || row.fechaCreacion || row.createdAt;
    const matchesStatus = statusFilter === 'TODOS' ? true : String(row.estado || '').toUpperCase() === statusFilter;
    const matchesMethod = methodFilter === 'TODOS' ? true : (row.metodoPago || row.tipoPago) === methodFilter;
    const matchesDate = dateFilter ? paymentDate && new Date(paymentDate).toISOString().slice(0, 10) === dateFilter : true;
    return matchesStatus && matchesMethod && matchesDate;
  });

  const summary = useMemo(() => {
    const paid = payments.filter(isPaid);
    const pending = payments.filter((row) => String(row.estado || '').toUpperCase().includes('PENDIENTE'));
    const total = paid.reduce((sum, row) => sum + getAmount(row), 0);
    const pendingTotal = pending.reduce((sum, row) => sum + getAmount(row), 0);
    const byMethod = payments.reduce((acc, row) => {
      const method = row.metodoPago || row.tipoPago || 'Sin metodo';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});
    return {
      total,
      pendingTotal,
      paidCount: paid.length,
      average: paid.length ? total / paid.length : 0,
      methodData: Object.entries(byMethod).map(([name, value]) => ({ name, value })),
      revenueSeries: payments.slice(0, 7).map((row, index) => ({
        label: row.fechaPago || row.fechaCreacion || row.createdAt
          ? new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short' }).format(new Date(row.fechaPago || row.fechaCreacion || row.createdAt))
          : `Pago ${index + 1}`,
        ingresos: getAmount(row),
        anterior: Math.round(getAmount(row) * 0.82),
      })),
    };
  }, [payments]);

  return (
    <div className="admin-dashboard">
      <AdminPageHeader
        eyebrow="Finanzas"
        title="Control de transacciones"
        description="Registro de abonos, pagos de servicios y depositos de garantia."
        meta={(
          <div className="admin-segmented">
            {['TODOS', 'PENDIENTE', 'APROBADO'].map((status) => (
              <button
                key={status}
                type="button"
                className={statusFilter === status ? 'active' : ''}
                aria-pressed={statusFilter === status}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        )}
      />

      <AdminKpiGrid>
        <AdminKpiCard icon={DollarSign} title="Total recaudado" value={formatCurrencyCLP(summary.total)} trend={15} microcopy="Pagos confirmados" tone="gold" />
        <AdminKpiCard icon={WalletCards} title="Pendiente por cobrar" value={formatCurrencyCLP(summary.pendingTotal)} trend={summary.pendingTotal ? -4 : 0} microcopy="Seguimiento financiero" tone="rose" />
        <AdminKpiCard icon={ShieldCheck} title="Pagos confirmados" value={summary.paidCount} trend={9} microcopy={`${payments.length} transacciones registradas`} tone="sage" />
        <AdminKpiCard icon={CreditCard} title="Ticket promedio" value={formatCurrencyCLP(summary.average)} trend={5} microcopy="Promedio por pago exitoso" tone="ink" />
      </AdminKpiGrid>

      <div className="admin-dashboard-grid main">
        <AdminChartCard title="Ingresos por periodo" description="Evolucion visual de pagos registrados.">
          <RevenueChart data={summary.revenueSeries} />
        </AdminChartCard>
        <AdminChartCard title="Metodos de pago" description="Distribucion segun metodo registrado.">
          <ServiceDistributionChart data={summary.methodData} />
        </AdminChartCard>
      </div>

      <div className="admin-panel">
        <header>
          <div>
            <h3>Filtros financieros</h3>
            <p>Segmenta transacciones por estado, metodo y fecha de pago.</p>
          </div>
        </header>
        <div className="admin-filter-row">
          <label className="field">
            <span>Metodo</span>
            <select value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)}>
              <option value="TODOS">Todos los metodos</option>
              {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Fecha</span>
            <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
          </label>
          <button
            type="button"
            className="admin-text-button align-end"
            onClick={() => {
              setStatusFilter('TODOS');
              setMethodFilter('TODOS');
              setDateFilter('');
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {isLoading ? (
        <AdminSkeleton rows={5} />
      ) : isError ? (
        <AdminErrorState
          title="No pudimos cargar los pagos"
          message="Ocurrio un problema al consultar las transacciones. Intenta nuevamente."
          actions={<button type="button" className="admin-primary-action" onClick={() => refetch()}>Reintentar</button>}
        />
      ) : (
        <div className="admin-panel">
          <header>
            <div>
              <h3>Historial financiero</h3>
              <p>Transacciones con estado, metodo y monto cobrado.</p>
            </div>
          </header>
          <DataTable
            emptyMessage="No hay transacciones para este filtro."
            columns={[
              {
                key: 'cliente',
                label: 'Cliente',
                render: (row) => (
                  <div className="flex flex-col">
                    <span className="font-bold text-ink">{row.cliente || 'Consumidor Final'}</span>
                    {row.metodoPago && <span className="text-xs text-ink-soft font-normal">{row.metodoPago}</span>}
                  </div>
                ),
              },
              {
                key: 'monto',
                label: 'Monto cobrado',
                render: (row) => <span className="text-ink font-extrabold text-base">{formatCurrencyCLP(getAmount(row))}</span>,
              },
              {
                key: 'estado',
                label: 'Estado',
                render: (row) => <AdminStatusBadge status={row.estado || 'APROBADO'} />,
              },
            ]}
            rows={filteredPayments}
          />
        </div>
      )}
    </div>
  );
}
