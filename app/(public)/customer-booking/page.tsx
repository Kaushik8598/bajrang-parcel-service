"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
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
  const searchParams = useSearchParams();
  const branchCodeParam =
    searchParams.get("code") ||
    searchParams.get("branchCode") ||
    searchParams.get("branch") ||
    "";

  const { data: branchRes, isLoading, error } = usePublicBranchList();

  const [selectedBranch, setSelectedBranch] = useState<PublicBranchItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Extract branches array directly
  const branches: PublicBranchItem[] = useMemo(() => {
    if (Array.isArray(branchRes?.data)) return branchRes.data;
    return [];
  }, [branchRes]);

  // Auto select branch if URL has ?code=... (e.g. from scanned QR code or direct link)
  useEffect(() => {
    if (branchCodeParam && branches.length > 0) {
      const qCode = branchCodeParam.trim().toLowerCase();
      const matched = branches.find((b) => {
        const code = (b.branchCode || (b as any).code || "").toLowerCase();
        const id = String(b._id || "").toLowerCase();
        const name = (b.branchName || (b as any).name || "").toLowerCase();
        return code === qCode || id === qCode || name === qCode;
      });

      if (matched) {
        setSelectedBranch(matched);
      }
    }
  }, [branchCodeParam, branches]);

  // Handler when a user clicks/selects a branch card
  const handleSelectBranch = (branch: PublicBranchItem) => {
    setSelectedBranch(branch);
    const code = branch.branchCode || (branch as any).code || branch._id;
    if (code) {
      router.replace(`/customer-booking?code=${encodeURIComponent(code)}`);
    }
  };

  // Handler when a user clicks "Change Origin Branch"
  const handleBackToBranchSelection = () => {
    setSelectedBranch(null);
    router.replace("/customer-booking");
  };

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
    <div className="max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6">
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
                placeholder="Search by branch name, code, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-slate-50 focus-visible:bg-white border-slate-300"
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white rounded border border-slate-200 p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#2980b9]" />
              <p className="text-xs font-semibold text-slate-600">Loading branch list...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded p-6 text-center text-xs text-rose-700">
              Failed to load branch list. Please check your connection and try again.
            </div>
          )}

          {/* Branches Grid Cards */}
          {!isLoading && !error && (
            <>
              {filteredBranches.length === 0 ? (
                <div className="bg-white rounded border border-slate-200 p-12 text-center">
                  <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No branches found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try searching with another branch name, city, or code.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredBranches.map((branch) => {
                    const name = branch.branchName || (branch as any).name || "Branch";
                    const code = branch.branchCode || (branch as any).code || "";
                    const mobile = branch.mobile1 || (branch as any).mobile || "";
                    const address = branch.address || "";
                    const email = branch.email || "";

                    return (
                      <div
                        key={branch._id}
                        onClick={() => handleSelectBranch(branch)}
                        className="group bg-white rounded border border-slate-200 hover:border-[#2980b9] shadow-2xs hover:shadow-md transition-all duration-200 p-4 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                      >
                        {/* Top Accent Strip on Hover */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#2980b9] opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="space-y-2.5">
                          {/* Header: Name & Code */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <h3 className="text-sm font-bold text-black group-hover:text-[#2980b9] transition-colors leading-tight">
                                {name}
                              </h3>
                              {code && (
                                <span className="inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  {code}
                                </span>
                              )}
                            </div>
                            <div className="w-7 h-7 rounded bg-slate-50 group-hover:bg-[#2980b9]/10 text-slate-400 group-hover:text-[#2980b9] flex items-center justify-center shrink-0 transition-colors">
                              <Building2 className="w-4 h-4" />
                            </div>
                          </div>

                          {/* Address & Contacts */}
                          <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                            {address && (
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <span className="text-[11px] leading-snug line-clamp-2">
                                  {address}
                                </span>
                              </div>
                            )}

                            {mobile && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="text-[11px] font-medium text-slate-700">
                                  {mobile}
                                </span>
                              </div>
                            )}

                            {email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="text-[11px] text-slate-500 truncate">
                                  {email}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Footer */}
                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-500 group-hover:text-[#2980b9] transition-colors">
                            Book from this branch
                          </span>
                          <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-[#2980b9] text-slate-500 group-hover:text-white flex items-center justify-center transition-colors">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* ─── STEP 2: Booking Form for Selected Branch ─────────────────────── */
        <div className="space-y-3">
          {/* Selected Branch Active Header Bar */}
          <div className="bg-white rounded border border-[#2980b9]/40 shadow-xs px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[#2980b9] text-white flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Selected Origin Branch:
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-black leading-tight">
                  {selectedBranch.branchName || (selectedBranch as any).name}{" "}
                  {selectedBranch.branchCode ? `(${selectedBranch.branchCode})` : ""}
                </h2>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleBackToBranchSelection}
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
            onBackToBranchSelection={handleBackToBranchSelection}
          />
        </div>
      )}
    </div>
  );
}

export default function PublicCustomerBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center p-6">
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
