import { DataTable } from '../../components/admin/DataTable.jsx';

export function ClientsAdminPage() {
  return <DataTable columns={[{ key: 'name', label: 'Cliente' }, { key: 'email', label: 'Email' }]} rows={[]} />;
}
