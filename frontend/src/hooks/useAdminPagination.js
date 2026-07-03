import { useEffect, useMemo, useState } from 'react';

export const ADMIN_PAGE_SIZE = 15;

export function useAdminPagination(items = [], resetKey = '', pageSize = ADMIN_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const safeItems = Array.isArray(items) ? items : [];
  const totalItems = safeItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return safeItems.slice(start, start + pageSize);
  }, [currentPage, pageSize, safeItems]);

  return {
    page: currentPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems,
    setPage,
  };
}

function toTimestamp(value) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function getRecentTimestamp(item, fields = []) {
  for (const field of fields) {
    const time = toTimestamp(item?.[field]);
    if (time) return time;
  }
  return 0;
}

export function compareNewestByFields(fields = [], getFallbackId) {
  return (left, right) => {
    const timeDiff = getRecentTimestamp(right, fields) - getRecentTimestamp(left, fields);
    if (timeDiff !== 0) return timeDiff;

    const leftId = getFallbackId?.(left) ?? left?.id ?? '';
    const rightId = getFallbackId?.(right) ?? right?.id ?? '';
    return String(rightId).localeCompare(String(leftId), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  };
}
