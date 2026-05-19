import { DataTable } from '../../components/admin/DataTable.jsx';

export function PaymentsAdminPage() {
  return <DataTable columns={[{ key: 'client', label: 'Cliente' }, { key: 'amount', label: 'Monto' }]} rows={[]} />;
}
