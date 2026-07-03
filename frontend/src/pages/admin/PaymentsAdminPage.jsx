import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminPagination } from '../../components/admin/AdminPagination.jsx';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { paymentService } from '../../services/paymentService.js';
import { CreditCard, DollarSign, ShieldCheck, WalletCards } from 'lucide-react';
import { AdminChartCard, AdminEmptyState, AdminErrorState, AdminKpiCard, AdminKpiGrid, AdminPageHeader, AdminSkeleton, AdminStatusBadge } from '../../components/admin/AdminPrimitives.jsx';
import { RevenueChart, ServiceDistributionChart } from '../../components/admin/AdminCharts.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { compareNewestByFields, useAdminPagination } from '../../hooks/useAdminPagination.js';
import { formatCurrencyCLP, formatDate } from '../../utils/adminFormatters.js';

function getPaymentId(row) {
  return row.idTransaccion || row.id || row.buyOrder || row.sessionId;
}

function getAmount(row) {
  return Number(row.monto || row.montoTotal || row.total || 0);
}

function getPaymentDate(row) {
  return row.transactionDate || row.fechaPago || row.fechaCreacion || row.createdAt || row.updatedAt;
}

function getMethod(row) {
  return row.metodoPago || row.tipoPago || row.paymentTypeCode || 'WebPay';
}

function isPaid(row) {
  return ['AUTORIZADA', 'APROBADO', 'PAGADO', 'COMPLETADO', 'EXITOSO'].includes(String(row.estado || '').toUpperCase());
}

function buildRevenueSeries(payments) {
  const byDay = payments.filter(isPaid).reduce((acc, payment) => {
    const date = getPaymentDate(payment);
    if (!date) return acc;
    const key = new Date(date).toISOString().slice(0, 10);
    acc[key] = (acc[key] || 0) + getAmount(payment);
    return acc;
  }, {});

  return Object.entries(byDay)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, ingresos]) => ({
      label: new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short' }).format(new Date(date)),
      ingresos,
    }));
}

