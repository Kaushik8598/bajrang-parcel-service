"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    DollarSign,
    FileCheck,
    Loader2,
    Receipt,
    ArrowLeft,
    RotateCcw,
    Fuel,
    Truck,
    Building2,
    Banknote,
    HardHat,
    CreditCard,
    ExternalLink,
    History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect, FormSelectOption } from "@/components/ui/form-select";
import { FormCard } from "@/components/ui/form-card";
import { Label } from "@/components/ui/label";
import { FileUploadWithCamera } from "@/components/ui/file-upload-with-camera";
import { showToast } from "@/lib/toast";
import {
    useUserRoleVise,
    useUpload,
    useCreateExpenseMutation,
    useFuelHistory,
    useRentHistory,
    useSalaryHistory,
    useLabourHistory,
    useEmiHistory,
} from "@/lib/hooks";
import { getStoredUser, getStoredUserRole } from "@/lib/api/auth";
import { ExpenseType } from "@/lib/api/expense";
import SimpleDataTable from "@/components/DataTable/SimpleDataTable";
import type { ColumnDef } from "@/lib/types/common";

// ─── Main Expense Type Options ────────────────────────────────────────────────
const EXPENSE_TYPE_OPTIONS: FormSelectOption[] = [
    { value: "Stationary", label: "Stationary" },
    { value: "Petrol", label: "Petrol" },
    { value: "Diesel", label: "Diesel" },
    { value: "CNG", label: "CNG" },
    { value: "Other Truck", label: "Other Truck" },
    { value: "Rent", label: "Rent" },
    { value: "Salary", label: "Salary" },
    { value: "Labour", label: "Labour" },
    { value: "Truck EMI", label: "Truck EMI" },
];

// ─── Other Truck Sub-Expense Types (from uploaded screenshot) ─────────────────
const OTHER_TRUCK_SUBTYPES: FormSelectOption[] = [
    { value: "Service/Repair", label: "Service/Repair" },
    { value: "Tyre Change", label: "Tyre Change" },
    { value: "Tax/Permit", label: "Tax/Permit" },
    { value: "Documents", label: "Documents" },
    { value: "Other", label: "Other" },
];

// ─── Helper: Generate Last 6 Months Options for Labour ────────────────────────
function getLast6MonthsOptions(): FormSelectOption[] {
    const options: FormSelectOption[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = d.toLocaleString("en-US", { month: "long" });
        const year = d.getFullYear();
        const val = `${monthName} ${year}`;
        options.push({ value: val, label: val });
    }
    return options;
}

// ─── Helper: Dynamically Calculate Monday-to-Sunday Fixed 7-Day Weeks for a Month ──
function getMondayToSundayWeeksForMonth(monthYearStr: string): FormSelectOption[] {
    if (!monthYearStr) return [];
    const parts = monthYearStr.trim().split(" ");
    const monthName = parts[0];
    const year = parseInt(parts[1], 10) || new Date().getFullYear();

    const testDate = new Date(`${monthName} 1, ${year}`);
    const monthIndex = testDate.getMonth();
    if (isNaN(monthIndex)) return [];

    const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const lastDateOfMonth = new Date(year, monthIndex, totalDaysInMonth);

    // Find the Monday of the week containing the 1st day of the month
    const firstDayOfMonth = new Date(year, monthIndex, 1);
    const dayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    let currentMonday = new Date(year, monthIndex, 1 - daysToMonday);
    let weekNumber = 1;
    const weeks: FormSelectOption[] = [];

    const formatDate = (d: Date) => {
        const day = d.getDate() < 10 ? `0${d.getDate()}` : `${d.getDate()}`;
        const m = d.getMonth() + 1 < 10 ? `0${d.getMonth() + 1}` : `${d.getMonth() + 1}`;
        const y = d.getFullYear();
        return `${day}/${m}/${y}`;
    };

    // Continue generating 7-day Monday-to-Sunday weeks as long as Monday <= lastDateOfMonth
    while (currentMonday <= lastDateOfMonth) {
        const currentSunday = new Date(currentMonday);
        currentSunday.setDate(currentMonday.getDate() + 6);

        const startStr = formatDate(currentMonday);
        const endStr = formatDate(currentSunday);

        const label = `Week ${weekNumber} (${startStr} to ${endStr})`;
        const value = `Week ${weekNumber} (${startStr} to ${endStr})`;

        weeks.push({ value, label });

        // Move to next Monday
        currentMonday = new Date(currentMonday);
        currentMonday.setDate(currentMonday.getDate() + 7);
        weekNumber++;
    }

    return weeks;
}




// ─── Helper: Normalize Array from History API Responses ──────────────────────
function extractHistoryList(res: any): any[] {
    if (!res) return [];
    const raw = res?.data;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object") {
        if (Array.isArray(raw.history)) return raw.history;
        if (Array.isArray(raw.data)) return raw.data;
        if (Array.isArray(raw.expenses)) return raw.expenses;
        if (Array.isArray(raw.memos)) return raw.memos;
    }
    if (Array.isArray(res)) return res;
    return [];
}

