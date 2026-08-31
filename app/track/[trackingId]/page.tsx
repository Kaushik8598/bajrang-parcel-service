"use client";

import React, { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import PublicTrackingView from "@/components/tracking/PublicTrackingView";

function TrackDetailPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = params?.trackingId || params?.trackingid || searchParams?.get("q") || "";
  const trackingId =
    typeof rawId === "string"
      ? decodeURIComponent(rawId)
      : Array.isArray(rawId)
      ? decodeURIComponent(rawId[0])
      : "";

  return <PublicTrackingView initialTrackingId={trackingId} />;
}

export default function TrackDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
          <div className="bg-white rounded border border-slate-200 p-8 flex flex-col items-center gap-3 shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin text-[#2980b9]" />
            <p className="text-xs font-semibold text-slate-600">Loading tracking page...</p>
          </div>
        </div>
      }
    >
      <TrackDetailPageContent />
    </Suspense>
  );
}
