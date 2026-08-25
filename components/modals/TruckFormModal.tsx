"use client";

import React, { useState, useEffect } from "react";
import {
  Truck as TruckIcon,
  User,
  FileText,
  CreditCard,
  Camera,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Info,
  SlidersHorizontal,
  ShieldCheck,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { FormCard } from "@/components/ui/form-card";
import { FileUploadPreview } from "@/components/ui/file-upload-preview";
import AppModal from "@/components/ui/AppModal";
import { useUpload, useUserById, useDriverDropdownList } from "@/lib/hooks";
import type { TruckUser, TruckPayload, DriverDropdownItem } from "@/lib/api/truck";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface TruckFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  editId?: string | null;
  editData?: TruckUser | null;
  isLoading?: boolean;
  onSubmit: (payload: TruckPayload) => void;
}

export interface TruckFormErrors {
  [key: string]: string | undefined;
}

// ─── Select Options ────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const BOOLEAN_OPTIONS = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

// Helper to format ISO date string to YYYY-MM-DD
function formatDateForInput(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

// ─── Initial State Helper ──────────────────────────────────────────────────────

function getInitialState(mode: "add" | "edit", user?: TruckUser | null) {
  const truckInfo = user?.truckInfo || {};
  const docs = truckInfo.documents || {};
  const owner = truckInfo.ownerDetail || {};
  const ownerDocs = owner.documents || {};
  const bookingPref = user?.bookingPreferences || {};

  // Extract photo string or object
  const extractPhotoUrl = (val: unknown): string => {
    if (typeof val === "string") return val;
    if (val && typeof val === "object" && "image" in val && typeof (val as { image?: string }).image === "string") {
      return (val as { image: string }).image;
    }
    return "";
  };

  const profileUrl = extractPhotoUrl(user?.profilePhoto);
  const passportUrl = extractPhotoUrl(user?.passportSizePhoto);
  const passbookUrl = extractPhotoUrl(user?.bankDetails?.passbookImage);
  const truckImageUrl = extractPhotoUrl(truckInfo.truckImage);

  // Driver ID
  const driverId =
    typeof truckInfo.driverId === "object" && truckInfo.driverId
      ? truckInfo.driverId._id
      : typeof truckInfo.driverId === "string"
      ? truckInfo.driverId
      : "";

  return {
    // Basic Details
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    password: "",
    confirmPassword: "",
    status: user?.status || "active",

    // Truck Info
    truckNumber: truckInfo.truckNumber || "",
    driverId: driverId || "",
    truckImageName: truckImageUrl ? "truck_image.jpg" : "",
    truckImageUrl: truckImageUrl,

    // Owner Details
    ownerName: owner.name || "",
    ownerMobile1: owner.mobile1 || "",
    ownerMobile2: owner.mobile2 || "",
    ownerAadharNumber: ownerDocs.aadhar?.number || "",
    ownerAadharName: ownerDocs.aadhar?.image ? "owner_aadhar.jpg" : "",
    ownerAadharUrl: ownerDocs.aadhar?.image || "",
    ownerPanNumber: ownerDocs.pan?.number || "",
    ownerPanName: ownerDocs.pan?.image ? "owner_pan.jpg" : "",
    ownerPanUrl: ownerDocs.pan?.image || "",

    // Truck Documents
    rcNumber: docs.rc?.number || "",
    rcExpiryDate: formatDateForInput(docs.rc?.expiryDate),
    rcFileName: docs.rc?.image ? "rc_doc.jpg" : "",
    rcFileUrl: docs.rc?.image || "",

    pucNumber: docs.puc?.number || "",
    pucExpiryDate: formatDateForInput(docs.puc?.expiryDate),
    pucFileName: docs.puc?.image ? "puc_doc.jpg" : "",
    pucFileUrl: docs.puc?.image || "",

    insuranceNumber: docs.insurance?.number || "",
    insuranceExpiryDate: formatDateForInput(docs.insurance?.expiryDate),
    insuranceFileName: docs.insurance?.image ? "insurance_doc.jpg" : "",
    insuranceFileUrl: docs.insurance?.image || "",

    fitnessNumber: docs.fitness?.number || "",
    fitnessExpiryDate: formatDateForInput(docs.fitness?.expiryDate),
    fitnessFileName: docs.fitness?.image ? "fitness_doc.jpg" : "",
    fitnessFileUrl: docs.fitness?.image || "",

    permitNumber: docs.permit?.number || "",
    permitExpiryDate: formatDateForInput(docs.permit?.expiryDate),
    permitFileName: docs.permit?.image ? "permit_doc.jpg" : "",
    permitFileUrl: docs.permit?.image || "",

    roadTaxNumber: docs.roadTax?.number || "",
    roadTaxExpiryDate: formatDateForInput(docs.roadTax?.expiryDate),
    roadTaxFileName: docs.roadTax?.image ? "road_tax_doc.jpg" : "",
    roadTaxFileUrl: docs.roadTax?.image || "",

    weightReceiptNumber: docs.weightCertificate?.receiptNumber || "",
    weightAmount:
      docs.weightCertificate?.weight !== undefined && docs.weightCertificate?.weight !== null
        ? String(docs.weightCertificate.weight)
        : "0",
    weightFileName: docs.weightCertificate?.image ? "weight_cert.jpg" : "",
    weightFileUrl: docs.weightCertificate?.image || "",

    // Profile Photos
    profilePhotoName: profileUrl ? "profile_photo.jpg" : "",
    profilePhotoUrl: profileUrl,
    passportPhotoName: passportUrl ? "passport_photo.jpg" : "",
    passportPhotoUrl: passportUrl,

    // Bank Details
    bankAccountNumber: user?.bankDetails?.accountNumber || "",
    bankIfscCode: user?.bankDetails?.ifscCode || "",
    bankName: user?.bankDetails?.bankName || "",
    bankAccountHolder: user?.bankDetails?.accountHolderName || "",
    passbookFileName: passbookUrl ? "passbook.jpg" : "",
    passbookFileUrl: passbookUrl,

    // Booking Preferences
    bookWithBill: String(bookingPref.bookWithBill ?? "true"),
    bookWithoutBill: String(bookingPref.bookWithoutBill ?? "true"),
    allowPaidBooking: String(bookingPref.allowPaidBooking ?? "true"),
    allowToPayBooking: String(bookingPref.allowToPayBooking ?? "true"),
    allowGPayBooking: String(bookingPref.allowGPayBooking ?? "true"),
    allowCreditBooking: String(bookingPref.allowCreditBooking ?? "false"),
    allowNotPayBooking: String(bookingPref.allowNotPayBooking ?? "false"),
    draftOnlyBooking: String(bookingPref.draftOnlyBooking ?? "false"),
    creditLimit:
      bookingPref.creditLimit !== undefined && bookingPref.creditLimit !== null
        ? String(bookingPref.creditLimit)
        : "0",
    hamaliCost:
      bookingPref.hamaliCost !== undefined && bookingPref.hamaliCost !== null
        ? String(bookingPref.hamaliCost)
        : "0",
    biltyCharge:
      bookingPref.biltyCharge !== undefined && bookingPref.biltyCharge !== null
        ? String(bookingPref.biltyCharge)
        : "20",
  };
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function TruckFormModal({
  open,
  onOpenChange,
  mode,
  editId,
  editData,
  isLoading = false,
  onSubmit,
}: TruckFormModalProps) {
  const targetId = mode === "edit" ? editId || editData?._id : null;

  // Live single user fetch via GET /user/:id on edit mode
  const { data: userDetailRes, isFetching: isFetchingUser } = useUserById<TruckUser>(
    targetId,
    Boolean(open && mode === "edit" && targetId)
  );

  // Fetch drivers dropdown list
  const { data: driverListRes, isLoading: isLoadingDrivers } = useDriverDropdownList();
  const rawDrivers = Array.isArray(driverListRes?.data)
    ? driverListRes.data
    : driverListRes?.data?.users || [];

  const driverOptions = rawDrivers.map((d: DriverDropdownItem) => ({
    value: d._id,
    label: d.name ? `${d.name} (${d.mobile || "No mobile"})` : d.mobile || d._id,
  }));

  const rawUser = userDetailRes?.data;
  const activeUserData: TruckUser | null =
    rawUser && typeof rawUser === "object" && "user" in rawUser && rawUser.user
      ? (rawUser.user as TruckUser)
      : (rawUser as TruckUser) || editData || null;

  const [form, setForm] = useState(() => getInitialState(mode, activeUserData));
  const [errors, setErrors] = useState<TruckFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { uploadFile, uploadingFields } = useUpload();

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setForm(getInitialState(mode, activeUserData));
      setErrors({});
      setShowPassword(false);
      setShowConfirm(false);
    }
  }, [open, mode]);

  // Sync form when fresh activeUserData is received from GET /user/:id
  useEffect(() => {
    if (open && activeUserData) {
      setForm(getInitialState(mode, activeUserData));
    }
  }, [activeUserData]);

  // ─── Field Change Handlers ─────────────────────────────────────────────────

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // ─── Document Upload Handler ───────────────────────────────────────────────

  const handleDocumentUpload = async (
    file: File,
    nameField: string,
    urlField: string,
    fieldKey: string
  ) => {
    try {
      const res = await uploadFile(file, fieldKey);
      if (res && res.url) {
        setForm((prev) => ({
          ...prev,
          [nameField]: file.name,
          [urlField]: res.url,
        }));
      }
    } catch {
      // Error handled by upload hook
    }
  };

  // ─── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: TruckFormErrors = {};

    if (!form.name.trim()) errs.name = "Truck/User name is required";
    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Invalid email format";
    }

    if (!form.mobile.trim()) {
      errs.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(form.mobile.trim())) {
      errs.mobile = "Mobile number must be exactly 10 digits";
    }

    if (mode === "add") {
      if (!form.password) {
        errs.password = "Password is required for new truck account";
      } else if (form.password.length < 6) {
        errs.password = "Password must be at least 6 characters";
      }

      if (!form.confirmPassword) {
        errs.confirmPassword = "Confirm password is required";
      } else if (form.password !== form.confirmPassword) {
        errs.confirmPassword = "Passwords do not match";
      }
    } else if (form.password) {
      if (form.password.length < 6) {
        errs.password = "Password must be at least 6 characters";
      }
      if (form.password !== form.confirmPassword) {
        errs.confirmPassword = "Passwords do not match";
      }
    }

    if (!form.truckNumber.trim()) {
      errs.truckNumber = "Truck number is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Submit Handler ────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: TruckPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      status: form.status,

      // Profile & Passport Photos
      profilePhoto: { image: form.profilePhotoUrl },
      passportSizePhoto: { image: form.passportPhotoUrl },

      // Bank Details
      bankDetails: {
        accountNumber: form.bankAccountNumber.trim(),
        ifscCode: form.bankIfscCode.trim(),
        bankName: form.bankName.trim(),
        accountHolderName: form.bankAccountHolder.trim(),
        passbookImage: form.passbookFileUrl,
      },

      // Truck Info
      truckInfo: {
        truckNumber: form.truckNumber.trim().toUpperCase(),
        truckImage: form.truckImageUrl,
        driverId: form.driverId || undefined,

        // Truck Documents
        documents: {
          rc: {
            number: form.rcNumber.trim(),
            image: form.rcFileUrl,
            expiryDate: form.rcExpiryDate ? new Date(form.rcExpiryDate).toISOString() : undefined,
          },
          puc: {
            number: form.pucNumber.trim(),
            image: form.pucFileUrl,
            expiryDate: form.pucExpiryDate ? new Date(form.pucExpiryDate).toISOString() : undefined,
          },
          insurance: {
            number: form.insuranceNumber.trim(),
            image: form.insuranceFileUrl,
            expiryDate: form.insuranceExpiryDate ? new Date(form.insuranceExpiryDate).toISOString() : undefined,
          },
          fitness: {
            number: form.fitnessNumber.trim(),
            image: form.fitnessFileUrl,
            expiryDate: form.fitnessExpiryDate ? new Date(form.fitnessExpiryDate).toISOString() : undefined,
          },
          permit: {
            number: form.permitNumber.trim(),
            image: form.permitFileUrl,
            expiryDate: form.permitExpiryDate ? new Date(form.permitExpiryDate).toISOString() : undefined,
          },
          roadTax: {
            number: form.roadTaxNumber.trim(),
            image: form.roadTaxFileUrl,
            expiryDate: form.roadTaxExpiryDate ? new Date(form.roadTaxExpiryDate).toISOString() : undefined,
          },
          weightCertificate: {
            receiptNumber: form.weightReceiptNumber.trim(),
            weight: Number(form.weightAmount) || 0,
            image: form.weightFileUrl,
          },
        },

        // Owner Details
        ownerDetail: {
          name: form.ownerName.trim(),
          mobile1: form.ownerMobile1.trim(),
          mobile2: form.ownerMobile2.trim(),
          documents: {
            aadhar: {
              number: form.ownerAadharNumber.trim(),
              image: form.ownerAadharUrl,
            },
            pan: {
              number: form.ownerPanNumber.trim().toUpperCase(),
              image: form.ownerPanUrl,
            },
          },
        },
      },

      // Booking Preferences
      bookingPreferences: {
        bookWithBill: form.bookWithBill === "true",
        bookWithoutBill: form.bookWithoutBill === "true",
        allowPaidBooking: form.allowPaidBooking === "true",
        allowToPayBooking: form.allowToPayBooking === "true",
        allowGPayBooking: form.allowGPayBooking === "true",
        allowCreditBooking: form.allowCreditBooking === "true",
        allowNotPayBooking: form.allowNotPayBooking === "true",
        draftOnlyBooking: form.draftOnlyBooking === "true",
        creditLimit: Number(form.creditLimit) || 0,
        hamaliCost: Number(form.hamaliCost) || 0,
        biltyCharge: Number(form.biltyCharge) || 0,
      },
    };

    if (form.password) {
      payload.password = form.password;
    }

    onSubmit(payload);
  };

  const isAnyUploading = Object.values(uploadingFields).some(Boolean);
  const isSubmitting = isLoading || isAnyUploading;

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      maxWidth="sm:max-w-4xl"
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-[#2980b9]/10 text-[#2980b9]">
            <TruckIcon className="w-4 h-4" />
          </div>
          <span>{mode === "add" ? "Register New Truck" : "Edit Truck Details"}</span>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-8 px-4 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="truck-form-modal"
            size="sm"
            disabled={isSubmitting || isFetchingUser}
            className="h-8 px-4 text-xs font-semibold bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                {isAnyUploading ? "Uploading files..." : "Saving..."}
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {mode === "add" ? "Register Truck" : "Update Truck"}
              </>
            )}
          </Button>
        </div>
      }
    >
      {/* Loading state when fetching single user details */}
      {isFetchingUser && mode === "edit" ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#2980b9]" />
          <span className="text-xs font-medium text-slate-500">
            Loading truck details...
          </span>
        </div>
      ) : (
        <form
          id="truck-form-modal"
          onSubmit={handleSubmit}
          className="space-y-3.5 py-1"
        >
          {/* ─── SECTION 1: BASIC INFORMATION ─── */}
          <FormCard title="Basic Information" icon={User}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <FormInput
                label="Truck Account Name"
                placeholder="e.g. TRUCK_01 SINGH"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                error={errors.name}
                required
              />

              <FormInput
                label="Email Address"
                type="email"
                placeholder="truck@bajrang.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                error={errors.email}
                required
              />

              <FormInput
                label="Mobile Number"
                type="tel"
                placeholder="10-digit mobile number"
                value={form.mobile}
                maxLength={10}
                onChange={(e) => update("mobile", e.target.value.replace(/\D/g, ""))}
                error={errors.mobile}
                required
              />

              <FormInput
                label={mode === "add" ? "Password" : "Password (Optional)"}
                type={showPassword ? "text" : "password"}
                placeholder={mode === "add" ? "Create password" : "Leave blank to keep"}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                error={errors.password}
                required={mode === "add"}
                endIcon={
                  <button
                    type="button"
                    className="pointer-events-auto text-slate-500 hover:text-slate-700"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                }
              />

              <FormInput
                label="Confirm Password"
                type={showConfirm ? "text" : "password"}
                placeholder={mode === "add" ? "Confirm password" : "Confirm new password"}
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                error={errors.confirmPassword}
                required={mode === "add" || Boolean(form.password)}
                endIcon={
                  <button
                    type="button"
                    className="pointer-events-auto text-slate-500 hover:text-slate-700"
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                  >
                    {showConfirm ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                }
              />

              <FormSelect
                label="Status"
                options={STATUS_OPTIONS}
                value={form.status}
                onChange={(val) => val && update("status", val)}
              />
            </div>
          </FormCard>

          {/* ─── SECTION 2: TRUCK & DRIVER INFORMATION ─── */}
          <FormCard title="Truck & Driver Information" icon={TruckIcon}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 items-end">
              <FormInput
                uppercase
                label="Truck Number"
                placeholder="e.g. GJ-15-10892"
                value={form.truckNumber}
                onChange={(e) => update("truckNumber", e.target.value.toUpperCase())}
                error={errors.truckNumber}
                required
              />

              <FormSelect
                label="Assigned Driver"
                placeholder={isLoadingDrivers ? "Loading drivers..." : "Select driver"}
                options={driverOptions}
                value={form.driverId}
                onChange={(val) => update("driverId", val || "")}
                clearable
              />

              <div>
                <FileUploadPreview
                  label="Truck Photo"
                  fileName={form.truckImageName}
                  fileUrl={form.truckImageUrl}
                  isUploading={uploadingFields["truckImage"]}
                  accept="image/*"
                  onFileSelect={(file) =>
                    handleDocumentUpload(
                      file,
                      "truckImageName",
                      "truckImageUrl",
                      "truckImage"
                    )
                  }
                  onRemove={() =>
                    setForm((p) => ({
                      ...p,
                      truckImageName: "",
                      truckImageUrl: "",
                    }))
                  }
                />
              </div>
            </div>
          </FormCard>

          {/* ─── SECTION 3: OWNER DETAILS, KYC & BANK (Collapsible) ─── */}
          <FormCard
            title="Owner Details & KYC"
            icon={User}
            collapsible
            defaultOpen={false}
          >
            <div className="space-y-3">
              {/* Owner Basic Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <FormInput
                  label="Owner Name"
                  placeholder="Enter owner full name"
                  value={form.ownerName}
                  onChange={(e) => update("ownerName", e.target.value)}
                />

                <FormInput
                  label="Owner Mobile 1"
                  type="tel"
                  placeholder="10-digit primary mobile"
                  value={form.ownerMobile1}
                  maxLength={10}
                  onChange={(e) =>
                    update("ownerMobile1", e.target.value.replace(/\D/g, ""))
                  }
                />

                <FormInput
                  label="Owner Mobile 2 (Alternate)"
                  type="tel"
                  placeholder="Alternate mobile"
                  value={form.ownerMobile2}
                  maxLength={10}
                  onChange={(e) =>
                    update("ownerMobile2", e.target.value.replace(/\D/g, ""))
                  }
                />
              </div>

              {/* Owner KYC Documents & Photos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                {/* 1. Aadhar Card */}
                <div className="p-2 bg-slate-50/50 rounded border border-slate-200 space-y-1.5">
                  <div className="text-xs font-bold text-black flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-slate-600" />
                    <span>Owner Aadhar Card</span>
                  </div>
                  <FormInput
                    placeholder="12-digit Aadhar Number"
                    maxLength={12}
                    value={form.ownerAadharNumber}
                    onChange={(e) =>
                      update("ownerAadharNumber", e.target.value.replace(/\D/g, ""))
                    }
                  />
                  <FileUploadPreview
                    label="Aadhar Card Document"
                    fileName={form.ownerAadharName}
                    fileUrl={form.ownerAadharUrl}
                    isUploading={uploadingFields["ownerAadhar"]}
                    onFileSelect={(file) =>
                      handleDocumentUpload(
                        file,
                        "ownerAadharName",
                        "ownerAadharUrl",
                        "ownerAadhar"
                      )
                    }
                    onRemove={() =>
                      setForm((p) => ({
                        ...p,
                        ownerAadharName: "",
                        ownerAadharUrl: "",
                      }))
                    }
                  />
                </div>

                {/* 2. PAN Card */}
                <div className="p-2 bg-slate-50/50 rounded border border-slate-200 space-y-1.5">
                  <div className="text-xs font-bold text-black flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-slate-600" />
                    <span>Owner PAN Card</span>
                  </div>
                  <FormInput
                    uppercase
                    placeholder="10-digit PAN"
                    maxLength={10}
                    value={form.ownerPanNumber}
                    onChange={(e) =>
                      update("ownerPanNumber", e.target.value.toUpperCase())
                    }
                  />
                  <FileUploadPreview
                    label="PAN Card Document"
                    fileName={form.ownerPanName}
                    fileUrl={form.ownerPanUrl}
                    isUploading={uploadingFields["ownerPan"]}
                    onFileSelect={(file) =>
                      handleDocumentUpload(
                        file,
                        "ownerPanName",
                        "ownerPanUrl",
                        "ownerPan"
                      )
                    }
                    onRemove={() =>
                      setForm((p) => ({
                        ...p,
                        ownerPanName: "",
                        ownerPanUrl: "",
                      }))
                    }
                  />
                </div>

                {/* 3. Photos (Passport & Profile) */}
                <div className="p-2 bg-slate-50/50 rounded border border-slate-200 space-y-1.5">
                  <div className="text-xs font-bold text-black flex items-center gap-1">
                    <Camera className="w-3 h-3 text-slate-600" />
                    <span>Photos</span>
                  </div>
                  <div className="space-y-1.5">
                    <FileUploadPreview
                      label="Passport Photo"
                      fileName={form.passportPhotoName}
                      fileUrl={form.passportPhotoUrl}
                      isUploading={uploadingFields["passportPhoto"]}
                      accept="image/*"
                      onFileSelect={(file) =>
                        handleDocumentUpload(
                          file,
                          "passportPhotoName",
                          "passportPhotoUrl",
                          "passportPhoto"
                        )
                      }
                      onRemove={() =>
                        setForm((p) => ({
                          ...p,
                          passportPhotoName: "",
                          passportPhotoUrl: "",
                        }))
                      }
                    />
                    <FileUploadPreview
                      label="Profile Photo"
                      fileName={form.profilePhotoName}
                      fileUrl={form.profilePhotoUrl}
                      isUploading={uploadingFields["profilePhoto"]}
                      accept="image/*"
                      onFileSelect={(file) =>
                        handleDocumentUpload(
                          file,
                          "profilePhotoName",
                          "profilePhotoUrl",
                          "profilePhoto"
                        )
                      }
                      onRemove={() =>
                        setForm((p) => ({
                          ...p,
                          profilePhotoName: "",
                          profilePhotoUrl: "",
                        }))
                      }
                    />
                  </div>
                </div>

                {/* 4. Bank Account Details (Span full width) */}
                <div className="sm:col-span-2 lg:col-span-3 p-2 bg-slate-50/50 rounded border border-slate-200 space-y-1.5">
                  <div className="text-xs font-bold text-black flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-slate-600" />
                    <span>Bank Account Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <FormInput
                      placeholder="Account Number"
                      value={form.bankAccountNumber}
                      onChange={(e) => update("bankAccountNumber", e.target.value)}
                    />
                    <FormInput
                      uppercase
                      placeholder="IFSC Code"
                      value={form.bankIfscCode}
                      onChange={(e) =>
                        update("bankIfscCode", e.target.value.toUpperCase())
                      }
                    />
                    <FormInput
                      placeholder="Bank Name"
                      value={form.bankName}
                      onChange={(e) => update("bankName", e.target.value)}
                    />
                    <FormInput
                      placeholder="Account Holder"
                      value={form.bankAccountHolder}
                      onChange={(e) => update("bankAccountHolder", e.target.value)}
                    />
                  </div>
                  <FileUploadPreview
                    label="Passbook / Cheque"
                    fileName={form.passbookFileName}
                    fileUrl={form.passbookFileUrl}
                    isUploading={uploadingFields["passbook"]}
                    onFileSelect={(file) =>
                      handleDocumentUpload(
                        file,
                        "passbookFileName",
                        "passbookFileUrl",
                        "passbook"
                      )
                    }
                    onRemove={() =>
                      setForm((p) => ({
                        ...p,
                        passbookFileName: "",
                        passbookFileUrl: "",
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </FormCard>

          {/* ─── SECTION 4: TRUCK DOCUMENTS (Collapsible) ─── */}
          <FormCard
            title="Truck Documents & Certificates"
            icon={ShieldCheck}
            collapsible
            defaultOpen={false}
          >
            {/* 5MB Guideline Info Banner */}
            <div className="p-2 rounded bg-blue-50/80 border border-blue-200/80 text-[11px] text-slate-700 flex items-center gap-1.5 mb-2">
              <Info className="w-3.5 h-3.5 text-[#2980b9] shrink-0" />
              <span>
                <strong>Note:</strong> Maximum file size allowed is <strong>5MB</strong> per document. Supported formats: JPG, PNG, WEBP, PDF.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {/* 1. RC (Registration Certificate) */}
              <div className="p-2 bg-slate-50/50 rounded border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-black flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-600" />
                  <span>RC (Registration)</span>
                </div>
                <FormInput
                  uppercase
                  placeholder="RC Number"
                  value={form.rcNumber}
                  onChange={(e) => update("rcNumber", e.target.value.toUpperCase())}
                />
                <FormInput
                  label="RC Expiry Date"
                  type="date"
                  value={form.rcExpiryDate}
                  onChange={(e) => update("rcExpiryDate", e.target.value)}
                />
                <FileUploadPreview
                  label="RC Document"
                  fileName={form.rcFileName}
                  fileUrl={form.rcFileUrl}
                  isUploading={uploadingFields["rcDoc"]}
                  onFileSelect={(file) =>
                    handleDocumentUpload(file, "rcFileName", "rcFileUrl", "rcDoc")
                  }
                  onRemove={() =>
                    setForm((p) => ({ ...p, rcFileName: "", rcFileUrl: "" }))
                  }
                />
              </div>

              {/* 2. PUC Certificate */}
              <div className="p-2 bg-slate-50/50 rounded border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-black flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-600" />
                  <span>PUC Certificate</span>
                </div>
                <FormInput
                  uppercase
                  placeholder="PUC Number"
                  value={form.pucNumber}
                  onChange={(e) => update("pucNumber", e.target.value.toUpperCase())}
                />
                <FormInput
                  label="PUC Expiry Date"
                  type="date"
                  value={form.pucExpiryDate}
                  onChange={(e) => update("pucExpiryDate", e.target.value)}
                />
                <FileUploadPreview
                  label="PUC Document"
                  fileName={form.pucFileName}
                  fileUrl={form.pucFileUrl}
                  isUploading={uploadingFields["pucDoc"]}
                  onFileSelect={(file) =>
                    handleDocumentUpload(file, "pucFileName", "pucFileUrl", "pucDoc")
                  }
                  onRemove={() =>
                    setForm((p) => ({ ...p, pucFileName: "", pucFileUrl: "" }))
                  }
                />
              </div>

              {/* 3. Insurance Policy */}
              <div className="p-2 bg-slate-50/50 rounded border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-black flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-slate-600" />
                  <span>Insurance Policy</span>
                </div>
                <FormInput
                  uppercase
                  placeholder="Policy Number"
                  value={form.insuranceNumber}
                  onChange={(e) => update("insuranceNumber", e.target.value.toUpperCase())}
                />
                <FormInput
                  label="Insurance Expiry Date"
                  type="date"
                  value={form.insuranceExpiryDate}
                  onChange={(e) => update("insuranceExpiryDate", e.target.value)}
                />
                <FileUploadPreview
                  label="Insurance Document"
                  fileName={form.insuranceFileName}
                  fileUrl={form.insuranceFileUrl}
                  isUploading={uploadingFields["insuranceDoc"]}
                  onFileSelect={(file) =>
                    handleDocumentUpload(
                      file,
                      "insuranceFileName",
                      "insuranceFileUrl",
                      "insuranceDoc"
                    )
                  }
                  onRemove={() =>
                    setForm((p) => ({
                      ...p,
                      insuranceFileName: "",
                      insuranceFileUrl: "",
                    }))
                  }
                />
              </div>

              {/* 4. Fitness Certificate */}
              <div className="p-2 bg-slate-50/50 rounded border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-black flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-600" />
                  <span>Fitness Certificate</span>
                </div>
                <FormInput
                  uppercase
                  placeholder="Fitness Number"
                  value={form.fitnessNumber}
                  onChange={(e) => update("fitnessNumber", e.target.value.toUpperCase())}
                />
                <FormInput
                  label="Fitness Expiry Date"
                  type="date"
                  value={form.fitnessExpiryDate}
                  onChange={(e) => update("fitnessExpiryDate", e.target.value)}
                />
                <FileUploadPreview
                  label="Fitness Document"
                  fileName={form.fitnessFileName}
                  fileUrl={form.fitnessFileUrl}
                  isUploading={uploadingFields["fitnessDoc"]}
                  onFileSelect={(file) =>
                    handleDocumentUpload(
                      file,
                      "fitnessFileName",
                      "fitnessFileUrl",
                      "fitnessDoc"
                    )
                  }
                  onRemove={() =>
                    setForm((p) => ({
                      ...p,
                      fitnessFileName: "",
                      fitnessFileUrl: "",
                    }))
                  }
                />
              </div>

              {/* 5. Permit Document */}
              <div className="p-2 bg-slate-50/50 rounded border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-black flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-600" />
                  <span>Permit Document</span>
                </div>
                <FormInput
                  uppercase
                  placeholder="Permit Number"
                  value={form.permitNumber}
                  onChange={(e) => update("permitNumber", e.target.value.toUpperCase())}
                />
                <FormInput
                  label="Permit Expiry Date"
                  type="date"
                  value={form.permitExpiryDate}
                  onChange={(e) => update("permitExpiryDate", e.target.value)}
                />
                <FileUploadPreview
                  label="Permit Document"
                  fileName={form.permitFileName}
                  fileUrl={form.permitFileUrl}
                  isUploading={uploadingFields["permitDoc"]}
                  onFileSelect={(file) =>
                    handleDocumentUpload(
                      file,
                      "permitFileName",
                      "permitFileUrl",
                      "permitDoc"
                    )
                  }
                  onRemove={() =>
                    setForm((p) => ({
                      ...p,
                      permitFileName: "",
                      permitFileUrl: "",
                    }))
                  }
                />
              </div>

              {/* 6. Road Tax */}
              <div className="p-2 bg-slate-50/50 rounded border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-black flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-600" />
                  <span>Road Tax</span>
                </div>
                <FormInput
                  uppercase
                  placeholder="Road Tax Number"
                  value={form.roadTaxNumber}
                  onChange={(e) => update("roadTaxNumber", e.target.value.toUpperCase())}
                />
                <FormInput
                  label="Tax Expiry Date"
                  type="date"
                  value={form.roadTaxExpiryDate}
                  onChange={(e) => update("roadTaxExpiryDate", e.target.value)}
                />
                <FileUploadPreview
                  label="Road Tax Document"
                  fileName={form.roadTaxFileName}
                  fileUrl={form.roadTaxFileUrl}
                  isUploading={uploadingFields["roadTaxDoc"]}
                  onFileSelect={(file) =>
                    handleDocumentUpload(
                      file,
                      "roadTaxFileName",
                      "roadTaxFileUrl",
                      "roadTaxDoc"
                    )
                  }
                  onRemove={() =>
                    setForm((p) => ({
                      ...p,
                      roadTaxFileName: "",
                      roadTaxFileUrl: "",
                    }))
                  }
                />
              </div>

              {/* 7. Weight Certificate (Span on lg) */}
              <div className="sm:col-span-2 lg:col-span-3 p-2 bg-slate-50/50 rounded border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-black flex items-center gap-1">
                  <Scale className="w-3 h-3 text-slate-600" />
                  <span>Weight Certificate</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <FormInput
                    placeholder="Receipt / Cert Number"
                    value={form.weightReceiptNumber}
                    onChange={(e) => update("weightReceiptNumber", e.target.value)}
                  />
                  <FormInput
                    type="number"
                    min="0"
                    placeholder="Weight (kg)"
                    value={form.weightAmount}
                    onChange={(e) => update("weightAmount", e.target.value)}
                  />
                </div>
                <FileUploadPreview
                  label="Weight Certificate Document"
                  fileName={form.weightFileName}
                  fileUrl={form.weightFileUrl}
                  isUploading={uploadingFields["weightDoc"]}
                  onFileSelect={(file) =>
                    handleDocumentUpload(
                      file,
                      "weightFileName",
                      "weightFileUrl",
                      "weightDoc"
                    )
                  }
                  onRemove={() =>
                    setForm((p) => ({
                      ...p,
                      weightFileName: "",
                      weightFileUrl: "",
                    }))
                  }
                />
              </div>
            </div>
          </FormCard>

          {/* ─── SECTION 5: BOOKING PREFERENCES (Collapsible) ─── */}
          <FormCard
            title="Booking Preferences"
            icon={SlidersHorizontal}
            collapsible
            defaultOpen={false}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <FormSelect
                label="Book With Bill"
                options={BOOLEAN_OPTIONS}
                value={form.bookWithBill}
                onChange={(val) => val && update("bookWithBill", val)}
              />

              <FormSelect
                label="Book Without Bill"
                options={BOOLEAN_OPTIONS}
                value={form.bookWithoutBill}
                onChange={(val) => val && update("bookWithoutBill", val)}
              />

              <FormSelect
                label="Allow Paid Booking"
                options={BOOLEAN_OPTIONS}
                value={form.allowPaidBooking}
                onChange={(val) => val && update("allowPaidBooking", val)}
              />

              <FormSelect
                label="Allow To-Pay Booking"
                options={BOOLEAN_OPTIONS}
                value={form.allowToPayBooking}
                onChange={(val) => val && update("allowToPayBooking", val)}
              />

              <FormSelect
                label="Allow GPay Booking"
                options={BOOLEAN_OPTIONS}
                value={form.allowGPayBooking}
                onChange={(val) => val && update("allowGPayBooking", val)}
              />

              <FormSelect
                label="Allow Credit Booking"
                options={BOOLEAN_OPTIONS}
                value={form.allowCreditBooking}
                onChange={(val) => val && update("allowCreditBooking", val)}
              />

              <FormSelect
                label="Allow Not-Pay Booking"
                options={BOOLEAN_OPTIONS}
                value={form.allowNotPayBooking}
                onChange={(val) => val && update("allowNotPayBooking", val)}
              />

              <FormSelect
                label="Draft Only Booking"
                options={BOOLEAN_OPTIONS}
                value={form.draftOnlyBooking}
                onChange={(val) => val && update("draftOnlyBooking", val)}
              />

              <FormInput
                label="Credit Limit (₹)"
                type="number"
                min="0"
                placeholder="0"
                value={form.creditLimit}
                onChange={(e) => update("creditLimit", e.target.value)}
              />

              <FormInput
                label="Hamali Cost (₹)"
                type="number"
                min="0"
                placeholder="0"
                value={form.hamaliCost}
                onChange={(e) => update("hamaliCost", e.target.value)}
              />

              <FormInput
                label="Bilty Charge (₹)"
                type="number"
                min="0"
                placeholder="20"
                value={form.biltyCharge}
                onChange={(e) => update("biltyCharge", e.target.value)}
              />
            </div>
          </FormCard>
        </form>
      )}
    </AppModal>
  );
}
