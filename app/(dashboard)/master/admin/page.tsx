"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import StatusBadge from "@/components/DataTable/StatusBadge";
import DeleteConfirmDialog from "@/components/DataTable/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import type { ColumnDef, TablePermissions } from "@/lib/types/common";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Admin {
  id: number;
  admin_name: string;
  email_id: string;
  mobile_no: string;
  is_active: boolean;
  [key: string]: unknown;
}

// ─── Static mock data ─────────────────────────────────────────────────────────
const MOCK_ADMINS: Admin[] = [
  { id: 1, admin_name: "Ujjaval Parmar",  email_id: "ujjaval@bajrang.com", mobile_no: "9876543210", is_active: false },
  { id: 2, admin_name: "Ashok Mehta",     email_id: "ashok@bajrang.com",   mobile_no: "9876543211", is_active: true  },
  { id: 3, admin_name: "Bhavesh Solanki", email_id: "bhavesh@bajrang.com", mobile_no: "9876543212", is_active: true  },
  { id: 4, admin_name: "Chirag Patel",    email_id: "chirag@bajrang.com",  mobile_no: "9876543213", is_active: true  },
  { id: 5, admin_name: "Dipak Desai",     email_id: "dipak@bajrang.com",   mobile_no: "9876543214", is_active: false },
];

// ─── Permissions (simulate full admin permissions) ────────────────────────────
const PERMISSIONS: TablePermissions = {
  canExcel:  true,
  canPDF:    true,
  canPrint:  true,
  canAdd:    true,
  canEdit:   true,
  canDelete: true,
  canStatus: true,
};

// ─── Page Component ───────────────────────────────────────────────────────────
export default function ManageAdminPage() {
  const [data, setData] = useState<Admin[]>(MOCK_ADMINS);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);

  const handleAdd = () => {
    alert("Open Add Admin dialog/form here");
  };

  const handleEdit = (row: Admin) => {
    alert(`Edit Admin: ${row.admin_name}`);
  };

  const handleDeleteClick = (row: Admin) => {
    setAdminToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (adminToDelete) {
      setData((prev) => prev.filter((a) => a.id !== adminToDelete.id));
      setDeleteDialogOpen(false);
      setAdminToDelete(null);
    }
  };

  const handleStatusToggle = (row: Admin) => {
    setData((prev) =>
      prev.map((a) =>
        a.id === row.id ? { ...a, is_active: !a.is_active } : a
      )
    );
  };

  // ─── Column definitions ──────────────────────────────────────────────────────
  const columns: ColumnDef<Admin>[] = [
    { key: "admin_name", label: "Admin Name", sortable: true },
    { key: "email_id",   label: "Email Id",   sortable: true },
    { key: "mobile_no",  label: "Mobile No",  sortable: true },
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
      width: "w-44",
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
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
          {PERMISSIONS.canDelete && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteClick(row)}
              className="h-7 px-2.5 text-xs bg-[#e74c3c] hover:bg-[#c0392b] text-white shadow-xs transition-colors"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Remove
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable<Admin>
        title="Manage Admin"
        columns={columns}
        data={data}
        permissions={PERMISSIONS}
        onAdd={handleAdd}
        clientSide
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Admin"
        itemName={adminToDelete?.admin_name}
        description={
          adminToDelete
            ? `Are you sure you want to remove "${adminToDelete.admin_name}"? This action cannot be undone.`
            : undefined
        }
      />
    </>
  );
}
