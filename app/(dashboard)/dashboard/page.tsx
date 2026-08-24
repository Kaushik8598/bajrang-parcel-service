"use client";

import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  PackageCheck,
  Package,
  PackagePlus,
  IndianRupee,
  Building2,
  Users,
  UserCheck,
  Wrench,
  XCircle,
  ScrollText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardStats, MOCK_DASHBOARD_STATS } from "@/lib/api/dashboard";
import { formatCurrency } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types/common";

// ─── Stat card config ─────────────────────────────────────────────────────────
interface StatCard {
  key: keyof DashboardStats;
  label: string;
  Icon: React.ElementType;
  isCurrency?: boolean;
}

const STAT_CARDS: StatCard[] = [
  { key: "today_booking",            label: "Today's Booking",         Icon: FileText },
  { key: "today_delivered",          label: "Today's Delivered",        Icon: PackageCheck },
  { key: "pending_parcel_delivery",  label: "Pending Parcel Delivery",  Icon: Package },
  { key: "today_parcel",             label: "Today's Parcel",           Icon: PackagePlus },
  { key: "pending_payment",          label: "Pending Payment",          Icon: IndianRupee, isCurrency: true },
  { key: "total_branch",             label: "Total Branch",             Icon: Building2 },
  { key: "branch_users",             label: "Branch Users",             Icon: Users },
  { key: "total_customers",          label: "Total Customers",          Icon: UserCheck },
  { key: "total_services",           label: "Total Services",           Icon: Wrench },
  { key: "cancel_booking",           label: "Cancel Booking",           Icon: XCircle },
  { key: "pending_memo",             label: "Pending Memo",             Icon: ScrollText },
];

// ─── Individual stat card ─────────────────────────────────────────────────────
function StatCard({
  card,
  value,
}: {
  card: StatCard;
  value: number;
}) {
  const { Icon, label, isCurrency } = card;
  const displayValue = isCurrency ? formatCurrency(value) : value.toLocaleString("en-IN");

  return (
    <div
      id={`stat-card-${card.key}`}
      className="group relative bg-[#b2dfdb] rounded-xl border border-[#80cbc4] p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-lg hover:shadow-teal-200/60 hover:-translate-y-0.5 cursor-default overflow-hidden"
    >
      {/* Subtle inner glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />

      <div className="relative flex items-start gap-3">
        <div className="p-2 bg-white/40 rounded-lg">
          <Icon className="w-7 h-7 text-[#2c3e50]" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-bold text-[#1a252f] leading-tight truncate">
            {displayValue}
          </p>
          <p className="text-sm font-medium text-[#34495e] mt-0.5 leading-snug">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="bg-[#e8f5e9] rounded-xl border border-slate-200 p-5">
      <Skeleton className="h-7 w-24 mb-2" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    // Use mock data as placeholder while API is not ready
    placeholderData: MOCK_DASHBOARD_STATS,
  });

  const displayStats = stats ?? MOCK_DASHBOARD_STATS;

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2c3e50]">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Overview of your parcel service operations
        </p>
      </div>

      {/* Stats grid */}
      {isError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-[#e74c3c] text-sm">
          Failed to load dashboard stats. Showing cached data.
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? STAT_CARDS.map((c) => <StatCardSkeleton key={c.key} />)
          : STAT_CARDS.map((card) => (
              <StatCard key={card.key} card={card} value={displayStats[card.key]} />
            ))}
      </div>
    </div>
  );
}
