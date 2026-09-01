"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import PublicTrackingView from "@/components/tracking/PublicTrackingView";

function TrackPageContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get("q") || searchParams.get("query") || searchParams.get("docketNo") || searchParams.get("trackingNo") || "";

  return <PublicTrackingView initialTrackingId={rawId} />;
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="bg-white rounded border border-slate-200 p-8 flex flex-col items-center gap-3 shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin text-[#2980b9]" />
            <p className="text-xs font-semibold text-slate-600">Loading tracking page...</p>
          </div>
        </div>
      }
    >
      <TrackPageContent />
    </Suspense>
  );
}
