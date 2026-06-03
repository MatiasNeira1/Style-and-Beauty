import { memo } from 'react';
import { Inbox } from 'lucide-react';

export const DataTable = memo(function DataTable({ columns = [], rows = [], emptyMessage = 'No hay registros disponibles.' }) {
  return (
    <div className="admin-data-table-shell">
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
                <tr key={row.id || row.idCita || row.idProducto || row.idPersona || index}>
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
