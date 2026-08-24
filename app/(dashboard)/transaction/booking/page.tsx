"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  Printer,
  Plus,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import DataTable from "@/components/DataTable/DataTable";
import DeleteConfirmDialog from "@/components/DataTable/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import {
  getBranches,
  MOCK_BOOKINGS,
  MOCK_BRANCHES,
} from "@/lib/api/booking";
import { formatDateTime, formatDate, getCurrentDate, moment } from "@/lib/utils";
import type { ColumnDef, TablePermissions } from "@/lib/types/common";
import type { ParcelBookingRecord } from "@/lib/types/booking";

// ─── Professional Printable Bilty Helper ──────────────────────────────────────
function printBiltyReceipt(booking: ParcelBookingRecord) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const totalQty = booking.total_qty || 1;
  const netCost = booking.net_cost || booking.topay_amount || booking.paid_amount || 0;
  const isToPay = booking.payment_method === "To Pay";
  const formattedBookingDate = formatDateTime(booking.booking_date, "DD-MM-YYYY hh:mm A");
  const printedAt = moment().format("DD-MM-YYYY hh:mm A");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bilty - ${booking.docket_no}</title>
  <style>
    @media print {
      body { margin: 0; padding: 10px; font-family: 'Segoe UI', Arial, sans-serif; }
      @page { size: auto; margin: 8mm; }
    }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; line-height: 1.4; padding: 20px; }
    .bilty-card { border: 2px solid #1e293b; padding: 16px; max-width: 800px; margin: 0 auto; border-radius: 4px; }
    .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 10px; margin-bottom: 12px; }
    .title { font-size: 20px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 1px; }
    .subtitle { font-size: 11px; color: #64748b; margin-top: 2px; }
    .meta-grid { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 11px; }
    .badge-docket { font-size: 14px; font-weight: 800; color: #0f172a; border: 1px dashed #0f172a; padding: 4px 8px; }
    .party-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
    .party-box { border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 4px; background: #f8fafc; }
    .party-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 4px; }
    .party-name { font-size: 13px; font-weight: 700; color: #0f172a; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    .table th, .table td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; font-size: 11px; }
    .table th { background: #f1f5f9; font-weight: 700; }
    .total-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #1e293b; padding-top: 8px; margin-top: 8px; }
    .payment-tag { font-size: 13px; font-weight: 800; padding: 4px 10px; border-radius: 4px; ${isToPay ? "background:#fef3c7; color:#92400e; border:1px solid #f59e0b;" : "background:#dcfce7; color:#166534; border:1px solid #22c55e;"} }
    .sign-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 36px; text-align: center; }
    .sign-line { border-top: 1px dashed #475569; padding-top: 4px; font-size: 10px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="bilty-card">
    <div class="header">
      <div class="title">BAJRANG PARCEL SERVICE</div>
      <div class="subtitle">Fast & Reliable Daily Transport & Logistics Service • Printed: ${printedAt}</div>
    </div>

    <div class="meta-grid">
      <div>
        <div><strong>Date/Time:</strong> ${formattedBookingDate}</div>
        <div><strong>Tracking No:</strong> ${booking.tracking_no || "—"}</div>
        <div><strong>Bill / LR No:</strong> ${booking.bill_no || "—"}</div>
      </div>
      <div style="text-align:right;">
        <div class="badge-docket">DOCKET: ${booking.docket_no}</div>
        <div style="margin-top:4px;"><strong>Route:</strong> ${booking.from_branch_name || "Surat"} → ${booking.to_branch_name || "Valsad"}</div>
      </div>
    </div>

    <div class="party-grid">
      <div class="party-box">
        <div class="party-title">Consignor (Sender)</div>
        <div class="party-name">${booking.sender?.name || "—"}</div>
        <div>Contact: ${booking.sender?.contact_no || "—"}</div>
        <div>Address: ${booking.sender?.address || booking.sender?.city || "—"}</div>
        ${booking.sender?.gstin ? `<div>GSTIN: ${booking.sender.gstin}</div>` : ""}
      </div>

      <div class="party-box">
        <div class="party-title">Consignee (Receiver)</div>
        <div class="party-name">${booking.receiver?.name || "—"}</div>
        <div>Contact: ${booking.receiver?.contact_no || "—"}</div>
        <div>Address: ${booking.receiver?.address || booking.receiver?.city || "—"}</div>
        ${booking.receiver?.gstin ? `<div>GSTIN: ${booking.receiver.gstin}</div>` : ""}
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th style="width:40px;">#</th>
          <th>Description / Material</th>
          <th>Packing</th>
          <th style="width:60px; text-align:center;">Qty</th>
          <th style="width:100px; text-align:right;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${(booking.packages || [
      { id: "1", qty: totalQty, material: "Parcel Packages", packing: "Carton", price: netCost - 20 },
    ])
      .map(
        (p, idx) => `<tr>
            <td>${idx + 1}</td>
            <td>${p.material || "General Goods"}</td>
            <td>${p.packing || "Carton"}</td>
            <td style="text-align:center;">${p.qty || 1}</td>
            <td style="text-align:right;">₹${p.price || 0}</td>
          </tr>`
      )
      .join("")}
        <tr>
          <td colspan="4" style="text-align:right; font-weight:600;">Bilty Charge:</td>
          <td style="text-align:right;">₹${booking.bilty_charge || 20}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-row">
      <div>
        <span class="payment-tag">${booking.payment_method?.toUpperCase() || "TO PAY"}: ₹${netCost.toFixed(2)}</span>
      </div>
      <div style="font-size:14px; font-weight:800;">
        Total Amount: ₹${netCost.toFixed(2)}
      </div>
    </div>

    <div class="sign-grid">
      <div class="sign-line">Booking Clerk (${booking.booked_by || "Deepakbhai"})</div>
      <div class="sign-line">Driver Sign</div>
      <div class="sign-line">Receiver (Party Sign)</div>
    </div>
  </div>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

export default function ManageParcelBookingPage() {
  const router = useRouter();

  // ─── Local State & Filters ──────────────────────────────────────────────────
  const [data, setData] = useState<ParcelBookingRecord[]>(MOCK_BOOKINGS);
  const [fromDate, setFromDate] = useState(() => moment().format("YYYY-MM-DD"));
  const [toDate, setToDate] = useState(() => moment().format("YYYY-MM-DD"));
  const [selectedFromBranch, setSelectedFromBranch] = useState("all");
  const [selectedToBranch, setSelectedToBranch] = useState("all");

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<ParcelBookingRecord | null>(null);

  // Toast / feedback message
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // ─── Fetch Branches ────────────────────────────────────────────────────────
  const { data: branches = MOCK_BRANCHES } = useQuery({
    queryKey: ["branches"],
    queryFn: getBranches,
    placeholderData: MOCK_BRANCHES,
  });

  const fromBranchFilterOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: "all", label: "All From Branch" },
      ...branches.map((b) => ({
        value: String(b.id),
        label: b.name,
      })),
    ],
    [branches]
  );

  const toBranchFilterOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: "all", label: "All To Branch" },
      ...branches.map((b) => ({
        value: String(b.id),
        label: b.name,
      })),
    ],
    [branches]
  );

  // ─── Filter Handler ────────────────────────────────────────────────────────
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let filtered = [...MOCK_BOOKINGS];

    if (selectedFromBranch && selectedFromBranch !== "all") {
      filtered = filtered.filter((b) => String(b.from_branch_id) === selectedFromBranch);
    }
    if (selectedToBranch && selectedToBranch !== "all") {
      filtered = filtered.filter((b) => String(b.to_branch_id) === selectedToBranch);
    }

    setData(filtered);
    setFeedbackMessage("Filters applied successfully.");
    setTimeout(() => setFeedbackMessage(null), 2500);
  };

  const handleResetFilter = () => {
    setFromDate(moment().format("YYYY-MM-DD"));
    setToDate(moment().format("YYYY-MM-DD"));
    setSelectedFromBranch("all");
    setSelectedToBranch("all");
    setData(MOCK_BOOKINGS);
  };

  // ─── Action Handlers ───────────────────────────────────────────────────────
  const handleAddBooking = () => {
    router.push("/transaction/booking/add");
  };

  const handleOpenEdit = (row: ParcelBookingRecord) => {
    router.push(`/transaction/booking/edit/${row.id}`);
  };

  const handleDeleteClick = (row: ParcelBookingRecord) => {
    setBookingToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleConfirmCancelBooking = () => {
    if (bookingToDelete) {
      setData((prev) => prev.filter((b) => b.id !== bookingToDelete.id));
      setDeleteDialogOpen(false);
      setFeedbackMessage(`Booking docket "${bookingToDelete.docket_no}" cancelled.`);
      setBookingToDelete(null);
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  // ─── Table Columns (Exact match with user screenshot) ──────────────────────
  const columns: ColumnDef<ParcelBookingRecord>[] = [
    {
      key: "tracking_no",
      label: "Tracking No",
      sortable: true,
      render: (val) => (
        <span className="text-black text-xs tracking-tight">
          {String(val || "—")}
        </span>
      ),
    },
    {
      key: "docket_no",
      label: "Docket No",
      sortable: true,
      render: (val) => (
        <span className="text-black text-xs">
          {String(val || "—")}
        </span>
      ),
    },
    {
      key: "total_qty",
      label: "Qty",
      sortable: true,
      width: "w-14",
      render: (val) => (
        <span className="text-black text-xs">{String(val || 1)}</span>
      ),
    },
    {
      key: "from_branch_name",
      label: "From Branch",
      render: (val, row) => (
        <span className="text-xs text-black">
          {String(val || row.from_branch_id || "—")}
        </span>
      ),
    },
    {
      key: "to_branch_name",
      label: "To Branch",
      render: (val, row) => (
        <span className="text-xs text-black">
          {String(val || row.to_branch_id || "—")}
        </span>
      ),
    },
    {
      key: "sender",
      label: "Sender",
      render: (_, row) => (
        <div className="text-xs space-y-0.5 max-w-[140px]">
          <p className="text-black uppercase leading-tight truncate">
            {row.sender?.name || "—"}
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            {row.sender?.contact_no || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "receiver",
      label: "Receiver",
      render: (_, row) => (
        <div className="text-xs space-y-0.5 max-w-[150px]">
          <p className="text-black uppercase leading-tight truncate">
            {row.receiver?.name || "—"}
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            {row.receiver?.contact_no || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "topay_amount",
      label: "Topay",
      sortable: true,
      render: (val, row) => {
        const amt = val ?? (row.payment_method === "To Pay" ? row.net_cost : null);
        return amt ? (
          <span className="text-black text-xs">
            {Number(amt).toFixed(2)}
          </span>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        );
      },
    },
    {
      key: "paid_amount",
      label: "Paid",
      sortable: true,
      render: (val, row) => {
        const amt = val ?? (row.payment_method === "Paid" ? row.net_cost : null);
        return amt ? (
          <span className="text-black text-xs">
            {Number(amt).toFixed(2)}
          </span>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        );
      },
    },
    {
      key: "booking_type",
      label: "Type",
      render: (val) => (
        <span className="text-xs text-black">
          {String(val || "Branch User")}
        </span>
      ),
    },
    {
      key: "booked_by",
      label: "Book By",
      render: (val) => (
        <span className="text-xs text-black uppercase">
          {String(val || "DEEPAKBHAI")}
        </span>
      ),
    },
    {
      key: "booking_date",
      label: "DateTime",
      sortable: true,
      render: (val) => (
        <span className="text-[11px] text-black whitespace-nowrap">
          {formatDateTime(String(val || ""))}
        </span>
      ),
    },
    {
      key: "action",
      label: "Action",
      width: "w-64",
      render: (_, row) => (
        <div className="flex items-center gap-1.5 py-1">
          {/* Edit button */}
          {PERMISSIONS.canEdit && (
            <Button
              type="button"
              size="sm"
              onClick={() => handleOpenEdit(row)}
              className="h-7 px-2.5 text-xs bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-xs transition-colors"
            >
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </Button>
          )}

          {/* Cancel Booking button */}
          {PERMISSIONS.canDelete && (
            <Button
              type="button"
              size="sm"
              onClick={() => handleDeleteClick(row)}
              className="h-7 px-2.5 text-xs bg-[#e74c3c] hover:bg-[#c0392b] text-white shadow-xs transition-colors"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Cancel
            </Button>
          )}

          {/* Print button */}
          {PERMISSIONS.canPrint && (
            <Button
              type="button"
              size="sm"
              onClick={() => printBiltyReceipt(row)}
              className="h-7 px-2.5 text-xs bg-[#2c3e50] hover:bg-[#1a252f] text-white shadow-xs transition-colors"
            >
              <Printer className="w-3 h-3 mr-1" />
              Print
            </Button>
          )}
        </div>
      ),
    },
    {
      key: "party_sign",
      label: "Party Sign",
      width: "w-20",
      render: () => (
        <div className="w-14 h-8 border border-dashed border-slate-300 rounded bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 select-none">
          Sign
        </div>
      ),
    },
  ];

  const PERMISSIONS: TablePermissions = {
    canExcel: true,
    canPDF: true,
    canPrint: true,
    canAdd: true,
    canEdit: true,
    canDelete: true,
  };

  return (
    <div className="space-y-5 pb-12">
      {/* ─── Top Filter Card (Manage Parcel Booking Report) ────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100">
          <h1 className="text-xl font-bold text-black tracking-tight">
            Manage Parcel Booking Report
          </h1>

          {/* <Button
            type="button"
            onClick={handleAddBooking}
            size="sm"
            className="bg-[#27ae60] hover:bg-[#219a52] text-white h-8 px-3.5 text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Parcel Booking
          </Button> */}
        </div>

        {/* Filter Form Controls */}
        <form onSubmit={handleFilterSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* From Date */}
            <FormInput
              label="From Date:"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />

            {/* To Date */}
            <FormInput
              label="To Date:"
              type="date"
              placeholder="Select To date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />

            {/* From Branch */}
            <FormSelect
              label="From Branch:"
              options={fromBranchFilterOptions}
              value={selectedFromBranch}
              onChange={(val) => setSelectedFromBranch(val)}
              placeholder="All From Branch"
              searchPlaceholder="Search branch..."
            />

            {/* To Branch */}
            <FormSelect
              label="To Branch:"
              options={toBranchFilterOptions}
              value={selectedToBranch}
              onChange={(val) => setSelectedToBranch(val)}
              placeholder="All To Branch"
              searchPlaceholder="Search branch..."
            />
          </div>

          {/* Submit Button Centered */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <Button
              type="submit"
              className="bg-[#2980b9] hover:bg-[#2471a3] text-white h-8 px-7 text-xs font-semibold shadow-xs transition-colors"
            >
              Submit
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilter}
              className="h-8 px-3 text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
              title="Reset Filters"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          </div>
        </form>
      </div>

      {/* ─── Feedback Alert ────────────────────────────────────────────────── */}
      {feedbackMessage && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="font-semibold">{feedbackMessage}</span>
        </div>
      )}

      {/* ─── Main DataTable ────────────────────────────────────────────────── */}
      <DataTable<ParcelBookingRecord>
        title="Parcel Bookings"
        columns={columns}
        data={data}
        permissions={PERMISSIONS}
        onAdd={handleAddBooking}
        clientSide
      />

      {/* ─── Cancel / Delete Confirmation Dialog ───────────────────────────── */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmCancelBooking}
        title="Cancel Parcel Booking"
        itemName={bookingToDelete?.docket_no}
        description={
          bookingToDelete
            ? `Are you sure you want to cancel parcel booking docket "${bookingToDelete.docket_no}"?`
            : undefined
        }
        confirmText="Cancel Booking"
      />
    </div>
  );
}
