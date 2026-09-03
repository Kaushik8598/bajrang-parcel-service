"use client";

import { useState, useMemo, useCallback } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import TableToolbar from "./TableToolbar";
import TablePagination from "./TablePagination";
import { cn } from "@/lib/utils";
import type { ColumnDef, TablePermissions, SortDirection } from "@/lib/types/common";
import { exportToExcel, exportToPDF, printTable } from "@/lib/exportUtils";

// ─── Universal Sort Value Extractor (Completely Generic) ──────────────────────
function getSortableValue<T>(row: T, col?: ColumnDef<T>): string | number {
  if (!col) return "";

  // 1. Custom column-level sort value accessor (best for complex or nested data)
  if (col.sortValue) {
    const customVal = col.sortValue(row);
    if (customVal !== undefined && customVal !== null) {
      if (typeof customVal === "boolean") return customVal ? 1 : 0;
      return customVal;
    }
  }

  const keyStr = String(col.key);

  // 2. Nested dot path support (e.g. "branchInfo.branchName", "customer.name")
  if (keyStr.includes(".")) {
    const nested = keyStr.split(".").reduce<unknown>((acc, part) => {
      if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[part];
      return undefined;
    }, row);
    if (nested !== undefined && nested !== null) {
      return typeof nested === "object" ? JSON.stringify(nested) : (nested as string | number);
    }
  }

  // 3. Direct property lookup
  const raw = (row as Record<string, unknown>)[keyStr];
  if (raw !== undefined && raw !== null) {
    if (typeof raw === "string" || typeof raw === "number") return raw;
    if (typeof raw === "boolean") return raw ? 1 : 0;
    if (typeof raw === "object") return JSON.stringify(raw);
  }

  return "";
}

// ─── Sort icon ─────────────────────────────────────────────────────────────────
function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === "asc") return <ArrowUp className="w-3.5 h-3.5 text-[#2980b9]" />;
  if (direction === "desc") return <ArrowDown className="w-3.5 h-3.5 text-[#2980b9]" />;
  return <ArrowUpDown className="w-3.5 h-3.5 opacity-30 group-hover:opacity-70 transition-opacity" />;
}

// ─── Props ─────────────────────────────────────────────────────────────────────
export interface DataTableProps<T extends Record<string, unknown>> {
  title: string;
  columns: ColumnDef<T>[];
  /** Optional custom columns configuration specifically for Excel / PDF / Print exports */
  exportColumns?: ColumnDef<T>[];
  /** Optional custom footer totals row for Excel / PDF / Print exports */
  exportFooterRow?: (string | number | null | undefined)[];
  data: T[];
  isLoading?: boolean;
  permissions?: TablePermissions;
  onAdd?: () => void;
  /** Optional server-side search handlers */
  onSearch?: (v: string) => void;
  searchValue?: string;
  /** If provided, pagination is controlled externally (server-side) */
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (p: number) => void;
    onPageSizeChange: (s: number) => void;
  };
  /** If true, filtering/sorting/pagination handled internally (client-side) */
  clientSide?: boolean;
  /** Optional custom table footer (e.g. summary totals row) */
  footer?: React.ReactNode;
}

