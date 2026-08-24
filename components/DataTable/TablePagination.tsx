"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
}

export default function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
}: TablePaginationProps) {
  const isAll = pageSize === -1;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : isAll ? 1 : (page - 1) * pageSize + 1;
  const to = isAll ? total : Math.min(page * pageSize, total);

  // Generate visible page numbers
  const getPages = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    }
    return pages;
  };

  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
      {/* Info text */}
      <p className="text-xs text-slate-500 font-medium">
        Showing {from} to {to} of {total.toLocaleString("en-IN")} entries
      </p>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        <Button
          id="pagination-prev"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || isAll}
          className="h-8 px-2.5 text-xs text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
          Previous
        </Button>

        {getPages().map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="text-slate-400 text-xs px-1.5">
              …
            </span>
          ) : (
            <Button
              key={p}
              id={`pagination-page-${p}`}
              variant={p === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(p as number)}
              disabled={isAll}
              className={cn(
                "h-8 w-8 p-0 text-xs border-slate-200 text-slate-700",
                p === page && "bg-[#2980b9] hover:bg-[#2471a3] text-white border-[#2980b9] font-semibold"
              )}
            >
              {p}
            </Button>
          )
        )}

        <Button
          id="pagination-next"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || isAll}
          className="h-8 px-2.5 text-xs text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-40"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Button>
      </div>
    </div>
  );
}
