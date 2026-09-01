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
    Receipt,
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
    useDataForAddMemo,
    useOnlyAdminList,
    useUserRoleVise,
    useUpload,
    useCreateMemoMutation,
} from "@/lib/hooks";
import { getStoredUser, getStoredUserRole } from "@/lib/api/auth";
import { CreateMemoPayload } from "@/lib/api/memo";
import type { ColumnDef } from "@/lib/types/common";
import { cn } from "@/lib/utils";

export interface DocketItem extends Record<string, any> {
    id: string;
    type: "BOOKING" | "DELIVERY" | "EXPENSE";
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
    const isAdminOrSuperAdmin = currentRole === "admin" || currentRole === "superadmin";
    const ownBranchId = String(currentUser?._id || "");

    // ─── Fetch Branch List (Only for Admin via getUserRoleVise) ────────────────
    const { data: roleViseRes } = useUserRoleVise(isAdminOrSuperAdmin);

    const branchOptions = useMemo<FormSelectOption[]>(() => {
        if (!isAdminOrSuperAdmin) return [];
        const rawUsers = roleViseRes?.data?.users || (Array.isArray(roleViseRes?.data) ? roleViseRes.data : []);

        return rawUsers
            .filter((b: any) => b.role !== "admin" && b.role !== "superadmin")
            .map((b: any) => {
                const name = b.name || "";
                const code = b.code || "";
                return {
                    value: String(b._id || ""),
                    label: code ? `${name} (${code})` : name,
                };
            });
    }, [roleViseRes, isAdminOrSuperAdmin]);

    // Selected Branch for memo data
    const [selectedBranchId, setSelectedBranchId] = useState<string>("");

    useEffect(() => {
        if (isAdminOrSuperAdmin) {
            if (branchOptions.length > 0 && !selectedBranchId) {
                setSelectedBranchId(branchOptions[0].value);
            }
        } else {
            if (ownBranchId && selectedBranchId !== ownBranchId) {
                setSelectedBranchId(ownBranchId);
            }
        }
    }, [isAdminOrSuperAdmin, ownBranchId, branchOptions, selectedBranchId]);

    const targetBranchId = isAdminOrSuperAdmin ? selectedBranchId : ownBranchId;

    // ─── Fetch Memo Data via GET /memo/dataForAddMemo ──────────────────────────
    const { data: memoData, isLoading: isMemoDataLoading } = useDataForAddMemo(
        targetBranchId ? { branchId: targetBranchId } : undefined,
        Boolean(!isAdminOrSuperAdmin || selectedBranchId)
    );

    // ─── Fetch Admins for "Send To User" via GET /user/onlyAdmin ───────────────
    const { data: onlyAdminRes } = useOnlyAdminList();

    const userOptions = useMemo<FormSelectOption[]>(() => {
        const raw = (onlyAdminRes as any)?.data ?? onlyAdminRes ?? [];
        const list = Array.isArray(raw) ? raw : [];

        return list.map((u: any) => ({
            value: String(u._id || ""),
            label: u.name || "",
        }));
    }, [onlyAdminRes]);

    // ─── Memo Form States ──────────────────────────────────────────────────────
    const amountToSend = memoData?.totalSummary?.amountToSend ?? 0;
    const [totalAmountToSend, setTotalAmountToSend] = useState<number | "">(0);
    const [sendToUserId, setSendToUserId] = useState<string>("");
    const [cashAmount, setCashAmount] = useState<number | "">(0);
    const [onlineAmount, setOnlineAmount] = useState<number | "">(0);
    const [proofName, setProofName] = useState<string>("");
    const [proofUrl, setProofUrl] = useState<string>("");
    const [remark, setRemark] = useState<string>("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Auto-update amountToSend from API response
    useEffect(() => {
        setTotalAmountToSend(amountToSend);
        setCashAmount(amountToSend);
        setOnlineAmount(0);
    }, [amountToSend]);

    // Default Send To User
    useEffect(() => {
        if (userOptions.length > 0 && !sendToUserId) {
            setSendToUserId(userOptions[0].value);
        }
    }, [userOptions, sendToUserId]);

    // ─── Dual-Sync Amount Handlers ─────────────────────────────────────────────
    const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const total = typeof amountToSend === "number" ? amountToSend : Number(amountToSend) || 0;

        if (raw === "") {
            setCashAmount("");
            setOnlineAmount(total);
            return;
        }

        const clean = raw.replace(/\D/g, "");
        let intVal = clean === "" ? 0 : parseInt(clean, 10);
        if (intVal > total) intVal = total;

        setCashAmount(intVal);
        setOnlineAmount(Math.max(0, total - intVal));

        if (errors.amount) setErrors((p) => ({ ...p, amount: "" }));
        if (errors.proof && total - intVal === 0) setErrors((p) => ({ ...p, proof: "" }));
    };

