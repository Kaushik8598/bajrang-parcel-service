"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import StatusBadge from "@/components/DataTable/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { getInitials } from "@/lib/utils";
import type { ColumnDef, TablePermissions } from "@/lib/types/common";

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface BranchUser {
  id: number | string;
  profile_image: string;
  user_name: string;
  branch_name: string;
  role_name: string;
  email_id: string;
  mobile_no: string;
  is_active: boolean;
  [key: string]: unknown;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_BRANCH_USERS: BranchUser[] = [
  {
    id: 1,
    profile_image: "",
    user_name: "Rahul Sharma",
    branch_name: "Surat Main Branch",
    role_name: "Branch Manager",
    email_id: "rahul.surat@bajrang.com",
    mobile_no: "9876500001",
    is_active: true,
  },
  {
    id: 2,
    profile_image: "",
    user_name: "Hitesh Vaghela",
    branch_name: "Ahmedabad Central Hub",
    role_name: "Booking Operator",
    email_id: "hitesh.ahm@bajrang.com",
    mobile_no: "9876500002",
    is_active: true,
  },
  {
    id: 3,
    profile_image: "",
    user_name: "Manoj Rathod",
    branch_name: "Vadodara Logistics Hub",
    role_name: "Delivery Staff",
    email_id: "manoj.brd@bajrang.com",
    mobile_no: "9876500003",
    is_active: true,
  },
  {
    id: 4,
    profile_image: "",
    user_name: "Vijay Makwana",
    branch_name: "Rajkot Transport Nagar",
    role_name: "Branch User",
    email_id: "vijay.rjk@bajrang.com",
    mobile_no: "9876500004",
    is_active: false,
  },
  {
    id: 5,
    profile_image: "",
    user_name: "Pravin Chavda",
    branch_name: "Bhavnagar Branch",
    role_name: "Accountant",
    email_id: "pravin.bhv@bajrang.com",
    mobile_no: "9876500005",
    is_active: true,
  },
];

// ─── Table Permissions ─────────────────────────────────────────────────────────
const PERMISSIONS: TablePermissions = {
  canExcel: true,
  canPDF: true,
  canPrint: true,
  canAdd: true,
  canEdit: true,
  canDelete: false,
  canStatus: true,
};

export default function ManageBranchUserPage() {
  const [data, setData] = useState<BranchUser[]>(MOCK_BRANCH_USERS);

  const handleAdd = () => {
    showToast("info", "Add Branch User clicked", "Branch user creation form modal can be opened here.");
  };

  const handleEdit = (row: BranchUser) => {
    showToast("info", `Editing User: ${row.user_name}`, `Branch: ${row.branch_name}`);
  };

  const handleStatusToggle = (row: BranchUser) => {
    setData((prev) =>
      prev.map((u) =>
        u.id === row.id ? { ...u, is_active: !u.is_active } : u
      )
    );
    showToast(
      "success",
      `User "${row.user_name}" status updated to ${!row.is_active ? "Active" : "Inactive"}`
    );
  };

  // ─── Columns ─────────────────────────────────────────────────────────────────
  const columns: ColumnDef<BranchUser>[] = [
    {
      key: "profile_image",
      label: "Profile Image",
      sortable: false,
      width: "w-24",
      render: (_, row) => (
        <Avatar className="w-8 h-8 rounded border border-slate-200">
          <AvatarImage src={row.profile_image} alt={row.user_name} />
          <AvatarFallback className="bg-[#2980b9] text-white text-[11px] font-bold rounded">
            {getInitials(row.user_name)}
          </AvatarFallback>
        </Avatar>
      ),
    },
    { key: "user_name", label: "User Name", sortable: true },
    { key: "branch_name", label: "Branch Name", sortable: true },
    {
      key: "role_name",
      label: "Role Name",
      sortable: true,
      render: (val) => (
        <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-800 rounded border border-slate-200">
          {String(val || "Staff")}
        </span>
      ),
    },
    { key: "email_id", label: "Email Id", sortable: true },
    { key: "mobile_no", label: "Mobile No", sortable: true, width: "w-32" },
    {
      key: "is_active",
      label: "Status",
      width: "w-28",
      render: (val, row) => (
        <StatusBadge
          status={row.is_active}
          canToggle={PERMISSIONS.canStatus}
          onToggle={() => handleStatusToggle(row)}
        />
      ),
    },
    {
      key: "action",
      label: "Action",
      width: "w-28",
      render: (_, row) => (
        <div className="flex items-center">
          {PERMISSIONS.canEdit && (
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
        </div>
      ),
    },
  ];

  return (
    <DataTable<BranchUser>
      title="Manage Branch User"
      columns={columns}
      data={data}
      permissions={PERMISSIONS}
      onAdd={handleAdd}
      clientSide
    />
  );
}
