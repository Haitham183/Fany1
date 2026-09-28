'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  pageSize?: number;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  searchable = false,
  searchPlaceholder = 'بحث في الجدول...',
  searchFilter,
  emptyTitle = 'لا توجد بيانات متاحة',
  emptyDescription,
  className = '',
  pageSize = 25,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter Data
  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || !searchFilter) return data;
    return data.filter((item) => searchFilter(item, searchQuery.trim()));
  }, [data, searchQuery, searchFilter]);

  // Sort Data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const res = String(aVal).localeCompare(String(bVal), 'ar', { numeric: true });
      return sortDirection === 'asc' ? res : -res;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Paginated Data
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute start-3.5 top-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full ps-10 pe-3.5 py-2.5 min-h-[44px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-800 select-none">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={`p-3 text-start ${
                      col.sortable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800' : ''
                    } ${col.headerClassName || ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && sortKey === col.key && (
                        <span>
                          {sortDirection === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={`skel-row-${rIdx}`}>
                    {columns.map((col, cIdx) => (
                      <td key={`skel-cell-${cIdx}`} className="p-3">
                        <Skeleton height={20} className="w-full max-w-[120px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center">
                    <EmptyState title={emptyTitle} description={emptyDescription} />
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr
                    key={keyExtractor(item)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`p-3 ${col.className || ''}`}>
                        {col.render
                          ? col.render(item, (currentPage - 1) * pageSize + idx)
                          : (item as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
            <div>
              عرض صفحة {currentPage} من {totalPages} (إجمالي {sortedData.length} سجل)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-40 min-h-[36px] cursor-pointer"
              >
                السابق
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-40 min-h-[36px] cursor-pointer"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
