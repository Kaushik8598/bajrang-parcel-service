"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import CustomerBookingForm from "@/components/booking/CustomerBookingForm";

function CustomerBookingPageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || undefined;
  const isEdit = searchParams.get("action") === "edit" || Boolean(id && searchParams.get("edit") === "true");
  const isView = searchParams.get("action") === "view" || Boolean(id && !isEdit);

  return (
    <CustomerBookingForm
      bookingId={id}
      isEdit={isEdit}
      isView={isView}
    />
  );
}

export default function CustomerBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#2980b9]" />
          <p className="text-xs font-semibold text-slate-600">Loading form...</p>
        </div>
      }
    >
      <CustomerBookingPageContent />
    </Suspense>
  );
}
