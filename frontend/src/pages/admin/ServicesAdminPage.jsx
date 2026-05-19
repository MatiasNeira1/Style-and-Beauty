import { DataTable } from '../../components/admin/DataTable.jsx';

export function ServicesAdminPage() {
  return <DataTable columns={[{ key: 'name', label: 'Servicio' }, { key: 'price', label: 'Precio' }]} rows={[]} />;
}
