"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import DeleteConfirmDialog from "@/components/DataTable/DeleteConfirmDialog";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useOnlyBranchList, useModulePermissions } from "@/lib/hooks";
import { useMemoReports, useUpdateMemoStatusMutation } from "@/lib/hooks/useReports";
import { getStoredUserRole, getStoredUser } from "@/lib/api/auth";
import type { MemoReportItem } from "@/lib/api/reports";
import type { BranchDropdownItem } from "@/lib/api/branch";
import type { ColumnDef } from "@/lib/types/common";

export default function MemoReportPage() {
  const router = useRouter();
  const permissions = useModulePermissions("memo");

  // Current user role
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

  // Filter input states (trigger live on change)
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");
  const [branchInput, setBranchInput] = useState("");

  // Table pagination & search state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  // Fetch branches dropdown list via GET /user/onlyBranch
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

  const branchOptions = useMemo(() => {
    const opts = branchDropdownList.map((b: BranchDropdownItem) => {
      const branchCode = b.branchInfo?.branchCode;
      const branchName = b.branchInfo?.branchName || b.name || "Branch";
      const label = branchCode ? `${branchCode} - ${branchName}` : branchName;
      return {
        value: b._id,
        label,
      };
    });
    return [{ value: "", label: "All Branches" }, ...opts];
  }, [branchDropdownList]);

  // Live data fetching hook via GET /report/memo
  const {
    data: apiResponse,
    isLoading,
    isFetching,
  } = useMemoReports({
    page,
    limit,
    search,
    startDate: fromDateInput || undefined,
    endDate: toDateInput || undefined,
    branchId: branchInput || undefined,
  });

  // Extract memo records from API response
  const memoRecords: MemoReportItem[] = useMemo(() => {
    const rawData = apiResponse?.data;
    if (!rawData) return [];
    if (Array.isArray(rawData)) return rawData;
    if (Array.isArray(rawData.memos)) return rawData.memos;
    return [];
  }, [apiResponse]);

  const paginationMeta = useMemo(() => {
    const p = apiResponse?.data?.pagination || (apiResponse as any)?.pagination;
    return (
      p || {
        total: memoRecords.length,
        page,
        limit,
        totalPages: Math.ceil(memoRecords.length / limit) || 1,
        hasNextPage: false,
        hasPrevPage: false,
      }
    );
  }, [apiResponse, memoRecords.length, page, limit]);

  // Handle Reset Filters
  const handleResetFilter = () => {
    setFromDateInput("");
    setToDateInput("");
    setBranchInput("");
    setPage(1);
    setSearch("");
    showToast("info", "Filters reset to default");
  };

  // ─── Status Confirmation Dialog State ────────────────────────────────────────
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [memoToUpdate, setMemoToUpdate] = useState<MemoReportItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<"approved" | "rejected">("approved");
  const [reasonInput, setReasonInput] = useState("");

  const updateStatusMutation = useUpdateMemoStatusMutation();

  const handleOpenStatusConfirm = (
    memo: MemoReportItem,
    status: "approved" | "rejected"
  ) => {
    setMemoToUpdate(memo);
    setTargetStatus(status);
    setReasonInput("");
    setConfirmDialogOpen(true);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!memoToUpdate) return;

    if (targetStatus === "rejected" && !reasonInput.trim()) {
      showToast("warning", "Please enter a reason for rejection.");
      return;
    }

    try {
      const res = await updateStatusMutation.mutateAsync({
        id: memoToUpdate._id,
        status: targetStatus,
        reason: targetStatus === "rejected" ? reasonInput.trim() : undefined,
      });

      showToast(
        "success",
        res?.message || res?.data?.message || "Success"
      );

      setConfirmDialogOpen(false);
      setMemoToUpdate(null);
      setReasonInput("");
    } catch (error: any) {
      showToast(
        "error",
        error?.message || "Failed to update memo status"
      );
    }
  };

  // ─── Table Columns Definition (Clean Black & White Text Formatting) ──────────
  const columns: ColumnDef<MemoReportItem>[] = useMemo(
    () => [
      {
        key: "memoNo",
        label: "Memo No",
        sortable: true,
        render: (val, row) => (
          <button
            type="button"
            onClick={() => router.push(`/transaction/memo?memoNo=${row.memoNo}`)}
            className="font-mono text-xs font-semibold text-black hover:underline cursor-pointer"
            title="View Memo Details"
          >
            {String(val || "—")}
          </button>
        ),
      },
      {
        key: "memoDate",
        label: "Memo Date",
        sortable: true,
        exportValue: (row) => row.memoDate || (row.createdAt ? formatDateTime(row.createdAt) : "—"),
        render: (val, row) => (
          <span className="text-xs text-black whitespace-nowrap">
            {val ? String(val) : row.createdAt ? formatDateTime(row.createdAt) : "—"}
          </span>
        ),
      },
      {
        key: "fromBranch",
        label: "From Branch",
        sortable: true,
        exportValue: (row) => row.fromBranch?.code ? `${row.fromBranch?.name || ""} [${row.fromBranch.code}]` : (row.fromBranch?.name || "—"),
        render: (_val, row) => {
          const name = row.fromBranch?.name || "";
          const code = row.fromBranch?.code || "";
          return (
            <div className="text-xs text-black whitespace-nowrap">
              <span className="font-semibold">{name}</span>
              {code ? <span className="font-mono text-slate-500 font-normal ml-1">({code})</span> : ""}
            </div>
          );
        },
      },
      {
        key: "cashAmount",
        label: "Cash Amount",
        sortable: true,
        align: "right",
        render: (val) => (
          <span className="font-mono text-xs text-black">
            {formatCurrency(Number(val) || 0)}
          </span>
        ),
      },
      {
        key: "onlineAmount",
        label: "Online Amount",
        sortable: true,
        align: "right",
        render: (val) => (
          <span className="font-mono text-xs text-black">
            {formatCurrency(Number(val) || 0)}
          </span>
        ),
      },
      {
        key: "totalAmount",
        label: "Total Amount",
        sortable: true,
        align: "right",
        render: (val) => (
          <span className="font-mono text-xs font-bold text-black">
            {formatCurrency(Number(val) || 0)}
          </span>
        ),
      },
      {
        key: "createdBy",
        label: "Created By",
        sortable: true,
        render: (val) => (
          <span className="text-xs text-black">
            {String(val || "—")}
          </span>
        ),
      },
      {
        key: "remark",
        label: "Remark",
        render: (val) => (
          <span className="text-xs text-slate-600 truncate max-w-[140px] block" title={String(val || "")}>
            {val ? String(val) : "—"}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        align: "center",
        render: (val) => {
          const status = String(val || "pending").toLowerCase();
          return (
            <span className="text-xs font-semibold text-black capitalize">
              {status}
            </span>
          );
        },
      },
      {
        key: "action",
        label: "Action",
        align: "center",
        width: "w-56",
        render: (_val, row) => {
          const status = String(row.status || "pending").toLowerCase();
          const isPending = status === "pending";

          return (
            <div className="flex items-center justify-start gap-1.5 flex-nowrap">
              {/* View Button (Redirects to /transaction/memo?memoNo=...) */}
              <Button
                type="button"
                size="sm"
                onClick={() => router.push(`/transaction/memo?memoNo=${row.memoNo}`)}
                className="h-7 px-2.5 text-xs bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-xs transition-colors cursor-pointer"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>

              {/* Status Action Buttons for Pending Memos */}
              {isPending && permissions?.canEdit && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleOpenStatusConfirm(row, "approved")}
                    className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleOpenStatusConfirm(row, "rejected")}
                    className="h-7 px-2.5 text-xs bg-[#e74c3c] hover:bg-[#c0392b] text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [router]
  );

  return (
    <div className="space-y-4 pb-12">
      {/* ─── Top Filter Card (3 Standard Filters, Live OnChange) ───────────── */}
      <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h1 className="text-base font-bold text-black tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-black" />
            <span>Memo Report</span>
          </h1>

          {(fromDateInput || toDateInput || branchInput) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilter}
              className="h-7 px-2.5 text-xs text-slate-600 border border-slate-300 hover:bg-slate-50 cursor-pointer shadow-none"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset Filters
            </Button>
          )}
        </div>

        {/* 3 Live Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormInput
            label="From Date:"
            type="date"
            value={fromDateInput}
            onChange={(e) => {
              setFromDateInput(e.target.value);
              setPage(1);
            }}
          />
          <FormInput
            label="To Date:"
            type="date"
            value={toDateInput}
            onChange={(e) => {
              setToDateInput(e.target.value);
              setPage(1);
            }}
          />
          <FormSelect
            label="Branch:"
            options={branchOptions}
            value={branchInput}
            onChange={(val) => {
              setBranchInput(val as string);
              setPage(1);
            }}
            placeholder="All Branches"
          />
        </div>
      </div>

      {/* ─── Memo Report Data Table (Clean Black & White) ──────────────────── */}
      <DataTable<MemoReportItem>
        title="Memo Report"
        columns={columns}
        data={memoRecords}
        permissions={permissions}
        isLoading={isLoading || isFetching}
        clientSide={false}
        searchValue={search}
        onSearch={(query: string) => {
          setSearch(query);
          setPage(1);
        }}
        pagination={{
          page,
          pageSize: limit,
          total: paginationMeta.total,
          onPageChange: (newPage: number) => setPage(newPage),
          onPageSizeChange: (newLimit: number) => {
            setLimit(newLimit);
            setPage(1);
          },
        }}
      />

      {/* ─── Status Confirmation Dialog (DeleteConfirmDialog) ─────────────── */}
      <DeleteConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmStatusUpdate}
        title={targetStatus === "approved" ? "Approve Memo" : "Reject Memo"}
        description={
          memoToUpdate
            ? `Are you sure you want to ${targetStatus} memo "${memoToUpdate.memoNo}" of amount ${formatCurrency(
              memoToUpdate.totalAmount || 0
            )} from branch "${memoToUpdate.fromBranch?.name || "—"}"?`
            : undefined
        }
        confirmText={targetStatus === "approved" ? "Approve" : "Reject"}
        isLoading={updateStatusMutation.isPending}
      >
        {targetStatus === "rejected" && (
          <div className="pt-2">
            <FormInput
              label="Reason for Rejection:"
              placeholder="Enter rejection reason..."
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              required
            />
          </div>
        )}
      </DeleteConfirmDialog>
    </div>
  );
}
