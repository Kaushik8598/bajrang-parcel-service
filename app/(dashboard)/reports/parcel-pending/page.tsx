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

interface ParcelPendingItem {
  id: number | string;
  tracking_no: string;
  docket_no: string;
  qty: number;
  from_branch: string;
  to_branch: string;
  sender: string;
  receiver: string;
  payment_type: string;
  amount: number;
  status: string;
  datetime: string;
  [key: string]: unknown;
}

const MOCK_PARCEL_PENDING: ParcelPendingItem[] = [
  {
    id: 1,
    tracking_no: "TRK-980150",
    docket_no: "BPS-202610",
    qty: 6,
    from_branch: "Surat",
    to_branch: "Bhavnagar",
    sender: "Omkar Textiles",
    receiver: "Ketan Cloth Stores",
    payment_type: "Topay",
    amount: 540,
    status: "Pending at Hub",
    datetime: "2026-08-24 09:10:00",
  },
  {
    id: 2,
    tracking_no: "TRK-980151",
    docket_no: "BPS-202611",
    qty: 2,
    from_branch: "Ahmedabad",
    to_branch: "Vadodara",
    sender: "Shiv Hardware",
    receiver: "Patel Construction",
    payment_type: "Paid",
    amount: 280,
    status: "In Transit",
    datetime: "2026-08-24 10:45:00",
  },
  {
    id: 3,
    tracking_no: "TRK-980152",
    docket_no: "BPS-202612",
    qty: 4,
    from_branch: "Rajkot",
    to_branch: "Surat",
    sender: "Maruti Auto Parts",
    receiver: "Ganesh Garage",
    payment_type: "Topay",
    amount: 420,
    status: "Out for Delivery",
    datetime: "2026-08-24 13:00:00",
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
  { value: "Surat", label: "Surat" },
  { value: "Ahmedabad", label: "Ahmedabad" },
  { value: "Vadodara", label: "Vadodara" },
  { value: "Rajkot", label: "Rajkot" },
  { value: "Bhavnagar", label: "Bhavnagar" },
];

export default function ParcelPendingReportPage() {
  const [fromDate, setFromDate] = useState(getCurrentDate());
  const [toDate, setToDate] = useState(getCurrentDate());
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [data, setData] = useState<ParcelPendingItem[]>(MOCK_PARCEL_PENDING);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let filtered = [...MOCK_PARCEL_PENDING];
    if (fromBranch) filtered = filtered.filter((r) => r.from_branch === fromBranch);
    if (toBranch) filtered = filtered.filter((r) => r.to_branch === toBranch);
    setData(filtered);
    showToast("success", `Filtered: ${filtered.length} pending parcel records found`);
  };

  const handleResetFilter = () => {
    setFromDate(getCurrentDate());
    setToDate(getCurrentDate());
    setFromBranch("");
    setToBranch("");
    setData(MOCK_PARCEL_PENDING);
    showToast("info", "Filter reset to default");
  };

  const columns: ColumnDef<ParcelPendingItem>[] = [
    {
      key: "tracking_no",
      label: "Tracking No",
      sortable: true,
      render: (val) => (
        <span className="font-semibold text-[#2980b9] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
          {String(val)}
        </span>
      ),
    },
    {
      key: "docket_no",
      label: "Docket No",
      sortable: true,
      render: (val) => (
        <span className="font-bold text-black text-xs">{String(val)}</span>
      ),
    },
    { key: "qty", label: "Qty", sortable: true, width: "w-16" },
    { key: "from_branch", label: "From Branch", sortable: true },
    { key: "to_branch", label: "To Branch", sortable: true },
    { key: "sender", label: "Sender", sortable: true },
    { key: "receiver", label: "Receiver", sortable: true },
    { key: "payment_type", label: "Payment Type", sortable: true },
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
        <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded">
          {String(val)}
        </span>
      ),
    },
    {
      key: "datetime",
      label: "DateTime",
      sortable: true,
      render: (val) => formatDateTime(String(val)),
    },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* ─── Top Filter Card ────────────────────────────────────────────────── */}
      <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3 space-y-3">
        <h1 className="text-base font-bold text-black tracking-tight pb-2 border-b border-slate-100">
          Parcel Pending Report
        </h1>

        <form onSubmit={handleFilterSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
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
              label="From Branch:"
              options={BRANCH_OPTIONS}
              value={fromBranch}
              onChange={(val) => setFromBranch(val as string)}
              placeholder="All Branches"
            />
            <FormSelect
              label="To Branch:"
              options={BRANCH_OPTIONS}
              value={toBranch}
              onChange={(val) => setToBranch(val as string)}
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
      <DataTable<ParcelPendingItem>
        title="Parcel Pending Report"
        columns={columns}
        data={data}
        permissions={PERMISSIONS}
        clientSide
      />
    </div>
  );
}
