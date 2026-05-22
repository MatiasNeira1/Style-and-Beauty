import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { catalogService } from '../../services/catalogService.js';
import { Scissors, Clock } from 'lucide-react';

export function ServicesAdminPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ['services-admin'], queryFn: catalogService.listServices });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-primary uppercase">
            Administración
          </span>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight mt-1">
            Catálogo de Servicios
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            Revisa y edita la oferta de tratamientos y servicios de belleza.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-2xl text-primary font-bold text-sm">
          <Scissors size={16} />
          <span>{data?.length || 0} Servicios Activos</span>
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
              key: 'nombre', 
              label: 'Servicio',
              render: (row) => (
                <div className="flex flex-col">
                  <span className="font-bold text-ink">{row.nombre || 'Servicio General'}</span>
                  {row.descripcion && <span className="text-xs text-ink-soft font-normal max-w-sm truncate">{row.descripcion}</span>}
                </div>
              )
            },
            { 
              key: 'precio', 
              label: 'Precio', 
              render: (row) => (
                <span className="text-ink font-bold">
                  {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(row.precio || 0)}
                </span>
              )
            },
            { 
              key: 'duracion', 
              label: 'Duración', 
              render: (row) => (
                <div className="flex items-center gap-1.5 text-xs text-ink-soft font-bold">
                  <Clock size={14} className="text-primary" />
                  <span>{row.duracion || 45} mins</span>
                </div>
              )
            },
          ]}
          rows={Array.isArray(data) ? data : []}
        />
      )}
    </div>
  );
}
