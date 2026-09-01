"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  PackageCheck,
  Package,
  XCircle,
  Boxes,
  Truck,
  Clock,
  Sparkles,
  RefreshCw,
  Building2,
  Users,
  IndianRupee,
  UserCheck,
  Archive,
  ScrollText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDashboardStats, MOCK_DASHBOARD_DATA, type DashboardParams } from "@/lib/api/dashboard";
import { getStoredUser, getStoredUserRole } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

// ─── Stat Card Interface ──────────────────────────────────────────────────────
interface StatCardItem {
  key: string;
  label: string;
  value: number | string;
  Icon: React.ElementType;
  path: string;
  isCurrency?: boolean;
}

// ─── Centered Stat Card Component (Matching User's Screenshot) ─────────────────
function StatCard({
  card,
  onClick,
}: {
  card: StatCardItem;
  onClick: () => void;
}) {
  const { Icon, label, value, isCurrency } = card;
  const numVal = typeof value === "number" ? value : Number(value) || 0;
  const displayValue = isCurrency
    ? `₹ ${numVal.toLocaleString("en-IN")}`
    : numVal.toLocaleString("en-IN");

  return (
    <div
      id={`stat-card-${card.key}`}
      onClick={onClick}
      className="group bg-[#bce4e8] hover:bg-[#aee0e6] rounded-xl border border-[#7ecad4] hover:border-[#2980b9] p-6 flex flex-col items-center justify-center text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer select-none min-h-[125px]"
    >
      {/* Row 1: Icon + Big Number */}
      <div className="flex items-center justify-center gap-3">
        <Icon className="w-9 h-9 text-black stroke-[2.2] shrink-0" />
        <span className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight leading-none font-sans">
          {displayValue}
        </span>
      </div>

      {/* Row 2: Large Bold Label */}
      <p className="text-base sm:text-lg font-bold text-black mt-3 leading-snug">
        {label}
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

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();

  // Role detection
  const currentUser = useMemo(() => getStoredUser(), []);
  const currentRole = useMemo(
    () => (getStoredUserRole() || currentUser?.role || "").toLowerCase(),
    [currentUser]
  );
  const isAdminOrSuperAdmin = ["superadmin", "admin"].includes(currentRole);

  // Date filters for Admin / SuperAdmin
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [activePreset, setActivePreset] = useState<string>("all");

  const queryParams = useMemo<DashboardParams>(() => {
    const today = new Date().toISOString().split("T")[0];

    // If not admin/superAdmin, strictly filter for today's data only
    if (!isAdminOrSuperAdmin) {
      return { startDate: today, endDate: today };
    }

    const params: DashboardParams = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return params;
  }, [isAdminOrSuperAdmin, startDate, endDate]);

  const {
    data: dashboardData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["dashboard-stats", queryParams],
    queryFn: () => getDashboardStats(queryParams),
    placeholderData: MOCK_DASHBOARD_DATA,
  });

  const data = dashboardData || MOCK_DASHBOARD_DATA;
  const rawData = data as any;
  const summary = data.summary || (data as any) || MOCK_DASHBOARD_DATA.summary;
  const branchSummary = data.branchSummary;

  // Preset Date Handlers for Admin
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

  // ─── Stat Cards List with Exact Screenshot Matching Layout ─────────────────
  const statCards: StatCardItem[] = useMemo(() => {
    const sum = summary || {};

    const cards: StatCardItem[] = [
      {
        key: "todayBookings",
        label: "Today's Booking",
        value: sum.todayBookings ?? 0,
        Icon: FileText,
        path: "/reports/booking",
      },
      {
        key: "todayDeliveries",
        label: "Today's Delivered",
        value: sum.todayDeliveries ?? 0,
        Icon: FileText,
        path: "/reports/delivery",
      },
      {
        key: "pendingDeliveries",
        label: "Pending Parcel Delivery",
        value: sum.pendingDeliveries ?? 0,
        Icon: FileText,
        path: "/reports/pending-delivery",
      },
      {
        key: "todayParcels",
        label: "Today's Parcel",
        value: sum.pendingParcels ?? 0,
        Icon: Boxes,
        path: "/reports/parcel-pending",
      },
    ];

    // Admin & SuperAdmin only payment & management cards
    if (isAdminOrSuperAdmin) {
      if (sum.pendingPayment !== undefined) {
        cards.push({
          key: "pendingPayment",
          label: "Pending Payment",
          value: sum.pendingPayment ?? 0,
          Icon: IndianRupee,
          path: "/reports/booking",
          isCurrency: true,
        });
      }

      if (sum.totalBranch !== undefined) {
        cards.push({
          key: "totalBranch",
          label: "Total Branch",
          value: sum.totalBranch ?? 0,
          Icon: Building2,
          path: "/master/branch",
        });
      }

      if (sum.branchUsers !== undefined) {
        cards.push({
          key: "branchUsers",
          label: "Branch Users",
          value: sum.branchUsers ?? 0,
          Icon: Users,
          path: "/master/staff",
        });
      }

      if (sum.totalCustomers !== undefined) {
        cards.push({
          key: "totalCustomers",
          label: "Total Customers",
          value: sum.totalCustomers ?? 0,
          Icon: UserCheck,
          path: "/master/customer",
        });
      }
    }

    // Common cards
    cards.push(
      {
        key: "totalBookings",
        label: "Total Booking",
        value: sum.totalBookings ?? 0,
        Icon: FileText,
        path: "/reports/booking",
      },
      {
        key: "totalDeliveries",
        label: "Total Delivered",
        value: sum.totalDeliveries ?? 0,
        Icon: PackageCheck,
        path: "/reports/delivery",
      },
      {
        key: "totalCancelled",
        label: "Cancel Booking",
        value: sum.totalCancelled ?? 0,
        Icon: Archive,
        path: "/reports/cancel-booking",
      }
    );

    if (isAdminOrSuperAdmin) {
      if (sum.totalServices !== undefined) {
        cards.push({
          key: "totalServices",
          label: "Total Services",
          value: sum.totalServices ?? 0,
          Icon: Archive,
          path: "/website-settings",
        });
      }

      if (sum.pendingMemo !== undefined) {
        cards.push({
          key: "pendingMemo",
          label: "Pending Memo",
          value: sum.pendingMemo ?? 0,
          Icon: Boxes,
          path: "/reports/memo",
        });
      }
    }

    // Branch specific metrics if branchSummary is present
    if (branchSummary && !isAdminOrSuperAdmin) {
      cards.push(
        {
          key: "branchTotalBookings",
          label: `${branchSummary.branchName || "Branch"} Total Bookings`,
          value: branchSummary.totalBookings ?? 0,
          Icon: Building2,
          path: "/reports/booking",
        },
        {
          key: "branchPending",
          label: `${branchSummary.branchName || "Branch"} Pending`,
          value: branchSummary.pending ?? 0,
          Icon: Boxes,
          path: "/reports/parcel-pending",
        }
      );
    }

    return cards;
  }, [summary, branchSummary, isAdminOrSuperAdmin]);

  return (
    <div className="space-y-6">
      {/* ─── Page Heading & Date Filter Bar ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
            Dashboard
          </h1>
        </div>

        {/* Date Filter: Visible ONLY for admin and superAdmin */}
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

            {/* Refresh Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 px-2.5 border-slate-300 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-none"
              title="Refresh dashboard data"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin text-[#2980b9]")} />
            </Button>
          </div>
        )}
      </div>

      {/* Error State */}
      {isError && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-[#e74c3c] text-sm">
          Failed to load dashboard stats. Showing cached data.
        </div>
      )}

      {/* ─── Stat Cards Grid (4 columns on large screens) ──────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((card) => (
              <StatCard
                key={card.key}
                card={card}
                onClick={() => router.push(card.path)}
              />
            ))}
      </div>
    </div>
  );
}
