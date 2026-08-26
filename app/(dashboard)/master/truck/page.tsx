"use client";

import { useState } from "react";
import { Pencil, Trash2, Truck as TruckIcon } from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import StatusBadge from "@/components/DataTable/StatusBadge";
import DeleteConfirmDialog from "@/components/DataTable/DeleteConfirmDialog";
import TruckFormModal from "@/components/modals/TruckFormModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { getInitials } from "@/lib/utils";
import {
  useTrucks,
  useCreateTruck,
  useUpdateTruck,
  useUpdateUserStatus,
  useModulePermissions,
} from "@/lib/hooks";
import type { TruckUser, TruckPayload } from "@/lib/api/truck";
import type { ColumnDef } from "@/lib/types/common";

export default function ManageTruckPage() {
  const permissions = useModulePermissions("truck");

  // Table pagination & search state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  // Data fetching hook
  const { data: apiResponse, isLoading } = useTrucks({ page, limit, search });

  // Mutations
  const createTruckMutation = useCreateTruck();
  const updateTruckMutation = useUpdateTruck();
  const statusMutation = useUpdateUserStatus();

  const isFormSubmitting = createTruckMutation.isPending || updateTruckMutation.isPending;

  // Extract truck users and pagination metadata
  const truckUsers: TruckUser[] = apiResponse?.data?.users || [];
  const paginationMeta = apiResponse?.pagination || {
    total: truckUsers.length,
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
  const [selectedTruck, setSelectedTruck] = useState<TruckUser | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [truckToDelete, setTruckToDelete] = useState<TruckUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle Add Truck
  const handleAdd = () => {
    setFormMode("add");
    setSelectedTruck(null);
    setFormModalOpen(true);
  };

  // Handle Edit Truck
  const handleEdit = (row: TruckUser) => {
    setFormMode("edit");
    setSelectedTruck(row);
    setFormModalOpen(true);
  };

  // Handle Form Submit (Add / Edit)
  const handleFormSubmit = async (payload: TruckPayload) => {
    if (formMode === "add") {
      createTruckMutation.mutate(payload, {
        onSuccess: (res) => {
          showToast(
            "success",
            res.message || `Truck "${payload.truckInfo?.truckNumber || payload.name}" registered successfully.`
          );
          setFormModalOpen(false);
        },
        onError: (err) => {
          showToast("error", err.message || "Failed to register truck.");
        },
      });
    } else if (selectedTruck) {
      updateTruckMutation.mutate(
        { userId: selectedTruck._id, payload },
        {
          onSuccess: (res) => {
            showToast(
              "success",
              res.message || `Truck "${payload.truckInfo?.truckNumber || payload.name}" updated successfully.`
            );
            setFormModalOpen(false);
          },
          onError: (err) => {
            showToast("error", err.message || "Failed to update truck.");
          },
        }
      );
    }
  };

  // Handle Status Toggle (active <-> inactive)
  const handleStatusToggle = (row: TruckUser) => {
    const nextStatus = row.status === "active" ? "inactive" : "active";
    setUpdatingStatusId(row._id);

    statusMutation.mutate(
      { userId: row._id, status: nextStatus },
      {
        onSuccess: (res) => {
          showToast(
            "success",
            res.message ||
            `Truck "${row.truckInfo?.truckNumber || row.name}" status updated to ${nextStatus === "active" ? "Active" : "Inactive"}`
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
  const handleDeleteClick = (row: TruckUser) => {
    setTruckToDelete(row);
    setDeleteDialogOpen(true);
  };

  // Confirm Delete (Suspends user)
  const handleConfirmDelete = () => {
    if (!truckToDelete) return;
    setIsDeleting(true);

    statusMutation.mutate(
      { userId: truckToDelete._id, status: "suspended" },
      {
        onSuccess: (res) => {
          showToast(
            "success",
            res.message || `Truck "${truckToDelete.truckInfo?.truckNumber || truckToDelete.name}" deleted successfully.`
          );
          setDeleteDialogOpen(false);
          setTruckToDelete(null);
        },
        onError: (err) => {
          showToast("error", err.message || "Failed to delete truck.");
        },
        onSettled: () => {
          setIsDeleting(false);
        },
      }
    );
  };

  // ─── Table Columns ─────────────────────────────────────────────────────────
  const columns: ColumnDef<TruckUser>[] = [
    {
      key: "truckImage",
      label: "Photo",
      sortable: false,
      width: "w-16",
      render: (_, row) => {
        const image = row.truckInfo?.truckImage;
        const displayName = row.truckInfo?.truckNumber || row.name;
        return (
          <Avatar className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50">
            <AvatarImage src={image} alt={displayName} />
            <AvatarFallback className="bg-[#2980b9] text-white text-xs font-bold rounded-full">
              {getInitials(displayName) || <TruckIcon className="w-3.5 h-3.5" />}
            </AvatarFallback>
          </Avatar>
        );
      },
    },
    {
      key: "truck_number",
      label: "Truck Number",
      sortable: true,
      width: "w-36",
      sortValue: (row) => row.truckInfo?.truckNumber || row.name || "",
      render: (_, row) => {
        const num = row.truckInfo?.truckNumber || row.name;
        return (
          <span className="font-mono text-xs font-semibold text-slate-900">
            {num || "-"}
          </span>
        );
      },

    },
    {
      key: "owner_name",
      label: "Owner Name",
      sortable: true,
      sortValue: (row) => row.truckInfo?.ownerDetail?.name || row.name || "",
      render: (_, row) => (
        <span className="font-semibold text-slate-900">
          {row.truckInfo?.ownerDetail?.name || row.name}
        </span>
      ),
    },
    {
      key: "driver_name",
      label: "Assigned Driver",
      sortable: true,
      sortValue: (row) => {
        const d = row.truckInfo?.driverId;
        return typeof d === "object" && d ? d.name || "" : "";
      },
      render: (_, row) => {
        const d = row.truckInfo?.driverId;
        return typeof d === "object" && d ? d.name || "-" : "-";
      },
    },
    {
      key: "driver_mobile",
      label: "Driver Mobile",
      sortable: true,
      width: "w-32",
      sortValue: (row) => {
        const d = row.truckInfo?.driverId;
        return typeof d === "object" && d ? d.mobile || "" : "";
      },
      render: (_, row) => {
        const d = row.truckInfo?.driverId;
        return typeof d === "object" && d ? d.mobile || "-" : "-";
      },
    },
    {
      key: "capacity",
      label: "Capacity",
      sortable: true,
      width: "w-28",
      sortValue: (row) => row.truckInfo?.capacity || 0,
      render: (_, row) => {
        const cap = row.truckInfo?.capacity;
        return (
          <span className="text-sm text-slate-800 font-medium">
            {cap !== undefined && cap !== null ? `${cap} kg` : "-"}
          </span>
        );
      },
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
              disabled={isDeleting && truckToDelete?._id === row._id}
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
      <DataTable<TruckUser>
        title="Manage Truck"
        columns={columns}
        data={truckUsers}
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

      {/* Add / Edit Truck Modal */}
      <TruckFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        mode={formMode}
        editId={selectedTruck?._id}
        editData={selectedTruck}
        isLoading={isFormSubmitting}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Truck"
        itemName={truckToDelete?.truckInfo?.truckNumber || truckToDelete?.name}
        description={
          truckToDelete
            ? `Are you sure you want to delete truck "${truckToDelete.truckInfo?.truckNumber || truckToDelete.name}"? This action will suspend the account.`
            : undefined
        }
      />
    </>
  );
}
