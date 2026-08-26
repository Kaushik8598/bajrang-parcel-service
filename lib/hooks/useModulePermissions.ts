"use client";

import { useMemo } from "react";
import { getStoredUser, getStoredPermissions } from "@/lib/api/auth";
import type { TablePermissions } from "@/lib/types/common";
import type { UserPermissions } from "@/lib/types/auth";

export interface ModulePermissionsResult extends TablePermissions {
  canView: boolean;
}

/**
 * Hook to strictly calculate module permissions directly from dynamic permissions data.
 * 100% Dynamic: Only permissions explicitly granted (true) in the user's permissions will be enabled:
 * - view   -> canView
 * - add    -> canAdd
 * - edit   -> canEdit, canStatus
 * - delete -> canDelete
 * - export -> canExcel, canPDF, canPrint
 */
export function useModulePermissions(moduleKey: keyof UserPermissions | string): ModulePermissionsResult {
  const user = getStoredUser();
  const rawPermissions = getStoredPermissions() || user?.permissions;

  return useMemo(() => {
    if (!rawPermissions) {
      return {
        canView: false,
        canAdd: false,
        canEdit: false,
        canDelete: false,
        canStatus: false,
        canExcel: false,
        canPDF: false,
        canPrint: false,
      };
    }

    let modActions: { view?: boolean; add?: boolean; edit?: boolean; delete?: boolean; export?: boolean } | null = null;

    // Handle Array format: [ { module: "admin", actions: { ... } } ] OR [ { admin: { ... } } ]
    if (Array.isArray(rawPermissions)) {
      for (const item of rawPermissions) {
        if (!item || typeof item !== "object") continue;
        if (item.module === moduleKey && item.actions) {
          modActions = item.actions;
          break;
        }
        if (item[moduleKey]) {
          modActions = item[moduleKey].actions || item[moduleKey];
          break;
        }
      }
    } else if (typeof rawPermissions === "object") {
      // Handle Object format: { admin: { view, add, ... }, ... }
      const direct = (rawPermissions as Record<string, any>)[moduleKey as string];
      if (direct && typeof direct === "object") {
        modActions = direct.actions || direct;
      }
    }

    if (!modActions) {
      return {
        canView: false,
        canAdd: false,
        canEdit: false,
        canDelete: false,
        canStatus: false,
        canExcel: false,
        canPDF: false,
        canPrint: false,
      };
    }

    const canView = Boolean(modActions.view);
    const canAdd = Boolean(modActions.add);
    const canEdit = Boolean(modActions.edit);
    const canDelete = Boolean(modActions.delete);
    const canExport = Boolean(modActions.export);
    const canStatus = canEdit;

    return {
      canView,
      canAdd,
      canEdit,
      canDelete,
      canStatus,
      canExcel: canExport,
      canPDF: canExport,
      canPrint: canExport,
    };
  }, [rawPermissions, moduleKey]);
}
