"use client";

import React, { useState, useCallback, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Package,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  User,
  Phone,
  ArrowRight,
  RotateCcw,
  Loader2,
  Navigation,
  Building2,
  Hash,
  CalendarDays,
  CreditCard,
  FileText,
  Boxes,
  IndianRupee,
  Percent,
  Receipt,
  Truck,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import SimpleDataTable from "@/components/DataTable/SimpleDataTable";
import type { ColumnDef } from "@/lib/types/common";
import { getBookingById } from "@/lib/api/booking";
import { getStoredUser, getStoredUserRole } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

// ─── Journey Step Definitions ──────────────────────────────────────────────────
// 6 exact steps:
// 1. draft          - Draft
// 2. atOrigin       - Booked
// 3. inTruck        - In Transit
// 4. atBranch       - At Branch
// 5. atDestination  - Arrived
// 6. deliver        - Delivered

type JourneyStepKey = "draft" | "atOrigin" | "inTruck" | "atBranch" | "atDestination" | "deliver";

interface JourneyStepDef {
  key: JourneyStepKey;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  activeBg: string;
  step: number;
}

const JOURNEY_STEPS: JourneyStepDef[] = [
  {
    key: "draft",
    label: "Draft",
    icon: Clock,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-300",
    activeBg: "bg-slate-600",
    step: 1,
  },
  {
    key: "atOrigin",
    label: "Booked",
    icon: Package,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-300",
    activeBg: "bg-amber-500",
    step: 2,
  },
  {
    key: "inTruck",
    label: "In Transit",
    icon: Truck,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-300",
    activeBg: "bg-indigo-500",
    step: 3,
  },
  {
    key: "atBranch",
    label: "At Branch",
    icon: GitBranch,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-300",
    activeBg: "bg-purple-500",
    step: 4,
  },
  {
    key: "atDestination",
    label: "Arrived",
    icon: Building2,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-300",
    activeBg: "bg-cyan-500",
    step: 5,
  },
  {
    key: "deliver",
    label: "Delivered",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    activeBg: "bg-emerald-500",
    step: 6,
  },
];

// Exact key match for history types
const HISTORY_TYPE_TO_STEP: Record<string, JourneyStepKey> = {
  draft: "draft",
  atOrigin: "atOrigin",
  inTruck: "inTruck",
  atBranch: "atBranch",
  atDestination: "atDestination",
  deliver: "deliver",
  delivered: "deliver",
};

function normalizeHistoryType(type: string): JourneyStepKey | null {
  return HISTORY_TYPE_TO_STEP[type] ?? null;
}

const STATUS_TO_STEP: Record<string, number> = {
  draft: 1,
  confirmed: 2,
  atOrigin: 2,
  booked: 2,
  loaded: 3,
  inTruck: 3,
  in_transit: 3,
  intransit: 3,
  atBranch: 4,
  at_branch: 4,
  arrived_at_destination: 5,
  arrived: 5,
  atDestination: 5,
  deliver: 6,
  delivered: 6,
  cancelled: 0,
};

// Count pieces at their CURRENT (last history) step location
function getPieceCounts(pieces: any[]): Record<JourneyStepKey, number> {
  const counts: Record<JourneyStepKey, number> = {
    draft: 0,
    atOrigin: 0,
    inTruck: 0,
    atBranch: 0,
    atDestination: 0,
    deliver: 0,
  };
  if (!Array.isArray(pieces) || pieces.length === 0) return counts;

  for (const piece of pieces) {
    const history: { type: string }[] = piece.history || [];
    const lastEntry = history.length > 0 ? history[history.length - 1] : null;
    const lastType = lastEntry?.type || piece.status || "draft";
    const stepKey = HISTORY_TYPE_TO_STEP[lastType] || "draft";
    if (stepKey && counts[stepKey] !== undefined) {
      counts[stepKey]++;
    }
  }
  return counts;
}

// Current step from piece history (most advanced step seen across all pieces)
function getCurrentStep(tracking: any, bookingStatus: string): number {
  if (!tracking) {
    const key = (bookingStatus || "").toLowerCase().replace(/[\s-]+/g, "_");
    return STATUS_TO_STEP[key] ?? 2;
  }
  let maxStep = 0;
  for (const piece of tracking.pieces || []) {
    for (const h of piece.history || []) {
      const key = normalizeHistoryType(h.type || "");
      if (key) {
        const stepNum = JOURNEY_STEPS.find((s) => s.key === key)?.step ?? 0;
        if (stepNum > maxStep) maxStep = stepNum;
      }
    }
  }
  if (maxStep === 0) {
    const key = (bookingStatus || "").toLowerCase().replace(/[\s-]+/g, "_");
    maxStep = STATUS_TO_STEP[key] ?? 2;
  }
  return maxStep;
}

// Overall status badge
const STATUS_BADGE: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string; icon: React.ElementType }
> = {
  draft: { label: "Draft", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-400", icon: Clock },
  confirmed: { label: "Confirmed", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500", icon: CheckCircle2 },
  loaded: { label: "Loaded", color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", dot: "bg-indigo-500", icon: Truck },
  in_transit: { label: "In Transit", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500", icon: Navigation },
  arrived_at_destination: { label: "Arrived", color: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200", dot: "bg-cyan-500", icon: Building2 },
  delivered: { label: "Delivered", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", icon: XCircle },
};

function getStatusBadge(status: string | undefined) {
  if (!status) return STATUS_BADGE.confirmed;
  const key = status.toLowerCase().replace(/[\s-]+/g, "_");
  return STATUS_BADGE[key] || STATUS_BADGE.confirmed;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function fmt(val?: number | null) {
  if (val === undefined || val === null) return "—";
  return `₹${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizeBranch(b: any) {
  if (!b) return null;
  return {
    name: b.branchInfo?.branchName || b.name || "",
    code: b.branchInfo?.branchCode || b.code || "",
    city: b.branchInfo?.city || b.city || "",
    id: b._id || "",
  };
}

// Mask mobile: show first 2 + last 2, mask middle
function maskMobile(mobile: string | undefined): string {
  if (!mobile) return "—";
  const m = mobile.replace(/\D/g, "");
  if (m.length <= 4) return m;
  return m.slice(0, 2) + "*".repeat(Math.max(0, m.length - 4)) + m.slice(-2);
}

// Format history trail line: DD/MM/YYYY HH:mm:ss - Location/User - Action
function formatHistoryLine(h: any): string {
  const parts: string[] = [];

  if (h.createdAt) {
    const d = new Date(h.createdAt);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      const secs = String(d.getSeconds()).padStart(2, "0");
      parts.push(`${day}/${month}/${year} ${hours}:${mins}:${secs}`);
    }
  }

  const actor = h.branchName || h.user || h.userName;
  if (actor) {
    parts.push(actor);
  }

  if (h.remark) {
    parts.push(h.remark);
  } else if (h.truckNumber) {
    parts.push(`Loaded on truck ${h.truckNumber}`);
  } else if (h.type) {
    const meta = HISTORY_META[h.type];
    parts.push(meta?.label || h.type);
  }

  return parts.join(" - ");
}

// ─── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | number | null;
  highlight?: boolean;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-slate-100 last:border-b-0">
      <Icon className="w-4 h-4 text-black mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-extrabold text-black uppercase leading-none mb-1">{label}</p>
        <p className="text-sm font-medium text-slate-900 leading-snug break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Journey Stepper ───────────────────────────────────────────────────────────
function TrackingTimeline({
  currentStep,
  pieceCounts,
}: {
  currentStep: number;
  pieceCounts: Record<JourneyStepKey, number>;
}) {
  const totalSteps = JOURNEY_STEPS.length;
  // Progress line width between step 1 center and step 6 center
  const progressPercent = Math.max(
    0,
    Math.min(100, ((currentStep - 1) / (totalSteps - 1)) * 100)
  );

  return (
    <div className="w-full py-1">
      <div className="relative flex items-center justify-between w-full">
        {/* Background track connecting circle 1 center to circle 6 center */}
        <div
          className="absolute top-5 h-0.5 bg-slate-200"
          style={{
            left: `calc(100% / (${totalSteps} * 2))`,
            right: `calc(100% / (${totalSteps} * 2))`,
            zIndex: 0,
          }}
        >
          {/* Active filled line based on current status */}
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {JOURNEY_STEPS.map((step) => {
          const isDone = currentStep > step.step;
          const isActive = currentStep === step.step;
          const Icon = step.icon;
          const count = pieceCounts[step.key] ?? 0;

          return (
            <div
              key={step.key}
              className="relative flex flex-col items-center flex-1"
              style={{ zIndex: 1 }}
            >
              {/* Circle */}
              <div
                className={cn(
                  "relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isDone
                    ? "bg-emerald-500 border-emerald-400 text-white"
                    : isActive
                    ? cn(step.activeBg, "border-white ring-2 ring-offset-1 text-white shadow-md", step.border)
                    : "bg-white border-slate-200 text-slate-300"
                )}
                style={{ zIndex: 2 }}
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>

              {/* Label only */}
              <p
                className={cn(
                  "text-[10px] sm:text-[11px] font-bold text-center leading-tight mt-1.5",
                  isDone ? "text-emerald-600" : isActive ? step.color : "text-slate-400"
                )}
              >
                {step.label}
              </p>

              {/* Piece count badge (only current count at this step) */}
              <div
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs sm:text-[13px] font-bold border mt-1.5 shadow-2xs transition-all",
                  count > 0
                    ? isDone
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : isActive
                      ? cn(step.bg, step.color, step.border)
                      : "bg-blue-50 text-[#2980b9] border-blue-300"
                    : "bg-slate-50 text-slate-400 border-slate-200"
                )}
              >
                <Package size={12} className="shrink-0" />
                <span className="font-mono leading-none">{count}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── History Meta ─────────────────────────────────────────────────────────────
const HISTORY_META: Record<string, { label: string; colorClass: string }> = {
  draft: { label: "Draft", colorClass: "text-slate-700 bg-slate-100 border-slate-200" },
  atOrigin: { label: "Booked", colorClass: "text-amber-700 bg-amber-50 border-amber-200" },
  inTruck: { label: "In Transit", colorClass: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  atBranch: { label: "At Branch", colorClass: "text-purple-700 bg-purple-50 border-purple-200" },
  atDestination: { label: "Arrived", colorClass: "text-cyan-700 bg-cyan-50 border-cyan-200" },
  deliver: { label: "Delivered", colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  delivered: { label: "Delivered", colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200" },
};

// ─── Main Content Component ───────────────────────────────────────────────────
function TrackingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlParam = searchParams.get("q") || searchParams.get("query") || searchParams.get("docketNo") || searchParams.get("trackingNo") || "";

  const [inputValue, setInputValue] = useState(urlParam);
  const [searchQuery, setSearchQuery] = useState(urlParam);
  const [hasSearched, setHasSearched] = useState(Boolean(urlParam.trim()));

  // Sync with URL parameter (e.g. redirected from global header search)
  useEffect(() => {
    if (urlParam && urlParam.trim() !== searchQuery) {
      const q = urlParam.trim();
      setInputValue(q);
      setSearchQuery(q);
      setHasSearched(true);
    }
  }, [urlParam]);

  // Current user for masking logic
  const currentUser = getStoredUser();
  const currentRole = (getStoredUserRole() || currentUser?.role || "").toLowerCase();
  const isPrivileged = currentRole === "admin" || currentRole === "superadmin" || currentRole === "super_admin";

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["tracking", searchQuery],
    queryFn: () => getBookingById(searchQuery),
    enabled: Boolean(searchQuery && searchQuery.trim()),
    retry: false,
    staleTime: 1000 * 30,
  });

  const handleSearch = useCallback(() => {
    const q = inputValue.trim();
    if (!q) return;
    setHasSearched(true);
    setSearchQuery(q);
    router.replace(`/tracking?q=${encodeURIComponent(q)}`);
  }, [inputValue, router]);

  const handleReset = () => {
    setInputValue("");
    setSearchQuery("");
    setHasSearched(false);
    router.replace("/tracking");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  // ── Normalize API Response ────────────────────────────────────────────────
  const rawBooking = data?.booking || data;
  const tracking = data?.tracking || null;

  const fromBranch = normalizeBranch(rawBooking?.fromBranchId);
  const toBranch = normalizeBranch(rawBooking?.toBranchId);

  // Is current user the from/to branch?
  const currentUserId = currentUser?._id || currentUser?.id || "";
  const isBranchUser = currentRole === "branch" && (
    currentUserId === fromBranch?.id || currentUserId === toBranch?.id
  );
  const canSeeFullMobile = isPrivileged || isBranchUser;

  const booking = rawBooking
    ? {
        ...rawBooking,
        fromBranch,
        toBranch,
        sender: rawBooking.sender
          ? {
              ...rawBooking.sender,
              gstin: rawBooking.sender.gst || rawBooking.sender.gstin,
              contact_no: rawBooking.sender.mobile || rawBooking.sender.contact_no,
            }
          : null,
        receiver: rawBooking.receiver
          ? {
              ...rawBooking.receiver,
              gstin: rawBooking.receiver.gst || rawBooking.receiver.gstin,
              contact_no: rawBooking.receiver.mobile || rawBooking.receiver.contact_no,
            }
          : null,
      }
    : null;

  const status = booking?.status || "confirmed";
  const badge = getStatusBadge(status);

  const isCancelled = status.toLowerCase() === "cancelled";
  const isDelivered = status.toLowerCase() === "delivered";

  const hasData = hasSearched && !isLoading && !isFetching && booking;
  const notFound = hasSearched && !isLoading && !isFetching && (!data || error);

  const currentStep = getCurrentStep(tracking, status);
  const pieces: any[] = tracking?.pieces || [];
  const pieceCounts = getPieceCounts(pieces);
  const totalPieces = tracking?.totalPieces || pieces.length || 0;

  const paymentMethodDisplay = (() => {
    const pm = (booking?.paymentMethod || "").toLowerCase();
    if (pm.includes("to") && pm.includes("pay")) return "To Pay";
    if (pm === "paid") return "Paid";
    if (pm.includes("gpay") || pm.includes("g pay") || pm.includes("g-pay")) return "G-Pay";
    if (pm === "credit") return "Credit";
    return booking?.paymentMethod || "—";
  })();

  const totalQty = Array.isArray(booking?.items)
    ? booking.items.reduce((s: number, i: any) => s + Number(i.parcel || i.qty || 0), 0)
    : booking?.parcel || null;

  // ─── Piece History Table Columns (Using SimpleDataTable) ───────────────────
  const pieceColumns: ColumnDef<any>[] = useMemo(
    () => [
      {
        key: "barcode",
        label: "Piece Barcode(s)",
        width: "w-44 sm:w-56",
        render: (_: any, piece: any) => {
          const barcode =
            piece.pieceNumbers?.[0] ||
            piece.pieceNumber?.[0] ||
            piece.pieceNumber ||
            "—";
          return (
            <span className="font-semibold text-slate-900 font-mono text-xs">
              {barcode}
            </span>
          );
        },
      },
      {
        key: "currentStatus",
        label: "Current Status",
        width: "w-36",
        render: (_: any, piece: any) => {
          const history = piece.history || [];
          const lastEntry = history.length > 0 ? history[history.length - 1] : null;
          const lastType = lastEntry?.type || piece.status || "draft";
          const meta = HISTORY_META[lastType];
          return (
            <span className="font-semibold text-slate-800 text-xs">
              {meta?.label || (lastType === "deliver" || lastType === "delivered" ? "Delivered" : lastType)}
            </span>
          );
        },
      },
      {
        key: "historyTrail",
        label: "Complete History Trail",
        render: (_: any, piece: any) => {
          const history = piece.history || [];
          if (!history.length) {
            return <span className="text-slate-400 italic text-xs">No history recorded</span>;
          }
          return (
            <div className="space-y-1 py-0.5 text-xs text-slate-800">
              {history.map((h: any, idx: number) => (
                <div key={idx} className="leading-relaxed">
                  {formatHistoryLine(h)}
                </div>
              ))}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="w-full space-y-2 pb-8">
      {/* ─── Header: Title+Badges (left) | Search (right) ─────────────── */}
      <div className="bg-white rounded border border-slate-200/80 shadow-2xs px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded bg-[#2980b9]/10 text-[#2980b9] flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-black tracking-tight leading-tight whitespace-nowrap">
                  Parcel Tracking
                </h1>
                {hasData && booking?.docketNo1 && (
                  <div className="flex items-center gap-1 bg-slate-100 border border-slate-300 rounded px-2 py-0.5">
                    <Hash className="w-3 h-3 text-black" />
                    <span className="text-[10px] font-extrabold text-black">DOCKET:</span>
                    <span className="text-xs font-bold text-black font-mono ml-0.5">{booking.docketNo1}</span>
                  </div>
                )}
                {hasData && booking?.docketNo2 && (
                  <div className="flex items-center gap-1 bg-slate-100 border border-slate-300 rounded px-2 py-0.5">
                    <Hash className="w-3 h-3 text-black" />
                    <span className="text-[10px] font-extrabold text-black">TRACKING:</span>
                    <span className="text-xs font-bold text-black font-mono ml-0.5">{booking.docketNo2}</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] font-medium text-slate-500 leading-tight mt-0.5 hidden sm:block">
                Enter Tracking No or Docket No to search and verify parcel.
              </p>
            </div>
          </div>

          {/* Right: search */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-44 sm:w-60">
              <FormInput
                label=""
                placeholder="Docket / Tracking No..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.trim())}
                onKeyDown={handleKeyDown}
                className="h-8"
              />
            </div>
            <Button
              type="button"
              onClick={handleSearch}
              disabled={!inputValue.trim() || isLoading || isFetching}
              className="h-8 px-3 bg-[#2980b9] hover:bg-[#2471a3] text-white text-xs font-semibold cursor-pointer shrink-0"
            >
              {isLoading || isFetching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Search className="w-3.5 h-3.5 mr-1" />
                  Search
                </>
              )}
            </Button>
            {hasSearched && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                title="Clear"
                className="h-8 w-8 p-0 border-slate-300 text-slate-500 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Loading ─────────────────────────────────────────────────────── */}
      {(isLoading || isFetching) && (
        <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-10 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#2980b9]" />
          <p className="text-sm font-semibold text-slate-500">Fetching parcel details...</p>
        </div>
      )}

      {/* ─── Not Found ───────────────────────────────────────────────────── */}
      {notFound && (
        <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-10 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">No parcel found</p>
            <p className="text-xs text-slate-500 mt-1">
              No parcel found for <span className="font-semibold text-slate-700">"{searchQuery}"</span>.
            </p>
          </div>
        </div>
      )}

      {/* ─── Results ─────────────────────────────────────────────────────── */}
      {hasData && (
        <div className="space-y-2">
          {/* ── Shipment Journey ──────────────────────────────────────────── */}
          <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3">


            {isCancelled ? (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded">
                <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-700">Booking Cancelled</p>
                  {booking?.cancelReason && <p className="text-xs text-red-600 mt-0.5">{booking.cancelReason}</p>}
                  {booking?.cancelRemark && <p className="text-xs text-slate-500 mt-0.5">{booking.cancelRemark}</p>}
                </div>
              </div>
            ) : (
              <>
                <TrackingTimeline currentStep={currentStep} pieceCounts={pieceCounts} />

                {/* Delivered info */}
                {isDelivered && booking?.deliveryInfo?.receiverName && (
                  <div className="mt-4 pt-3 border-t border-slate-200 bg-slate-50/80 rounded p-3">
                    <p className="text-sm font-extrabold text-black uppercase tracking-wider mb-2">Delivery Details</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-xs font-extrabold text-black uppercase mb-0.5">Received By</p>
                        <p className="text-sm font-medium text-slate-900">{booking.deliveryInfo.receiverName}</p>
                      </div>
                      {booking.deliveryInfo.receiverMobile && (
                        <div>
                          <p className="text-xs font-extrabold text-black uppercase mb-0.5">Mobile</p>
                          <p className="text-sm font-medium text-slate-900">{booking.deliveryInfo.receiverMobile}</p>
                        </div>
                      )}
                      {booking.deliveryInfo.deliveredAt && (
                        <div>
                          <p className="text-xs font-extrabold text-black uppercase mb-0.5">Delivered At</p>
                          <p className="text-sm font-medium text-slate-900">{formatDate(booking.deliveryInfo.deliveredAt)}</p>
                        </div>
                      )}
                      {booking.deliveryInfo.deliveryRemark && (
                        <div className="col-span-2 sm:col-span-4">
                          <p className="text-xs font-extrabold text-black uppercase mb-0.5">Remark</p>
                          <p className="text-sm font-medium text-slate-900">{booking.deliveryInfo.deliveryRemark}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Route ─────────────────────────────────────────────────────── */}
          <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3">
            <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-black" />
              <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">Route</h3>
              {booking?.deliveryInfo?.deliveryType && (
                <span className="ml-auto text-xs font-bold text-black uppercase bg-slate-100 border border-slate-300 rounded px-2 py-0.5">
                  {booking.deliveryInfo.deliveryType}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* From */}
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-2">
                <p className="text-xs font-extrabold text-black uppercase mb-1">From</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <p className="text-base font-semibold text-slate-900 leading-tight">{booking?.fromBranch?.name || "—"}</p>
                  {booking?.fromBranch?.code && (
                    <span className="text-xs font-mono font-medium text-slate-700">[{booking.fromBranch.code}]</span>
                  )}
                </div>
                {booking?.fromBranch?.city && (
                  <p className="text-xs font-normal text-slate-600 mt-0.5">{booking.fromBranch.city}</p>
                )}
              </div>

              <div className="flex flex-col items-center gap-0.5 shrink-0 text-black">
                <Truck className="w-4 h-4 text-black" />
                <ArrowRight className="w-3.5 h-3.5 text-black" />
              </div>

              {/* To */}
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-2">
                <p className="text-xs font-extrabold text-black uppercase mb-1">To</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <p className="text-base font-semibold text-slate-900 leading-tight">{booking?.toBranch?.name || "—"}</p>
                  {booking?.toBranch?.code && (
                    <span className="text-xs font-mono font-medium text-slate-700">[{booking.toBranch.code}]</span>
                  )}
                </div>
                {booking?.toBranch?.city && (
                  <p className="text-xs font-normal text-slate-600 mt-0.5">{booking.toBranch.city}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Sender & Receiver ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3">
              <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-slate-100">
                <User className="w-4 h-4 text-black" />
                <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">Sender</h3>
              </div>
              <InfoRow icon={User} label="Name" value={booking?.sender?.name} />
              <InfoRow
                icon={Phone}
                label="Mobile"
                value={canSeeFullMobile ? booking?.sender?.contact_no : maskMobile(booking?.sender?.contact_no)}
              />
              <InfoRow icon={MapPin} label="City" value={booking?.sender?.city} />
              <InfoRow icon={MapPin} label="Address" value={booking?.sender?.address} />
              <InfoRow icon={FileText} label="GSTIN" value={booking?.sender?.gstin} />
            </div>
            <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3">
              <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-slate-100">
                <User className="w-4 h-4 text-black" />
                <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">Receiver</h3>
              </div>
              <InfoRow icon={User} label="Name" value={booking?.receiver?.name} />
              <InfoRow
                icon={Phone}
                label="Mobile"
                value={canSeeFullMobile ? booking?.receiver?.contact_no : maskMobile(booking?.receiver?.contact_no)}
              />
              <InfoRow icon={MapPin} label="City" value={booking?.receiver?.city} />
              <InfoRow icon={MapPin} label="Address" value={booking?.receiver?.address} />
              <InfoRow icon={FileText} label="GSTIN" value={booking?.receiver?.gstin} />
            </div>
          </div>

          {/* ── Payment Details ───────────────────────────────────────────── */}
          <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3">
            <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-slate-100">
              <IndianRupee className="w-4 h-4 text-black" />
              <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">Payment Details</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1">
              <div className="py-2 flex items-start gap-2.5">
                <CreditCard className="w-4 h-4 text-black mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-extrabold text-black uppercase leading-none mb-1">Payment Method</p>
                  <p className="text-sm font-medium text-slate-900">{paymentMethodDisplay}</p>
                </div>
              </div>
              <div className="py-2 flex items-start gap-2.5">
                <Receipt className="w-4 h-4 text-black mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-extrabold text-black uppercase leading-none mb-1">Bill</p>
                  <p className="text-sm font-medium text-slate-900">
                    {booking?.hasBill ? booking?.billNo || "Yes" : "Without Bill"}
                  </p>
                </div>
              </div>
              {booking?.biltyCharge !== undefined && booking?.biltyCharge !== null && (
                <div className="py-2 flex items-start gap-2.5">
                  <IndianRupee className="w-4 h-4 text-black mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold text-black uppercase leading-none mb-1">Bilty Charge</p>
                    <p className="text-sm font-medium text-slate-900">{fmt(booking.biltyCharge)}</p>
                  </div>
                </div>
              )}
              {!!booking?.hamaliCost && (
                <div className="py-2 flex items-start gap-2.5">
                  <IndianRupee className="w-4 h-4 text-black mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold text-black uppercase leading-none mb-1">Hamali</p>
                    <p className="text-sm font-medium text-slate-900">{fmt(booking.hamaliCost)}</p>
                  </div>
                </div>
              )}
              {!!booking?.pickupCharge && (
                <div className="py-2 flex items-start gap-2.5">
                  <IndianRupee className="w-4 h-4 text-black mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold text-black uppercase leading-none mb-1">Pickup</p>
                    <p className="text-sm font-medium text-slate-900">{fmt(booking.pickupCharge)}</p>
                  </div>
                </div>
              )}
              {!!booking?.deliveryCharge && (
                <div className="py-2 flex items-start gap-2.5">
                  <IndianRupee className="w-4 h-4 text-black mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold text-black uppercase leading-none mb-1">Delivery</p>
                    <p className="text-sm font-medium text-slate-900">{fmt(booking.deliveryCharge)}</p>
                  </div>
                </div>
              )}
              {!!booking?.discount && (
                <div className="py-2 flex items-start gap-2.5">
                  <Percent className="w-4 h-4 text-black mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold text-black uppercase leading-none mb-1">Discount</p>
                    <p className="text-sm font-medium text-slate-900">-{fmt(booking.discount)}</p>
                  </div>
                </div>
              )}
              {booking?.finalBillAmount !== undefined && booking?.finalBillAmount !== null && (
                <div className="py-2 flex items-start gap-2.5">
                  <IndianRupee className="w-4 h-4 text-black mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold text-black uppercase leading-none mb-1">Final Amount</p>
                    <p className="text-sm font-bold text-black">{fmt(booking.finalBillAmount)}</p>
                  </div>
                </div>
              )}
              {booking?.bookingById?.name && (
                <div className="py-2 flex items-start gap-2.5">
                  <User className="w-4 h-4 text-black mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold text-black uppercase leading-none mb-1">Booked By</p>
                    <p className="text-sm font-medium text-slate-900">{booking.bookingById.name}</p>
                    {booking.bookingById.role && (
                      <p className="text-xs font-normal text-slate-600 capitalize">{booking.bookingById.role}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Package Items ─────────────────────────────────────────────── */}
          {Array.isArray(booking?.items) && booking.items.length > 0 && (
            <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3">
              <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-slate-100">
                <Boxes className="w-4 h-4 text-black" />
                <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">Package Details</h3>
                {totalQty && (
                  <span className="ml-auto text-xs font-bold text-black">
                    Total: <strong>{totalQty}</strong> pcs
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-xs font-extrabold text-black uppercase border-b border-slate-300">
                      <th className="py-2 px-2.5 text-left border-r border-slate-300 w-10">#</th>
                      <th className="py-2 px-2.5 text-left border-r border-slate-300">Material</th>
                      <th className="py-2 px-2.5 text-left border-r border-slate-300">Packing</th>
                      <th className="py-2 px-2.5 text-center border-r border-slate-300">Price Type</th>
                      <th className="py-2 px-2.5 text-right border-r border-slate-300 w-16">Qty</th>
                      <th className="py-2 px-2.5 text-right border-r border-slate-300 w-20">Rate</th>
                      <th className="py-2 px-2.5 text-right w-20">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {booking.items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-2.5 border-r border-slate-200 text-center font-mono text-slate-700 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2.5 border-r border-slate-200 text-slate-900 font-medium">
                          {item.material || "—"}
                        </td>
                        <td className="py-2 px-2.5 border-r border-slate-200 text-slate-800 font-medium">{item.packing || "—"}</td>
                        <td className="py-2 px-2.5 border-r border-slate-200 text-center text-slate-700 font-medium capitalize">
                          {item.priceType || "—"}
                        </td>
                        <td className="py-2 px-2.5 border-r border-slate-200 text-right font-semibold font-mono text-black">
                          {item.parcel || item.qty || 0}
                        </td>
                        <td className="py-2 px-2.5 border-r border-slate-200 text-right font-mono font-medium text-slate-900">
                          {item.rate != null ? fmt(item.rate) : "—"}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-semibold text-black">
                          {(item.amount ?? item.price) != null ? fmt(item.amount ?? item.price) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Piece-wise Tracking History (Common SimpleDataTable Component) ─ */}
          {pieces.length > 0 && (
            <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3">
              <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-slate-100">
                <Navigation className="w-4 h-4 text-black" />
                <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">
                  Piece-wise Tracking History
                </h3>
                <span className="ml-auto text-[11px] font-medium text-slate-500">
                  {pieces.length} {pieces.length === 1 ? "piece" : "pieces"}
                </span>
              </div>

              <SimpleDataTable
                columns={pieceColumns}
                data={pieces}
                showSrNo={true}
                srNoLabel="#"
                emptyMessage="No piece tracking history available."
              />
            </div>
          )}

          {/* ── Remark ────────────────────────────────────────────────────── */}
          {booking?.remark && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">Remark</p>
                <p className="text-xs text-amber-800">{booking.remark}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Idle State ───────────────────────────────────────────────────── */}
      {!hasSearched && (
        <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#2980b9]/10 flex items-center justify-center">
            <Package className="w-8 h-8 text-[#2980b9]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">Track a Parcel</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Enter a Docket No or Tracking No in the search bar above to view real-time shipment status.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center items-center">
            {["Draft", "Booked", "In Transit", "At Branch", "Arrived", "Delivered"].map((s, i, arr) => (
              <React.Fragment key={s}>
                <span className="text-[11px] font-semibold text-slate-500">{s}</span>
                {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Export with Suspense boundary ─────────────────────────────────────────────
export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-10 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#2980b9]" />
          <p className="text-sm font-semibold text-slate-500">Loading tracking module...</p>
        </div>
      }
    >
      <TrackingPageContent />
    </Suspense>
  );
}