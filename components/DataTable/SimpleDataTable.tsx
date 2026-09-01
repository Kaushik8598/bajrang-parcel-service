"use client";

import React, { useState, useMemo } from "react";
import { Loader2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import TablePagination from "./TablePagination";
import { cn } from "@/lib/utils";
import type { ColumnDef, SortDirection } from "@/lib/types/common";

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
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;
    const col = columns.find((c) => String(c.key) === sortKey);
    if (!col) return data;

    return [...data].sort((a, b) => {
      let valA: unknown;
      let valB: unknown;

      if (col.sortValue) {
        valA = col.sortValue(a);
        valB = col.sortValue(b);
      } else {
        const keyStr = String(col.key);
        if (keyStr.includes(".")) {
          valA = keyStr.split(".").reduce<unknown>((acc, part) => (acc && typeof acc === "object" ? (acc as any)[part] : undefined), a);
          valB = keyStr.split(".").reduce<unknown>((acc, part) => (acc && typeof acc === "object" ? (acc as any)[part] : undefined), b);
        } else {
          valA = a[keyStr];
          valB = b[keyStr];
        }
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA ?? "").toLowerCase();
      const strB = String(valB ?? "").toLowerCase();
      return sortDirection === "asc"
        ? strA.localeCompare(strB, undefined, { numeric: true, sensitivity: "base" })
        : strB.localeCompare(strA, undefined, { numeric: true, sensitivity: "base" });
    });
  }, [data, sortKey, sortDirection, columns]);

  const totalCount = total !== undefined ? total : sortedData.length;

  const displayRows = useMemo(() => {
    // If pagination is enabled and no external total/pagination provided, slice client-side
    if (showPagination && total === undefined && pageSize > 0 && pageSize !== -1) {
      const start = (page - 1) * pageSize;
      return sortedData.slice(start, start + pageSize);
    }
    return sortedData;
  }, [sortedData, showPagination, total, page, pageSize]);

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
                {columns.map((col) => {
                  const isSortable = Boolean(col.sortable);
                  const isSorted = sortKey === String(col.key);
                  return (
                    <th
                      key={String(col.key)}
                      onClick={isSortable ? () => handleSort(String(col.key)) : undefined}
                      className={cn(
                        "px-2.5 py-2 font-bold text-black text-xs uppercase tracking-wider whitespace-nowrap border-r border-slate-300 last:border-r-0",
                        col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                        isSortable && "cursor-pointer select-none hover:bg-slate-200/80 transition-colors group",
                        col.width
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          col.align === "right"
                            ? "justify-end"
                            : col.align === "center"
                            ? "justify-center"
                            : "justify-start"
                        )}
                      >
                        <span>{col.label}</span>
                        {isSortable && (
                          isSorted ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="w-3 h-3 text-[#2980b9] shrink-0" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-[#2980b9] shrink-0" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-25 group-hover:opacity-70 transition-opacity shrink-0" />
                          )
                        )}
                      </div>
                    </th>
                  );
                })}
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
                        <td className="px-2.5 py-2 text-center font-mono text-black font-semibold border-r border-slate-200">
                          {srNo}
                        </td>
                      )}
                      {columns.map((col) => {
                        const cellValue = row[col.key as string];
                        return (
                          <td
                            key={String(col.key)}
                            className={cn(
                              "px-2.5 py-2 text-black border-r border-slate-200 last:border-r-0 align-middle",
                              col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                              col.className
                            )}
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
