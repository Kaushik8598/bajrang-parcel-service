"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  RotateCcw,
  Eye,
  FileText,
  Building2,
  Calendar,
  User,
  IndianRupee,
  Truck,
  Users,
  Fuel,
  Gauge,
  Receipt,
} from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { Button } from "@/components/ui/button";
import AppModal from "@/components/ui/AppModal";
import { showToast } from "@/lib/toast";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useOnlyBranchList } from "@/lib/hooks";
import { useExpenseReports } from "@/lib/hooks/useReports";
import { getStoredUserRole, getStoredUser } from "@/lib/api/auth";
import type { ExpenseReportItem } from "@/lib/api/reports";
import type { BranchDropdownItem } from "@/lib/api/branch";
import type { ColumnDef, TablePermissions } from "@/lib/types/common";

const PERMISSIONS: TablePermissions = {
  canExcel: true,
  canPDF: true,
  canPrint: true,
  canAdd: false,
  canEdit: false,
  canDelete: false,
  canStatus: false,
};

const EXPENSE_TYPE_OPTIONS = [
  { value: "", label: "All Expense Types" },
  { value: "labour", label: "Labour" },
  { value: "salary", label: "Salary" },
  { value: "rent", label: "Rent" },
  { value: "petrol", label: "Petrol / Diesel / Fuel" },
  { value: "stationary", label: "Stationary" },
  { value: "tea", label: "Tea & Snacks" },
  { value: "maintenance", label: "Maintenance" },
  { value: "office", label: "Office Expense" },
  { value: "other", label: "Other" },
];

