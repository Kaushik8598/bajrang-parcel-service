"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  RotateCcw,
  Filter,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import { FormInput, FormTextarea } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import AppModal from "@/components/ui/AppModal";
import { Button } from "@/components/ui/button";
import { useCustomerBookingReports, useOnlyBranchList, useModulePermissions } from "@/lib/hooks";
import { CUSTOMER_BOOKING_REPORTS_QUERY_KEY, BOOKING_REPORTS_QUERY_KEY } from "@/lib/hooks/useReports";
import { getStoredUserRole, getStoredUser } from "@/lib/api/auth";
import { updateBookingStatus } from "@/lib/api/booking";
import { showToast } from "@/lib/toast";
import type { BranchDropdownItem } from "@/lib/api/branch";
import type { ParcelBookingReportItem } from "@/lib/api/reports";
import type { ColumnDef } from "@/lib/types/common";

export default function CustomerBookingPage() {
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

  // Filter input states
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");
  const [fromBranchInput, setFromBranchInput] = useState("");
  const [toBranchInput, setToBranchInput] = useState("");

  // Table pagination & search state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  // Live data fetching hook via GET /report/draft
  const { data: apiResponse, isLoading, isFetching } = useCustomerBookingReports({
    page,
    limit,
    search,
    startDate: fromDateInput || undefined,
    endDate: toDateInput || undefined,
    fromBranchId: (isAdminOrSuperAdmin ? fromBranchInput : undefined) || undefined,
    toBranchId: toBranchInput || undefined,
  });

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    fromDateInput ||
    toDateInput ||
    fromBranchInput ||
    toBranchInput
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

  // Handle Reset Filter
  const handleResetFilter = () => {
    setFromDateInput("");
    setToDateInput("");
    setFromBranchInput("");
    setToBranchInput("");
    setPage(1);
  };

  // ─── Cancel Booking Modal State ───────────────────────────────────────────
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<ParcelBookingReportItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelRemark, setCancelRemark] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const handleOpenCancelModal = (row: ParcelBookingReportItem) => {
    setSelectedBookingForCancel(row);
    setCancelReason("");
    setCancelRemark("");
    setCancelReasonError("");
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBookingForCancel) return;
    if (!cancelReason.trim()) {
      setCancelReasonError("Please enter a cancellation reason.");
      return;
    }
    setCancelReasonError("");
    setIsCancelling(true);
    try {
      await updateBookingStatus(selectedBookingForCancel._id, "cancelled", {
        cancelReason: cancelReason.trim(),
        cancelRemark: cancelRemark.trim(),
      });
      showToast(
        "success",
        "Success",
        `Booking "${selectedBookingForCancel.docketNo1 || selectedBookingForCancel.docketNo2 || "docket"}" cancelled successfully.`
      );
      queryClient.invalidateQueries({ queryKey: CUSTOMER_BOOKING_REPORTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: BOOKING_REPORTS_QUERY_KEY });
      setCancelModalOpen(false);
      setSelectedBookingForCancel(null);
      setCancelReason("");
      setCancelRemark("");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String(err.message) : "Failed to cancel booking.";
      showToast("error", "Error", msg);
    } finally {
      setIsCancelling(false);
    }
  };

  // ─── Column-wise Total Calculation ─────────────────────────────────────────
  const totals = useMemo(() => {
    let totalConfirmedQty = 0;
    let totalParcelsQty = 0;
    let grandTotal = 0;

    bookingRecords.forEach((row) => {
      totalConfirmedQty += row.trackingStatus?.draft ?? 0;
      totalParcelsQty += row.trackingStatus?.total ?? row.parcel ?? 0;
      grandTotal += Number(row.finalBillAmount) || 0;
    });

    return {
      totalConfirmedQty,
      totalParcelsQty,
      grandTotal,
    };
  }, [bookingRecords]);

  // ─── Table Columns (topay, paid, gpay, credit, billNo, type, bookby removed) ───
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
      sortValue: (row) => row.trackingStatus?.draft ?? row.parcel ?? 0,
      render: (_, row) => {
        const draft = row.trackingStatus?.draft ?? 0;
        const total = row.trackingStatus?.total ?? row.parcel ?? 0;
        return (
          <span className="text-xs font-semibold text-slate-900">
            {draft}/{total}
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
      key: "finalBillAmount",
      label: "Amount",
      sortable: true,
      width: "w-24",
      sortValue: (row) => Number(row.finalBillAmount) || 0,
      render: (_, row) => {
        const amt = Number(row.finalBillAmount) || 0;
        return amt > 0 ? (
          <span className="font-semibold text-xs text-slate-900 font-mono">
            ₹{amt.toFixed(2)}
          </span>
        ) : (
          <span className="text-slate-400 text-xs font-mono">₹0.00</span>
        );
      },
    },
    {
      key: "bookingDate",
      label: "DateTime",
      sortable: true,
      width: "w-32",
      sortValue: (row) => `${row.bookingDate || ""} ${row.bookingTime || ""}`,
      render: (_, row) => (
        <div className="text-[11px] leading-tight whitespace-nowrap">
          <p className="font-medium text-slate-800">{row.bookingDate || "—"}</p>
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
      key: "actions",
      label: "Actions",
      sortable: false,
      width: "w-36",
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          {/* Edit Button: Redirects to /transaction/booking/edit/:docketNo1 */}
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const editId = row.docketNo1 || row._id;
              router.push(`/transaction/booking/edit/${editId}`);
            }}
            className="h-7 px-2.5 text-xs bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-xs transition-colors flex items-center gap-1 cursor-pointer font-medium"
            title="Edit in Parcel Booking Form"
          >
            <Pencil className="w-3 h-3" />
            <span>Edit</span>
          </Button>

          {/* Cancel Booking Button: Opens Cancel Modal */}
          <Button
            type="button"
            size="sm"
            onClick={() => handleOpenCancelModal(row)}
            className="h-7 px-2.5 text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-1 cursor-pointer font-medium"
            title="Cancel Booking"
          >
            <Trash2 className="w-3 h-3" />
            <span>Cancel</span>
          </Button>
        </div>
      ),
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
              <span>Filter Customer Booking Parcel</span>
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
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3"
                : "grid grid-cols-1 sm:grid-cols-3 gap-3"
            }
          >
            {/* From Date */}
            <FormInput
              label="From Date"
              type="date"
              value={fromDateInput}
              onChange={(e) => {
                setFromDateInput(e.target.value);
                setPage(1);
              }}
            />

            {/* To Date */}
            <FormInput
              label="To Date"
              type="date"
              value={toDateInput}
              onChange={(e) => {
                setToDateInput(e.target.value);
                setPage(1);
              }}
            />

            {/* Admin and SuperAdmin get From Branch */}
            {isAdminOrSuperAdmin && (
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
            )}

            {/* All roles get To Branch filter */}
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
          </div>
        </div>
      </div>

      {/* ─── Customer Bookings Data Table ─── */}
      <DataTable<ParcelBookingReportItem>
        title="Customer Booking Parcel"
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
            {/* Docket No */}
            <td className="px-2.5 py-2.5 text-slate-400 text-xs border-r border-slate-300">—</td>
            {/* Tracking No */}
            <td className="px-2.5 py-2.5 text-slate-400 text-xs border-r border-slate-300">—</td>
            {/* Parcel Qty (Confirmed / Total) */}
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
            {/* Total Amount */}
            <td className="px-2.5 py-2.5 text-slate-900 font-bold text-xs font-mono border-r border-slate-300">
              ₹{totals.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </td>
            {/* DateTime */}
            <td className="px-2.5 py-2.5 text-slate-400 text-xs border-r border-slate-300">—</td>
            {/* Remark */}
            <td className="px-2.5 py-2.5 text-slate-400 text-xs border-r border-slate-300">—</td>
            {/* Actions */}
            <td className="px-2.5 py-2.5 text-slate-400 text-xs">—</td>
          </tr>
        }
      />

      {/* ─── Cancel Booking Confirmation Modal ─── */}
      <AppModal
        open={cancelModalOpen}
        onOpenChange={(open) => {
          if (!open && !isCancelling) {
            setCancelModalOpen(false);
            setSelectedBookingForCancel(null);
            setCancelReason("");
            setCancelRemark("");
            setCancelReasonError("");
          }
        }}
        maxWidth="sm:max-w-md"
        title={
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span className="font-bold text-sm">
              Cancel Booking ({selectedBookingForCancel?.docketNo1 || selectedBookingForCancel?.docketNo2 || ""})
            </span>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isCancelling}
              onClick={() => {
                setCancelModalOpen(false);
                setSelectedBookingForCancel(null);
                setCancelReason("");
                setCancelRemark("");
                setCancelReasonError("");
              }}
              className="h-8 text-xs cursor-pointer"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isCancelling}
              onClick={handleConfirmCancel}
              className="h-8 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Cancel</span>
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-1 text-xs">
          <p className="text-slate-600">
            Are you sure you want to cancel booking docket{" "}
            <strong className="text-slate-900 font-mono">
              {selectedBookingForCancel?.docketNo1 || selectedBookingForCancel?.docketNo2}
            </strong>
            ? This action cannot be undone.
          </p>

          <FormInput
            required
            label="Cancel Reason *"
            placeholder="Enter reason for cancellation..."
            value={cancelReason}
            onChange={(e) => {
              setCancelReason(e.target.value);
              if (e.target.value.trim()) setCancelReasonError("");
            }}
            error={cancelReasonError}
          />

          <FormTextarea
            label="Cancel Remark (Optional)"
            placeholder="Add any extra notes or remarks..."
            value={cancelRemark}
            onChange={(e) => setCancelRemark(e.target.value)}
            rows={2}
          />
        </div>
      </AppModal>
    </div>
  );
}