    const handleOnlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const total = typeof amountToSend === "number" ? amountToSend : Number(amountToSend) || 0;

        if (raw === "") {
            setOnlineAmount("");
            setCashAmount(total);
            return;
        }

        const clean = raw.replace(/\D/g, "");
        let intVal = clean === "" ? 0 : parseInt(clean, 10);
        if (intVal > total) intVal = total;

        setOnlineAmount(intVal);
        setCashAmount(Math.max(0, total - intVal));

        if (errors.amount) setErrors((p) => ({ ...p, amount: "" }));
        if (errors.proof && intVal === 0) setErrors((p) => ({ ...p, proof: "" }));
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

    // ─── Combined Docket Table Rows from dataForAddMemo ────────────────────────
    const allDockets: DocketItem[] = useMemo(() => {
        const list: DocketItem[] = [];
        const bookings = memoData?.data?.bookings || [];
        const expenses = memoData?.data?.expenses || [];

        bookings.forEach((b: any, idx: number) => {
            list.push({
                id: b._id || `booking-${idx}`,
                type: b.status === "delivered" ? "DELIVERY" : "BOOKING",
                docketNo: b.docketNo1 || b.docketNo2 || "",
                date: b.bookingDate || b.createdAt?.split("T")[0] || "",
                from: b.fromBranch?.name || "",
                to: b.toBranch?.name || "",
                party: b.sender?.name || b.receiver?.name || "",
                paymentMethod: b.paymentMethod || "",
                amount: Number(b.finalBillAmount || 0),
                status: b.status || "",
            });
        });

        expenses.forEach((ex: any, idx: number) => {
            list.push({
                id: ex._id || `expense-${idx}`,
                type: "EXPENSE",
                docketNo: ex.memoNo || "",
                date: ex.memoDate?.split("T")[0] || "",
                from: ex.fromBranch?.name || "",
                to: "",
                party: ex.expenseType ? `Expense: ${ex.expenseType}` : "",
                paymentMethod:
                    ex.cashAmount > 0 && ex.onlineAmount > 0
                        ? "Cash + Online"
                        : ex.onlineAmount > 0
                            ? "Online"
                            : "Cash",
                amount: Number(ex.totalAmount || 0),
                status: ex.status || "",
            });
        });

        return list;
    }, [memoData]);

    // ─── SimpleDataTable Columns Definition ─────────────────────────────────────
    const columns: ColumnDef<DocketItem>[] = useMemo(
        () => [
            {
                key: "type",
                label: "TYPE",
                width: "w-24",
                align: "center",
                render: (_, r) => (
                    <span className="font-semibold text-black uppercase">
                        {r.type}
                    </span>
                ),
            },
            {
                key: "docketNo",
                label: "DOCKET NO.",
                sortable: true,
                sortValue: (r) => r.docketNo,
                render: (val) => (
                    <span className="font-mono font-bold text-black">{String(val || "—")}</span>
                ),
            },
            {
                key: "date",
                label: "DATE",
                sortable: true,
                sortValue: (r) => new Date(r.date || 0).getTime(),
                render: (val) => <span className="font-mono text-black">{String(val || "—")}</span>,
            },
            {
                key: "from",
                label: "FROM",
                render: (val) => <span className="text-black">{String(val || "—")}</span>,
            },
            {
                key: "to",
                label: "TO",
                render: (val) => <span className="text-black">{String(val || "—")}</span>,
            },
            {
                key: "party",
                label: "PARTY / REMARK",
                render: (val) => (
                    <span className="font-medium text-black truncate max-w-[160px] block">
                        {String(val || "—")}
                    </span>
                ),
            },
            {
                key: "paymentMethod",
                label: "PAYMENT",
                render: (val) => (
                    <span className="text-[11px] font-semibold text-black uppercase">
                        {String(val || "—")}
                    </span>
                ),
            },
            {
                key: "amount",
                label: "AMOUNT (₹)",
                sortable: true,
                align: "right",
                sortValue: (r) => Number(r.amount || 0),
                render: (val) => (
                    <span className="font-mono font-bold text-black">
                        ₹{Number(val || 0)}
                    </span>
                ),
            },
            {
                key: "status",
                label: "STATUS",
                align: "center",
                render: (val) => (
                    <span className="text-[11px] font-semibold text-black uppercase">
                        {String(val || "—")}
                    </span>
                ),
            },
        ],
        []
    );

