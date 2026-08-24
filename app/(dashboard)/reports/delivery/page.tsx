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

interface DeliveryReportItem {
  id: number | string;
  tracking_no: string;
  docket_no: string;
  qty: number;
  from_branch: string;
  to_branch: string;
  sender_name: string;
  receiver_name: string;
  topay: number;
  paid: number;
  type: string;
  delivery_by: string;
  delivery_remark: string;
  delivery_datetime: string;
  [key: string]: unknown;
}

const MOCK_DELIVERY_REPORTS: DeliveryReportItem[] = [
  {
    id: 1,
    tracking_no: "TRK-980124",
    docket_no: "BPS-202601",
    qty: 3,
    from_branch: "Surat",
    to_branch: "Ahmedabad",
    sender_name: "Radhe Krishna Textiles",
    receiver_name: "Shreeji Enterprise",
    topay: 450,
    paid: 0,
    type: "Regular",
    delivery_by: "Suresh Chauhan",
    delivery_remark: "Delivered to shop owner",
    delivery_datetime: "2026-08-24 15:30:00",
  },
  {
    id: 2,
    tracking_no: "TRK-980125",
    docket_no: "BPS-202602",
    qty: 5,
    from_branch: "Ahmedabad",
    to_branch: "Rajkot",
    sender_name: "Balaji Electronics",
    receiver_name: "Bhavani Hardware",
    topay: 0,
    paid: 800,
    type: "Express",
    delivery_by: "Ketan Baraiya",
    delivery_remark: "Received by store manager",
    delivery_datetime: "2026-08-24 17:10:00",
  },
  {
    id: 3,
    tracking_no: "TRK-980127",
    docket_no: "BPS-202604",
    qty: 1,
    from_branch: "Bhavnagar",
    to_branch: "Ahmedabad",
    sender_name: "Shyam Enterprise",
    receiver_name: "Om Trading",
    topay: 0,
    paid: 220,
    type: "Direct",
    delivery_by: "Dinesh Parmar",
    delivery_remark: "Delivered on door",
    delivery_datetime: "2026-08-24 18:45:00",
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

export default function ParcelDeliveryReportPage() {
  const [fromDate, setFromDate] = useState(getCurrentDate());
  const [toDate, setToDate] = useState(getCurrentDate());
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [data, setData] = useState<DeliveryReportItem[]>(MOCK_DELIVERY_REPORTS);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let filtered = [...MOCK_DELIVERY_REPORTS];
    if (fromBranch) filtered = filtered.filter((r) => r.from_branch === fromBranch);
    if (toBranch) filtered = filtered.filter((r) => r.to_branch === toBranch);
    setData(filtered);
    showToast("success", `Filtered: ${filtered.length} delivery records found`);
  };

  const handleResetFilter = () => {
    setFromDate(getCurrentDate());
    setToDate(getCurrentDate());
    setFromBranch("");
    setToBranch("");
    setData(MOCK_DELIVERY_REPORTS);
    showToast("info", "Filter reset to default");
  };

  const columns: ColumnDef<DeliveryReportItem>[] = [
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
    { key: "sender_name", label: "Sender", sortable: true },
    { key: "receiver_name", label: "Receiver", sortable: true },
    {
      key: "topay",
      label: "Topay",
      sortable: true,
      render: (val) => (val ? formatCurrency(Number(val)) : "—"),
    },
    {
      key: "paid",
      label: "Paid",
      sortable: true,
      render: (val) => (val ? formatCurrency(Number(val)) : "—"),
    },
    { key: "type", label: "Type", sortable: true },
    { key: "delivery_by", label: "Delivery By", sortable: true },
    { key: "delivery_remark", label: "Delivery Remark", sortable: false },
    {
      key: "delivery_datetime",
      label: "Delivery DateTime",
      sortable: true,
      render: (val) => formatDateTime(String(val)),
    },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* ─── Top Filter Card ────────────────────────────────────────────────── */}
      <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3 space-y-3">
        <h1 className="text-base font-bold text-black tracking-tight pb-2 border-b border-slate-100">
          Parcel Delivery Report
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
      <DataTable<DeliveryReportItem>
        title="Parcel Delivery Report"
        columns={columns}
        data={data}
        permissions={PERMISSIONS}
        clientSide
      />
    </div>
  );
}
