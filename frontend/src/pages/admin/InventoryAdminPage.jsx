import { DataTable } from '../../components/admin/DataTable.jsx';

export function InventoryAdminPage() {
  return <DataTable columns={[{ key: 'product', label: 'Producto' }, { key: 'stock', label: 'Stock' }]} rows={[]} />;
}
