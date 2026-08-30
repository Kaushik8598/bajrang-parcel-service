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
  UserCheck,
  FileCheck,
  Loader2,
  X,
  UserCog,
  Check,
  Printer,
  Barcode,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormInput, FormTextarea } from "@/components/ui/form-input";
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
import { useOnlyBranchList, useDrivers, useDebounce, useUpload } from "@/lib/hooks";
import {
  getBookingById,
  createParcelBooking,
  updateParcelBooking,
  getLastBookedDocket,
  getSenderCustomerSuggestions,
  getReceiverCustomerSuggestions,
} from "@/lib/api/booking";
import { cn } from "@/lib/utils";
import { getStoredUser, getStoredUserRole } from "@/lib/api/auth";
import { showToast } from "@/lib/toast";
import { FileUploadPreview } from "@/components/ui/file-upload-preview";
import { printBookingSlip } from "@/components/booking/BookingPrintSlip";
import { printBookingBarcode } from "@/components/booking/BookingBarcodeSticker";
import type {
  ParcelBookingFormData,
  PackageItem,
  GoodsValue,
  PaymentType,
  PaymentMethod,
  DeliveryType,
} from "@/lib/types/booking";

const GOODS_VALUE_OPTIONS: FormSelectOption[] = [
  { value: "500", label: "500" },
  { value: "1000", label: "1000" },
  { value: "2000", label: "2000" },
];

const PAYMENT_TYPE_OPTIONS: FormSelectOption[] = [
  { value: "Direct", label: "Direct" },
  { value: "Per Package", label: "Per Package" },
];

const DELIVERY_TYPE_OPTIONS: FormSelectOption[] = [
  { value: "office", label: "Office" },
  { value: "door", label: "Door" },
];

export interface ExtractedRefPackage {
  refId: string;
  qty: number;
  material: string;
  packing: string;
  payment_type: PaymentType;
  price: number;
}

function extractReferencePackages(items: any[] | undefined): ExtractedRefPackage[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  const list: ExtractedRefPackage[] = [];

  items.forEach((item: any, idx: number) => {
    const nested = item.packages || item.items || item.packageDetails || item.packageInfo || item.lastItems;
    if (Array.isArray(nested) && nested.length > 0) {
      nested.forEach((p: any, pIdx: number) => {
        const rawPt = String(p.priceType || p.paymentType || p.payment_type || "").toLowerCase();
        const mappedPaymentType: PaymentType =
          rawPt.includes("perpackage") || rawPt === "1" || rawPt === "per package"
            ? "Per Package"
            : "Direct";
        const qty = Number(p.parcel ?? p.qty ?? p.quantity ?? 1) || 1;
        const price = Number(p.rate ?? p.price ?? 0) || 0;
        list.push({
          refId: `ref-${idx}-${pIdx}-${p.material || ""}-${price}-${p._id || p.id || ""}`,
          qty,
          material: String(p.material || ""),
          packing: String(p.packing || ""),
          payment_type: mappedPaymentType,
          price,
        });
      });
    } else {
      const rawPt = String(item.priceType || item.paymentType || item.payment_type || "").toLowerCase();
      const mappedPaymentType: PaymentType =
        rawPt.includes("perpackage") || rawPt === "1" || rawPt === "per package"
          ? "Per Package"
          : "Direct";
      const qty = Number(item.parcel ?? item.qty ?? item.quantity ?? 1) || 1;
      const price = Number(item.rate ?? item.price ?? 0) || 0;
      list.push({
        refId: `ref-${idx}-${item.material || ""}-${price}-${item._id || item.id || ""}`,
        qty,
        material: String(item.material || ""),
        packing: String(item.packing || ""),
        payment_type: mappedPaymentType,
        price,
      });
    }
  });

  return list;
}

export interface ParcelBookingFormProps {
  bookingId?: string;
  isEdit?: boolean;
}

export interface SuccessModalState {
  isOpen: boolean;
  docketNo1?: string;
  docketNo2?: string;
  message?: string;
  bookingData?: any;
}

