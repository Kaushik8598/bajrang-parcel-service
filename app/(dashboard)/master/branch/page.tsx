"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import StatusBadge from "@/components/DataTable/StatusBadge";
import DeleteConfirmDialog from "@/components/DataTable/DeleteConfirmDialog";
import BranchFormModal from "@/components/modals/BranchFormModal";
import { Button } from "@/components/ui/button";
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useUpdateUserStatus,
  useModulePermissions,
} from "@/lib/hooks";
import { showToast } from "@/lib/toast";
import type { ColumnDef } from "@/lib/types/common";
import type { BranchUser, BranchPayload } from "@/lib/api/branch";

export default function ManageBranchPage() {
  const permissions = useModulePermissions("branch");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  // ─── Modal State ─────────────────────────────────────────────────────────────
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedBranch, setSelectedBranch] = useState<BranchUser | null>(null);

  // ─── Loading States ──────────────────────────────────────────────────────────
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── Delete State ─────────────────────────────────────────────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<BranchUser | null>(null);

  const { data: response, isLoading } = useBranches({ page, limit, search });
  const createBranchMutation = useCreateBranch();
  const updateBranchMutation = useUpdateBranch();
  const statusMutation = useUpdateUserStatus();

  const isFormSubmitting = createBranchMutation.isPending || updateBranchMutation.isPending;

  const branchUsers: BranchUser[] = response?.data?.users || [];
  const paginationMeta = response?.pagination || {
    total: branchUsers.length,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────────
  const handleAdd = () => {
    setFormMode("add");
    setSelectedBranch(null);
    setFormModalOpen(true);
  };

  const handleEdit = (row: BranchUser) => {
    setFormMode("edit");
    setSelectedBranch(row);
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (payload: BranchPayload) => {
    if (formMode === "add") {
      createBranchMutation.mutate(payload, {
        onSuccess: (res) => {
          showToast(
            "success",
            res.message || `Branch "${payload.branchInfo.branchName}" created successfully.`
          );
          setFormModalOpen(false);
        },
        onError: (err) => {
          showToast("error", err.message || "Failed to create branch.");
        },
      });
    } else if (selectedBranch) {
      updateBranchMutation.mutate(
        { userId: selectedBranch._id, payload },
        {
          onSuccess: (res) => {
            showToast(
              "success",
              res.message || `Branch "${payload.branchInfo.branchName}" updated successfully.`
            );
            setFormModalOpen(false);
          },
          onError: (err) => {
            showToast("error", err.message || "Failed to update branch.");
          },
        }
      );
    }
  };

  const handleDeleteClick = (row: BranchUser) => {
    setBranchToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (branchToDelete) {
      setIsDeleting(true);
      statusMutation.mutate(
        { userId: branchToDelete._id, status: "suspended" },
        {
          onSuccess: (res) => {
            showToast(
              "success",
              res.message || `Branch "${branchToDelete.branchInfo?.branchName || branchToDelete.name}" deleted successfully.`
            );
            setDeleteDialogOpen(false);
            setBranchToDelete(null);
          },
          onError: (err) => {
            showToast("error", err.message || "Failed to delete branch.");
          },
          onSettled: () => {
            setIsDeleting(false);
          },
        }
      );
    }
  };

  const handleStatusToggle = (row: BranchUser) => {
    const nextStatus = row.status === "active" ? "inactive" : "active";
    setUpdatingStatusId(row._id);

    statusMutation.mutate(
      { userId: row._id, status: nextStatus },
      {
        onSuccess: (res) => {
          showToast(
            "success",
            res.message ||
            `Branch "${row.branchInfo?.branchName || row.name}" status updated to ${nextStatus === "active" ? "Active" : "Inactive"}`
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

  // ─── Columns ─────────────────────────────────────────────────────────────────
  const columns: ColumnDef<BranchUser>[] = [
    {
      key: "branch_name",
      label: "Branch Name",
      sortable: true,
      sortValue: (row) => row.branchInfo?.branchName || row.name || "",
      render: (_, row) => (
        <span className="font-semibold text-slate-900">
          {row.branchInfo?.branchName || row.name}
        </span>
      ),
    },
    {
      key: "branch_code",
      label: "Branch Code",
      sortable: true,
      width: "w-28",
      sortValue: (row) => row.branchInfo?.branchCode || "",
      render: (_, row) => (
        <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {row.branchInfo?.branchCode || "-"}
        </span>
      ),
    },
    {
      key: "email",
      label: "Email Id",
      sortable: true,
      sortValue: (row) => row.email || "",
    },
    {
      key: "mobile_no_1",
      label: "Mobile No1",
      sortable: true,
      width: "w-32",
      sortValue: (row) => row.branchInfo?.mobile1 || "",
      render: (_, row) => row.branchInfo?.mobile1 || "-",
    },
    {
      key: "mobile_no_2",
      label: "Mobile No2",
      sortable: true,
      width: "w-32",
      sortValue: (row) => row.branchInfo?.mobile2 || "",
      render: (_, row) => row.branchInfo?.mobile2 || "-",
    },
    {
      key: "city",
      label: "City",
      sortable: true,
      width: "w-28",
      sortValue: (row) => row.branchInfo?.city || "",
      render: (_, row) => row.branchInfo?.city || "-",
    },
    {
      key: "address",
      label: "Address",
      sortable: false,
      render: (_, row) => {
        const parts = [
          row.branchInfo?.address1,
          row.branchInfo?.address2,
          row.branchInfo?.city,
          row.branchInfo?.state,
          row.branchInfo?.pincode,
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : "-";
      },
    },
    {
      key: "status",
      label: "Status",
      width: "w-28",
      sortable: true,
      sortValue: (row) => (row.status === "active" ? 1 : 0),
      render: (val, row) => (
        <StatusBadge
          inactiveText="Inactive"
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
              disabled={isDeleting && branchToDelete?._id === row._id}
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
      <DataTable<BranchUser>
        title="Manage Branch"
        columns={columns}
        data={branchUsers}
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

      {/* Add / Edit Branch Form Modal */}
      <BranchFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        mode={formMode}
        editId={selectedBranch?._id}
        editData={selectedBranch}
        isLoading={isFormSubmitting}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Branch"
        itemName={branchToDelete?.branchInfo?.branchName || branchToDelete?.name}
        description={
          branchToDelete
            ? `Are you sure you want to remove branch "${branchToDelete.branchInfo?.branchName || branchToDelete.name}"? This action will suspend the account.`
            : undefined
        }
      />
    </>
  );
}
