import { useQuery } from '@tanstack/react-query';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { catalogService } from '../../services/catalogService.js';

export function ServicesAdminPage() {
  const { data = [] } = useQuery({ queryKey: ['services-admin'], queryFn: catalogService.listServices });

  return (
    <div className="stack">
      <SectionTitle eyebrow="Admin" title="Servicios" />
      <DataTable
        columns={[
          { key: 'nombre', label: 'Servicio' },
          { key: 'precio', label: 'Precio' },
          { key: 'duracion', label: 'Duracion' },
        ]}
        rows={Array.isArray(data) ? data : []}
      />
    </div>
  );
}
