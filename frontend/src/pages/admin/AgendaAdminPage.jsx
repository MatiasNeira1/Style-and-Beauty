import { useQuery } from '@tanstack/react-query';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { agendaService } from '../../services/agendaService.js';

export function AgendaAdminPage() {
  const { data = [] } = useQuery({ queryKey: ['agenda-admin'], queryFn: agendaService.listBookings });

  return (
    <div className="stack">
      <SectionTitle eyebrow="Admin" title="Agenda" />
      <DataTable
        columns={[
          { key: 'fecha', label: 'Fecha' },
          { key: 'hora', label: 'Hora' },
          { key: 'estado', label: 'Estado' },
        ]}
        rows={Array.isArray(data) ? data : []}
      />
    </div>
  );
}
