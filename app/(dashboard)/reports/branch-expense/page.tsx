"use client";

import { useState } from "react";
import { Search, RotateCcw, Eye, Image as ImageIcon } from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { showToast } from "@/lib/toast";
import { formatCurrency, formatDate, getCurrentDate } from "@/lib/utils";
import type { ColumnDef, TablePermissions } from "@/lib/types/common";

interface BranchExpenseItem {
  id: number | string;
  branch: string;
  branch_code: string;
  expense: string;
  amount: number;
  expense_date: string;
  remark: string;
  transaction_id: string;
  total_package: number;
  transaction_image: string;
  [key: string]: unknown;
}

const MOCK_BRANCH_EXPENSES: BranchExpenseItem[] = [
  {
    id: 1,
    branch: "Surat Main Branch",
    branch_code: "SUR-01",
    expense: "Diesel / Fuel",
    amount: 3500,
    expense_date: "2026-08-24",
    remark: "Fuel for Truck GJ-05-BX-1024",
    transaction_id: "TXN-880124",
    total_package: 28,
    transaction_image: "",
  },
  {
    id: 2,
    branch: "Ahmedabad Central Hub",
    branch_code: "AHM-01",
    expense: "Hamali / Loading Labor",
    amount: 1200,
    expense_date: "2026-08-24",
    remark: "Daily labor unloading charges",
    transaction_id: "TXN-880125",
    total_package: 45,
    transaction_image: "",
  },
  {
    id: 3,
    branch: "Vadodara Logistics Hub",
    branch_code: "BRD-01",
    expense: "Toll Tax & Parking",
    amount: 650,
    expense_date: "2026-08-23",
    remark: "Highway toll receipts",
    transaction_id: "TXN-880126",
    total_package: 18,
    transaction_image: "",
  },
  {
    id: 4,
    branch: "Rajkot Transport Nagar",
    branch_code: "RJK-01",
    expense: "Office Stationery & Printing",
    amount: 450,
    expense_date: "2026-08-23",
    remark: "Bilty print paper roll",
    transaction_id: "TXN-880127",
    total_package: 0,
    transaction_image: "",
  },
];

const PERMISSIONS: TablePermissions = {
  canExcel: true,
  canPDF: true,
  canPrint: true,
  canAdd: false,
  canEdit: false,
  canDelete: false,
  canStatus: false,
};

const BRANCH_OPTIONS = [
  { value: "", label: "All Branches" },
  { value: "Surat Main Branch", label: "Surat Main Branch" },
  { value: "Ahmedabad Central Hub", label: "Ahmedabad Central Hub" },
  { value: "Vadodara Logistics Hub", label: "Vadodara Logistics Hub" },
  { value: "Rajkot Transport Nagar", label: "Rajkot Transport Nagar" },
  { value: "Bhavnagar Branch", label: "Bhavnagar Branch" },
];

export default function BranchExpenseReportPage() {
  const [fromDate, setFromDate] = useState(getCurrentDate());
  const [toDate, setToDate] = useState(getCurrentDate());
  const [branch, setBranch] = useState("");
  const [data, setData] = useState<BranchExpenseItem[]>(MOCK_BRANCH_EXPENSES);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let filtered = [...MOCK_BRANCH_EXPENSES];
    if (branch) filtered = filtered.filter((r) => r.branch === branch);
    setData(filtered);
    showToast("success", `Filtered: ${filtered.length} expense records found`);
  };

  const handleResetFilter = () => {
    setFromDate(getCurrentDate());
    setToDate(getCurrentDate());
    setBranch("");
    setData(MOCK_BRANCH_EXPENSES);
    showToast("info", "Filter reset to default");
  };

  const columns: ColumnDef<BranchExpenseItem>[] = [
    { key: "branch", label: "Branch", sortable: true },
    { key: "branch_code", label: "Branch Code", sortable: true, width: "w-28" },
    {
      key: "expense",
      label: "Expense",
      sortable: true,
      render: (val) => (
        <span className="font-semibold text-slate-900">{String(val)}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (val) => (
        <span className="font-semibold text-slate-900">{formatCurrency(Number(val))}</span>
      ),
    },
    {
      key: "expense_date",
      label: "Expense Date",
      sortable: true,
      render: (val) => formatDate(String(val)),
    },
    { key: "remark", label: "Remark", sortable: false },
    {
      key: "transaction_id",
      label: "Transaction Id",
      sortable: true,
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-slate-900">
          {String(val)}
        </span>
      ),
    },

    { key: "total_package", label: "Total Package", sortable: true, width: "w-28" },
    {
      key: "transaction_image",
      label: "Transaction Image",
      width: "w-32",
      render: (_, r) => (
        <button
          type="button"
          onClick={() => showToast("info", `Viewing receipt for ${r.transaction_id}`)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded transition-colors"
        >
          <ImageIcon className="w-3 h-3" /> View Image
        </button>
      ),
    },
    {
      key: "action",
      label: "Action",
      width: "w-24",
      render: (_, r) => (
        <Button
          type="button"
          size="sm"
          onClick={() => showToast("info", `Expense Details: ${r.expense}`, `Txn: ${r.transaction_id}`)}
          className="h-7 px-2.5 text-xs bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-xs"
        >
          <Eye className="w-3 h-3 mr-1" />
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* ─── Top Filter Card ────────────────────────────────────────────────── */}
      <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3 space-y-3">
        <h1 className="text-base font-bold text-black tracking-tight pb-2 border-b border-slate-100">
          Branch Expense Report
        </h1>

        <form onSubmit={handleFilterSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <FormInput
              label="From Date:"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <FormInput
              label="To Date:"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
            <FormSelect
              label="Branch:"
              options={BRANCH_OPTIONS}
              value={branch}
              onChange={(val) => setBranch(val as string)}
              placeholder="All Branches"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="submit"
              size="sm"
              className="bg-[#2980b9] hover:bg-[#2471a3] text-white h-8 px-4 text-xs font-semibold shadow-xs"
            >
              <Search className="w-3.5 h-3.5 mr-1.5" />
              Filter Records
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilter}
              className="h-8 px-3 text-xs text-slate-600 border border-slate-300 hover:bg-slate-50"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>
        </form>
      </div>

      {/* ─── Report Data Table ──────────────────────────────────────────────── */}
      <DataTable<BranchExpenseItem>
        title="Branch Expense Report"
        columns={columns}
        data={data}
        permissions={PERMISSIONS}
        clientSide
      />
    </div>
  );
}
