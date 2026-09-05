"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Truck,
  User,
  UserCheck,
  Package,
  CreditCard,
  Plus,
  Trash2,
  Loader2,
  Check,
  RotateCcw,
  Save,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { usePublicBranchList } from "@/lib/hooks";
import {
  CUSTOMER_BOOKING_REPORTS_QUERY_KEY,
  BOOKING_REPORTS_QUERY_KEY,
} from "@/lib/hooks/useReports";
import { createCustomerBooking } from "@/lib/api/booking";
import { PublicBranchItem } from "@/lib/api/branch";
import { getStoredUser, getStoredUserRole } from "@/lib/api/auth";
import { showToast } from "@/lib/toast";
import { printBookingSlip } from "@/components/booking/BookingPrintSlip";
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
  initialFromBranchId?: string;
  isPublic?: boolean;
  onBackToBranchSelection?: () => void;
}

export default function CustomerBookingForm({
  initialFromBranchId,
  isPublic = false,
  onBackToBranchSelection,
}: CustomerBookingFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ─── Current User & Role ───────────────────────────────────────────────────
  const currentUser = useMemo(() => getStoredUser(), []);
  const currentRole = useMemo(() => (getStoredUserRole() || "").toLowerCase(), []);
  const isAdminOrSuperAdmin = ["superadmin", "admin", "super_admin", "super-admin"].includes(
    currentRole
  );
  const ownBranchId = String(currentUser?._id || currentUser?.id || "");

  // ─── Branches Query (GET /branchList) ───────────────────────────────────────
  const { data: branchRes } = usePublicBranchList();
  const branchList: PublicBranchItem[] = useMemo(() => {
    if (Array.isArray(branchRes?.data)) return branchRes.data;
    return [];
  }, [branchRes]);

  const branchOptions = useMemo<FormSelectOption[]>(() => {
    return branchList.map((b: PublicBranchItem) => {
      const name = b.branchName || (b as any).name || "";
      const code = b.branchCode || (b as any).code || "";
      return {
        value: b._id,
        label: code ? `${name} (${code})` : name,
      };
    });
  }, [branchList]);

  // ─── Form State ───────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<CustomerBookingFormData>({
    from_branch_id: initialFromBranchId || ownBranchId || "",
    to_branch_id: "",
    delivery_type: "office",
    has_bill: false,
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
    docketNo1?: string;
    docketNo2?: string;
    message?: string;
    bookingData?: any;
  } | null>(null);

  // Set default from_branch
  useEffect(() => {
    if (initialFromBranchId) {
      setFormData((p) => ({ ...p, from_branch_id: initialFromBranchId }));
    } else if (!isAdminOrSuperAdmin && ownBranchId && !formData.from_branch_id) {
      setFormData((p) => ({ ...p, from_branch_id: ownBranchId }));
    }
  }, [initialFromBranchId, isAdminOrSuperAdmin, ownBranchId, formData.from_branch_id]);

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
      showToast("warning", "Warning", "At least one package is required.");
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
        fromBranchId: data.from_branch_id,
        toBranchId: data.to_branch_id,
        sender: {
          name: data.sender.name.trim(),
          mobile: data.sender.contact_no.trim(),
          gstin: data.sender.gstin.trim(),
          address: data.sender.address.trim(),
          city: data.sender.city.trim(),
          pincode: data.sender.pincode.trim(),
        },
        receiver: {
          name: data.receiver.name.trim(),
          mobile: data.receiver.contact_no.trim(),
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
        hasBill: false,
        billNo: "",
        billImage: "",
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
        biltyCharge: 20,
        pickupCharge: 0,
        loadingCharge: 0,
        deliveryCharge: 0,
        extraCharge: 0,
        discount: 0,
        status: "draft",
        remark: data.remark.trim(),
      };

      return await createCustomerBooking(payload);
    },
    onSuccess: (result: any) => {
      const apiMessage = result?.message || "Customer Booking Created Successfully!";
      showToast("success", "Success", apiMessage);

      queryClient.invalidateQueries({ queryKey: CUSTOMER_BOOKING_REPORTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: BOOKING_REPORTS_QUERY_KEY });

      const bookingData = result?.data || result;
      const docketNo1 = bookingData?.docketNo1 || "";
      const docketNo2 = bookingData?.docketNo2 || "";
      const docketNo = docketNo2 || docketNo1 || bookingData?.docketNo || "";

      setSuccessModal({
        isOpen: true,
        docketNo,
        docketNo1,
        docketNo2,
        message: apiMessage,
        bookingData,
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
      from_branch_id: initialFromBranchId || (isAdminOrSuperAdmin ? "" : ownBranchId),
      to_branch_id: "",
      delivery_type: "office",
      has_bill: false,
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
    setFormErrors({});
  };



  return (
    <div className="w-full space-y-1 pb-6">
      <form
        data-booking-form="true"
        onSubmit={handleSubmit}
        className="customer-booking-form space-y-1"
      >
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
                disabled={Boolean(initialFromBranchId)}
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
              />
            </div>
          </FormCard>

          {/* Transport Card */}
          <FormCard title="Transport" icon={Truck}>
            <div className="grid grid-cols-1 gap-1.5">
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
                  className="h-6 px-2 text-[10px] font-semibold bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-none cursor-pointer"
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
                    className="p-0.5 rounded text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
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
                  className="h-6 px-2 text-[10px] font-semibold bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-none cursor-pointer"
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
                    className="p-0.5 rounded text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
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

        {/* ─── 3. Package Items Section (Simplified for Customer) ────────────── */}
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
                    onChange={(e) => updatePackageField(idx, "packing", e.target.value)}
                  />
                </div>

                {/* Action buttons (span 1) */}
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
                onChange={(e) => setFormData((p) => ({ ...p, remark: e.target.value }))}
              />
            </div>
          </div>
        </FormCard>

        {/* ─── Form Actions ──────────────────────────────────────────────────── */}
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
                <span>Submit Booking</span>
              </>
            )}
          </Button>
        </div>
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

          {/* Docket / Tracking Information Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-center my-2">
            {successModal?.docketNo1 && (
              <div className="flex items-center justify-between text-xs px-2">
                <span className="text-slate-500 font-medium">Docket No:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {successModal.docketNo1}
                </span>
              </div>
            )}
            {successModal?.docketNo2 && (
              <div className="flex items-center justify-between text-xs px-2">
                <span className="text-slate-500 font-medium">Tracking No:</span>
                <span className="font-mono font-bold text-[#2980b9] text-sm">
                  {successModal.docketNo2}
                </span>
              </div>
            )}
            {!successModal?.docketNo1 && !successModal?.docketNo2 && successModal?.docketNo && (
              <div className="flex items-center justify-between text-xs px-2">
                <span className="text-slate-500 font-medium">Tracking No:</span>
                <span className="font-mono font-bold text-[#2980b9] text-sm">
                  {successModal.docketNo}
                </span>
              </div>
            )}
          </div>

          {/* Action Button: PDF Slip */}
          <div className="my-2">
            <Button
              type="button"
              onClick={() => {
                const bData = successModal?.bookingData;
                if (!bData) return;
                const fromBranchObj =
                  bData.fromBranch ||
                  branchList.find((b) => String(b._id) === String(formData.from_branch_id));
                const toBranchObj =
                  bData.toBranch ||
                  branchList.find((b) => String(b._id) === String(formData.to_branch_id));
                printBookingSlip({
                  booking: bData,
                  fromBranch: fromBranchObj,
                  toBranch: toBranchObj,
                  user: getStoredUser(),
                });
              }}
              className="w-full bg-[#2980b9] hover:bg-[#2471a3] text-white h-9 text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Download / Print PDF Slip</span>
            </Button>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSuccessModal(null);
                handleReset();
              }}
              className="flex-1 text-xs cursor-pointer"
            >
              Book Another Parcel
            </Button>
            {onBackToBranchSelection && (
              <Button
                type="button"
                onClick={() => {
                  setSuccessModal(null);
                  onBackToBranchSelection();
                }}
                className="flex-1 bg-[#2980b9] hover:bg-[#2471a3] text-white text-xs cursor-pointer"
              >
                Change Branch
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
