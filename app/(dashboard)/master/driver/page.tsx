"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import StatusBadge from "@/components/DataTable/StatusBadge";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import type { ColumnDef, TablePermissions } from "@/lib/types/common";

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface Driver {
  id: number | string;
  driver_name: string;
  truck_no: string;
  mobile_no: string;
  city: string;
  address: string;
  is_active: boolean;
  [key: string]: unknown;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_DRIVERS: Driver[] = [
  {
    id: 1,
    driver_name: "Ramesh Prajapati",
    truck_no: "GJ-05-BX-1024",
    mobile_no: "9824011111",
    city: "Surat",
    address: "Varachha Main Road, Surat, Gujarat",
    is_active: true,
  },
  {
    id: 2,
    driver_name: "Suresh Chauhan",
    truck_no: "GJ-01-CZ-3389",
    mobile_no: "9824022222",
    city: "Ahmedabad",
    address: "C.T.M Cross Road, Ahmedabad, Gujarat",
    is_active: true,
  },
  {
    id: 3,
    driver_name: "Dinesh Parmar",
    truck_no: "GJ-06-AK-7721",
    mobile_no: "9824033333",
    city: "Vadodara",
    address: "Gorwa BIDC, Vadodara, Gujarat",
    is_active: true,
  },
  {
    id: 4,
    driver_name: "Ketan Baraiya",
    truck_no: "GJ-03-ER-4490",
    mobile_no: "9824044444",
    city: "Rajkot",
    address: "Gondal Road, Rajkot, Gujarat",
    is_active: false,
  },
  {
    id: 5,
    driver_name: "Gopal Vala",
    truck_no: "GJ-10-DF-9912",
    mobile_no: "9824055555",
    city: "Bhavnagar",
    address: "Kalanala, Bhavnagar, Gujarat",
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

export default function ManageDriverPage() {
  const [data, setData] = useState<Driver[]>(MOCK_DRIVERS);

  const handleAdd = () => {
    showToast("info", "Add Driver clicked", "Driver registration form modal can be opened here.");
  };

  const handleEdit = (row: Driver) => {
    showToast("info", `Editing Driver: ${row.driver_name}`, `Truck: ${row.truck_no}`);
  };

  const handleStatusToggle = (row: Driver) => {
    setData((prev) =>
      prev.map((d) =>
        d.id === row.id ? { ...d, is_active: !d.is_active } : d
      )
    );
    showToast(
      "success",
      `Driver "${row.driver_name}" status updated to ${!row.is_active ? "Active" : "Inactive"}`
    );
  };

  // ─── Columns ─────────────────────────────────────────────────────────────────
  const columns: ColumnDef<Driver>[] = [
    { key: "driver_name", label: "Driver Name", sortable: true },
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
    { key: "mobile_no", label: "Mobile No", sortable: true, width: "w-32" },
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
    <DataTable<Driver>
      title="Manage Driver"
      columns={columns}
      data={data}
      permissions={PERMISSIONS}
      onAdd={handleAdd}
      clientSide
    />
  );
}
