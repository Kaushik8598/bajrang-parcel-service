"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import StatusBadge from "@/components/DataTable/StatusBadge";
import DeleteConfirmDialog from "@/components/DataTable/DeleteConfirmDialog";
import StaffFormModal from "@/components/modals/StaffFormModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { getInitials } from "@/lib/utils";
import {
  useStaffList,
  useCreateStaff,
  useUpdateStaff,
  useUpdateUserStatus,
  useModulePermissions,
} from "@/lib/hooks";
import type { StaffUser, StaffPayload } from "@/lib/api/staff";
import type { ColumnDef } from "@/lib/types/common";

export default function ManageStaffPage() {
  const permissions = useModulePermissions("staff");

  // Table pagination & search state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  // Data fetching hook
  const { data: apiResponse, isLoading } = useStaffList({ page, limit, search });

  // Mutations
  const createStaffMutation = useCreateStaff();
  const updateStaffMutation = useUpdateStaff();
  const statusMutation = useUpdateUserStatus();

  const isFormSubmitting = createStaffMutation.isPending || updateStaffMutation.isPending;

  // Extract staff users and pagination metadata
  const staffUsers: StaffUser[] = apiResponse?.data?.users || [];
  const paginationMeta = apiResponse?.pagination || {
    total: staffUsers.length,
    page,
    limit,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Form Modal state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle Add Staff
  const handleAdd = () => {
    setFormMode("add");
    setSelectedStaff(null);
    setFormModalOpen(true);
  };

  // Handle Edit Staff
  const handleEdit = (row: StaffUser) => {
    setFormMode("edit");
    setSelectedStaff(row);
    setFormModalOpen(true);
  };

  // Handle Form Submit (Add / Edit)
  const handleFormSubmit = async (payload: StaffPayload) => {
    if (formMode === "add") {
      createStaffMutation.mutate(payload, {
        onSuccess: (res) => {
          showToast(
            "success",
            res.message || `Staff "${payload.name}" created successfully.`
          );
          setFormModalOpen(false);
        },
        onError: (err) => {
          showToast("error", err.message || "Failed to create staff.");
        },
      });
    } else if (selectedStaff) {
      updateStaffMutation.mutate(
        { userId: selectedStaff._id, payload },
        {
          onSuccess: (res) => {
            showToast(
              "success",
              res.message || `Staff "${payload.name}" updated successfully.`
            );
            setFormModalOpen(false);
          },
          onError: (err) => {
            showToast("error", err.message || "Failed to update staff.");
          },
        }
      );
    }
  };

  // Handle Status Toggle (active <-> inactive)
  const handleStatusToggle = (row: StaffUser) => {
    const nextStatus = row.status === "active" ? "inactive" : "active";
    setUpdatingStatusId(row._id);

    statusMutation.mutate(
      { userId: row._id, status: nextStatus },
      {
        onSuccess: (res) => {
          showToast(
            "success",
            res.message ||
            `Staff "${row.name}" status updated to ${nextStatus === "active" ? "Active" : "Inactive"}`
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

  // Handle Delete Click
  const handleDeleteClick = (row: StaffUser) => {
    setStaffToDelete(row);
    setDeleteDialogOpen(true);
  };

  // Confirm Delete (Suspends user)
  const handleConfirmDelete = () => {
    if (!staffToDelete) return;
    setIsDeleting(true);

    statusMutation.mutate(
      { userId: staffToDelete._id, status: "suspended" },
      {
        onSuccess: (res) => {
          showToast(
            "success",
            res.message || `Staff "${staffToDelete.name}" deleted successfully.`
          );
          setDeleteDialogOpen(false);
          setStaffToDelete(null);
        },
        onError: (err) => {
          showToast("error", err.message || "Failed to delete staff.");
        },
        onSettled: () => {
          setIsDeleting(false);
        },
      }
    );
  };

  // Extract photo url
  const getPhotoUrl = (user: StaffUser): string => {
    if (typeof user.profilePhoto === "string") return user.profilePhoto;
    if (user.profilePhoto && typeof user.profilePhoto === "object" && "image" in user.profilePhoto) {
      return String(user.profilePhoto.image || "");
    }
    return "";
  };

  // ─── Table Columns ─────────────────────────────────────────────────────────
  const columns: ColumnDef<StaffUser>[] = [
    {
      key: "profilePhoto",
      label: "Photo",
      sortable: false,
      width: "w-16",
      render: (_, row) => {
        const photo = getPhotoUrl(row);
        return (
          <Avatar className="w-8 h-8 rounded-full border border-slate-200">
            <AvatarImage src={photo} alt={row.name} />
            <AvatarFallback className="bg-[#2980b9] text-white text-xs font-bold rounded-full">
              {getInitials(row.name)}
            </AvatarFallback>
          </Avatar>
        );
      },
    },
    {
      key: "name",
      label: "Staff Name",
      sortable: true,
      sortValue: (row) => row.name || "",
      render: (_, row) => <span className="font-semibold text-slate-900">{row.name}</span>,
    },
    {
      key: "branch_name",
      label: "Branch Name",
      sortable: true,
      sortValue: (row) => {
        const b = row.staffProfile?.branchId;
        if (typeof b === "object" && b) {
          return b.branchInfo?.branchName || b.name || "";
        }
        return "";
      },
      render: (_, row) => {
        const b = row.staffProfile?.branchId;
        if (typeof b === "object" && b) {
          return b.branchInfo?.branchName || b.name || "-";
        }
        return "-";
      },
    },
    {
      key: "branch_code",
      label: "Branch Code",
      sortable: true,
      width: "w-28",
      sortValue: (row) => {
        const b = row.staffProfile?.branchId;
        if (typeof b === "object" && b) {
          return b.branchInfo?.branchCode || "";
        }
        return "";
      },
      render: (_, row) => {
        const b = row.staffProfile?.branchId;
        const code = typeof b === "object" && b ? b.branchInfo?.branchCode : null;
        return (
          <span className="font-mono text-xs font-semibold text-slate-900">
            {code || "-"}
          </span>
        );
      },

    },
    {
      key: "email",
      label: "Email Id",
      sortable: true,
      sortValue: (row) => row.email || "",
    },
    {
      key: "mobile",
      label: "Mobile No",
      sortable: true,
      width: "w-32",
      sortValue: (row) => row.mobile || "",
    },
    {
      key: "status",
      label: "Status",
      width: "w-28",
      sortable: true,
      sortValue: (row) => (row.status === "active" ? 1 : 0),
      render: (_, row) => (
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
      width: "w-40",
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
              disabled={isDeleting && staffToDelete?._id === row._id}
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
      <DataTable<StaffUser>
        title="Manage Staff"
        columns={columns}
        data={staffUsers}
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

      {/* Add / Edit Staff Modal */}
      <StaffFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        mode={formMode}
        editId={selectedStaff?._id}
        editData={selectedStaff}
        isLoading={isFormSubmitting}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Staff"
        itemName={staffToDelete?.name}
        description={
          staffToDelete
            ? `Are you sure you want to remove staff member "${staffToDelete.name}"? This action will suspend the account.`
            : undefined
        }
      />
    </>
  );
}
