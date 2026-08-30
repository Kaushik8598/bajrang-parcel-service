"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Printer,
  Pencil,
  Trash2,
  RotateCcw,
  Filter,
  Eye,
  FileText,
  Barcode,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import DataTable from "@/components/DataTable/DataTable";
import DeleteConfirmDialog from "@/components/DataTable/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import AppModal from "@/components/ui/AppModal";
import { showToast } from "@/lib/toast";
import { useParcelPendingReports, useOnlyBranchList, useModulePermissions } from "@/lib/hooks";
import { getStoredUserRole, getStoredUser } from "@/lib/api/auth";
import { printBookingSlip } from "@/components/booking/BookingPrintSlip";
import { printBookingBarcode } from "@/components/booking/BookingBarcodeSticker";
import type { BranchDropdownItem } from "@/lib/api/branch";
import type { ParcelBookingReportItem } from "@/lib/api/reports";
import { getCurrentDateTime } from "@/lib/utils";
import type { ColumnDef } from "@/lib/types/common";

const HAS_BILL_OPTIONS = [
  { value: "true", label: "With Bill" },
  { value: "false", label: "Without Bill" },
];

// ─── Professional Printable Bilty Helper ──────────────────────────────────────

function printBiltyReceipt(booking: ParcelBookingReportItem) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const totalQty = booking.parcel || 1;
  const netCost = booking.finalBillAmount || 0;
  const paymentMethod = booking.paymentMethod || "To Pay";
  const isToPay =
    paymentMethod.toLowerCase().includes("to-pay") ||
    paymentMethod.toLowerCase().includes("to pay") ||
    paymentMethod.toLowerCase() === "topay";
  const formattedBookingDate = booking.bookingDate
    ? `${booking.bookingDate} ${booking.bookingTime || ""}`
    : getCurrentDateTime();
  const printedAt = getCurrentDateTime();


  const fromName = booking.fromBranch
    ? `${booking.fromBranch.branchName || ""}${booking.fromBranch.branchCode ? ` (${booking.fromBranch.branchCode})` : ""
    }`
    : "—";

  const toName = booking.toBranch
    ? `${booking.toBranch.branchName || ""}${booking.toBranch.branchCode ? ` (${booking.toBranch.branchCode})` : ""
    }`
    : "—";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bilty - ${booking.docketNo1 || booking.docketNo2 || "Receipt"}</title>
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
    .payment-tag { font-size: 13px; font-weight: 800; padding: 4px 10px; border-radius: 4px; ${isToPay
      ? "background:#fef3c7; color:#92400e; border:1px solid #f59e0b;"
      : "background:#dcfce7; color:#166534; border:1px solid #22c55e;"
    } }
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
        <div><strong>Docket No:</strong> ${booking.docketNo1 || "—"}</div>
        <div><strong>Bill / LR No:</strong> ${booking.billNo || "—"}</div>
      </div>
      <div style="text-align:right;">
        <div class="badge-docket">TRACKING: ${booking.docketNo2 || booking.docketNo1 || "—"}</div>
        <div style="margin-top:4px;"><strong>Route:</strong> ${fromName} → ${toName}</div>
      </div>
    </div>

    <div class="party-grid">
      <div class="party-box">
        <div class="party-title">Consignor (Sender)</div>
        <div class="party-name">${booking.sender?.name || "—"}</div>
        <div>Contact: ${booking.sender?.mobile || booking.sender?.contact_no || "—"}</div>
        ${booking.sender?.city ? `<div>City: ${booking.sender.city}</div>` : ""}
      </div>

      <div class="party-box">
        <div class="party-title">Consignee (Receiver)</div>
        <div class="party-name">${booking.receiver?.name || "—"}</div>
        <div>Contact: ${booking.receiver?.mobile || booking.receiver?.contact_no || "—"}</div>
        ${booking.receiver?.city ? `<div>City: ${booking.receiver.city}</div>` : ""}
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th style="width:40px;">#</th>
          <th>Description / Material</th>
          <th style="width:80px; text-align:center;">Qty (Parcels)</th>
          <th style="width:120px; text-align:right;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>General Cargo / Parcels (${booking.remark || "Standard Booking"})</td>
          <td style="text-align:center;">${totalQty}</td>
          <td style="text-align:right;">₹${netCost.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-row">
      <div>
        <span class="payment-tag">${paymentMethod.toUpperCase()}: ₹${netCost.toFixed(2)}</span>
      </div>
      <div style="font-size:14px; font-weight:800;">
        Total Amount: ₹${netCost.toFixed(2)}
      </div>
    </div>

    <div class="sign-grid">
      <div class="sign-line">Booking By (${booking.bookingById?.name || "Staff"})</div>
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

// ─── Payment Extraction Helper ─────────────────────────────────────────────────

function getPaymentMethodAmounts(row: ParcelBookingReportItem) {
  const m = (row.paymentMethod || "").toLowerCase().trim();
  const amt = Number(row.finalBillAmount) || 0;

  const isTopay = m.includes("to-pay") || m.includes("to pay") || m === "topay";
  const isPaid = m === "paid";
  const isGpay = m === "g pay" || m === "gpay" || m === "g-pay";
  const isCredit = m === "credit";

  return {
    isTopay,
    topayAmount: isTopay ? amt : 0,

    isPaid,
    paidAmount: isPaid ? amt : 0,

    isGpay,
    gpayAmount: isGpay ? amt : 0,

    isCredit,
    creditAmount: isCredit ? amt : 0,
  };
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ParcelPendingReportPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const permissions = useModulePermissions("booking");

  // Determine current user role for filter authorization
  const [userRole, setUserRole] = useState<string>("");
  useEffect(() => {
    const role = getStoredUserRole() || getStoredUser()?.role || "";
    setUserRole(role.toLowerCase());
  }, []);

  const isAdminOrSuperAdmin =
    userRole === "admin" ||
    userRole === "superadmin" ||
    userRole === "super_admin" ||
    userRole === "super-admin";

  // Filter input states (filters trigger directly on change)
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");
  const [fromBranchInput, setFromBranchInput] = useState("");
  const [toBranchInput, setToBranchInput] = useState("");
  const [hasBillInput, setHasBillInput] = useState("");

  // Table pagination & search state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  // Live data fetching hook via GET /report/confirmed
  const { data: apiResponse, isLoading, isFetching } = useParcelPendingReports({
    page,
    limit,
    search,
    startDate: fromDateInput || undefined,
    endDate: toDateInput || undefined,
    fromBranchId: (isAdminOrSuperAdmin ? fromBranchInput : undefined) || undefined,
    toBranchId: toBranchInput || undefined,
    hasBill: hasBillInput || undefined,
  });

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    fromDateInput ||
    toDateInput ||
    fromBranchInput ||
    toBranchInput ||
    hasBillInput
  );

  // Fetch only branches dropdown list via GET /user/onlyBranch
  const { data: branchDropdownRes } = useOnlyBranchList();
  const branchDropdownList = useMemo(() => {
    const rawData = branchDropdownRes?.data;
    if (Array.isArray(rawData)) return rawData;
    if (rawData && typeof rawData === "object") {
      if (Array.isArray(rawData.branches)) return rawData.branches;
      if (Array.isArray(rawData.users)) return rawData.users;
      if (Array.isArray(rawData.data)) return rawData.data;
    }
    return [];
  }, [branchDropdownRes]);

  const branchOptions = useMemo(
    () =>
      branchDropdownList.map((b: BranchDropdownItem) => {
        const branchCode = b.branchInfo?.branchCode;
        const branchName = b.branchInfo?.branchName || b.name || "Branch";
        const label = branchCode ? `${branchCode} - ${branchName}` : branchName;
        return {
          value: b._id,
          label,
        };
      }),
    [branchDropdownList]
  );

  // Extract bookings list from response
  const bookingRecords: ParcelBookingReportItem[] = useMemo(() => {
    const rawData = apiResponse?.data;
    if (Array.isArray(rawData)) return rawData;
    if (rawData && typeof rawData === "object") {
      if (Array.isArray(rawData.bookings)) return rawData.bookings;
      if (Array.isArray(rawData.reports)) return rawData.reports;
      if (Array.isArray(rawData.items)) return rawData.items;
      if (Array.isArray(rawData.data)) return rawData.data;
    }
    return [];
  }, [apiResponse]);

  const paginationMeta = apiResponse?.pagination || {
    total: bookingRecords.length,
    page,
    limit,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // Bill Image preview modal state
  const [previewBillImage, setPreviewBillImage] = useState<string | null>(null);

  // Cancel Booking confirmation state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<ParcelBookingReportItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelRemark, setCancelRemark] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelClick = (row: ParcelBookingReportItem) => {
    setBookingToCancel(row);
    setCancelReason("");
    setCancelRemark("");
    setCancelReasonError("");
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    if (!cancelReason.trim()) {
      setCancelReasonError("Please enter a cancellation reason");
      return;
    }
    setCancelReasonError("");
    setIsCancelling(true);
    try {
      await import("@/lib/api/booking").then((m) =>
        m.updateBookingStatus(bookingToCancel._id, "cancelled", {
          cancelReason: cancelReason.trim(),
          cancelRemark: cancelRemark.trim(),
        })
      );
      showToast(
        "success",
        `Booking "${bookingToCancel.docketNo1 || bookingToCancel.docketNo2 || "docket"}" cancelled successfully.`
      );
      queryClient.invalidateQueries({ queryKey: ["parcel-pending-reports-list"] });
      setCancelDialogOpen(false);
      setBookingToCancel(null);
      setCancelReason("");
      setCancelRemark("");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "Failed to cancel booking.";
      showToast("error", msg);
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle Reset Filter
  const handleResetFilter = () => {
    setFromDateInput("");
    setToDateInput("");
    setFromBranchInput("");
    setToBranchInput("");
    setHasBillInput("");
    setPage(1);
  };

  // ─── Column-wise Total Calculation ─────────────────────────────────────────
  const totals = useMemo(() => {
    let totalTopay = 0;
    let totalPaid = 0;
    let totalGpay = 0;
    let totalCredit = 0;
    let totalConfirmedQty = 0;
    let totalParcelsQty = 0;

    bookingRecords.forEach((row) => {
      const { topayAmount, paidAmount, gpayAmount, creditAmount } = getPaymentMethodAmounts(row);
      totalTopay += topayAmount;
      totalPaid += paidAmount;
      totalGpay += gpayAmount;
      totalCredit += creditAmount;

      totalConfirmedQty += row.trackingStatus?.confirmed ?? 0;
      totalParcelsQty += row.trackingStatus?.total ?? row.parcel ?? 0;
    });

    const grandTotal = totalTopay + totalPaid + totalGpay + totalCredit;

    return {
      totalTopay,
      totalPaid,
      totalGpay,
      totalCredit,
      grandTotal,
      totalConfirmedQty,
      totalParcelsQty,
    };
  }, [bookingRecords]);

  // ─── Table Columns ─────────────────────────────────────────────────────────
  const columns: ColumnDef<ParcelBookingReportItem>[] = [
    {
      key: "docketNo1",
      label: "Docket No",
      sortable: true,
      width: "w-32",
      sortValue: (row) => row.docketNo1 || "",
      render: (_, row) => (
        <span className="font-mono text-xs font-semibold text-slate-900">
          {row.docketNo1 || "—"}
        </span>
      ),
    },
    {
      key: "docketNo2",
      label: "Tracking No",
      sortable: true,
      width: "w-36",
      sortValue: (row) => row.docketNo2 || "",
      render: (_, row) => (
        <span className="font-mono text-xs font-semibold text-slate-900">
          {row.docketNo2 || "—"}
        </span>
      ),
    },
    {
      key: "trackingStatus",
      label: "Parcel",
      sortable: true,
      width: "w-20",
      sortValue: (row) => row.trackingStatus?.confirmed ?? row.parcel ?? 0,
      render: (_, row) => {
        const confirmed = row.trackingStatus?.confirmed ?? 0;
        const total = row.trackingStatus?.total ?? row.parcel ?? 0;
        return (
          <span className="text-xs font-semibold text-slate-900">
            {confirmed}/{total}
          </span>
        );
      },
    },
    {
      key: "fromBranch",
      label: "From Branch",
      sortable: true,
      sortValue: (row) => row.fromBranch?.branchName || "",
      render: (_, row) => {
        const bName = row.fromBranch?.branchName;
        const bCode = row.fromBranch?.branchCode;
        if (!bName && !bCode) return <span className="text-slate-400 text-xs">—</span>;
        return (
          <div className="text-xs">
            <span className="font-semibold text-slate-900">{bName || "—"}</span>
            {bCode && (
              <span className="text-[10px] text-slate-500 block font-mono">({bCode})</span>
            )}
          </div>
        );
      },
    },
    {
      key: "toBranch",
      label: "To Branch",
      sortable: true,
      sortValue: (row) => row.toBranch?.branchName || "",
      render: (_, row) => {
        const bName = row.toBranch?.branchName;
        const bCode = row.toBranch?.branchCode;
        if (!bName && !bCode) return <span className="text-slate-400 text-xs">—</span>;
        return (
          <div className="text-xs">
            <span className="font-semibold text-slate-900">{bName || "—"}</span>
            {bCode && (
              <span className="text-[10px] text-slate-500 block font-mono">({bCode})</span>
            )}
          </div>
        );
      },
    },
    {
      key: "sender",
      label: "Sender",
      sortable: false,
      render: (_, row) => (
        <div className="text-xs space-y-0.5 max-w-[130px]">
          <p className="text-slate-900 font-semibold uppercase leading-tight truncate">
            {row.sender?.name || "—"}
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            {row.sender?.mobile || row.sender?.contact_no || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "receiver",
      label: "Receiver",
      sortable: false,
      render: (_, row) => (
        <div className="text-xs space-y-0.5 max-w-[130px]">
          <p className="text-slate-900 font-semibold uppercase leading-tight truncate">
            {row.receiver?.name || "—"}
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            {row.receiver?.mobile || row.receiver?.contact_no || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "topay",
      label: "Topay",
      sortable: true,
      width: "w-24",
      sortValue: (row) => getPaymentMethodAmounts(row).topayAmount,
      render: (_, row) => {
        const { topayAmount } = getPaymentMethodAmounts(row);
        return topayAmount > 0 ? (
          <span className="font-medium text-xs text-slate-900 font-mono">
            {topayAmount.toFixed(2)}
          </span>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        );
      },
    },
    {
      key: "paid",
      label: "Paid",
      sortable: true,
      width: "w-24",
      sortValue: (row) => getPaymentMethodAmounts(row).paidAmount,
      render: (_, row) => {
        const { paidAmount } = getPaymentMethodAmounts(row);
        return paidAmount > 0 ? (
          <span className="font-medium text-xs text-slate-900 font-mono">
            {paidAmount.toFixed(2)}
          </span>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        );
      },
    },
    {
      key: "gpay",
      label: "Gpay",
      sortable: true,
      width: "w-24",
      sortValue: (row) => getPaymentMethodAmounts(row).gpayAmount,
      render: (_, row) => {
        const { gpayAmount } = getPaymentMethodAmounts(row);
        return gpayAmount > 0 ? (
          <span className="font-medium text-xs text-slate-900 font-mono">
            {gpayAmount.toFixed(2)}
          </span>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        );
      },
    },
    {
      key: "credit",
      label: "Credit",
      sortable: true,
      width: "w-24",
      sortValue: (row) => getPaymentMethodAmounts(row).creditAmount,
      render: (_, row) => {
        const { creditAmount } = getPaymentMethodAmounts(row);
        return creditAmount > 0 ? (
          <span className="font-medium text-xs text-slate-900 font-mono">
            {creditAmount.toFixed(2)}
          </span>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        );
      },
    },
    {
      key: "billNo",
      label: "Bill No",
      sortable: true,
      width: "w-28",
      sortValue: (row) => row.billNo || "",
      render: (_, row) => {
        const hasBill = row.hasBill;
        const billNo = row.billNo;
        const billImage = row.billImage;

        if (!billNo && !hasBill && !billImage) {
          return <span className="text-slate-400 text-xs">—</span>;
        }

        return (
          <div className="flex items-center gap-1 text-xs">
            <span className="font-mono font-medium text-slate-900">
              {billNo || (hasBill ? "Bill Attached" : "—")}
            </span>
            {billImage && (
              <button
                type="button"
                onClick={() => setPreviewBillImage(billImage)}
                className="p-1 text-[#2980b9] hover:text-[#1b4f72] hover:bg-blue-50 rounded transition-colors"
                title="View Bill Image"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: "bookingType",
      label: "Type",
      sortable: true,
      width: "w-24",
      sortValue: (row) => row.bookingById?.role || "",
      render: (_, row) => (
        <span className="text-xs font-medium text-slate-900 uppercase">
          {row.bookingById?.role || "staff"}
        </span>
      ),
    },
    {
      key: "bookedBy",
      label: "Book By",
      sortable: true,
      width: "w-32",
      sortValue: (row) => row.bookingById?.name || "",
      render: (_, row) => (
        <span className="text-xs font-medium text-slate-900 uppercase">
          {row.bookingById?.name || "—"}
        </span>
      ),
    },
    {
      key: "bookingDate",
      label: "DateTime",
      sortable: true,
      width: "w-32",
      sortValue: (row) => `${row.bookingDate || ""} ${row.bookingTime || ""}`,
      render: (_, row) => (
        <div className="text-[11px] leading-tight whitespace-nowrap">
          <p className="font-medium text-slate-900">{row.bookingDate || "—"}</p>
          <p className="text-slate-500 font-mono text-[10px]">{row.bookingTime || ""}</p>
        </div>
      ),
    },

    {
      key: "remark",
      label: "Remark",
      sortable: false,
      render: (_, row) => (
        <span className="text-xs text-slate-600 line-clamp-1" title={row.remark}>
          {row.remark || "—"}
        </span>
      ),
    },
    {
      key: "action",
      label: "Action",
      width: "w-80",
      render: (_, row) => {
        const isDeliveredRow = String(row.status || "").toLowerCase() === "delivered";
        return (
          <div className="flex items-center gap-1.5 py-0.5">
            {permissions.canEdit && !isDeliveredRow && (
              <Button
                type="button"
                size="sm"
                onClick={() => router.push(`/transaction/booking/edit/${row.docketNo1 || row._id || row.id}`)}
                className="h-7 px-2.5 text-xs bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-xs transition-colors"
                title="Edit Booking"
              >
                <Pencil className="w-3 h-3 mr-1" />
                Edit
              </Button>
            )}
            {isDeliveredRow && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => router.push(`/transaction/booking/edit/${row.docketNo1 || row._id || row.id}`)}
                className="h-7 px-2.5 text-xs text-slate-700 border-slate-300 hover:bg-slate-50 transition-colors"
                title="View Booking (Delivered)"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
            )}
            {permissions.canDelete && !isDeliveredRow && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isCancelling && bookingToCancel?._id === row._id}
                onClick={() => handleCancelClick(row)}
                className="h-7 px-2.5 text-xs bg-[#e74c3c] hover:bg-[#c0392b] text-white shadow-xs transition-colors"
                title="Cancel Booking"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            )}
            {permissions.canPrint && (
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const currentUser = getStoredUser();
                    printBookingSlip({
                      booking: row,
                      fromBranch: row.fromBranch,
                      toBranch: row.toBranch,
                      user: currentUser,
                    });
                  }}
                  className="h-7 px-2 text-xs bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                  title="Print Slip"
                >
                  <Printer className="w-3 h-3" />
                  <span>Slip</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const currentUser = getStoredUser();
                    printBookingBarcode({
                      booking: row,
                      fromBranch: row.fromBranch,
                      toBranch: row.toBranch,
                      user: currentUser,
                    });
                  }}
                  className="h-7 px-2 text-xs bg-[#2c3e50] hover:bg-[#1a252f] text-white shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                  title="Print Barcode"
                >
                  <Barcode className="w-3 h-3" />
                  <span>Barcode</span>
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-3">
      {/* ─── Filter Section ─── */}
      <div className="bg-white rounded-lg border border-slate-300 p-4 shadow-xs">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Filter className="w-3.5 h-3.5 text-[#2980b9]" />
              <span>Filter Parcel Pending Reports</span>
              {!isAdminOrSuperAdmin && (
                <span className="text-[10px] text-slate-400 font-normal ml-1">
                  (Branch View: Destination Filter)
                </span>
              )}
            </div>

            {/* Reset link only shown in header when filters are active */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetFilter}
                  disabled={isLoading || isFetching}
                  className="group inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 underline underline-offset-4 cursor-pointer transition-colors disabled:opacity-50"
                  title="Clear all active filters"
                >
                  <RotateCcw className="w-3 h-3 text-rose-600 group-hover:text-rose-700 transition-colors" />
                  <span>Reset</span>
                </button>
              </div>
            )}
          </div>

          <div
            className={
              isAdminOrSuperAdmin
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3"
                : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
            }
          >
            {/* Admin and SuperAdmin get From Date, To Date, From Branch */}
            {isAdminOrSuperAdmin && (
              <>
                <FormInput
                  label="From Date"
                  type="date"
                  value={fromDateInput}
                  onChange={(e) => {
                    setFromDateInput(e.target.value);
                    setPage(1);
                  }}
                />

                <FormInput
                  label="To Date"
                  type="date"
                  value={toDateInput}
                  onChange={(e) => {
                    setToDateInput(e.target.value);
                    setPage(1);
                  }}
                />

                <FormSelect
                  searchable
                  label="From Branch"
                  placeholder="All From Branches"
                  searchPlaceholder="Search branch..."
                  options={branchOptions}
                  value={fromBranchInput}
                  onChange={(val) => {
                    setFromBranchInput(val || "");
                    setPage(1);
                  }}
                  clearable
                />
              </>
            )}

            {/* All roles (including staff/branch) get To Branch filter */}
            <FormSelect
              searchable
              label="To Branch"
              placeholder="All To Branches"
              searchPlaceholder="Search destination branch..."
              options={branchOptions}
              value={toBranchInput}
              onChange={(val) => {
                setToBranchInput(val || "");
                setPage(1);
              }}
              clearable
            />

            {/* Has Bill filter */}
            <FormSelect
              label="Has Bill"
              placeholder="All (With / Without Bill)"
              options={HAS_BILL_OPTIONS}
              value={hasBillInput}
              onChange={(val) => {
                setHasBillInput(val || "");
                setPage(1);
              }}
              clearable
            />
          </div>
        </div>
      </div>

      {/* ─── Reports Data Table ─── */}
      <DataTable<ParcelBookingReportItem>
        title="Parcel Pending Reports"
        columns={columns}
        data={bookingRecords}
        isLoading={isLoading || isFetching}
        permissions={permissions}
        onSearch={(query) => {
          setSearch(query);
          setPage(1);
        }}
        searchValue={search}
        clientSide={false}
        pagination={{
          page,
          pageSize: limit,
          total: paginationMeta.total,
          onPageChange: (newPage) => setPage(newPage),
          onPageSizeChange: (newLimit) => {
            setLimit(newLimit);
            setPage(1);
          },
        }}
        footer={
          <tr className="bg-slate-100/95 font-bold text-xs border-t-2 border-slate-300">
            {/* Sr No */}
            <td className="px-2.5 py-2.5 text-black font-bold text-xs border-r border-slate-300">
              Total
            </td>
            {/* Tracking No */}
            <td className="px-2.5 py-2.5 text-slate-400 text-xs border-r border-slate-300">—</td>
            {/* Docket No */}
            <td className="px-2.5 py-2.5 text-slate-400 text-xs border-r border-slate-300">—</td>
            {/* Qty (Tracking Confirmed / Total) */}
            <td className="px-2.5 py-2.5 font-bold text-xs text-slate-900 border-r border-slate-300">
              {totals.totalConfirmedQty}/{totals.totalParcelsQty}
            </td>
            {/* From Branch */}
            <td className="px-2.5 py-2.5 text-slate-400 text-xs border-r border-slate-300">—</td>
            {/* To Branch */}
            <td className="px-2.5 py-2.5 text-slate-400 text-xs border-r border-slate-300">—</td>
            {/* Sender */}
            <td className="px-2.5 py-2.5 text-slate-400 text-xs border-r border-slate-300">—</td>
            {/* Receiver */}
            <td className="px-2.5 py-2.5 text-slate-400 text-xs border-r border-slate-300">—</td>
            {/* Topay Total */}
            <td className="px-2.5 py-2.5 text-slate-900 font-bold text-xs font-mono border-r border-slate-300">
              {totals.totalTopay > 0 ? totals.totalTopay.toFixed(2) : "—"}
            </td>
            {/* Paid Total */}
            <td className="px-2.5 py-2.5 text-slate-900 font-bold text-xs font-mono border-r border-slate-300">
              {totals.totalPaid > 0 ? totals.totalPaid.toFixed(2) : "—"}
            </td>
            {/* Gpay Total */}
            <td className="px-2.5 py-2.5 text-slate-900 font-bold text-xs font-mono border-r border-slate-300">
              {totals.totalGpay > 0 ? totals.totalGpay.toFixed(2) : "—"}
            </td>
            {/* Credit Total */}
            <td className="px-2.5 py-2.5 text-slate-900 font-bold text-xs font-mono border-r border-slate-300">
              {totals.totalCredit > 0 ? totals.totalCredit.toFixed(2) : "—"}
            </td>

            {/* Bill No */}
            <td className="px-2.5 py-2.5 text-slate-400 text-xs border-r border-slate-300">—</td>
            {/* Type */}
            <td className="px-2.5 py-2.5 text-slate-400 text-xs border-r border-slate-300">—</td>
            {/* Book By */}
            <td className="px-2.5 py-2.5 text-slate-400 text-xs border-r border-slate-300">—</td>
            {/* DateTime */}
            <td className="px-2.5 py-2.5 text-slate-400 text-xs border-r border-slate-300">—</td>
            {/* Remark (Grand Total Amount) */}
            <td className="px-2.5 py-2.5 font-bold text-xs text-slate-900 border-r border-slate-300 whitespace-nowrap">
              Grand: ₹{totals.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </td>
            {/* Action */}
            <td className="px-2.5 py-2.5 text-slate-400 text-xs">—</td>
          </tr>
        }
      />

      {/* ─── Bill Image Preview Modal ─── */}
      {previewBillImage && (
        <AppModal
          open={Boolean(previewBillImage)}
          onOpenChange={(open) => !open && setPreviewBillImage(null)}
          maxWidth="sm:max-w-xl"
          title={
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2980b9]" />
              <span>Bill / Invoice Image</span>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <a
                href={previewBillImage}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#2980b9] hover:underline font-semibold"
              >
                Open in new tab
              </a>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPreviewBillImage(null)}
                className="h-7 px-3 text-xs"
              >
                Close
              </Button>
            </div>
          }
        >
          <div className="p-2 flex items-center justify-center bg-slate-100 rounded-lg max-h-[70vh] overflow-auto">
            {previewBillImage.endsWith(".pdf") ? (
              <iframe
                src={previewBillImage}
                className="w-full h-96 rounded border border-slate-300"
                title="Bill PDF"
              />
            ) : (
              <img
                src={previewBillImage}
                alt="Bill Document"
                className="max-h-[65vh] max-w-full object-contain rounded shadow-sm"
              />
            )}
          </div>
        </AppModal>
      )}

      {/* ─── Cancel Booking Confirmation Dialog ─── */}
      <DeleteConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isCancelling) {
            setCancelDialogOpen(false);
            setBookingToCancel(null);
            setCancelReason("");
            setCancelRemark("");
            setCancelReasonError("");
          }
        }}
        onConfirm={handleConfirmCancel}
        isLoading={isCancelling}
        title="Cancel Booking"
        confirmText="Confirm Cancel"
        description={`Are you sure you want to cancel booking "${bookingToCancel?.docketNo1 || bookingToCancel?.docketNo2 || "this docket"}"? Please provide cancellation details below.`}
      >
        <div className="space-y-3 pt-1">
          <FormInput
            required
            label="Cancel Reason"
            placeholder="Enter reason for cancellation (e.g. Party Cancelled, Wrong Entry)"
            value={cancelReason}
            onChange={(e) => {
              setCancelReason(e.target.value);
              if (e.target.value.trim()) setCancelReasonError("");
            }}
            error={cancelReasonError}
          />
          <FormInput
            label="Cancel Remark"
            placeholder="Enter cancellation remarks (optional)"
            value={cancelRemark}
            onChange={(e) => setCancelRemark(e.target.value)}
          />
        </div>
      </DeleteConfirmDialog>
    </div>
  );
}
