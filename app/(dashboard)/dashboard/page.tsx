"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import * as LucideIcons from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppModal from "@/components/ui/AppModal";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { BranchCellTooltip } from "@/components/dashboard/BranchCellTooltip";
import { getDashboardStats, type DashboardParams } from "@/lib/api/dashboard";
import { getStoredUser, getStoredUserRole } from "@/lib/api/auth";
import type {
  DashboardCardItem,
  ExpiringDocumentItem,
  DashboardBranchSummaryMatrix,
} from "@/lib/types/common";
import { cn } from "@/lib/utils";

// ─── Direct Lucide Icon Resolver from API icon key ────────────────────────────
function getIconComponent(iconName?: string): React.ElementType | null {
  if (!iconName) return null;
  return (LucideIcons as any)[iconName] || null;
}

// ─── Centered Stat Card Component ─────────────────────────────────────────────
function StatCard({
  card,
  onClick,
}: {
  card: DashboardCardItem;
  onClick: () => void;
}) {
  const Icon = getIconComponent(card.icon);
  const numVal = Number(card.value ?? 0) || 0;
  const isExpiring =
    card.label.toLowerCase().includes("expiring") ||
    card.redirect === "/reports/documents";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group bg-[#bce4e8] hover:bg-[#aee0e6] rounded-xl border border-[#7ecad4] hover:border-[#2980b9] p-6 flex flex-col items-center justify-center text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer select-none min-h-[125px]",
        isExpiring && numVal > 0 && "border-amber-400 bg-amber-50 hover:bg-amber-100 hover:border-amber-500"
      )}
    >
      {/* Row 1: Icon + Big Number */}
      <div className="flex items-center justify-center gap-3">
        {Icon && (
          <Icon
            className={cn(
              "w-9 h-9 text-black stroke-[2.2] shrink-0",
              isExpiring && numVal > 0 && "text-amber-700"
            )}
          />
        )}
        <span
          className={cn(
            "text-3xl sm:text-4xl font-extrabold text-black tracking-tight leading-none font-sans",
            isExpiring && numVal > 0 && "text-amber-800"
          )}
        >
          {numVal.toLocaleString("en-IN")}
        </span>
      </div>

      {/* Row 2: Large Bold Label */}
      <p
        className={cn(
          "text-base sm:text-lg font-bold text-black mt-3 leading-snug",
          isExpiring && numVal > 0 && "text-amber-900"
        )}
      >
        {card.label}
      </p>
    </div>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="bg-[#bce4e8]/60 rounded-xl border border-[#7ecad4]/50 p-6 flex flex-col items-center justify-center space-y-3 min-h-[125px]">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-lg bg-black/10" />
        <Skeleton className="h-9 w-24 bg-black/10" />
      </div>
      <Skeleton className="h-5 w-36 bg-black/10" />
    </div>
  );
}

