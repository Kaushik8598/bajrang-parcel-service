"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Coins,
  Store,
  MapPin,
  Home,
  FileText,
  CreditCard,
  Camera,
  Upload,
  X,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Navigation,
  Info,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { FormCard } from "@/components/ui/form-card";
import { FileUploadPreview } from "@/components/ui/file-upload-preview";
import AppModal from "@/components/ui/AppModal";
import { useUpload, useUserById } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { BranchUser, BranchPayload } from "@/lib/api/branch";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface BranchFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  editId?: string | null;
  editData?: BranchUser | null;
  isLoading?: boolean;
  onSubmit: (payload: BranchPayload) => void;
}

export interface BranchFormErrors {
  [key: string]: string | undefined;
}

// ─── Select Options ────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const PUBLIC_BOOKING_OPTIONS = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

const RENT_DUE_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

const DISTANCE_OPTIONS = [
  { value: "50 Meters", label: "50 Meters" },
  { value: "100 Meters", label: "100 Meters" },
  { value: "200 Meters", label: "200 Meters" },
  { value: "500 Meters", label: "500 Meters" },
  { value: "1000 Meters", label: "1000 Meters" },
];

// ─── Initial State Helper ──────────────────────────────────────────────────────

function getInitialState(mode: "add" | "edit", user?: BranchUser | null) {
  const bInfo = user?.branchInfo || {};

  // Extract photo string or object
  const extractPhotoUrl = (val: unknown): string => {
    if (typeof val === "string") return val;
    if (val && typeof val === "object" && "image" in val && typeof val.image === "string") {
      return val.image;
    }
    return "";
  };

  const profileUrl =
    extractPhotoUrl(user?.profilePhoto) ||
    extractPhotoUrl(user?.profileImage) ||
    extractPhotoUrl(bInfo?.profilePhoto);

  const passportUrl =
    extractPhotoUrl(user?.passportSizePhoto) ||
    extractPhotoUrl(bInfo?.passportSizePhoto);

  return {
    // Basic user info
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile || bInfo.mobile1 || "",
    password: "",
    confirmPassword: "",
    status: user?.status || "active",

    // Branch Type & Compensation
    branchType: (bInfo.branchType || "commission") as "company" | "commission",
    compensationType: (bInfo.compensationType || "commission") as "salary" | "commission",
    salaryAmount:
      bInfo.salaryAmount !== undefined && bInfo.salaryAmount !== null
        ? String(bInfo.salaryAmount)
        : "",
    Bookingcommission:
      bInfo.Bookingcommission !== undefined && bInfo.Bookingcommission !== null
        ? String(bInfo.Bookingcommission)
        : "",
    DeliveryCommission:
      bInfo.DeliveryCommission !== undefined && bInfo.DeliveryCommission !== null
        ? String(bInfo.DeliveryCommission)
        : "",
    deposite:
      bInfo.deposite !== undefined && bInfo.deposite !== null
        ? String(bInfo.deposite)
        : "",
    commissionTarget:
      bInfo.commissionTarget !== undefined && bInfo.commissionTarget !== null
        ? String(bInfo.commissionTarget)
        : "",

    // Branch Details
    branchName: bInfo.branchName || "",
    branchCode: bInfo.branchCode || "",
    mobile1: bInfo.mobile1 || user?.mobile || "",
    mobile2: bInfo.mobile2 || "",

    // Address
    address1: bInfo.address1 || "",
    address2: bInfo.address2 || "",
    city: bInfo.city || "",
    state: bInfo.state || "",
    pincode: bInfo.pincode || "",
    branchMapLink: bInfo.branchMapLink || "",
    allowPublicBooking:
      bInfo.allowPublicBooking !== undefined && bInfo.allowPublicBooking !== null
        ? String(bInfo.allowPublicBooking)
        : "true",

    // Rent Details
    monthlyRent:
      bInfo.monthlyRent !== undefined && bInfo.monthlyRent !== null
        ? String(bInfo.monthlyRent)
        : "",
    rentDueDate:
      bInfo.rentDueDate !== undefined && bInfo.rentDueDate !== null
        ? String(bInfo.rentDueDate)
        : "1",

    // Owner Details
    ownerName: bInfo.ownerDetail?.name || "",
    ownerMobile1: bInfo.ownerDetail?.mobile1 || "",
    ownerMobile2: bInfo.ownerDetail?.mobile2 || "",

    // Attendance Location
    latitude:
      bInfo.attendanceLocation?.latitude !== undefined &&
        bInfo.attendanceLocation?.latitude !== null
        ? String(bInfo.attendanceLocation.latitude)
        : "",
    longitude:
      bInfo.attendanceLocation?.longitude !== undefined &&
        bInfo.attendanceLocation?.longitude !== null
        ? String(bInfo.attendanceLocation.longitude)
        : "",
    attendanceDistance: bInfo.attendanceLocation?.distance
      ? String(bInfo.attendanceLocation.distance)
      : "100 Meters",

    // Documents (Root & Branch level)
    rentAgreementNumber: bInfo.rentAgreement?.number || "",
    rentAgreementName: "",
    rentAgreementUrl: bInfo.rentAgreement?.image || "",

    aadharNumber: user?.aadharCard?.number || "",
    aadharFileName: "",
    aadharFileUrl: user?.aadharCard?.image || "",

    panNumber: user?.panCard?.number || "",
    panFileName: "",
    panFileUrl: user?.panCard?.image || "",

    bankAccountNumber: user?.bankDetails?.accountNumber || "",
    bankIfscCode: user?.bankDetails?.ifscCode || "",
    bankName: user?.bankDetails?.bankName || "",
    bankAccountHolder: user?.bankDetails?.accountHolderName || "",
    passbookFileName: "",
    passbookFileUrl: user?.bankDetails?.passbookImage || "",

    passportPhotoName: "",
    passportPhotoUrl: passportUrl,

    profilePhotoName: "",
    profilePhotoUrl: profileUrl,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BranchFormModal({
  open,
  onOpenChange,
  mode,
  editId,
  editData,
  isLoading = false,
  onSubmit,
}: BranchFormModalProps) {
  const targetId = editId || editData?._id;

  // Live single user fetch via GET /user/:id on edit (executes exactly ONCE on modal open)
  const { data: singleUserResponse, isFetching: isFetchingUser } = useUserById<BranchUser>(
    targetId,
    Boolean(open && mode === "edit" && targetId)
  );

  const rawUser = singleUserResponse?.data;
  const activeBranchData: BranchUser | null =
    rawUser && typeof rawUser === "object" && "user" in rawUser && rawUser.user
      ? (rawUser.user as BranchUser)
      : (rawUser as BranchUser) || editData || null;

  const [form, setForm] = useState(() => getInitialState(mode, activeBranchData));
  const [errors, setErrors] = useState<BranchFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Hook for Base64 Upload API
  const { uploadFile, uploadingFields } = useUpload();

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setForm(getInitialState(mode, activeBranchData));
      setErrors({});
      setShowPassword(false);
      setShowConfirm(false);
    }
  }, [open, mode]);

  // Sync form when fresh activeBranchData is received from GET /user/:id
  useEffect(() => {
    if (open && activeBranchData) {
      setForm(getInitialState(mode, activeBranchData));
    }
  }, [activeBranchData]);

  const update = (field: string, val: string) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // ── Geolocation Fetch GPS Helper ──
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

  // ── File Upload Handler ──
  const handleDocumentUpload = async (
    file: File,
    nameField: string,
    urlField: string,
    key: string
  ) => {
    const result = await uploadFile(file, key);
    if (result) {
      setForm((prev) => ({
        ...prev,
        [nameField]: result.fileName,
        [urlField]: result.url,
      }));
    }
  };

  // ── Validation ──
  const validate = () => {
    const errs: BranchFormErrors = {};

    if (!form.branchName.trim()) errs.branchName = "Branch Name is required.";
    if (!form.branchCode.trim()) errs.branchCode = "Branch Code is required.";
    if (!form.name.trim()) errs.name = "Full Name is required.";

    if (!form.mobile1.trim()) {
      errs.mobile1 = "Branch Mobile is required.";
    } else if (!/^[6-9]\d{9}$/.test(form.mobile1.trim())) {
      errs.mobile1 = "Mobile number must be a 10-digit number starting with 6-9.";
    }

    if (form.mobile2 && !/^[6-9]\d{9}$/.test(form.mobile2.trim())) {
      errs.mobile2 = "Alternate Mobile must be a 10-digit number starting with 6-9.";
    }

    if (!form.email.trim()) {
      errs.email = "Email ID is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Enter a valid email address.";
    }

    if (!form.address1.trim()) errs.address1 = "Address 1 is required.";
    if (!form.city.trim()) errs.city = "City is required.";
    if (!form.state.trim()) errs.state = "State is required.";
    if (!form.pincode.trim()) {
      errs.pincode = "Pincode is required.";
    } else if (!/^\d{6}$/.test(form.pincode.trim())) {
      errs.pincode = "Enter a valid 6-digit pincode.";
    }

    if (form.branchType === "company") {
      if (!form.salaryAmount) errs.salaryAmount = "Monthly salary is required.";
    } else {
      if (!form.Bookingcommission) errs.Bookingcommission = "Booking commission is required.";
      if (!form.DeliveryCommission) errs.DeliveryCommission = "Delivery commission is required.";
    }

    if (mode === "add") {
      if (!form.password) {
        errs.password = "Password is required.";
      } else if (form.password.length < 6) {
        errs.password = "Password must be at least 6 characters.";
      }
      if (!form.confirmPassword) {
        errs.confirmPassword = "Confirm password is required.";
      } else if (form.password !== form.confirmPassword) {
        errs.confirmPassword = "Passwords do not match.";
      }
    } else if (form.password) {
      if (form.password.length < 6) {
        errs.password = "Password must be at least 6 characters.";
      }
      if (form.password !== form.confirmPassword) {
        errs.confirmPassword = "Passwords do not match.";
      }
    }

    if (form.ownerMobile1 && !/^[6-9]\d{9}$/.test(form.ownerMobile1.trim())) {
      errs.ownerMobile1 = "Owner mobile must be a 10-digit number starting with 6-9.";
    }

    return errs;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload: BranchPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      mobile: form.mobile1.trim(),
      status: form.status,
      profilePhoto: {
        image: form.profilePhotoUrl,
      },
      passportSizePhoto: {
        image: form.passportPhotoUrl,
      },
      aadharCard: {
        number: form.aadharNumber.trim(),
        image: form.aadharFileUrl,
      },
      panCard: {
        number: form.panNumber.trim(),
        image: form.panFileUrl,
      },
      bankDetails: {
        accountNumber: form.bankAccountNumber.trim(),
        ifscCode: form.bankIfscCode.trim(),
        bankName: form.bankName.trim(),
        accountHolderName: form.bankAccountHolder.trim(),
        passbookImage: form.passbookFileUrl,
      },
      branchInfo: {
        branchType: form.branchType,
        branchName: form.branchName.trim(),
        branchCode: form.branchCode.trim(),
        mobile1: form.mobile1.trim(),
        mobile2: form.mobile2.trim(),
        address1: form.address1.trim(),
        address2: form.address2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        branchMapLink: form.branchMapLink.trim(),
        allowPublicBooking: form.allowPublicBooking === "true",
        compensationType: form.branchType === "company" ? "salary" : "commission",
        salaryAmount: form.salaryAmount ? Number(form.salaryAmount) : 0,
        Bookingcommission: form.Bookingcommission ? Number(form.Bookingcommission) : 0,
        DeliveryCommission: form.DeliveryCommission ? Number(form.DeliveryCommission) : 0,
        commissionTarget: form.commissionTarget ? Number(form.commissionTarget) : 0,
        deposite: form.deposite ? Number(form.deposite) : 0,
        monthlyRent: form.monthlyRent ? Number(form.monthlyRent) : 0,
        rentDueDate: form.rentDueDate,
        ownerDetail: {
          name: form.ownerName.trim(),
          mobile1: form.ownerMobile1.trim(),
          mobile2: form.ownerMobile2.trim(),
        },
        attendanceLocation: {
          latitude: form.latitude,
          longitude: form.longitude,
          distance: form.attendanceDistance,
        },
        rentAgreement: {
          number: form.rentAgreementNumber.trim(),
          image: form.rentAgreementUrl,
        },
      },
    };

    if (form.password) {
      payload.password = form.password;
    }

    onSubmit(payload);
  };

  const title = mode === "add" ? "ADD BRANCH" : "EDIT BRANCH";
  const submitLabel = mode === "add" ? "Add Branch" : "Save Changes";

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2">
          <span>{title}</span>
        </div>
      }
      maxWidth="sm:max-w-[850px] md:max-w-[950px] lg:max-w-[1050px]"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-8 px-4 text-xs text-black border-slate-200 hover:bg-white font-medium shadow-none"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isLoading}
            onClick={() => handleSubmit()}
            className="h-8 px-5 text-xs font-semibold bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-xs transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      }
    >
      {isFetchingUser && mode === "edit" ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2.5">
          <Loader2 className="w-8 h-8 animate-spin text-[#2980b9]" />
          <p className="text-xs font-semibold text-slate-700">Loading branch details...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-2">
          {/* ─── SECTION 1: BRANCH TYPE & COMPENSATION ─── */}
          <FormCard title="Branch Type & Compensation" icon={Building2}>
            {/* Clean Radio Buttons with Lucide Icons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  update("branchType", "company");
                  update("compensationType", "salary");
                }}
                className={cn(
                  "flex items-center justify-center gap-2 h-8 px-3 rounded border text-xs font-bold transition-all",
                  form.branchType === "company"
                    ? "border-[#2980b9] bg-blue-50/60 text-[#2980b9] ring-1 ring-[#2980b9]/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                <input
                  type="radio"
                  name="branchType"
                  checked={form.branchType === "company"}
                  onChange={() => { }}
                  className="w-3.5 h-3.5 text-[#2980b9]"
                />
                <Building2 className="w-3.5 h-3.5 text-[#2980b9]" />
                <span>COMPANY BRANCH</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  update("branchType", "commission");
                  update("compensationType", "commission");
                }}
                className={cn(
                  "flex items-center justify-center gap-2 h-8 px-3 rounded border text-xs font-bold transition-all",
                  form.branchType === "commission"
                    ? "border-[#2980b9] bg-blue-50/60 text-[#2980b9] ring-1 ring-[#2980b9]/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                <input
                  type="radio"
                  name="branchType"
                  checked={form.branchType === "commission"}
                  onChange={() => { }}
                  className="w-3.5 h-3.5 text-[#2980b9]"
                />
                <Coins className="w-3.5 h-3.5 text-[#2980b9]" />
                <span>COMMISSION BRANCH</span>
              </button>
            </div>

            {/* Dynamic Inputs Based on Branch Type */}
            {form.branchType === "company" ? (
              <div>
                <FormInput
                  label="Monthly Salary (₹)"
                  id="salaryAmount"
                  required
                  type="number"
                  placeholder="Enter monthly salary amount"
                  value={form.salaryAmount}
                  onChange={(e) => update("salaryAmount", e.target.value)}
                  error={errors.salaryAmount}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <FormInput
                  label="Booking Commission (%)"
                  id="Bookingcommission"
                  required
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.Bookingcommission}
                  onChange={(e) => update("Bookingcommission", e.target.value)}
                  error={errors.Bookingcommission}
                />
                <FormInput
                  label="Delivery Commission (%)"
                  id="DeliveryCommission"
                  required
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.DeliveryCommission}
                  onChange={(e) => update("DeliveryCommission", e.target.value)}
                  error={errors.DeliveryCommission}
                />
                <FormInput
                  label="Deposit (₹)"
                  id="deposite"
                  type="number"
                  placeholder="Security Deposit"
                  value={form.deposite}
                  onChange={(e) => update("deposite", e.target.value)}
                />
              </div>
            )}
          </FormCard>

          {/* ─── SECTION 2: BRANCH DETAILS (Combined with Credentials) ─── */}
          <FormCard title="Branch Details" icon={Store}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {/* Row 1 */}
              <FormInput
                label="Branch Name"
                id="branchName"
                required
                uppercase
                placeholder="e.g. SURAT MAIN BRANCH"
                value={form.branchName}
                onChange={(e) => update("branchName", e.target.value.toUpperCase())}
                error={errors.branchName}
              />

              <FormInput
                label="Branch Code"
                id="branchCode"
                required
                uppercase
                placeholder="e.g. SUR01"
                value={form.branchCode}
                onChange={(e) => update("branchCode", e.target.value.toUpperCase())}
                error={errors.branchCode}
              />

              <FormInput
                label="Full Name (Contact Person)"
                id="name"
                required
                placeholder="Full name of branch admin"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                error={errors.name}
              />

              {/* Row 2 */}
              <FormInput
                label="Branch Mobile"
                id="mobile1"
                required
                type="tel"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={form.mobile1}
                onChange={(e) => update("mobile1", e.target.value.replace(/\D/g, ""))}
                error={errors.mobile1}
              />

              <FormInput
                label="Alternate Mobile"
                id="mobile2"
                type="tel"
                maxLength={10}
                placeholder="Optional alternate mobile"
                value={form.mobile2}
                onChange={(e) => update("mobile2", e.target.value.replace(/\D/g, ""))}
                error={errors.mobile2}
              />

              <FormInput
                label="Email ID"
                id="email"
                required
                type="email"
                placeholder="branch@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                error={errors.email}
              />

              {/* Row 3 (Status & Passwords moved here) */}
              <FormSelect
                label="Status"
                id="status"
                options={STATUS_OPTIONS}
                value={form.status}
                clearable={false}
                onChange={(val) => update("status", val)}
              />

              <FormInput
                label={mode === "add" ? "Password" : "Password"}
                id="password"
                required={mode === "add"}
                type={showPassword ? "text" : "password"}
                placeholder={mode === "add" ? "Enter password" : "Leave blank to keep current"}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                error={errors.password}
                endIcon={
                  <button
                    type="button"
                    className="pointer-events-auto text-slate-500 hover:text-slate-700"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                }
              />

              <FormInput
                label={mode === "add" ? "Confirm Password" : "Confirm Password"}
                id="confirmPassword"
                required={mode === "add"}
                type={showConfirm ? "text" : "password"}
                placeholder={mode === "add" ? "Confirm password" : "Confirm new password"}
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                error={errors.confirmPassword}
                endIcon={
                  <button
                    type="button"
                    className="pointer-events-auto text-slate-500 hover:text-slate-700"
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                }
              />
            </div>
          </FormCard>

          {/* ─── SECTION 3: ADDRESS & PUBLIC BOOKING ─── */}
          <FormCard title="Address & Public Booking" icon={MapPin}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <FormInput
                label="Address 1"
                id="address1"
                required
                placeholder="Building / Street address"
                value={form.address1}
                onChange={(e) => update("address1", e.target.value)}
                error={errors.address1}
              />

              <FormInput
                label="Address 2"
                id="address2"
                placeholder="Area / Landmark"
                value={form.address2}
                onChange={(e) => update("address2", e.target.value)}
              />

              <FormInput
                label="City"
                id="city"
                required
                uppercase
                placeholder="e.g. SURAT"
                value={form.city}
                onChange={(e) => update("city", e.target.value.toUpperCase())}
                error={errors.city}
              />

              <FormInput
                label="State"
                id="state"
                required
                uppercase
                placeholder="e.g. GUJARAT"
                value={form.state}
                onChange={(e) => update("state", e.target.value.toUpperCase())}
                error={errors.state}
              />

              <FormInput
                label="Pincode"
                id="pincode"
                required
                maxLength={6}
                placeholder="6-digit pincode"
                value={form.pincode}
                onChange={(e) => update("pincode", e.target.value.replace(/\D/g, ""))}
                error={errors.pincode}
              />

              <FormSelect
                label="Allow Public Booking"
                id="allowPublicBooking"
                options={PUBLIC_BOOKING_OPTIONS}
                value={form.allowPublicBooking}
                clearable={false}
                onChange={(val) => update("allowPublicBooking", val)}
              />

              <div className="sm:col-span-2 lg:col-span-3">
                <FormInput
                  label="Google Map Link"
                  id="branchMapLink"
                  type="url"
                  placeholder="https://maps.app.goo.gl/xxxxx"
                  value={form.branchMapLink}
                  onChange={(e) => update("branchMapLink", e.target.value)}
                />
              </div>
            </div>
          </FormCard>

          {/* ─── SECTION 4: RENT & OWNER DETAILS ─── */}
          <FormCard title="Rent & Owner Details" icon={Home}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <FormInput
                label="Monthly Rent (₹)"
                id="monthlyRent"
                type="number"
                placeholder="0"
                value={form.monthlyRent}
                onChange={(e) => update("monthlyRent", e.target.value)}
              />

              <FormSelect
                label="Rent Due Date"
                id="rentDueDate"
                options={RENT_DUE_OPTIONS}
                value={form.rentDueDate}
                clearable={false}
                onChange={(val) => update("rentDueDate", val)}
              />

              <FormInput
                label="Owner Name"
                id="ownerName"
                placeholder="Property owner name"
                value={form.ownerName}
                onChange={(e) => update("ownerName", e.target.value)}
              />

              <FormInput
                label="Owner Mobile 1"
                id="ownerMobile1"
                type="tel"
                maxLength={10}
                placeholder="10-digit mobile"
                value={form.ownerMobile1}
                onChange={(e) => update("ownerMobile1", e.target.value.replace(/\D/g, ""))}
                error={errors.ownerMobile1}
              />

              <FormInput
                label="Owner Mobile 2"
                id="ownerMobile2"
                type="tel"
                maxLength={10}
                placeholder="Alternate mobile"
                value={form.ownerMobile2}
                onChange={(e) => update("ownerMobile2", e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </FormCard>

          {/* ─── SECTION 5: ATTENDANCE LOCATION ─── */}
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
                  onChange={(val) => update("attendanceDistance", val)}
                />
              </div>
            </div>
          </FormCard>

          {/* ─── SECTION 6: DOCUMENTS & KYC (Collapsible FormCard) ─── */}
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
              {/* 1. Rent Agreement */}
              <div className="p-2 bg-slate-50/50 rounded border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-black flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-600" />
                  <span>Rent Agreement</span>
                </div>
                <FormInput
                  placeholder="Rent Agreement No"
                  value={form.rentAgreementNumber}
                  onChange={(e) => update("rentAgreementNumber", e.target.value)}
                />
                <FileUploadPreview
                  label="Rent Agreement"
                  fileName={form.rentAgreementName}
                  fileUrl={form.rentAgreementUrl}
                  isUploading={uploadingFields["rentAgreement"]}
                  onFileSelect={(file) =>
                    handleDocumentUpload(
                      file,
                      "rentAgreementName",
                      "rentAgreementUrl",
                      "rentAgreement"
                    )
                  }
                  onRemove={() =>
                    setForm((p) => ({
                      ...p,
                      rentAgreementName: "",
                      rentAgreementUrl: "",
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
                  onChange={(e) => update("aadharNumber", e.target.value.replace(/\D/g, ""))}
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

              {/* 5. Bank Details (Span 2 columns on lg) */}
              <div className="sm:col-span-2 lg:col-span-2 p-2 bg-slate-50/50 rounded border border-slate-200 space-y-1.5">
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
        </form>
      )}
    </AppModal>
  );
}
