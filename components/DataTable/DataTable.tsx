"use client";

import { useState, useMemo, useCallback } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import TableToolbar from "./TableToolbar";
import TablePagination from "./TablePagination";
import { cn } from "@/lib/utils";
import type { ColumnDef, TablePermissions, SortDirection } from "@/lib/types/common";

// ─── Export helpers ────────────────────────────────────────────────────────────
async function exportToExcel<T>(
  columns: ColumnDef<T>[],
  data: T[],
  title: string
) {
  const { utils, writeFile } = await import("xlsx").then((m) => m);
  // Filter out columns with key "action" or "actions" for export
  const exportableCols = columns.filter(
    (c) => !["action", "actions"].includes(String(c.key).toLowerCase())
  );
  const headers = exportableCols.map((c) => c.label);
  const rows = data.map((row) =>
    exportableCols.map((c) => {
      const val = (row as Record<string, unknown>)[c.key as string];
      return val ?? "";
    })
  );
  const ws = utils.aoa_to_sheet([headers, ...rows]);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, title.slice(0, 31));
  writeFile(wb, `${title}.xlsx`);
}

async function exportToPDF<T>(
  columns: ColumnDef<T>[],
  data: T[],
  title: string
) {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;
  const exportableCols = columns.filter(
    (c) => !["action", "actions"].includes(String(c.key).toLowerCase())
  );
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  autoTable(doc, {
    startY: 22,
    head: [exportableCols.map((c) => c.label)],
    body: data.map((row) =>
      exportableCols.map((c) => {
        const val = (row as Record<string, unknown>)[c.key as string];
        return String(val ?? "");
      })
    ),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [44, 62, 80] },
  });
  doc.save(`${title}.pdf`);
}

function printTable<T>(columns: ColumnDef<T>[], data: T[], title: string) {
  const exportableCols = columns.filter(
    (c) => !["action", "actions"].includes(String(c.key).toLowerCase())
  );
  const headers = exportableCols.map((c) => `<th>${c.label}</th>`).join("");
  const rows = data
    .map(
      (row) =>
        `<tr>${exportableCols
          .map((c) => {
            const val = (row as Record<string, unknown>)[c.key as string];
            return `<td>${val ?? ""}</td>`;
          })
          .join("")}</tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>${title}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:12px;padding:20px}
    table{width:100%;border-collapse:collapse;margin-top:10px}
    th,td{border:1px solid #ccc;padding:8px 12px;text-align:left}
    th{background:#2c3e50;color:#fff}
    h2{margin-bottom:12px;color:#2c3e50}
  </style>
  </head><body><h2>${title}</h2><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }
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
}

// ─── Main DataTable ────────────────────────────────────────────────────────────
export default function DataTable<T extends Record<string, unknown>>({
  title,
  columns,
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
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(pagination?.pageSize ?? 25);

  const activeSearch = searchValue !== undefined ? searchValue : search;

  // ── Client-side filter + sort ──
  const processed = useMemo(() => {
    if (!clientSide) return data;
    let rows = [...data];

    // Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        columns.some((col) => {
          const val = row[col.key as string];
          return String(val ?? "").toLowerCase().includes(q);
        })
      );
    }

    // Sort
    if (sortKey && sortDir) {
      rows.sort((a, b) => {
        const av = a[sortKey] ?? "";
        const bv = b[sortKey] ?? "";
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return rows;
  }, [data, search, sortKey, sortDir, columns, clientSide]);

  // ── Client-side pagination ──
  const totalRows = clientSide ? processed.length : (pagination?.total ?? data.length);
  const currentPage = clientSide ? localPage : (pagination?.page ?? 1);
  const currentPageSize = clientSide ? localPageSize : (pagination?.pageSize ?? 25);

  const paginatedRows = useMemo(() => {
    if (!clientSide) return data;
    if (localPageSize === -1) return processed; // Show all rows
    const from = (localPage - 1) * localPageSize;
    return processed.slice(from, from + localPageSize);
  }, [processed, localPage, localPageSize, clientSide, data]);

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
        if (sortDir === "desc") setSortKey(null);
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
  const handleExcel = () => exportToExcel(columns, paginatedRows, title);
  const handlePDF = () => exportToPDF(columns, paginatedRows, title);
  const handlePrint = () => printTable(columns, paginatedRows, title);

  return (
    <div
      id={`datatable-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 md:p-6 space-y-4"
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
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200">
                {/* Sr No */}
                <th className="w-16 px-4 py-3 text-left font-bold text-black text-xs uppercase tracking-wider whitespace-nowrap">
                  Sr No
                </th>

                {/* Dynamically Render All Column Headers */}
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={cn(
                      "text-left px-4 py-3 font-bold text-black text-xs uppercase tracking-wider whitespace-nowrap group",
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

            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                // Loading skeleton rows
                Array.from({ length: currentPageSize === -1 || currentPageSize > 5 ? 5 : currentPageSize }).map((_, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-6" />
                    </td>
                    {columns.map((col) => (
                      <td key={String(col.key)} className="px-4 py-3.5">
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
                      <td className="px-4 py-3 text-black text-xs font-semibold">{srNo}</td>

                      {/* Dynamically Render All Column Cells */}
                      {columns.map((col) => (
                        <td key={String(col.key)} className="px-4 py-3 text-black text-xs">
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
