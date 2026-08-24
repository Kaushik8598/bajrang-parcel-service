"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import StatusBadge from "@/components/DataTable/StatusBadge";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import type { ColumnDef, TablePermissions } from "@/lib/types/common";

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface Branch {
  id: number | string;
  branch_name: string;
  branch_code: string;
  email_id: string;
  mobile_no_1: string;
  mobile_no_2: string;
  city: string;
  address: string;
  is_active: boolean;
  [key: string]: unknown;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_BRANCHES: Branch[] = [
  {
    id: 1,
    branch_name: "Surat Main Branch",
    branch_code: "SUR-01",
    email_id: "surat@bajrang.com",
    mobile_no_1: "9876543201",
    mobile_no_2: "9876543202",
    city: "Surat",
    address: "Ring Road, Surat, Gujarat - 395002",
    is_active: true,
  },
  {
    id: 2,
    branch_name: "Ahmedabad Central Hub",
    branch_code: "AHM-01",
    email_id: "ahmedabad@bajrang.com",
    mobile_no_1: "9876543203",
    mobile_no_2: "9876543204",
    city: "Ahmedabad",
    address: "Narol Highway, Ahmedabad, Gujarat - 382405",
    is_active: true,
  },
  {
    id: 3,
    branch_name: "Vadodara Logistics Hub",
    branch_code: "BRD-01",
    email_id: "vadodara@bajrang.com",
    mobile_no_1: "9876543205",
    mobile_no_2: "9876543206",
    city: "Vadodara",
    address: "Makarpura GIDC, Vadodara, Gujarat - 390010",
    is_active: true,
  },
  {
    id: 4,
    branch_name: "Rajkot Transport Nagar",
    branch_code: "RJK-01",
    email_id: "rajkot@bajrang.com",
    mobile_no_1: "9876543207",
    mobile_no_2: "9876543208",
    city: "Rajkot",
    address: "Aji GIDC, Rajkot, Gujarat - 360003",
    is_active: false,
  },
  {
    id: 5,
    branch_name: "Bhavnagar Branch",
    branch_code: "BHV-01",
    email_id: "bhavnagar@bajrang.com",
    mobile_no_1: "9876543209",
    mobile_no_2: "9876543210",
    city: "Bhavnagar",
    address: "Chitra GIDC, Bhavnagar, Gujarat - 364004",
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

export default function ManageBranchPage() {
  const [data, setData] = useState<Branch[]>(MOCK_BRANCHES);

  const handleAdd = () => {
    showToast("info", "Add Branch clicked", "Branch creation form modal can be opened here.");
  };

  const handleEdit = (row: Branch) => {
    showToast("info", `Editing ${row.branch_name}`, `Branch code: ${row.branch_code}`);
  };

  const handleStatusToggle = (row: Branch) => {
    setData((prev) =>
      prev.map((b) =>
        b.id === row.id ? { ...b, is_active: !b.is_active } : b
      )
    );
    showToast(
      "success",
      `Branch "${row.branch_name}" status updated to ${!row.is_active ? "Active" : "Inactive"}`
    );
  };

  // ─── Columns (Sr No is rendered automatically by DataTable) ──────────────────
  const columns: ColumnDef<Branch>[] = [
    { key: "branch_name", label: "Branch Name", sortable: true },
    { key: "branch_code", label: "Branch Code", sortable: true, width: "w-28" },
    { key: "email_id", label: "Email Id", sortable: true },
    { key: "mobile_no_1", label: "Mobile No1", sortable: true, width: "w-32" },
    { key: "mobile_no_2", label: "Mobile No2", sortable: true, width: "w-32" },
    { key: "city", label: "City", sortable: true, width: "w-28" },
    { key: "address", label: "Address", sortable: false },
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
    <DataTable<Branch>
      title="Manage Branch"
      columns={columns}
      data={data}
      permissions={PERMISSIONS}
      onAdd={handleAdd}
      clientSide
    />
  );
}
