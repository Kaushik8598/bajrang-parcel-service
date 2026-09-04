"use client";

import { useState } from "react";
import { Search, RotateCcw, Send, MessageSquare } from "lucide-react";
import DataTable from "@/components/DataTable/DataTable";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { showToast } from "@/lib/toast";
import type { ColumnDef, TablePermissions } from "@/lib/types/common";

interface MarketingCustomerItem {
  id: number | string;
  branch_name: string;
  customer_name: string;
  email_id: string;
  mobile_no_1: string;
  mobile_no_2: string;
  city: string;
  address: string;
  [key: string]: unknown;
}

const MOCK_MARKETING_DATA: MarketingCustomerItem[] = [
  {
    id: 1,
    branch_name: "Surat Main Branch",
    customer_name: "Radhe Krishna Textiles",
    email_id: "radhe.textiles@gmail.com",
    mobile_no_1: "9825100001",
    mobile_no_2: "9825100002",
    city: "Surat",
    address: "Ring Road, Surat",
  },
  {
    id: 2,
    branch_name: "Ahmedabad Central Hub",
    customer_name: "Shreeji Enterprise",
    email_id: "shreeji.ent@gmail.com",
    mobile_no_1: "9825200001",
    mobile_no_2: "9825200002",
    city: "Ahmedabad",
    address: "Narol Highway, Ahmedabad",
  },
  {
    id: 3,
    branch_name: "Rajkot Transport Nagar",
    customer_name: "Bhavani Steel & Hardware",
    email_id: "bhavani.steel@yahoo.com",
    mobile_no_1: "9825300001",
    mobile_no_2: "9825300002",
    city: "Rajkot",
    address: "Aji GIDC, Rajkot",
  },
  {
    id: 4,
    branch_name: "Surat Main Branch",
    customer_name: "Mahavir Sarees & Dress",
    email_id: "mahavir.sarees@gmail.com",
    mobile_no_1: "9825400001",
    mobile_no_2: "9825400002",
    city: "Surat",
    address: "Millennium Market, Surat",
  },
  {
    id: 5,
    branch_name: "Vadodara Logistics Hub",
    customer_name: "Balaji Electronics Hub",
    email_id: "balaji.hub@gmail.com",
    mobile_no_1: "9825500001",
    mobile_no_2: "9825500002",
    city: "Vadodara",
    address: "Alkapuri, Vadodara",
  },
];

const PERMISSIONS: TablePermissions = {
  canExcel: true,
  canPDF: true,
  canPrint: true,
  canAdd: false,
  canEdit: false,
  canDelete: false,
  canStatus: false,
};

const BRANCH_OPTIONS = [
  { value: "", label: "All Branches" },
  { value: "Surat Main Branch", label: "Surat Main Branch" },
  { value: "Ahmedabad Central Hub", label: "Ahmedabad Central Hub" },
  { value: "Vadodara Logistics Hub", label: "Vadodara Logistics Hub" },
  { value: "Rajkot Transport Nagar", label: "Rajkot Transport Nagar" },
  { value: "Bhavnagar Branch", label: "Bhavnagar Branch" },
];

export default function MarketingToolsReportPage() {
  const [branch, setBranch] = useState("");
  const [city, setCity] = useState("");
  const [data, setData] = useState<MarketingCustomerItem[]>(MOCK_MARKETING_DATA);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let filtered = [...MOCK_MARKETING_DATA];
    if (branch) filtered = filtered.filter((r) => r.branch_name === branch);
    if (city) filtered = filtered.filter((r) => r.city.toLowerCase().includes(city.toLowerCase()));
    setData(filtered);
    showToast("success", `Filtered: ${filtered.length} customer contacts found`);
  };

  const handleResetFilter = () => {
    setBranch("");
    setCity("");
    setData(MOCK_MARKETING_DATA);
    showToast("info", "Filter reset to default");
  };

  const handleSendWhatsApp = () => {
    showToast("success", "Bulk WhatsApp SMS campaign broadcast triggered!");
  };

  const columns: ColumnDef<MarketingCustomerItem>[] = [
    { key: "branch_name", label: "Branch Name", sortable: true },
    { key: "customer_name", label: "Customer Name", sortable: true },
    { key: "email_id", label: "Email Id", sortable: true },
    { key: "mobile_no_1", label: "Mobile No1", sortable: true, width: "w-32" },
    { key: "mobile_no_2", label: "Mobile No2", sortable: true, width: "w-32" },
    { key: "city", label: "City", sortable: true, width: "w-28" },
    { key: "address", label: "Address", sortable: false },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* ─── Top Filter & Campaign Card ─────────────────────────────────────── */}
      <div className="bg-white rounded border border-slate-200/80 shadow-2xs p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-100 gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
            Marketing Tools
          </h1>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSendWhatsApp}
              className="bg-[#25D366] hover:bg-[#1EBE5D] text-white h-7 px-3 text-xs font-semibold shadow-xs transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1" />
              Broadcast WhatsApp SMS
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => showToast("info", "Bulk promotional email campaign scheduled")}
              className="bg-[#2980b9] hover:bg-[#2471a3] text-white h-7 px-3 text-xs font-semibold shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              Send Promo Email
            </Button>
          </div>
        </div>

        <form onSubmit={handleFilterSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            <FormSelect
              label="Select Branch:"
              options={BRANCH_OPTIONS}
              value={branch}
              onChange={(val) => setBranch(val as string)}
              placeholder="All Branches"
            />
            <FormInput
              label="City Name:"
              placeholder="Filter by city..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="submit"
              size="sm"
              className="bg-[#2980b9] hover:bg-[#2471a3] text-white h-8 px-4 text-xs font-semibold shadow-xs"
            >
              <Search className="w-3.5 h-3.5 mr-1.5" />
              Filter Customers
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilter}
              className="h-8 px-3 text-xs text-slate-600 border border-slate-300 hover:bg-slate-50"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>
        </form>
      </div>

      {/* ─── Report Data Table ──────────────────────────────────────────────── */}
      <DataTable<MarketingCustomerItem>
        title=""
        columns={columns}
        data={data}
        permissions={PERMISSIONS}
        clientSide
      />
    </div>
  );
}
