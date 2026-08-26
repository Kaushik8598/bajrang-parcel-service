"use client";

import { useState } from "react";
import { Pencil, Trash2, User } from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import StatusBadge from "@/components/DataTable/StatusBadge";
import DeleteConfirmDialog from "@/components/DataTable/DeleteConfirmDialog";
import DriverFormModal from "@/components/modals/DriverFormModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { getInitials } from "@/lib/utils";
import {
  useDrivers,
  useCreateDriver,
  useUpdateDriver,
  useUpdateUserStatus,
  useModulePermissions,
} from "@/lib/hooks";
import type { DriverUser, DriverPayload } from "@/lib/api/driver";
import type { ColumnDef } from "@/lib/types/common";

export default function ManageDriverPage() {
  const permissions = useModulePermissions("driver");

  // Table pagination & search state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  // Data fetching hook
  const { data: apiResponse, isLoading } = useDrivers({ page, limit, search });

  // Mutations
  const createDriverMutation = useCreateDriver();
  const updateDriverMutation = useUpdateDriver();
  const statusMutation = useUpdateUserStatus();

  const isFormSubmitting = createDriverMutation.isPending || updateDriverMutation.isPending;

  // Extract driver users and pagination metadata
  const driverUsers: DriverUser[] = apiResponse?.data?.users || [];
  const paginationMeta = apiResponse?.pagination || {
    total: driverUsers.length,
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
  const [selectedDriver, setSelectedDriver] = useState<DriverUser | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<DriverUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle Add Driver
  const handleAdd = () => {
    setFormMode("add");
    setSelectedDriver(null);
    setFormModalOpen(true);
  };

  // Handle Edit Driver
  const handleEdit = (row: DriverUser) => {
    setFormMode("edit");
    setSelectedDriver(row);
    setFormModalOpen(true);
  };

  // Handle Form Submit (Add / Edit)
  const handleFormSubmit = async (payload: DriverPayload) => {
    if (formMode === "add") {
      createDriverMutation.mutate(payload, {
        onSuccess: (res) => {
          showToast(
            "success",
            res.message || `Driver "${payload.name}" registered successfully.`
          );
          setFormModalOpen(false);
        },
        onError: (err) => {
          showToast("error", err.message || "Failed to register driver.");
        },
      });
    } else if (selectedDriver) {
      updateDriverMutation.mutate(
        { userId: selectedDriver._id, payload },
        {
          onSuccess: (res) => {
            showToast(
              "success",
              res.message || `Driver "${payload.name}" updated successfully.`
            );
            setFormModalOpen(false);
          },
          onError: (err) => {
            showToast("error", err.message || "Failed to update driver.");
          },
        }
      );
    }
  };

  // Handle Status Toggle (active <-> inactive)
  const handleStatusToggle = (row: DriverUser) => {
    const nextStatus = row.status === "active" ? "inactive" : "active";
    setUpdatingStatusId(row._id);

    statusMutation.mutate(
      { userId: row._id, status: nextStatus },
      {
        onSuccess: (res) => {
          showToast(
            "success",
            res.message ||
            `Driver "${row.name}" status updated to ${nextStatus === "active" ? "Active" : "Inactive"}`
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
  const handleDeleteClick = (row: DriverUser) => {
    setDriverToDelete(row);
    setDeleteDialogOpen(true);
  };

  // Confirm Delete (Suspends user)
  const handleConfirmDelete = () => {
    if (!driverToDelete) return;
    setIsDeleting(true);

    statusMutation.mutate(
      { userId: driverToDelete._id, status: "suspended" },
      {
        onSuccess: (res) => {
          showToast(
            "success",
            res.message || `Driver "${driverToDelete.name}" deleted successfully.`
          );
          setDeleteDialogOpen(false);
          setDriverToDelete(null);
        },
        onError: (err) => {
          showToast("error", err.message || "Failed to delete driver.");
        },
        onSettled: () => {
          setIsDeleting(false);
        },
      }
    );
  };

  // Extract photo url
  const getPhotoUrl = (user: DriverUser): string => {
    if (typeof user.profilePhoto === "string") return user.profilePhoto;
    if (user.profilePhoto && typeof user.profilePhoto === "object" && "image" in user.profilePhoto) {
      return String(user.profilePhoto.image || "");
    }
    return "";
  };

  // ─── Table Columns ─────────────────────────────────────────────────────────
  const columns: ColumnDef<DriverUser>[] = [
    {
      key: "name",
      label: "Driver Name",
      sortable: true,
      sortValue: (row) => row.name || "",
      render: (_, row) => {
        const photo = getPhotoUrl(row);
        return (
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50">
              <AvatarImage src={photo} alt={row.name} />
              <AvatarFallback className="bg-[#2980b9] text-white text-xs font-bold rounded-full">
                {getInitials(row.name) || <User className="w-3.5 h-3.5" />}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-slate-900">{row.name}</span>
          </div>
        );
      },
    },
    {
      key: "mobile",
      label: "Mobile No",
      sortable: true,
      width: "w-32",
      sortValue: (row) => row.mobile || "",
    },
    {
      key: "mobile2",
      label: "Alternate Mobile",
      sortable: true,
      width: "w-36",
      sortValue: (row) => row.driverInfo?.mobile2 || "",
      render: (_, row) => (
        <span className="text-slate-700">{row.driverInfo?.mobile2 || "-"}</span>
      ),
    },
    {
      key: "city",
      label: "City",
      sortable: true,
      width: "w-28",
      sortValue: (row) => row.driverInfo?.city || "",
      render: (_, row) => (
        <span className="font-medium text-slate-800">{row.driverInfo?.city || "-"}</span>
      ),
    },
    {
      key: "driving_license",
      label: "Driving License",
      sortable: true,
      width: "w-36",
      sortValue: (row) => row.driverInfo?.drivingLicense?.number || "",
      render: (_, row) => {
        const dl = row.driverInfo?.drivingLicense?.number;
        return (
          <span className="font-mono text-sm font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
            {dl || "-"}
          </span>
        );
      },
    },
    {
      key: "address",
      label: "Address",
      sortable: false,
      render: (_, row) => (
        <span className="text-slate-600 line-clamp-1">
          {row.driverInfo?.address || "-"}
        </span>
      ),
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
              disabled={isDeleting && driverToDelete?._id === row._id}
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
      <DataTable<DriverUser>
        title="Manage Driver"
        columns={columns}
        data={driverUsers}
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

      {/* Add / Edit Driver Modal */}
      <DriverFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        mode={formMode}
        editId={selectedDriver?._id}
        editData={selectedDriver}
        isLoading={isFormSubmitting}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Driver"
        itemName={driverToDelete?.name}
        description={
          driverToDelete
            ? `Are you sure you want to delete driver "${driverToDelete.name}"? This action will suspend the account.`
            : undefined
        }
      />
    </>
  );
}
