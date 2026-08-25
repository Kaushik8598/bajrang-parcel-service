"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import AppModal from "@/components/ui/AppModal";
import type { AdminUser } from "@/lib/api/admin";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AdminFormValues {
  name: string;
  mobile: string;
  email: string;
  status: string;
  password?: string;
  confirmPassword?: string;
}

export interface AdminFormErrors {
  name?: string;
  mobile?: string;
  email?: string;
  status?: string;
  password?: string;
  confirmPassword?: string;
}

export interface AdminFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  /** Pass the AdminUser row when editing */
  editData?: AdminUser | null;
  isLoading?: boolean;
  onSubmit: (values: AdminFormValues) => void;
}

// ─── Status Options ──────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// ─── Initial Values ───────────────────────────────────────────────────────────
const EMPTY_FORM: AdminFormValues = {
  name: "",
  mobile: "",
  email: "",
  status: "active",
  password: "",
  confirmPassword: "",
};

function buildInitialValues(mode: "add" | "edit", editData?: AdminUser | null): AdminFormValues {
  if (mode === "edit" && editData) {
    return {
      name: editData.name || "",
      mobile: editData.mobile || "",
      email: editData.email || "",
      status: editData.status || STATUS_OPTIONS[0].value,
      password: "",
      confirmPassword: "",
    };
  }
  return { ...EMPTY_FORM, status: STATUS_OPTIONS[0].value };
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(values: AdminFormValues, mode: "add" | "edit"): AdminFormErrors {
  const errors: AdminFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Admin Name is required.";
  }

  // Mobile: exactly 10 digits starting with 6, 7, 8, or 9
  if (!values.mobile.trim()) {
    errors.mobile = "Mobile No is required.";
  } else if (!/^[6-9]\d{9}$/.test(values.mobile.trim())) {
    errors.mobile = "Mobile number must be a 10-digit number starting with 6-9.";
  }

  // Email: required and valid
  if (!values.email.trim()) {
    errors.email = "Email ID is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  // Password validation
  if (mode === "add") {
    if (!values.password) {
      errors.password = "Password is required.";
    } else if (values.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    if (!values.confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
  } else {
    // In edit mode: password is optional, but if entered, must be >= 6 chars and match confirm
    if (values.password && values.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }
    if (values.password && values.password !== values.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
  }

  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminFormModal({
  open,
  onOpenChange,
  mode,
  editData,
  isLoading = false,
  onSubmit,
}: AdminFormModalProps) {
  const [values, setValues] = useState<AdminFormValues>(() =>
    buildInitialValues(mode, editData)
  );
  const [errors, setErrors] = useState<AdminFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Reinitialize form when modal opens or mode/editData changes
  useEffect(() => {
    if (open) {
      setValues(buildInitialValues(mode, editData));
      setErrors({});
      setShowPassword(false);
      setShowConfirm(false);
    }
  }, [open, mode, editData]);

  const set = (field: keyof AdminFormValues) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const errs = validate(values, mode);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit(values);
  };

  const title = mode === "add" ? "Add Admin" : "Edit Admin";
  const submitLabel = mode === "add" ? "Add Admin" : "Save Changes";

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      maxWidth="sm:max-w-[620px] md:max-w-[660px]"
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
            className="h-8 px-4 text-xs font-semibold bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-xs transition-colors"
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
      <form onSubmit={handleSubmit} noValidate>
        {/* 2x2 Grid View */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Admin Name (Automatic Uppercase) */}
          <FormInput
            label="Admin Name"
            id="admin-name"
            required
            uppercase
            placeholder="Enter admin full name"
            value={values.name}
            onChange={(e) => set("name")(e.target.value.toUpperCase())}
            error={errors.name}
          />

          {/* 2. Mobile No (6-9 validation) */}
          <FormInput
            label="Mobile No"
            id="admin-mobile"
            required
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="Enter 10-digit mobile number"
            value={values.mobile}
            onChange={(e) => set("mobile")(e.target.value.replace(/\D/g, ""))}
            error={errors.mobile}
          />

          {/* 3. Email ID (Required) */}
          <FormInput
            label="Email ID"
            id="admin-email"
            required
            type="email"
            placeholder="Enter email address"
            value={values.email}
            onChange={(e) => set("email")(e.target.value)}
            error={errors.email}
          />

          {/* 4. Status (Default Active, Non-clearable) */}
          <FormSelect
            label="Status"
            id="admin-status"
            options={STATUS_OPTIONS}
            value={values.status}
            clearable={false}
            onChange={set("status")}
          />

          {/* 5. Enter Password (Shown in both Add and Edit modes) */}
          <FormInput
            label={mode === "add" ? "Enter Password" : "New Password"}
            id="admin-password"
            required={mode === "add"}
            type={showPassword ? "text" : "password"}
            placeholder={
              mode === "add"
                ? "Enter password"
                : "Enter new password (optional)"
            }
            value={values.password || ""}
            onChange={(e) => set("password")(e.target.value)}
            error={errors.password}
            helperText={
              mode === "edit"
                ? "Leave blank to keep existing password"
                : undefined
            }
            endIcon={
              <button
                type="button"
                className="pointer-events-auto text-slate-500 hover:text-slate-700 transition-colors"
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

          {/* 6. Enter Confirm Password (Shown in both Add and Edit modes) */}
          <FormInput
            label={
              mode === "add"
                ? "Enter Confirm Password"
                : "Confirm New Password"
            }
            id="admin-confirm-password"
            required={mode === "add"}
            type={showConfirm ? "text" : "password"}
            placeholder={
              mode === "add"
                ? "Re-enter password"
                : "Re-enter new password"
            }
            value={values.confirmPassword || ""}
            onChange={(e) => set("confirmPassword")(e.target.value)}
            error={errors.confirmPassword}
            endIcon={
              <button
                type="button"
                className="pointer-events-auto text-slate-500 hover:text-slate-700 transition-colors"
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
        </div>
      </form>
    </AppModal>
  );
}
