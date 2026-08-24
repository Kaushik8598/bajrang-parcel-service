"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import StatusBadge from "@/components/DataTable/StatusBadge";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import type { ColumnDef, TablePermissions } from "@/lib/types/common";

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface Truck {
  id: number | string;
  truck_model_name: string;
  truck_no: string;
  is_active: boolean;
  [key: string]: unknown;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_TRUCKS: Truck[] = [
  {
    id: 1,
    truck_model_name: "Tata 407 LPT Heavy",
    truck_no: "GJ-05-BX-1024",
    is_active: true,
  },
  {
    id: 2,
    truck_model_name: "Eicher Pro 2049",
    truck_no: "GJ-01-CZ-3389",
    is_active: true,
  },
  {
    id: 3,
    truck_model_name: "Ashok Leyland Dost+",
    truck_no: "GJ-06-AK-7721",
    is_active: true,
  },
  {
    id: 4,
    truck_model_name: "Mahindra Bolero Maxi Truck",
    truck_no: "GJ-03-ER-4490",
    is_active: false,
  },
  {
    id: 5,
    truck_model_name: "BharatBenz 1217R",
    truck_no: "GJ-10-DF-9912",
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

export default function ManageTruckPage() {
  const [data, setData] = useState<Truck[]>(MOCK_TRUCKS);

  const handleAdd = () => {
    showToast("info", "Add Truck clicked", "Truck registration form modal can be opened here.");
  };

  const handleEdit = (row: Truck) => {
    showToast("info", `Editing Truck: ${row.truck_no}`, `Model: ${row.truck_model_name}`);
  };

  const handleStatusToggle = (row: Truck) => {
    setData((prev) =>
      prev.map((t) =>
        t.id === row.id ? { ...t, is_active: !t.is_active } : t
      )
    );
    showToast(
      "success",
      `Truck "${row.truck_no}" status updated to ${!row.is_active ? "Active" : "Inactive"}`
    );
  };

  // ─── Columns ─────────────────────────────────────────────────────────────────
  const columns: ColumnDef<Truck>[] = [
    { key: "truck_model_name", label: "Truck Model Name", sortable: true },
    {
      key: "truck_no",
      label: "Truck No",
      sortable: true,
      render: (val) => (
        <span className="font-semibold tracking-wide text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {String(val)}
        </span>
      ),
    },
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
    <DataTable<Truck>
      title="Manage Truck"
      columns={columns}
      data={data}
      permissions={PERMISSIONS}
      onAdd={handleAdd}
      clientSide
    />
  );
}
