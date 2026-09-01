"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Search,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Package,
  Sparkles,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePublicBranchList } from "@/lib/hooks";
import { PublicBranchItem } from "@/lib/api/branch";
import CustomerBookingForm from "@/components/booking/CustomerBookingForm";

function PublicCustomerBookingContent() {
  const router = useRouter();
  const { data: branchRes, isLoading, error } = usePublicBranchList();

  const [selectedBranch, setSelectedBranch] = useState<PublicBranchItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Extract branches array directly
  const branches: PublicBranchItem[] = useMemo(() => {
    if (Array.isArray(branchRes?.data)) return branchRes.data;
    return [];
  }, [branchRes]);

  // Filtered branches by search query
  const filteredBranches = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return branches;

    return branches.filter((b) => {
      const name = (b.branchName || (b as any).name || "").toLowerCase();
      const code = (b.branchCode || (b as any).code || "").toLowerCase();
      const addr = (b.address || "").toLowerCase();
      const mob1 = (b.mobile1 || (b as any).mobile || "").toLowerCase();
      const mob2 = (b.mobile2 || "").toLowerCase();
      const email = (b.email || "").toLowerCase();

      return (
        name.includes(q) ||
        code.includes(q) ||
        addr.includes(q) ||
        mob1.includes(q) ||
        mob2.includes(q) ||
        email.includes(q)
      );
    });
  }, [branches, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* ─── Public Navbar ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#2980b9] text-white flex items-center justify-center font-bold shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-black tracking-tight leading-none">
                BAJRANG PARCEL SERVICE
              </h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                Fast, Reliable & Trusted Transport Solutions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/track")}
              className="h-8 text-xs font-semibold px-3 border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 mr-1 text-[#2980b9]" />
              Track Consignment
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Main Content Container ────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6">
        {!selectedBranch ? (
          /* ─── STEP 1: Branch Selection View (Box Type Cards) ─────────────── */
          <div className="space-y-4">
            {/* Top Banner */}
            <div className="bg-white rounded border border-slate-200/90 shadow-2xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#2980b9]/10 text-[#2980b9] text-[11px] font-bold">
                  <Sparkles className="w-3 h-3" />
                  <span>Online Customer Booking</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-black tracking-tight">
                  Select Your Origin Branch
                </h2>
                <p className="text-xs text-slate-600">
                  Please select the branch from which you want to book or dispatch your parcel.
                </p>
              </div>

              {/* Search Box */}
              <div className="w-full md:w-80 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search branch by name, code, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs bg-slate-50 border-slate-300 text-black focus:bg-white"
                />
              </div>
            </div>

            {/* Branch Cards Grid */}
            {isLoading ? (
              <div className="bg-white rounded border border-slate-200 p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#2980b9]" />
                <p className="text-xs font-semibold text-slate-600">Loading branch list...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded p-6 text-center space-y-2">
                <p className="text-xs font-semibold text-red-700">Failed to load branches.</p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                >
                  Retry
                </Button>
              </div>
            ) : filteredBranches.length === 0 ? (
              <div className="bg-white rounded border border-slate-200 p-10 text-center space-y-2">
                <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No branches found</p>
                <p className="text-[11px] text-slate-500">
                  {searchQuery ? `No branch matching "${searchQuery}"` : "No active branches available."}
                </p>
                {searchQuery && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="h-7 text-xs"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredBranches.map((branch) => {
                  const bName = branch.branchName || (branch as any).name || "Unnamed Branch";
                  const bCode = branch.branchCode || (branch as any).code || "";
                  const mob1 = branch.mobile1 || (branch as any).mobile || "";
                  const mob2 = branch.mobile2 || "";
                  const address = branch.address || "";
                  const email = branch.email || "";
                  const mapLink = branch.branchMapLink || "";

                  return (
                    <div
                      key={branch._id}
                      onClick={() => setSelectedBranch(branch)}
                      className="group bg-white rounded border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#2980b9] transition-all p-3.5 flex flex-col justify-between cursor-pointer relative overflow-hidden"
                    >
                      {/* Top Accent Stripe on Hover */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-[#2980b9] opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="space-y-2.5">
                        {/* Branch Title & Code */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-[#2980b9]/10 text-[#2980b9] group-hover:bg-[#2980b9] group-hover:text-white flex items-center justify-center font-bold transition-colors shrink-0">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-black tracking-tight leading-snug group-hover:text-[#2980b9] transition-colors">
                                {bName}
                              </h3>
                              {bCode && (
                                <span className="text-[10px] font-mono font-bold text-slate-500">
                                  Code: {bCode}
                                </span>
                              )}
                            </div>
                          </div>

                          {bCode && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 group-hover:bg-[#2980b9]/10 group-hover:text-[#2980b9] group-hover:border-[#2980b9]/30 transition-colors font-mono">
                              {bCode}
                            </span>
                          )}
                        </div>

                        {/* Branch Details */}
                        <div className="space-y-1.5 text-xs text-slate-700">
                          {/* Address */}
                          {address && (
                            <div className="flex items-start gap-1.5 text-slate-600">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <p className="line-clamp-2 leading-relaxed text-[11px]">{address}</p>
                            </div>
                          )}

                          {/* Contact */}
                          {(mob1 || mob2) && (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-mono text-[11px] font-semibold">
                                {[mob1, mob2].filter(Boolean).join(" / ")}
                              </span>
                            </div>
                          )}

                          {/* Email */}
                          {email && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-[11px] truncate">{email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Bottom CTA */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-3">
                        {mapLink ? (
                          <a
                            href={mapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2980b9] hover:underline"
                          >
                            <MapPin className="w-3 h-3" />
                            View on Map
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span />
                        )}

                        <Button
                          type="button"
                          size="sm"
                          className="h-7 px-3 bg-[#2980b9] hover:bg-[#2471a3] text-white text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <span>Select Branch</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ─── STEP 2: Customer Booking Form for Selected Branch ──────────── */
          <div className="space-y-3">
            {/* Selected Branch Header Bar */}
            <div className="bg-white rounded border border-[#2980b9]/30 shadow-2xs p-3 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-blue-50/40 via-white to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-[#2980b9] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Selected Origin Branch:</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#2980b9]/10 text-[#2980b9] font-mono">
                      {selectedBranch.branchCode || (selectedBranch as any).code || "BR"}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-black tracking-tight leading-tight">
                    {selectedBranch.branchName || (selectedBranch as any).name}
                    {selectedBranch.address ? ` — ${selectedBranch.address}` : ""}
                  </h3>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedBranch(null)}
                className="h-7 px-3 text-xs font-semibold border-slate-300 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-none"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Change Origin Branch
              </Button>
            </div>

            {/* Embedded Customer Booking Form */}
            <CustomerBookingForm
              initialFromBranchId={selectedBranch._id}
              isPublic={true}
              onBackToBranchSelection={() => setSelectedBranch(null)}
            />
          </div>
        )}
      </main>

      {/* ─── Public Footer ─────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          © {new Date().getFullYear()} BAJRANG Parcel Service. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default function PublicCustomerBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
          <div className="bg-white rounded border border-slate-200 p-8 flex flex-col items-center gap-3 shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin text-[#2980b9]" />
            <p className="text-xs font-semibold text-slate-600">Loading customer booking...</p>
          </div>
        </div>
      }
    >
      <PublicCustomerBookingContent />
    </Suspense>
  );
}
