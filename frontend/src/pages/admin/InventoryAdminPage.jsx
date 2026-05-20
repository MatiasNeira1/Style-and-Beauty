import { useQuery } from '@tanstack/react-query';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { inventoryService } from '../../services/inventoryService.js';

export function InventoryAdminPage() {
  const { data = [] } = useQuery({ queryKey: ['inventory-admin'], queryFn: inventoryService.listProducts });

  return (
    <div className="stack">
      <SectionTitle eyebrow="Admin" title="Inventario" />
      <DataTable
        columns={[
          { key: 'nombre', label: 'Producto' },
          { key: 'precio', label: 'Precio' },
          { key: 'categoria', label: 'Categoria' },
        ]}
        rows={Array.isArray(data) ? data : []}
      />
    </div>
  );
}
