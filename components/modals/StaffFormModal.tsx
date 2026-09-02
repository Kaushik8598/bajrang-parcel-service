"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Building2,
  FileText,
  CreditCard,
  Camera,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Navigation,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { FormCard } from "@/components/ui/form-card";
import { FileUploadPreview } from "@/components/ui/file-upload-preview";
import AppModal from "@/components/ui/AppModal";
import { useUpload, useUserById, useBranchDropdownList } from "@/lib/hooks";
import { getStoredUser, getStoredUserRole } from "@/lib/api/auth";
import type { StaffUser, StaffPayload } from "@/lib/api/staff";
import type { BranchDropdownItem } from "@/lib/api/branch";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface StaffFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  editId?: string | null;
  editData?: StaffUser | null;
  isLoading?: boolean;
  onSubmit: (payload: StaffPayload) => void;
}

export interface StaffFormErrors {
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

const COMPENSATION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "salary", label: "Salary" },
  { value: "commission", label: "Commission" },
  { value: "both", label: "Both (Salary + Commission)" },
];

const DISTANCE_OPTIONS = [
  { value: "50 Meters", label: "50 Meters" },
  { value: "100 Meters", label: "100 Meters" },
  { value: "200 Meters", label: "200 Meters" },
  { value: "500 Meters", label: "500 Meters" },
  { value: "1000 Meters", label: "1000 Meters" },
];

// ─── Initial State Helper ──────────────────────────────────────────────────────

