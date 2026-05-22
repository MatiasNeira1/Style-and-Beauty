import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { paymentService } from '../../services/paymentService.js';
import { CreditCard, ShieldCheck } from 'lucide-react';

export function PaymentsAdminPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ['payments-admin'], queryFn: paymentService.listTransactions });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-primary uppercase">
            Administración
          </span>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight mt-1">
            Control de Transacciones
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            Registro de abonos, pagos de servicios y depósitos de garantía.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-2xl text-primary font-bold text-sm">
          <CreditCard size={16} />
          <span>Historial de Pagos</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: 'cliente',
              label: 'Cliente',
              render: (row) => (
                <div className="flex flex-col">
                  <span className="font-bold text-ink">{row.cliente || 'Consumidor Final'}</span>
                  {row.metodoPago && <span className="text-xs text-ink-soft font-normal">{row.metodoPago}</span>}
                </div>
              )
            },
            {
              key: 'monto',
              label: 'Monto Cobrado',
              render: (row) => (
                <span className="text-ink font-extrabold text-base">
                  {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(row.monto || 0)}
                </span>
              )
            },
            {
              key: 'estado',
              label: 'Estado de Transacción',
              render: (row) => {
                const status = (row.estado || 'aprobado').toLowerCase();
                let classes = 'bg-gray-50 text-gray-600 border-gray-200';
                if (status === 'aprobado' || status === 'pagado' || status === 'completado' || status === 'exitoso') {
                  classes = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
                } else if (status === 'pendiente' || status === 'procesando') {
                  classes = 'bg-amber-50 text-amber-700 border-amber-200/60';
                } else if (status === 'rechazado' || status === 'fallido') {
                  classes = 'bg-rose-50 text-rose-700 border-rose-200/60';
                }
                return (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${classes}`}>
                    {status === 'aprobado' && <ShieldCheck size={12} className="text-emerald-600" />}
                    {status}
                  </span>
                );
              }
            }
          ]}
          rows={Array.isArray(data) ? data : []}
        />
      )}
    </div>
  );
}