// ─── Branch Summary Matrix Component (Black & White Theme + Shadcn Portal Tooltip) ──
function BranchSummaryMatrixTable({
  matrix,
}: {
  matrix: DashboardBranchSummaryMatrix;
}) {
  const [selectedMetric, setSelectedMetric] = useState<
    "total" | "paid" | "toPay" | "credit" | "notPay" | "gpay"
  >("total");

  if (!matrix || !matrix.headers || matrix.headers.length === 0) {
    return null;
  }

  const { headers, rows, columnTotals, rowTotals, grandTotal } = matrix;

  const metricOptions: { key: "total" | "paid" | "toPay" | "credit" | "notPay" | "gpay"; label: string }[] = [
    { key: "total", label: "Total Bookings" },
    { key: "paid", label: "Paid" },
    { key: "toPay", label: "To-Pay" },
    { key: "credit", label: "Credit" },
    { key: "gpay", label: "GPay / Online" },
    { key: "notPay", label: "Not-Pay" },
  ];

  return (
    <TooltipProvider delay={50}>
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs">
        {/* Header Bar with Tabs */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-t-xl">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-black uppercase tracking-wider flex items-center gap-2">
              <LucideIcons.Building2 className="w-4 h-4 text-black" />
              <span>Branch Wise Booking Summary</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Hover any cell to view detailed payment breakdown (Paid, To-Pay, Credit, GPay, Not-Pay)
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs scrollbar-none">
            {metricOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSelectedMetric(opt.key)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap",
                  selectedMetric === opt.key
                    ? "bg-white text-black shadow-2xs"
                    : "text-slate-600 hover:text-black"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Table (Clean Black & White Common Format) */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr className="bg-slate-100 text-black font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                {/* Top-Left Header Cell */}
                <th className="px-4 py-3 text-left border-r border-slate-200 min-w-[180px] sticky left-0 bg-slate-100 z-20 font-extrabold text-black">
                  From \ To Branch
                </th>

                {/* Column Headers (To Branches) */}
                {headers.map((header) => (
                  <th
                    key={header.id || header.code}
                    className="px-3 py-3 border-r border-slate-200 min-w-[130px] whitespace-nowrap text-black font-bold"
                    title={`${header.name} (${header.code})`}
                  >
                    <div className="font-bold text-black">{header.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono font-normal">
                      {header.code}
                    </div>
                  </th>
                ))}

                {/* Row Total Column Header */}
                <th className="px-3 py-3 bg-slate-100 min-w-[100px] whitespace-nowrap text-black font-extrabold">
                  Total
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-medium bg-white">
              {rows.map((row, rIdx) => {
                const fromBranch = row.fromBranch;
                const rowTot = rowTotals?.find(
                  (rt) =>
                    (rt.fromBranch?.id && rt.fromBranch?.id === fromBranch.id) ||
                    (rt.fromBranch?.code && rt.fromBranch?.code === fromBranch.code)
                );
                const rowVal = rowTot ? Number(rowTot[selectedMetric] ?? 0) : 0;

                return (
                  <tr
                    key={fromBranch.id || fromBranch.code || rIdx}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Row Header (From Branch) */}
                    <td className="px-4 py-2.5 text-left font-bold text-black border-r border-slate-200 bg-white sticky left-0 z-10 whitespace-nowrap">
                      <div className="truncate max-w-[200px]" title={`${fromBranch.name} - ${fromBranch.code}`}>
                        {fromBranch.name} - <span className="font-mono text-slate-500 font-semibold">{fromBranch.code}</span>
                      </div>
                    </td>

                    {/* Matrix Value Cells */}
                    {headers.map((colHeader, cIdx) => {
                      const isSelf =
                        (fromBranch.id && fromBranch.id === colHeader.id) ||
                        (fromBranch.code && fromBranch.code === colHeader.code);

                      const cell = row.toBranches?.find(
                        (tb) =>
                          (tb.toBranch?.id && tb.toBranch?.id === colHeader.id) ||
                          (tb.toBranch?.code && tb.toBranch?.code === colHeader.code)
                      );

                      const cellVal = cell ? Number(cell[selectedMetric] ?? 0) : 0;

                      if (isSelf) {
                        return (
                          <td
                            key={colHeader.id || colHeader.code || cIdx}
                            className="px-3 py-2.5 border-r border-slate-200 bg-slate-50 text-slate-300 text-center select-none text-xs"
                          >
                            —
                          </td>
                        );
                      }

                      return (
                        <td
                          key={colHeader.id || colHeader.code || cIdx}
                          className={cn(
                            "p-0 border-r border-slate-200 font-sans text-center transition-colors",
                            cellVal > 0 ? "hover:bg-slate-100" : "hover:bg-slate-50"
                          )}
                        >
                          <BranchCellTooltip
                            fromBranch={fromBranch}
                            toBranch={colHeader}
                            cell={cell}
                            cellVal={cellVal}
                          />
                        </td>
                      );
                    })}

                    {/* Row Total Cell */}
                    <td className="px-3 py-2.5 font-extrabold font-mono text-center text-black bg-slate-50 border-l border-slate-200">
                      {rowVal > 0 ? rowVal : "0"}
                    </td>
                  </tr>
                );
              })}

              {/* Column Totals Bottom Row */}
              <tr className="bg-slate-100 font-extrabold text-black border-t-2 border-slate-300">
                <td className="px-4 py-3 text-left uppercase tracking-wider text-xs border-r border-slate-200 bg-slate-100 sticky left-0 z-10 font-bold">
                  Total
                </td>

                {headers.map((colHeader, cIdx) => {
                  const colTot = columnTotals?.find(
                    (ct) =>
                      (ct.toBranch?.id && ct.toBranch?.id === colHeader.id) ||
                      (ct.toBranch?.code && ct.toBranch?.code === colHeader.code)
                  );
                  const colVal = colTot ? Number(colTot[selectedMetric] ?? 0) : 0;

                  return (
                    <td
                      key={colHeader.id || colHeader.code || cIdx}
                      className="px-3 py-3 border-r border-slate-200 text-center font-mono font-bold text-black"
                    >
                      {colVal > 0 ? colVal : "0"}
                    </td>
                  );
                })}

                {/* Grand Total Bottom-Right Cell */}
                <td className="px-3 py-3 bg-slate-200 text-black font-mono text-sm font-extrabold text-center border-l border-slate-300">
                  {grandTotal ? grandTotal[selectedMetric] ?? 0 : 0}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── Main Dashboard Page Component ────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();

  // Role detection
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  useEffect(() => {
    const role = (getStoredUserRole() || getStoredUser()?.role || "").toLowerCase();
    setCurrentUserRole(role);
  }, []);

  const isAdminOrSuperAdmin = useMemo(() => {
    return ["superadmin", "admin", "super_admin", "super-admin"].includes(currentUserRole);
  }, [currentUserRole]);

  // Date filters
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [activePreset, setActivePreset] = useState<string>("all");

  // Expiring Documents Modal
  const [expiringModalOpen, setExpiringModalOpen] = useState<boolean>(false);

  const queryParams = useMemo<DashboardParams>(() => {
    // If not admin/superadmin, strictly fetch today's date
    if (!isAdminOrSuperAdmin && currentUserRole) {
      const today = new Date().toISOString().split("T")[0];
      return { startDate: today, endDate: today };
    }

    const params: DashboardParams = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return params;
  }, [isAdminOrSuperAdmin, currentUserRole, startDate, endDate]);

  const {
    data: dashboardData,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ["dashboard-stats", queryParams],
    queryFn: () => getDashboardStats(queryParams),
  });

  const cards: DashboardCardItem[] = useMemo(() => {
    if (dashboardData?.cards && Array.isArray(dashboardData.cards)) {
      return dashboardData.cards;
    }
    return [];
  }, [dashboardData]);

  const expiringDocuments: ExpiringDocumentItem[] = useMemo(() => {
    if (dashboardData?.expiringDocuments && Array.isArray(dashboardData.expiringDocuments)) {
      return dashboardData.expiringDocuments;
    }
    return [];
  }, [dashboardData]);

  const branchSummaryMatrix: DashboardBranchSummaryMatrix | null = useMemo(() => {
    const bSum = dashboardData?.branchSummary;
    if (bSum && Array.isArray(bSum.headers) && Array.isArray(bSum.rows)) {
      return bSum as DashboardBranchSummaryMatrix;
    }
    return null;
  }, [dashboardData]);

  // Preset Date Handlers (Admin/SuperAdmin only)
  const applyPreset = (preset: "all" | "today" | "week" | "month") => {
    setActivePreset(preset);
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const todayStr = formatDate(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "week") {
      const pastWeek = new Date();
      pastWeek.setDate(today.getDate() - 7);
      setStartDate(formatDate(pastWeek));
      setEndDate(formatDate(today));
    } else if (preset === "month") {
      const pastMonth = new Date();
      pastMonth.setDate(today.getDate() - 30);
      setStartDate(formatDate(pastMonth));
      setEndDate(formatDate(today));
    }
  };

  // Card Click Handler
  const handleCardClick = (card: DashboardCardItem) => {
    const isExpiring =
      card.label.toLowerCase().includes("expiring") ||
      card.redirect === "/reports/documents";

    if (isExpiring) {
      setExpiringModalOpen(true);
    } else if (card.redirect) {
      router.push(card.redirect);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ─── Page Heading & Date Filter Bar ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
            Dashboard
          </h1>
        </div>

        {/* Date Filter Bar: Visible ONLY for Admin / SuperAdmin */}
        {isAdminOrSuperAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Preset Buttons */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => applyPreset("all")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-semibold text-xs transition-all cursor-pointer",
                  activePreset === "all"
                    ? "bg-white text-black shadow-2xs font-bold"
                    : "text-slate-600 hover:text-black"
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => applyPreset("today")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-semibold text-xs transition-all cursor-pointer",
                  activePreset === "today"
                    ? "bg-white text-black shadow-2xs font-bold"
                    : "text-slate-600 hover:text-black"
                )}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => applyPreset("week")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-semibold text-xs transition-all cursor-pointer",
                  activePreset === "week"
                    ? "bg-white text-black shadow-2xs font-bold"
                    : "text-slate-600 hover:text-black"
                )}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => applyPreset("month")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-semibold text-xs transition-all cursor-pointer",
                  activePreset === "month"
                    ? "bg-white text-black shadow-2xs font-bold"
                    : "text-slate-600 hover:text-black"
                )}
              >
                30 Days
              </button>
            </div>

            {/* Date Pickers */}
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset("custom");
                }}
                className="h-8 text-xs w-32 bg-white border-slate-300"
              />
              <span className="text-slate-400 text-xs font-semibold">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset("custom");
                }}
                className="h-8 text-xs w-32 bg-white border-slate-300"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {isError && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-[#e74c3c] text-sm font-semibold">
          Failed to load dashboard stats. Please try again.
        </div>
      )}

      {/* ─── 1. Stat Cards Grid (Purely from API Data) ───────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : cards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((card, idx) => (
            <StatCard
              key={`${card.label}-${idx}`}
              card={card}
              onClick={() => handleCardClick(card)}
            />
          ))}
        </div>
      ) : !isError ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm font-semibold">
          No dashboard statistics available.
        </div>
      ) : null}

      {/* ─── 2. Branch Summary Matrix Table (Below Cards) ────────────────────── */}
      {branchSummaryMatrix && (
        <BranchSummaryMatrixTable matrix={branchSummaryMatrix} />
      )}

      {/* ─── 3. Expiring Documents Modal ─────────────────────────────────────── */}
      {expiringModalOpen && (
        <AppModal
          open={expiringModalOpen}
          onOpenChange={(open) => setExpiringModalOpen(open)}
          title={`Expiring Documents (${expiringDocuments.length})`}
          maxWidth="sm:max-w-4xl"
        >
          <div className="space-y-4 p-1">
            {expiringDocuments.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">User / Entity</th>
                      <th className="px-3 py-2.5">Role</th>
                      <th className="px-3 py-2.5">Document Type</th>
                      <th className="px-3 py-2.5">Document Number</th>
                      <th className="px-3 py-2.5">Expiry Date</th>
                      <th className="px-3 py-2.5">Days Left</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-medium">
                    {expiringDocuments.map((item, idx) => {
                      const days = item.daysLeft ?? 0;
                      const isCritical = days <= 5;
                      const isExpired = days <= 0;

                      return (
                        <tr key={item.userId ? `${item.userId}-${idx}` : idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 text-slate-500 font-bold">{idx + 1}</td>
                          <td className="px-3 py-2.5 font-bold text-slate-900">
                            {item.user || "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                              {item.role || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-black">
                            {item.documentType || "—"}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-800">
                            {item.documentNumber || "—"}
                          </td>
                          <td className="px-3 py-2.5 text-slate-700 font-mono">
                            {item.expiryDate
                              ? new Date(item.expiryDate).toLocaleDateString("en-IN", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={cn(
                                "px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase",
                                isExpired
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : isCritical
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              )}
                            >
                              {isExpired ? "Expired" : `${days} Day${days === 1 ? "" : "s"} Left`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                No expiring documents found.
              </div>
            )}

            <div className="flex items-center justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExpiringModalOpen(false)}
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
