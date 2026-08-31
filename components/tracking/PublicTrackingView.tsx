"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Boxes,
  IndianRupee,
  Truck,
  GitBranch,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import SimpleDataTable from "@/components/DataTable/SimpleDataTable";
import type { ColumnDef } from "@/lib/types/common";
import { getPublicTrack } from "@/lib/api/booking";
import { cn } from "@/lib/utils";

// ─── Journey Step Definitions (6 Exact Steps) ───────────────────────────────────
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
function getCurrentStep(pieces: any[], bookingStatus: string): number {
  if (!Array.isArray(pieces) || pieces.length === 0) {
    const key = (bookingStatus || "").toLowerCase().replace(/[\s-]+/g, "_");
    return STATUS_TO_STEP[key] ?? 2;
  }
  let maxStep = 0;
  for (const piece of pieces) {
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

function fmt(val?: number | null) {
  if (val === undefined || val === null) return "—";
  return `₹${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatBranchAddress(addr: any): string {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  const parts = [addr.address1, addr.address2, addr.city, addr.state, addr.pincode].filter(Boolean);
  return parts.join(", ");
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

  const actor = h.branchName || h.actionByName || h.user || h.userName;
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
          {/* Active filled line */}
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

              {/* Label */}
              <p
                className={cn(
                  "text-[10px] sm:text-[11px] font-bold text-center leading-tight mt-1.5",
                  isDone ? "text-emerald-600" : isActive ? step.color : "text-slate-400"
                )}
              >
                {step.label}
              </p>

              {/* Piece count badge */}
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

// ─── Main Public Tracking Component ───────────────────────────────────────────
export interface PublicTrackingViewProps {
  initialTrackingId?: string;
}

export default function PublicTrackingView({ initialTrackingId = "" }: PublicTrackingViewProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(initialTrackingId);
  const [searchQuery, setSearchQuery] = useState(initialTrackingId);
  const [hasSearched, setHasSearched] = useState(Boolean(initialTrackingId.trim()));

  useEffect(() => {
    if (initialTrackingId && initialTrackingId.trim() !== searchQuery) {
      const q = initialTrackingId.trim();
      setInputValue(q);
      setSearchQuery(q);
      setHasSearched(true);
    }
  }, [initialTrackingId]);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["public-track", searchQuery],
    queryFn: () => getPublicTrack(searchQuery),
    enabled: Boolean(searchQuery && searchQuery.trim()),
    retry: false,
    staleTime: 1000 * 30,
  });

  const handleSearch = useCallback(() => {
    const q = inputValue.trim();
    if (!q) return;
    setHasSearched(true);
    setSearchQuery(q);
    router.push(`/track/${encodeURIComponent(q)}`);
  }, [inputValue, router]);

  const handleReset = () => {
    setInputValue("");
    setSearchQuery("");
    setHasSearched(false);
    router.push("/track");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  // Extract public payload
  const trackData = data?.data || data;
  const status = trackData?.status || "confirmed";

  const isCancelled = status.toLowerCase() === "cancelled";
  const isDelivered = status.toLowerCase() === "delivered";

  const hasData = hasSearched && !isLoading && !isFetching && trackData && trackData.docketNo1;
  const notFound = hasSearched && !isLoading && !isFetching && (!data || error || !trackData || !trackData.docketNo1);

  const pieces: any[] = trackData?.pieces || [];
  const currentStep = getCurrentStep(pieces, status);
  const pieceCounts = getPieceCounts(pieces);
  const totalPieces = trackData?.totalPieces || pieces.length || 0;

  // Piece table columns
  const pieceColumns: ColumnDef<any>[] = useMemo(
    () => [
      {
        key: "barcode",
        label: "Piece Barcode(s)",
        width: "w-44 sm:w-56",
        render: (_: any, piece: any) => {
          const barcode = piece.pieceNumber || piece.pieceNumbers?.[0] || "—";
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
    <div className="min-h-screen bg-slate-100/70 text-slate-900">
      {/* ─── Top Brand Header ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200/90 shadow-xs">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#2980b9] text-white flex items-center justify-center font-black text-sm shadow-xs">
              B
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-black leading-tight tracking-tight">
                BAJRANG ROAD LINES
              </h2>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                Parcel Service & Logistics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded px-2.5 py-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Public Tracking</span>
          </div>
        </div>
      </header>

      {/* ─── Main Container ───────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-3">
        {/* ─── Search Bar & Result Docket Header ──────────────────────────── */}
        <div className="bg-white rounded border border-slate-200/80 shadow-2xs px-3 sm:px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left title / badges */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded bg-[#2980b9]/10 text-[#2980b9] flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base sm:text-lg font-extrabold text-black tracking-tight leading-tight whitespace-nowrap">
                    Track Your Parcel
                  </h1>
                  {hasData && trackData?.docketNo1 && (
                    <div className="flex items-center gap-1 bg-slate-100 border border-slate-300 rounded px-2 py-0.5">
                      <Hash className="w-3 h-3 text-black" />
                      <span className="text-[10px] font-extrabold text-black">DOCKET:</span>
                      <span className="text-xs font-bold text-black font-mono ml-0.5">{trackData.docketNo1}</span>
                    </div>
                  )}
                  {hasData && trackData?.docketNo2 && (
                    <div className="flex items-center gap-1 bg-slate-100 border border-slate-300 rounded px-2 py-0.5">
                      <Hash className="w-3 h-3 text-black" />
                      <span className="text-[10px] font-extrabold text-black">TRACKING:</span>
                      <span className="text-xs font-bold text-black font-mono ml-0.5">{trackData.docketNo2}</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] font-medium text-slate-500 leading-tight mt-0.5 hidden sm:block">
                  Enter Docket No or Tracking No to view live shipment journey & details.
                </p>
              </div>
            </div>

            {/* Right Search Input */}
            <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
              <div className="flex-1 sm:w-64">
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
                className="h-8 px-3.5 bg-[#2980b9] hover:bg-[#2471a3] text-white text-xs font-semibold cursor-pointer shrink-0"
              >
                {isLoading || isFetching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5 mr-1" />
                    Track
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

        {/* ─── Loading State ──────────────────────────────────────────────── */}
        {(isLoading || isFetching) && (
          <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-10 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#2980b9]" />
            <p className="text-sm font-semibold text-slate-600">Fetching live tracking details...</p>
          </div>
        )}

        {/* ─── Not Found ──────────────────────────────────────────────────── */}
        {notFound && (
          <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-10 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-800">No Tracking Record Found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                We couldn't find any shipment matching <span className="font-semibold text-slate-700">"{searchQuery}"</span>. Please check your docket number or tracking ID and try again.
              </p>
            </div>
          </div>
        )}

        {/* ─── Tracking Results ───────────────────────────────────────────── */}
        {hasData && (
          <div className="space-y-3">
            {/* ── Shipment Stepper Journey ────────────────────────────────── */}
            <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3.5 sm:p-4">
              {isCancelled ? (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-700">Booking Cancelled</p>
                    <p className="text-xs text-slate-500 mt-0.5">This shipment has been cancelled.</p>
                  </div>
                </div>
              ) : (
                <>
                  <TrackingTimeline currentStep={currentStep} pieceCounts={pieceCounts} />

                  {/* Delivered info if any piece has delivery details */}
                  {isDelivered && (
                    <div className="mt-4 pt-3 border-t border-slate-200 bg-slate-50/80 rounded p-3">
                      <p className="text-sm font-extrabold text-black uppercase tracking-wider mb-2">Delivery Details</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-xs font-extrabold text-black uppercase mb-0.5">Status</p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            Delivered
                          </span>
                        </div>
                        {trackData.bookingDate && (
                          <div>
                            <p className="text-xs font-extrabold text-black uppercase mb-0.5">Booking Date</p>
                            <p className="text-sm font-medium text-slate-900">{trackData.bookingDate}</p>
                          </div>
                        )}
                        {trackData.totalPieces && (
                          <div>
                            <p className="text-xs font-extrabold text-black uppercase mb-0.5">Total Pieces</p>
                            <p className="text-sm font-medium text-slate-900">{trackData.totalPieces} pcs</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Route Card ──────────────────────────────────────────────── */}
            <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3.5 sm:p-4">
              <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-slate-100">
                <MapPin className="w-4 h-4 text-black" />
                <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">Route</h3>
              </div>
              <div className="flex flex-col md:flex-row items-stretch gap-3">
                {/* From Branch */}
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded p-3 space-y-1">
                  <p className="text-xs font-extrabold text-black uppercase">From Branch</p>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-base font-bold text-black leading-tight">
                      {trackData.fromBranch?.name || "—"}
                    </p>
                    {trackData.fromBranch?.code && (
                      <span className="text-xs font-mono font-medium text-slate-700">[{trackData.fromBranch.code}]</span>
                    )}
                  </div>
                  {trackData.fromBranch?.address && (
                    <p className="text-xs font-normal text-slate-600">
                      {formatBranchAddress(trackData.fromBranch.address)}
                    </p>
                  )}
                  {(trackData.fromBranch?.mobile1 || trackData.fromBranch?.mobile2) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 pt-1">
                      <Phone className="w-3 h-3 text-black" />
                      <span className="font-medium">
                        {[trackData.fromBranch?.mobile1, trackData.fromBranch?.mobile2].filter(Boolean).join(" / ")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center shrink-0 text-black py-1">
                  <ArrowRight className="w-5 h-5 hidden md:block" />
                  <Truck className="w-5 h-5 md:hidden" />
                </div>

                {/* To Branch */}
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded p-3 space-y-1">
                  <p className="text-xs font-extrabold text-black uppercase">To Branch</p>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-base font-bold text-black leading-tight">
                      {trackData.toBranch?.name || "—"}
                    </p>
                    {trackData.toBranch?.code && (
                      <span className="text-xs font-mono font-medium text-slate-700">[{trackData.toBranch.code}]</span>
                    )}
                  </div>
                  {trackData.toBranch?.address && (
                    <p className="text-xs font-normal text-slate-600">
                      {formatBranchAddress(trackData.toBranch.address)}
                    </p>
                  )}
                  {(trackData.toBranch?.mobile1 || trackData.toBranch?.mobile2) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 pt-1">
                      <Phone className="w-3 h-3 text-black" />
                      <span className="font-medium">
                        {[trackData.toBranch?.mobile1, trackData.toBranch?.mobile2].filter(Boolean).join(" / ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Sender & Receiver (ONLY Name displayed as per specification) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3.5">
                <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4 text-black" />
                  <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">Sender</h3>
                </div>
                <InfoRow icon={User} label="Name" value={trackData.sender?.name} />
              </div>
              <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3.5">
                <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4 text-black" />
                  <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">Receiver</h3>
                </div>
                <InfoRow icon={User} label="Name" value={trackData.receiver?.name} />
              </div>
            </div>

            {/* ── Summary & Payment Details ───────────────────────────────── */}
            <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3.5 sm:p-4">
              <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-slate-100">
                <IndianRupee className="w-4 h-4 text-black" />
                <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">Shipment Summary</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
                {trackData.bookingDate && (
                  <div className="py-1.5 flex items-start gap-2.5">
                    <CalendarDays className="w-4 h-4 text-black mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold text-black uppercase leading-none mb-1">Booking Date</p>
                      <p className="text-sm font-medium text-slate-900">
                        {trackData.bookingDate} {trackData.bookingTime ? `• ${trackData.bookingTime}` : ""}
                      </p>
                    </div>
                  </div>
                )}
                {trackData.totalPieces !== undefined && (
                  <div className="py-1.5 flex items-start gap-2.5">
                    <Boxes className="w-4 h-4 text-black mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold text-black uppercase leading-none mb-1">Total Pieces</p>
                      <p className="text-sm font-medium text-slate-900">{trackData.totalPieces} pcs</p>
                    </div>
                  </div>
                )}
                {trackData.paymentMethod && (
                  <div className="py-1.5 flex items-start gap-2.5">
                    <CreditCard className="w-4 h-4 text-black mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold text-black uppercase leading-none mb-1">Payment Method</p>
                      <p className="text-sm font-medium text-slate-900">{trackData.paymentMethod}</p>
                    </div>
                  </div>
                )}
                {trackData.finalBillAmount !== undefined && (
                  <div className="py-1.5 flex items-start gap-2.5">
                    <IndianRupee className="w-4 h-4 text-black mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold text-black uppercase leading-none mb-1">Total Amount</p>
                      <p className="text-sm font-bold text-black">{fmt(trackData.finalBillAmount)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Piece-wise Tracking History (SimpleDataTable) ──────────── */}
            {pieces.length > 0 && (
              <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3.5 sm:p-4">
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
          </div>
        )}

        {/* ─── Idle State ─────────────────────────────────────────────────── */}
        {!hasSearched && (
          <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#2980b9]/10 flex items-center justify-center">
              <Package className="w-8 h-8 text-[#2980b9]" />
            </div>
            <div className="max-w-md">
              <p className="text-base font-extrabold text-slate-900">Track Your Shipment Online</p>
              <p className="text-xs text-slate-500 mt-1">
                Enter your Docket Number or Tracking ID in the search box above to see real-time updates and piece movement history.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center items-center">
              {["Draft", "Booked", "In Transit", "At Branch", "Arrived", "Delivered"].map((s, i, arr) => (
                <React.Fragment key={s}>
                  <span className="text-[11px] font-bold text-slate-600">{s}</span>
                  {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="mt-10 border-t border-slate-200 bg-white py-6">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 text-center text-xs text-slate-500">
          <p className="font-semibold text-slate-700">BAJRANG Road Lines & Parcel Service</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Safe, reliable, and on-time parcel transportation across Gujarat and beyond.
          </p>
        </div>
      </footer>
    </div>
  );
}
