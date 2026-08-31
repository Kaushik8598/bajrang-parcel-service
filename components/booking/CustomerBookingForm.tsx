"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Truck,
  User,
  UserCheck,
  Package,
  CreditCard,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Check,
  RotateCcw,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect, type FormSelectOption } from "@/components/ui/form-select";
import { FormCard } from "@/components/ui/form-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useOnlyBranchList, useUpload } from "@/lib/hooks";
import {
  CUSTOMER_BOOKING_REPORTS_QUERY_KEY,
  BOOKING_REPORTS_QUERY_KEY,
} from "@/lib/hooks/useReports";
import {
  getBookingById,
  createParcelBooking,
  updateParcelBooking,
} from "@/lib/api/booking";
import { getStoredUser, getStoredUserRole } from "@/lib/api/auth";
import { showToast } from "@/lib/toast";
import { FileUploadPreview } from "@/components/ui/file-upload-preview";
import type {
  GoodsValue,
  DeliveryType,
  PaymentMethod,
} from "@/lib/types/booking";

const GOODS_VALUE_OPTIONS: FormSelectOption[] = [
  { value: "500", label: "500" },
  { value: "1000", label: "1000" },
  { value: "2000", label: "2000" },
];

const DELIVERY_TYPE_OPTIONS: FormSelectOption[] = [
  { value: "office", label: "Office" },
  { value: "door", label: "Door" },
];

const PAYMENT_METHOD_LOCKED_OPTIONS: FormSelectOption[] = [
  { value: "To Pay", label: "To Pay" },
];

export interface CustomerPackageItem {
  id: string;
  material: string;
  packing: string;
  qty: number | "";
}

export interface CustomerBookingFormData {
  from_branch_id: string;
  to_branch_id: string;
  delivery_type: DeliveryType;
  has_bill: boolean;
  bill_no: string;
  bill_image: string;
  goods_value: GoodsValue;
  sender: {
    name: string;
    contact_no: string;
    gstin: string;
    address: string;
    city: string;
    pincode: string;
    show_details: boolean;
  };
  receiver: {
    name: string;
    contact_no: string;
    gstin: string;
    address: string;
    city: string;
    pincode: string;
    show_details: boolean;
  };
  packages: CustomerPackageItem[];
  payment_method: PaymentMethod;
  remark: string;
}

export interface CustomerBookingFormProps {
  bookingId?: string;
  isEdit?: boolean;
  isView?: boolean;
  prefetchedBooking?: any;
  hideHeader?: boolean;
}

