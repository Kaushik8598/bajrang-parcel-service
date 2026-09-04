"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import StatusBadge from "@/components/DataTable/StatusBadge";
import DeleteConfirmDialog from "@/components/DataTable/DeleteConfirmDialog";
import AdminFormModal, { type AdminFormValues } from "@/components/modals/AdminFormModal";
import { Button } from "@/components/ui/button";
import {
  useAdmins,
  useCreateAdmin,
  useUpdateAdmin,
  useUpdateUserStatus,
  useModulePermissions,
  ADMINS_QUERY_KEY,
} from "@/lib/hooks";
import { showToast } from "@/lib/toast";
import type { ColumnDef } from "@/lib/types/common";
import type { AdminUser, AdminPayload } from "@/lib/api/admin";

export default function ManageAdminPage() {
  const permissions = useModulePermissions("admin");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  // ─── Modal State ─────────────────────────────────────────────────────────────
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);

  // ─── Loading States ──────────────────────────────────────────────────────────
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── Delete State ─────────────────────────────────────────────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);

  const { data: response, isLoading } = useAdmins({ page, limit, search });
  const createAdminMutation = useCreateAdmin();
  const updateAdminMutation = useUpdateAdmin();
  const statusMutation = useUpdateUserStatus(ADMINS_QUERY_KEY);

  const isFormSubmitting = createAdminMutation.isPending || updateAdminMutation.isPending;

  const adminUsers: AdminUser[] = response?.data?.users || [];
  const paginationMeta = response?.pagination || {
    total: adminUsers.length,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // ─── Add Handler ──────────────────────────────────────────────────────────────
  const handleAdd = () => {
    setFormMode("add");
    setSelectedAdmin(null);
    setFormModalOpen(true);
  };

  // ─── Edit Handler ─────────────────────────────────────────────────────────────
  const handleEdit = (row: AdminUser) => {
    setFormMode("edit");
    setSelectedAdmin(row);
    setFormModalOpen(true);
  };

  // ─── Form Submit Handler ──────────────────────────────────────────────────────
  const handleFormSubmit = async (values: AdminFormValues) => {
    const payload: AdminPayload = {
      name: values.name.trim(),
      email: values.email.trim(),
      mobile: values.mobile.trim(),
      status: values.status,
    };

    if (values.password) {
      payload.password = values.password;
    }

    if (formMode === "add") {
      createAdminMutation.mutate(payload, {
        onSuccess: (res) => {
          showToast(
            "success",
            res.message || `Admin "${values.name}" created successfully.`
          );
          setFormModalOpen(false);
        },
        onError: (err) => {
          showToast("error", err.message || "Failed to create admin.");
        },
      });
    } else if (selectedAdmin) {
      updateAdminMutation.mutate(
        { userId: selectedAdmin._id, payload },
        {
          onSuccess: (res) => {
            showToast(
              "success",
              res.message || `Admin "${values.name}" updated successfully.`
            );
            setFormModalOpen(false);
          },
          onError: (err) => {
            showToast("error", err.message || "Failed to update admin.");
          },
        }
      );
    }
  };

  // ─── Delete Handlers ──────────────────────────────────────────────────────────
  const handleDeleteClick = (row: AdminUser) => {
    setAdminToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (adminToDelete) {
      setIsDeleting(true);
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
          onSettled: () => {
            setIsDeleting(false);
          },
        }
      );
    }
  };

  // ─── Status Toggle Handler ────────────────────────────────────────────────────
  const handleStatusToggle = (row: AdminUser) => {
    const nextStatus = row.status === "active" ? "inactive" : "active";
    setUpdatingStatusId(row._id);

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
        onSettled: () => {
          setUpdatingStatusId(null);
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
          canToggle={permissions.canStatus && updatingStatusId !== row._id}
          isLoading={updatingStatusId === row._id}
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
              disabled={isDeleting && adminToDelete?._id === row._id}
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
        onSearch={(query) => {
          setSearch(query);
          setPage(1);
        }}
        searchValue={search}
        clientSide={false}
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

      {/* Add / Edit Admin Modal */}
      <AdminFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        mode={formMode}
        editData={selectedAdmin}
        isLoading={isFormSubmitting}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
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
