"use client";

import { useState, useMemo } from "react";

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  pageItems: T[];
  goToPage: (page: number) => void;
  goNext: () => void;
  goPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginate an array client-side.
 */
export function usePagination<T>(
  data: T[],
  pageSize = 10
): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(data.length / pageSize)),
    [data.length, pageSize]
  );

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize]);

  const goToPage = (page: number) => {
    setCurrentPage(clamp(page, 1, totalPages));
  };

  const goNext = () => goToPage(currentPage + 1);
  const goPrev = () => goToPage(currentPage - 1);

  return {
    currentPage,
    totalPages,
    pageItems,
    goToPage,
    goNext,
    goPrev,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
