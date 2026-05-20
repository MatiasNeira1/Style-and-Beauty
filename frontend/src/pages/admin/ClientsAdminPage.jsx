import { DataTable } from '../../components/admin/DataTable.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';

export function ClientsAdminPage() {
  return (
    <div className="stack">
      <SectionTitle eyebrow="Admin" title="Clientes" />
      <DataTable columns={[{ key: 'nombre', label: 'Cliente' }, { key: 'email', label: 'Email' }]} rows={[]} />
    </div>
  );
}
