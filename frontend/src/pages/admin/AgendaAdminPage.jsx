import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { agendaService } from '../../services/agendaService.js';
import { CalendarRange } from 'lucide-react';

export function AgendaAdminPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ['agenda-admin'], queryFn: agendaService.listBookings });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-primary uppercase">
            Administración
          </span>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight mt-1">
            Agenda de Citas
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            Gestiona las reservas activas y bloqueos de agenda.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-2xl text-primary font-bold text-sm">
          <CalendarRange size={16} />
          <span>{data?.length || 0} Reservas Totales</span>
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
                  <span className="font-semibold text-ink">{row.clienteNombre || row.cliente || 'Cliente General'}</span>
                  <span className="text-xs text-ink-soft font-normal">{row.clienteEmail || ''}</span>
                </div>
              )
            },
            { 
              key: 'servicio', 
              label: 'Servicio', 
              render: (row) => row.servicioNombre || row.servicio || 'Servicio Desconocido' 
            },
            { 
              key: 'fecha', 
              label: 'Fecha y Hora', 
              render: (row) => (
                <div className="flex flex-col">
                  <span className="font-semibold text-ink">{row.fecha}</span>
                  <span className="text-xs text-primary font-bold">{row.hora}</span>
                </div>
              )
            },
            {
              key: 'estado',
              label: 'Estado',
              render: (row) => {
                const status = (row.estado || 'pendiente').toLowerCase();
                let classes = 'bg-gray-50 text-gray-600 border-gray-200';
                if (status === 'confirmada' || status === 'completada' || status === 'activa') {
                  classes = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
                } else if (status === 'pendiente') {
                  classes = 'bg-amber-50 text-amber-700 border-amber-200/60';
                } else if (status === 'cancelada') {
                  classes = 'bg-rose-50 text-rose-700 border-rose-200/60';
                }
                return (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${classes}`}>
                    {status}
                  </span>
                );
              },
            },
          ]}
          rows={Array.isArray(data) ? data : []}
        />
      )}
    </div>
  );
}
