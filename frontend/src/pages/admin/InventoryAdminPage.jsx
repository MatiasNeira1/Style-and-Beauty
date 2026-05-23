import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { inventoryService } from '../../services/inventoryService.js';
import { Package, AlertCircle } from 'lucide-react';

export function InventoryAdminPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ['inventory-admin'], queryFn: inventoryService.listProducts });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-primary uppercase">
            Administración
          </span>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight mt-1">
            Inventario de Productos
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            Control de existencias y productos de belleza a la venta.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-2xl text-primary font-bold text-sm">
          <Package size={16} />
          <span>{data?.length || 0} Productos</span>
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
              label: 'Producto',
              render: (row) => (
                <div className="flex flex-col">
                  <span className="font-bold text-ink">{row.nombre || 'Producto sin nombre'}</span>
                  {row.descripcion && <span className="text-xs text-ink-soft font-normal max-w-sm truncate">{row.descripcion}</span>}
                </div>
              )
            },
            {
              key: 'categoria',
              label: 'Categoría',
              render: (row) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d7ad66]/10 text-[#a87d32] border border-[#d7ad66]/20">
                  {row.categoria || 'Cosméticos'}
                </span>
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
              key: 'stock',
              label: 'Stock',
              render: (row) => {
                const qty = row.stock !== undefined ? row.stock : (row.cantidad !== undefined ? row.cantidad : 15);
                const isLow = qty <= 5;
                return (
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    {isLow ? (
                      <span className="flex items-center gap-1 text-primary">
                        <AlertCircle size={14} />
                        <span>{qty} (Bajo)</span>
                      </span>
                    ) : (
                      <span className="text-sage">{qty} unidades</span>
                    )}
                  </div>
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
