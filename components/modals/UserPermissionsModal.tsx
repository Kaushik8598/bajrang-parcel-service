"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Loader2,
  Check,
  Minus,
} from "lucide-react";
import AppModal from "@/components/ui/AppModal";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import {
  useUserPermissionsById,
  useUpdateUserPermissionsById,
} from "@/lib/hooks";
import type { User } from "@/lib/types/auth";
import type { UserPermissionItem, UserPermissionActionMap } from "@/lib/api/user";

interface UserPermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess?: () => void;
}

type ActionKey = "view" | "add" | "edit" | "delete" | "export";

const ACTION_COLUMNS: { key: ActionKey; label: string }[] = [
  { key: "view", label: "View" },
  { key: "add", label: "Add" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
  { key: "export", label: "Export" },
];

export default function UserPermissionsModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserPermissionsModalProps) {
  const userId = user ? String(user._id || user.id || "") : "";

  // Query specific user's permissions via GET /user/permission/:id
  const { data: userPermissionsRes, isLoading: isUserPermLoading } = useUserPermissionsById(
    userId,
    open && Boolean(userId)
  );
  const updateMutation = useUpdateUserPermissionsById();

  // Local table rows state
  const [rows, setRows] = useState<UserPermissionItem[]>([]);

  // Initialize table rows from API response
  useEffect(() => {
    if (!open) return;

    const rawData = userPermissionsRes?.data;
    let list: UserPermissionItem[] = [];

    if (Array.isArray(rawData)) {
      list = rawData;
    } else if (rawData && typeof rawData === "object") {
      if (Array.isArray(rawData.permissions)) {
        list = rawData.permissions;
      } else if (Array.isArray(rawData.modules)) {
        list = rawData.modules;
      }
    }

    if (list.length > 0) {
      const formattedRows: UserPermissionItem[] = list.map((item) => ({
        module: item.module,
        displayName: item.displayName || item.module,
        actions: {
          view: Boolean(item.actions?.view),
          add: Boolean(item.actions?.add),
          edit: Boolean(item.actions?.edit),
          delete: Boolean(item.actions?.delete),
          export: Boolean(item.actions?.export),
        },
      }));
      setRows(formattedRows);
    }
  }, [open, userPermissionsRes]);

  // ─── Select All & Column/Row Helpers ───────────────────────────────────────

  // Check if every checkbox in the entire table is true
  const isGlobalAllSelected = useMemo(() => {
    if (rows.length === 0) return false;
    return rows.every((r) =>
      ACTION_COLUMNS.every((col) => Boolean(r.actions?.[col.key]))
    );
  }, [rows]);

  // Check if any checkbox is selected in the entire table
  const isGlobalSomeSelected = useMemo(() => {
    if (rows.length === 0) return false;
    return rows.some((r) =>
      ACTION_COLUMNS.some((col) => Boolean(r.actions?.[col.key]))
    );
  }, [rows]);

  // Toggle Global Select All
  const handleToggleGlobalAll = () => {
    const targetState = !isGlobalAllSelected;
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        actions: {
          view: targetState,
          add: targetState,
          edit: targetState,
          delete: targetState,
          export: targetState,
        },
      }))
    );
  };

  // Check if all rows have a specific action checked
  const isColumnAllChecked = (colKey: ActionKey) => {
    if (rows.length === 0) return false;
    return rows.every((r) => Boolean(r.actions?.[colKey]));
  };

  // Check if some rows have a specific action checked
  const isColumnSomeChecked = (colKey: ActionKey) => {
    if (rows.length === 0) return false;
    return rows.some((r) => Boolean(r.actions?.[colKey]));
  };

  // Toggle all rows for a specific column
  const handleToggleColumn = (colKey: ActionKey) => {
    const allChecked = isColumnAllChecked(colKey);
    const targetState = !allChecked;
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        actions: {
          ...row.actions,
          [colKey]: targetState,
        },
      }))
    );
  };

  // Check if all actions in a single row are checked
  const isRowAllChecked = (row: UserPermissionItem) => {
    return ACTION_COLUMNS.every((col) => Boolean(row.actions?.[col.key]));
  };

  // Toggle all actions in a single row
  const handleToggleRow = (index: number) => {
    setRows((prev) => {
      const updated = [...prev];
      const targetRow = updated[index];
      const allChecked = isRowAllChecked(targetRow);
      const targetState = !allChecked;

      updated[index] = {
        ...targetRow,
        actions: {
          view: targetState,
          add: targetState,
          edit: targetState,
          delete: targetState,
          export: targetState,
        },
      };
      return updated;
    });
  };

  // Toggle a single cell
  const handleToggleCell = (index: number, colKey: ActionKey) => {
    setRows((prev) => {
      const updated = [...prev];
      const targetRow = updated[index];
      const currentVal = Boolean(targetRow.actions?.[colKey]);

      updated[index] = {
        ...targetRow,
        actions: {
          ...targetRow.actions,
          [colKey]: !currentVal,
        },
      };
      return updated;
    });
  };

  // ─── Save Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    updateMutation.mutate(
      {
        userId,
        permissions: rows,
      },
      {
        onSuccess: (res: any) => {
          showToast(
            "success",
            res?.message ||
              `Permissions updated successfully for "${user?.name || "user"}".`
          );
          if (onSuccess) onSuccess();
          onOpenChange(false);
        },
        onError: (err: any) => {
          showToast(
            "error",
            err?.message || "Failed to update user permissions."
          );
        },
      }
    );
  };

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      maxWidth="sm:max-w-5xl"
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2980b9]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              Manage Permissions
            </h2>
            <p className="text-[11px] text-slate-500 font-normal">
              {user?.name} •{" "}
              <span className="font-mono text-slate-700 font-semibold uppercase">
                {user?.role || "Staff"}
              </span>{" "}
              • {user?.email || user?.mobile}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 font-medium">
            {rows.length} Modules Configured
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
              className="h-8 px-4 text-xs text-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={updateMutation.isPending || isUserPermLoading}
              className="h-8 px-5 text-xs font-semibold bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-xs"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Permissions"
              )}
            </Button>
          </div>
        </div>
      }
    >
      <div className="relative max-h-[70vh] overflow-y-auto border border-slate-300 rounded-md">
        {isUserPermLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-[#2980b9]" />
            <span className="text-xs font-medium">Loading user permissions...</span>
          </div>
        ) : (
          <table className="w-full text-xs border-collapse">
            {/* ─── Main Blue Header ─── */}
            <thead>
              <tr className="bg-[#2980b9] text-white font-bold text-xs uppercase tracking-wide select-none">
                <th className="px-4 py-3 text-left border-r border-[#3498db] w-[36%]">
                  Menu Title
                </th>
                {ACTION_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-3 text-center border-r border-[#3498db] last:border-r-0 w-[12.8%]"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>

              {/* ─── Lighter Blue Select All Row ─── */}
              <tr className="bg-[#3498db] text-white font-semibold text-xs border-t border-[#2980b9]/40 select-none">
                <th className="px-4 py-2.5 text-left border-r border-[#2980b9]/40">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleToggleGlobalAll}
                      className={`w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer ${
                        isGlobalAllSelected
                          ? "bg-white text-[#2980b9]"
                          : isGlobalSomeSelected
                          ? "bg-white text-[#2980b9]"
                          : "border-2 border-white/90 bg-transparent hover:bg-white/10"
                      }`}
                      title={isGlobalAllSelected ? "Deselect All" : "Select All"}
                    >
                      {isGlobalAllSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      {!isGlobalAllSelected && isGlobalSomeSelected && (
                        <Minus className="w-3 h-3 stroke-[3]" />
                      )}
                    </button>
                    <span className="text-white font-bold">Select All</span>
                  </div>
                </th>

                {/* Column-wise Select All Checkboxes */}
                {ACTION_COLUMNS.map((col) => {
                  const colAll = isColumnAllChecked(col.key);
                  const colSome = isColumnSomeChecked(col.key);

                  return (
                    <th
                      key={col.key}
                      className="px-3 py-2.5 text-center border-r border-[#2980b9]/40 last:border-r-0"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleColumn(col.key)}
                        className={`mx-auto w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer ${
                          colAll
                            ? "bg-white text-[#2980b9]"
                            : colSome
                            ? "bg-white text-[#2980b9]"
                            : "border-2 border-white/90 bg-transparent hover:bg-white/10"
                        }`}
                        title={`Select all ${col.label}`}
                      >
                        {colAll && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        {!colAll && colSome && (
                          <Minus className="w-3 h-3 stroke-[3]" />
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* ─── Permission Data Rows ─── */}
            <tbody className="divide-y divide-slate-200 bg-white">
              {rows.map((row, index) => {
                const rowAll = isRowAllChecked(row);
                const isEven = index % 2 === 0;

                return (
                  <tr
                    key={row.module + index}
                    className={`hover:bg-blue-50/50 transition-colors ${
                      isEven ? "bg-white" : "bg-slate-50/40"
                    }`}
                  >
                    {/* Row Select All & Title */}
                    <td className="px-4 py-3 border-r border-slate-200">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleRow(index)}
                          className={`w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer ${
                            rowAll
                              ? "bg-[#2980b9] text-white"
                              : "border border-slate-400 bg-white hover:border-[#2980b9]"
                          }`}
                          title={rowAll ? "Deselect row" : "Select entire row"}
                        >
                          {rowAll && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <span className="font-semibold text-slate-900 select-none">
                          {row.displayName || row.module}
                        </span>
                      </div>
                    </td>

                    {/* Cell Action Checkboxes */}
                    {ACTION_COLUMNS.map((col) => {
                      const isChecked = Boolean(row.actions?.[col.key]);

                      return (
                        <td
                          key={col.key}
                          className="px-3 py-3 text-center border-r border-slate-200 last:border-r-0"
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleCell(index, col.key)}
                            className={`mx-auto w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer ${
                              isChecked
                                ? "bg-[#2980b9] text-white shadow-2xs"
                                : "border border-slate-300 bg-white hover:border-[#2980b9]"
                            }`}
                            title={`${col.label} ${row.displayName}`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AppModal>
  );
}
