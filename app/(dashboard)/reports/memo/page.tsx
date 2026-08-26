"use client";

import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { showToast } from "@/lib/toast";
import { formatCurrency, formatDateTime, getCurrentDate } from "@/lib/utils";
import type { ColumnDef, TablePermissions } from "@/lib/types/common";

interface MemoReportItem {
  id: number | string;
  created_on: string;
  sender: string;
  receiver: string;
  branch: string;
  amount: number;
  status: string;
  [key: string]: unknown;
}

const MOCK_MEMO_REPORTS: MemoReportItem[] = [
  {
    id: 1,
    created_on: "2026-08-24 10:15:00",
    sender: "Radhe Krishna Textiles",
    receiver: "Shreeji Enterprise",
    branch: "Surat Main Branch",
    amount: 1450,
    status: "Generated",
  },
  {
    id: 2,
    created_on: "2026-08-24 12:40:00",
    sender: "Balaji Electronics",
    receiver: "Bhavani Hardware",
    branch: "Ahmedabad Central Hub",
    amount: 2800,
    status: "Completed",
  },
  {
    id: 3,
    created_on: "2026-08-24 15:20:00",
    sender: "Apex Pharma",
    receiver: "Lifeline Care",
    branch: "Vadodara Logistics Hub",
    amount: 920,
    status: "In Transit",
  },
  {
    id: 4,
    created_on: "2026-08-24 17:05:00",
    sender: "Shyam Enterprise",
    receiver: "Om Trading",
    branch: "Bhavnagar Branch",
    amount: 1350,
    status: "Completed",
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

export default function MemoReportPage() {
  const [fromDate, setFromDate] = useState(getCurrentDate());
  const [toDate, setToDate] = useState(getCurrentDate());
  const [branch, setBranch] = useState("");
  const [data, setData] = useState<MemoReportItem[]>(MOCK_MEMO_REPORTS);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let filtered = [...MOCK_MEMO_REPORTS];
    if (branch) filtered = filtered.filter((r) => r.branch === branch);
    setData(filtered);
    showToast("success", `Filtered: ${filtered.length} memo records found`);
  };

  const handleResetFilter = () => {
    setFromDate(getCurrentDate());
    setToDate(getCurrentDate());
    setBranch("");
    setData(MOCK_MEMO_REPORTS);
    showToast("info", "Filter reset to default");
  };

  const columns: ColumnDef<MemoReportItem>[] = [
    {
      key: "created_on",
      label: "Created On",
      sortable: true,
      render: (val) => formatDateTime(String(val)),
    },
    { key: "sender", label: "Sender", sortable: true },
    { key: "receiver", label: "Receiver", sortable: true },
    { key: "branch", label: "Branch", sortable: true },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (val) => formatCurrency(Number(val)),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (val) => (
        <span className="text-xs font-semibold text-slate-900">
          {String(val)}
        </span>
      ),
    },
  ];


  return (
    <div className="space-y-4 pb-12">
      {/* ─── Top Filter Card ────────────────────────────────────────────────── */}
      <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3 space-y-3">
        <h1 className="text-base font-bold text-black tracking-tight pb-2 border-b border-slate-100">
          Memo Report
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
      <DataTable<MemoReportItem>
        title="Memo Report"
        columns={columns}
        data={data}
        permissions={PERMISSIONS}
        clientSide
      />
    </div>
  );
}
