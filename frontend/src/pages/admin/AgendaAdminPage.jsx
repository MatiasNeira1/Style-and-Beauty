import { DataTable } from '../../components/admin/DataTable.jsx';

export function AgendaAdminPage() {
  return <DataTable columns={[{ key: 'date', label: 'Fecha' }, { key: 'status', label: 'Estado' }]} rows={[]} />;
}
