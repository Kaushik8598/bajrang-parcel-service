export type GoodsValue = 500 | 1000 | 2000 | number;

export type PaymentType = "Direct" | "Per Package";

export type PaymentMethod = "To Pay" | "Paid" | "Not Pay";

export interface Branch {
  id: number | string;
  name: string;
  code?: string;
  city?: string;
}

export interface Driver {
  id: number | string;
  driver_name: string;
  driver_mobile: string;
  vehicle_no: string;
  license_no?: string;
  is_active?: boolean;
}

export interface PartyDetails {
  contact_no: string;
  gstin?: string;
  name: string;
  show_details?: boolean; // toggles Address, City, Pincode fields
  address?: string;
  city?: string;
  pincode?: string;
}

export interface PackageItem {
  id: string;
  qty: number | "";
  material: string;
  packing: string;
  payment_type: PaymentType;
  price: number | "";
  ref_id?: string;
}

export interface DriverDetails {
  driver_id?: string;
  driver_name?: string;
  driver_mobile?: string;
  vehicle_no?: string;
  license_no?: string;
}

export interface ParcelBookingFormData {
  from_branch_id: string;
  to_branch_id: string;
  bill_no: string;
  goods_value: GoodsValue;
  sender: PartyDetails;
  receiver: PartyDetails;
  packages: PackageItem[];
  payment_method: PaymentMethod;
  bilty_charge: number;
  net_cost: number;
  sender_id_proof?: File | null;
  sender_id_proof_url?: string;
  remark?: string;
  cancel_reason?: string;
  driver?: DriverDetails;
  show_driver_details?: boolean;
}

export interface ParcelBookingRecord extends Omit<ParcelBookingFormData, "sender_id_proof"> {
  id: number;
  tracking_no: string;
  docket_no: string;
  booking_date: string;
  status: "Booked" | "In Transit" | "Delivered" | "Cancelled";
  sender_id_proof_name?: string;
  total_qty: number;
  topay_amount?: number;
  paid_amount?: number;
  booking_type?: string;
  booked_by?: string;
  from_branch_name?: string;
  to_branch_name?: string;
  party_sign?: string;
  [key: string]: unknown;
}
