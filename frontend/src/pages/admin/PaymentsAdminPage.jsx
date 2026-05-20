import { useQuery } from '@tanstack/react-query';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { paymentService } from '../../services/paymentService.js';

export function PaymentsAdminPage() {
  const { data = [] } = useQuery({ queryKey: ['payments-admin'], queryFn: paymentService.listTransactions });

  return (
    <div className="stack">
      <SectionTitle eyebrow="Admin" title="Pagos" />
      <DataTable
        columns={[
          { key: 'cliente', label: 'Cliente' },
          { key: 'monto', label: 'Monto' },
          { key: 'estado', label: 'Estado' },
        ]}
        rows={Array.isArray(data) ? data : []}
      />
    </div>
  );
}
