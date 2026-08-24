"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import StatusBadge from "@/components/DataTable/StatusBadge";
import DeleteConfirmDialog from "@/components/DataTable/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { useAdmins, useUpdateUserStatus, useModulePermissions } from "@/lib/hooks";
import { showToast } from "@/lib/toast";
import type { ColumnDef } from "@/lib/types/common";
import type { AdminUser } from "@/lib/api/admin";

export default function ManageAdminPage() {
  const permissions = useModulePermissions("admin");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);

  const { data: response, isLoading } = useAdmins({ page, limit, search });
  const statusMutation = useUpdateUserStatus();

  const adminUsers: AdminUser[] = response?.data?.users || [];
  const paginationMeta = response?.pagination || {
    total: adminUsers.length,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const handleAdd = () => {
    showToast("info", "Add Admin clicked", "Admin creation form modal can be opened here.");
  };

  const handleEdit = (row: AdminUser) => {
    showToast("info", `Editing Admin: ${row.name}`, `Email: ${row.email}`);
  };

  const handleDeleteClick = (row: AdminUser) => {
    setAdminToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (adminToDelete) {
      statusMutation.mutate(
        { userId: adminToDelete._id, status: "suspended" },
        {
          onSuccess: (res) => {
            showToast("success", res.message || `Admin "${adminToDelete.name}" deleted successfully.`);
            setDeleteDialogOpen(false);
            setAdminToDelete(null);
          },
          onError: (err) => {
            showToast("error", err.message || "Failed to delete admin.");
          },
        }
      );
    }
  };

  const handleStatusToggle = (row: AdminUser) => {
    const nextStatus = row.status === "active" ? "inactive" : "active";
    statusMutation.mutate(
      { userId: row._id, status: nextStatus },
      {
        onSuccess: (res) => {
          showToast(
            "success",
            res.message ||
              `Admin "${row.name}" status updated to ${nextStatus === "active" ? "Active" : "Inactive"}`
          );
        },
        onError: (err) => {
          showToast("error", err.message || "Failed to update status.");
        },
      }
    );
  };

  // ─── Column definitions ──────────────────────────────────────────────────────
  const columns: ColumnDef<AdminUser>[] = [
    { key: "name", label: "Admin Name", sortable: true },
    { key: "email", label: "Email Id", sortable: true },
    { key: "mobile", label: "Mobile No", sortable: true, width: "w-36" },
    {
      key: "status",
      label: "Status",
      width: "w-28",
      render: (val, row) => (
        <StatusBadge
          status={row.status === "active"}
          canToggle={permissions.canStatus && !statusMutation.isPending}
          onToggle={() => handleStatusToggle(row)}
        />
      ),
    },
    {
      key: "action",
      label: "Action",
      width: "w-44",
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          {permissions.canEdit && (
            <Button
              type="button"
              size="sm"
              onClick={() => handleEdit(row)}
              className="h-7 px-2.5 text-xs bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-xs transition-colors"
            >
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </Button>
          )}
          {permissions.canDelete && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={statusMutation.isPending}
              onClick={() => handleDeleteClick(row)}
              className="h-7 px-2.5 text-xs bg-[#e74c3c] hover:bg-[#c0392b] text-white shadow-xs transition-colors"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable<AdminUser>
        title="Manage Admin"
        columns={columns}
        data={adminUsers}
        isLoading={isLoading}
        permissions={permissions}
        onAdd={handleAdd}
        pagination={{
          page,
          pageSize: limit,
          total: paginationMeta.total,
          onPageChange: (newPage) => setPage(newPage),
          onPageSizeChange: (newLimit) => {
            setLimit(newLimit);
            setPage(1);
          },
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Admin"
        itemName={adminToDelete?.name}
        description={
          adminToDelete
            ? `Are you sure you want to remove admin "${adminToDelete.name}"? This action will suspend the account.`
            : undefined
        }
      />
    </>
  );
}