    // ─── Submit Memo (POST /memo/add-memo) ──────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};
        const total = Number(amountToSend) || 0;
        const cash = typeof cashAmount === "number" ? cashAmount : 0;
        const online = typeof onlineAmount === "number" ? onlineAmount : 0;

        if (!sendToUserId) {
            newErrors.sendToUserId = "Please select a user to send memo.";
        }

        if (total <= 0) {
            newErrors.totalAmountToSend = "Total amount to send must be greater than 0.";
        }

        if (cash + online !== total) {
            newErrors.amount = "Cash and Online amount must exactly equal Total Amount to Send.";
        }

        if (online > 0 && !proofUrl) {
            newErrors.proof = "Proof upload is required when online amount is entered.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showToast("error", "Validation Error", Object.values(newErrors)[0]);
            return;
        }

        setErrors({});

        const payload: CreateMemoPayload = {
            sendToUserId,
            cashAmount: cash,
            onlineAmount: online,
            proofUrl: proofUrl || "",
            remark: remark.trim(),
            ...(isAdminOrSuperAdmin && targetBranchId ? { branchId: targetBranchId } : {}),
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
                    {/* Admin Branch Selector (Only shown to Admin) */}
                    {isAdminOrSuperAdmin && branchOptions.length > 0 && (
                        <div className="w-56">
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

            {/* ─── 1. Memo Information Form (Top Section) ─────────────────────────── */}
            <form onSubmit={handleSubmit} className="space-y-1.5">
                <FormCard title="Memo Details" icon={FileText}>
                    <div className="space-y-1.5">
                        {/* Row 1: Total Amount (Disabled) & Send To User */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            <div>
                                <FormInput
                                    label="Total Amount to Send (₹)"
                                    required
                                    disabled
                                    type="text"
                                    placeholder="0"
                                    value={amountToSend === 0 ? "0" : String(amountToSend)}
                                    className="bg-slate-100 font-mono font-bold text-slate-900 cursor-not-allowed"
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
                                    placeholder="Select Admin User"
                                    searchPlaceholder="Search admin user..."
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

            {/* ─── 2. Middle Section: Summary Tables (Bookings, Deliveries, Final Summary) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-1.5 items-start">
                {/* Table 1: Bookings */}
                <div className="bg-white rounded border border-slate-200/80 shadow-2xs overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                        <div className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-black" />
                            <h3 className="text-xs font-bold text-black">Bookings</h3>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-black border border-emerald-200 font-mono">
                            {memoData?.branch?.Bookingcommission ?? 0}%
                        </span>
                    </div>

                    <div className="p-2">
                        <table className="w-full text-xs text-left border-collapse border border-slate-200">
                            <thead className="bg-slate-100/90 text-black font-bold border-b border-slate-200">
                                <tr>
                                    <th className="px-2 py-1 border-r border-slate-200">Payment Type</th>
                                    <th className="px-2 py-1 text-center border-r border-slate-200 w-16">Count</th>
                                    <th className="px-2 py-1 text-right">Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-black">
                                <tr>
                                    <td className="px-2 py-1 border-r border-slate-200">Paid</td>
                                    <td className="px-2 py-1 text-center font-mono border-r border-slate-200">{memoData?.bookingSummary?.paid?.count ?? 0}</td>
                                    <td className="px-2 py-1 text-right font-mono font-semibold">₹{memoData?.bookingSummary?.paid?.totalAmount ?? 0}</td>
                                </tr>
                                <tr>
                                    <td className="px-2 py-1 border-r border-slate-200">To-Pay</td>
                                    <td className="px-2 py-1 text-center font-mono border-r border-slate-200">{memoData?.bookingSummary?.["to pay"]?.count ?? 0}</td>
                                    <td className="px-2 py-1 text-right font-mono font-semibold">₹{memoData?.bookingSummary?.["to pay"]?.totalAmount ?? 0}</td>
                                </tr>
                                <tr>
                                    <td className="px-2 py-1 border-r border-slate-200">G Pay</td>
                                    <td className="px-2 py-1 text-center font-mono border-r border-slate-200">{memoData?.bookingSummary?.["g pay"]?.count ?? 0}</td>
                                    <td className="px-2 py-1 text-right font-mono font-semibold">₹{memoData?.bookingSummary?.["g pay"]?.totalAmount ?? 0}</td>
                                </tr>
                                <tr>
                                    <td className="px-2 py-1 border-r border-slate-200">Credit</td>
                                    <td className="px-2 py-1 text-center font-mono border-r border-slate-200">{memoData?.bookingSummary?.credit?.count ?? 0}</td>
                                    <td className="px-2 py-1 text-right font-mono font-semibold">₹{memoData?.bookingSummary?.credit?.totalAmount ?? 0}</td>
                                </tr>
                                <tr>
                                    <td className="px-2 py-1 border-r border-slate-200">Not Pay</td>
                                    <td className="px-2 py-1 text-center font-mono border-r border-slate-200">{memoData?.bookingSummary?.["not pay"]?.count ?? 0}</td>
                                    <td className="px-2 py-1 text-right font-mono font-semibold">₹{memoData?.bookingSummary?.["not pay"]?.totalAmount ?? 0}</td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-black">
                                <tr className="border-b border-slate-200">
                                    <td colSpan={2} className="px-2 py-1 border-r border-slate-200">Total Booking Amount</td>
                                    <td className="px-2 py-1 text-right font-mono">₹{memoData?.totalSummary?.totalBookingAmount ?? 0}</td>
                                </tr>
                                <tr>
                                    <td colSpan={2} className="px-2 py-1 border-r border-slate-200 text-red-600">Commission ({memoData?.branch?.Bookingcommission ?? 0}%)</td>
                                    <td className="px-2 py-1 text-right font-mono text-red-600">-₹{memoData?.totalSummary?.bookingCommission ?? 0}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Table 2: Deliveries */}
                <div className="bg-white rounded border border-slate-200/80 shadow-2xs overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                        <div className="flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-black" />
                            <h3 className="text-xs font-bold text-black">Deliveries</h3>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-black border border-blue-200 font-mono">
                            {memoData?.branch?.DeliveryCommission ?? 0}%
                        </span>
                    </div>

                    <div className="p-2">
                        <table className="w-full text-xs text-left border-collapse border border-slate-200">
                            <thead className="bg-slate-100/90 text-black font-bold border-b border-slate-200">
                                <tr>
                                    <th className="px-2 py-1 border-r border-slate-200">Payment Type</th>
                                    <th className="px-2 py-1 text-center border-r border-slate-200 w-16">Count</th>
                                    <th className="px-2 py-1 text-right">Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-black">
                                <tr>
                                    <td className="px-2 py-1 border-r border-slate-200">Paid</td>
                                    <td className="px-2 py-1 text-center font-mono border-r border-slate-200">{memoData?.deliverySummary?.paid?.count ?? 0}</td>
                                    <td className="px-2 py-1 text-right font-mono font-semibold">₹{memoData?.deliverySummary?.paid?.totalAmount ?? 0}</td>
                                </tr>
                                <tr>
                                    <td className="px-2 py-1 border-r border-slate-200">To-Pay</td>
                                    <td className="px-2 py-1 text-center font-mono border-r border-slate-200">{memoData?.deliverySummary?.["to pay"]?.count ?? 0}</td>
                                    <td className="px-2 py-1 text-right font-mono font-semibold">₹{memoData?.deliverySummary?.["to pay"]?.totalAmount ?? 0}</td>
                                </tr>
                                <tr>
                                    <td className="px-2 py-1 border-r border-slate-200">G Pay</td>
                                    <td className="px-2 py-1 text-center font-mono border-r border-slate-200">{memoData?.deliverySummary?.["g pay"]?.count ?? 0}</td>
                                    <td className="px-2 py-1 text-right font-mono font-semibold">₹{memoData?.deliverySummary?.["g pay"]?.totalAmount ?? 0}</td>
                                </tr>
                                <tr>
                                    <td className="px-2 py-1 border-r border-slate-200">Credit</td>
                                    <td className="px-2 py-1 text-center font-mono border-r border-slate-200">{memoData?.deliverySummary?.credit?.count ?? 0}</td>
                                    <td className="px-2 py-1 text-right font-mono font-semibold">₹{memoData?.deliverySummary?.credit?.totalAmount ?? 0}</td>
                                </tr>
                                <tr>
                                    <td className="px-2 py-1 border-r border-slate-200">Not Pay</td>
                                    <td className="px-2 py-1 text-center font-mono border-r border-slate-200">{memoData?.deliverySummary?.["not pay"]?.count ?? 0}</td>
                                    <td className="px-2 py-1 text-right font-mono font-semibold">₹{memoData?.deliverySummary?.["not pay"]?.totalAmount ?? 0}</td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-black">
                                <tr className="border-b border-slate-200">
                                    <td colSpan={2} className="px-2 py-1 border-r border-slate-200">Total Delivery Amount</td>
                                    <td className="px-2 py-1 text-right font-mono">₹{memoData?.totalSummary?.totalDeliveryAmount ?? 0}</td>
                                </tr>
                                <tr>
                                    <td colSpan={2} className="px-2 py-1 border-r border-slate-200 text-red-600">Commission ({memoData?.branch?.DeliveryCommission ?? 0}%)</td>
                                    <td className="px-2 py-1 text-right font-mono text-red-600">-₹{memoData?.totalSummary?.deliveryCommission ?? 0}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Table 3: Final Summary */}
                <div className="bg-white rounded border border-slate-200/80 shadow-2xs overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                        <div className="flex items-center gap-1.5">
                            <Calculator className="w-4 h-4 text-black" />
                            <h3 className="text-xs font-bold text-black">Final Summary</h3>
                        </div>
                    </div>

                    <div className="p-2">
                        <table className="w-full text-xs text-left border-collapse border border-slate-200">
                            <thead className="bg-slate-100/90 text-black font-bold border-b border-slate-200">
                                <tr>
                                    <th className="px-2 py-1 border-r border-slate-200">Particulars</th>
                                    <th className="px-2 py-1 text-right w-28">Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-black">
                                <tr>
                                    <td className="px-2 py-1 border-r border-slate-200">Total Booking Amount</td>
                                    <td className="px-2 py-1 text-right font-mono font-semibold">₹{memoData?.totalSummary?.totalBookingAmount ?? 0}</td>
                                </tr>
                                <tr>
                                    <td className="px-2 py-1 border-r border-slate-200">Total Delivery Amount</td>
                                    <td className="px-2 py-1 text-right font-mono font-semibold">₹{memoData?.totalSummary?.totalDeliveryAmount ?? 0}</td>
                                </tr>
                                <tr className="bg-slate-50/70 font-semibold">
                                    <td className="px-2 py-1 border-r border-slate-200">Total Amount</td>
                                    <td className="px-2 py-1 text-right font-mono">₹{memoData?.totalSummary?.totalAmount ?? 0}</td>
                                </tr>
                                <tr>
                                    <td className="px-2 py-1 border-r border-slate-200">Booking Commission</td>
                                    <td className="px-2 py-1 text-right font-mono text-red-600">-₹{memoData?.totalSummary?.bookingCommission ?? 0}</td>
                                </tr>
                                <tr>
                                    <td className="px-2 py-1 border-r border-slate-200">Delivery Commission</td>
                                    <td className="px-2 py-1 text-right font-mono text-red-600">-₹{memoData?.totalSummary?.deliveryCommission ?? 0}</td>
                                </tr>
                                <tr className="bg-amber-50/50 font-semibold text-red-600">
                                    <td className="px-2 py-1 border-r border-slate-200">Total Commission</td>
                                    <td className="px-2 py-1 text-right font-mono">-₹{memoData?.totalSummary?.totalCommission ?? 0}</td>
                                </tr>
                                <tr>
                                    <td className="px-2 py-1 border-r border-slate-200">
                                        Total Expense Amount ({memoData?.expenseSummary?.count ?? 0})
                                    </td>
                                    <td className="px-2 py-1 text-right font-mono text-red-600">
                                        -₹{memoData?.totalSummary?.totalExpenseAmount ?? memoData?.expenseSummary?.totalAmount ?? 0}
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-emerald-50/80 font-bold border-t-2 border-slate-300 text-black">
                                <tr>
                                    <td className="px-2 py-1.5 border-r border-slate-200 text-black font-bold">Amount to Send</td>
                                    <td className="px-2 py-1.5 text-right font-mono text-sm font-bold text-black">
                                        ₹{memoData?.totalSummary?.amountToSend ?? 0}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {/* ─── 3. Bottom Section: SimpleDataTable Component ─────────────────────── */}
            <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5">
                        <Receipt className="w-4 h-4 text-slate-700" />
                        <h3 className="text-xs font-bold text-slate-900">
                            Memo Items (Bookings & Expenses)
                        </h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 font-mono">
                        Total Items: {allDockets.length}
                    </span>
                </div>

                <SimpleDataTable<DocketItem>
                    columns={columns}
                    data={allDockets}
                    isLoading={isMemoDataLoading}
                    showSrNo={true}
                    srNoLabel="#"
                    emptyMessage="No pending bookings or expenses found for this memo."
                />
            </div>
        </div>
    );
}
