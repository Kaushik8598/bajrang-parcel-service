"use client";

import React, { useState, useMemo } from "react";
import {
  Pencil,
  RotateCcw,
  Filter,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import DataTable from "@/components/DataTable/DataTable";
import StatusBadge from "@/components/DataTable/StatusBadge";
import { FormSelect } from "@/components/ui/form-select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import UserPermissionsModal from "@/components/modals/UserPermissionsModal";
import { useAllUsers, useUpdateUserStatus, useModulePermissions } from "@/lib/hooks";
import { showToast } from "@/lib/toast";
import { getInitials } from "@/lib/utils";
import type { User as UserType } from "@/lib/types/auth";
import type { ColumnDef } from "@/lib/types/common";

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "superAdmin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "branch", label: "Branch" },
  { value: "staff", label: "Staff" },
  { value: "driver", label: "Driver" },
  { value: "truck", label: "Truck" },
  { value: "customer", label: "Customer" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function PermissionsPage() {
  const queryClient = useQueryClient();
  const permissions = useModulePermissions("manageRights");
  const statusMutation = useUpdateUserStatus(["all-users-list"]);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Filters state
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination & search state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  // Modal state
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch users via GET /user/allUser
  const { data: apiResponse, isLoading, isFetching } = useAllUsers({
    page,
    limit,
    search,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  });

  // Extract user records from response
  const usersList: UserType[] = useMemo(() => {
    const rawData = apiResponse?.data;
    if (Array.isArray(rawData)) return rawData;
    if (rawData && typeof rawData === "object") {
      if (Array.isArray(rawData.users)) return rawData.users;
      if (Array.isArray(rawData.items)) return rawData.items;
      if (Array.isArray(rawData.data)) return rawData.data;
    }
    return [];
  }, [apiResponse]);

  const paginationMeta = apiResponse?.pagination || {
    total: usersList.length,
    page,
    limit,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const hasActiveFilters = Boolean(roleFilter || statusFilter || search);

  const handleResetFilter = () => {
    setRoleFilter("");
    setStatusFilter("");
    setSearch("");
    setPage(1);
  };

  const handleEditPermissions = (user: UserType) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleStatusToggle = (user: UserType) => {
    const userId = String(user._id || user.id || "");
    if (!userId) return;

    const nextStatus = user.status === "active" ? "inactive" : "active";
    setUpdatingStatusId(userId);

    statusMutation.mutate(
      { userId, status: nextStatus },
      {
        onSuccess: (res) => {
          showToast(
            "success",
            res.message ||
              `User "${user.name}" status updated to ${nextStatus === "active" ? "Active" : "Inactive"}`
          );
          queryClient.invalidateQueries({ queryKey: ["all-users-list"] });
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

  // Extract photo url
  const getPhotoUrl = (user: UserType): string => {
    if (typeof user.profilePhoto === "string") return user.profilePhoto;
    if (typeof user.profileImage === "string") return user.profileImage;
    if (typeof user.passportSizePhoto === "string") return user.passportSizePhoto;
    const photoObj = user.profilePhoto as { image?: string } | undefined;
    if (photoObj && typeof photoObj === "object" && "image" in photoObj) {
      return String(photoObj.image || "");
    }
    return "";
  };

  // ─── Table Columns ─────────────────────────────────────────────────────────
  const columns: ColumnDef<UserType>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      sortValue: (row) => row.name || "",
      render: (_, row) => {
        const photo = getPhotoUrl(row);
        return (
          <div className="flex items-center gap-2.5 py-0.5">
            <Avatar className="w-8 h-8 rounded-full border border-slate-200">
              <AvatarImage src={photo} alt={row.name} />
              <AvatarFallback className="bg-[#2980b9] text-white text-xs font-bold rounded-full">
                {getInitials(row.name)}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-slate-900">{row.name || "—"}</span>
          </div>
        );
      },
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      sortValue: (row) => row.email || "",
    },
    {
      key: "mobile",
      label: "Mobile",
      sortable: true,
      width: "w-36",
      sortValue: (row) => row.mobile || "",
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      width: "w-32",
      sortValue: (row) => row.role || "",
      render: (_, row) => (
        <span className="uppercase text-slate-800 font-medium">
          {row.role || "staff"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      width: "w-28",
      sortValue: (row) => (row.status === "active" ? 1 : 0),
      render: (_, row) => {
        const rowId = String(row._id || row.id || "");
        return (
          <StatusBadge
            status={row.status === "active"}
            canToggle={permissions.canStatus && updatingStatusId !== rowId}
            isLoading={updatingStatusId === rowId}
            onToggle={() => handleStatusToggle(row)}
          />
        );
      },
    },
    {
      key: "action",
      label: "Action",
      width: "w-28",
      render: (_, row) => (
        <Button
          type="button"
          size="sm"
          onClick={() => handleEditPermissions(row)}
          className="h-7 px-3 text-xs bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-xs transition-colors"
          title="Edit User Permissions"
        >
          <Pencil className="w-3 h-3 mr-1" />
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-3 pb-10">
      {/* ─── Filter Section ─── */}
      <div className="bg-white rounded-lg border border-slate-300 p-4 shadow-xs">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Filter className="w-3.5 h-3.5 text-[#2980b9]" />
              <span>Filter Users & Permissions</span>
            </div>

            {/* Reset link only shown in header when filters are active */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetFilter}
                  disabled={isLoading || isFetching}
                  className="group inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 underline underline-offset-4 cursor-pointer transition-colors disabled:opacity-50"
                  title="Clear all active filters"
                >
                  <RotateCcw className="w-3 h-3 text-rose-600 group-hover:text-rose-700 transition-colors" />
                  <span>Reset</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <FormSelect
              label="Role"
              placeholder="All Roles"
              options={ROLE_OPTIONS}
              value={roleFilter}
              onChange={(val) => {
                setRoleFilter(val || "");
                setPage(1);
              }}
              clearable
            />

            <FormSelect
              label="Status"
              placeholder="All Status"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val || "");
                setPage(1);
              }}
              clearable
            />
          </div>
        </div>
      </div>

      {/* ─── Data Table ─── */}
      <DataTable<UserType>
        title="Permissions & User Rights"
        columns={columns}
        data={usersList}
        isLoading={isLoading || isFetching}
        permissions={{
          ...permissions,
          canExcel: true,
          canPDF: true,
          canPrint: true,
          canAdd: false, // Permissions are granted on existing users
        }}
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

      {/* ─── User Permissions Edit Modal ─── */}
      {selectedUser && (
        <UserPermissionsModal
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) setSelectedUser(null);
          }}
          user={selectedUser}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["all-users-list"] });
          }}
        />
      )}
    </div>
  );
}