export default function CustomerBookingForm({
  bookingId,
  isEdit = false,
  isView = false,
  prefetchedBooking,
  hideHeader = false,
}: CustomerBookingFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { uploadFile, uploadingFields } = useUpload();

  // ─── Current User & Role ───────────────────────────────────────────────────
  const currentUser = useMemo(() => getStoredUser(), []);
  const currentRole = useMemo(() => (getStoredUserRole() || "").toLowerCase(), []);
  const isAdminOrSuperAdmin = ["superadmin", "admin", "super_admin", "super-admin"].includes(
    currentRole
  );
  const ownBranchId = String(currentUser?._id || currentUser?.id || "");

  // ─── Branches Query (GET /user/onlyBranch) ─────────────────────────────────
  const { data: branchRes } = useOnlyBranchList();
  const branchList = useMemo(() => {
    return (branchRes?.data as any)?.users || (branchRes as any)?.users || [];
  }, [branchRes]);

  const branchOptions = useMemo<FormSelectOption[]>(() => {
    return branchList.map((b: { _id: string; name: string; code: string; role?: string }) => ({
      value: b._id,
      label: b.code ? `${b.name} (${b.code})` : b.name,
    }));
  }, [branchList]);

  // ─── Fetch Booking by ID (for Edit or View) ─────────────────────────────────
  const { data: fetchedBooking, isLoading: isBookingLoading } = useQuery<any>({
    queryKey: ["customer-booking", bookingId],
    queryFn: () => getBookingById(bookingId!),
    enabled: Boolean((isEdit || isView) && bookingId && !prefetchedBooking),
  });

  const activeBooking = prefetchedBooking || fetchedBooking;

  // ─── Form State ────────────────────────────────────────────────────────────
  const [billType, setBillType] = useState<"with_bill" | "without_bill">("with_bill");
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billFileUrl, setBillFileUrl] = useState<string>("");

  const [formData, setFormData] = useState<CustomerBookingFormData>({
    from_branch_id: ownBranchId || "",
    to_branch_id: "",
    delivery_type: "office",
    has_bill: true,
    bill_no: "",
    bill_image: "",
    goods_value: 500,
    sender: {
      name: "",
      contact_no: "",
      gstin: "",
      address: "",
      city: "",
      pincode: "",
      show_details: false,
    },
    receiver: {
      name: "",
      contact_no: "",
      gstin: "",
      address: "",
      city: "",
      pincode: "",
      show_details: false,
    },
    packages: [
      {
        id: "pkg-1",
        material: "",
        packing: "",
        qty: 1,
      },
    ],
    payment_method: "To Pay",
    remark: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    docketNo?: string;
    message?: string;
  } | null>(null);

  // Set default from_branch for non-admin
  useEffect(() => {
    if (!isAdminOrSuperAdmin && ownBranchId && !formData.from_branch_id) {
      setFormData((p) => ({ ...p, from_branch_id: ownBranchId }));
    }
  }, [isAdminOrSuperAdmin, ownBranchId, formData.from_branch_id]);

  // ─── Pre-fill on Edit / View ───────────────────────────────────────────────
  useEffect(() => {
    if (activeBooking) {
      const b = activeBooking.booking || activeBooking;
      const hasBill = b.hasBill === true || Boolean(b.billNo || b.bill_no);
      setBillType(hasBill ? "with_bill" : "without_bill");
      setBillFileUrl(b.billImage || b.bill_image || b.bill_file_url || "");

      const items = Array.isArray(b.items) && b.items.length > 0 ? b.items : b.packages;
      const pkgs: CustomerPackageItem[] =
        Array.isArray(items) && items.length > 0
          ? items.map((it: any, i: number) => ({
              id: it._id || `pkg-${i + 1}`,
              material: it.material || "",
              packing: it.packing || "",
              qty: Number(it.parcel ?? it.qty ?? it.quantity ?? 1),
            }))
          : [
              {
                id: "pkg-1",
                material: "",
                packing: "",
                qty: 1,
              },
            ];

      setFormData({
        from_branch_id: String(
          b.from_branch_id || b.fromBranch?._id || b.fromBranch || ""
        ),
        to_branch_id: String(
          b.to_branch_id || b.toBranch?._id || b.toBranch || ""
        ),
        delivery_type: (b.deliveryInfo?.deliveryType || b.delivery_type || "office") as DeliveryType,
        has_bill: hasBill,
        bill_no: b.billNo || b.bill_no || "",
        bill_image: b.billImage || b.bill_image || "",
        goods_value: Number(b.goodsValue || b.goods_value || 500) as GoodsValue,
        sender: {
          name: b.sender?.name || "",
          contact_no: b.sender?.contact_no || b.sender?.mobile || "",
          gstin: b.sender?.gstin || b.sender?.gst || "",
          address: b.sender?.address || "",
          city: b.sender?.city || "",
          pincode: b.sender?.pincode || "",
          show_details: Boolean(b.sender?.address || b.sender?.city || b.sender?.gstin),
        },
        receiver: {
          name: b.receiver?.name || "",
          contact_no: b.receiver?.contact_no || b.receiver?.mobile || "",
          gstin: b.receiver?.gstin || b.receiver?.gst || "",
          address: b.receiver?.address || "",
          city: b.receiver?.city || "",
          pincode: b.receiver?.pincode || "",
          show_details: Boolean(b.receiver?.address || b.receiver?.city || b.receiver?.gstin),
        },
        packages: pkgs,
        payment_method: "To Pay",
        remark: b.remark || "",
      });
    }
  }, [activeBooking]);

  // ─── Bill File Upload ──────────────────────────────────────────────────────
  const handleBillFileUpload = async (file: File) => {
    const res = await uploadFile(file, "billFile");
    if (res?.url) {
      setBillFile(file);
      setBillFileUrl(res.url);
      setFormData((p) => ({ ...p, bill_image: res.url }));
    }
  };

  // ─── Package Row Management ────────────────────────────────────────────────
  const addPackageRow = () => {
    setFormData((p) => ({
      ...p,
      packages: [
        ...p.packages,
        {
          id: `pkg-${Date.now()}`,
          material: "",
          packing: "",
          qty: 1,
        },
      ],
    }));
  };

  const removePackageRow = (index: number) => {
    if (formData.packages.length <= 1) {
      showToast("warning", "At least one package is required.");
      return;
    }
    setFormData((p) => ({
      ...p,
      packages: p.packages.filter((_, i) => i !== index),
    }));
  };

  const updatePackageField = (
    index: number,
    field: keyof CustomerPackageItem,
    value: string | number
  ) => {
    setFormData((p) => {
      const updated = [...p.packages];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return { ...p, packages: updated };
    });
    if (formErrors[`pkg_${field}_${index}`]) {
      setFormErrors((p) => ({ ...p, [`pkg_${field}_${index}`]: "" }));
    }
  };

  // ─── Validation ────────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.from_branch_id) errors.from_branch_id = "Please select From Branch.";
    if (!formData.to_branch_id) errors.to_branch_id = "Please select To Branch.";
    if (
      formData.from_branch_id &&
      formData.to_branch_id &&
      formData.from_branch_id === formData.to_branch_id
    ) {
      errors.to_branch_id = "From Branch and To Branch cannot be identical.";
    }

    // Sender validation
    if (!formData.sender.contact_no.trim()) {
      errors.sender_contact = "Sender contact no is required.";
    } else if (!/^[6-9]\d{9}$/.test(formData.sender.contact_no.trim())) {
      errors.sender_contact = "Contact number must be 10 digits starting with 6-9.";
    }
    if (!formData.sender.name.trim()) {
      errors.sender_name = "Sender name is required.";
    }

    // Receiver validation
    if (!formData.receiver.contact_no.trim()) {
      errors.receiver_contact = "Receiver contact no is required.";
    } else if (!/^[6-9]\d{9}$/.test(formData.receiver.contact_no.trim())) {
      errors.receiver_contact = "Contact number must be 10 digits starting with 6-9.";
    }
    if (!formData.receiver.name.trim()) {
      errors.receiver_name = "Receiver name is required.";
    }

    // Bill Validation
    if (billType === "with_bill" && !formData.bill_no.trim()) {
      errors.bill_no = "Bill No is required when With Bill is selected.";
    }

    // Packages validation
    if (formData.packages.length === 0) {
      errors.packages = "At least one package is required.";
    } else {
      formData.packages.forEach((pkg, idx) => {
        if (!pkg.qty || Number(pkg.qty) <= 0) {
          errors[`pkg_qty_${idx}`] = "Qty > 0 required.";
        }
        if (!pkg.material.trim()) {
          errors[`pkg_material_${idx}`] = "Material is required.";
        }
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── Mutation for Submission ───────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async (data: CustomerBookingFormData) => {
      const payload: Record<string, unknown> = {
        fromBranch: data.from_branch_id,
        toBranch: data.to_branch_id,
        sender: {
          name: data.sender.name.trim(),
          contact_no: data.sender.contact_no.trim(),
          gstin: data.sender.gstin.trim(),
          address: data.sender.address.trim(),
          city: data.sender.city.trim(),
          pincode: data.sender.pincode.trim(),
        },
        receiver: {
          name: data.receiver.name.trim(),
          contact_no: data.receiver.contact_no.trim(),
          gstin: data.receiver.gstin.trim(),
          address: data.receiver.address.trim(),
          city: data.receiver.city.trim(),
          pincode: data.receiver.pincode.trim(),
        },
        items: data.packages.map((pkg) => ({
          parcel: Number(pkg.qty) || 1,
          material: pkg.material.trim(),
          packing: pkg.packing.trim(),
          priceType: "direct",
          rate: 0,
          amount: 0,
        })),
        hasBill: billType === "with_bill",
        billNo: billType === "with_bill" ? data.bill_no.trim() : "",
        billImage: billFileUrl || "",
        goodsValue: Number(data.goods_value) || 500,
        deliveryInfo: {
          deliveryType: data.delivery_type || "office",
          receiverName: "",
          receiverMobile: "",
          deliveryProof: "",
          deliveredAt: "",
          deliveryRemark: "",
        },
        paymentMethod: "To Pay",
        finalBillAmount: 0,
        hamaliCost: 0,
        biltyCharge: 0,
        pickupCharge: 0,
        loadingCharge: 0,
        deliveryCharge: 0,
        extraCharge: 0,
        discount: 0,
        status: "draft",
        remark: data.remark.trim(),
      };

      if (isEdit && bookingId) {
        return await updateParcelBooking(bookingId, payload);
      }
      return await createParcelBooking(payload);
    },
    onSuccess: (result: any) => {
      const apiMessage =
        result?.message ||
        (isEdit ? "Customer Booking Updated Successfully!" : "Customer Booking Created Successfully!");
      showToast("success", "Success", apiMessage);

      queryClient.invalidateQueries({ queryKey: CUSTOMER_BOOKING_REPORTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: BOOKING_REPORTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["customer-booking"] });

      const docketNo = result?.data?.docketNo1 || result?.data?.docketNo || result?.docketNo1 || "";
      setSuccessModal({
        isOpen: true,
        docketNo,
        message: apiMessage,
      });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to submit customer booking.";
      showToast("error", "Error", msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("warning", "Validation Error", "Please fill all required fields correctly.");
      window.scrollTo({ top: 100, behavior: "smooth" });
      return;
    }
    mutation.mutate(formData);
  };

  const handleReset = () => {
    setFormData({
      from_branch_id: isAdminOrSuperAdmin ? "" : ownBranchId,
      to_branch_id: "",
      delivery_type: "office",
      has_bill: true,
      bill_no: "",
      bill_image: "",
      goods_value: 500,
      sender: {
        name: "",
        contact_no: "",
        gstin: "",
        address: "",
        city: "",
        pincode: "",
        show_details: false,
      },
      receiver: {
        name: "",
        contact_no: "",
        gstin: "",
        address: "",
        city: "",
        pincode: "",
        show_details: false,
      },
      packages: [
        {
          id: "pkg-1",
          material: "",
          packing: "",
          qty: 1,
        },
      ],
      payment_method: "To Pay",
      remark: "",
    });
    setBillType("with_bill");
    setBillFile(null);
    setBillFileUrl("");
    setFormErrors({});
  };

  // ─── Enter = Next Field Navigation ──────────────────────────────────────────
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return;

    const target = e.target as HTMLElement;
    if (target.tagName === "BUTTON" && (target as HTMLButtonElement).type === "submit") {
      return;
    }
    if (
      target.tagName === "BUTTON" &&
      (target.getAttribute("data-action") === "cancel" || target.textContent?.trim() === "Cancel")
    ) {
      target.click();
      return;
    }
    if (target.tagName === "TEXTAREA" && e.shiftKey) {
      return;
    }

    e.preventDefault();

    const form = e.currentTarget;
    const allElements = Array.from(
      form.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled]), button[type="submit"]:not([disabled])'
      )
    ).filter((el) => el.offsetParent !== null && el.tabIndex !== -1);

    const currentIndex = allElements.indexOf(target);
    if (currentIndex > -1 && currentIndex < allElements.length - 1) {
      allElements[currentIndex + 1].focus();
    }
  };

  if (isBookingLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#2980b9]" />
        <p className="text-xs font-semibold text-slate-600">Loading booking details...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-1 pb-6">
      {/* ─── Top Header Navigation Bar ───────────────────────────────────────── */}
      {!hideHeader && (
        <div className="bg-white rounded border border-slate-200/80 shadow-2xs px-3 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#2980b9]/10 text-[#2980b9] flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-black tracking-tight leading-tight">
                {isView
                  ? "View Customer Booking"
                  : isEdit
                  ? "Edit Customer Booking"
                  : "Customer Booking Parcel"}
              </h1>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => router.push("/reports/customer-booking")}
            className="bg-[#2980b9] hover:bg-[#2471a3] text-white h-7 px-3 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            View Customer Bookings
          </Button>
        </div>
      )}

      <form
        data-booking-form="true"
        onSubmit={handleSubmit}
        onKeyDown={handleFormKeyDown}
        className="customer-booking-form space-y-1"
      >
        <fieldset disabled={isView} className={`contents space-y-1 ${isView ? "pointer-events-none select-text" : ""}`}>
          {/* ─── 1. Destination & Transport Section ────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {/* Destination Card */}
            <FormCard title="Destination" icon={MapPin}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <FormSelect
                  label="Select From Branch"
                  required
                  searchable
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
                  disabled={!isAdminOrSuperAdmin || isEdit || isView}
                />

                <FormSelect
                  label="Select To Branch"
                  required
                  searchable
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
                  disabled={isEdit || isView}
                />
              </div>
            </FormCard>

            {/* Transport Card */}
            <FormCard title="Transport" icon={Truck}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {/* Bill Type */}
                <FormSelect
                  label="Bill Type"
                  required
                  options={[
                    { value: "with_bill", label: "With Bill" },
                    { value: "without_bill", label: "Without Bill" },
                  ]}
                  value={billType}
                  onChange={(val) => {
                    setBillType(val as "with_bill" | "without_bill");
                    if (val === "without_bill") {
                      setFormData((p) => ({ ...p, bill_no: "" }));
                      setBillFile(null);
                      setBillFileUrl("");
                    }
                  }}
                  placeholder="Select Bill Type"
                />

                {/* Goods Value */}
                <FormSelect
                  label="Goods Value"
                  required
                  options={GOODS_VALUE_OPTIONS}
                  value={String(formData.goods_value)}
                  onChange={(val) =>
                    setFormData((p) => ({ ...p, goods_value: Number(val) as GoodsValue }))
                  }
                  placeholder="Select Goods Value"
                />

                {/* Bill No (when with_bill) */}
                {billType === "with_bill" && (
                  <FormInput
                    label="Bill No"
                    required
                    placeholder="Bill No / LR No"
                    value={formData.bill_no}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, bill_no: e.target.value }));
                      if (formErrors.bill_no) setFormErrors((p) => ({ ...p, bill_no: "" }));
                    }}
                    error={formErrors.bill_no}
                  />
                )}

                {/* Bill Upload (when with_bill) */}
                {billType === "with_bill" && (
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-black flex items-center gap-0.5 leading-none">
                      Bill Upload
                    </Label>
                    <FileUploadPreview
                      label="Bill"
                      fileName={billFile?.name}
                      fileUrl={billFileUrl}
                      disabled={isView}
                      isUploading={uploadingFields["billFile"]}
                      onFileSelect={handleBillFileUpload}
                      onRemove={() => {
                        setBillFile(null);
                        setBillFileUrl("");
                        setFormData((p) => ({ ...p, bill_image: "" }));
                      }}
                      accept="image/*,.pdf"
                      showViewLink={true}
                    />
                  </div>
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
                !isView && !formData.sender.show_details ? (
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
                ) : null
              }
            >
              {/* Sender Primary Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <FormInput
                  label="Contact No"
                  required
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={formData.sender.contact_no}
                  disabled={isView}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    if (raw.length > 0 && !/^[6-9]/.test(raw)) {
                      return;
                    }
                    const clean = raw.slice(0, 10);
                    setFormData((p) => ({ ...p, sender: { ...p.sender, contact_no: clean } }));
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
                <div className="relative p-2 rounded-md bg-slate-50 border border-slate-200/70 space-y-2 mt-2 animate-in fade-in-50 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      Sender Address Details
                    </span>
                    {!isView && (
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
                    )}
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
                !isView && !formData.receiver.show_details ? (
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
                ) : null
              }
            >
              {/* Receiver Primary Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <FormInput
                  label="Contact No"
                  required
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={formData.receiver.contact_no}
                  disabled={isView}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    if (raw.length > 0 && !/^[6-9]/.test(raw)) {
                      return;
                    }
                    const clean = raw.slice(0, 10);
                    setFormData((p) => ({ ...p, receiver: { ...p.receiver, contact_no: clean } }));
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
                <div className="relative p-2 rounded bg-slate-50 border border-slate-200/70 space-y-1.5 mt-2 animate-in fade-in-50 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      Receiver Address Details
                    </span>
                    {!isView && (
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
                    )}
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

          {/* ─── 3. Package Items Section (Simplified for Customer) ───────────── */}
          <FormCard title="Package Details" icon={Package}>
            <div className="space-y-1">
              {formData.packages.map((pkg, idx) => (
                <div
                  key={pkg.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-start p-2 rounded bg-slate-50/70 border border-slate-200/60 transition-colors"
                >
                  {/* Qty (span 2) */}
                  <div className="sm:col-span-2">
                    <FormInput
                      label="Qty"
                      required
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={pkg.qty === 0 ? "" : pkg.qty}
                      disabled={isView}
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

                  {/* Material (span 5) */}
                  <div className="sm:col-span-5">
                    <FormInput
                      label="Material"
                      required
                      placeholder="e.g. Cotton Box / Sarees / Clothes"
                      value={pkg.material}
                      disabled={isView}
                      onChange={(e) => updatePackageField(idx, "material", e.target.value)}
                      error={formErrors[`pkg_material_${idx}`]}
                    />
                  </div>

                  {/* Packing (span 4) */}
                  <div className="sm:col-span-4">
                    <FormInput
                      label="Packing"
                      placeholder="e.g. Carton / Bag / Box"
                      value={pkg.packing}
                      disabled={isView}
                      onChange={(e) => updatePackageField(idx, "packing", e.target.value)}
                    />
                  </div>

                  {/* Action buttons (span 1) */}
                  {!isView && (
                    <div className="sm:col-span-1 space-y-1">
                      <span className="text-[11px] font-bold invisible select-none leading-none block">&nbsp;</span>
                      <div className="flex items-center justify-end sm:justify-center gap-1 h-8">
                        {idx === formData.packages.length - 1 && (
                          <Button
                            type="button"
                            size="sm"
                            tabIndex={-1}
                            onClick={addPackageRow}
                            className="h-8 w-7 p-0 bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-none cursor-pointer"
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
                            className="h-8 w-7 p-0 bg-[#e74c3c] hover:bg-[#c0392b] text-white shadow-none cursor-pointer"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </FormCard>

          {/* ─── 4. Payment & Additional Details Section ───────────────────────── */}
          <FormCard title="Payment & Additional Details" icon={CreditCard}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 items-start">
              {/* Payment Method (Default 'To Pay' and Locked/Disabled) */}
              <div>
                <FormSelect
                  label="Payment Method"
                  required
                  options={PAYMENT_METHOD_LOCKED_OPTIONS}
                  value="To Pay"
                  onChange={() => {}}
                  disabled={true}
                  placeholder="To Pay"
                />
              </div>

              {/* Delivery Type */}
              <div>
                <FormSelect
                  label="Delivery Type"
                  required
                  options={DELIVERY_TYPE_OPTIONS}
                  value={formData.delivery_type}
                  disabled={isView}
                  onChange={(val) =>
                    setFormData((p) => ({ ...p, delivery_type: val as DeliveryType }))
                  }
                  placeholder="Select Delivery Type"
                />
              </div>

              {/* Remark */}
              <div>
                <FormInput
                  label="Remark"
                  placeholder="Enter remarks or instructions"
                  value={formData.remark}
                  disabled={isView}
                  onChange={(e) => setFormData((p) => ({ ...p, remark: e.target.value }))}
                />
              </div>
            </div>
          </FormCard>

          {/* ─── Form Actions ──────────────────────────────────────────────────── */}
          {!isView && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="h-8 px-4 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>

              <Button
                type="submit"
                disabled={mutation.isPending}
                className="h-8 px-6 bg-[#2980b9] hover:bg-[#2471a3] text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{isEdit ? "Update Booking" : "Submit Booking"}</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </fieldset>
      </form>

      {/* ─── Success Dialog Modal ────────────────────────────────────────────── */}
      <Dialog
        open={Boolean(successModal?.isOpen)}
        onOpenChange={(open) => {
          if (!open) {
            setSuccessModal(null);
            handleReset();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <Check className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-slate-900">
              Customer Booking Successful!
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-600">
              Your parcel booking draft has been submitted successfully.
            </DialogDescription>
          </DialogHeader>

          {successModal?.docketNo && (
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center my-2">
              <span className="text-[11px] text-slate-500 block uppercase font-medium">
                Docket / Tracking Number
              </span>
              <span className="text-lg font-mono font-bold text-[#2980b9] tracking-wide">
                {successModal.docketNo}
              </span>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSuccessModal(null);
                handleReset();
              }}
              className="flex-1 text-xs"
            >
              Book Another Parcel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setSuccessModal(null);
                router.push("/reports/customer-booking");
              }}
              className="flex-1 bg-[#2980b9] hover:bg-[#2471a3] text-white text-xs"
            >
              View Booking Reports
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
