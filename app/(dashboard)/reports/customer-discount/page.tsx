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

interface CustomerDiscountItem {
  id: number | string;
  tracking_no: string;
  docket_no: string;
  from_branch: string;
  to_branch: string;
  sender: string;
  receiver: string;
  payment_type: string;
  discount_status: string;
  discount_amount: number;
  amount: number;
  status: string;
  type: string;
  delivery_by: string;
  delivery_datetime: string;
  [key: string]: unknown;
}

const MOCK_DISCOUNT_REPORTS: CustomerDiscountItem[] = [
  {
    id: 1,
    tracking_no: "TRK-980140",
    docket_no: "BPS-202595",
    from_branch: "Surat",
    to_branch: "Ahmedabad",
    sender: "Radhe Krishna Textiles",
    receiver: "Shreeji Enterprise",
    payment_type: "Topay",
    discount_status: "Approved",
    discount_amount: 50,
    amount: 450,
    status: "Delivered",
    type: "Regular",
    delivery_by: "Suresh Chauhan",
    delivery_datetime: "2026-08-24 15:30:00",
  },
  {
    id: 2,
    tracking_no: "TRK-980141",
    docket_no: "BPS-202596",
    from_branch: "Ahmedabad",
    to_branch: "Rajkot",
    sender: "Balaji Electronics",
    receiver: "Bhavani Hardware",
    payment_type: "Paid",
    discount_status: "Approved",
    discount_amount: 80,
    amount: 800,
    status: "Delivered",
    type: "Express",
    delivery_by: "Ketan Baraiya",
    delivery_datetime: "2026-08-24 17:10:00",
  },
  {
    id: 3,
    tracking_no: "TRK-980142",
    docket_no: "BPS-202597",
    from_branch: "Vadodara",
    to_branch: "Surat",
    sender: "Apex Pharma",
    receiver: "Lifeline Care",
    payment_type: "Topay",
    discount_status: "Pending",
    discount_amount: 30,
    amount: 300,
    status: "In Transit",
    type: "Regular",
    delivery_by: "—",
    delivery_datetime: "—",
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

export default function CustomerDiscountReportPage() {
  const [fromDate, setFromDate] = useState(getCurrentDate());
  const [toDate, setToDate] = useState(getCurrentDate());
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [data, setData] = useState<CustomerDiscountItem[]>(MOCK_DISCOUNT_REPORTS);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let filtered = [...MOCK_DISCOUNT_REPORTS];
    if (fromBranch) filtered = filtered.filter((r) => r.from_branch === fromBranch);
    if (toBranch) filtered = filtered.filter((r) => r.to_branch === toBranch);
    setData(filtered);
    showToast("success", `Filtered: ${filtered.length} discount records found`);
  };

  const handleResetFilter = () => {
    setFromDate(getCurrentDate());
    setToDate(getCurrentDate());
    setFromBranch("");
    setToBranch("");
    setData(MOCK_DISCOUNT_REPORTS);
    showToast("info", "Filter reset to default");
  };

  const columns: ColumnDef<CustomerDiscountItem>[] = [
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
    { key: "from_branch", label: "From Branch", sortable: true },
    { key: "to_branch", label: "To Branch", sortable: true },
    { key: "sender", label: "Sender", sortable: true },
    { key: "receiver", label: "Receiver", sortable: true },
    { key: "payment_type", label: "Payment Type", sortable: true },
    {
      key: "discount_status",
      label: "Discount Status",
      sortable: true,
      render: (val) => (
        <span
          className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded border ${
            val === "Approved"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }`}
        >
          {String(val)}
        </span>
      ),
    },
    {
      key: "discount_amount",
      label: "Discount Amount",
      sortable: true,
      render: (val) => (
        <span className="text-green-700 font-bold">{formatCurrency(Number(val))}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (val) => formatCurrency(Number(val)),
    },
    { key: "status", label: "Status", sortable: true },
    { key: "type", label: "Type", sortable: true },
    { key: "delivery_by", label: "Delivery By", sortable: true },
    {
      key: "delivery_datetime",
      label: "Delivery DateTime",
      sortable: true,
      render: (val) => (val && val !== "—" ? formatDateTime(String(val)) : "—"),
    },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* ─── Top Filter Card ────────────────────────────────────────────────── */}
      <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3 space-y-3">
        <h1 className="text-base font-bold text-black tracking-tight pb-2 border-b border-slate-100">
          Customer Discount Report
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
      <DataTable<CustomerDiscountItem>
        title="Customer Discount Report"
        columns={columns}
        data={data}
        permissions={PERMISSIONS}
        clientSide
      />
    </div>
  );
}