function getInitialState(
  mode: "add" | "edit",
  user?: StaffUser | null,
  defaultBranchId?: string,
  isAdmin?: boolean
) {
  const profile = user?.staffProfile || {};
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

  // Extract branch ID
  let branchId =
    typeof profile.branchId === "object" && profile.branchId
      ? profile.branchId._id
      : typeof profile.branchId === "string"
        ? profile.branchId
        : "";

  // If non-admin user (e.g. branch), default to logged-in branch
  if (!isAdmin && defaultBranchId) {
    if (mode === "add" || !branchId) {
      branchId = defaultBranchId;
    }
  }

  return {
    // Basic Details
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    password: "",
    confirmPassword: "",
    status: user?.status || "active",

    // Staff Profile
    branchId: branchId || "",
    compensationType: profile.compensationType || "none",
    salaryAmount:
      profile.salaryAmount !== undefined && profile.salaryAmount !== null
        ? String(profile.salaryAmount)
        : "0",
    Bookingcommission:
      profile.Bookingcommission !== undefined && profile.Bookingcommission !== null
        ? String(profile.Bookingcommission)
        : "0",
    DeliveryCommission:
      profile.DeliveryCommission !== undefined && profile.DeliveryCommission !== null
        ? String(profile.DeliveryCommission)
        : "0",

    // Attendance Location
    latitude:
      profile.attendanceLocation?.latitude !== undefined &&
        profile.attendanceLocation?.latitude !== null
        ? String(profile.attendanceLocation.latitude)
        : "",
    longitude:
      profile.attendanceLocation?.longitude !== undefined &&
        profile.attendanceLocation?.longitude !== null
        ? String(profile.attendanceLocation.longitude)
        : "",
    attendanceDistance:
      profile.attendanceLocation?.distance !== undefined &&
        profile.attendanceLocation?.distance !== null
        ? String(profile.attendanceLocation.distance)
        : "100 Meters",

    // Photos & Documents
    profilePhotoName: profileUrl ? "profile_photo.jpg" : "",
    profilePhotoUrl: profileUrl,
    passportPhotoName: passportUrl ? "passport_photo.jpg" : "",
    passportPhotoUrl: passportUrl,

    aadharNumber: user?.aadharCard?.number || "",
    aadharFileName: aadharUrl ? "aadhar_card.jpg" : "",
    aadharFileUrl: aadharUrl,

    panNumber: user?.panCard?.number || "",
    panFileName: panUrl ? "pan_card.jpg" : "",
    panFileUrl: panUrl,

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

export default function StaffFormModal({
  open,
  onOpenChange,
  mode,
  editId,
  editData,
  isLoading = false,
  onSubmit,
}: StaffFormModalProps) {
  const targetId = mode === "edit" ? editId || editData?._id : null;

  // Logged-in user & role check
  const currentUser = getStoredUser();
  const currentRole = (getStoredUserRole() || currentUser?.role || "").toLowerCase();
  const isAdminOrSuperAdmin =
    currentRole === "admin" ||
    currentRole === "superadmin" ||
    currentRole === "super_admin" ||
    currentRole === "super-admin";
  const loggedInBranchId = String(currentUser?._id || "");

  // Live single user fetch via GET /user/:id on edit mode
  const { data: userDetailRes, isFetching: isFetchingUser } = useUserById<StaffUser>(
    targetId,
    Boolean(open && mode === "edit" && targetId)
  );

  // Fetch branches dropdown list from GET /user/branchAndAdminList
  const { data: branchListRes, isLoading: isLoadingBranches } = useBranchDropdownList();
  const rawBranches = Array.isArray(branchListRes?.data)
    ? branchListRes.data
    : branchListRes?.data?.branches || branchListRes?.data?.users || [];

  const branchOptions = useMemo(() => {
    const opts = rawBranches.map((b: BranchDropdownItem) => {
      const code = b?.code;
      const name = b?.name || "Branch";
      return {
        value: b._id,
        label: code ? `${name} (${code})` : `${name}`,
      };
    });

    if (!isAdminOrSuperAdmin && loggedInBranchId && !opts.some((o: any) => o.value === loggedInBranchId)) {
      const code = currentUser?.code || "";
      const name = currentUser?.name || "Branch";
      opts.unshift({
        value: loggedInBranchId,
        label: code ? `${name} (${code})` : `${name}`,
      });
    }

    return opts;
  }, [rawBranches, isAdminOrSuperAdmin, loggedInBranchId, currentUser]);

  const rawUser = userDetailRes?.data;
  const activeUserData: StaffUser | null =
    rawUser && typeof rawUser === "object" && "user" in rawUser && rawUser.user
      ? (rawUser.user as StaffUser)
      : (rawUser as StaffUser) || editData || null;

  const [form, setForm] = useState(() =>
    getInitialState(mode, activeUserData, loggedInBranchId, isAdminOrSuperAdmin)
  );
  const [errors, setErrors] = useState<StaffFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const { uploadFile, uploadingFields } = useUpload();

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      const initial = getInitialState(mode, activeUserData, loggedInBranchId, isAdminOrSuperAdmin);
      if (!isAdminOrSuperAdmin && loggedInBranchId && (mode === "add" || !initial.branchId)) {
        initial.branchId = loggedInBranchId;
      }
      setForm(initial);
      setErrors({});
      setShowPassword(false);
      setShowConfirm(false);
    }
  }, [open, mode, loggedInBranchId, isAdminOrSuperAdmin]);

  // Sync form when fresh activeUserData is received from GET /user/:id
  useEffect(() => {
    if (open && activeUserData) {
      const synced = getInitialState(mode, activeUserData, loggedInBranchId, isAdminOrSuperAdmin);
      if (!isAdminOrSuperAdmin && loggedInBranchId && (mode === "add" || !synced.branchId)) {
        synced.branchId = loggedInBranchId;
      }
      setForm(synced);
    }
  }, [activeUserData, loggedInBranchId, isAdminOrSuperAdmin]);

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

  // ─── Geolocation Handler ───────────────────────────────────────────────────

  const handleFetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setForm((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        alert(`Failed to get location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ─── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: StaffFormErrors = {};

    if (!form.name.trim()) errs.name = "Staff name is required";
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
        errs.password = "Password is required for new staff";
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

    if (!form.branchId) {
      errs.branchId = "Please select a branch";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Submit Handler ────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: StaffPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      status: form.status,

      // Profile & Identification Photos
      profilePhoto: { image: form.profilePhotoUrl },
      passportSizePhoto: { image: form.passportPhotoUrl },

      // KYC Identification Documents
      aadharCard: {
        number: form.aadharNumber.trim(),
        image: form.aadharFileUrl,
      },
      panCard: {
        number: form.panNumber.trim(),
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

      // Staff Profile
      staffProfile: {
        branchId: form.branchId,
        compensationType: form.compensationType,
        salaryAmount:
          form.compensationType === "salary" || form.compensationType === "both"
            ? Number(form.salaryAmount) || 0
            : 0,
        Bookingcommission:
          form.compensationType === "commission" || form.compensationType === "both"
            ? Number(form.Bookingcommission) || 0
            : 0,
        DeliveryCommission:
          form.compensationType === "commission" || form.compensationType === "both"
            ? Number(form.DeliveryCommission) || 0
            : 0,
        attendanceLocation: {
          latitude: form.latitude.trim(),
          longitude: form.longitude.trim(),
          distance: form.attendanceDistance,
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
          <span>{mode === "add" ? "Add New Staff" : "Edit Staff Details"}</span>
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
            form="staff-form-modal"
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
                {mode === "add" ? "Create Staff" : "Update Staff"}
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
            Loading staff details...
          </span>
        </div>
      ) : (
        <form
          id="staff-form-modal"
          onSubmit={handleSubmit}
          className="space-y-3.5 py-1"
        >
          {/* ─── SECTION 1: BASIC DETAILS ─── */}
          <FormCard title="Basic Information" icon={Users}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <FormInput
                label="Staff Name"
                placeholder="Enter staff full name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                error={errors.name}
                required
              />

              <FormInput
                label="Email Address"
                type="email"
                placeholder="staff@bajrang.com"
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

          {/* ─── SECTION 2: STAFF PROFILE & BRANCH ─── */}
          <FormCard title="Staff Profile & Branch" icon={Building2}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <FormSelect
                label="Assigned Branch"
                placeholder={isLoadingBranches ? "Loading branches..." : "Select branch"}
                options={branchOptions}
                value={form.branchId}
                onChange={(val) => val && update("branchId", val)}
                error={errors.branchId}
                required
                disabled={!isAdminOrSuperAdmin}
              />

              <FormSelect
                label="Compensation Type"
                options={COMPENSATION_OPTIONS}
                value={form.compensationType}
                onChange={(val) => val && update("compensationType", val)}
              />

              {(form.compensationType === "salary" || form.compensationType === "both") && (
                <FormInput
                  label="Salary Amount (₹)"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.salaryAmount}
                  onChange={(e) => update("salaryAmount", e.target.value)}
                />
              )}

              {(form.compensationType === "commission" || form.compensationType === "both") && (
                <>
                  <FormInput
                    label="Booking Commission (%)"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.Bookingcommission}
                    onChange={(e) => update("Bookingcommission", e.target.value)}
                  />

                  <FormInput
                    label="Delivery Commission (%)"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.DeliveryCommission}
                    onChange={(e) => update("DeliveryCommission", e.target.value)}
                  />
                </>
              )}
            </div>
          </FormCard>

          {/* ─── SECTION 3: ATTENDANCE LOCATION (Same View as Branch) ─── */}
          <FormCard title="Attendance Location" icon={Navigation}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-end">
              <div>
                <Button
                  type="button"
                  onClick={handleFetchCurrentLocation}
                  disabled={isLocating}
                  className="w-full h-8 text-xs font-semibold bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-none rounded flex items-center justify-center gap-1.5"
                >
                  {isLocating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5" />
                  )}
                  <span>Fetch Current GPS</span>
                </Button>
              </div>

              <div>
                <FormInput
                  label="Latitude"
                  id="latitude"
                  placeholder="e.g. 21.1702"
                  value={form.latitude}
                  onChange={(e) => update("latitude", e.target.value)}
                />
              </div>

              <div>
                <FormInput
                  label="Longitude"
                  id="longitude"
                  placeholder="e.g. 72.8311"
                  value={form.longitude}
                  onChange={(e) => update("longitude", e.target.value)}
                />
              </div>

              <div>
                <FormSelect
                  label="Attendance Distance"
                  id="attendanceDistance"
                  options={DISTANCE_OPTIONS}
                  value={form.attendanceDistance}
                  clearable={false}
                  onChange={(val) => val && update("attendanceDistance", val)}
                />
              </div>
            </div>
          </FormCard>

          {/* ─── SECTION 4: DOCUMENTS & KYC (Collapsible FormCard like Branch) ─── */}
          <FormCard
            title="Documents & KYC"
            icon={FileText}
            collapsible
            defaultOpen={false}
          >
            {/* Top 5MB Guideline Info Banner */}
            <div className="p-2 rounded bg-blue-50/80 border border-blue-200/80 text-[11px] text-slate-700 flex items-center gap-1.5 mb-2">
              <Info className="w-3.5 h-3.5 text-[#2980b9] shrink-0" />
              <span>
                <strong>Note:</strong> Maximum file size allowed is <strong>5MB</strong> per file. Supported formats: JPG, PNG, WEBP, PDF.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {/* 1. Aadhar Card */}
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
                  label="Aadhar Card"
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

              {/* 2. PAN Card */}
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
                  label="PAN Card"
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

              {/* 4. Bank Details (Span 2 columns on lg) */}
              <div className="sm:col-span-2 lg:col-span-3 p-2 bg-slate-50/50 rounded border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-black flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-slate-600" />
                  <span>Bank Details</span>
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
                    onChange={(e) => update("bankIfscCode", e.target.value.toUpperCase())}
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

          {/* ─── SECTION 5: BOOKING PREFERENCES ─── */}
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
