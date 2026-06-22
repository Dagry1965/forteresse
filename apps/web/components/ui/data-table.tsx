import React from "react";
interface Column<T> { key: string; header: string; render?: (row: T) => React.ReactNode; className?: string; }
interface DataTableProps<T> { columns: Column<T>[]; data: T[]; emptyMessage?: string; }
export function DataTable<T extends { id?: string | number }>({ columns, data, emptyMessage = "aucune donnée" }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse text-[oklch(0.22_0_0)]">
        <thead><tr className="text-left border-b border-[oklch(0.92_0_0)]">
          {columns.map((col, i) => (<th key={i} className={`pb-4 font-bold text-[oklch(0.45_0_0)] lowercase ${col.className || ""}`}>{col.header}</th>))}
        </tr></thead>
        <tbody className="divide-y divide-[oklch(0.96_0_0)]">
          {data.length === 0 ? (<tr><td colSpan={columns.length} className="py-10 text-center text-[oklch(0.45_0_0)] lowercase">{emptyMessage}</td></tr>) : 
          (data.map((row, i) => (<tr key={i} className="hover:bg-[oklch(0.99_0_0)] transition-colors">
            {columns.map((col, j) => (<td key={j} className={`py-4 ${col.className || ""}`}>{col.render ? col.render(row) : (row as any)[col.key]}</td>))}
          </tr>)))}
        </tbody>
      </table>
    </div>
  );
}