export default function BranchExpenseReportPage() {
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
  const [expenseTypeInput, setExpenseTypeInput] = useState("");

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

  // Live data fetching hook via GET /report/expense
  const {
    data: apiResponse,
    isLoading,
    isFetching,
  } = useExpenseReports({
    page,
    limit,
    search,
    startDate: fromDateInput || undefined,
    endDate: toDateInput || undefined,
    branchId: branchInput || undefined,
    expenseType: expenseTypeInput || undefined,
  });

  // Extract expense records from API response
  const expenseRecords: ExpenseReportItem[] = useMemo(() => {
    const rawData = apiResponse?.data;
    if (!rawData) return [];
    if (Array.isArray(rawData)) return rawData;
    if (Array.isArray(rawData.expenses)) return rawData.expenses;
    return [];
  }, [apiResponse]);

  const paginationMeta = useMemo(() => {
    const p = apiResponse?.data?.pagination || (apiResponse as any)?.pagination;
    return (
      p || {
        total: expenseRecords.length,
        page,
        limit,
        totalPages: Math.ceil(expenseRecords.length / limit) || 1,
        hasNextPage: false,
        hasPrevPage: false,
      }
    );
  }, [apiResponse, expenseRecords.length, page, limit]);

  // Handle Reset Filters
  const handleResetFilter = () => {
    setFromDateInput("");
    setToDateInput("");
    setBranchInput("");
    setExpenseTypeInput("");
    setPage(1);
    setSearch("");
    showToast("info", "Filters reset to default");
  };

  // ─── View Modal State ────────────────────────────────────────────────────────
  const [selectedExpense, setSelectedExpense] = useState<ExpenseReportItem | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // ─── Table Columns Definition (Clean B&W Text Formatting) ────────────────────
  const columns: ColumnDef<ExpenseReportItem>[] = useMemo(
    () => [
      {
        key: "memoNo",
        label: "Expense No",
        sortable: true,
        render: (val, row) => (
          <span className="font-mono text-xs font-bold text-black">
            {String(val || "—")}
          </span>
        ),
      },
      {
        key: "memoDate",
        label: "Expense Date",
        sortable: true,
        exportValue: (row) => row.memoDate || (row.createdAt ? formatDateTime(row.createdAt) : "—"),
        render: (val, row) => (
          <span className="text-xs text-black whitespace-nowrap">
            {val ? String(val) : row.createdAt ? formatDateTime(row.createdAt) : "—"}
          </span>
        ),
      },
      ...(isAdminOrSuperAdmin
        ? [
            {
              key: "fromBranch",
              label: "Branch",
              sortable: true,
              exportValue: (row: ExpenseReportItem) =>
                row.fromBranch?.code
                  ? `${row.fromBranch?.name || ""} [${row.fromBranch.code}]`
                  : row.fromBranch?.name || "—",
              render: (_val: unknown, row: ExpenseReportItem) => {
                const name = row.fromBranch?.name || "";
                const code = row.fromBranch?.code || "";
                return (
                  <div className="text-xs text-black whitespace-nowrap">
                    <span className="font-semibold">{name}</span>
                    {code ? (
                      <span className="font-mono text-slate-500 font-normal ml-1">
                        ({code})
                      </span>
                    ) : (
                      ""
                    )}
                  </div>
                );
              },
            },
          ]
        : []),
      {
        key: "expenseType",
        label: "Expense Type",
        sortable: true,
        render: (val) => (
          <span className="text-xs font-medium text-black capitalize">
            {String(val || "—")}
          </span>
        ),
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
        key: "action",
        label: "Action",
        align: "center",
        width: "w-28",
        render: (_val, row) => (
          <div className="flex items-center justify-center">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setSelectedExpense(row);
                setViewModalOpen(true);
              }}
              className="h-7 px-2.5 text-xs bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-xs transition-colors cursor-pointer"
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4 pb-12">
      {/* ─── Top Filter Card (Live OnChange Filters) ───────────────────────── */}
      <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h1 className="text-base font-bold text-black tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-black" />
            <span>Branch Expense Report</span>
          </h1>

          {(fromDateInput || toDateInput || branchInput || expenseTypeInput) && (
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

        {/* 4 Live Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
          <FormSelect
            label="Expense Type:"
            options={EXPENSE_TYPE_OPTIONS}
            value={expenseTypeInput}
            onChange={(val) => {
              setExpenseTypeInput(val as string);
              setPage(1);
            }}
            placeholder="All Expense Types"
          />
        </div>
      </div>

      {/* ─── Expense Report Data Table (Clean Black & White) ──────────────── */}
      <DataTable<ExpenseReportItem>
        title="Branch Expense Report"
        columns={columns}
        data={expenseRecords}
        permissions={PERMISSIONS}
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

      {/* ─── View Expense Details Modal ────────────────────────────────────── */}
      {viewModalOpen && selectedExpense && (
        <AppModal
          open={viewModalOpen}
          onOpenChange={(open) => setViewModalOpen(open)}
          title={`Expense Details - ${selectedExpense.memoNo}`}
          maxWidth="sm:max-w-xl"
        >
          <div className="space-y-4 p-1">
            {/* Header Expense Number & Type */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-500 block">Expense Number</span>
                <span className="text-base font-extrabold font-mono text-black">{selectedExpense.memoNo}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">Expense Type</span>
                <span className="text-xs font-extrabold uppercase text-black capitalize">
                  {selectedExpense.expenseType}
                </span>
              </div>
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-slate-500 font-semibold flex items-center gap-1 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Branch:
                </span>
                <span className="font-bold text-black">
                  {selectedExpense.fromBranch?.name || "—"}{" "}
                  {selectedExpense.fromBranch?.code ? `(${selectedExpense.fromBranch.code})` : ""}
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-slate-500 font-semibold flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Expense Date:
                </span>
                <span className="font-bold text-black font-mono">
                  {selectedExpense.memoDate || (selectedExpense.createdAt ? formatDateTime(selectedExpense.createdAt) : "—")}
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-slate-500 font-semibold flex items-center gap-1 mb-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Created By:
                </span>
                <span className="font-bold text-black">
                  {selectedExpense.createdBy || "—"}
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-slate-500 font-semibold flex items-center gap-1 mb-1">
                  <Receipt className="w-3.5 h-3.5 text-slate-400" />
                  Expense Deducted:
                </span>
                <span className="font-bold text-black">
                  {selectedExpense.expenseDeducted ? "Yes" : "No"}
                  {selectedExpense.expenseDeductedAmount !== undefined && (
                    <span className="font-mono text-slate-600 font-normal ml-1">
                      ({formatCurrency(selectedExpense.expenseDeductedAmount)})
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Financials Breakdown Card */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
              <h3 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-black" />
                Amount Summary
              </h3>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2 bg-white rounded border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-semibold block">Cash Amount</span>
                  <span className="text-sm font-bold font-mono text-black">
                    {formatCurrency(selectedExpense.cashAmount || 0)}
                  </span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-semibold block">Online Amount</span>
                  <span className="text-sm font-bold font-mono text-black">
                    {formatCurrency(selectedExpense.onlineAmount || 0)}
                  </span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-semibold block">Total Amount</span>
                  <span className="text-sm font-extrabold font-mono text-black">
                    {formatCurrency(selectedExpense.totalAmount || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Type-Specific Details (Labour / Petrol / Truck) */}
            {selectedExpense.expenseType?.toLowerCase() === "labour" && (
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2 text-xs">
                <h3 className="font-bold text-black uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <Users className="w-3.5 h-3.5 text-black" />
                  Labour Details
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block">Month:</span>
                    <span className="font-semibold text-black">{selectedExpense.labourMonth || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Week:</span>
                    <span className="font-semibold text-black">{selectedExpense.labourWeek || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Labour Count:</span>
                    <span className="font-semibold text-black font-mono">{selectedExpense.labourCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Rate per Labour:</span>
                    <span className="font-semibold text-black font-mono">{formatCurrency(selectedExpense.ratePerLabour || 0)}</span>
                  </div>
                </div>
              </div>
            )}

            {(selectedExpense.expenseType?.toLowerCase() === "petrol" ||
              selectedExpense.startKM ||
              selectedExpense.endKM ||
              selectedExpense.liter) ? (
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2 text-xs">
                <h3 className="font-bold text-black uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <Fuel className="w-3.5 h-3.5 text-black" />
                  Fuel & Vehicle Details
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedExpense.truck && (
                    <div>
                      <span className="text-slate-500 block">Truck:</span>
                      <span className="font-semibold text-black">
                        {selectedExpense.truck.name} {selectedExpense.truck.truckNumber ? `(${selectedExpense.truck.truckNumber})` : ""}
                      </span>
                    </div>
                  )}
                  {selectedExpense.fuelType && (
                    <div>
                      <span className="text-slate-500 block">Fuel Type:</span>
                      <span className="font-semibold text-black capitalize">{selectedExpense.fuelType}</span>
                    </div>
                  )}
                  {selectedExpense.liter ? (
                    <div>
                      <span className="text-slate-500 block">Liters:</span>
                      <span className="font-semibold text-black font-mono">{selectedExpense.liter} L</span>
                    </div>
                  ) : null}
                  {selectedExpense.startKM || selectedExpense.endKM ? (
                    <div>
                      <span className="text-slate-500 block">KM Range:</span>
                      <span className="font-semibold text-black font-mono">
                        {selectedExpense.startKM || 0} - {selectedExpense.endKM || 0} KM
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Remark */}
            {selectedExpense.remark ? (
              <div className="p-3 rounded-lg border border-slate-200 bg-white text-xs">
                <span className="text-slate-500 font-semibold block mb-0.5">Remark:</span>
                <p className="text-black font-medium">{selectedExpense.remark}</p>
              </div>
            ) : null}

            <div className="flex items-center justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewModalOpen(false)}
                className="h-8 px-4 font-bold border-slate-300 text-slate-700 cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </AppModal>
      )}
    </div>
  );
}
