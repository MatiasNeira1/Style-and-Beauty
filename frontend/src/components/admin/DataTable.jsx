export function DataTable({ columns = [], rows = [] }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-xl">

      <div className="overflow-x-auto">
        <table className="min-w-full">

          {/* HEADER */}
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-neutral-500"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-neutral-100">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-16 text-center text-sm font-medium text-neutral-400"
                >
                  No hay registros disponibles.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id || index}
                  className="hover:bg-neutral-50 transition-colors duration-200"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-5 text-sm text-neutral-700 whitespace-nowrap"
                    >
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
}