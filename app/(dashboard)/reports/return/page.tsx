"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Printer,
  RotateCcw,
  Filter,
  Eye,
  Barcode,
} from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import AppModal from "@/components/ui/AppModal";
import { showToast } from "@/lib/toast";
import { useReturnReports, useOnlyBranchList, useModulePermissions } from "@/lib/hooks";
import { getStoredUserRole, getStoredUser } from "@/lib/api/auth";
import { printBookingSlip } from "@/components/booking/BookingPrintSlip";
import { printBookingBarcode } from "@/components/booking/BookingBarcodeSticker";
import type { BranchDropdownItem } from "@/lib/api/branch";
import type { ParcelBookingReportItem } from "@/lib/api/reports";
import { getCurrentDateTime, formatMobileByRole } from "@/lib/utils";
import type { ColumnDef } from "@/lib/types/common";

const HAS_BILL_OPTIONS = [
  { value: "true", label: "With Bill" },
  { value: "false", label: "Without Bill" },
];

// ─── Payment Extraction Helper ─────────────────────────────────────────────────

function getPaymentMethodAmounts(row: ParcelBookingReportItem) {
  const m = (row.paymentMethod || "").toLowerCase().trim();
  const amt = Number(row.finalBillAmount) || 0;

  return {
    topayAmount: m.includes("to-pay") || m.includes("to pay") || m === "topay" ? amt : 0,
    paidAmount: m === "paid" ? amt : 0,
    gpayAmount: m.includes("g pay") || m.includes("gpay") || m.includes("google pay") ? amt : 0,
    creditAmount: m === "credit" ? amt : 0,
  };
}

