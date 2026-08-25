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
  /** Optional custom sort value extractor for nested or computed values */
  sortValue?: (row: T) => string | number | boolean | null | undefined;
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