export default function ParcelBookingForm({ bookingId, isEdit = false }: ParcelBookingFormProps) {
  const router = useRouter();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [billType, setBillType] = useState<"with_bill" | "without_bill">("with_bill");
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billFileUrl, setBillFileUrl] = useState<string>("");
  const [showAdditionalCharges, setShowAdditionalCharges] = useState(false);
  const [successModal, setSuccessModal] = useState<SuccessModalState | null>(null);
  const { uploadFile, uploadingFields } = useUpload();

  // ─── Role & Branch Access (Stable references) ──────────────────────────────
  const currentUser = useMemo(() => getStoredUser(), []);
  const currentRole = useMemo(() => getStoredUserRole() || "", []);
  const isAdminOrSuperAdmin = ["superAdmin", "admin"].includes(currentRole);
  // user._id matches the branch _id in the branch list API response
  const ownBranchId = useMemo(() => {
    return String(currentUser?._id || currentUser?.id || "");
  }, [currentUser]);

  // ─── Booking Preferences & Status ─────────────────────────────────────────
  const bookingPreferences = useMemo(() => {
    return (currentUser as any)?.bookingPreferences || {};
  }, [currentUser]);

  const bookingStatus = useMemo(() => {
    return bookingPreferences?.draftOnlyBooking === true ? "draft" : "confirmed";
  }, [bookingPreferences]);

  // ─── Dynamic Bill Type Options based on bookingPreferences ────────────────
  const billTypeOptions = useMemo<FormSelectOption[]>(() => {
    const list: FormSelectOption[] = [];
    if (bookingPreferences.bookWithBill !== false) {
      list.push({ value: "with_bill", label: "With Bill" });
    }
    if (bookingPreferences.bookWithoutBill !== false) {
      list.push({ value: "without_bill", label: "Without Bill" });
    }
    if (list.length === 0) {
      list.push({ value: "with_bill", label: "With Bill" });
      list.push({ value: "without_bill", label: "Without Bill" });
    }
    return list;
  }, [bookingPreferences]);

  // Auto-sync valid billType if current selection is disabled
  useEffect(() => {
    if (billTypeOptions.length > 0 && !billTypeOptions.some((o) => o.value === billType)) {
      setBillType(billTypeOptions[0].value as "with_bill" | "without_bill");
    }
  }, [billTypeOptions, billType]);

  // ─── Dynamic Payment Method Options based on bookingPreferences ───────────
  const paymentMethodOptions = useMemo<FormSelectOption[]>(() => {
    const list: FormSelectOption[] = [];
    if (bookingPreferences.allowToPayBooking !== false) {
      list.push({ value: "To Pay", label: "To Pay" });
    }
    if (bookingPreferences.allowPaidBooking !== false) {
      list.push({ value: "Paid", label: "Paid" });
    }
    if (bookingPreferences.allowGPayBooking === true) {
      list.push({ value: "GPay", label: "GPay" });
    }
    if (bookingPreferences.allowCreditBooking === true) {
      const pendingLimit = bookingPreferences.creditLimitPending ?? 0;
      list.push({
        value: "Credit",
        label: "Credit",
        subLabel: `Pending Limit: ₹${pendingLimit}`,
      });
    }
    if (bookingPreferences.allowNotPayBooking === true) {
      list.push({ value: "Not Pay", label: "Not Pay" });
    }

    if (list.length === 0) {
      list.push({ value: "To Pay", label: "To Pay" });
      list.push({ value: "Paid", label: "Paid" });
    }
    return list;
  }, [bookingPreferences]);

  // ─── Fetch Booking by ID (for Edit mode) ────────────────────────────────────
  const { data: initialBooking, isLoading: isBookingLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => getBookingById(bookingId!),
    enabled: Boolean(isEdit && bookingId),
  });

  // ─── Fetch Branches (via GET /user/onlyBranch) ──────────────────────────────
  const { data: branchDropdownRes } = useOnlyBranchList();
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

  const branchOptions: FormSelectOption[] = useMemo(
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
  const { data: driversRes } = useDrivers({ page: 1, limit: 100 });
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

  const driverOptions: FormSelectOption[] = useMemo(
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
    delivery_type: "office",
    bilty_charge: Number((currentUser as any)?.bookingPreferences?.biltyCharge ?? 20),
    hamali_cost: Number((currentUser as any)?.bookingPreferences?.hamaliCost ?? 0),
    pickup_charge: 0,
    loading_charge: 0,
    delivery_charge: 0,
    extra_charge: 0,
    net_cost: Number((currentUser as any)?.bookingPreferences?.biltyCharge ?? 20),
    remark: "",
    cancel_reason: "",
    cancel_remark: "",
    show_driver_details: false,
    driver: {
      driver_id: "",
      driver_name: "",
      driver_mobile: "",
      vehicle_no: "",
      license_no: "",
    },
  });

  // Auto-sync default payment_method, bilty_charge, and hamali_cost from bookingPreferences in create mode
  useEffect(() => {
    if (!isEdit) {
      setFormData((p) => {
        const nextPaymentMethod =
          paymentMethodOptions.length > 0 && !paymentMethodOptions.some((o) => o.value === p.payment_method)
            ? (paymentMethodOptions[0].value as PaymentMethod)
            : p.payment_method;
        const nextBiltyCharge =
          bookingPreferences.biltyCharge !== undefined
            ? Number(bookingPreferences.biltyCharge) || 0
            : p.bilty_charge;
        const nextHamaliCost =
          bookingPreferences.hamaliCost !== undefined
            ? Number(bookingPreferences.hamaliCost) || 0
            : p.hamali_cost;

        if (
          p.payment_method === nextPaymentMethod &&
          p.bilty_charge === nextBiltyCharge &&
          p.hamali_cost === nextHamaliCost
        ) {
          return p;
        }

        return {
          ...p,
          payment_method: nextPaymentMethod,
          bilty_charge: nextBiltyCharge,
          hamali_cost: nextHamaliCost,
        };
      });
    }
  }, [isEdit, paymentMethodOptions, bookingPreferences]);

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
        payment_method: initialBooking.payment_method || (initialBooking as any).paymentMethod || "To Pay",
        delivery_type: ((initialBooking as any).deliveryInfo?.deliveryType || initialBooking.delivery_type || "office") as DeliveryType,
        bilty_charge: Number(initialBooking.bilty_charge ?? (initialBooking as any).biltyCharge ?? 20),
        hamali_cost: Number(initialBooking.hamali_cost ?? (initialBooking as any).hamaliCost ?? 0),
        pickup_charge: Number(initialBooking.pickup_charge ?? (initialBooking as any).pickupCharge ?? 0),
        loading_charge: Number(initialBooking.loading_charge ?? (initialBooking as any).loadingCharge ?? 0),
        delivery_charge: Number(initialBooking.delivery_charge ?? (initialBooking as any).deliveryCharge ?? 0),
        extra_charge: Number(initialBooking.extra_charge ?? (initialBooking as any).extraCharge ?? 0),
        net_cost: Number(initialBooking.net_cost ?? (initialBooking as any).finalBillAmount ?? 20),
        sender_id_proof_url: initialBooking.sender_id_proof_url || (initialBooking as any).senderProof || "",
        remark: initialBooking.remark || "",
        cancel_reason: initialBooking.cancel_reason || (initialBooking as any).cancelReason || "",
        cancel_remark: initialBooking.cancel_remark || (initialBooking as any).cancelRemark || "",
        show_driver_details: Boolean(initialBooking.driver?.driver_name),
        driver: {
          driver_id: initialBooking.driver?.driver_id || "",
          driver_name: initialBooking.driver?.driver_name || "",
          driver_mobile: initialBooking.driver?.driver_mobile || "",
          vehicle_no: initialBooking.driver?.vehicle_no || "",
          license_no: initialBooking.driver?.license_no || "",
        },
      });

      const hasExtra = Boolean(
        Number(initialBooking.pickup_charge ?? (initialBooking as any).pickupCharge ?? 0) > 0 ||
        Number(initialBooking.loading_charge ?? (initialBooking as any).loadingCharge ?? 0) > 0 ||
        Number(initialBooking.delivery_charge ?? (initialBooking as any).deliveryCharge ?? 0) > 0 ||
        Number(initialBooking.extra_charge ?? (initialBooking as any).extraCharge ?? 0) > 0 ||
        Number(initialBooking.hamali_cost ?? (initialBooking as any).hamaliCost ?? 0) > 0 ||
        ((initialBooking as any).deliveryInfo?.deliveryType || initialBooking.delivery_type) === "door"
      );
      setShowAdditionalCharges(hasExtra);
    }
  }, [isEdit, initialBooking]);

  // ─── Customer Suggestion States ──────────────────────────────────────────
  const [senderSearch, setSenderSearch] = useState("");
  const debouncedSenderSearch = useDebounce(senderSearch, 300);

  const [receiverSearch, setReceiverSearch] = useState("");
  const debouncedReceiverSearch = useDebounce(receiverSearch, 300);

  const [lastBookingsList, setLastBookingsList] = useState<any[]>([]);

  // Query Sender Suggestions via GET /booking/senderCxSuggetion (loads default list on mount, filters on search)
  const { data: senderSugData } = useQuery({
    queryKey: ["sender-suggestions", debouncedSenderSearch],
    queryFn: () => getSenderCustomerSuggestions(debouncedSenderSearch),
    staleTime: 1000 * 30,
  });

  const senderSuggestions = useMemo(() => {
    return senderSugData?.customers || [];
  }, [senderSugData]);

  // Query Receiver Suggestions via GET /booking/receiverCxSuggetion?senderMobile=...
  const { data: receiverSugData } = useQuery({
    queryKey: ["receiver-suggestions", formData.sender.contact_no, debouncedReceiverSearch],
    queryFn: () =>
      getReceiverCustomerSuggestions(formData.sender.contact_no, debouncedReceiverSearch),
    enabled: Boolean(
      (formData.sender.contact_no && formData.sender.contact_no.trim().length >= 1) ||
      (debouncedReceiverSearch && debouncedReceiverSearch.trim().length >= 1)
    ),
    staleTime: 1000 * 30,
  });

  const receiverSuggestions = useMemo(() => {
    return receiverSugData?.customers || [];
  }, [receiverSugData]);

  // Extract reference packages from last items
  const referencePackages = useMemo(() => {
    return extractReferencePackages(lastBookingsList);
  }, [lastBookingsList]);

  // ─── Sender FormSelect Options ───────────────────────────────────────────
  const senderOptions = useMemo(() => {
    const list: FormSelectOption[] = senderSuggestions.map((cust) => {
      const parts = [cust.city, cust.gst].filter(Boolean);
      return {
        value: cust.mobile,
        label: cust.mobile ? `${cust.mobile} - ${cust.name}` : cust.name,
        subLabel: parts.length > 0 ? parts.join(" • ") : cust.address,
      };
    });

    if (
      formData.sender.contact_no &&
      !list.some((o) => o.value === formData.sender.contact_no)
    ) {
      list.unshift({
        value: formData.sender.contact_no,
        label: formData.sender.name
          ? `${formData.sender.contact_no} - ${formData.sender.name}`
          : formData.sender.contact_no,
        subLabel: formData.sender.city || undefined,
      });
    }

    return list;
  }, [senderSuggestions, formData.sender.contact_no, formData.sender.name, formData.sender.city]);

  // ─── Receiver FormSelect Options ─────────────────────────────────────────
  const receiverOptions = useMemo(() => {
    const list: FormSelectOption[] = receiverSuggestions.map((cust) => {
      const parts = [cust.city, cust.gst].filter(Boolean);
      return {
        value: cust.mobile,
        label: cust.mobile ? `${cust.mobile} - ${cust.name}` : cust.name,
        subLabel: parts.length > 0 ? parts.join(" • ") : cust.address,
      };
    });

    if (
      formData.receiver.contact_no &&
      !list.some((o) => o.value === formData.receiver.contact_no)
    ) {
      list.unshift({
        value: formData.receiver.contact_no,
        label: formData.receiver.name
          ? `${formData.receiver.contact_no} - ${formData.receiver.name}`
          : formData.receiver.contact_no,
        subLabel: formData.receiver.city || undefined,
      });
    }

    return list;
  }, [receiverSuggestions, formData.receiver.contact_no, formData.receiver.name, formData.receiver.city]);

  const handleSenderSelect = (val: string) => {
    const cust = senderSuggestions.find((c) => c.mobile === val);
    if (cust) {
      const hasDetails = Boolean(cust.address?.trim() || cust.city?.trim() || cust.pincode?.trim());
      setFormData((p) => ({
        ...p,
        sender: {
          contact_no: cust.mobile || "",
          name: cust.name || "",
          gstin: (cust.gst || "").toUpperCase(),
          show_details: hasDetails ? true : p.sender.show_details,
          address: cust.address || (hasDetails ? "" : p.sender.address),
          city: cust.city || (hasDetails ? "" : p.sender.city),
          pincode: cust.pincode || (hasDetails ? "" : p.sender.pincode),
        },
      }));

      // Extract and set lastItems
      const items = cust.lastItems || (cust as any).lastBookings || senderSugData?.lastBookings || [];
      setLastBookingsList(items);
    } else {
      // Custom or new contact number: reset previous customer details
      setFormData((p) => ({
        ...p,
        sender: {
          contact_no: val,
          name: "",
          gstin: "",
          show_details: false,
          address: "",
          city: "",
          pincode: "",
        },
      }));
      setLastBookingsList([]);
    }

    if (formErrors.sender_contact) {
      setFormErrors((p) => ({ ...p, sender_contact: "" }));
    }
    if (formErrors.sender_name) {
      setFormErrors((p) => ({ ...p, sender_name: "" }));
    }
  };

  const handleReceiverSelect = (val: string) => {
    const cust = receiverSuggestions.find((c) => c.mobile === val);
    if (cust) {
      const hasDetails = Boolean(cust.address?.trim() || cust.city?.trim() || cust.pincode?.trim());
      setFormData((p) => ({
        ...p,
        receiver: {
          contact_no: cust.mobile || "",
          name: cust.name || "",
          gstin: (cust.gst || "").toUpperCase(),
          show_details: hasDetails ? true : p.receiver.show_details,
          address: cust.address || (hasDetails ? "" : p.receiver.address),
          city: cust.city || (hasDetails ? "" : p.receiver.city),
          pincode: cust.pincode || (hasDetails ? "" : p.receiver.pincode),
        },
      }));
    } else {
      // Custom or new contact number: reset previous customer details
      setFormData((p) => ({
        ...p,
        receiver: {
          contact_no: val,
          name: "",
          gstin: "",
          show_details: false,
          address: "",
          city: "",
          pincode: "",
        },
      }));
    }

    if (formErrors.receiver_contact) {
      setFormErrors((p) => ({ ...p, receiver_contact: "" }));
    }
    if (formErrors.receiver_name) {
      setFormErrors((p) => ({ ...p, receiver_name: "" }));
    }
  };



  const handleToggleRefPackage = (refPkg: ExtractedRefPackage, checked: boolean) => {
    if (checked) {
      const isFirstBlank =
        formData.packages.length === 1 &&
        !formData.packages[0].ref_id &&
        !formData.packages[0].material &&
        (!formData.packages[0].price || Number(formData.packages[0].price) === 0);

      if (isFirstBlank) {
        setFormData((p) => ({
          ...p,
          packages: [
            {
              id: p.packages[0].id,
              qty: refPkg.qty,
              material: refPkg.material,
              packing: refPkg.packing,
              payment_type: refPkg.payment_type,
              price: refPkg.price,
              ref_id: refPkg.refId,
            },
          ],
        }));
      } else {
        setFormData((p) => ({
          ...p,
          packages: [
            ...p.packages,
            {
              id: `pkg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              qty: refPkg.qty,
              material: refPkg.material,
              packing: refPkg.packing,
              payment_type: refPkg.payment_type,
              price: refPkg.price,
              ref_id: refPkg.refId,
            },
          ],
        }));
      }
    } else {
      setFormData((p) => {
        const remaining = p.packages.filter((pkg) => pkg.ref_id !== refPkg.refId);
        if (remaining.length === 0) {
          return {
            ...p,
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
          };
        }
        return {
          ...p,
          packages: remaining,
        };
      });
    }
  };

  const { data: lastDocketData, isLoading: isLastDocketLoading } = useQuery({
    queryKey: ["last-docket"],
    queryFn: getLastBookedDocket,
    enabled: !isEdit,
  });

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


  // ─── Auto-calculate Net Cost (Final Bill Amount) ───────────────────────────
  const totalPackageAmount = useMemo(() => {
    return formData.packages.reduce((sum, pkg) => {
      const price = typeof pkg.price === "number" ? pkg.price : Number(pkg.price) || 0;
      const qty = typeof pkg.qty === "number" ? pkg.qty : Number(pkg.qty) || 0;
      const itemTotal = pkg.payment_type === "Per Package" ? price * qty : price;
      return sum + itemTotal;
    }, 0);
  }, [formData.packages]);

  const calculatedNetCost = useMemo(() => {
    const pkgTotal = totalPackageAmount;
    const bilty = Number(formData.bilty_charge) || 0;
    const hamali = Number(formData.hamali_cost) || 0;
    const pickup = Number(formData.pickup_charge) || 0;
    const loading = Number(formData.loading_charge) || 0;
    const delivery = Number(formData.delivery_charge) || 0;
    const extra = Number(formData.extra_charge) || 0;

    return Math.max(0, pkgTotal + bilty + hamali + pickup + loading + delivery + extra);
  }, [
    totalPackageAmount,
    formData.bilty_charge,
    formData.hamali_cost,
    formData.pickup_charge,
    formData.loading_charge,
    formData.delivery_charge,
    formData.extra_charge,
  ]);

  // ─── File Upload Handlers ──────────────────────────────────────────────────
  const handleBillFileUpload = async (file: File) => {
    setBillFile(file);
    const res = await uploadFile(file, "billFile");
    if (res?.url) {
      setBillFileUrl(res.url);
    }
  };

  const handleSenderProofUpload = async (file: File) => {
    setFormData((p) => ({ ...p, sender_id_proof: file }));
    const res = await uploadFile(file, "senderProof");
    if (res?.url) {
      setFormData((p) => ({ ...p, sender_id_proof_url: res.url }));
    }
  };

  // ─── Package Rows Handlers ─────────────────────────────────────────────────
  const addPackageRow = () => {
    setFormData((prev) => ({
      ...prev,
      packages: [
        ...prev.packages,
        {
          id: `pkg-${Date.now()}`,
          qty: 0,
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
      const payload = {
        fromBranchId: data.from_branch_id,
        toBranchId: data.to_branch_id,
        sender: {
          mobile: data.sender.contact_no || "",
          name: data.sender.name || "",
          gst: data.sender.gstin || "",
          address: data.sender.address || "",
          city: data.sender.city || "",
          pincode: data.sender.pincode || "",
        },
        receiver: {
          mobile: data.receiver.contact_no || "",
          name: data.receiver.name || "",
          gst: data.receiver.gstin || "",
          address: data.receiver.address || "",
          city: data.receiver.city || "",
          pincode: data.receiver.pincode || "",
        },
        items: data.packages.map((pkg) => {
          const parcel = Number(pkg.qty) || 0;
          const rate = Number(pkg.price) || 0;
          const priceType = pkg.payment_type === "Per Package" ? "perPackage" : "direct";
          const amount = priceType === "perPackage" ? parcel * rate : rate;
          return {
            parcel,
            material: pkg.material || "",
            packing: pkg.packing || "",
            priceType,
            rate,
            amount,
          };
        }),
        hamaliCost: Number(data.hamali_cost) || 0,
        biltyCharge: Number(data.bilty_charge) || 0,
        pickupCharge: Number(data.pickup_charge) || 0,
        loadingCharge: Number(data.loading_charge) || 0,
        deliveryCharge: Number(data.delivery_charge) || 0,
        extraCharge: Number(data.extra_charge) || 0,
        discount: 0,
        finalBillAmount: calculatedNetCost,
        goodsValue: Number(data.goods_value) || 500,
        paymentMethod: data.payment_method || "To Pay",
        senderProof: data.sender_id_proof_url || "",
        hasBill: billType === "with_bill",
        billNo: billType === "with_bill" ? data.bill_no : "",
        billImage: billFileUrl || "",
        deliveryInfo: {
          deliveryType: data.delivery_type || "office",
          receiverName: "",
          receiverMobile: "",
          deliveryProof: "",
          deliveredAt: "",
          deliveryRemark: "",
        },
        cancelReason: data.cancel_reason || "",
        cancelRemark: data.cancel_remark || "",
        status: bookingStatus,
        remark: data.remark || "",
      };

      if (isEdit && bookingId) {
        return updateParcelBooking(bookingId, payload);
      }
      return createParcelBooking(payload);
    },
    onSuccess: (result: any) => {
      const apiMessage = result?.message || result?.data?.message;
      if (apiMessage) {
        showToast("success", apiMessage);
      }
      setFormErrors({});
      const fullBookingData = result?.data || result;
      const docketNo1 = fullBookingData?.docketNo1 || fullBookingData?.docketNo || "";
      const docketNo2 = fullBookingData?.docketNo2 || fullBookingData?.tracking_no || "";
      setSuccessModal({
        isOpen: true,
        docketNo1,
        docketNo2,
        message: apiMessage || (isEdit ? "Booking Updated Successfully!" : "Booking Created Successfully!"),
        bookingData: fullBookingData,
      });
    },
    onError: (err: any) => {
      const apiErrorMessage =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message;
      if (apiErrorMessage) {
        showToast("error", apiErrorMessage);
      }
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
      // Must be visible and not inside floating dropdown popup
      if (el.offsetParent === null) return false;
      if (el.closest(".form-select-dropdown") || el.closest(".z-\\[9999\\]")) return false;

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

    // 6. Resolve effective target (if target is search input inside select dropdown)
    let effectiveTarget: HTMLElement = target;
    const selectContainer = target.closest(".relative");
    if (selectContainer && (target.closest(".form-select-dropdown") || target.closest(".z-\\[9999\\]"))) {
      const selectBtn = selectContainer.querySelector<HTMLButtonElement>("button");
      if (selectBtn) {
        effectiveTarget = selectBtn;
      }
    }

    const currentIndex = focusable.indexOf(effectiveTarget);
    if (currentIndex !== -1 && currentIndex < focusable.length - 1) {
      const nextElement = focusable[currentIndex + 1];
      setTimeout(() => {
        nextElement.focus();
        if (nextElement instanceof HTMLInputElement) {
          nextElement.select?.();
        }
      }, 50);
    } else if (currentIndex === -1) {
      // If target was not in focusable directly, find the nearest next one
      const targetPos = effectiveTarget.compareDocumentPosition.bind(effectiveTarget);
      const nextElement = focusable.find((el) => (targetPos(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0);
      if (nextElement) {
        setTimeout(() => {
          nextElement.focus();
          if (nextElement instanceof HTMLInputElement) {
            nextElement.select?.();
          }
        }, 50);
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
                Docket: {initialBooking?.docketNo || `#${bookingId}`}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Tracking: {initialBooking?.tracking_no || "—"}
              </span>
            </div>
          ) : (
            <span className="text-base font-semibold text-red-600 tracking-wide flex items-center gap-1 flex-wrap">
              {isLastDocketLoading ? (
                <>
                  <span>Last Booked Docket :</span>
                  <Skeleton className="h-4 w-28 inline-block bg-slate-200 animate-pulse rounded" />
                </>
              ) : lastDocketData?.docketNo ? (
                <>
                  <span>Last Booked Docket :</span>
                  <span className="text-slate-800 underline font-mono font-bold">
                    {lastDocketData.docketNo}
                    {lastDocketData.bookingDate && (
                      <span className="text-slate-500 font-normal no-underline ml-1 text-[11px]">
                        ({lastDocketData.bookingDate}{lastDocketData.bookingTime ? ` ${lastDocketData.bookingTime}` : ""})
                      </span>
                    )}
                  </span>
                </>
              ) : null}
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

      <form
        data-booking-form="true"
        onSubmit={handleSubmit}
        onKeyDown={handleFormKeyDown}
        className="parcel-booking-form space-y-1"
      >
        {/* ─── 1. Destination & Transport Section ────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {/* Destination Card */}
          <FormCard title="Destination" icon={MapPin}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {/* From Branch — admin/superadmin editable; others see their own branch locked */}
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
                disabled={!isAdminOrSuperAdmin}
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

          {/* Transport Card - 2x2 Grid */}
          <FormCard title="Transport" icon={Truck}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {/* Row 1, Col 1: Bill Type */}
              <FormSelect
                label="Bill Type"
                required
                options={billTypeOptions}
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

              {/* Row 1, Col 2: Goods Value */}
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

              {/* Row 2, Col 1: Bill No (when with_bill) */}
              {billType === "with_bill" && (
                <FormInput
                  label="Bill No"
                  required
                  placeholder="Bill No / LR No"
                  value={formData.bill_no}
                  onChange={(e) => setFormData((p) => ({ ...p, bill_no: e.target.value }))}
                />
              )}

              {/* Row 2, Col 2: Bill Upload (when with_bill) */}
              {billType === "with_bill" && (
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-black flex items-center gap-0.5 leading-none">Bill Upload</Label>
                  <FileUploadPreview
                    label="Bill"
                    fileName={billFile?.name}
                    fileUrl={billFileUrl}
                    isUploading={uploadingFields["billFile"]}
                    onFileSelect={handleBillFileUpload}
                    onRemove={() => {
                      setBillFile(null);
                      setBillFileUrl("");
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
              ) : null
            }
          >
            {/* Sender Primary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <FormSelect
                label="Contact No"
                required
                searchable
                allowCustom
                searchNumericOnly
                searchMaxLength={10}
                options={senderOptions}
                value={formData.sender.contact_no}
                onChange={handleSenderSelect}
                onSearchChange={(val) => setSenderSearch(val)}
                placeholder="Select / Search Contact No"
                searchPlaceholder="Enter 10-digit mobile..."
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
              ) : null
            }
          >
            {/* Receiver Primary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              <FormSelect
                label="Contact No"
                required
                searchable
                allowCustom
                searchNumericOnly
                searchMaxLength={10}
                options={receiverOptions}
                value={formData.receiver.contact_no}
                onChange={handleReceiverSelect}
                onSearchChange={(val) => setReceiverSearch(val)}
                placeholder="Select / Search Contact No"
                searchPlaceholder="Enter 10-digit mobile..."
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
                    min="0"
                    placeholder="Qty"
                    value={pkg.qty === 0 ? "" : pkg.qty}
                    onChange={(e) =>
                      updatePackageField(
                        idx,
                        "qty",
                        e.target.value === "" ? "" : Math.max(0, Number(e.target.value))
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
                    value={
                      pkg.payment_type === "Per Package"
                        ? (Number(pkg.qty) || 0) * (Number(pkg.price) || 0)
                        : (Number(pkg.price) || 0)
                    }
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

          {/* Reference Packages Table from Last Bookings (Clean Table only) */}
          {referencePackages.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-slate-200">
              <div className="overflow-x-auto border border-black rounded bg-white">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-[11px] font-bold text-black border-b border-black uppercase tracking-wider">
                    <tr>
                      <th className="py-1 px-2.5 border-r border-black w-14 text-center">Sr No</th>
                      <th className="py-1 px-2.5 border-r border-black">Quantity</th>
                      <th className="py-1 px-2.5 border-r border-black">Material</th>
                      <th className="py-1 px-2.5 border-r border-black">Packing</th>
                      <th className="py-1 px-2.5 border-r border-black">Payment Type</th>
                      <th className="py-1 px-2.5 border-r border-black">Price (₹)</th>
                      <th className="py-1 px-2.5 text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {referencePackages.map((refPkg, rIdx) => {
                      const isChecked = formData.packages.some((p) => p.ref_id === refPkg.refId);
                      return (
                        <tr
                          key={refPkg.refId}
                          className={cn(
                            "transition-colors",
                            isChecked ? "bg-blue-50/70 font-semibold" : "hover:bg-slate-50"
                          )}
                        >
                          <td className="py-1.5 px-2.5 border-r border-slate-200 text-center font-mono text-slate-700">
                            {rIdx + 1}
                          </td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200 text-black">
                            {refPkg.qty}
                          </td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200 text-black">
                            {refPkg.material || "-"}
                          </td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200 text-black">
                            {refPkg.packing || "-"}
                          </td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200 text-black">
                            {refPkg.payment_type}
                          </td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200 font-semibold text-black">
                            ₹{refPkg.price}
                          </td>
                          <td className="py-1.5 px-2.5 text-center">
                            <input
                              type="checkbox"
                              tabIndex={-1}
                              checked={isChecked}
                              onChange={(e) =>
                                handleToggleRefPackage(refPkg, e.target.checked)
                              }
                              className="w-3.5 h-3.5 text-[#2980b9] rounded border-black focus:ring-black/20 cursor-pointer"
                              title="Auto-fill this package"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </FormCard>

        {/* ─── 4. Payment & Additional Details Section ───────────────────────── */}
        <FormCard title="Payment & Additional Details" icon={CreditCard}>
          {/* Line 1: Payment Method, Bilty Charge, Final Bill Amount, Sender Id Proof */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-start">
            {/* Payment Method */}
            <FormSelect
              label="Payment Method"
              required
              options={paymentMethodOptions}
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
              min="0"
              value={formData.bilty_charge}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  bilty_charge: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                }))
              }
            />

            {/* Final Bill Amount (Disabled Input Field) */}
            <FormInput
              label="Final Bill Amount (₹)"
              type="text"
              value={calculatedNetCost}
              disabled
              readOnly
            />

            {/* Sender Id Proof */}
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-black flex items-center gap-0.5 leading-none">
                Sender Id Proof
              </Label>
              <FileUploadPreview
                label="Sender Id Proof"
                fileName={formData.sender_id_proof?.name}
                fileUrl={formData.sender_id_proof_url}
                isUploading={uploadingFields["senderProof"]}
                onFileSelect={handleSenderProofUpload}
                onRemove={() =>
                  setFormData((p) => ({
                    ...p,
                    sender_id_proof: null,
                    sender_id_proof_url: "",
                  }))
                }
                accept="image/*,.pdf"
                showViewLink={true}
              />
            </div>
          </div>

          {/* Line 2: Collapsible Extra Charges & Delivery Details */}
          <div className="pt-0.5 border-t border-slate-100">
            {!showAdditionalCharges ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                tabIndex={-1}
                onClick={() => setShowAdditionalCharges(true)}
                className="h-7 text-xs text-[#2980b9] border-[#2980b9]/30 hover:bg-blue-50"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Extra Charges / Delivery Details
              </Button>
            ) : (
              <div className="p-2 rounded bg-slate-50 border border-slate-200/70 space-y-2 animate-in fade-in-50 duration-150">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                  <h4 className="text-[11px] font-bold text-black uppercase tracking-wider">
                    Extra Charges &amp; Delivery Details
                  </h4>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowAdditionalCharges(false)}
                    className="text-slate-400 hover:text-red-600 p-0.5 transition-colors"
                    title="Collapse extra charges"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  {/* Delivery Type */}
                  <FormSelect
                    label="Delivery Type"
                    options={DELIVERY_TYPE_OPTIONS}
                    value={formData.delivery_type || "office"}
                    onChange={(val) =>
                      setFormData((p) => ({ ...p, delivery_type: val as DeliveryType }))
                    }
                    placeholder="Select Delivery Type"
                  />

                  {/* Hamali Cost */}
                  <FormInput
                    label="Hamali Cost (₹)"
                    type="number"
                    min="0"
                    value={formData.hamali_cost}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        hamali_cost: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                      }))
                    }
                  />

                  {/* Pickup Charge */}
                  <FormInput
                    label="Pickup Charge (₹)"
                    type="number"
                    min="0"
                    value={formData.pickup_charge}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        pickup_charge: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                      }))
                    }
                  />

                  {/* Loading Charge */}
                  <FormInput
                    label="Loading Charge (₹)"
                    type="number"
                    min="0"
                    value={formData.loading_charge}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        loading_charge: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                      }))
                    }
                  />

                  {/* Delivery Charge */}
                  <FormInput
                    label="Delivery Charge (₹)"
                    type="number"
                    min="0"
                    value={formData.delivery_charge}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        delivery_charge: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                      }))
                    }
                  />

                  {/* Extra Charge */}
                  <FormInput
                    label="Extra Charge (₹)"
                    type="number"
                    min="0"
                    value={formData.extra_charge}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        extra_charge: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Line 3: Remarks and Cancel Reason */}
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

      {/* ─── Success Confirmation Dialog (shadcn/ui) ────────────────────────── */}
      <Dialog
        open={Boolean(successModal?.isOpen)}
        onOpenChange={(open) => {
          if (!open) {
            setSuccessModal(null);
            router.push("/reports/booking");
          }
        }}
      >
        <DialogContent
          showCloseButton={true}
          className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full p-6 text-center space-y-4 outline-none"
        >
          {/* Checkmark Icon badge */}
          <div className="flex justify-center pt-2">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 shadow-inner">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/30">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
            </div>
          </div>

          {/* Dialog Header */}
          <DialogHeader className="space-y-1 text-center items-center">
            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
              Success!
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-slate-600">
              {successModal?.message || "Booking Created Successfully!"}
            </DialogDescription>
          </DialogHeader>

          {/* Docket No & Tracking No Box */}
          <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3.5 text-xs space-y-1.5 text-slate-700 font-medium">
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-slate-500 font-semibold">Docket No:</span>
              {successModal?.docketNo1 && (
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {successModal.docketNo1}
                </span>
              )}
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-slate-500 font-semibold">Tracking No:</span>
              {successModal?.docketNo2 && (
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {successModal.docketNo2}
                </span>
              )}
            </div>
          </div>

          {/* Dialog Footer with Action Buttons */}
          <DialogFooter className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/60 p-3 -mx-4 -mb-4 rounded-b-xl sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => {
                  const bData = successModal?.bookingData || formData;
                  const fromId = bData?.fromBranchId || bData?.from_branch_id || formData.from_branch_id;
                  const toId = bData?.toBranchId || bData?.to_branch_id || formData.to_branch_id;

                  const selectedFromBranch = branchDropdownList.find(
                    (b: any) => String(b.value) === String(fromId)
                  );
                  const selectedToBranch = branchDropdownList.find(
                    (b: any) => String(b.value) === String(toId)
                  );

                  printBookingSlip({
                    booking: bData,
                    fromBranch: (selectedFromBranch as any)?.raw || selectedFromBranch,
                    toBranch: (selectedToBranch as any)?.raw || selectedToBranch,
                    user: currentUser,
                  });
                }}
                className="bg-[#2980b9] hover:bg-[#2471a3] text-white h-8 px-3 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const bData = successModal?.bookingData || formData;
                  const fromId = bData?.fromBranchId || bData?.from_branch_id || formData.from_branch_id;
                  const toId = bData?.toBranchId || bData?.to_branch_id || formData.to_branch_id;

                  const selectedFromBranch = branchDropdownList.find(
                    (b: any) => String(b.value) === String(fromId)
                  );
                  const selectedToBranch = branchDropdownList.find(
                    (b: any) => String(b.value) === String(toId)
                  );

                  printBookingBarcode({
                    booking: bData,
                    fromBranch: (selectedFromBranch as any)?.raw || selectedFromBranch,
                    toBranch: (selectedToBranch as any)?.raw || selectedToBranch,
                    user: currentUser,
                  });
                }}
                className="h-8 px-3 text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Barcode className="w-3.5 h-3.5" />
                <span>Print Barcode</span>
              </Button>
            </div>

            <Button
              type="button"
              onClick={() => {
                setSuccessModal(null);
                router.push("/reports/booking");
              }}
              className="bg-[#2980b9] hover:bg-[#2471a3] text-white h-8 px-5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
