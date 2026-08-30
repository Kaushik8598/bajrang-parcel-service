"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  PackageCheck,
  Search,
  Camera,
  Loader2,
  X,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FormCard } from "@/components/ui/form-card";
import { FileUploadPreview } from "@/components/ui/file-upload-preview";
import BarcodeScannerModal from "@/components/scanner/BarcodeScannerModal";
import ParcelBookingForm from "@/components/booking/ParcelBookingForm";
import SimpleDataTable from "@/components/DataTable/SimpleDataTable";
import type { ColumnDef } from "@/lib/types/common";
import { getBookingById, updateBookingStatus } from "@/lib/api/booking";
import { sendOtp, resendOtp, verifyOtp } from "@/lib/api/auth";
import { useUpload } from "@/lib/hooks/useUpload";
import { showToast } from "@/lib/toast";

export default function ParcelDeliveryPage() {
  const [searchInput, setSearchInput] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [bookingData, setBookingData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Delivery confirmation form states
  const [receiverContact, setReceiverContact] = useState<string>("");
  const [receiverName, setReceiverName] = useState<string>("");
  const [receiverProofFile, setReceiverProofFile] = useState<File | null>(null);
  const [receiverProofUrl, setReceiverProofUrl] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [otpTimer, setOtpTimer] = useState<number>(0);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState<boolean>(false);

  const { uploadFile, uploadingFields } = useUpload();

  // Camera scanner state
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Check camera device on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (navigator?.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          if (Array.isArray(devices) && devices.length > 0) {
            const hasVideo = devices.some((d) => d.kind === "videoinput");
            const hasAudio = devices.some((d) => d.kind === "audioinput");
            if (!hasVideo && hasAudio) {
              setHasCamera(false);
            } else {
              setHasCamera(true);
            }
          } else {
            setHasCamera(true);
          }
        })
        .catch(() => {
          setHasCamera(true);
        });
    }
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpTimer <= 0) return;
    const timer = setInterval(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpTimer]);

  // Pre-fill receiver info when bookingData is loaded
  useEffect(() => {
    if (bookingData) {
      const rMobile =
        bookingData.receiver?.contact_no ||
        (bookingData.receiver as any)?.mobile ||
        (bookingData.receiver as any)?.email ||
        "";
      const rName = bookingData.receiver?.name || "";
      setReceiverContact(rMobile);
      setReceiverName(rName);
      setOtp("");
      setOtpSent(false);
      setReceiverProofFile(null);
      setReceiverProofUrl("");
    }
  }, [bookingData]);

  // Fetch Booking by ID / Tracking Number / Docket No
  const handleSearch = async (queryToSearch?: string) => {
    const rawQuery = (queryToSearch !== undefined ? queryToSearch : searchInput).trim();
    if (!rawQuery) {
      showToast("warning", "Please enter a Tracking No or Docket No.");
      searchInputRef.current?.focus();
      return;
    }

    setIsSearching(true);
    setErrorMsg("");

    try {
      const data = await getBookingById(rawQuery);
      if (data && (data._id || data.booking || data.docketNo1 || data.docketNo2)) {
        const actualBooking = data.booking || data;
        const trackingData = data.tracking || actualBooking.tracking;

        setBookingData({
          ...actualBooking,
          tracking: trackingData,
        });
      } else {
        setBookingData(null);
        setErrorMsg(`No booking found matching "${rawQuery}". Please verify and try again.`);
        showToast("error", `No booking found matching "${rawQuery}"`);
      }
    } catch (err: any) {
      setBookingData(null);
      const msg =
        err?.response?.data?.message || err?.message || `Failed to fetch booking for "${rawQuery}".`;
      setErrorMsg(msg);
      showToast("error", msg);
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search & form
  const handleClear = () => {
    setSearchInput("");
    setBookingData(null);
    setErrorMsg("");
    setReceiverContact("");
    setReceiverName("");
    setReceiverProofFile(null);
    setReceiverProofUrl("");
    setOtp("");
    setOtpSent(false);
    searchInputRef.current?.focus();
  };

  // Handle scanned barcode from camera modal
  const handleBarcodeScan = (scannedCode: string) => {
    const trimmed = scannedCode.trim();
    if (trimmed) {
      setSearchInput(trimmed);
      setIsScannerOpen(false);
      handleSearch(trimmed);
    }
  };

  // Send Delivery Confirmation OTP via POST /auth/send-otp or POST /auth/resend-otp
  const handleSendOtp = async () => {
    const trimmed = receiverContact.trim();
    if (!trimmed) {
      showToast("warning", "Please enter a mobile number or email to send OTP.");
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = otpSent ? await resendOtp(trimmed) : await sendOtp(trimmed);
      setOtpSent(true);
      setOtpTimer(60);
      showToast("success", res?.message || `OTP sent successfully to ${trimmed}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to send OTP.";
      showToast("error", msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Upload Receiver ID Document
  const handleProofUpload = async (file: File) => {
    setReceiverProofFile(file);
    const res = await uploadFile(file, "receiverDoc");
    if (res?.url) {
      setReceiverProofUrl(res.url);
    }
  };

  // Submit Parcel Delivery: 1. Verify OTP, 2. POST /booking/:id/delivered
  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedContact = receiverContact.trim();
    if (!trimmedContact) {
      showToast("warning", "Please enter a valid mobile number or email.");
      return;
    }

    if (!receiverName.trim()) {
      showToast("warning", "Please enter receiver name.");
      return;
    }

    if (!otp || otp.trim().length !== 6) {
      showToast("warning", "Please enter the 6-digit confirmation OTP.");
      return;
    }

    setIsSubmittingDelivery(true);
    try {
      // 1. Verify OTP via POST /auth/verify-otp
      const verifyRes = await verifyOtp(trimmedContact, otp.trim());

      // 2. Call POST /booking/:id/:status with 'delivered'
      const bookingId = bookingData?.docketNo1;
      if (bookingId) {
        const statusRes = await updateBookingStatus(bookingId, "delivered", {
          receiverContact: trimmedContact,
          receiverName: receiverName.trim(),
          receiverProof: receiverProofUrl,
          receiverProofUrl: receiverProofUrl,
          otp: otp.trim(),
        });

        showToast(
          "success",
          statusRes?.message || verifyRes?.message || "Parcel delivered successfully!"
        );

        // Reload booking details
        handleSearch(String(bookingId));
      } else {
        showToast("success", verifyRes?.message || "Parcel delivered successfully!");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Invalid OTP or failed to confirm delivery.";
      showToast("error", msg);
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  const trackingObj = bookingData?.tracking;
  const rawPieces = Array.isArray(trackingObj?.pieces) ? trackingObj.pieces : [];

  // Check if ALL pieces strictly have status 'arrived_at_destination'
  const isAllPiecesArrived = useMemo(() => {
    if (!rawPieces || rawPieces.length === 0) return false;
    return rawPieces.every((pc: any) => {
      const st = (pc.status || "").toLowerCase().trim();
      return st === "arrived_at_destination";
    });
  }, [rawPieces]);

  // Flattened History Events for Pieces or Global tracking
  const piecesData = useMemo(() => {
    return rawPieces.map((pc: any, idx: number) => {
      const pieceNums = Array.isArray(pc.pieceNumbers)
        ? pc.pieceNumbers
        : pc.pieceNumber
          ? [pc.pieceNumber]
          : [`Piece ${idx + 1}`];

      const historyEvents = Array.isArray(pc.history) ? pc.history : [];

      return {
        id: idx + 1,
        pieceNumbers: pieceNums,
        pieceNumbersStr: pieceNums.join(", "),
        status: pc.status || "confirmed",
        currentBranch: pc.currentBranch || pc.branchName || "—",
        currentTruck: pc.currentTruck || pc.truckNumber || "—",
        history: historyEvents,
      };
    });
  }, [rawPieces]);

  // Global history fallback if tracking has top-level history
  const globalHistory = useMemo(() => {
    if (Array.isArray(trackingObj?.history) && trackingObj.history.length > 0) {
      return trackingObj.history;
    }
    return [];
  }, [trackingObj]);

  // Table Column Definitions for Pieces (Simple Black & White Text View)
  const pieceColumns: ColumnDef<any>[] = [
    {
      key: "pieceNumbersStr",
      label: "Piece Barcode(s)",
      width: "w-56",
      render: (_val: unknown, row: any) => (
        <span className="font-mono font-medium text-black text-xs">
          {Array.isArray(row.pieceNumbers) ? row.pieceNumbers.join(", ") : row.pieceNumbersStr || "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Current Status",
      width: "w-44",
      render: (val: unknown) => (
        <span className="font-medium text-black capitalize text-xs">
          {String(val || "—").replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "history",
      label: "Complete History Trail",
      render: (_: unknown, row: any) => {
        const events = row.history || [];
        if (!events || events.length === 0) {
          return <span className="text-slate-500 italic text-xs">No history logs recorded yet</span>;
        }

        return (
          <div className="space-y-1 py-0.5 text-xs text-black">
            {events.map((ev: any, evIdx: number) => {
              const dateStr = ev.date || (ev.createdAt ? new Date(ev.createdAt).toLocaleDateString() : "");
              const timeStr = ev.time || (ev.createdAt ? new Date(ev.createdAt).toLocaleTimeString() : "");
              const parts: string[] = [];
              if (dateStr || timeStr) parts.push(`${dateStr} ${timeStr}`.trim());
              if (ev.branchName || ev.branchCode) parts.push(`${ev.branchName || ev.branchCode}`);
              if (ev.remark) parts.push(`${ev.remark}`);

              return (
                <div key={evIdx} className="text-black text-xs leading-relaxed">
                  {parts.join(" - ")}
                </div>
              );
            })}
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full space-y-2 pb-8">
      {/* ─── Top Header Card with Integrated Search on the Right ─────────────── */}
      <div className="bg-white rounded border border-slate-200/80 shadow-2xs px-3 py-2 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left Side: Title & Current Loaded Info */}
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded bg-[#2980b9]/10 text-[#2980b9] flex items-center justify-center font-bold shrink-0">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-black tracking-tight leading-none">
                Parcel Delivery
              </h1>
              {bookingData && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold bg-blue-50 text-[#2980b9] border border-blue-200 px-2 py-0.5 rounded font-mono">
                    Docket: {bookingData.docketNo1 || "—"}
                  </span>
                  <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono">
                    Tracking: {bookingData.docketNo2 || "—"}
                  </span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Enter Tracking No or Docket No to search and verify parcel delivery.
            </p>
          </div>
        </div>

        {/* Right Side: Responsive Search Bar & Camera Button */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-wrap items-center gap-1.5 shrink-0"
        >
          <div className="relative min-w-[220px] sm:min-w-[280px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter Tracking No or Docket No..."
              className="pl-8 pr-7 h-8 text-xs font-mono font-medium text-slate-900 border-black focus:border-black"
              autoFocus
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Search Button */}
          <Button
            type="submit"
            disabled={isSearching || !searchInput.trim()}
            className="bg-[#2980b9] hover:bg-[#2471a3] text-white h-8 px-3 text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-3 h-3" />
                <span>Search</span>
              </>
            )}
          </Button>

          {/* Camera Scanner Trigger */}
          {hasCamera && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsScannerOpen(true)}
              className="h-8 px-2.5 text-xs text-slate-700 border-slate-300 hover:bg-slate-50 flex items-center gap-1 cursor-pointer font-medium"
              title="Scan Barcode using Camera"
            >
              <Camera className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Camera</span>
            </Button>
          )}

          {/* Clear Button */}
          {bookingData && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              className="h-8 px-2 text-xs text-slate-600 border-slate-200 hover:bg-slate-50 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </form>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center justify-between gap-2 animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg("")}
            className="text-rose-500 hover:text-rose-700 p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ─── Search Result View ──────────────────────────────────────────────── */}
      {bookingData ? (
        <div className="space-y-2">
          {/* ─── 1. Disabled Parcel Booking Form ──────────────────────────────── */}
          <ParcelBookingForm
            isView={true}
            prefetchedBooking={bookingData}
            hideHeader={true}
          />

          {/* ─── 2. Tracking & Pieces Complete History (Collapsible Card & Common Table) ─ */}
          {(piecesData.length > 0 || globalHistory.length > 0) && (
            <FormCard
              title={
                <div className="flex items-center gap-2">
                  <span className="font-bold text-black text-xs">Tracking &amp; Piece History</span>
                  <Badge variant="outline" className="bg-blue-50 text-[#2980b9] border-blue-200 text-[10px] py-0 px-1.5">
                    {trackingObj?.totalPieces || piecesData.length} Pieces Grouped
                  </Badge>
                </div>
              }
              icon={History}
              collapsible={true}
              defaultOpen={false}
            >
              <div className="space-y-2 pt-1">
                {piecesData.length > 0 ? (
                  <SimpleDataTable
                    columns={pieceColumns}
                    data={piecesData}
                    showSrNo={true}
                    srNoLabel="#"
                    emptyMessage="No piece tracking records found."
                  />
                ) : null}
              </div>
            </FormCard>
          )}

          {/* ─── 3. Receiver Delivery Confirmation Section (Shown only if all pieces arrived) ─ */}
          {isAllPiecesArrived && (
            <FormCard
              title="Receiver Delivery Confirmation"
              icon={PackageCheck}
            >
              <form
                onSubmit={handleDeliverySubmit}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-2 items-end pt-1"
              >
                {/* 1. Receiver Contact (Mobile / Email) & Send OTP Button (span 3) */}
                <div className="lg:col-span-3 space-y-1">
                  <Label className="text-[11px] font-bold text-black flex items-center gap-0.5 leading-none">
                    Receiver Contact <span className="text-red-500 font-bold">*</span>
                  </Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="text"
                      placeholder="Mobile No or Email"
                      value={receiverContact}
                      onChange={(e) => setReceiverContact(e.target.value)}
                      className="h-8 text-xs font-mono font-medium text-black border-black focus:border-black"
                    />
                    <Button
                      type="button"
                      disabled={isSendingOtp || !receiverContact.trim() || otpTimer > 0}
                      onClick={handleSendOtp}
                      className="h-8 px-2.5 bg-[#2980b9] hover:bg-[#2471a3] text-white text-xs font-semibold shrink-0 cursor-pointer shadow-none"
                    >
                      {isSendingOtp ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : otpTimer > 0 ? (
                        <span>{otpTimer}s</span>
                      ) : (
                        <span>{otpSent ? "Resend" : "Send OTP"}</span>
                      )}
                    </Button>
                  </div>
                </div>

                {/* 2. Receiver Name (span 3) */}
                <div className="lg:col-span-3 space-y-1">
                  <Label className="text-[11px] font-bold text-black flex items-center gap-0.5 leading-none">
                    Receiver Name <span className="text-red-500 font-bold">*</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="Receiver Name"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="h-8 text-xs text-black border-black focus:border-black font-medium"
                  />
                </div>

                {/* 3. Receiver Document Upload Field (span 3) */}
                <div className="lg:col-span-3 space-y-1">
                  <Label className="text-[11px] font-bold text-black flex items-center gap-0.5 leading-none">
                    Receiver Document
                  </Label>
                  <FileUploadPreview
                    label="Document"
                    fileName={receiverProofFile?.name}
                    fileUrl={receiverProofUrl}
                    isUploading={uploadingFields["receiverDoc"]}
                    onFileSelect={handleProofUpload}
                    onRemove={() => {
                      setReceiverProofFile(null);
                      setReceiverProofUrl("");
                    }}
                    accept="image/*,.pdf"
                    showViewLink={true}
                  />
                </div>

                {/* 4. 6-Digit OTP Confirmation Field (span 2) */}
                <div className="lg:col-span-2 space-y-1">
                  <Label className="text-[11px] font-bold text-black flex items-center gap-0.5 leading-none">
                    6-Digit OTP <span className="text-red-500 font-bold">*</span>
                  </Label>
                  <Input
                    type="text"
                    maxLength={6}
                    inputMode="numeric"
                    placeholder="6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-8 text-xs font-mono font-bold tracking-widest text-black border-black focus:border-black text-center"
                  />
                </div>

                {/* 5. Submit Button (span 1) */}
                <div className="lg:col-span-1">
                  <Button
                    type="submit"
                    disabled={isSubmittingDelivery || !receiverContact || !receiverName || otp.length !== 6}
                    className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    {isSubmittingDelivery ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Submit</span>
                    )}
                  </Button>
                </div>
              </form>
            </FormCard>
          )}
        </div>
      ) : (
        /* Empty State */
        !isSearching && (
          <div className="bg-white rounded border border-dashed border-slate-300 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-sm font-semibold text-slate-800">
                No Booking Loaded
              </h3>
              <p className="text-xs text-slate-500">
                Please enter a Tracking No or Docket No in the top search field, or scan a barcode to view booking details.
              </p>
            </div>
          </div>
        )
      )}

      {/* ─── Camera Barcode Scanner Modal ────────────────────────────────────── */}
      {hasCamera && isScannerOpen && (
        <BarcodeScannerModal
          open={isScannerOpen}
          onOpenChange={setIsScannerOpen}
          onScan={handleBarcodeScan}
          title="Scan Tracking Barcode for Delivery"
        />
      )}
    </div>
  );
}
