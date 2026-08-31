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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect, FormSelectOption } from "@/components/ui/form-select";
import { FormCard } from "@/components/ui/form-card";
import { Label } from "@/components/ui/label";
import { FileUploadWithCamera } from "@/components/ui/file-upload-with-camera";
import { showToast } from "@/lib/toast";
import { useOnlyBranchList, useUpload, useCreateExpenseMutation } from "@/lib/hooks";
import { getStoredUser, getStoredUserRole } from "@/lib/api/auth";
import { ExpenseType } from "@/lib/api/expense";

// ─── Expense Type Options ─────────────────────────────────────────────────────
const EXPENSE_TYPE_OPTIONS: FormSelectOption[] = [
  { value: "Stationary", label: "Stationary" },
  { value: "Petrol", label: "Petrol" },
  { value: "Diesel", label: "Diesel" },
  { value: "CNG", label: "CNG" },
  { value: "Other Truck", label: "Other Truck" },
  { value: "Rent", label: "Rent" },
  { value: "Salary", label: "Salary" },
  { value: "Labour", label: "Labour" },
  { value: "Truck EMI/Hapto", label: "Truck EMI/Hapto" },
];

export default function AddExpensePage() {
  const router = useRouter();
  const { uploadFile, uploadingFields } = useUpload();
  const createExpenseMutation = useCreateExpenseMutation();

  // ─── User & Role resolution ────────────────────────────────────────────────
  const currentUser = useMemo(() => getStoredUser(), []);
  const currentRole = useMemo(() => getStoredUserRole() || "", []);
  const isAdminOrSuperAdmin = ["superAdmin", "admin"].includes(currentRole);
  const ownBranchId = String(currentUser?._id || currentUser?.id || "");

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

  // ─── Form State ────────────────────────────────────────────────────────────
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [branchId, setBranchId] = useState<string>("");
  const [expenseType, setExpenseType] = useState<ExpenseType | "">("");
  const [expenseDate, setExpenseDate] = useState<string>(todayStr);
  const [remark, setRemark] = useState<string>("");

  // Document Upload
  const [documentName, setDocumentName] = useState<string>("");
  const [documentUrl, setDocumentUrl] = useState<string>("");

  // Row 2: Financials & Receipt (Strict whole integers only)
  const [cashAmount, setCashAmount] = useState<number | "">("");
  const [onlineAmount, setOnlineAmount] = useState<number | "">("");
  const [receiptName, setReceiptName] = useState<string>("");
  const [receiptUrl, setReceiptUrl] = useState<string>("");

  // Form Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Default branch for branch users
  useEffect(() => {
    if (!isAdminOrSuperAdmin && ownBranchId && branchOptions.length > 0) {
      const matched = branchOptions.find((b) => b.value === ownBranchId);
      if (matched) {
        setBranchId(ownBranchId);
      } else if (branchOptions.length > 0 && !branchId) {
        setBranchId(branchOptions[0].value);
      }
    } else if (isAdminOrSuperAdmin && branchOptions.length > 0 && !branchId) {
      setBranchId(branchOptions[0].value);
    }
  }, [isAdminOrSuperAdmin, ownBranchId, branchOptions, branchId]);

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

  // ─── Form Submission ───────────────────────────────────────────────────────
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

    const payload = {
      branchId,
      expenseType,
      expenseDate,
      remark: remark.trim(),
      documentUrl,
      documentName,
      cashAmount: numCash,
      onlineAmount: numOnline,
      totalAmount: numTotal,
      receiptUrl,
      receiptName,
    };

    try {
      await createExpenseMutation.mutateAsync(payload);
      showToast("success", "Expense Added", "Expense record created successfully.");
      handleReset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add expense record.";
      showToast("error", "Submission Failed", msg);
    }
  };

  // ─── Reset Form ────────────────────────────────────────────────────────────
  const handleReset = () => {
    if (isAdminOrSuperAdmin) {
      setBranchId(branchOptions[0]?.value || "");
    }
    setExpenseType("");
    setExpenseDate(todayStr);
    setRemark("");
    setDocumentName("");
    setDocumentUrl("");
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

      {/* ─── Expense Form (Full Width like Booking Form) ──────────────────────── */}
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

            {/* 2. Expense Type (Common FormSelect Component with Searchable) */}
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

            {/* 4. Remark */}
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-black flex items-center gap-0.5 leading-none">
                Remark
              </Label>
              <textarea
                rows={1}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Enter remarks..."
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
