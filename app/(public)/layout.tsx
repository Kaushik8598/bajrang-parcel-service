"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Truck, Search, Package, LogIn, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isTrackActive = pathname?.startsWith("/track");
  const isBookingActive = pathname?.startsWith("/customer-booking");

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col text-slate-900 selection:bg-[#2980b9] selection:text-white">
      {/* ─── Shared Public Header ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Brand Logo & Name */}
          <Link href="/customer-booking" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded bg-[#2980b9] text-white flex items-center justify-center font-bold shadow-xs group-hover:bg-[#2471a3] transition-colors">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-black tracking-tight leading-none group-hover:text-[#2980b9] transition-colors">
                BAJRANG
              </h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                Parcel Service &amp; Road Lines
              </p>
            </div>
          </Link>

          {/* Navigation Links / Action Buttons */}
          <div className="flex items-center gap-2">
            <Link href="/track">
              <Button
                type="button"
                variant={isTrackActive ? "default" : "outline"}
                className={cn(
                  "h-8 text-xs font-semibold px-3 cursor-pointer transition-all",
                  isTrackActive
                    ? "bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-xs"
                    : "border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                )}
              >
                <Search className={cn("w-3.5 h-3.5 mr-1.5", !isTrackActive && "text-[#2980b9]")} />
                <span>Track Parcel</span>
              </Button>
            </Link>

            <Link href="/customer-booking">
              <Button
                type="button"
                variant={isBookingActive ? "default" : "outline"}
                className={cn(
                  "h-8 text-xs font-semibold px-3 cursor-pointer transition-all",
                  isBookingActive
                    ? "bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-xs"
                    : "border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                )}
              >
                <Package className={cn("w-3.5 h-3.5 mr-1.5", !isBookingActive && "text-[#2980b9]")} />
                <span>Book Parcel</span>
              </Button>
            </Link>

            <Link href="/login" className="hidden sm:inline-flex">
              <Button
                type="button"
                variant="ghost"
                className="h-8 text-xs font-semibold px-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 mr-1 text-slate-500" />
                <span>Staff Login</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Main Content Body ───────────────────────────────────────────────── */}
      <main className="flex-1 w-full">{children}</main>

      {/* ─── Shared Public Footer ─────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5 text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#2980b9]/10 text-[#2980b9] flex items-center justify-center font-bold text-[10px]">
              B
            </div>
            <p className="font-semibold text-slate-800">
              BAJRANG Parcel Service &amp; Road Lines
            </p>
          </div>

          <p className="text-[11px] text-slate-500 text-center sm:text-right">
            © {new Date().getFullYear()} BAJRANG Parcel Service. All rights reserved. Fast &amp; Secure Logistics.
          </p>
        </div>
      </footer>
    </div>
  );
}
