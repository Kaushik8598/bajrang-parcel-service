"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    FileText,
    Truck,
    Calculator,
    Save,
    Loader2,
    ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect, FormSelectOption } from "@/components/ui/form-select";
import { FormCard } from "@/components/ui/form-card";
import { Label } from "@/components/ui/label";
import { FileUploadWithCamera } from "@/components/ui/file-upload-with-camera";
import SimpleDataTable from "@/components/DataTable/SimpleDataTable";
import { showToast } from "@/lib/toast";
import {
    useBookingReports,
    useParcelDeliveredReports,
    useOnlyBranchList,
    useUserRoleVise,
    useAllUsers,
    useUpload,
    useCreateMemoMutation,
} from "@/lib/hooks";
import { getStoredUser, getStoredUserRole } from "@/lib/api/auth";
import type { ColumnDef } from "@/lib/types/common";
import { cn } from "@/lib/utils";

export interface DocketItem extends Record<string, any> {
    id: string;
    type: "BOOKING" | "DELIVERY";
    docketNo: string;
    date: string;
    from: string;
    to: string;
    party: string;
    paymentMethod: string;
    amount: number;
    status: string;
}

export default function CreateMemoPage() {
    const router = useRouter();
    const { uploadFile, uploadingFields } = useUpload();
    const createMemoMutation = useCreateMemoMutation();

    // ─── Current User & Role ───────────────────────────────────────────────────
    const currentUser = useMemo(() => getStoredUser(), []);
    const currentRole = useMemo(() => (getStoredUserRole() || "").toLowerCase(), []);
    const isAdminOrSuperAdmin = ["superadmin", "admin", "super_admin", "super-admin"].includes(
        currentRole
    );
    const ownBranchId = String(currentUser?._id || currentUser?.id || "");

    // ─── Fetch Branch List (for branch selection if admin) ──────────────────────
    const { data: roleViseRes } = useUserRoleVise();
    const { data: onlyBranchRes } = useOnlyBranchList();

    const branchDropdownList = useMemo(() => {
        const rawData = roleViseRes?.data || onlyBranchRes?.data;
        if (Array.isArray(rawData)) return rawData;
        if (rawData && typeof rawData === "object") {
            if (Array.isArray((rawData as any).branches)) return (rawData as any).branches;
            if (Array.isArray((rawData as any).users)) return (rawData as any).users;
            if (Array.isArray((rawData as any).data)) return (rawData as any).data;
        }
        return [];
    }, [roleViseRes, onlyBranchRes]);

    const branchOptions = useMemo<FormSelectOption[]>(() => {
        return branchDropdownList.map((b: any) => {
            const bInfo = b.branchInfo || {};
            const name = bInfo.branchName || b.branchName || b.name || "Unknown Branch";
            const code = bInfo.branchCode || b.branchCode || "";
            return {
                value: String(b._id || b.id),
                label: code ? `${name} (${code})` : name,
            };
        });
    }, [branchDropdownList]);

    // Selected Branch for memo calculation (defaults to own branch for non-admin)
    const [selectedBranchId, setSelectedBranchId] = useState<string>("");

    useEffect(() => {
        if (!isAdminOrSuperAdmin && ownBranchId) {
            setSelectedBranchId(ownBranchId);
        } else if (isAdminOrSuperAdmin && branchOptions.length > 0 && !selectedBranchId) {
            setSelectedBranchId(branchOptions[0].value);
        }
    }, [isAdminOrSuperAdmin, ownBranchId, branchOptions, selectedBranchId]);

    // Branch Info & Commission rates
    const currentBranchData = useMemo(() => {
        if (!selectedBranchId) return null;
        return branchDropdownList.find((b: any) => String(b._id || b.id) === String(selectedBranchId));
    }, [selectedBranchId, branchDropdownList]);

    const bookingCommissionRate = useMemo(() => {
        const bInfo = currentBranchData?.branchInfo || {};
        return Number(bInfo.Bookingcommission ?? currentBranchData?.Bookingcommission ?? 0);
    }, [currentBranchData]);

    const deliveryCommissionRate = useMemo(() => {
        const bInfo = currentBranchData?.branchInfo || {};
        return Number(bInfo.DeliveryCommission ?? currentBranchData?.DeliveryCommission ?? 0);
    }, [currentBranchData]);

    // ─── Fetch Admin Users for "Send To User" ───────────────────────────────────
    const { data: allUsersRes } = useAllUsers({ limit: 100 });
    const usersList = useMemo(() => {
        const rawData = allUsersRes?.data;
        if (Array.isArray(rawData)) return rawData;
        if (rawData && typeof rawData === "object" && Array.isArray((rawData as any).users)) {
            return (rawData as any).users;
        }
        return [];
    }, [allUsersRes]);

    const userOptions = useMemo<FormSelectOption[]>(() => {
        return usersList
            .filter((u: any) =>
                ["admin", "superadmin", "super_admin"].includes((u.role || "").toLowerCase())
            )
            .map((u: any) => ({
                value: String(u._id || u.id),
                label: `${u.name || "Admin"} (${u.role || "Admin"})`,
            }));
    }, [usersList]);

    // ─── Fetch Bookings (Confirm & Draft) from API ──────────────────────────────
    const { data: bookingsRes, isLoading: isBookingsLoading } = useBookingReports({
        page: 1,
        limit: 500,
        fromBranchId: selectedBranchId || undefined,
    });

    const rawBookings = useMemo(() => {
        const rawData = bookingsRes?.data;
        if (Array.isArray(rawData)) return rawData;
        if (rawData && typeof rawData === "object") {
            if (Array.isArray((rawData as any).bookings)) return (rawData as any).bookings;
            if (Array.isArray((rawData as any).reports)) return (rawData as any).reports;
            if (Array.isArray((rawData as any).data)) return (rawData as any).data;
        }
        return [];
    }, [bookingsRes]);

    // Filter confirmed & draft bookings
    const filteredBookings = useMemo(() => {
        return rawBookings.filter((b: any) => {
            const status = (b.status || "").toLowerCase();
            return status === "confirmed" || status === "confirm" || status === "draft" || !status;
        });
    }, [rawBookings]);

    // ─── Fetch Deliveries (Delivered) from API ──────────────────────────────────
    const { data: deliveredRes, isLoading: isDeliveredLoading } = useParcelDeliveredReports({
        page: 1,
        limit: 500,
        toBranchId: selectedBranchId || undefined,
    });

    const rawDeliveries = useMemo(() => {
        const rawData = deliveredRes?.data;
        if (Array.isArray(rawData)) return rawData;
        if (rawData && typeof rawData === "object") {
            if (Array.isArray((rawData as any).bookings)) return (rawData as any).bookings;
            if (Array.isArray((rawData as any).reports)) return (rawData as any).reports;
            if (Array.isArray((rawData as any).data)) return (rawData as any).data;
        }
        return [];
    }, [deliveredRes]);

    const filteredDeliveries = useMemo(() => {
        return rawDeliveries.filter((b: any) => {
            const status = (b.status || "").toLowerCase();
            return status === "delivered" || b.deliveryInfo?.deliveredAt;
        });
    }, [rawDeliveries]);

    // ─── Automatic Frontend Financial Calculations ─────────────────────────────
    // 1. Bookings Calculations
    const bookingsSummary = useMemo(() => {
        let paid = 0;
        let toPay = 0;
        let gpay = 0;

        filteredBookings.forEach((b: any) => {
            const amt = Number(b.finalBillAmount || b.totalAmount || b.amount || 0);
            const method = (b.paymentMethod || "").toLowerCase();
            if (method === "paid") paid += amt;
            else if (method === "to-pay" || method === "topay") toPay += amt;
            else if (method.includes("g pay") || method.includes("gpay") || method.includes("online"))
                gpay += amt;
        });

        const total = paid + toPay + gpay;
        const commission = Math.round((total * bookingCommissionRate) / 100);

        return { paid, toPay, gpay, total, commission };
    }, [filteredBookings, bookingCommissionRate]);

    // 2. Deliveries Calculations
    const deliveriesSummary = useMemo(() => {
        let paid = 0;
        let toPay = 0;
        let gpay = 0;

        filteredDeliveries.forEach((d: any) => {
            const amt = Number(d.finalBillAmount || d.totalAmount || d.amount || 0);
            const method = (d.paymentMethod || "").toLowerCase();
            if (method === "paid") paid += amt;
            else if (method === "to-pay" || method === "topay") toPay += amt;
            else if (method.includes("g pay") || method.includes("gpay") || method.includes("online"))
                gpay += amt;
        });

        const total = paid + toPay + gpay;
        const commission = Math.round((total * deliveryCommissionRate) / 100);

        return { paid, toPay, gpay, total, commission };
    }, [filteredDeliveries, deliveryCommissionRate]);

    // 3. Final Summary Calculations
    const finalSummary = useMemo(() => {
        const totalForCommission = bookingsSummary.total + deliveriesSummary.total;
        const totalCommission = bookingsSummary.commission + deliveriesSummary.commission;
        // Actual Collected: Paid Bookings + GPay Bookings + To-Pay Deliveries + GPay Deliveries
        const actualCollected =
            bookingsSummary.paid +
            bookingsSummary.gpay +
            deliveriesSummary.toPay +
            deliveriesSummary.gpay;
        const totalExpenses = 0;
        const amountToSend = Math.max(0, actualCollected - totalCommission - totalExpenses);

        return {
            totalForCommission,
            totalCommission,
            actualCollected,
            totalExpenses,
            amountToSend,
        };
    }, [bookingsSummary, deliveriesSummary]);

    // ─── Memo Form States ──────────────────────────────────────────────────────
    const [totalAmountToSend, setTotalAmountToSend] = useState<number | "">(0);
    const [sendToUserId, setSendToUserId] = useState<string>("");
    const [cashAmount, setCashAmount] = useState<number | "">(0);
    const [onlineAmount, setOnlineAmount] = useState<number | "">(0);
    const [proofName, setProofName] = useState<string>("");
    const [proofUrl, setProofUrl] = useState<string>("");
    const [remark, setRemark] = useState<string>("");

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Auto-sync initial total amount with calculated amountToSend when calculation updates
    useEffect(() => {
        if (finalSummary.amountToSend > 0 && (totalAmountToSend === 0 || totalAmountToSend === "")) {
            const amt = finalSummary.amountToSend;
            setTotalAmountToSend(amt);
            setCashAmount(amt);
            setOnlineAmount(0);
        }
    }, [finalSummary.amountToSend, totalAmountToSend]);

    // Default Send To User
    useEffect(() => {
        if (userOptions.length > 0 && !sendToUserId) {
            setSendToUserId(userOptions[0].value);
        }
    }, [userOptions, sendToUserId]);

    // ─── Dual-Sync Amount Handlers (Exact User Specification) ───────────────────
    const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const total =
            typeof totalAmountToSend === "number" ? totalAmountToSend : Number(totalAmountToSend) || 0;

        if (raw === "") {
            setCashAmount("");
            setOnlineAmount(total);
            return;
        }

        const clean = raw.replace(/\D/g, "");
        let intVal = clean === "" ? 0 : parseInt(clean, 10);

        if (intVal > total) {
            intVal = total;
        }

        setCashAmount(intVal);
        setOnlineAmount(Math.max(0, total - intVal));

        if (errors.amount) setErrors((p) => ({ ...p, amount: "" }));
    };

    const handleOnlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const total =
            typeof totalAmountToSend === "number" ? totalAmountToSend : Number(totalAmountToSend) || 0;

        if (raw === "") {
            setOnlineAmount("");
            setCashAmount(total);
            return;
        }

        const clean = raw.replace(/\D/g, "");
        let intVal = clean === "" ? 0 : parseInt(clean, 10);

        if (intVal > total) {
            intVal = total;
        }

        setOnlineAmount(intVal);
        setCashAmount(Math.max(0, total - intVal));

        if (errors.amount) setErrors((p) => ({ ...p, amount: "" }));
        if (intVal === 0) {
            if (errors.proof) setErrors((p) => ({ ...p, proof: "" }));
        }
    };

    const handleTotalAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") {
            setTotalAmountToSend("");
            setCashAmount("");
            setOnlineAmount("");
            return;
        }

        const clean = raw.replace(/\D/g, "");
        const intVal = clean === "" ? 0 : parseInt(clean, 10);
        setTotalAmountToSend(intVal);

        const currCash = typeof cashAmount === "number" ? cashAmount : 0;
        if (currCash <= intVal) {
            setCashAmount(currCash);
            setOnlineAmount(intVal - currCash);
        } else {
            setCashAmount(intVal);
            setOnlineAmount(0);
        }

        if (errors.totalAmountToSend) setErrors((p) => ({ ...p, totalAmountToSend: "" }));
    };

    const handleBlurRebalance = () => {
        const total =
            typeof totalAmountToSend === "number" ? totalAmountToSend : Number(totalAmountToSend) || 0;
        const cash = typeof cashAmount === "number" ? cashAmount : 0;
        const online = typeof onlineAmount === "number" ? onlineAmount : 0;

        if (cash + online !== total) {
            if (cash > total) {
                setCashAmount(total);
                setOnlineAmount(0);
            } else {
                setOnlineAmount(Math.max(0, total - cash));
            }
        }
    };

    // ─── Proof Upload ──────────────────────────────────────────────────────────
    const handleProofUpload = async (file: File) => {
        const res = await uploadFile(file, "proof");
        if (res?.url) {
            setProofName(res.fileName || file.name);
            setProofUrl(res.url);
            if (errors.proof) setErrors((p) => ({ ...p, proof: "" }));
        }
    };

    // ─── Combined Docket Table Rows ────────────────────────────────────────────
    const allDockets: DocketItem[] = useMemo(() => {
        const list: DocketItem[] = [];

        filteredBookings.forEach((b: any, idx: number) => {
            const fromName = b.fromBranch?.branchName || b.fromBranch?.name || "Origin";
            const toName = b.toBranch?.branchName || b.toBranch?.name || "Destination";
            list.push({
                id: b._id || `booking-${idx}`,
                type: "BOOKING",
                docketNo: b.docketNo1 || b.docketNo2 || b.docketNo || `BK-${idx + 1}`,
                date: b.bookingDate || b.createdAt?.split("T")[0] || "—",
                from: fromName,
                to: toName,
                party: b.sender?.name || b.receiver?.name || "Party",
                paymentMethod: b.paymentMethod || "paid",
                amount: Number(b.finalBillAmount || b.totalAmount || b.amount || 0),
                status: b.status || "Confirmed",
            });
        });

        filteredDeliveries.forEach((d: any, idx: number) => {
            const fromName = d.fromBranch?.branchName || d.fromBranch?.name || "Origin";
            const toName = d.toBranch?.branchName || d.toBranch?.name || "Destination";
            list.push({
                id: d._id || `delivery-${idx}`,
                type: "DELIVERY",
                docketNo: d.docketNo1 || d.docketNo2 || d.docketNo || `DL-${idx + 1}`,
                date:
                    d.deliveryInfo?.deliveredAt?.split("T")[0] ||
                    d.bookingDate ||
                    d.createdAt?.split("T")[0] ||
                    "—",
                from: fromName,
                to: toName,
                party: d.receiver?.name || d.sender?.name || "Party",
                paymentMethod: d.paymentMethod || "to-pay",
                amount: Number(d.finalBillAmount || d.totalAmount || d.amount || 0),
                status: "Delivered",
            });
        });

        return list;
    }, [filteredBookings, filteredDeliveries]);

    // ─── SimpleDataTable Columns Definition ─────────────────────────────────────
    const columns: ColumnDef<DocketItem>[] = useMemo(
        () => [
            {
                key: "type",
                label: "TYPE",
                width: "w-24",
                render: (_, r) => (
                    <span
                        className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase",
                            r.type === "BOOKING"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                        )}
                    >
                        {r.type}
                    </span>
                ),
            },
            {
                key: "docketNo",
                label: "DOCKET NO.",
                render: (val) => (
                    <span className="font-mono font-bold text-slate-900">{String(val || "—")}</span>
                ),
            },
            {
                key: "date",
                label: "DATE",
                render: (val) => <span className="font-mono text-slate-700">{String(val || "—")}</span>,
            },
            {
                key: "from",
                label: "FROM",
            },
            {
                key: "to",
                label: "TO",
            },
            {
                key: "party",
                label: "PARTY",
                render: (val) => (
                    <span className="font-medium text-slate-800 truncate max-w-[160px] block">
                        {String(val || "—")}
                    </span>
                ),
            },
            {
                key: "amount",
                label: "AMOUNT",
                render: (val, r) => (
                    <div className="text-right font-mono">
                        <span className="font-bold text-slate-900 block">₹{Number(val || 0)}</span>
                        <span className="text-[9px] font-medium text-slate-500 uppercase">
                            ({r.paymentMethod})
                        </span>
                    </div>
                ),
            },
        ],
        []
    );

    // Pagination state for SimpleDataTable
    const [currentPage, setCurrentPage] = useState<number>(1);
    const pageSize = 25;

    // ─── Submit Memo ───────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};

        const total =
            typeof totalAmountToSend === "number" ? totalAmountToSend : Number(totalAmountToSend) || 0;
        const cash = typeof cashAmount === "number" ? cashAmount : 0;
        const online = typeof onlineAmount === "number" ? onlineAmount : 0;

        if (!sendToUserId) {
            newErrors.sendToUserId = "Please select a user to send memo.";
        }

        if (total <= 0) {
            newErrors.totalAmountToSend = "Total amount to send must be greater than 0.";
        }

        if (cash + online !== total) {
            newErrors.amount = "Cash and Online amount must exactly equal Total Amount.";
        }

        if (Number(online) > 0 && !proofUrl) {
            newErrors.proof = "Proof upload is required when online amount is entered.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showToast("error", "Validation Error", Object.values(newErrors)[0]);
            return;
        }

        setErrors({});

        const selectedUser = userOptions.find((u) => u.value === sendToUserId);

        const payload = {
            totalAmountToSend: total,
            sendToUserId,
            sendToUserName: selectedUser?.label || "",
            cashAmount: cash,
            onlineAmount: online,
            proofUrl,
            proofName,
            remark: remark.trim(),
            bookingTotal: bookingsSummary.total,
            deliveryTotal: deliveriesSummary.total,
            totalCommission: finalSummary.totalCommission,
            actualCollected: finalSummary.actualCollected,
            totalExpenses: finalSummary.totalExpenses,
            dockets: allDockets.map((d) => ({
                docketNo: d.docketNo,
                type: d.type,
                amount: d.amount,
                paymentMethod: d.paymentMethod,
                date: d.date,
            })),
        };

        try {
            await createMemoMutation.mutateAsync(payload);
            showToast("success", "Memo Sent", "Memo created and sent successfully.");
            router.push("/reports/memo");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to send memo.";
            showToast("error", "Failed to Send Memo", msg);
        }
    };

    const isLoadingData = isBookingsLoading || isDeliveredLoading;

    return (
        <div className="w-full space-y-1.5 pb-6">
            {/* ─── Top Navigation Bar ──────────────────────────────────────────────── */}
            <div className="bg-white rounded border border-slate-200/80 shadow-2xs px-3 py-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-[#2980b9]/10 text-[#2980b9] flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4" />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-lg font-bold text-black tracking-tight leading-tight">
                            Create New Memo
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Admin Branch Selector */}
                    {isAdminOrSuperAdmin && branchOptions.length > 0 && (
                        <div className="w-52">
                            <FormSelect
                                label=""
                                searchable
                                options={branchOptions}
                                value={selectedBranchId}
                                onChange={(v) => setSelectedBranchId(v)}
                                placeholder="Select Branch"
                            />
                        </div>
                    )}

                    <Button
                        type="button"
                        onClick={() => router.push("/reports/memo")}
                        className="bg-[#2980b9] hover:bg-[#2471a3] text-white h-7 px-3 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-3 h-3 mr-1" />
                        View Memo Reports
                    </Button>
                </div>
            </div>

            {/* ─── 1. Create New Memo Form (Top Section) ───────────────────────────── */}
            <form onSubmit={handleSubmit} className="space-y-1.5">
                <FormCard title="Create New Memo" icon={FileText}>
                    <div className="space-y-1.5">
                        {/* Row 1: Total Amount & Send To User */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            <div>
                                <FormInput
                                    label="Total Amount to Send (₹)"
                                    required
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={totalAmountToSend === "" ? "" : String(totalAmountToSend)}
                                    onChange={handleTotalAmountChange}
                                    onBlur={handleBlurRebalance}
                                    error={errors.totalAmountToSend}
                                />
                            </div>

                            <div>
                                <FormSelect
                                    label="Send To User"
                                    required
                                    searchable
                                    options={userOptions}
                                    value={sendToUserId}
                                    onChange={(val) => {
                                        setSendToUserId(val);
                                        if (errors.sendToUserId) setErrors((p) => ({ ...p, sendToUserId: "" }));
                                    }}
                                    placeholder="Select User"
                                    searchPlaceholder="Search admin / user..."
                                    error={errors.sendToUserId}
                                />
                            </div>
                        </div>

                        {/* Row 2: Cash Amount, Online Amount & Proof */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 items-start">
                            <div>
                                <FormInput
                                    label="Cash Amount (₹)"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Enter cash amount"
                                    value={cashAmount === "" ? "" : String(cashAmount)}
                                    onChange={handleCashChange}
                                    onBlur={handleBlurRebalance}
                                />
                            </div>

                            <div>
                                <FormInput
                                    label="Online Amount (₹)"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Enter online amount"
                                    value={onlineAmount === "" ? "" : String(onlineAmount)}
                                    onChange={handleOnlineChange}
                                    onBlur={handleBlurRebalance}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[11px] font-bold text-black flex items-center gap-0.5 leading-none">
                                    Proof
                                    {Number(onlineAmount) > 0 && (
                                        <span className="text-red-500 font-bold ml-0.5">* (Required for Online)</span>
                                    )}
                                </Label>
                                <FileUploadWithCamera
                                    label="Proof"
                                    required={Number(onlineAmount) > 0}
                                    fileName={proofName}
                                    fileUrl={proofUrl}
                                    isUploading={uploadingFields["proof"]}
                                    onFileSelect={handleProofUpload}
                                    onRemove={() => {
                                        setProofName("");
                                        setProofUrl("");
                                    }}
                                    accept="image/*,.pdf"
                                />
                                {errors.proof && (
                                    <p className="text-[10px] text-red-500 font-medium leading-none pt-0.5">
                                        {errors.proof}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Row 3: Remark & Action Button */}
                        <div className="flex flex-wrap sm:flex-nowrap items-end gap-1.5">
                            <div className="flex-1 min-w-[200px]">
                                <FormInput
                                    label="Remark"
                                    type="text"
                                    placeholder="Enter remark"
                                    value={remark}
                                    onChange={(e) => setRemark(e.target.value)}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={createMemoMutation.isPending}
                                className="h-8 px-6 bg-[#2980b9] hover:bg-[#2471a3] text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                                {createMemoMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-3.5 h-3.5" />
                                        <span>Send Memo</span>
                                    </>
                                )}
                            </Button>
                        </div>

                        {errors.amount && (
                            <p className="text-[11px] text-red-500 font-medium">{errors.amount}</p>
                        )}
                    </div>
                </FormCard>
            </form>

            {/* ─── 2. Middle Section: Summary Cards ─────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                {/* Card 1: Bookings */}
                <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <div className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-slate-700" />
                            <h3 className="text-xs font-bold text-slate-900">Bookings</h3>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {bookingCommissionRate}%
                        </span>
                    </div>

                    <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-700">
                            <span>Paid:</span>
                            <span className="font-semibold text-emerald-600 font-mono">
                                ₹{bookingsSummary.paid}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                            <span>To-Pay:</span>
                            <span className="font-semibold text-slate-800 font-mono">
                                ₹{bookingsSummary.toPay}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                            <span>G Pay:</span>
                            <span className="font-semibold text-slate-800 font-mono">
                                ₹{bookingsSummary.gpay}
                            </span>
                        </div>

                        <div className="border-t border-slate-100 pt-1 flex items-center justify-between font-bold text-slate-900">
                            <span>Total:</span>
                            <span className="font-mono">₹{bookingsSummary.total}</span>
                        </div>

                        <div className="border-t-2 border-amber-400/80 pt-1 flex items-center justify-between font-bold text-red-600">
                            <span>Commission ({bookingCommissionRate}%):</span>
                            <span className="font-mono">-₹{bookingsSummary.commission}</span>
                        </div>
                    </div>
                </div>

                {/* Card 2: Deliveries */}
                <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <div className="flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-slate-700" />
                            <h3 className="text-xs font-bold text-slate-900">Deliveries</h3>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {deliveryCommissionRate}%
                        </span>
                    </div>

                    <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-700">
                            <span>Paid:</span>
                            <span className="font-semibold text-emerald-600 font-mono">
                                ₹{deliveriesSummary.paid}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                            <span>To-Pay:</span>
                            <span className="font-semibold text-slate-800 font-mono">
                                ₹{deliveriesSummary.toPay}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                            <span>G Pay:</span>
                            <span className="font-semibold text-slate-800 font-mono">
                                ₹{deliveriesSummary.gpay}
                            </span>
                        </div>

                        <div className="border-t border-slate-100 pt-1 flex items-center justify-between font-bold text-slate-900">
                            <span>Total:</span>
                            <span className="font-mono">₹{deliveriesSummary.total}</span>
                        </div>

                        <div className="border-t-2 border-amber-400/80 pt-1 flex items-center justify-between font-bold text-red-600">
                            <span>Commission:</span>
                            <span className="font-mono">-₹{deliveriesSummary.commission}</span>
                        </div>
                    </div>
                </div>

                {/* Card 3: Final Summary */}
                <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3 space-y-2">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                        <Calculator className="w-4 h-4 text-slate-700" />
                        <h3 className="text-xs font-bold text-slate-900">Final Summary</h3>
                    </div>

                    <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-700">
                            <span>Total for Commission:</span>
                            <span className="font-semibold text-slate-900 font-mono">
                                ₹{finalSummary.totalForCommission}
                            </span>
                        </div>

                        <div className="flex items-center justify-between font-bold text-red-600 border-l-2 border-amber-500 pl-1.5">
                            <span>Total Commission:</span>
                            <span className="font-mono">-₹{finalSummary.totalCommission}</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-700">
                            <span>Actual Collected:</span>
                            <span className="font-semibold text-emerald-600 font-mono">
                                ₹{finalSummary.actualCollected}
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-700">
                            <span>Total Expenses:</span>
                            <span className="font-semibold text-red-600 font-mono">
                                -₹{finalSummary.totalExpenses}
                            </span>
                        </div>

                        <div className="border-t border-slate-200 pt-1 flex items-center justify-between font-bold text-xs text-emerald-700">
                            <span>Amount to Send:</span>
                            <span className="font-mono text-sm">₹{finalSummary.amountToSend}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── 3. Bottom Section: SimpleDataTable Component ─────────────────────── */}
            <SimpleDataTable<DocketItem>
                columns={columns}
                data={allDockets}
                isLoading={isLoadingData}
                showSrNo={true}
                srNoLabel="#"
                showPagination={true}
                page={currentPage}
                pageSize={pageSize}
                total={allDockets.length}
                onPageChange={setCurrentPage}
                emptyMessage="No data found"
            />
        </div>
    );
}
