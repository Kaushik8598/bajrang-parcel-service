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

interface PendingDeliveryItem {
  id: number | string;
  tracking_no: string;
  docket_no: string;
  qty: number;
  from_branch: string;
  to_branch: string;
  sender: string;
  receiver: string;
  payment_type: string;
  total_amount: number;
  pending_days: number;
  status: string;
  booking_datetime: string;
  [key: string]: unknown;
}

const MOCK_PENDING_DELIVERY: PendingDeliveryItem[] = [
  {
    id: 1,
    tracking_no: "TRK-980160",
    docket_no: "BPS-202620",
    qty: 3,
    from_branch: "Surat",
    to_branch: "Ahmedabad",
    sender: "Gujarat Silk Traders",
    receiver: "Kuber Fashion",
    payment_type: "Topay",
    total_amount: 450,
    pending_days: 2,
    status: "Undelivered",
    booking_datetime: "2026-08-22 10:00:00",
  },
  {
    id: 2,
    tracking_no: "TRK-980161",
    docket_no: "BPS-202621",
    qty: 7,
    from_branch: "Ahmedabad",
    to_branch: "Rajkot",
    sender: "National Electronics",
    receiver: "Kishan Hardware",
    payment_type: "Paid",
    total_amount: 1100,
    pending_days: 3,
    status: "Receiver Door Closed",
    booking_datetime: "2026-08-21 14:30:00",
  },
  {
    id: 3,
    tracking_no: "TRK-980162",
    docket_no: "BPS-202622",
    qty: 1,
    from_branch: "Vadodara",
    to_branch: "Bhavnagar",
    sender: "Shreeji Pharma",
    receiver: "City Hospital Chemist",
    payment_type: "Topay",
    total_amount: 180,
    pending_days: 1,
    status: "Pending Collection",
    booking_datetime: "2026-08-23 16:15:00",
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

export default function PendingDeliveryReportPage() {
  const [fromDate, setFromDate] = useState(getCurrentDate());
  const [toDate, setToDate] = useState(getCurrentDate());
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [data, setData] = useState<PendingDeliveryItem[]>(MOCK_PENDING_DELIVERY);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let filtered = [...MOCK_PENDING_DELIVERY];
    if (fromBranch) filtered = filtered.filter((r) => r.from_branch === fromBranch);
    if (toBranch) filtered = filtered.filter((r) => r.to_branch === toBranch);
    setData(filtered);
    showToast("success", `Filtered: ${filtered.length} pending delivery records found`);
  };

  const handleResetFilter = () => {
    setFromDate(getCurrentDate());
    setToDate(getCurrentDate());
    setFromBranch("");
    setToBranch("");
    setData(MOCK_PENDING_DELIVERY);
    showToast("info", "Filter reset to default");
  };

  const columns: ColumnDef<PendingDeliveryItem>[] = [
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
      key: "total_amount",
      label: "Total Amount",
      sortable: true,
      render: (val) => formatCurrency(Number(val)),
    },
    {
      key: "pending_days",
      label: "Pending Days",
      sortable: true,
      render: (val) => (
        <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-xs">
          {Number(val)} Day{Number(val) > 1 ? "s" : ""}
        </span>
      ),
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
      key: "booking_datetime",
      label: "Booking DateTime",
      sortable: true,
      render: (val) => formatDateTime(String(val)),
    },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* ─── Top Filter Card ────────────────────────────────────────────────── */}
      <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3 space-y-3">
        <h1 className="text-base font-bold text-black tracking-tight pb-2 border-b border-slate-100">
          Pending Delivery Report
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
      <DataTable<PendingDeliveryItem>
        title="Pending Delivery Report"
        columns={columns}
        data={data}
        permissions={PERMISSIONS}
        clientSide
      />
    </div>
  );
}