function PaymentDetailModal({ payment, onClose }) {
  return (
    <Modal open={Boolean(payment)} title="Detalle de transaccion" onClose={onClose}>
      {payment && (
        <div className="admin-detail-modal">
          <div className="admin-detail-hero">
            <div>
              <span>{getMethod(payment)}</span>
              <h3>{formatCurrencyCLP(getAmount(payment))}</h3>
              <p>{payment.buyOrder || payment.idTransaccion || 'Sin orden de compra visible'}</p>
            </div>
            <AdminStatusBadge status={payment.estado || 'SIN_ESTADO'} />
          </div>
          <div className="admin-detail-grid">
            <div><span>ID transaccion</span><strong>{payment.idTransaccion || 'No disponible'}</strong></div>
            <div><span>ID cliente</span><strong>{payment.idCliente || 'No disponible'}</strong></div>
            <div><span>ID cita</span><strong>{payment.idCita || payment.idCitas || 'No disponible'}</strong></div>
            <div><span>Fecha</span><strong>{getPaymentDate(payment) ? formatDate(getPaymentDate(payment)) : 'Sin fecha'}</strong></div>
            <div><span>Codigo autorizacion</span><strong>{payment.authorizationCode || 'No disponible'}</strong></div>
            <div><span>Response code</span><strong>{payment.responseCode ?? 'No disponible'}</strong></div>
          </div>
          <div className="admin-modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function PaymentsAdminPage() {
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [methodFilter, setMethodFilter] = useState('TODOS');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const { data = [], isLoading, isError, refetch } = useQuery({ queryKey: ['payments-admin'], queryFn: paymentService.listTransactions });
  const payments = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const paymentMethods = useMemo(() => [...new Set(payments.map(getMethod).filter(Boolean))], [payments]);
  const filteredPayments = useMemo(() => payments.filter((row) => {
    const paymentDate = getPaymentDate(row);
    const matchesStatus = statusFilter === 'TODOS' ? true : String(row.estado || '').toUpperCase() === statusFilter;
    const matchesMethod = methodFilter === 'TODOS' ? true : getMethod(row) === methodFilter;
    const matchesDate = dateFilter ? paymentDate && new Date(paymentDate).toISOString().slice(0, 10) === dateFilter : true;
    return matchesStatus && matchesMethod && matchesDate;
  }).sort(compareNewestByFields(
    ['createdAt', 'created_at', 'fechaCreacion', 'fecha_creacion', 'fechaPago', 'fecha_pago', 'transactionDate', 'updatedAt', 'updated_at'],
    getPaymentId,
  )), [dateFilter, methodFilter, payments, statusFilter]);
  const hasActivePaymentFilters = Boolean(statusFilter !== 'TODOS' || methodFilter !== 'TODOS' || dateFilter);
  const paymentPagination = useAdminPagination(
    filteredPayments,
    `${statusFilter}|${methodFilter}|${dateFilter}`,
  );

  const summary = useMemo(() => {
    const paid = payments.filter(isPaid);
    const pending = payments.filter((row) => ['CREADA', 'PENDIENTE'].includes(String(row.estado || '').toUpperCase()));
    const total = paid.reduce((sum, row) => sum + getAmount(row), 0);
    const pendingTotal = pending.reduce((sum, row) => sum + getAmount(row), 0);
    const byMethod = payments.reduce((acc, row) => {
      const method = getMethod(row);
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});
    return {
      total,
      pendingTotal,
      paidCount: paid.length,
      average: paid.length ? total / paid.length : 0,
      methodData: Object.entries(byMethod).map(([name, value]) => ({ name, value })),
      revenueSeries: buildRevenueSeries(payments),
    };
  }, [payments]);

  return (
    <div className="admin-dashboard">
      <AdminPageHeader
        eyebrow="Finanzas"
        title="Control de transacciones"
        description="Registro real de pagos WebPay y estados de cobro."
        meta={(
          <div className="admin-segmented">
            {['TODOS', 'CREADA', 'PENDIENTE', 'AUTORIZADA', 'RECHAZADA', 'EXPIRADA'].map((status) => (
              <button key={status} type="button" className={statusFilter === status ? 'active' : ''} aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)}>
                {status}
              </button>
            ))}
          </div>
        )}
      />

      <AdminKpiGrid>
        <AdminKpiCard icon={DollarSign} title="Total recaudado" value={formatCurrencyCLP(summary.total)} trend={0} microcopy="Pagos autorizados" tone="gold" />
        <AdminKpiCard icon={WalletCards} title="Pendiente por cobrar" value={formatCurrencyCLP(summary.pendingTotal)} trend={summary.pendingTotal ? -4 : 0} microcopy="Creada o pendiente" tone="rose" />
        <AdminKpiCard icon={ShieldCheck} title="Pagos autorizados" value={summary.paidCount} trend={0} microcopy={`${payments.length} transacciones`} tone="sage" />
        <AdminKpiCard icon={CreditCard} title="Ticket promedio" value={formatCurrencyCLP(summary.average)} trend={0} microcopy="Promedio autorizado" tone="ink" />
      </AdminKpiGrid>

      <div className="admin-dashboard-grid main">
        <AdminChartCard title="Ingresos por periodo" description="Pagos autorizados agrupados por fecha real.">
          <RevenueChart data={summary.revenueSeries} />
        </AdminChartCard>
        <AdminChartCard title="Metodos de pago" description="Distribucion segun metodo registrado.">
          <ServiceDistributionChart data={summary.methodData} />
        </AdminChartCard>
      </div>

      <div className="admin-panel compact-panel">
        <header>
          <div>
            <h3>Filtros financieros</h3>
            <p>Segmenta transacciones por estado, metodo y fecha.</p>
          </div>
          <button type="button" className="admin-text-button" onClick={() => { setStatusFilter('TODOS'); setMethodFilter('TODOS'); setDateFilter(''); }}>
            Limpiar filtros
          </button>
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
      ) : payments.length === 0 ? (
        <AdminEmptyState title="Sin transacciones registradas" description="Cuando existan pagos WebPay apareceran aqui y alimentaran los graficos financieros." />
      ) : (
        <DataTable
          compact
          className="admin-list-table-card"
          scrollClassName="admin-list-table-scroll"
          onRowClick={(payment) => setSelectedPayment(payment)}
          getRowKey={(payment, index) => getPaymentId(payment) || index}
          getRowLabel={(payment) => `Ver transaccion ${getPaymentId(payment) || ''}`}
          emptyMessage={hasActivePaymentFilters ? 'No encontramos resultados con los filtros seleccionados.' : 'No hay transacciones para mostrar.'}
          columns={[
            {
              key: 'orden',
              label: 'Orden',
              render: (row) => (
                <div className="admin-table-main-cell">
                  <strong>{row.buyOrder || row.idTransaccion || 'Sin orden'}</strong>
                  <span>{getPaymentDate(row) ? formatDate(getPaymentDate(row)) : 'Sin fecha'}</span>
                </div>
              ),
            },
            { key: 'monto', label: 'Monto', render: (row) => <strong>{formatCurrencyCLP(getAmount(row))}</strong> },
            { key: 'metodo', label: 'Metodo', render: (row) => getMethod(row) },
            { key: 'estado', label: 'Estado', render: (row) => <AdminStatusBadge status={row.estado || 'SIN_ESTADO'} /> },
          ]}
          rows={paymentPagination.paginatedItems}
          toolbar={(
            <AdminPagination
              page={paymentPagination.page}
              pageSize={paymentPagination.pageSize}
              totalItems={paymentPagination.totalItems}
              itemLabel="pagos"
              onPageChange={paymentPagination.setPage}
            />
          )}
        />
      )}

      <PaymentDetailModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
    </div>
  );
}
