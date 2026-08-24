export interface LoginRequest {
  username: string;
  password: string;
}

export interface Permission {
  module: string;         // e.g. "manage_admin", "manage_branch"
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;    // Excel / PDF / Print
  can_status: boolean;    // Toggle active/block
}

export interface MenuItem {
  id: string;
  label: string;
  path?: string;
  icon?: string;
  children?: MenuItem[];
  permission_module?: string; // maps to Permission.module
}

export interface User {
  id: number;
  name: string;
  email: string;
  mobile: string;
  role: string;           // "admin" | "branch_user" | etc.
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  permissions: Permission[];
  menu: MenuItem[];
  balance?: number;
  notifications?: number;
}

export interface ForgotPasswordRequest {
  mobile: string;
}
