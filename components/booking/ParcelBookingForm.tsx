"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  MapPin,
  Truck,
  User,
  Package,
  CreditCard,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  UserCheck,
  FileCheck,
  Loader2,
  CheckCircle2,
  X,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormInput, FormTextarea } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { FormCard } from "@/components/ui/form-card";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { useOnlyBranchList, useDrivers } from "@/lib/hooks";
import {
  getBookingById,
  createParcelBooking,
  updateParcelBooking,
  getLastBookedDocket,
} from "@/lib/api/booking";
import { formatCurrency } from "@/lib/utils";
import { getStoredUser, getStoredUserRole } from "@/lib/api/auth";

import { showToast } from "@/lib/toast";
import { FileUploadPreview } from "@/components/ui/file-upload-preview";
import type {
  ParcelBookingFormData,
  PackageItem,
  GoodsValue,
  PaymentType,
  PaymentMethod,
} from "@/lib/types/booking";

// ─── Static dropdown options ──────────────────────────────────────────────────
const GOODS_VALUE_OPTIONS: SearchableSelectOption[] = [
  { value: "500", label: "500" },
  { value: "1000", label: "1000" },
  { value: "2000", label: "2000" },
];

const PAYMENT_TYPE_OPTIONS: SearchableSelectOption[] = [
  { value: "Direct", label: "Direct" },
  { value: "Per Package", label: "Per Package" },
];

const PAYMENT_METHOD_OPTIONS: SearchableSelectOption[] = [
  { value: "To Pay", label: "To Pay", subLabel: "Receiver pays at delivery" },
  { value: "Paid", label: "Paid", subLabel: "Sender paid at booking" },
  { value: "Not Pay", label: "Not Pay", subLabel: "On credit / account" },
];

const BILL_TYPE_OPTIONS: SearchableSelectOption[] = [
  { value: "with_bill", label: "With Bill" },
  { value: "without_bill", label: "Without Bill" },
];

export interface ParcelBookingFormProps {
  bookingId?: string;
  isEdit?: boolean;
}

