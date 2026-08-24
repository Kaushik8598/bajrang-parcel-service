"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import type { ColumnDef, TablePermissions } from "@/lib/types/common";

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface Customer {
  id: number | string;
  customer_name: string;
  email_id: string;
  mobile_no_1: string;
  mobile_no_2: string;
  city: string;
  [key: string]: unknown;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 1,
    customer_name: "Radhe Krishna Textiles",
    email_id: "radhe.textiles@gmail.com",
    mobile_no_1: "9825100001",
    mobile_no_2: "9825100002",
    city: "Surat",
  },
  {
    id: 2,
    customer_name: "Shreeji Enterprise",
    email_id: "shreeji.ent@gmail.com",
    mobile_no_1: "9825200001",
    mobile_no_2: "9825200002",
    city: "Ahmedabad",
  },
  {
    id: 3,
    customer_name: "Bhavani Steel & Hardware",
    email_id: "bhavani.steel@yahoo.com",
    mobile_no_1: "9825300001",
    mobile_no_2: "9825300002",
    city: "Rajkot",
  },
  {
    id: 4,
    customer_name: "Mahavir Sarees & Dress",
    email_id: "mahavir.sarees@gmail.com",
    mobile_no_1: "9825400001",
    mobile_no_2: "9825400002",
    city: "Surat",
  },
  {
    id: 5,
    customer_name: "Balaji Electronics Hub",
    email_id: "balaji.hub@gmail.com",
    mobile_no_1: "9825500001",
    mobile_no_2: "9825500002",
    city: "Vadodara",
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
  canStatus: false,
};

export default function ManageCustomerPage() {
  const [data] = useState<Customer[]>(MOCK_CUSTOMERS);

  const handleAdd = () => {
    showToast("info", "Add Customer clicked", "Customer registration form modal can be opened here.");
  };

  const handleEdit = (row: Customer) => {
    showToast("info", `Editing Customer: ${row.customer_name}`, `City: ${row.city}`);
  };

  // ─── Columns ─────────────────────────────────────────────────────────────────
  const columns: ColumnDef<Customer>[] = [
    { key: "customer_name", label: "Customer Name", sortable: true },
    { key: "email_id", label: "Email Id", sortable: true },
    { key: "mobile_no_1", label: "Mobile No1", sortable: true, width: "w-36" },
    { key: "mobile_no_2", label: "Mobile No2", sortable: true, width: "w-36" },
    { key: "city", label: "City", sortable: true, width: "w-32" },
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
    <DataTable<Customer>
      title="Manage Customer"
      columns={columns}
      data={data}
      permissions={PERMISSIONS}
      onAdd={handleAdd}
      clientSide
    />
  );
}