export default function AddExpensePage() {
    const router = useRouter();
    const { uploadFile, uploadingFields } = useUpload();
    const createExpenseMutation = useCreateExpenseMutation();

    // ─── User & Role Resolution ────────────────────────────────────────────────
    const currentUser = useMemo(() => getStoredUser(), []);
    const currentRole = useMemo(() => (getStoredUserRole() || "").toLowerCase(), []);
    const isAdminOrSuperAdmin = ["superadmin", "admin", "super_admin", "super-admin"].includes(
        currentRole
    );
    const ownBranchId = String(currentUser?._id || currentUser?.id || "");

    // ─── Branch List (via GET /user/getUserRoleVise) ────────────────────────────
    const { data: roleViseRes } = useUserRoleVise();

    const branchDropdownList = useMemo(() => {
        const userList =
            roleViseRes?.users ||
            roleViseRes?.data?.users ||
            (Array.isArray(roleViseRes) ? roleViseRes : roleViseRes?.data) ||
            [];
        if (!Array.isArray(userList)) return [];
        return userList;
    }, [roleViseRes]);

    const branchOptions = useMemo<FormSelectOption[]>(() => {
        return branchDropdownList.map((b: any) => {
            const name = b.name || "Unknown";
            const code = b.code || "";
            return {
                value: String(b._id),
                label: code ? `${name} (${code})` : name,
            };
        });
    }, [branchDropdownList]);

    // ─── Form States ───────────────────────────────────────────────────────────
    const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

    // Primary Row (Default blank for Admin/SuperAdmin, auto-selected for branch user)
    const [branchId, setBranchId] = useState<string>("");
    const [expenseType, setExpenseType] = useState<ExpenseType | "">("");
    const [expenseDate, setExpenseDate] = useState<string>(todayStr);
    const [remark, setRemark] = useState<string>("");

    // Document Upload
    const [documentName, setDocumentName] = useState<string>("");
    const [documentUrl, setDocumentUrl] = useState<string>("");

    // Fuel Fields (Petrol / Diesel / CNG) with startKM, endKM, and quantity/liter
    const [startKm, setStartKm] = useState<string>("");
    const [endKm, setEndKm] = useState<string>("");
    const [quantity, setQuantity] = useState<string>("");

    // Other Truck Sub-Expense
    const [otherTruckSubtype, setOtherTruckSubtype] = useState<string>("");

    // Labour Fields
    const last6Months = useMemo(() => getLast6MonthsOptions(), []);
    const [labourMonth, setLabourMonth] = useState<string>(last6Months[0]?.value || "");

    // Dynamic Monday to Sunday weeks calculated based on selected month
    const dynamicLabourWeeks = useMemo(
        () => getMondayToSundayWeeksForMonth(labourMonth),
        [labourMonth]
    );
    const [labourWeek, setLabourWeek] = useState<string>(dynamicLabourWeeks[0]?.value || "");

    // Auto-adjust selected week if month changes
    useEffect(() => {
        if (dynamicLabourWeeks.length > 0) {
            const match = dynamicLabourWeeks.find((w) => w.value === labourWeek);
            if (!match) {
                setLabourWeek(dynamicLabourWeeks[0].value);
            }
        }
    }, [dynamicLabourWeeks, labourWeek]);

    const [labourCount, setLabourCount] = useState<number | "">("");
    const [ratePerLabour, setRatePerLabour] = useState<number | "">("");

    // Financials & Receipt (Strict whole integers only)
    const [cashAmount, setCashAmount] = useState<number | "">("");
    const [onlineAmount, setOnlineAmount] = useState<number | "">("");
    const [receiptName, setReceiptName] = useState<string>("");
    const [receiptUrl, setReceiptUrl] = useState<string>("");

    // Form Validation Errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ─── Default Branch Resolution on Mount / Role ──────────────────────────────
    useEffect(() => {
        if (!isAdminOrSuperAdmin && ownBranchId && branchOptions.length > 0) {
            const matched = branchOptions.find((b) => b.value === ownBranchId);
            if (matched) {
                setBranchId(ownBranchId);
            } else if (!branchId) {
                setBranchId(branchOptions[0].value);
            }
        }
    }, [isAdminOrSuperAdmin, ownBranchId, branchOptions, branchId]);

    // ─── History Queries by Expense Type (passing branchId in body payload) ───────
    const isFuel = ["Petrol", "Diesel", "CNG"].includes(expenseType);
    const isRent = expenseType === "Rent";
    const isSalary = expenseType === "Salary";
    const isLabour = expenseType === "Labour";
    const isEmi = expenseType === "Truck EMI";

    const { data: fuelHistoryRes, isLoading: isFuelHistLoading } = useFuelHistory(
        isFuel ? branchId : undefined
    );
    const { data: rentHistoryRes, isLoading: isRentHistLoading } = useRentHistory(
        isRent ? branchId : undefined
    );
    const { data: salaryHistoryRes, isLoading: isSalaryHistLoading } = useSalaryHistory(
        isSalary ? branchId : undefined
    );
    const { data: labourHistoryRes, isLoading: isLabourHistLoading } = useLabourHistory(
        isLabour ? branchId : undefined
    );
    const { data: emiHistoryRes, isLoading: isEmiHistLoading } = useEmiHistory(
        isEmi ? branchId : undefined
    );

    const fuelHistory = useMemo(() => extractHistoryList(fuelHistoryRes), [fuelHistoryRes]);
    const rentHistory = useMemo(() => extractHistoryList(rentHistoryRes), [rentHistoryRes]);
    const salaryHistory = useMemo(() => extractHistoryList(salaryHistoryRes), [salaryHistoryRes]);
    const labourHistory = useMemo(() => extractHistoryList(labourHistoryRes), [labourHistoryRes]);
    const emiHistory = useMemo(() => extractHistoryList(emiHistoryRes), [emiHistoryRes]);

    // Selected Branch Data for Rent Summary
    const selectedBranchData = useMemo(() => {
        if (!branchId) return null;
        return branchDropdownList.find((b: any) => String(b._id) === String(branchId));
    }, [branchId, branchDropdownList]);

    // Labour Total Amount Calculation
    const labourTotal = useMemo(() => {
        const count = typeof labourCount === "number" ? labourCount : 0;
        const rate = typeof ratePerLabour === "number" ? ratePerLabour : 0;
        return count * rate;
    }, [labourCount, ratePerLabour]);

    // Synchronize labour total to cash amount
    const handleApplyLabourTotal = () => {
        if (labourTotal > 0) {
            setCashAmount(labourTotal);
            setOnlineAmount("");
            showToast("info", "Amount Applied", `₹${labourTotal} applied to Cash Amount.`);
        }
    };

    // Auto-calculated Integer Total Amount (No decimals)
    const totalAmount = useMemo(() => {
        const cash = typeof cashAmount === "number" ? cashAmount : 0;
        const online = typeof onlineAmount === "number" ? onlineAmount : 0;
        return (cash + online).toString();
    }, [cashAmount, onlineAmount]);

    // Integer-only input handlers (disallowing decimals / non-numeric input)
    const handleCashAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") {
            setCashAmount("");
            return;
        }
        const clean = raw.replace(/\D/g, "");
        const intVal = clean === "" ? "" : parseInt(clean, 10);
        setCashAmount(intVal);
        if (errors.amount) setErrors((p) => ({ ...p, amount: "" }));
    };

    const handleOnlineAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") {
            setOnlineAmount("");
            return;
        }
        const clean = raw.replace(/\D/g, "");
        const intVal = clean === "" ? "" : parseInt(clean, 10);
        setOnlineAmount(intVal);
        if (errors.amount) setErrors((p) => ({ ...p, amount: "" }));
        if (intVal === "" || intVal === 0) {
            if (errors.receipt) setErrors((p) => ({ ...p, receipt: "" }));
        }
    };

    // KM input handlers
    const handleStartKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const clean = raw.replace(/\D/g, "");
        setStartKm(clean);
        if (errors.startKm) setErrors((p) => ({ ...p, startKm: "" }));
    };

    const handleEndKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const clean = raw.replace(/\D/g, "");
        setEndKm(clean);
        if (errors.endKm) setErrors((p) => ({ ...p, endKm: "" }));
    };

    // Labour input handlers
    const handleLabourCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") {
            setLabourCount("");
            return;
        }
        const clean = raw.replace(/\D/g, "");
        const intVal = clean === "" ? "" : parseInt(clean, 10);
        setLabourCount(intVal);
    };

    const handleRatePerLabourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") {
            setRatePerLabour("");
            return;
        }
        const clean = raw.replace(/\D/g, "");
        const intVal = clean === "" ? "" : parseInt(clean, 10);
        setRatePerLabour(intVal);
    };

    // ─── Document / Receipt Upload Handlers ─────────────────────────────────────
    const handleDocumentUpload = async (file: File) => {
        const res = await uploadFile(file, "document");
        if (res?.url) {
            setDocumentName(res.fileName || file.name);
            setDocumentUrl(res.url);
            if (errors.document) {
                setErrors((p) => ({ ...p, document: "" }));
            }
        }
    };

    const handleReceiptUpload = async (file: File) => {
        const res = await uploadFile(file, "receipt");
        if (res?.url) {
            setReceiptName(res.fileName || file.name);
            setReceiptUrl(res.url);
            if (errors.receipt) {
                setErrors((p) => ({ ...p, receipt: "" }));
            }
        }
    };

    // ─── Form Submission (POST to /memo/add-expense) ────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};

        if (!branchId) {
            newErrors.branchId = "Please select a branch.";
        }
        if (!expenseType) {
            newErrors.expenseType = "Please select an expense type.";
        }
        if (!expenseDate) {
            newErrors.expenseDate = "Please enter an expense date.";
        }

        // Fuel Specific Validation
        if (["Petrol", "Diesel", "CNG"].includes(expenseType)) {
            if (!startKm) newErrors.startKm = "Please enter Start KM.";
            if (!endKm) newErrors.endKm = "Please enter End KM.";
            if (!quantity) newErrors.quantity = "Please enter fuel liter/quantity.";
        }

        // Other Truck Specific Validation
        if (expenseType === "Other Truck") {
            if (!otherTruckSubtype) newErrors.otherTruckSubtype = "Please select a truck expense type.";
        }

        // Labour Specific Validation
        if (expenseType === "Labour") {
            if (!labourMonth) newErrors.labourMonth = "Please select month.";
            if (!labourWeek) newErrors.labourWeek = "Please select week.";
            if (!labourCount || Number(labourCount) <= 0)
                newErrors.labourCount = "Please enter valid labor count.";
            if (!ratePerLabour || Number(ratePerLabour) <= 0)
                newErrors.ratePerLabour = "Please enter rate per labor.";
        }

        const numCash = typeof cashAmount === "number" ? cashAmount : 0;
        const numOnline = typeof onlineAmount === "number" ? onlineAmount : 0;
        const numTotal = numCash + numOnline;

        if (numTotal <= 0) {
            newErrors.amount = "Total Amount must be greater than 0.";
        }

        // Required Receipt if online amount is entered
        if (numOnline > 0 && !receiptUrl) {
            newErrors.receipt = "Receipt upload is required when online amount is entered.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showToast("error", "Validation Error", Object.values(newErrors)[0]);
            return;
        }

        setErrors({});

        // Payload formatted with exact required backend keys for POST /memo/add-expense
        const payload: Record<string, unknown> = {
            // userId: branchId,
            branchId,
            expenseType,
            // date: expenseDate,
            expenseDate,
            // description: remark.trim(),
            remark: remark.trim(),
            cashAmount: numCash,
            onlineAmount: numOnline,
            totalAmount: numTotal,
            paymentScreenShort: receiptUrl,
            // receiptUrl,
            // receiptName,
            documentUrl,
            // documentName,
        };

        // Fuel fields
        if (["Petrol", "Diesel", "CNG"].includes(expenseType)) {
            payload.startKM = Number(startKm) || 0;
            payload.endKM = Number(endKm) || 0;
            payload.liter = Number(quantity) || 0;
        }

        // Other truck fields
        if (expenseType === "Other Truck") {
            payload.expenseType = otherTruckSubtype;
            payload.startKM = Number(startKm) || 0;
            payload.endKM = Number(endKm) || 0;
        }

        // Labour fields
        if (expenseType === "Labour") {
            payload.labourMonth = labourMonth;
            payload.labourWeek = labourWeek;
            payload.labourCount = Number(labourCount) || 0;
            payload.ratePerLabour = Number(ratePerLabour) || 0;
            payload.labourTotal = labourTotal;
        }

        try {
            await createExpenseMutation.mutateAsync(payload as any);
            showToast("success", "Expense Added", "Expense record created successfully.");
            handleReset();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to add expense record.";
            showToast("error", "Submission Failed", msg);
        }
    };

    // ─── Columns Definition for SimpleDataTable ─────────────────────────────────
    const historyColumns = useMemo<ColumnDef<any>[]>(() => {
        const cols: ColumnDef<any>[] = [
            {
                key: "date",
                label: "Date",
                sortable: true,
                sortValue: (r) => new Date(r.date || 0).getTime(),
                render: (_, r) => (
                    <span className="font-mono text-slate-800">
                        {r.date || "—"}
                    </span>
                ),
            },
            {
                key: "receipt",
                label: "Receipt No",
                sortable: true,
                width: "w-20",
                sortValue: (r) => (r.receiptNo ? 1 : 0),
                render: (_, r) => {
                    const receiptNo = r.receiptNo;
                    return <span className="font-mono text-slate-800">{receiptNo}</span>;
                },
            }
        ];

        if (isFuel) {
            cols.push(
                {
                    key: "fuelType",
                    label: "Fuel Type",
                    sortable: true,
                    sortValue: (r) => r.fuelType || r.expenseType || "",
                    render: (_, r) => (
                        <span className="font-semibold text-slate-900">
                            {r.fuelType || r.expenseType || "—"}
                        </span>
                    ),
                },
                {
                    key: "truck",
                    label: "Truck",
                    sortable: true,
                    sortValue: (r) => r.truckNumber || r.truckNo || r.truckId?.truckNumber || "",
                    render: (_, r) => (
                        <span className="text-slate-800">
                            {r.truckNumber || r.truckNo || r.truckId?.truckNumber || "—"}
                        </span>
                    ),
                },
                {
                    key: "startKM",
                    label: "Start KM",
                    sortable: true,
                    sortValue: (r) => Number(r.startKM || r.startKm || 0),
                    render: (_, r) => (
                        <span className="font-mono text-slate-800">
                            {r.startKM || r.startKm || "—"}
                        </span>
                    ),
                },
                {
                    key: "endKM",
                    label: "End KM",
                    sortable: true,
                    sortValue: (r) => Number(r.endKM || r.endKm || 0),
                    render: (_, r) => (
                        <span className="font-mono text-slate-800">
                            {r.endKM || r.endKm || "—"}
                        </span>
                    ),
                },
                {
                    key: "liter",
                    label: "Liter",
                    sortable: true,
                    sortValue: (r) => Number(r.liter || r.quantity || 0),
                    render: (_, r) => (
                        <span className="font-mono text-slate-800">
                            {r.liter || r.quantity || "—"}
                        </span>
                    ),
                }
            );
        }

        if (isLabour) {
            cols.push(
                {
                    key: "labourMonth",
                    label: "Month / Week",
                    sortable: true,
                    sortValue: (r) =>
                        r.labourMonth
                            ? `${r.labourMonth} - ${r.labourWeek || ""}`
                            : r.description || r.remark || "",
                    render: (_, r) => (
                        <span className="text-slate-800">
                            {r.labourMonth
                                ? `${r.labourMonth} - ${r.labourWeek || ""}`
                                : r.description || r.remark || "—"}
                        </span>
                    ),
                },
                {
                    key: "labourCount",
                    label: "Labor Count",
                    sortable: true,
                    sortValue: (r) => Number(r.labourCount || 0),
                    render: (_, r) => (
                        <span className="font-mono text-slate-800 text-center block">
                            {r.labourCount || "—"}
                        </span>
                    ),
                },
                {
                    key: "ratePerLabour",
                    label: "Rate / Labor (₹)",
                    sortable: true,
                    sortValue: (r) => Number(r.ratePerLabour || 0),
                    render: (_, r) => (
                        <span className="font-mono text-slate-800 text-right block">
                            ₹{r.ratePerLabour || 0}
                        </span>
                    ),
                }
            );
        }

        if (isRent) {
            cols.push({
                key: "branchRemark",
                label: "Branch / Remark",
                sortable: true,
                sortValue: (r) => r.description || r.remark || r.branchName || "",
                render: (_, r) => (
                    <span className="text-slate-700 max-w-[220px] truncate block">
                        {r.description || r.remark || r.branchName || "—"}
                    </span>
                ),
            });
        }



        cols.push(
            {
                key: "cashAmount",
                label: "Cash (₹)",
                sortable: true,
                sortValue: (r) => Number(r.cashAmount || r.cash || 0),
                render: (_, r) => (
                    <span className="font-mono text-slate-800 text-right block">
                        ₹{r.cashAmount || r.cash || 0}
                    </span>
                ),
            },
            {
                key: "onlineAmount",
                label: "Online (₹)",
                sortable: true,
                sortValue: (r) => Number(r.onlineAmount || r.online || 0),
                render: (_, r) => (
                    <span className="font-mono text-slate-800 text-right block">
                        ₹{r.onlineAmount || r.online || 0}
                    </span>
                ),
            },
            {
                key: "totalAmount",
                label: "Total (₹)",
                sortable: true,
                sortValue: (r) => Number(r.totalAmount || r.total || 0),
                render: (_, r) => (
                    <span className="font-mono font-bold text-black text-right block">
                        ₹{r.totalAmount || r.total || 0}
                    </span>
                ),
            }
        );

        if (isSalary) {
            cols.push({
                key: "staffRemark",
                label: "Staff / Remark",
                sortable: true,
                sortValue: (r) => r.remark || "",
                render: (_, r) => (
                    <span className="text-slate-700 max-w-[220px] truncate block">
                        {r.remark || "—"}
                    </span>
                ),
            });
        }
        return cols;
    }, [isFuel, isLabour, isRent, isSalary]);

    // ─── Reset Form ────────────────────────────────────────────────────────────
    const handleReset = () => {
        if (isAdminOrSuperAdmin) {
            setBranchId("");
        }
        setExpenseType("");
        setExpenseDate(todayStr);
        setRemark("");
        setDocumentName("");
        setDocumentUrl("");
        setStartKm("");
        setEndKm("");
        setQuantity("");
        setOtherTruckSubtype("");
        setLabourCount("");
        setRatePerLabour("");
        setCashAmount("");
        setOnlineAmount("");
        setReceiptName("");
        setReceiptUrl("");
        setErrors({});
    };

    return (
        <div className="w-full space-y-1.5 pb-6">
            {/* ─── Top Header Bar ──────────────────────────────────────────────────── */}
            <div className="bg-white rounded border border-slate-200/80 shadow-2xs px-3 py-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-[#2980b9]/10 text-[#2980b9] flex items-center justify-center font-bold">
                        <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-lg font-bold text-black tracking-tight leading-tight">
                            Add Expense
                        </h1>
                    </div>
                </div>

                <Button
                    type="button"
                    onClick={() => router.push("/reports/branch-expense")}
                    className="bg-[#2980b9] hover:bg-[#2471a3] text-white h-7 px-3 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    View Expense Reports
                </Button>
            </div>

            {/* ─── Expense Form (Full Width) ───────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="space-y-1.5">
                {/* ─── 1. Primary Details Section (Row 1) ─────────────────────────────── */}
                <FormCard title="Expense Information" icon={DollarSign}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5 items-start">
                        {/* 1. Branch Select */}
                        <div>
                            <FormSelect
                                label="Select Branch"
                                required
                                searchable
                                options={branchOptions}
                                value={branchId}
                                disabled={!isAdminOrSuperAdmin && Boolean(ownBranchId)}
                                onChange={(val) => {
                                    setBranchId(val);
                                    if (errors.branchId) setErrors((p) => ({ ...p, branchId: "" }));
                                }}
                                placeholder="Select Branch"
                                searchPlaceholder="Search branch..."
                                error={errors.branchId}
                            />
                        </div>

                        {/* 2. Expense Type */}
                        <div>
                            <FormSelect
                                label="Expense Type"
                                required
                                searchable
                                options={EXPENSE_TYPE_OPTIONS}
                                value={expenseType}
                                onChange={(val) => {
                                    setExpenseType(val as ExpenseType);
                                    if (errors.expenseType) setErrors((p) => ({ ...p, expenseType: "" }));
                                }}
                                placeholder="Select Expense Type"
                                searchPlaceholder="Search expense type..."
                                error={errors.expenseType}
                            />
                        </div>

                        {/* 3. Expense Date */}
                        <div>
                            <FormInput
                                label="Expense Date"
                                type="date"
                                required
                                value={expenseDate}
                                onChange={(e) => {
                                    setExpenseDate(e.target.value);
                                    if (errors.expenseDate) setErrors((p) => ({ ...p, expenseDate: "" }));
                                }}
                                error={errors.expenseDate}
                            />
                        </div>

                        {/* 4. Description / Remark */}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-black flex items-center gap-0.5 leading-none">
                                Description / Remark
                            </Label>
                            <textarea
                                rows={1}
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                placeholder="Enter description..."
                                className="w-full text-xs px-2.5 py-1.5 rounded border border-black bg-white focus:outline-none focus:ring-1 focus:ring-[#2980b9] placeholder:text-slate-400 h-8 min-h-[32px] resize-none"
                            />
                        </div>

                        {/* 5. Document Upload (Upload + Live Camera Capture) */}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-black flex items-center gap-0.5 leading-none">
                                Document Upload
                            </Label>
                            <FileUploadWithCamera
                                label="Doc"
                                fileName={documentName}
                                fileUrl={documentUrl}
                                isUploading={uploadingFields["document"]}
                                onFileSelect={handleDocumentUpload}
                                onRemove={() => {
                                    setDocumentName("");
                                    setDocumentUrl("");
                                }}
                                accept="image/*,.pdf"
                            />
                        </div>
                    </div>
                </FormCard>

                {/* ─── 2. Payment & Receipt Section (Row 2) ───────────────────────────── */}
                <FormCard title="Payment & Receipt Details" icon={Receipt}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 items-start">
                        {/* 1. Cash Amount (Whole Integer only) */}
                        <div>
                            <FormInput
                                label="Cash Amount (₹)"
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                value={cashAmount === "" ? "" : String(cashAmount)}
                                onChange={handleCashAmountChange}
                                onKeyDown={(e) => {
                                    if (e.key === "." || e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                                        e.preventDefault();
                                    }
                                }}
                                error={errors.amount && !onlineAmount ? errors.amount : undefined}
                            />
                        </div>

                        {/* 2. Online Amount (Whole Integer only) */}
                        <div>
                            <FormInput
                                label="Online Amount (₹)"
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                value={onlineAmount === "" ? "" : String(onlineAmount)}
                                onChange={handleOnlineAmountChange}
                                onKeyDown={(e) => {
                                    if (e.key === "." || e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                                        e.preventDefault();
                                    }
                                }}
                                error={errors.amount && !cashAmount ? errors.amount : undefined}
                            />
                        </div>

                        {/* 3. Total Amount (Auto Calculated Integer, Read Only) */}
                        <div>
                            <FormInput
                                label="Total Amount (₹)"
                                type="text"
                                value={totalAmount}
                                disabled
                                readOnly
                                className="font-bold font-mono text-slate-900 bg-slate-100"
                            />
                        </div>

                        {/* 4. Receipt Upload (Required if onlineAmount > 0) */}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-black flex items-center gap-0.5 leading-none">
                                Receipt Upload{" "}
                                {Number(onlineAmount) > 0 && (
                                    <span className="text-red-500 font-bold ml-0.5">* (Required for Online)</span>
                                )}
                            </Label>
                            <FileUploadWithCamera
                                label="Receipt"
                                required={Number(onlineAmount) > 0}
                                fileName={receiptName}
                                fileUrl={receiptUrl}
                                isUploading={uploadingFields["receipt"]}
                                onFileSelect={handleReceiptUpload}
                                onRemove={() => {
                                    setReceiptName("");
                                    setReceiptUrl("");
                                }}
                                accept="image/*,.pdf"
                            />
                            {errors.receipt && (
                                <p className="text-[10px] text-red-500 font-medium leading-none pt-0.5">
                                    {errors.receipt}
                                </p>
                            )}
                        </div>
                    </div>
                </FormCard>

                {/* ─── 3. DYNAMIC SECTION: Fuel Details (Petrol / Diesel / CNG) ─────────── */}
                {isFuel && (
                    <FormCard title={`${expenseType} Details`} icon={Fuel} className="animate-in fade-in-50 duration-150">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 items-start">
                            {/* 1. Fuel Type */}
                            <div>
                                <FormInput
                                    label="Fuel Type"
                                    type="text"
                                    value={expenseType}
                                    disabled
                                    readOnly
                                    required
                                    className="bg-slate-100 font-semibold text-slate-800"
                                />
                            </div>

                            {/* 2. Start KM */}
                            <div>
                                <FormInput
                                    label="Start KM"
                                    required
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="e.g. 45000"
                                    value={startKm}
                                    onChange={handleStartKmChange}
                                    error={errors.startKm}
                                />
                            </div>

                            {/* 3. End KM */}
                            <div>
                                <FormInput
                                    label="End KM"
                                    required
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="e.g. 45200"
                                    value={endKm}
                                    onChange={handleEndKmChange}
                                    error={errors.endKm}
                                />
                            </div>

                            {/* 4. Liter / Quantity */}
                            <div>
                                <FormInput
                                    label={`Liter (${expenseType === "CNG" ? "Kg" : "Liters"})`}
                                    required
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="0.00"
                                    value={quantity}
                                    onChange={(e) => {
                                        setQuantity(e.target.value);
                                        if (errors.quantity) setErrors((p) => ({ ...p, quantity: "" }));
                                    }}
                                    error={errors.quantity}
                                />
                            </div>
                        </div>
                    </FormCard>
                )}

                {/* ─── 4. DYNAMIC SECTION: Other Truck Details ─────────────────────────── */}
                {expenseType === "Other Truck" && (
                    <FormCard title="Other Truck Details" icon={Truck} className="animate-in fade-in-50 duration-150">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 items-start">
                            {/* 1. Truck Expense Type */}
                            <div>
                                <FormSelect
                                    label="Truck Expense Type"
                                    required
                                    searchable
                                    options={OTHER_TRUCK_SUBTYPES}
                                    value={otherTruckSubtype}
                                    onChange={(val) => {
                                        setOtherTruckSubtype(val);
                                        if (errors.otherTruckSubtype) setErrors((p) => ({ ...p, otherTruckSubtype: "" }));
                                    }}
                                    placeholder="Select Truck Expense Type"
                                    searchPlaceholder="Search type..."
                                    error={errors.otherTruckSubtype}
                                />
                            </div>

                            {/* 2. Start KM */}
                            <div>
                                <FormInput
                                    label="Start KM"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="e.g. 45000"
                                    value={startKm}
                                    onChange={handleStartKmChange}
                                    error={errors.startKm}
                                />
                            </div>

                            {/* 3. End KM */}
                            <div>
                                <FormInput
                                    label="End KM"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="e.g. 45200"
                                    value={endKm}
                                    onChange={handleEndKmChange}
                                />
                            </div>
                        </div>
                    </FormCard>
                )}

                {/* ─── 5. DYNAMIC SECTION: Labour Details ──────────────────────────────── */}
                {isLabour && (
                    <FormCard title="Labour Expense Details" icon={HardHat} className="animate-in fade-in-50 duration-150">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5 items-start">
                            {/* 1. Select Month (Last 6 Months) */}
                            <div>
                                <FormSelect
                                    label="Select Month"
                                    required
                                    options={last6Months}
                                    value={labourMonth}
                                    onChange={(val) => {
                                        setLabourMonth(val);
                                        if (errors.labourMonth) setErrors((p) => ({ ...p, labourMonth: "" }));
                                    }}
                                    placeholder="Select Month"
                                    error={errors.labourMonth}
                                />
                            </div>

                            {/* 2. Select Week (Fixed 7-Day Monday to Sunday weeks) */}
                            <div>
                                <FormSelect
                                    label="Select Week"
                                    required
                                    options={dynamicLabourWeeks}
                                    value={labourWeek}
                                    onChange={(val) => {
                                        setLabourWeek(val);
                                        if (errors.labourWeek) setErrors((p) => ({ ...p, labourWeek: "" }));
                                    }}
                                    placeholder="Select Week"
                                    error={errors.labourWeek}
                                />
                            </div>

                            {/* 3. Labor Count */}
                            <div>
                                <FormInput
                                    label="Labor Count"
                                    required
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="e.g. 4"
                                    value={labourCount === "" ? "" : String(labourCount)}
                                    onChange={handleLabourCountChange}
                                    error={errors.labourCount}
                                />
                            </div>

                            {/* 4. Rate per Labor */}
                            <div>
                                <FormInput
                                    label="Rate per Labor (₹)"
                                    required
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="e.g. 400"
                                    value={ratePerLabour === "" ? "" : String(ratePerLabour)}
                                    onChange={handleRatePerLabourChange}
                                    error={errors.ratePerLabour}
                                />
                            </div>

                            {/* 5. Total (Auto calculate) */}
                            <div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[11px] font-bold text-black flex items-center gap-0.5 leading-none">
                                            Total (₹)
                                        </Label>
                                        {labourTotal > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleApplyLabourTotal}
                                                className="text-[10px] text-[#2980b9] hover:underline font-semibold cursor-pointer"
                                            >
                                                Apply to Amount
                                            </button>
                                        )}
                                    </div>
                                    <FormInput
                                        label=""
                                        type="text"
                                        value={labourTotal > 0 ? `₹${labourTotal}` : "₹0"}
                                        disabled
                                        readOnly
                                        className="font-bold font-mono text-slate-900 bg-slate-100"
                                    />
                                </div>
                            </div>
                        </div>
                    </FormCard>
                )}

                {/* ─── 6. DYNAMIC SECTION: Rent Summary ────────────────────────────────── */}
                {isRent && (
                    <div className="space-y-1.5 animate-in fade-in-50 duration-150">
                        <FormCard title="Branch Rent Summary" icon={Building2}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                <div className="p-2.5 rounded bg-blue-50/60 border border-blue-100">
                                    <span className="text-[11px] font-medium text-slate-600 block">Monthly Rent</span>
                                    <span className="text-base font-bold text-slate-900 font-mono">
                                        ₹{selectedBranchData?.branchInfo?.monthlyRent || 0}
                                    </span>
                                </div>
                                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                                    <span className="text-[11px] font-medium text-slate-600 block">Rent Due Date</span>
                                    <span className="text-sm font-semibold text-slate-900">
                                        {selectedBranchData?.branchInfo?.rentDueDate || "5th of month"}
                                    </span>
                                </div>
                                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                                    <span className="text-[11px] font-medium text-slate-600 block">Security Deposit</span>
                                    <span className="text-sm font-bold text-slate-900 font-mono">
                                        ₹{selectedBranchData?.branchInfo?.deposite || 0}
                                    </span>
                                </div>
                                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                                    <span className="text-[11px] font-medium text-slate-600 block">Owner / Landlord</span>
                                    <span className="text-xs font-semibold text-slate-900 block truncate">
                                        {selectedBranchData?.branchInfo?.ownerDetail?.name || "Landlord"}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                        {selectedBranchData?.branchInfo?.ownerDetail?.mobile1 || "—"}
                                    </span>
                                </div>
                            </div>
                        </FormCard>
                    </div>
                )}

                {/* ─── 7. DYNAMIC SECTION: Salary Summary ──────────────────────────────── */}
                {isSalary && (
                    <div className="space-y-1.5 animate-in fade-in-50 duration-150">
                        <FormCard title="Salary Summary" icon={Banknote}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                <div className="p-2.5 rounded bg-amber-50/60 border border-amber-100">
                                    <span className="text-[11px] font-medium text-slate-600 block">Total Staff</span>
                                    <span className="text-base font-bold text-slate-900 font-mono">
                                        {selectedBranchData?.branchInfo?.salaryAmount ? "1 Active" : "Branch Staff"}
                                    </span>
                                </div>
                                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                                    <span className="text-[11px] font-medium text-slate-600 block">Base Salary</span>
                                    <span className="text-sm font-bold text-slate-900 font-mono">
                                        ₹{selectedBranchData?.branchInfo?.salaryAmount || "0"}
                                    </span>
                                </div>
                                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                                    <span className="text-[11px] font-medium text-slate-600 block">Compensation Type</span>
                                    <span className="text-xs font-semibold text-slate-900 uppercase">
                                        {selectedBranchData?.branchInfo?.compensationType || "Salary"}
                                    </span>
                                </div>
                                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                                    <span className="text-[11px] font-medium text-slate-600 block">Salary Month</span>
                                    <span className="text-xs font-semibold text-slate-900">
                                        {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
                                    </span>
                                </div>
                            </div>
                        </FormCard>
                    </div>
                )}

                {/* ─── 8. DYNAMIC SECTION: History Table for Fuel, Rent, Salary, Labour, EMI ─ */}
                {(isFuel || isRent || isSalary || isLabour || isEmi) && (
                    <div className="space-y-1.5 animate-in fade-in-50 duration-150">
                        <FormCard
                            title={
                                isFuel
                                    ? "Past Fuel Payment History"
                                    : isRent
                                        ? "Past Rent Payment History"
                                        : isSalary
                                            ? "Past Salary Payment History"
                                            : isLabour
                                                ? "Past Labour Payment History"
                                                : "Past EMI Payment History"
                            }
                            icon={History}
                        >
                            <SimpleDataTable
                                columns={historyColumns}
                                data={
                                    !branchId
                                        ? []
                                        : isFuel
                                            ? fuelHistory
                                            : isRent
                                                ? rentHistory
                                                : isSalary
                                                    ? salaryHistory
                                                    : isLabour
                                                        ? labourHistory
                                                        : emiHistory
                                }
                                isLoading={
                                    isFuel
                                        ? isFuelHistLoading
                                        : isRent
                                            ? isRentHistLoading
                                            : isSalary
                                                ? isSalaryHistLoading
                                                : isLabour
                                                    ? isLabourHistLoading
                                                    : isEmiHistLoading
                                }
                                showSrNo
                                srNoLabel="#"
                                emptyMessage={
                                    !branchId
                                        ? "Please select a branch to view history."
                                        : "No previous history records found for this branch."
                                }
                            />
                        </FormCard>
                    </div>
                )}

                {/* ─── Form Action Buttons ────────────────────────────────────────────── */}
                <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                        className="h-8 px-4 text-xs font-semibold text-slate-600 border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                        <RotateCcw className="w-3 h-3 mr-1.5" />
                        Reset
                    </Button>

                    <Button
                        type="submit"
                        disabled={createExpenseMutation.isPending}
                        className="h-8 px-6 bg-[#2980b9] hover:bg-[#2471a3] text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                        {createExpenseMutation.isPending ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Saving Expense...</span>
                            </>
                        ) : (
                            <>
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>Submit Expense</span>
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