export default function ParcelBookingForm({ bookingId, isEdit = false }: ParcelBookingFormProps) {
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [billType, setBillType] = useState<"with_bill" | "without_bill">("with_bill");
  const [billFile, setBillFile] = useState<File | null>(null);

  // ─── Role & Branch Access ─────────────────────────────────────────────────
  const currentUser = getStoredUser();
  const currentRole = getStoredUserRole() || "";
  const isAdminOrSuperAdmin = ["superAdmin", "admin"].includes(currentRole);
  // user._id matches the branch _id in the branch list API response
  const ownBranchId = useMemo(() => {
    return String(currentUser?._id || currentUser?.id || "");
  }, [currentUser]);

  // ─── Booking Status (from bookingPreferences) ────────────────────────────
  const bookingStatus = useMemo(() => {
    const prefs = (currentUser as any)?.bookingPreferences;
    return prefs?.draftOnlyBooking === true ? "draft" : "confirmed";
  }, [currentUser]);

  // ─── Fetch Booking by ID (for Edit mode) ────────────────────────────────────
  const { data: initialBooking, isLoading: isBookingLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => getBookingById(bookingId!),
    enabled: Boolean(isEdit && bookingId),
  });

  // ─── Fetch Branches (via GET /user/onlyBranch) ──────────────────────────────
  const { data: branchDropdownRes, isLoading: isBranchesLoading } = useOnlyBranchList();
  const branchDropdownList = useMemo(() => {
    const rawData = branchDropdownRes?.data;
    if (Array.isArray(rawData)) return rawData;
    if (rawData && typeof rawData === "object") {
      if (Array.isArray((rawData as any).branches)) return (rawData as any).branches;
      if (Array.isArray((rawData as any).users)) return (rawData as any).users;
      if (Array.isArray((rawData as any).data)) return (rawData as any).data;
    }
    return [];
  }, [branchDropdownRes]);

  const branchOptions: SearchableSelectOption[] = useMemo(
    () =>
      branchDropdownList.map((b: any) => {
        // API returns flat: { _id, name, code, role }
        const id = String(b._id || b.id || "");
        const code = b.code || b.branchInfo?.branchCode || "";
        const name = b.name || b.branchInfo?.branchName || "Branch";
        const label = code ? `${code} - ${name}` : name;
        return {
          value: id,
          label,
        };
      }),
    [branchDropdownList]
  );

  // ─── Fetch Drivers (via GET /user/role/driver?page=1&limit=100) ──────────────
  const { data: driversRes, isLoading: isDriversLoading } = useDrivers({ page: 1, limit: 100 });
  const driversList = useMemo(() => {
    const rawData = driversRes?.data;
    if (Array.isArray(rawData)) return rawData;
    if (rawData && typeof rawData === "object") {
      if (Array.isArray((rawData as any).users)) return (rawData as any).users;
      if (Array.isArray((rawData as any).data)) return (rawData as any).data;
      if (Array.isArray((rawData as any).drivers)) return (rawData as any).drivers;
    }
    return [];
  }, [driversRes]);

  const driverOptions: SearchableSelectOption[] = useMemo(
    () =>
      driversList.map((d: any) => {
        const id = String(d._id || d.id || "");
        const name = d.name || d.driver_name || "Driver";
        const truckNo =
          typeof d.driverInfo?.assignedTruckId === "object" && d.driverInfo?.assignedTruckId !== null
            ? d.driverInfo.assignedTruckId.truckInfo?.truckNumber || d.driverInfo.assignedTruckId.name || ""
            : (d.vehicle_no || "");
        const label = truckNo ? `${name} (${truckNo})` : name;
        return {
          value: id,
          label,
        };
      }),
    [driversList]
  );


  const { data: lastDocketData } = useQuery({
    queryKey: ["last-docket"],
    queryFn: getLastBookedDocket,
    enabled: !isEdit,
  });


  // ─── Form State ─────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<ParcelBookingFormData>({
    from_branch_id: isAdminOrSuperAdmin ? "" : ownBranchId,
    to_branch_id: "",
    bill_no: "",
    goods_value: 500,
    sender: {
      contact_no: "",
      gstin: "",
      name: "",
      show_details: false,
      address: "",
      city: "",
      pincode: "",
    },
    receiver: {
      contact_no: "",
      gstin: "",
      name: "",
      show_details: false,
      address: "",
      city: "",
      pincode: "",
    },
    packages: [
      {
        id: "pkg-1",
        qty: 0,
        material: "",
        packing: "",
        payment_type: "Direct",
        price: "",
      },
    ],
    payment_method: "To Pay",
    bilty_charge: 20,
    net_cost: 20,
    remark: "",
    cancel_reason: "",
    show_driver_details: false,
    driver: {
      driver_id: "",
      driver_name: "",
      driver_mobile: "",
      vehicle_no: "",
      license_no: "",
    },
  });

  // Populate data in Edit mode
  useEffect(() => {
    if (isEdit && initialBooking) {
      setFormData({
        from_branch_id: String(initialBooking.from_branch_id || ""),
        to_branch_id: String(initialBooking.to_branch_id || ""),
        bill_no: initialBooking.bill_no || "",
        goods_value: (initialBooking.goods_value as GoodsValue) || 500,
        sender: {
          contact_no: initialBooking.sender?.contact_no || "",
          gstin: initialBooking.sender?.gstin || "",
          name: initialBooking.sender?.name || "",
          show_details: Boolean(
            initialBooking.sender?.address ||
            initialBooking.sender?.city ||
            initialBooking.sender?.pincode
          ),
          address: initialBooking.sender?.address || "",
          city: initialBooking.sender?.city || "",
          pincode: initialBooking.sender?.pincode || "",
        },
        receiver: {
          contact_no: initialBooking.receiver?.contact_no || "",
          gstin: initialBooking.receiver?.gstin || "",
          name: initialBooking.receiver?.name || "",
          show_details: Boolean(
            initialBooking.receiver?.address ||
            initialBooking.receiver?.city ||
            initialBooking.receiver?.pincode
          ),
          address: initialBooking.receiver?.address || "",
          city: initialBooking.receiver?.city || "",
          pincode: initialBooking.receiver?.pincode || "",
        },
        packages:
          initialBooking.packages && initialBooking.packages.length > 0
            ? initialBooking.packages
            : [
              {
                id: "pkg-1",
                qty: initialBooking.total_qty || 1,
                material: "General Goods",
                packing: "Carton",
                payment_type: "Direct",
                price: (initialBooking.net_cost || 200) - 20,
              },
            ],
        payment_method: initialBooking.payment_method || "To Pay",
        bilty_charge: initialBooking.bilty_charge ?? 20,
        net_cost: initialBooking.net_cost || 20,
        remark: initialBooking.remark || "",
        cancel_reason: initialBooking.cancel_reason || "",
        show_driver_details: Boolean(initialBooking.driver?.driver_name),
        driver: {
          driver_id: initialBooking.driver?.driver_id || "",
          driver_name: initialBooking.driver?.driver_name || "",
          driver_mobile: initialBooking.driver?.driver_mobile || "",
          vehicle_no: initialBooking.driver?.vehicle_no || "",
          license_no: initialBooking.driver?.license_no || "",
        },
      });
    }
  }, [isEdit, initialBooking]);

  // ─── Driver Selection Handler ──────────────────────────────────────────────
  const handleDriverSelect = (driverId: string) => {
    if (!driverId) {
      setFormData((p) => ({
        ...p,
        driver: {
          driver_id: "",
          driver_name: "",
          driver_mobile: "",
          vehicle_no: "",
          license_no: "",
        },
      }));
      return;
    }

    const selected: any = driversList.find((d: any) => String(d._id || d.id) === String(driverId));
    if (selected) {
      const vehicleNo =
        typeof selected.driverInfo?.assignedTruckId === "object" && selected.driverInfo?.assignedTruckId !== null
          ? selected.driverInfo.assignedTruckId.truckInfo?.truckNumber || selected.driverInfo.assignedTruckId.name || ""
          : (selected.vehicle_no || "");
      const licenseNo = selected.driverInfo?.drivingLicense?.number || selected.license_no || "";

      setFormData((p) => ({
        ...p,
        driver: {
          driver_id: String(selected._id || selected.id),
          driver_name: selected.name || selected.driver_name || "",
          driver_mobile: selected.mobile || selected.driver_mobile || "",
          vehicle_no: vehicleNo,
          license_no: licenseNo,
        },
      }));
    }
  };


  // ─── Auto-calculate Net Cost ────────────────────────────────────────────────
  const totalPackageAmount = useMemo(() => {
    return formData.packages.reduce((sum, pkg) => {
      const price = typeof pkg.price === "number" ? pkg.price : Number(pkg.price) || 0;
      const qty = typeof pkg.qty === "number" ? pkg.qty : Number(pkg.qty) || 1;
      const itemTotal = pkg.payment_type === "Per Package" ? price * qty : price;
      return sum + itemTotal;
    }, 0);
  }, [formData.packages]);

  const calculatedNetCost = totalPackageAmount + (Number(formData.bilty_charge) || 0);

  // ─── Package Rows Handlers ─────────────────────────────────────────────────
  const addPackageRow = () => {
    setFormData((prev) => ({
      ...prev,
      packages: [
        ...prev.packages,
        {
          id: `pkg-${Date.now()}`,
          qty: 1,
          material: "",
          packing: "",
          payment_type: "Direct",
          price: "",
        },
      ],
    }));
  };

  const removePackageRow = (index: number) => {
    if (formData.packages.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index),
    }));
  };

  const updatePackageField = <K extends keyof PackageItem>(
    index: number,
    field: K,
    val: PackageItem[K]
  ) => {
    setFormData((prev) => {
      const updated = [...prev.packages];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, packages: updated };
    });
    // Auto clear error when value is entered
    setFormErrors((prev) => {
      const key = `pkg_${field}_${index}`;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // ─── Field Validation ──────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.from_branch_id) {
      errors.from_branch_id = "Please select From Branch";
    }
    if (!formData.to_branch_id) {
      errors.to_branch_id = "Please select To Branch";
    }
    if (formData.from_branch_id && formData.from_branch_id === formData.to_branch_id) {
      errors.to_branch_id = "To Branch cannot be the same as From Branch";
    }

    if (!formData.sender.contact_no?.trim()) {
      errors.sender_contact = "Sender contact is required";
    }
    if (!formData.sender.name?.trim()) {
      errors.sender_name = "Sender name is required";
    }

    if (!formData.receiver.contact_no?.trim()) {
      errors.receiver_contact = "Receiver contact is required";
    }
    if (!formData.receiver.name?.trim()) {
      errors.receiver_name = "Receiver name is required";
    }

    formData.packages.forEach((pkg, i) => {
      if (!pkg.qty || Number(pkg.qty) <= 0) {
        errors[`pkg_qty_${i}`] = "Qty required";
      }
      if (pkg.price === "" || Number(pkg.price) < 0) {
        errors[`pkg_price_${i}`] = "Price required";
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── Submit (Create or Update) Mutation ─────────────────────────────────────
  const formMutation = useMutation({
    mutationFn: (data: ParcelBookingFormData) => {
      const payload = { ...data, net_cost: calculatedNetCost, status: bookingStatus };
      if (isEdit && bookingId) {
        return updateParcelBooking(bookingId, payload);
      }
      return createParcelBooking(payload);
    },
    onSuccess: (result) => {
      const msg = isEdit
        ? `Parcel Booking "${result.docket_no || initialBooking?.docket_no}" updated successfully!`
        : `Parcel Booking created successfully! Docket No: ${result.docket_no || "BPS-" + Date.now().toString().slice(-6)}`;
      setSuccessMessage(msg);
      showToast("success", msg);
      setFormErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        router.push("/reports/booking");
      }, 1200);
    },
    onError: (err: Error) => {
      const errMsg = err.message || "Failed to process parcel booking.";
      setFormErrors({ form: errMsg });
      showToast("error", errMsg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("warning", "Please fill all required fields correctly.");
      window.scrollTo({ top: 100, behavior: "smooth" });
      return;
    }
    formMutation.mutate(formData);
  };

  // ─── Enter = Next Field Navigation ──────────────────────────────────────────
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return;

    const target = e.target as HTMLElement;

    // 1. If Enter is pressed directly on the submit button, allow normal form submission
    if (target.tagName === "BUTTON" && (target as HTMLButtonElement).type === "submit") {
      return;
    }

    // 2. If Enter is pressed on the cancel button, allow click execution
    if (
      target.tagName === "BUTTON" &&
      (target.getAttribute("data-action") === "cancel" || target.textContent?.trim() === "Cancel")
    ) {
      target.click();
      return;
    }

    // 3. In textarea, Shift+Enter makes newline; regular Enter advances to next field
    if (target.tagName === "TEXTAREA" && e.shiftKey) {
      return;
    }

    e.preventDefault();

    const form = e.currentTarget;

    // 4. Query all navigable form elements (inputs, textareas, selects, submit, cancel)
    const allElements = Array.from(
      form.querySelectorAll<HTMLElement>(
        'input:not([disabled]):not([readonly]):not([type="hidden"]):not([tabindex="-1"]), ' +
        'textarea:not([disabled]):not([readonly]):not([tabindex="-1"]), ' +
        'button:not([disabled]):not([tabindex="-1"])'
      )
    );

    // 5. Filter only visible elements and valid form controls/action buttons
    const focusable = allElements.filter((el) => {
      // Must be visible
      if (el.offsetParent === null) return false;

      // Filter buttons: only include FormSelect triggers, Submit button, and Cancel button
      if (el.tagName === "BUTTON") {
        const btn = el as HTMLButtonElement;
        if (btn.type === "submit") return true;
        if (btn.getAttribute("data-action") === "cancel" || btn.textContent?.trim() === "Cancel") return true;
        if (btn.id && btn.id.startsWith("select-")) return true;
        if (btn.parentElement?.classList.contains("relative") && btn.querySelector(".truncate")) return true;
        return false;
      }

      return true;
    });

    const currentIndex = focusable.indexOf(target);
    if (currentIndex !== -1 && currentIndex < focusable.length - 1) {
      const nextElement = focusable[currentIndex + 1];
      nextElement.focus();
      if (nextElement instanceof HTMLInputElement) {
        nextElement.select?.();
      }
    } else if (currentIndex === -1) {
      // If target was not in focusable directly, find the nearest next one
      const targetPos = target.compareDocumentPosition.bind(target);
      const nextElement = focusable.find((el) => (targetPos(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0);
      if (nextElement) {
        nextElement.focus();
        if (nextElement instanceof HTMLInputElement) {
          nextElement.select?.();
        }
      }
    }
  };

  if (isEdit && isBookingLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#2980b9]" />
        Loading booking details...
      </div>
    );
  }

  return (
    <div className="w-full space-y-1 pb-3">
      {/* ─── Top Header Bar ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded border border-slate-200/80 shadow-2xs px-3 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-base sm:text-lg font-bold text-black tracking-tight">
            {isEdit ? "Edit Parcel Booking" : "Add Parcel Booking"}
          </h1>

          {isEdit ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold bg-blue-50 text-[#2980b9] border border-blue-200 px-2 py-0.5 rounded">
                Docket: {initialBooking?.docket_no || `#${bookingId}`}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Tracking: {initialBooking?.tracking_no || "—"}
              </span>
            </div>
          ) : (
            <span className="text-xs font-semibold text-red-600 tracking-wide">
              Last Booked Docket :{" "}
              {lastDocketData?.docket_no ? (
                <span className="text-slate-800 underline">{lastDocketData.docket_no}</span>
              ) : (
                "Booking Not Found"
              )}
            </span>
          )}
        </div>

        <Button
          type="button"
          onClick={() => router.push("/reports/booking")}
          className="bg-[#2980b9] hover:bg-[#2471a3] text-white h-7 px-3 text-xs font-semibold shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          Back to List
        </Button>
      </div>

      {/* ─── Alerts ──────────────────────────────────────────────────────────── */}
      {successMessage && (
        <div className="p-2 rounded bg-green-50 border border-green-200 text-green-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {formErrors.form && (
        <div className="p-2 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <span>{formErrors.form}</span>
          <button
            onClick={() => setFormErrors((p) => ({ ...p, form: "" }))}
            className="text-red-400 hover:text-red-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-1">
        {/* ─── 1. Destination & Transport Section ────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {/* Destination Card */}
          <FormCard title="Destination" icon={MapPin}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {/* From Branch — admin/superadmin editable; others see their own branch locked */}
              <FormSelect
                label="Select From Branch"
                required
                options={branchOptions}
                value={formData.from_branch_id}
                onChange={(val) => {
                  setFormData((p) => ({ ...p, from_branch_id: val }));
                  if (formErrors.from_branch_id) {
                    setFormErrors((p) => ({ ...p, from_branch_id: "" }));
                  }
                }}
                placeholder="Select From Branch"
                searchPlaceholder="Search branch..."
                error={formErrors.from_branch_id}
                disabled={!isAdminOrSuperAdmin}
              />

              <FormSelect
                label="Select To Branch"
                required
                options={branchOptions.filter((b) => b.value !== formData.from_branch_id)}
                value={formData.to_branch_id}
                onChange={(val) => {
                  setFormData((p) => ({ ...p, to_branch_id: val }));
                  if (formErrors.to_branch_id) {
                    setFormErrors((p) => ({ ...p, to_branch_id: "" }));
                  }
                }}
                placeholder="Select To Branch"
                searchPlaceholder="Search branch..."
                error={formErrors.to_branch_id}
              />
            </div>
          </FormCard>

          {/* Transport Card */}
          <FormCard title="Transport" icon={Truck}>
            <div className="space-y-1.5">
              {/* Bill Type Dropdown */}
              <FormSelect
                label="Bill Type"
                required
                options={BILL_TYPE_OPTIONS}
                value={billType}
                onChange={(val) => {
                  setBillType(val as "with_bill" | "without_bill");
                  if (val === "without_bill") {
                    setFormData((p) => ({ ...p, bill_no: "" }));
                    setBillFile(null);
                  }
                }}
                placeholder="Select Bill Type"
              />

              {/* With Bill: Bill No + Goods Value + Bill Upload in one row */}
              {billType === "with_bill" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <FormInput
                    label="Bill No"
                    required
                    placeholder="Bill No / LR No"
                    value={formData.bill_no}
                    onChange={(e) => setFormData((p) => ({ ...p, bill_no: e.target.value }))}
                  />

                  <FormSelect
                    label="Goods Value"
                    required
                    options={GOODS_VALUE_OPTIONS}
                    value={String(formData.goods_value)}
                    onChange={(val) =>
                      setFormData((p) => ({ ...p, goods_value: Number(val) as GoodsValue }))
                    }
                    placeholder="Select Goods Value"
                    searchPlaceholder="Search goods value..."
                  />

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-black flex items-center gap-0.5 leading-none">Bill Upload</Label>
                    <FileUploadPreview
                      label="Bill"
                      fileName={billFile?.name}
                      onFileSelect={(file) => setBillFile(file)}
                      onRemove={() => setBillFile(null)}
                      accept="image/*,.pdf"
                      showViewLink={false}
                    />
                  </div>
                </div>
              )}

              {/* Without Bill: Goods Value only */}
              {billType === "without_bill" && (
                <FormSelect
                  label="Goods Value"
                  required
                  options={GOODS_VALUE_OPTIONS}
                  value={String(formData.goods_value)}
                  onChange={(val) =>
                    setFormData((p) => ({ ...p, goods_value: Number(val) as GoodsValue }))
                  }
                  placeholder="Select Goods Value"
                  searchPlaceholder="Search goods value..."
                />
              )}
            </div>
          </FormCard>
        </div>

        {/* ─── 2. Sender & Receiver Section ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {/* Sender Details */}
          <FormCard
            title="Sender"
            icon={User}
            action={
              !formData.sender.show_details ? (
                <Button
                  type="button"
                  size="sm"
                  tabIndex={-1}
                  onClick={() =>
                    setFormData((p) => ({
                      ...p,
                      sender: { ...p.sender, show_details: true },
                    }))
                  }
                  className="h-6 px-2 text-[10px] font-semibold bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-none"
                >
                  <Plus className="w-2.5 h-2.5 mr-0.5" />
                  Add Details
                </Button>
              ) : (
                <span className="text-[9px] text-green-700 font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                  Address Details Active
                </span>
              )
            }
          >
            {/* Sender Primary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <FormInput
                label="Contact No"
                required
                placeholder="Contact Number"
                value={formData.sender.contact_no}
                onChange={(e) => {
                  setFormData((p) => ({
                    ...p,
                    sender: { ...p.sender, contact_no: e.target.value },
                  }));
                  if (formErrors.sender_contact) {
                    setFormErrors((p) => ({ ...p, sender_contact: "" }));
                  }
                }}
                error={formErrors.sender_contact}
              />

              <FormInput
                label="GSTIN"
                placeholder="GST NO"
                uppercase
                value={formData.sender.gstin}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    sender: { ...p.sender, gstin: e.target.value.toUpperCase() },
                  }))
                }
              />

              <FormInput
                label="Name"
                required
                placeholder="Customer Name"
                value={formData.sender.name}
                onChange={(e) => {
                  setFormData((p) => ({
                    ...p,
                    sender: { ...p.sender, name: e.target.value },
                  }));
                  if (formErrors.sender_name) {
                    setFormErrors((p) => ({ ...p, sender_name: "" }));
                  }
                }}
                error={formErrors.sender_name}
              />
            </div>

            {/* Sender Collapsible Address Block */}
            {formData.sender.show_details && (
              <div className="relative p-2 rounded-md bg-slate-50 border border-slate-200/70 space-y-2 animate-in fade-in-50 duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Sender Address Details
                  </span>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        sender: {
                          ...p.sender,
                          show_details: false,
                          address: "",
                          city: "",
                          pincode: "",
                        },
                      }))
                    }
                    className="p-0.5 rounded text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                    title="Remove address details"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <FormInput
                  label="Address"
                  placeholder="Enter street / area address"
                  value={formData.sender.address || ""}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      sender: { ...p.sender, address: e.target.value },
                    }))
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <FormInput
                    label="City"
                    placeholder="City Name"
                    value={formData.sender.city || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        sender: { ...p.sender, city: e.target.value },
                      }))
                    }
                  />

                  <FormInput
                    label="Pincode"
                    placeholder="Pincode"
                    value={formData.sender.pincode || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        sender: { ...p.sender, pincode: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </FormCard>

          {/* Receiver Details */}
          <FormCard
            title="Receiver"
            icon={UserCheck}
            action={
              !formData.receiver.show_details ? (
                <Button
                  type="button"
                  size="sm"
                  tabIndex={-1}
                  onClick={() =>
                    setFormData((p) => ({
                      ...p,
                      receiver: { ...p.receiver, show_details: true },
                    }))
                  }
                  className="h-6 px-2 text-[10px] font-semibold bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-none"
                >
                  <Plus className="w-2.5 h-2.5 mr-0.5" />
                  Add Details
                </Button>
              ) : (
                <span className="text-[9px] text-green-700 font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                  Address Details Active
                </span>
              )
            }
          >
            {/* Receiver Primary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              <FormInput
                label="Contact No"
                required
                placeholder="Contact No"
                value={formData.receiver.contact_no}
                onChange={(e) => {
                  setFormData((p) => ({
                    ...p,
                    receiver: { ...p.receiver, contact_no: e.target.value },
                  }));
                  if (formErrors.receiver_contact) {
                    setFormErrors((p) => ({ ...p, receiver_contact: "" }));
                  }
                }}
                error={formErrors.receiver_contact}
              />

              <FormInput
                label="GSTIN"
                placeholder="GST NO"
                uppercase
                value={formData.receiver.gstin}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    receiver: { ...p.receiver, gstin: e.target.value.toUpperCase() },
                  }))
                }
              />

              <FormInput
                label="Name"
                required
                placeholder="Customer Name"
                value={formData.receiver.name}
                onChange={(e) => {
                  setFormData((p) => ({
                    ...p,
                    receiver: { ...p.receiver, name: e.target.value },
                  }));
                  if (formErrors.receiver_name) {
                    setFormErrors((p) => ({ ...p, receiver_name: "" }));
                  }
                }}
                error={formErrors.receiver_name}
              />
            </div>

            {/* Receiver Collapsible Address Block */}
            {formData.receiver.show_details && (
              <div className="relative p-2 rounded bg-slate-50 border border-slate-200/70 space-y-1.5 animate-in fade-in-50 duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Receiver Address Details
                  </span>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        receiver: {
                          ...p.receiver,
                          show_details: false,
                          address: "",
                          city: "",
                          pincode: "",
                        },
                      }))
                    }
                    className="p-0.5 rounded text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                    title="Hide address details"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <FormInput
                  label="Address"
                  placeholder="Address Line"
                  value={formData.receiver.address || ""}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      receiver: { ...p.receiver, address: e.target.value },
                    }))
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <FormInput
                    label="City"
                    placeholder="City"
                    value={formData.receiver.city || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        receiver: { ...p.receiver, city: e.target.value },
                      }))
                    }
                  />

                  <FormInput
                    label="Pincode"
                    placeholder="Pincode"
                    value={formData.receiver.pincode || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        receiver: { ...p.receiver, pincode: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </FormCard>
        </div>

        {/* ─── 3. Package Items Section ──────────────────────────────────────── */}
        <FormCard title="Package Details" icon={Package}>
          <div className="space-y-1">
            {formData.packages.map((pkg, idx) => (
              <div
                key={pkg.id}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-1.5 items-start p-2 rounded bg-slate-50/70 border border-slate-200/60 transition-colors"
              >
                {/* Qty (span 1) */}
                <div className="lg:col-span-1">
                  <FormInput
                    label="Qty"
                    required
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={pkg.qty}
                    onChange={(e) =>
                      updatePackageField(
                        idx,
                        "qty",
                        e.target.value === "" ? "" : Math.max(1, Number(e.target.value))
                      )
                    }
                    error={formErrors[`pkg_qty_${idx}`]}
                  />
                </div>

                {/* Material (span 2) */}
                <div className="lg:col-span-2">
                  <FormInput
                    label="Material"
                    placeholder="e.g. Cotton Box"
                    value={pkg.material}
                    onChange={(e) => updatePackageField(idx, "material", e.target.value)}
                  />
                </div>

                {/* Packing (span 2) */}
                <div className="lg:col-span-2">
                  <FormInput
                    label="Packing"
                    placeholder="e.g. Carton"
                    value={pkg.packing}
                    onChange={(e) => updatePackageField(idx, "packing", e.target.value)}
                  />
                </div>

                {/* Payment Type (span 2) */}
                <div className="lg:col-span-2">
                  <FormSelect
                    label="Payment Type"
                    required
                    options={PAYMENT_TYPE_OPTIONS}
                    value={pkg.payment_type}
                    onChange={(val) =>
                      updatePackageField(idx, "payment_type", val as PaymentType)
                    }
                    placeholder="Select Type"
                  />
                </div>

                {/* Price (span 2) */}
                <div className="lg:col-span-2">
                  <FormInput
                    label="Price (₹)"
                    required
                    type="number"
                    min="0"
                    placeholder="Price"
                    value={pkg.price}
                    onChange={(e) =>
                      updatePackageField(
                        idx,
                        "price",
                        e.target.value === "" ? "" : Math.max(0, Number(e.target.value))
                      )
                    }
                    error={formErrors[`pkg_price_${idx}`]}
                  />
                </div>

                {/* Total (span 2) */}
                <div className="lg:col-span-2">
                  <FormInput
                    label="Total (₹)"
                    type="text"
                    value={(Number(pkg.qty) || 1) * (Number(pkg.price) || 0)}
                    disabled
                    readOnly
                  />
                </div>

                {/* Action buttons (span 1 - Plus only on last row, Remove on all if length > 1) */}
                <div className="lg:col-span-1 space-y-1">
                  <span className="text-[11px] font-bold invisible select-none leading-none block">&nbsp;</span>
                  <div className="flex items-center justify-end sm:justify-center gap-1 h-8">
                    {idx === formData.packages.length - 1 && (
                      <Button
                        type="button"
                        size="sm"
                        tabIndex={-1}
                        onClick={addPackageRow}
                        className="h-8 w-7 p-0 bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-none"
                        title="Add row"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {formData.packages.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        tabIndex={-1}
                        variant="destructive"
                        onClick={() => removePackageRow(idx)}
                        className="h-8 w-7 p-0 bg-[#e74c3c] hover:bg-[#c0392b] text-white shadow-none"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </FormCard>

        {/* ─── 4. Payment & Additional Details Section ───────────────────────── */}
        <FormCard title="Payment & Additional Details" icon={CreditCard}>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Payment Method */}
            <FormSelect
              label="Payment Method"
              required
              options={PAYMENT_METHOD_OPTIONS}
              value={formData.payment_method}
              onChange={(val) =>
                setFormData((p) => ({ ...p, payment_method: val as PaymentMethod }))
              }
              placeholder="Select Payment Method"
            />

            {/* Bilty Charge */}
            <FormInput
              label="Bilty Charge (₹)"
              type="number"
              value={formData.bilty_charge}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  bilty_charge: Number(e.target.value) || 0,
                }))
              }
            />

            {/* Net Cost (Disabled Input Field) */}
            <FormInput
              label="Net Cost (₹)"
              type="text"
              value={calculatedNetCost}
              disabled
              readOnly
            />

            {/* Sender Id Proof */}
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-black flex items-center gap-0.5 leading-none">Sender Id Proof</Label>
              <FileUploadPreview
                label="Sender Id Proof"
                fileName={formData.sender_id_proof?.name}
                onFileSelect={(file) => setFormData((p) => ({ ...p, sender_id_proof: file }))}
                onRemove={() => setFormData((p) => ({ ...p, sender_id_proof: null }))}
                accept="image/*,.pdf"
                showViewLink={false}
              />
            </div>
          </div>

          {/* Remarks and Cancel Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <FormTextarea
              label="Remark"
              placeholder="Optional remarks or notes..."
              value={formData.remark}
              onChange={(e) => setFormData((p) => ({ ...p, remark: e.target.value }))}
            />

            <FormTextarea
              label="Cancel Reason"
              placeholder="Reason if cancelled..."
              value={formData.cancel_reason}
              onChange={(e) => setFormData((p) => ({ ...p, cancel_reason: e.target.value }))}
            />
          </div>

          {/* Driver Details Toggle */}
          <div className="pt-0.5 border-t border-slate-100">
            {!formData.show_driver_details ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                tabIndex={-1}
                onClick={() =>
                  setFormData((p) => ({ ...p, show_driver_details: true }))
                }
                className="h-7 text-xs text-[#2980b9] border-[#2980b9]/30 hover:bg-blue-50"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Driver Details
              </Button>
            ) : (
              <div className="p-2 rounded bg-slate-50 border border-slate-200/70 space-y-1.5 animate-in fade-in-50 duration-150">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <UserCog className="w-3.5 h-3.5 text-[#2980b9]" />
                    <h3 className="text-[11px] font-bold text-black uppercase tracking-wider">
                      Driver &amp; Vehicle Information
                    </h3>
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        show_driver_details: false,
                        driver: {
                          driver_id: "",
                          driver_name: "",
                          driver_mobile: "",
                          vehicle_no: "",
                          license_no: "",
                        },
                      }))
                    }
                    className="text-slate-400 hover:text-red-600 p-0.5 transition-colors"
                    title="Remove driver details"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Searchable Driver Select Dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <FormSelect
                    label="Select Driver"
                    options={driverOptions}
                    value={formData.driver?.driver_id || ""}
                    onChange={handleDriverSelect}
                    placeholder="Search & select driver..."
                    searchPlaceholder="Search name, vehicle..."
                  />
                </div>

                {/* Auto-populated & Editable Driver Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 pt-0.5">
                  <FormInput
                    label="Driver Name"
                    placeholder="Driver Name"
                    value={formData.driver?.driver_name || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        driver: { ...p.driver, driver_name: e.target.value },
                      }))
                    }
                  />

                  <FormInput
                    label="Driver Mobile"
                    placeholder="Driver Mobile No"
                    value={formData.driver?.driver_mobile || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        driver: { ...p.driver, driver_mobile: e.target.value },
                      }))
                    }
                  />

                  <FormInput
                    label="Vehicle No"
                    placeholder="GJ-05-XX-1234"
                    uppercase
                    value={formData.driver?.vehicle_no || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        driver: { ...p.driver, vehicle_no: e.target.value.toUpperCase() },
                      }))
                    }
                  />

                  <FormInput
                    label="License No"
                    placeholder="License Number"
                    uppercase
                    value={formData.driver?.license_no || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        driver: { ...p.driver, license_no: e.target.value.toUpperCase() },
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </FormCard>

        {/* ─── Form Actions Footer ───────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1.5">
          <Button
            type="submit"
            disabled={formMutation.isPending}
            className="h-8 px-7 bg-[#2980b9] hover:bg-[#2471a3] text-white font-semibold text-xs shadow-xs transition-all"
          >
            {formMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                {isEdit ? "Updating..." : "Saving..."}
              </>
            ) : (
              <>
                <FileCheck className="w-3.5 h-3.5 mr-1.5" />
                {isEdit ? "Update Booking" : "Add Booking"}
              </>
            )}
          </Button>

          <Button
            type="button"
            data-action="cancel"
            variant="outline"
            onClick={() => router.push("/reports/booking")}
            className="h-8 px-5 text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
