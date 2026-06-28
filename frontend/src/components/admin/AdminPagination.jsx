export function AdminPagination({
  page = 1,
  pageSize = 20,
  totalItems = 0,
  itemLabel = 'registros',
  onPageChange,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const start = totalItems === 0 ? 0 : ((currentPage - 1) * pageSize) + 1;
  const end = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);
  const rangeLabel = totalItems === 0
    ? `0 de 0 ${itemLabel}`
    : `${start}-${end} de ${totalItems} ${itemLabel}`;

  return (
    <nav className="admin-pagination" aria-label={`Paginacion de ${itemLabel}`}>
      <span className="admin-pagination-range">Mostrando {rangeLabel}</span>
      <div className="admin-pagination-controls">
        <button
          type="button"
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Anterior
        </button>
        <span>Pagina {currentPage} de {totalPages}</span>
        <button
          type="button"
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Siguiente
        </button>
      </div>
    </nav>
  );
}
