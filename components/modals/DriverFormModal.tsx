"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Truck,
  FileText,
  CreditCard,
  Camera,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Info,
  SlidersHorizontal,
  IdCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { FormCard } from "@/components/ui/form-card";
import { FileUploadPreview } from "@/components/ui/file-upload-preview";
import AppModal from "@/components/ui/AppModal";
import { useUpload, useUserById, useTruckDropdownList } from "@/lib/hooks";
import type { DriverUser, DriverPayload, TruckDropdownItem } from "@/lib/api/driver";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DriverFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  editId?: string | null;
  editData?: DriverUser | null;
  isLoading?: boolean;
  onSubmit: (payload: DriverPayload) => void;
}

export interface DriverFormErrors {
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

const SALARY_TYPE_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "daily", label: "Daily" },
  { value: "perTrip", label: "Per Trip" },
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

function getInitialState(mode: "add" | "edit", user?: DriverUser | null) {
  const driverInfo = user?.driverInfo || {};
  const license = driverInfo.drivingLicense || {};
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
  const aadharUrl = extractPhotoUrl(user?.aadharCard?.image);
  const panUrl = extractPhotoUrl(user?.panCard?.image);
  const passbookUrl = extractPhotoUrl(user?.bankDetails?.passbookImage);
  const licenseDocUrl = extractPhotoUrl(license.image);

  // Assigned Truck ID
  const assignedTruckId =
    typeof driverInfo.assignedTruckId === "object" && driverInfo.assignedTruckId
      ? driverInfo.assignedTruckId._id
      : typeof driverInfo.assignedTruckId === "string"
      ? driverInfo.assignedTruckId
      : "";

  return {
    // Basic Details
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    password: "",
    confirmPassword: "",
    status: user?.status || "active",

    // Driver Info
    mobile2: driverInfo.mobile2 || "",
    address: driverInfo.address || "",
    city: driverInfo.city || "",
    salaryType: driverInfo.salaryType || "monthly",
    salary:
      driverInfo.salary !== undefined && driverInfo.salary !== null
        ? String(driverInfo.salary)
        : "0",
    dailyBonus:
      driverInfo.dailyBonus !== undefined && driverInfo.dailyBonus !== null
        ? String(driverInfo.dailyBonus)
        : "0",
    assignedTruckId: assignedTruckId || "",

    // Driving License
    drivingLicenseNumber: license.number || "",
    drivingLicenseExpiry: formatDateForInput(license.expiryDate),
    drivingLicenseName: licenseDocUrl ? "driving_license.jpg" : "",
    drivingLicenseUrl: licenseDocUrl,

    // Aadhar & PAN
    aadharNumber: user?.aadharCard?.number || "",
    aadharFileName: aadharUrl ? "aadhar_card.jpg" : "",
    aadharFileUrl: aadharUrl,

    panNumber: user?.panCard?.number || "",
    panFileName: panUrl ? "pan_card.jpg" : "",
    panFileUrl: panUrl,

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

export default function DriverFormModal({
  open,
  onOpenChange,
  mode,
  editId,
  editData,
  isLoading = false,
  onSubmit,
}: DriverFormModalProps) {
  const targetId = mode === "edit" ? editId || editData?._id : null;

  // Live single user fetch via GET /user/:id on edit mode
  const { data: userDetailRes, isFetching: isFetchingUser } = useUserById<DriverUser>(
    targetId,
    Boolean(open && mode === "edit" && targetId)
  );

  // Fetch trucks dropdown list for truck assignment
  const { data: truckListRes, isLoading: isLoadingTrucks } = useTruckDropdownList();
  const rawTrucks = Array.isArray(truckListRes?.data)
    ? truckListRes.data
    : truckListRes?.data?.users || [];

  const truckOptions = rawTrucks.map((t: TruckDropdownItem) => {
    const truckNo = t.truckInfo?.truckNumber || t.name || t._id;
    return {
      value: t._id,
      label: truckNo,
    };
  });

  const rawUser = userDetailRes?.data;
  const activeUserData: DriverUser | null =
    rawUser && typeof rawUser === "object" && "user" in rawUser && rawUser.user
      ? (rawUser.user as DriverUser)
      : (rawUser as DriverUser) || editData || null;

  const [form, setForm] = useState(() => getInitialState(mode, activeUserData));
  const [errors, setErrors] = useState<DriverFormErrors>({});
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
    const errs: DriverFormErrors = {};

    if (!form.name.trim()) errs.name = "Driver name is required";
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
        errs.password = "Password is required for new driver";
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

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Submit Handler ────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: DriverPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      status: form.status,

      // Profile & Passport Photos
      profilePhoto: { image: form.profilePhotoUrl },
      passportSizePhoto: { image: form.passportPhotoUrl },

      // Aadhar & PAN
      aadharCard: {
        number: form.aadharNumber.trim(),
        image: form.aadharFileUrl,
      },
      panCard: {
        number: form.panNumber.trim().toUpperCase(),
        image: form.panFileUrl,
      },

      // Bank Details
      bankDetails: {
        accountNumber: form.bankAccountNumber.trim(),
        ifscCode: form.bankIfscCode.trim(),
        bankName: form.bankName.trim(),
        accountHolderName: form.bankAccountHolder.trim(),
        passbookImage: form.passbookFileUrl,
      },

      // Driver Info
      driverInfo: {
        mobile2: form.mobile2.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        salaryType: form.salaryType,
        salary: Number(form.salary) || 0,
        dailyBonus: Number(form.dailyBonus) || 0,
        assignedTruckId: form.assignedTruckId || undefined,
        drivingLicense: {
          number: form.drivingLicenseNumber.trim().toUpperCase(),
          image: form.drivingLicenseUrl,
          expiryDate: form.drivingLicenseExpiry
            ? new Date(form.drivingLicenseExpiry).toISOString()
            : undefined,
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
            <User className="w-4 h-4" />
          </div>
          <span>{mode === "add" ? "Register New Driver" : "Edit Driver Details"}</span>
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
            form="driver-form-modal"
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
                {mode === "add" ? "Register Driver" : "Update Driver"}
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
            Loading driver details...
          </span>
        </div>
      ) : (
        <form
          id="driver-form-modal"
          onSubmit={handleSubmit}
          className="space-y-3.5 py-1"
        >
          {/* ─── SECTION 1: BASIC INFORMATION ─── */}
          <FormCard title="Basic Information" icon={User}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <FormInput
                label="Driver Full Name"
                placeholder="e.g. DRIVER_15 JOSHI"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                error={errors.name}
                required
              />

              <FormInput
                label="Email Address"
                type="email"
                placeholder="driver@bajrang.com"
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

          {/* ─── SECTION 2: DRIVER PROFILE & TRUCK ASSIGNMENT ─── */}
          <FormCard title="Driver Profile & Assignment" icon={Truck}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <FormSelect
                label="Assigned Truck"
                placeholder={isLoadingTrucks ? "Loading trucks..." : "Select truck"}
                options={truckOptions}
                value={form.assignedTruckId}
                onChange={(val) => update("assignedTruckId", val || "")}
                clearable
              />

              <FormInput
                label="Alternate Mobile (Mobile 2)"
                type="tel"
                placeholder="Alternate contact"
                value={form.mobile2}
                maxLength={10}
                onChange={(e) => update("mobile2", e.target.value.replace(/\D/g, ""))}
              />

              <FormInput
                label="City"
                placeholder="e.g. GANDHINAGAR"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
              />

              <FormSelect
                label="Salary Type"
                options={SALARY_TYPE_OPTIONS}
                value={form.salaryType}
                onChange={(val) => val && update("salaryType", val)}
              />

              <FormInput
                type="number"
                min="0"
                label="Salary Amount (₹)"
                placeholder="0"
                value={form.salary}
                onChange={(e) => update("salary", e.target.value)}
              />

              <FormInput
                type="number"
                min="0"
                label="Daily Bonus (₹)"
                placeholder="0"
                value={form.dailyBonus}
                onChange={(e) => update("dailyBonus", e.target.value)}
              />

              <div className="sm:col-span-2 lg:col-span-3">
                <FormInput
                  label="Residential Address"
                  placeholder="e.g. 46, GANDHI ROAD, GANDHINAGAR"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>
            </div>
          </FormCard>

          {/* ─── SECTION 3: DOCUMENTS, KYC & BANK DETAILS (Collapsible) ─── */}
          <FormCard
            title="Documents, KYC & Bank Details"
            icon={IdCard}
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
              {/* 1. Driving License */}
              <div className="p-2 bg-slate-50/50 rounded border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-black flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-600" />
                  <span>Driving License</span>
                </div>
                <FormInput
                  uppercase
                  placeholder="License Number"
                  value={form.drivingLicenseNumber}
                  onChange={(e) =>
                    update("drivingLicenseNumber", e.target.value.toUpperCase())
                  }
                />
                <FormInput
                  label="License Expiry Date"
                  type="date"
                  value={form.drivingLicenseExpiry}
                  onChange={(e) => update("drivingLicenseExpiry", e.target.value)}
                />
                <FileUploadPreview
                  label="License Document"
                  fileName={form.drivingLicenseName}
                  fileUrl={form.drivingLicenseUrl}
                  isUploading={uploadingFields["drivingLicense"]}
                  onFileSelect={(file) =>
                    handleDocumentUpload(
                      file,
                      "drivingLicenseName",
                      "drivingLicenseUrl",
                      "drivingLicense"
                    )
                  }
                  onRemove={() =>
                    setForm((p) => ({
                      ...p,
                      drivingLicenseName: "",
                      drivingLicenseUrl: "",
                    }))
                  }
                />
              </div>

              {/* 2. Aadhar Card */}
              <div className="p-2 bg-slate-50/50 rounded border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-black flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-slate-600" />
                  <span>Aadhar Card</span>
                </div>
                <FormInput
                  placeholder="12-digit Aadhar Number"
                  maxLength={12}
                  value={form.aadharNumber}
                  onChange={(e) =>
                    update("aadharNumber", e.target.value.replace(/\D/g, ""))
                  }
                />
                <FileUploadPreview
                  label="Aadhar Card Document"
                  fileName={form.aadharFileName}
                  fileUrl={form.aadharFileUrl}
                  isUploading={uploadingFields["aadharCard"]}
                  onFileSelect={(file) =>
                    handleDocumentUpload(
                      file,
                      "aadharFileName",
                      "aadharFileUrl",
                      "aadharCard"
                    )
                  }
                  onRemove={() =>
                    setForm((p) => ({
                      ...p,
                      aadharFileName: "",
                      aadharFileUrl: "",
                    }))
                  }
                />
              </div>

              {/* 3. PAN Card */}
              <div className="p-2 bg-slate-50/50 rounded border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-black flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-slate-600" />
                  <span>PAN Card</span>
                </div>
                <FormInput
                  uppercase
                  placeholder="10-digit PAN"
                  maxLength={10}
                  value={form.panNumber}
                  onChange={(e) => update("panNumber", e.target.value.toUpperCase())}
                />
                <FileUploadPreview
                  label="PAN Card Document"
                  fileName={form.panFileName}
                  fileUrl={form.panFileUrl}
                  isUploading={uploadingFields["panCard"]}
                  onFileSelect={(file) =>
                    handleDocumentUpload(
                      file,
                      "panFileName",
                      "panFileUrl",
                      "panCard"
                    )
                  }
                  onRemove={() =>
                    setForm((p) => ({
                      ...p,
                      panFileName: "",
                      panFileUrl: "",
                    }))
                  }
                />
              </div>

              {/* 4. Photos (Passport & Profile) */}
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

              {/* 5. Bank Account Details (Span 2 or 3 cols) */}
              <div className="sm:col-span-2 lg:col-span-2 p-2 bg-slate-50/50 rounded border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-black flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-slate-600" />
                  <span>Bank Account Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2">
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
          </FormCard>

          {/* ─── SECTION 4: BOOKING PREFERENCES (Collapsible) ─── */}
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
