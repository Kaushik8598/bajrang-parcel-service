export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export type SortDirection = "asc" | "desc" | null;

export interface ColumnDef<T = Record<string, unknown>> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  className?: string;
  /** Optional custom sort value extractor for nested or computed values */
  sortValue?: (row: T) => string | number | boolean | null | undefined;
  /** Optional custom export value extractor for Excel, PDF, and Print export */
  exportValue?: (row: T) => string | number | boolean | null | undefined;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

export interface TablePermissions {
  canExcel?: boolean;
  canPDF?: boolean;
  canPrint?: boolean;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canStatus?: boolean;
}

export interface DashboardStats {
  today_booking: number;
  today_delivered: number;
  pending_parcel_delivery: number;
  today_parcel: number;
  pending_payment: number;
  total_branch: number;
  branch_users: number;
  total_customers: number;
  total_services: number;
  cancel_booking: number;
  pending_memo: number;
}

export interface DashboardUser {
  id: string;
  name: string;
  role: string;
}

export interface DashboardDateRange {
  startDate: string | null;
  endDate: string | null;
}

export interface DashboardSummary {
  totalBookings?: number;
  todayBookings?: number;
  totalDeliveries?: number;
  todayDeliveries?: number;
  totalCancelled?: number;
  pendingDeliveries?: number;
  pendingParcels?: number;
  pendingPayment?: number;
  totalBranch?: number;
  branchUsers?: number;
  totalCustomers?: number;
  totalServices?: number;
  pendingMemo?: number;
}

export interface DashboardCardItem {
  label: string;
  value: number;
  count?: number;
  redirect: string;
  icon?: string;
}

export interface ExpiringDocumentItem {
  user?: string;
  userId?: string;
  role?: string;
  documentType?: string;
  documentNumber?: string;
  expiryDate?: string;
  daysLeft?: number;
}

export interface BranchSummaryHeader {
  id: string;
  name: string;
  code: string;
}

export interface BranchSummaryMetric {
  total: number;
  paid: number;
  toPay: number;
  credit: number;
  notPay: number;
  gpay: number;
}

export interface BranchSummaryCell extends BranchSummaryMetric {
  toBranch: BranchSummaryHeader;
}

export interface BranchSummaryRow {
  fromBranch: BranchSummaryHeader;
  toBranches: BranchSummaryCell[];
}

export interface BranchSummaryColumnTotal extends BranchSummaryMetric {
  toBranch: BranchSummaryHeader;
}

export interface BranchSummaryRowTotal extends BranchSummaryMetric {
  fromBranch: BranchSummaryHeader;
}

export interface DashboardBranchSummaryMatrix {
  headers: BranchSummaryHeader[];
  rows: BranchSummaryRow[];
  columnTotals?: BranchSummaryColumnTotal[];
  rowTotals?: BranchSummaryRowTotal[];
  grandTotal?: BranchSummaryMetric;
}

export interface DashboardBranchSummary {
  branchId?: string;
  branchName?: string;
  branchCode?: string;
  totalBookings?: number;
  delivered?: number;
  cancelled?: number;
  pending?: number;
}

export interface DashboardResponseData {
  user?: DashboardUser;
  dateRange?: DashboardDateRange;
  cards?: DashboardCardItem[];
  expiringDocuments?: ExpiringDocumentItem[];
  summary?: DashboardSummary;
  branchSummary?: DashboardBranchSummaryMatrix | DashboardBranchSummary | any;
}

