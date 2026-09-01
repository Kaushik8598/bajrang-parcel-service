"use client";

import React, { useState, useEffect } from "react";
import {
  User as UserIcon,
  Building2,
  CreditCard,
  FileText,
  Phone,
  Mail,
  IndianRupee,
  Eye,
  SlidersHorizontal,
  ExternalLink,
  History,
  MapPin,
  QrCode,
  Copy,
  Printer,
  Check,
  Download,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/ui/form-card";
import { Skeleton } from "@/components/ui/skeleton";
import AppModal from "@/components/ui/AppModal";
import { useUserProfile } from "@/lib/hooks";
import { generateQrCodeSvg } from "@/lib/utils/qrCodeGenerator";
import { showToast } from "@/lib/toast";
import { cn, formatDateTime } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractImageUrl(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    return val.image || val.url || val.passbookImage || "";
  }
  return "";
}

function formatCurrencyVal(val: any): string {
  const num = Number(val) || 0;
  return `₹ ${num.toLocaleString("en-IN")}`;
}

// ─── Info Field Display Component ─────────────────────────────────────────────

function InfoField({
  label,
  value,
  icon: Icon,
  className,
  isMono = false,
  isCurrency = false,
  isBadge = false,
  badgeVariant = "default",
}: {
  label: string;
  value?: React.ReactNode;
  icon?: React.ElementType;
  className?: string;
  isMono?: boolean;
  isCurrency?: boolean;
  isBadge?: boolean;
  badgeVariant?: "default" | "success" | "warning" | "danger" | "info";
}) {
  return (
    <div className={cn("p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1", className)}>
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
        {label}
      </span>
      <div className="flex items-center gap-1.5 min-h-[22px]">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
        {isBadge ? (
          <span
            className={cn(
              "px-2 py-0.5 rounded text-xs font-bold uppercase",
              badgeVariant === "success" && "bg-emerald-100 text-emerald-800",
              badgeVariant === "warning" && "bg-amber-100 text-amber-800",
              badgeVariant === "danger" && "bg-rose-100 text-rose-800",
              badgeVariant === "info" && "bg-sky-100 text-sky-800",
              badgeVariant === "default" && "bg-slate-200 text-slate-800"
            )}
          >
            {value || "—"}
          </span>
        ) : (
          <span
            className={cn(
              "text-xs font-bold text-slate-900 truncate",
              isMono && "font-mono font-semibold",
              isCurrency && "text-[#2980b9] font-mono text-sm"
            )}
          >
            {value !== undefined && value !== null && value !== "" ? value : "—"}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Document Preview Card ────────────────────────────────────────────────────

function DocumentPreviewCard({
  title,
  fileUrl,
  onPreview,
}: {
  title: string;
  fileUrl?: string;
  onPreview: (url: string, title: string) => void;
}) {
  if (!fileUrl) {
    return (
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
        <span className="text-xs font-bold text-slate-700">{title}</span>
        <div className="h-28 rounded border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs">
          <span>No Document Uploaded</span>
        </div>
      </div>
    );
  }

  const isPdf = fileUrl.toLowerCase().endsWith(".pdf");

  return (
    <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-2 group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-900">{title}</span>
        <button
          type="button"
          onClick={() => onPreview(fileUrl, title)}
          className="text-xs text-[#2980b9] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View</span>
        </button>
      </div>

      <div
        onClick={() => onPreview(fileUrl, title)}
        className="h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:border-[#2980b9] transition-all relative"
      >
        {isPdf ? (
          <div className="flex flex-col items-center gap-1 text-[#2980b9]">
            <FileText className="w-8 h-8" />
            <span className="text-[11px] font-bold">PDF Document</span>
          </div>
        ) : (
          <img
            src={fileUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        )}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
          <Eye className="w-4 h-4" />
          <span>Open Full</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Profile Page Component ──────────────────────────────────────────────

export default function ProfilePage() {
  const { data: userProfile, isLoading } = useUserProfile();

  const [activeTab, setActiveTab] = useState<string>("general");
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Origin for public QR link
  const [origin, setOrigin] = useState<string>("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // ─── Loading State ──────────────────────────────────────────────────────────
  if (isLoading && !userProfile) {
    return (
      <div className="space-y-6 pb-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row items-center gap-6">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const u = userProfile || {};
  const bInfo = u.branchInfo || {};
  const bPrefs = u.bookingPreferences || {};
  const bank = u.bankDetails || {};
  const aadhar = u.aadharCard || {};
  const pan = u.panCard || {};
  const rentAg = bInfo.rentAgreement || {};

  const profilePhotoUrl = extractImageUrl(u.profilePhoto);
  const passportPhotoUrl = extractImageUrl(u.passportSizePhoto);

  const isBranchRole = (u.role || "").toLowerCase() === "branch" || Boolean(u.branchInfo);
  const isStaffRole = (u.role || "").toLowerCase() === "staff" || Boolean(u.staffProfile);

  // Customer Booking Link with branch code
  const branchCode = bInfo.branchCode || "";
  const publicBaseUrl = origin || "https://bajrangparcelservice.com";
  const customerBookingUrl = `${publicBaseUrl}/customer-booking${
    branchCode ? `?code=${encodeURIComponent(branchCode)}` : ""
  }`;

  // Small QR for banner display
  const qrSvgSmall = generateQrCodeSvg(customerBookingUrl, {
    size: 84,
    margin: 1,
    color: "#000000",
  });

  // Large QR for full screen modal
  const qrSvgLarge = generateQrCodeSvg(customerBookingUrl, {
    size: 240,
    margin: 2,
    color: "#000000",
  });

  // Download QR Code as PNG image
  const handleDownloadQr = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const svgData = generateQrCodeSvg(customerBookingUrl, {
        size: 500,
        margin: 2,
        color: "#000000",
        backgroundColor: "#ffffff",
      });

      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 600;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 50, 50, 500, 500);

          const pngUrl = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.href = pngUrl;
          downloadLink.download = `customer_booking_qr_${branchCode || "branch"}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(svgUrl);
          showToast("success", "QR Code image downloaded successfully!");
        }
      };
      image.src = svgUrl;
    } catch {
      showToast("error", "Failed to download QR code image");
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(customerBookingUrl);
      setCopiedLink(true);
      showToast("success", "Customer Booking link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handlePrintQr = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Customer Booking QR - ${bInfo.branchName || u.name || "Branch"}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              text-align: center;
              padding: 20px;
            }
            .qr-card {
              border: 2px solid #2980b9;
              border-radius: 16px;
              padding: 24px;
              max-width: 340px;
            }
            h2 { margin: 0 0 4px 0; color: #1b4f72; font-size: 20px; }
            .code-badge {
              display: inline-block;
              background: #ebf5fb;
              color: #2980b9;
              font-weight: bold;
              padding: 2px 10px;
              border-radius: 6px;
              margin-bottom: 16px;
              font-family: monospace;
              font-size: 14px;
            }
            .qr-container { margin: 12px 0; display: flex; justify-content: center; }
            p { font-size: 12px; color: #555; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="qr-card">
            <h2>${bInfo.branchName || u.name || "Bajrang Parcel Service"}</h2>
            ${branchCode ? `<div class="code-badge">Branch Code: ${branchCode}</div>` : ""}
            <div class="qr-container">${qrSvgLarge}</div>
            <p><strong>Scan QR Code</strong><br/>to Book Parcel Online directly with this branch</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ─── 1. Profile Banner & Header Card ─────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-[#1b4f72] via-[#2980b9] to-[#3498db] rounded-2xl p-6 text-white shadow-lg overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 bg-teal-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Avatar & Key Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-5 text-center sm:text-left">
            <div className="relative group">
              <div
                onClick={() => {
                  if (profilePhotoUrl) {
                    setPreviewImage({
                      url: profilePhotoUrl,
                      title: `${u.name || "User"} - Profile Photo`,
                    });
                  }
                }}
                className={cn(
                  "w-24 h-24 rounded-full border-4 border-white/80 bg-white/20 shadow-md flex items-center justify-center overflow-hidden shrink-0",
                  profilePhotoUrl && "cursor-pointer hover:opacity-90"
                )}
              >
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt={u.name || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-12 h-12 text-white/90" />
                )}
              </div>

              {profilePhotoUrl && (
                <div className="absolute bottom-0 right-0 bg-black/60 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Name, Roles, Badges */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {u.name || "User Profile"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-[#1b4f72] shadow-xs">
                  {u.role || "User"}
                </span>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                    u.status === "active"
                      ? "bg-emerald-400/30 text-emerald-100 border border-emerald-300/40"
                      : "bg-rose-400/30 text-rose-100 border border-rose-300/40"
                  )}
                >
                  {u.status || "Active"}
                </span>
              </div>

              {/* Contact Info Pills */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-white/85 pt-1">
                {u.email && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <Mail className="w-3.5 h-3.5 text-white/70" />
                    {u.email}
                  </span>
                )}
                {u.mobile && (
                  <span className="flex items-center gap-1.5 font-medium font-mono">
                    <Phone className="w-3.5 h-3.5 text-white/70" />
                    {u.mobile}
                  </span>
                )}
                {u.balance !== undefined && (
                  <span className="flex items-center gap-1 font-bold bg-white/20 px-2 py-0.5 rounded-md text-amber-200 border border-white/20 font-mono">
                    <IndianRupee className="w-3.5 h-3.5" />
                    Balance: ₹{Number(u.balance || 0).toLocaleString("en-IN")}
                  </span>
                )}
              </div>

              {/* Timestamps */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] text-white/70 pt-0.5">
                {u.lastLogin && (
                  <span>
                    Last Login: {formatDateTime(u.lastLogin)}
                  </span>
                )}
                {u.createdAt && (
                  <span>• Member Since: {new Date(u.createdAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>

          {/* ─── Direct QR Code Box on Header ────────────────────────────────── */}
          <div className="flex flex-col items-center gap-1.5 self-center sm:self-auto shrink-0 bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-white/40 shadow-md text-slate-800">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1b4f72] flex items-center gap-1">
              <QrCode className="w-3 h-3 text-[#2980b9]" />
              <span>Customer QR</span>
            </span>

            {/* Clickable QR Code to open in Full Screen Modal */}
            <div
              onClick={() => setQrModalOpen(true)}
              title="Click to view full screen"
              className="bg-white p-1 rounded-lg border border-slate-200 cursor-pointer group relative shadow-2xs hover:border-[#2980b9] transition-all"
            >
              <div dangerouslySetInnerHTML={{ __html: qrSvgSmall }} />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-[10px] font-bold gap-1">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full</span>
              </div>
            </div>

            {/* Direct Download Button */}
            <button
              type="button"
              onClick={handleDownloadQr}
              className="w-full py-1 px-2 text-[11px] font-bold rounded-md bg-[#2980b9] hover:bg-[#1b4f72] text-white flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Download QR Code Image"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. Navigation Tabs ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
            activeTab === "general"
              ? "bg-[#2980b9] text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-black hover:bg-slate-50 border border-slate-200"
          )}
        >
          <UserIcon className="w-4 h-4" />
          <span>General Info</span>
        </button>

        {isBranchRole && (
          <button
            type="button"
            onClick={() => setActiveTab("branch")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
              activeTab === "branch"
                ? "bg-[#2980b9] text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-black hover:bg-slate-50 border border-slate-200"
            )}
          >
            <Building2 className="w-4 h-4" />
            <span>Branch Details</span>
          </button>
        )}

        {(isBranchRole || isStaffRole) && (
          <button
            type="button"
            onClick={() => setActiveTab("bookingPrefs")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
              activeTab === "bookingPrefs"
                ? "bg-[#2980b9] text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-black hover:bg-slate-50 border border-slate-200"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Booking Preferences</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("kyc")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
            activeTab === "kyc"
              ? "bg-[#2980b9] text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-black hover:bg-slate-50 border border-slate-200"
          )}
        >
          <FileText className="w-4 h-4" />
          <span>KYC & Identity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bank")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
            activeTab === "bank"
              ? "bg-[#2980b9] text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-black hover:bg-slate-50 border border-slate-200"
          )}
        >
          <CreditCard className="w-4 h-4" />
          <span>Bank Account</span>
        </button>

        {(u.salaryHistory?.length > 0 || bInfo.rentHistory?.length > 0) && (
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
              activeTab === "history"
                ? "bg-[#2980b9] text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-black hover:bg-slate-50 border border-slate-200"
            )}
          >
            <History className="w-4 h-4" />
            <span>Salary History</span>
          </button>
        )}
      </div>

      {/* ─── 3. TAB 1: General Info (User ID, Created At, Last Updated removed) ─── */}
      {activeTab === "general" && (
        <div className="space-y-6">
          <FormCard title="Account Overview" icon={UserIcon}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <InfoField label="Full Name" value={u.name} />
              <InfoField label="Primary Mobile" value={u.mobile} icon={Phone} isMono />
              <InfoField label="Email Address" value={u.email} icon={Mail} />
              <InfoField label="Role" value={u.role} isBadge badgeVariant="info" />
              <InfoField
                label="Account Status"
                value={u.status || "active"}
                isBadge
                badgeVariant={u.status === "active" ? "success" : "danger"}
              />
              <InfoField
                label="Current Balance"
                value={formatCurrencyVal(u.balance)}
                isCurrency
              />
            </div>
          </FormCard>

          {/* Photo Previews */}
          <FormCard title="Identity Photographs" icon={FileText}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <DocumentPreviewCard
                title="Profile Photo"
                fileUrl={profilePhotoUrl}
                onPreview={(url, title) => setPreviewImage({ url, title })}
              />
              <DocumentPreviewCard
                title="Passport Size Photo"
                fileUrl={passportPhotoUrl}
                onPreview={(url, title) => setPreviewImage({ url, title })}
              />
            </div>
          </FormCard>
        </div>
      )}

      {/* ─── 4. TAB 2: Branch Details (If Branch) ────────────────────────────── */}
      {activeTab === "branch" && isBranchRole && (
        <div className="space-y-6">
          <FormCard title="Branch Establishment & Address" icon={Building2}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <InfoField label="Branch Name" value={bInfo.branchName} />
              <InfoField label="Branch Code" value={bInfo.branchCode} isMono />
              <InfoField
                label="Public Booking Allowed"
                value={bInfo.allowPublicBooking ? "Yes / Enabled" : "No / Disabled"}
                isBadge
                badgeVariant={bInfo.allowPublicBooking ? "success" : "warning"}
              />
              <InfoField label="Branch Mobile 1" value={bInfo.mobile1 || u.mobile} isMono />
              <InfoField label="Branch Mobile 2" value={bInfo.mobile2} isMono />
              <InfoField label="City" value={bInfo.city} />
              <InfoField label="State" value={bInfo.state || "GUJARAT"} />
              <InfoField label="Pincode" value={bInfo.pincode} isMono />
              <InfoField label="Total Dockets" value={bInfo.totalDocket ?? 0} isMono />
              <InfoField label="Address Line 1" value={bInfo.address1} className="sm:col-span-2" />
              <InfoField label="Address Line 2" value={bInfo.address2} />
              {bInfo.branchMapLink && (
                <div className="sm:col-span-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Branch Map Location
                  </span>
                  <a
                    href={bInfo.branchMapLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#2980b9] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{bInfo.branchMapLink}</span>
                  </a>
                </div>
              )}
            </div>
          </FormCard>

          {/* Commercial & Rent Settings */}
          <FormCard title="Commercial & Rent Settings" icon={IndianRupee}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <InfoField label="Branch Type" value={bInfo.branchType || "commission"} isBadge />
              <InfoField label="Compensation Structure" value={bInfo.compensationType || "commission"} isBadge />
              <InfoField label="Fixed Salary" value={formatCurrencyVal(bInfo.salaryAmount)} />
              <InfoField label="Booking Commission" value={`${bInfo.Bookingcommission ?? 0}%`} isMono />
              <InfoField label="Delivery Commission" value={`${bInfo.DeliveryCommission ?? 0}%`} isMono />
              <InfoField label="Commission Target" value={formatCurrencyVal(bInfo.commissionTarget)} />
              <InfoField label="Monthly Premises Rent" value={formatCurrencyVal(bInfo.monthlyRent)} />
              <InfoField label="Rent Due Date" value={bInfo.rentDueDate ? `Day ${bInfo.rentDueDate} of month` : "—"} />
              <InfoField label="Security Deposit" value={formatCurrencyVal(bInfo.deposite)} />
            </div>
          </FormCard>

          {/* Owner & Geofencing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormCard title="Owner Details" icon={UserIcon}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoField label="Owner Name" value={bInfo.ownerDetail?.name} />
                <InfoField label="Owner Email" value={bInfo.ownerDetail?.email} />
                <InfoField label="Owner Mobile 1" value={bInfo.ownerDetail?.mobile1} isMono />
                <InfoField label="Owner Mobile 2" value={bInfo.ownerDetail?.mobile2} isMono />
              </div>
            </FormCard>

            <FormCard title="Attendance Geofencing" icon={MapPin}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <InfoField label="Latitude" value={bInfo.attendanceLocation?.latitude} isMono />
                <InfoField label="Longitude" value={bInfo.attendanceLocation?.longitude} isMono />
                <InfoField label="Check-in Radius" value={bInfo.attendanceLocation?.distance || "100 Meters"} />
              </div>
            </FormCard>
          </div>
        </div>
      )}

      {/* ─── 5. TAB 3: Booking Preferences ─────────────────────────────────── */}
      {activeTab === "bookingPrefs" && (
        <div className="space-y-6">
          <FormCard title="Docket Booking Permissions" icon={SlidersHorizontal}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <InfoField
                label="Book With Bill"
                value={bPrefs.bookWithBill ? "Allowed" : "Disallowed"}
                isBadge
                badgeVariant={bPrefs.bookWithBill ? "success" : "danger"}
              />
              <InfoField
                label="Book Without Bill"
                value={bPrefs.bookWithoutBill ? "Allowed" : "Disallowed"}
                isBadge
                badgeVariant={bPrefs.bookWithoutBill ? "success" : "danger"}
              />
              <InfoField
                label="Allow Paid Bookings"
                value={bPrefs.allowPaidBooking ? "Allowed" : "Disallowed"}
                isBadge
                badgeVariant={bPrefs.allowPaidBooking ? "success" : "danger"}
              />
              <InfoField
                label="Allow To-Pay Bookings"
                value={bPrefs.allowToPayBooking ? "Allowed" : "Disallowed"}
                isBadge
                badgeVariant={bPrefs.allowToPayBooking ? "success" : "danger"}
              />
              <InfoField
                label="Allow GPay / Online"
                value={bPrefs.allowGPayBooking ? "Allowed" : "Disallowed"}
                isBadge
                badgeVariant={bPrefs.allowGPayBooking ? "success" : "danger"}
              />
              <InfoField
                label="Allow Credit Bookings"
                value={bPrefs.allowCreditBooking ? "Allowed" : "Disallowed"}
                isBadge
                badgeVariant={bPrefs.allowCreditBooking ? "success" : "warning"}
              />
              <InfoField
                label="Allow Not-Pay"
                value={bPrefs.allowNotPayBooking ? "Allowed" : "Disallowed"}
                isBadge
                badgeVariant={bPrefs.allowNotPayBooking ? "success" : "warning"}
              />
              <InfoField
                label="Draft Only Mode"
                value={bPrefs.draftOnlyBooking ? "Enabled" : "Disabled"}
                isBadge
                badgeVariant={bPrefs.draftOnlyBooking ? "warning" : "default"}
              />
            </div>
          </FormCard>

          <FormCard title="Default Charges & Limits" icon={IndianRupee}>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <InfoField label="Bilty Charge" value={formatCurrencyVal(bPrefs.biltyCharge ?? 20)} />
              <InfoField label="Hamali Cost" value={formatCurrencyVal(bPrefs.hamaliCost ?? 0)} />
              <InfoField label="Credit Limit" value={formatCurrencyVal(bPrefs.creditLimit ?? 0)} />
              <InfoField label="Credit Limit Utilized" value={formatCurrencyVal(bPrefs.creditLimitUtilize ?? 0)} />
              <InfoField label="Credit Limit Pending" value={formatCurrencyVal(bPrefs.creditLimitPending ?? 0)} />
            </div>
          </FormCard>
        </div>
      )}

      {/* ─── 6. TAB 4: KYC & Identity Documents ─────────────────────────────── */}
      {activeTab === "kyc" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Aadhar Card */}
            <FormCard title="Aadhar Card" icon={FileText}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoField label="Aadhar Number" value={aadhar.number} isMono />
                  <InfoField
                    label="Expiry Date"
                    value={aadhar.expiryDate ? new Date(aadhar.expiryDate).toLocaleDateString() : "—"}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DocumentPreviewCard
                    title="Aadhar Front"
                    fileUrl={extractImageUrl(aadhar.image)}
                    onPreview={(url, title) => setPreviewImage({ url, title })}
                  />
                  <DocumentPreviewCard
                    title="Aadhar Back"
                    fileUrl={extractImageUrl(aadhar.imageBack)}
                    onPreview={(url, title) => setPreviewImage({ url, title })}
                  />
                </div>
              </div>
            </FormCard>

            {/* PAN Card */}
            <FormCard title="PAN Card" icon={FileText}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoField label="PAN Number" value={pan.number} isMono />
                  <InfoField
                    label="Expiry Date"
                    value={pan.expiryDate ? new Date(pan.expiryDate).toLocaleDateString() : "—"}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DocumentPreviewCard
                    title="PAN Card Front"
                    fileUrl={extractImageUrl(pan.image)}
                    onPreview={(url, title) => setPreviewImage({ url, title })}
                  />
                  <DocumentPreviewCard
                    title="PAN Card Back"
                    fileUrl={extractImageUrl(pan.imageBack)}
                    onPreview={(url, title) => setPreviewImage({ url, title })}
                  />
                </div>
              </div>
            </FormCard>
          </div>

          {/* Rent Agreement (If Branch) */}
          {isBranchRole && (
            <FormCard title="Rent Agreement Contract" icon={FileText}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <InfoField label="Agreement Number" value={rentAg.number} isMono />
                  <InfoField
                    label="Expiry Date"
                    value={rentAg.expiryDate ? new Date(rentAg.expiryDate).toLocaleDateString() : "—"}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <DocumentPreviewCard
                    title="Agreement Front / Page 1"
                    fileUrl={extractImageUrl(rentAg.image)}
                    onPreview={(url, title) => setPreviewImage({ url, title })}
                  />
                  <DocumentPreviewCard
                    title="Agreement Back / Page 2"
                    fileUrl={extractImageUrl(rentAg.imageBack)}
                    onPreview={(url, title) => setPreviewImage({ url, title })}
                  />
                </div>
              </div>
            </FormCard>
          )}
        </div>
      )}

      {/* ─── 7. TAB 5: Bank Details ─────────────────────────────────────────── */}
      {activeTab === "bank" && (
        <div className="space-y-6">
          <FormCard title="Bank Settlement Account" icon={CreditCard}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <InfoField label="Account Holder Name" value={bank.accountHolderName} />
              <InfoField label="Bank Name" value={bank.bankName} />
              <InfoField label="Account Number" value={bank.accountNumber} isMono />
              <InfoField label="IFSC Code" value={bank.ifscCode} isMono />
            </div>
          </FormCard>

          <FormCard title="Passbook / Cheque Document" icon={FileText}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <DocumentPreviewCard
                title="Bank Passbook / Cheque"
                fileUrl={extractImageUrl(bank.passbookImage)}
                onPreview={(url, title) => setPreviewImage({ url, title })}
              />
            </div>
          </FormCard>
        </div>
      )}

      {/* ─── 8. TAB 6: Salary History ───────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Salary History */}
          <FormCard title="Salary History" icon={History}>
            {u.salaryHistory?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">Memo ID</th>
                      <th className="px-3 py-2.5">Month</th>
                      <th className="px-3 py-2.5">Year</th>
                      <th className="px-3 py-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-medium">
                    {u.salaryHistory.map((item: any, idx: number) => (
                      <tr key={item._id || idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 text-slate-500 font-bold">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-800">
                          {item.memoId || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-slate-800">{item.month || "—"}</td>
                        <td className="px-3 py-2.5 text-slate-800">{item.year || "—"}</td>
                        <td className="px-3 py-2.5 font-bold font-mono text-right text-emerald-700">
                          ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                No salary history records found.
              </div>
            )}
          </FormCard>

          {/* Rent History (if branch) */}
          {bInfo.rentHistory?.length > 0 && (
            <FormCard title="Rent Payments History" icon={History}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Amount (₹)</th>
                      <th className="px-3 py-2.5">Payment Ref</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-medium">
                    {bInfo.rentHistory.map((item: any, idx: number) => (
                      <tr key={item._id || idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 text-slate-500 font-bold">{idx + 1}</td>
                        <td className="px-3 py-2.5 text-slate-800">{item.date || "—"}</td>
                        <td className="px-3 py-2.5 font-bold font-mono text-emerald-700">
                          ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-600">
                          {item.ref || item.paymentId || "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            {item.status || "Paid"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FormCard>
          )}
        </div>
      )}

      {/* ─── Modal: Customer Booking QR Code (Full Screen / Large View) ──────── */}
      {qrModalOpen && (
        <AppModal
          open={qrModalOpen}
          onOpenChange={(open) => setQrModalOpen(open)}
          title="Customer Booking QR Code"
          maxWidth="sm:max-w-md"
        >
          <div className="flex flex-col items-center justify-center text-center p-3 space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-black">
                {bInfo.branchName || u.name || "Bajrang Parcel Service"}
              </h3>
              {branchCode && (
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  Branch Code: {branchCode}
                </span>
              )}
            </div>

            {/* High-res QR Code SVG Display */}
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-md flex items-center justify-center">
              <div dangerouslySetInnerHTML={{ __html: qrSvgLarge }} />
            </div>

            <p className="text-xs text-slate-600 font-medium max-w-xs">
              Scan this QR code from any smartphone to open the Online Parcel Booking form with this branch automatically selected.
            </p>

            {/* URL Box & Copy */}
            <div className="w-full flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
              <input
                type="text"
                readOnly
                value={customerBookingUrl}
                className="flex-1 bg-transparent border-0 outline-none text-slate-700 text-[11px] font-mono px-1 truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                title="Copy Link"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 text-[11px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 w-full pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadQr}
                className="h-9 font-bold border-slate-300 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
              >
                <Download className="w-4 h-4 mr-1 text-slate-600" />
                Download
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrintQr}
                className="h-9 font-bold border-slate-300 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
              >
                <Printer className="w-4 h-4 mr-1 text-slate-600" />
                Print
              </Button>

              <a
                href={customerBookingUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full"
              >
                <Button
                  type="button"
                  size="sm"
                  className="w-full h-9 font-bold bg-[#2980b9] hover:bg-[#1b4f72] text-white cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Open
                </Button>
              </a>
            </div>
          </div>
        </AppModal>
      )}

      {/* ─── Lightbox Modal for Photo / KYC Preview ─────────────────────────── */}
      {previewImage && (
        <AppModal
          open={Boolean(previewImage)}
          onOpenChange={(open) => !open && setPreviewImage(null)}
          title={previewImage.title}
          maxWidth="sm:max-w-2xl"
        >
          <div className="flex flex-col items-center justify-center p-2">
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-h-[70vh] w-auto max-w-full rounded-lg shadow object-contain"
            />
            <div className="mt-4 flex items-center justify-end w-full gap-2">
              <a
                href={previewImage.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-[#2980b9] text-white hover:bg-[#1b4f72] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Full Original
              </a>
            </div>
          </div>
        </AppModal>
      )}
    </div>
  );
}
