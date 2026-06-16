import { memo } from 'react';
import { Inbox } from 'lucide-react';

function defaultRowKey(row, index) {
  return row.id || row.idCita || row.idProducto || row.idPersona || row.idTransaccion || index;
}

export const DataTable = memo(function DataTable({
  columns = [],
  rows = [],
  emptyMessage = 'No hay registros disponibles.',
  onRowClick,
  getRowKey = defaultRowKey,
  getRowLabel,
  compact = false,
}) {
  return (
    <div className={`admin-data-table-shell ${compact ? 'compact' : ''}`.trim()}>
      <div className="admin-data-table-scroll">
        <table className="admin-data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="admin-table-empty">
                  <Inbox size={24} />
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  className={onRowClick ? 'admin-clickable-row' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? 'button' : undefined}
                  aria-label={onRowClick ? getRowLabel?.(row) || 'Ver detalle' : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onRowClick(row);
                    }
                  } : undefined}
                >
                  {columns.map((column) => (
                    <td key={column.key}>
                      {column.render
                        ? column.render(row)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
