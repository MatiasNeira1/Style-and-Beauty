export function DataTable({ columns = [], rows = [] }) {
  return (
    <div className="table-shell">
      <table className="data-table">
        <thead>
          <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length}>Sin registros disponibles.</td>
            </tr>
          )}
          {rows.map((row, index) => (
            <tr key={row.id || row.idCita || row.idProducto || index}>
              {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
