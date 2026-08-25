import { useState, useEffect } from "react";
import { FileSpreadsheet, FileText, Printer, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/lib/hooks";
import type { TablePermissions } from "@/lib/types/common";

interface TableToolbarProps {
  title: string;
  permissions: TablePermissions;
  search: string;
  onSearchChange: (v: string) => void;
  pageSize: number;
  onPageSizeChange: (v: number) => void;
  onExcel?: () => void;
  onPDF?: () => void;
  onPrint?: () => void;
  onAdd?: () => void;
}

const PAGE_SIZE_OPTIONS = [
  { label: "10", value: "10" },
  { label: "25", value: "25" },
  { label: "50", value: "50" },
  { label: "100", value: "100" },
  { label: "All", value: "all" },
];

export default function TableToolbar({
  title,
  permissions,
  search,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  onExcel,
  onPDF,
  onPrint,
  onAdd,
}: TableToolbarProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebounce(localSearch, 400);
  const currentSelectValue = pageSize === -1 ? "all" : String(pageSize);

  // Sync external search updates (e.g. parent clear/reset)
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // When debounced search value updates, notify parent / trigger API
  useEffect(() => {
    if (debouncedSearch !== search) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, search, onSearchChange]);

  const handleSelectChange = (val: string | null) => {
    if (!val) return;
    if (val === "all") {
      onPageSizeChange(-1);
    } else {
      onPageSizeChange(Number(val));
    }
  };

  return (
    <div className="space-y-4">
      {/* Top row: Title + Add button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-100">
        <h2 className="text-xl font-bold text-black tracking-tight">{title}</h2>
        {permissions.canAdd && onAdd && (
          <Button
            id="table-add-btn"
            onClick={onAdd}
            size="sm"
            className="bg-[#2980b9] hover:bg-[#2471a3] text-white h-8 px-3.5 text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add {title.replace("Manage ", "")}
          </Button>
        )}
      </div>

      {/* Second row: Export buttons + Page size selector + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Export buttons + Page size */}
        <div className="flex flex-wrap items-center gap-2">
          {permissions.canExcel && onExcel && (
            <Button
              id="table-excel-btn"
              variant="outline"
              size="sm"
              onClick={onExcel}
              className="h-8 px-3 text-xs border-slate-200 text-black hover:bg-slate-50 hover:text-green-700 hover:border-green-300 transition-colors shadow-none font-medium"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-green-600" />
              Excel
            </Button>
          )}
          {permissions.canPDF && onPDF && (
            <Button
              id="table-pdf-btn"
              variant="outline"
              size="sm"
              onClick={onPDF}
              className="h-8 px-3 text-xs border-slate-200 text-black hover:bg-slate-50 hover:text-red-700 hover:border-red-300 transition-colors shadow-none font-medium"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 text-red-600" />
              PDF
            </Button>
          )}
          {permissions.canPrint && onPrint && (
            <Button
              id="table-print-btn"
              variant="outline"
              size="sm"
              onClick={onPrint}
              className="h-8 px-3 text-xs border-slate-200 text-black hover:bg-slate-50 transition-colors shadow-none font-medium"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-700" />
              Print
            </Button>
          )}

          {/* Page size selector with 'All' option */}
          <div className="flex items-center gap-1.5 ml-1 text-xs text-black font-medium">
            <span>Show</span>
            <Select
              value={currentSelectValue}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger
                id="table-page-size"
                className="h-8 min-w-[70px] text-xs bg-white text-black border border-black"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs text-black">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>rows</span>
          </div>
        </div>

        {/* Right: Search box */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-black font-semibold">Search:</span>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              id="table-search"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search..."
              className="h-8 pl-8 pr-3 text-xs text-black w-48 sm:w-56 bg-white border border-black focus:border-black transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
