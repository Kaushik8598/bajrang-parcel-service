"use client";

import React, { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import TablePagination from "./TablePagination";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@/lib/types/common";

export interface SimpleDataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  showSrNo?: boolean;
  srNoLabel?: string;
  showPagination?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  maxHeight?: string;
  className?: string;
}

export default function SimpleDataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No records found.",
  showSrNo = false,
  srNoLabel = "Sr No",
  showPagination = false,
  page = 1,
  pageSize = 25,
  total,
  onPageChange,
  maxHeight,
  className,
}: SimpleDataTableProps<T>) {
  const totalCount = total !== undefined ? total : data.length;

  const displayRows = useMemo(() => {
    // If pagination is enabled and no external total/pagination provided, slice client-side
    if (showPagination && total === undefined && pageSize > 0 && pageSize !== -1) {
      const start = (page - 1) * pageSize;
      return data.slice(start, start + pageSize);
    }
    return data;
  }, [data, showPagination, total, page, pageSize]);

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Table Container */}
      <div className="relative rounded-lg border border-slate-300 overflow-hidden bg-white shadow-2xs">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#2980b9]" />
            <span className="text-xs font-semibold text-slate-700">Loading data...</span>
          </div>
        )}

        <div className={cn("overflow-x-auto", maxHeight ? `overflow-y-auto ${maxHeight}` : "")}>
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100/90 text-black font-bold sticky top-0 z-10 border-b border-slate-300">
              <tr>
                {showSrNo && (
                  <th className="w-12 px-2.5 py-2 text-center text-xs font-bold text-black uppercase tracking-wider border-r border-slate-300">
                    {srNoLabel}
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={cn(
                      "px-2.5 py-2 font-bold text-black text-xs uppercase tracking-wider whitespace-nowrap border-r border-slate-300 last:border-r-0",
                      col.width
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading && displayRows.length === 0 ? (
                Array.from({ length: Math.min(pageSize > 0 ? pageSize : 5, 5) }).map((_, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    {showSrNo && (
                      <td className="px-2.5 py-2 text-center border-r border-slate-200">
                        <Skeleton className="h-4 w-5 mx-auto" />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={String(col.key)} className="px-2.5 py-2 border-r border-slate-200 last:border-r-0">
                        <Skeleton className="h-4 w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : displayRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (showSrNo ? 1 : 0)}
                    className="py-8 text-center text-slate-400 text-xs"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                displayRows.map((row, rowIdx) => {
                  const srNo = (page - 1) * (pageSize > 0 ? pageSize : 0) + rowIdx + 1;
                  return (
                    <tr key={row._id || row.id || rowIdx} className="hover:bg-blue-50/40 transition-colors">
                      {showSrNo && (
                        <td className="px-2.5 py-2 text-center font-mono text-slate-500 font-semibold border-r border-slate-200">
                          {srNo}
                        </td>
                      )}
                      {columns.map((col) => {
                        const cellValue = row[col.key as string];
                        return (
                          <td
                            key={String(col.key)}
                            className="px-2.5 py-2 text-slate-800 border-r border-slate-200 last:border-r-0 align-middle"
                          >
                            {col.render ? col.render(cellValue, row) : (cellValue ?? "—")}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination (Conditionally Rendered) */}
      {showPagination && totalCount > 0 && onPageChange && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={totalCount}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
