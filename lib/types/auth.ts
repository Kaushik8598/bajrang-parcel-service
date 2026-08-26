export interface LoginRequest {
  email: string;
  password: string;
}

export interface MenuItem {
  id: string;
  label: string;
  path?: string;
  icon?: string;
  children?: MenuItem[];
  permission_module?: string;
}

export interface ModuleActionPermissions {
  view?: boolean;
  add?: boolean;
  edit?: boolean;
  delete?: boolean;
  export?: boolean;
  manage?: boolean;
  status?: boolean;
  print?: boolean;
  create?: boolean;
  read?: boolean;
  update?: boolean;
  [key: string]: boolean | undefined;
}

export interface UserPermissions {
  admin?: ModuleActionPermissions;
  branch?: ModuleActionPermissions;
  staff?: ModuleActionPermissions;
  driver?: ModuleActionPermissions;
  truck?: ModuleActionPermissions;
  customer?: ModuleActionPermissions;
  manageRights?: ModuleActionPermissions;
  manageTracking?: ModuleActionPermissions;
  booking?: ModuleActionPermissions;
  loadParcel?: ModuleActionPermissions;
  unloadParcel?: ModuleActionPermissions;
  delivery?: ModuleActionPermissions;
  memo?: ModuleActionPermissions;
  expense?: ModuleActionPermissions;
  publicBooking?: ModuleActionPermissions;
  cancelBooking?: ModuleActionPermissions;
  backToHubBooking?: ModuleActionPermissions;
  discountBooking?: ModuleActionPermissions;
  pendingDelivery?: ModuleActionPermissions;
  profile?: ModuleActionPermissions;
  marketing?: ModuleActionPermissions;
  [key: string]: ModuleActionPermissions | undefined;
}

export interface PaymentPreferences {
  bookWithBill?: boolean;
  bookWithoutBill?: boolean;
  allowPaidBooking?: boolean;
  allowToPayBooking?: boolean;
  allowGPayBooking?: boolean;
  allowCreditBooking?: boolean;
  allowNotPayBooking?: boolean;
  draftOnlyBooking?: boolean;
  creditLimit?: number;
  creditLimitUtilize?: number;
  creditLimitPending?: number;
  hamaliCost?: number;
  biltyCharge?: number;
}

export interface User {
  _id?: string;
  id?: number | string;
  name: string;
  email: string;
  mobile: string;
  role: string; // "superAdmin" | "admin" | "branchUser" | etc.
  status?: string;
  profileImage?: string;
  profilePhoto?: string;
  passportSizePhoto?: string;
  balance?: number;
  branchInfo?: unknown;
  staffProfile?: unknown;
  driverInfo?: unknown;
  truckInfo?: unknown;
  createdBy?: unknown;
  lastLogin?: string;
  aadharCard?: {
    number?: string;
    image?: string;
    imageBack?: string;
    expiryDate?: string | null;
  };
  panCard?: {
    number?: string;
    image?: string;
    imageBack?: string;
    expiryDate?: string | null;
  };
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    accountHolderName?: string;
    passbookImage?: string;
  };
  paymentPreferences?: PaymentPreferences;
  permissions?: UserPermissions;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  [key: string]: unknown;
}

export interface AuthResponseData {
  user: User;
  token: string;
}

export interface ForgotPasswordRequest {
  email?: string;
  mobile?: string;
}