// ─── Main DataTable ────────────────────────────────────────────────────────────
export default function DataTable<T extends Record<string, unknown>>({
  title,
  columns,
  exportColumns,
  exportFooterRow,
  data,
  isLoading = false,
  permissions = {
    canExcel: true,
    canPDF: true,
    canPrint: true,
    canAdd: true,
  },
  onAdd,
  onSearch,
  searchValue,
  pagination,
  clientSide = true,
  footer,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(pagination?.pageSize ?? 25);

  const activeSearch = searchValue !== undefined ? searchValue : search;

  // ── Filter & Sort data (completely generic for any table module) ──
  const processed = useMemo(() => {
    let rows = [...data];

    // Filter only in clientSide mode
    if (clientSide && search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        columns.some((col) => {
          const val = getSortableValue(row, col);
          return String(val ?? "").toLowerCase().includes(q);
        })
      );
    }

    // Sort rows if sortKey & sortDir are active
    if (sortKey && sortDir) {
      const targetCol = columns.find((c) => String(c.key) === sortKey);
      rows.sort((a, b) => {
        const av = getSortableValue(a, targetCol);
        const bv = getSortableValue(b, targetCol);
        const cmp = String(av).localeCompare(String(bv), undefined, {
          numeric: true,
          sensitivity: "base",
        });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return rows;
  }, [data, search, sortKey, sortDir, columns, clientSide]);

  // ── Pagination ──
  const totalRows = clientSide ? processed.length : (pagination?.total ?? data.length);
  const currentPage = clientSide ? localPage : (pagination?.page ?? 1);
  const currentPageSize = clientSide ? localPageSize : (pagination?.pageSize ?? 25);

  const paginatedRows = useMemo(() => {
    if (!clientSide) return processed; // Already page-sliced by server, sorted by client
    if (localPageSize === -1) return processed; // Show all rows
    const from = (localPage - 1) * localPageSize;
    return processed.slice(from, from + localPageSize);
  }, [processed, localPage, localPageSize, clientSide]);

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        if (sortDir === "asc") {
          setSortDir("desc");
        } else if (sortDir === "desc") {
          setSortDir(null);
          setSortKey(null);
        } else {
          setSortDir("asc");
        }
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey, sortDir]
  );

  const handlePageChange = (p: number) => {
    if (clientSide) setLocalPage(p);
    else pagination?.onPageChange(p);
  };

  const handlePageSizeChange = (s: number) => {
    if (clientSide) {
      setLocalPageSize(s);
      setLocalPage(1);
    } else {
      pagination?.onPageSizeChange(s);
    }
  };

  // ── Export handlers ──
  const activeExportCols = exportColumns || columns;
  const exportData = clientSide ? (search ? processed : data) : data;
  const handleExcel = () => exportToExcel(activeExportCols, exportData, title, exportFooterRow);
  const handlePDF = () => exportToPDF(activeExportCols, exportData, title, exportFooterRow);
  const handlePrint = () => printTable(activeExportCols, exportData, title, exportFooterRow);

  return (
    <div
      id={`datatable-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 md:p-6 space-y-4 relative"
    >
      {/* Top Toolbar */}
      <TableToolbar
        title={title}
        permissions={permissions}
        search={activeSearch}
        onSearchChange={(v) => {
          setSearch(v);
          if (clientSide) {
            setLocalPage(1);
          }
          onSearch?.(v);
        }}
        pageSize={currentPageSize}
        onPageSizeChange={handlePageSizeChange}
        onExcel={permissions.canExcel ? handleExcel : undefined}
        onPDF={permissions.canPDF ? handlePDF : undefined}
        onPrint={permissions.canPrint ? handlePrint : undefined}
        onAdd={permissions.canAdd ? onAdd : undefined}
      />

      {/* Table Container */}
      <div className="relative rounded-lg border border-slate-300 overflow-hidden">
        {/* Semi-transparent Loading Overlay for smooth data fetching UX */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-2.5 transition-all animate-in fade-in-0 duration-150">
            <div className="flex items-center justify-center p-3 rounded-full bg-white shadow-md border border-slate-200">
              <Loader2 className="w-6 h-6 animate-spin text-[#2980b9]" />
            </div>
            <span className="text-xs font-semibold text-slate-700 tracking-wide">
              Loading data...
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-300">
                {/* Sr No */}
                <th className="w-14 px-2.5 py-2 text-left font-bold text-black text-sm uppercase tracking-wider whitespace-nowrap border-r border-slate-300">
                  Sr No
                </th>

                {/* Dynamically Render All Column Headers */}
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={cn(
                      "text-left px-2.5 py-2 font-bold text-black text-sm uppercase tracking-wider whitespace-nowrap group border-r border-slate-300 last:border-r-0",
                      col.width,
                      col.sortable && "cursor-pointer select-none hover:text-slate-800"
                    )}
                    onClick={() => col.sortable && handleSort(String(col.key))}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.label}
                      {col.sortable && (
                        <SortIcon
                          direction={sortKey === String(col.key) ? sortDir : null}
                        />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-300 bg-white">
              {isLoading && paginatedRows.length === 0 ? (
                // Loading skeleton rows on initial fetch
                Array.from({ length: currentPageSize === -1 || currentPageSize > 5 ? 5 : currentPageSize }).map((_, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-2.5 py-2 border-r border-slate-300">
                      <Skeleton className="h-4 w-6" />
                    </td>
                    {columns.map((col) => (
                      <td key={String(col.key)} className="px-2.5 py-2 border-r border-slate-300 last:border-r-0">
                        <Skeleton className="h-4 w-28" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={1 + columns.length}
                    className="text-center py-12 text-slate-400 text-sm"
                  >
                    No data found
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const srNo =
                    currentPageSize === -1
                      ? idx + 1
                      : (currentPage - 1) * currentPageSize + idx + 1;

                  return (
                    <tr
                      key={idx}
                      id={`table-row-${idx}`}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Sr No */}
                      <td className="px-2.5 py-2 text-black text-sm font-semibold border-r border-slate-300">{srNo}</td>

                      {/* Dynamically Render All Column Cells */}
                      {columns.map((col) => (
                        <td key={String(col.key)} className="px-2.5 py-2 text-black text-sm border-r border-slate-300 last:border-r-0">
                          {col.render
                            ? col.render(row[col.key as string], row)
                            : String(row[col.key as string] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
            {footer && (
              <tfoot className="bg-slate-100/95 font-bold border-t-2 border-slate-300">
                {footer}
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <TablePagination
        page={currentPage}
        pageSize={currentPageSize}
        total={totalRows}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
