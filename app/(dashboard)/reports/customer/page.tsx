"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  UserCheck,
  UserMinus,
  IndianRupee,
  RotateCcw,
  Filter,
  Package,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import AppModal from "@/components/ui/AppModal";
import { showToast } from "@/lib/toast";
import { useCustomerReports, useModulePermissions } from "@/lib/hooks";
import type { CustomerReportItem } from "@/lib/api/reports";
import type { ColumnDef } from "@/lib/types/common";

const CUSTOMER_AS_OPTIONS = [
  { value: "sender", label: "Sender" },
  { value: "receiver", label: "Receiver" },
  { value: "both", label: "Both" },
];

const INACTIVE_OPTIONS = [
  { value: "false", label: "Active" },
  { value: "true", label: "Inactive" },
];

export default function CustomerReportPage() {
  const permissions = useModulePermissions("customer");

  // Filters State
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");
  const [customerAsInput, setCustomerAsInput] = useState("");
  const [docketNoInput, setDocketNoInput] = useState("");
  const [inactiveInput, setInactiveInput] = useState("");

  // Table pagination & search state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");

  // Associated Dockets Modal State
  const [selectedCustomerForDockets, setSelectedCustomerForDockets] = useState<CustomerReportItem | null>(null);
  const [copiedDocket, setCopiedDocket] = useState<string | null>(null);

  // Live data fetching hook via GET /user/customer
  const { data: apiResponse, isLoading, isFetching } = useCustomerReports({
    page,
    limit,
    search,
    customerAs: customerAsInput || undefined,
    docketNo: docketNoInput || undefined,
    inactive: inactiveInput !== "" ? inactiveInput : undefined,
    fromDate: fromDateInput || undefined,
    toDate: toDateInput || undefined,
  });

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    fromDateInput ||
    toDateInput ||
    customerAsInput ||
    docketNoInput ||
    inactiveInput
  );

  // Extract customers list
  const customersList: CustomerReportItem[] = useMemo(() => {
    const rawData = apiResponse?.data;
    if (Array.isArray(rawData)) return rawData;
    if (rawData && typeof rawData === "object" && Array.isArray(rawData.customers)) {
      return rawData.customers;
    }
    return [];
  }, [apiResponse]);

  // Extract summary metrics
  const summary = apiResponse?.data?.summary || {
    totalCustomers: customersList.length,
    totalBookingAmount: 0,
    totalDeliveryAmount: 0,
    senderCount: 0,
    receiverCount: 0,
  };

  const paginationMeta = apiResponse?.pagination || {
    total: customersList.length,
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
    setCustomerAsInput("");
    setDocketNoInput("");
    setInactiveInput("");
    setPage(1);
    setSearch("");
    showToast("info", "Filters reset to default");
  };

  // Handle Copy Docket ID
  const handleCopyDocket = (docketId: string) => {
    navigator.clipboard.writeText(docketId);
    setCopiedDocket(docketId);
    showToast("success", `Copied "${docketId}" to clipboard`);
    setTimeout(() => setCopiedDocket(null), 2000);
  };

  // ─── Table Columns Definition ────────────────────────────────────────────────
  const columns: ColumnDef<CustomerReportItem>[] = [
    {
      key: "name",
      label: "Customer Name",
      sortable: true,
      width: "w-40",
      sortValue: (row) => row.name || "",
      render: (_, row) => (
        <span className="font-semibold text-xs text-slate-900 uppercase">
          {row.name || "—"}
        </span>
      ),
    },
    {
      key: "mobile",
      label: "Mobile No",
      sortable: true,
      width: "w-32",
      sortValue: (row) => row.mobile || "",
      render: (_, row) => (
        <span className="font-mono text-xs text-slate-800">
          {row.mobile || "—"}
        </span>
      ),
    },
    {
      key: "customerAs",
      label: "Role",
      sortable: true,
      width: "w-24",
      align: "center",
      sortValue: (row) => row.customerAs || "",
      render: (_, row) => {
        const role = (row.customerAs || "").toLowerCase();
        let badgeClass = "bg-slate-100 text-slate-700 border-slate-300";
        if (role === "sender") {
          badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
        } else if (role === "receiver") {
          badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        } else if (role === "both") {
          badgeClass = "bg-purple-50 text-purple-700 border-purple-200";
        }
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${badgeClass}`}
          >
            {row.customerAs || "—"}
          </span>
        );
      },
    },
    {
      key: "city",
      label: "City / Address",
      sortable: true,
      sortValue: (row) => row.city || row.address || "",
      exportValue: (row) => {
        const parts = [row.address, row.city, row.pincode].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : "—";
      },
      render: (_, row) => {
        if (!row.city && !row.address) {
          return <span className="text-slate-400 text-xs">—</span>;
        }
        return (
          <div className="text-xs space-y-0.5 max-w-[160px]">
            {row.city && <p className="font-medium text-slate-900 truncate">{row.city}</p>}
            {row.address && (
              <p className="text-[11px] text-slate-500 truncate" title={row.address}>
                {row.address}
              </p>
            )}
            {row.pincode && (
              <span className="text-[10px] text-slate-400 font-mono">Pin: {row.pincode}</span>
            )}
          </div>
        );
      },
    },
    {
      key: "gst",
      label: "GST No",
      sortable: true,
      width: "w-32",
      sortValue: (row) => row.gst || "",
      render: (_, row) => (
        <span className="font-mono text-xs text-slate-700">
          {row.gst || "—"}
        </span>
      ),
    },
    {
      key: "associatedDocketIds",
      label: "Dockets",
      sortable: true,
      width: "w-28",
      align: "center",
      sortValue: (row) => row.associatedDocketIds?.length || 0,
      exportValue: (row) => {
        const list = row.associatedDocketIds || [];
        return list.length > 0 ? `${list.length} (${list.join(", ")})` : "0";
      },
      render: (_, row) => {
        const count = row.associatedDocketIds?.length || 0;
        if (count === 0) {
          return <span className="text-slate-400 text-xs">0</span>;
        }
        return (
          <button
            type="button"
            onClick={() => setSelectedCustomerForDockets(row)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-xs font-bold font-mono transition-colors cursor-pointer"
            title="Click to view all associated dockets"
          >
            <Package className="w-3 h-3" />
            <span>{count}</span>
          </button>
        );
      },
    },
    {
      key: "totalDocketBookingAmount",
      label: "Booking (₹)",
      sortable: true,
      align: "right",
      width: "w-28",
      sortValue: (row) => Number(row.totalDocketBookingAmount) || 0,
      render: (_, row) => {
        const amt = Number(row.totalDocketBookingAmount) || 0;
        return (
          <span className="font-mono text-xs font-semibold text-slate-900">
            {amt > 0 ? amt.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}
          </span>
        );
      },
    },
    {
      key: "totalDocketDeliveryAmount",
      label: "Delivery (₹)",
      sortable: true,
      align: "right",
      width: "w-28",
      sortValue: (row) => Number(row.totalDocketDeliveryAmount) || 0,
      render: (_, row) => {
        const amt = Number(row.totalDocketDeliveryAmount) || 0;
        return (
          <span className="font-mono text-xs font-semibold text-slate-900">
            {amt > 0 ? amt.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}
          </span>
        );
      },
    },
    {
      key: "lastBookingDate",
      label: "Last Booking",
      sortable: true,
      width: "w-28",
      sortValue: (row) => row.lastBookingDate || "",
      render: (_, row) => (
        <span className="text-xs text-slate-800 whitespace-nowrap">
          {row.lastBookingDate || "—"}
        </span>
      ),
    },
    {
      key: "lastDeliveryDate",
      label: "Last Delivery",
      sortable: true,
      width: "w-28",
      sortValue: (row) => row.lastDeliveryDate || "",
      render: (_, row) => (
        <span className="text-xs text-slate-800 whitespace-nowrap">
          {row.lastDeliveryDate || "—"}
        </span>
      ),
    },
    {
      key: "daysSinceLastBooking",
      label: "Inactive Days",
      sortable: true,
      width: "w-28",
      align: "center",
      sortValue: (row) => Number(row.daysSinceLastBooking) || 0,
      render: (_, row) => {
        const days = row.daysSinceLastBooking;
        if (days === undefined || days === null || days < 0) {
          return <span className="text-slate-400 text-xs">—</span>;
        }
        return (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${
              days > 30
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "text-slate-700 font-mono"
            }`}
          >
            {days} {days === 1 ? "day" : "days"}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-3">
      {/* ─── Top Stats / Summary Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Total Customers</span>
            <Users className="w-4 h-4 text-[#2980b9]" />
          </div>
          <p className="mt-1 text-lg font-black font-mono text-slate-900">
            {summary.totalCustomers || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Senders</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="mt-1 text-lg font-black font-mono text-blue-700">
            {summary.senderCount || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Receivers</span>
            <UserMinus className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="mt-1 text-lg font-black font-mono text-emerald-700">
            {summary.receiverCount || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Total Booking</span>
            <IndianRupee className="w-4 h-4 text-slate-700" />
          </div>
          <p className="mt-1 text-lg font-black font-mono text-slate-900">
            ₹{(summary.totalBookingAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Total Delivery</span>
            <IndianRupee className="w-4 h-4 text-slate-700" />
          </div>
          <p className="mt-1 text-lg font-black font-mono text-slate-900">
            ₹{(summary.totalDeliveryAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* ─── Filter Section ─── */}
      <div className="bg-white rounded-lg border border-slate-300 p-4 shadow-xs">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Filter className="w-3.5 h-3.5 text-[#2980b9]" />
              <span>Filter Customer Reports</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
              label="Customer Role"
              options={CUSTOMER_AS_OPTIONS}
              value={customerAsInput}
              onChange={(val) => {
                setCustomerAsInput(val || "");
                setPage(1);
              }}
              clearable
            />

            <FormInput
              type="text"
              label="Docket No"
              placeholder="Search by Docket ID"
              value={docketNoInput}
              onChange={(e) => {
                setDocketNoInput(e.target.value);
                setPage(1);
              }}
            />

            <FormSelect
              label="Status"
              options={INACTIVE_OPTIONS}
              value={inactiveInput}
              onChange={(val) => {
                setInactiveInput(val || "");
                setPage(1);
              }}
              clearable
            />
          </div>
        </div>
      </div>

      {/* ─── Customer Report Data Table ─── */}
      <DataTable<CustomerReportItem>
        title="Customer Report"
        columns={columns}
        data={customersList}
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
      />

      {/* ─── Associated Dockets Modal ─── */}
      {selectedCustomerForDockets && (
        <AppModal
          open={Boolean(selectedCustomerForDockets)}
          onOpenChange={(open) => {
            if (!open) setSelectedCustomerForDockets(null);
          }}
          title={`Associated Dockets - ${selectedCustomerForDockets.name || "Customer"}`}
          maxWidth="sm:max-w-md"
        >
          <div className="space-y-3 p-1">
            <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Customer: </span>
                <span className="font-bold text-slate-900 uppercase">
                  {selectedCustomerForDockets.name || "—"}
                </span>
              </div>
              <div className="font-mono text-slate-700">
                {selectedCustomerForDockets.mobile || "—"}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
                <span>Docket Numbers ({selectedCustomerForDockets.associatedDocketIds?.length || 0})</span>
                <span className="text-[11px] text-slate-400 font-normal">Click to copy</span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5 p-1 rounded-md border border-slate-200 bg-slate-50/50">
                {selectedCustomerForDockets.associatedDocketIds &&
                selectedCustomerForDockets.associatedDocketIds.length > 0 ? (
                  selectedCustomerForDockets.associatedDocketIds.map((docketId, idx) => (
                    <div
                      key={docketId + idx}
                      className="flex items-center justify-between px-3 py-2 rounded bg-white border border-slate-200 hover:border-sky-300 transition-colors"
                    >
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {docketId}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyDocket(docketId)}
                        className="h-6 px-2 text-xs text-slate-600 hover:text-slate-900"
                      >
                        {copiedDocket === docketId ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                            <Check className="w-3 h-3" /> Copied
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Copy className="w-3 h-3" /> Copy
                          </span>
                        )}
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No associated dockets found.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedCustomerForDockets(null)}
                className="text-xs"
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
