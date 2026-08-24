import { useMemo } from "react";
import { getStoredUser, getStoredPermissions } from "@/lib/api/auth";
import type { TablePermissions } from "@/lib/types/common";
import type { UserPermissions } from "@/lib/types/auth";

/**
 * Hook to strictly calculate module permissions directly from the login API response.
 * Only permissions explicitly granted (true) in the user's permissions object will be enabled.
 */
export function useModulePermissions(moduleKey: keyof UserPermissions | string): TablePermissions {
  const user = getStoredUser();
  const permissions = getStoredPermissions() || user?.permissions;

  return useMemo(() => {
    if (!permissions) {
      return {
        canAdd: false,
        canEdit: false,
        canDelete: false,
        canStatus: false,
        canExcel: false,
        canPDF: false,
        canPrint: false,
      };
    }

    const mod = permissions[moduleKey as keyof UserPermissions];

    if (!mod) {
      return {
        canAdd: false,
        canEdit: false,
        canDelete: false,
        canStatus: false,
        canExcel: false,
        canPDF: false,
        canPrint: false,
      };
    }

    const canAdd = Boolean(mod.add);
    const canEdit = Boolean(mod.edit);
    const canDelete = Boolean(mod.delete);
    const canExport = Boolean(mod.export);

    return {
      canAdd,
      canEdit,
      canDelete,
      canStatus: canEdit,
      canExcel: canExport,
      canPDF: canExport,
      canPrint: canExport,
    };
  }, [permissions, moduleKey]);
}