export default function ReturnReportPage() {
  const router = useRouter();
  const permissions = useModulePermissions("booking");

  // Determine current user role for branch filter authorization
  const [userRole, setUserRole] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => {
    const user = getStoredUser();
    setCurrentUser(user);
    const role = getStoredUserRole() || user?.role || "";
    setUserRole(role.toLowerCase());
  }, []);

  const isAdminOrSuperAdmin =
    userRole === "admin" ||
    userRole === "superadmin" ||
    userRole === "super_admin" ||
    userRole === "super-admin";

  const ownBranchId = useMemo(() => {
    return String(
      (currentUser as any)?.staffProfile?.branchId?._id ||
      (currentUser as any)?.staffProfile?.branchId ||
      currentUser?._id ||
      currentUser?.id ||
      ""
    );
  }, [currentUser]);

  // Filter state
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");
  const [fromBranchInput, setFromBranchInput] = useState("");
  const [toBranchInput, setToBranchInput] = useState("");
  const [hasBillInput, setHasBillInput] = useState("");

  // Table pagination & search state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  // Preview Bill Image state
  const [previewBillImage, setPreviewBillImage] = useState<string | null>(null);

  // Live data fetching hook via GET /report/return
  const { data: apiResponse, isLoading, isFetching } = useReturnReports({
    page,
    limit,
    search,
    startDate: (isAdminOrSuperAdmin ? fromDateInput : undefined) || undefined,
    endDate: (isAdminOrSuperAdmin ? toDateInput : undefined) || undefined,
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

  // To Branch options exclude the logged-in user's branch
  const toBranchOptions = useMemo(() => {
    if (!ownBranchId) return branchOptions;
    return branchOptions.filter((b) => b.value !== ownBranchId);
  }, [branchOptions, ownBranchId]);

  // From Branch options: exclude logged-in user's branch for non-admin/superadmin
  const fromBranchOptions = useMemo(() => {
    if (isAdminOrSuperAdmin || !ownBranchId) return branchOptions;
    return branchOptions.filter((b) => b.value !== ownBranchId);
  }, [branchOptions, ownBranchId, isAdminOrSuperAdmin]);

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

  // Column-wise Total Calculation
  const totals = useMemo(() => {
    let totalParcels = 0;
    let totalTopay = 0;
    let totalPaid = 0;
    let totalGpay = 0;
    let totalCredit = 0;
    let grandTotal = 0;

    bookingRecords.forEach((row) => {
      totalParcels += Number(row.parcel) || 0;
      const { topayAmount, paidAmount, gpayAmount, creditAmount } = getPaymentMethodAmounts(row);
      totalTopay += topayAmount;
      totalPaid += paidAmount;
      totalGpay += gpayAmount;
      totalCredit += creditAmount;
      grandTotal += Number(row.finalBillAmount) || 0;
    });

    return {
      totalParcels,
      totalTopay,
      totalPaid,
      totalGpay,
      totalCredit,
      grandTotal,
    };
  }, [bookingRecords]);

  // Handle Reset Filter
  const handleResetFilter = () => {
    setFromDateInput("");
    setToDateInput("");
    setFromBranchInput("");
    setToBranchInput("");
    setHasBillInput("");
    setPage(1);
    setSearch("");
    showToast("info", "Filters reset to default");
  };

  // ─── Table Columns Definition ────────────────────────────────────────────────
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
      key: "parcel",
      label: "Parcel",
      sortable: true,
      width: "w-20",
      sortValue: (row) => Number(row.parcel) || 0,
      render: (_, row) => (
        <span className="text-xs font-semibold text-slate-900">
          {row.parcel || 0}
        </span>
      ),
    },
    ...(isAdminOrSuperAdmin
      ? [
          {
            key: "fromBranch",
            label: "From Branch",
            sortable: true,
            sortValue: (row: ParcelBookingReportItem) => row.fromBranch?.branchName || "",
            exportValue: (row: ParcelBookingReportItem) => {
              const bName = row.fromBranch?.branchName;
              const bCode = row.fromBranch?.branchCode;
              if (!bName && !bCode) return "—";
              return bCode ? `${bName || ""} [${bCode}]` : (bName || "—");
            },
            render: (_: unknown, row: ParcelBookingReportItem) => {
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
        ]
      : []),
    {
      key: "toBranch",
      label: "To Branch",
      sortable: true,
      sortValue: (row) => row.toBranch?.branchName || "",
      exportValue: (row) => {
        const bName = row.toBranch?.branchName;
        const bCode = row.toBranch?.branchCode;
        if (!bName && !bCode) return "—";
        return bCode ? `${bName || ""} [${bCode}]` : (bName || "—");
      },
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
      exportValue: (row) => {
        const name = row.sender?.name || "—";
        const mob = row.sender?.mobile || row.sender?.contact_no;
        if (!mob) return name;
        return `${name}\n${formatMobileByRole(mob, userRole)}`;
      },
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
      exportValue: (row) => {
        const name = row.receiver?.name || "—";
        const mob = row.receiver?.mobile || row.receiver?.contact_no;
        if (!mob) return name;
        return `${name}\n${formatMobileByRole(mob, userRole)}`;
      },
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
          <span className="text-slate-400 text-xs">—</span>
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
          <span className="text-slate-400 text-xs">—</span>
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
          <span className="text-slate-400 text-xs">—</span>
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
          <span className="text-slate-400 text-xs">—</span>
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
        if (!row.billNo && !row.billImage) {
          return <span className="text-slate-400 text-xs">—</span>;
        }
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-slate-900 font-medium">
              {row.billNo || "—"}
            </span>
            {row.billImage && (
              <button
                type="button"
                onClick={() => setPreviewBillImage(row.billImage || null)}
                className="text-[#2980b9] hover:text-[#2471a3] p-0.5 rounded transition-colors cursor-pointer"
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
      exportValue: (row) => `${row.bookingDate || "—"} ${row.bookingTime || ""}`.trim(),
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
      sortable: false,
      align: "center",
      width: "w-24",
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => printBookingSlip(row as any)}
            className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900 border-slate-300 hover:bg-slate-100"
            title="Print Booking Slip"
          >
            <Printer className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => printBookingBarcode(row as any)}
            className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900 border-slate-300 hover:bg-slate-100"
            title="Print Barcode Sticker"
          >
            <Barcode className="w-3.5 h-3.5" />
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
              <span>Filter Return Reports</span>
              {!isAdminOrSuperAdmin && (
                <span className="text-[10px] text-slate-400 font-normal ml-1">
                  (Branch filtered to your current branch)
                </span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {/* Admin and SuperAdmin get From Date, To Date, From Branch */}
            {isAdminOrSuperAdmin && (
              <>
                <FormInput
                  type="date"
                  label="From Date"
                  value={fromDateInput}
                  onChange={(e) => {
                    setFromDateInput(e.target.value);
                    setPage(1);
                  }}
                />

                <FormInput
                  type="date"
                  label="To Date"
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
                  options={fromBranchOptions}
                  value={fromBranchInput}
                  onChange={(val) => {
                    setFromBranchInput(val || "");
                    setPage(1);
                  }}
                  clearable
                />
              </>
            )}

            <FormSelect
              searchable
              label="To Branch"
              placeholder="All To Branches"
              searchPlaceholder="Search destination branch..."
              options={toBranchOptions}
              value={toBranchInput}
              onChange={(val) => {
                setToBranchInput(val || "");
                setPage(1);
              }}
              clearable
            />

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
        title="Return Reports"
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
        exportFooterRow={[
          "Total",
          "—",
          totals.totalParcels,
          "—",
          "—",
          "—",
          "—",
          totals.totalTopay > 0 ? totals.totalTopay.toFixed(2) : "—",
          totals.totalPaid > 0 ? totals.totalPaid.toFixed(2) : "—",
          totals.totalGpay > 0 ? totals.totalGpay.toFixed(2) : "—",
          totals.totalCredit > 0 ? totals.totalCredit.toFixed(2) : "—",
          "—",
          "—",
          "—",
          "—",
          `Grand: ₹${totals.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        ]}
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
            {/* Parcel Qty */}
            <td className="px-2.5 py-2.5 font-bold text-xs text-slate-900 border-r border-slate-300">
              {totals.totalParcels}
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
          onOpenChange={(open) => {
            if (!open) setPreviewBillImage(null);
          }}
          title="Bill Image Preview"
          maxWidth="sm:max-w-2xl"
        >
          <div className="flex flex-col items-center justify-center p-4">
            <img
              src={previewBillImage}
              alt="Bill Document"
              className="max-h-[70vh] w-auto object-contain rounded border border-slate-200 shadow-xs"
            />
            <div className="mt-4 flex justify-end w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewBillImage(null)}
                className="text-xs"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </AppModal>
      )}
    </div>
  );
}
