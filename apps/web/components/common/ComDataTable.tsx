// components/ui/data-table.tsx

'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T extends { id?: string | number }> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  searchable?: boolean;
  pageSize?: number;
}

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  onRowClick,
  onEdit,
  onDelete,
  loading = false,
  emptyMessage = "Aucune donnée",
  searchable = true,
  pageSize = 10,
}: DataTableProps<T>) {

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ Protection importante
  if (!Array.isArray(data)) {
    return (
      <div className="p-8 text-center text-red-500 border rounded-2xl">
        Erreur : Les données reçues ne sont pas valides.
      </div>
    );
  }

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    const term = searchTerm.toLowerCase().trim();
    return data.filter((item) =>
      columns.some((col) => {
        const value = (item as unknown as Record<string, unknown>)[String(col.key)];
        return value?.toString().toLowerCase().includes(term);
      })
    );
  }, [data, searchTerm, columns]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      {searchable && (
        <div className="flex justify-between items-center">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full max-w-sm border rounded-2xl px-4 py-2 text-sm"
          />
          <span className="text-sm text-slate-500">
            {filteredData.length} résultat{filteredData.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Tableau */}
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={`px-4 py-3 text-left font-semibold text-slate-600 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
              {(onEdit || onDelete) && <th className="w-28 px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-10 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={item.id ?? index}
                  onClick={() => onRowClick?.(item)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  {columns.map((col, j) => (
                    <td key={j} className={`px-4 py-4 ${col.className || ''}`}>
                      {col.render ? col.render(item) : String((item as unknown as Record<string, unknown>)[String(col.key)] ?? '')}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        {onEdit && <Button size="sm" variant="outline" onClick={() => onEdit(item)}>Modifier</Button>}
                        {onDelete && <Button size="sm" variant="destructive" onClick={() => onDelete(item)}>Supprimer</Button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Précédent
          </Button>
          <span className="text-sm">Page {currentPage} / {totalPages}</span>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
