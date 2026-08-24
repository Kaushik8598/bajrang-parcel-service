import moment from "moment";
import { request } from "./client";
import type { ApiResponse } from "../types/common";
import type { Branch, Driver, ParcelBookingFormData, ParcelBookingRecord } from "../types/booking";

// ─── Static Mock Branches (Matching screenshot) ──────────────────────────────
export const MOCK_BRANCHES: Branch[] = [
  { id: "1", name: "VAR - VARACHHA MAIN", code: "VAR", city: "Surat" },
  { id: "2", name: "VAL - VALSAD", code: "VAL", city: "Valsad" },
  { id: "3", name: "UDH - UDHNA", code: "UDH", city: "Surat" },
  { id: "4", name: "ANK - ANKLESHWAR", code: "ANK", city: "Ankleshwar" },
  { id: "5", name: "AMD - AHMEDABAD CENTRAL", code: "AMD", city: "Ahmedabad" },
  { id: "6", name: "RJT - RAJKOT MAIN", code: "RJT", city: "Rajkot" },
  { id: "7", name: "VAD - VADODARA EXPRESS", code: "VAD", city: "Vadodara" },
  { id: "8", name: "BOM - MUMBAI VASHI", code: "BOM", city: "Mumbai" },
];

// ─── Static Mock Drivers ──────────────────────────────────────────────────────
export const MOCK_DRIVERS: Driver[] = [
  { id: "1", driver_name: "Ramesh Bhai Patel", driver_mobile: "9825112233", vehicle_no: "GJ-05-AB-1234", license_no: "GJ0520150012345" },
  { id: "2", driver_name: "Mukesh Kumar Sharma", driver_mobile: "9879001122", vehicle_no: "GJ-01-CD-5678", license_no: "GJ0120180054321" },
  { id: "3", driver_name: "Jignesh Vaghela", driver_mobile: "9909223344", vehicle_no: "GJ-03-EF-9012", license_no: "GJ0320190098765" },
  { id: "4", driver_name: "Suresh Chauhan", driver_mobile: "9712556677", vehicle_no: "GJ-06-GH-3456", license_no: "GJ0620200011223" },
  { id: "5", driver_name: "Prakash Bhai Rabari", driver_mobile: "9898334455", vehicle_no: "GJ-10-JK-7890", license_no: "GJ1020210044556" },
];

// ─── Static Mock Bookings (Matching screenshot) ──────────────────────────────
export const MOCK_BOOKINGS: ParcelBookingRecord[] = [
  {
    id: 1,
    tracking_no: "VALT-126581",
    docket_no: "VAR-202649348",
    booking_date: "24-08-2026 19:41:59",
    from_branch_id: "1",
    from_branch_name: "VAR - VARACHHA MAIN",
    to_branch_id: "2",
    to_branch_name: "VAL - VALSAD",
    bill_no: "INV-9921",
    goods_value: 1000,
    status: "Booked",
    sender: {
      contact_no: "7201077000",
      gstin: "24AAAAA0000A1Z5",
      name: "K L COMFORTC",
      address: "Shop 12, Varachha Main Road",
      city: "Surat",
      pincode: "395006",
    },
    receiver: {
      contact_no: "8452823142",
      gstin: "24BBBBB1111B2Z6",
      name: "DWRKA FESHAN SATISH BHAI",
      address: "44, Station Road",
      city: "Valsad",
      pincode: "396001",
    },
    packages: [
      { id: "1", qty: 1, material: "Cotton Box", packing: "Carton", payment_type: "Direct", price: 180 },
    ],
    total_qty: 1,
    payment_method: "To Pay",
    topay_amount: 200,
    paid_amount: undefined,
    bilty_charge: 20,
    net_cost: 200,
    booking_type: "Branch User",
    booked_by: "DEEPAKBHAI",
    remark: "Handle with care",
  },
  {
    id: 2,
    tracking_no: "VALT-126580",
    docket_no: "VAR-202649347",
    booking_date: "24-08-2026 19:37:01",
    from_branch_id: "1",
    from_branch_name: "VAR - VARACHHA MAIN",
    to_branch_id: "2",
    to_branch_name: "VAL - VALSAD",
    bill_no: "BILL-1044",
    goods_value: 500,
    status: "Booked",
    sender: {
      contact_no: "9624177722",
      gstin: "24CCCCC2222C3Z7",
      name: "SUPRIME TEX",
      address: "Ring Road Market",
      city: "Surat",
    },
    receiver: {
      contact_no: "948343303",
      gstin: "24DDDDD3333D4Z8",
      name: "SANKALP",
      address: "MG Road",
      city: "Valsad",
    },
    packages: [
      { id: "1", qty: 1, material: "Fabrics", packing: "Bundle", payment_type: "Direct", price: 120 },
    ],
    total_qty: 1,
    payment_method: "To Pay",
    topay_amount: 140,
    paid_amount: undefined,
    bilty_charge: 20,
    net_cost: 140,
    booking_type: "Branch User",
    booked_by: "DEEPAKBHAI",
  },
  {
    id: 3,
    tracking_no: "ANKT-126579",
    docket_no: "UDH-202632738",
    booking_date: "24-08-2026 19:33:48",
    from_branch_id: "3",
    from_branch_name: "UDH - UDHNA",
    to_branch_id: "4",
    to_branch_name: "ANK - ANKLESHWAR",
    bill_no: "INV-5520",
    goods_value: 2000,
    status: "In Transit",
    sender: {
      contact_no: "9825278971",
      name: "pyramind",
      city: "Surat",
    },
    receiver: {
      contact_no: "9820765564",
      name: "SVM GROUP",
      city: "Ankleshwar",
    },
    packages: [
      { id: "1", qty: 1, material: "Machinery Parts", packing: "Wooden Box", payment_type: "Direct", price: 200 },
    ],
    total_qty: 1,
    payment_method: "To Pay",
    topay_amount: 220,
    paid_amount: undefined,
    bilty_charge: 20,
    net_cost: 220,
    booking_type: "Branch User",
    booked_by: "SANJAY BHAI",
  },
  {
    id: 4,
    tracking_no: "SURT-126578",
    docket_no: "AMD-202611942",
    booking_date: "24-08-2026 18:20:10",
    from_branch_id: "5",
    from_branch_name: "AMD - AHMEDABAD CENTRAL",
    to_branch_id: "1",
    to_branch_name: "VAR - VARACHHA MAIN",
    bill_no: "INV-7801",
    goods_value: 1000,
    status: "Booked",
    sender: {
      contact_no: "9876543210",
      name: "Mahadev Sarees",
    },
    receiver: {
      contact_no: "9825098250",
      name: "Radhe Enterprise",
    },
    packages: [
      { id: "1", qty: 3, material: "Silk Sarees", packing: "Carton", payment_type: "Direct", price: 430 },
    ],
    total_qty: 3,
    payment_method: "Paid",
    topay_amount: undefined,
    paid_amount: 450,
    bilty_charge: 20,
    net_cost: 450,
    booking_type: "Admin",
    booked_by: "ADMIN",
  },
];

// ─── API Endpoints ────────────────────────────────────────────────────────────

/**
 * GET /branches
 * Fetch all available branches
 */
export async function getBranches(): Promise<Branch[]> {
  try {
    const response = await request<ApiResponse<Branch[]>>("/branches");
    return response.data;
  } catch {
    return MOCK_BRANCHES;
  }
}

/**
 * GET /drivers
 * Fetch all available drivers
 */
export async function getDrivers(): Promise<Driver[]> {
  try {
    const response = await request<ApiResponse<Driver[]>>("/drivers");
    return response.data;
  } catch {
    return MOCK_DRIVERS;
  }
}

/**
 * GET /bookings
 * Fetch all parcel bookings with optional filters
 */
export async function getBookings(filters?: {
  from_date?: string;
  to_date?: string;
  from_branch_id?: string;
  to_branch_id?: string;
}): Promise<ParcelBookingRecord[]> {
  try {
    const response = await request<ApiResponse<ParcelBookingRecord[]>>("/bookings", {
      params: filters,
    });
    return response.data;
  } catch {
    return MOCK_BOOKINGS;
  }
}

/**
 * GET /bookings/:id
 * Fetch single booking by id
 */
export async function getBookingById(id: number | string): Promise<ParcelBookingRecord | null> {
  try {
    const response = await request<ApiResponse<ParcelBookingRecord>>(`/bookings/${id}`);
    return response.data;
  } catch {
    const found = MOCK_BOOKINGS.find((b) => String(b.id) === String(id));
    return found || null;
  }
}

/**
 * POST /bookings
 * Create a new parcel booking docket
 */
export async function createParcelBooking(
  data: ParcelBookingFormData
): Promise<ParcelBookingRecord> {
  try {
    const response = await request<ApiResponse<ParcelBookingRecord>>("/bookings", {
      method: "POST",
      body: data,
    });
    return response.data;
  } catch {
    // Generate mock record
    const newRecord: ParcelBookingRecord = {
      id: Date.now(),
      tracking_no: `VALT-${Math.floor(100000 + Math.random() * 900000)}`,
      docket_no: `VAR-${Date.now().toString().slice(-9)}`,
      booking_date: moment().format("DD-MM-YYYY HH:mm:ss"),
      from_branch_id: data.from_branch_id,
      to_branch_id: data.to_branch_id,
      bill_no: data.bill_no,
      goods_value: data.goods_value,
      sender: data.sender,
      receiver: data.receiver,
      packages: data.packages,
      payment_method: data.payment_method,
      bilty_charge: data.bilty_charge,
      net_cost: data.net_cost,
      status: "Booked",
      total_qty: data.packages.reduce((sum, p) => sum + (Number(p.qty) || 1), 0),
      topay_amount: data.payment_method === "To Pay" ? data.net_cost : undefined,
      paid_amount: data.payment_method === "Paid" ? data.net_cost : undefined,
      booking_type: "Branch User",
      booked_by: "DEEPAKBHAI",
    };
    return newRecord;
  }
}

/**
 * PUT /bookings/:id
 * Update an existing booking
 */
export async function updateParcelBooking(
  id: number | string,
  data: Partial<ParcelBookingFormData>
): Promise<ParcelBookingRecord> {
  try {
    const response = await request<ApiResponse<ParcelBookingRecord>>(`/bookings/${id}`, {
      method: "PUT",
      body: data,
    });
    return response.data;
  } catch {
    const found = MOCK_BOOKINGS.find((b) => String(b.id) === String(id));
    return { ...found, ...data } as ParcelBookingRecord;
  }
}

/**
 * DELETE /bookings/:id
 * Cancel / Delete booking
 */
export async function deleteParcelBooking(id: number | string): Promise<boolean> {
  try {
    await request<ApiResponse<null>>(`/bookings/${id}`, { method: "DELETE" });
    return true;
  } catch {
    return true;
  }
}

/**
 * GET /bookings/last-docket
 * Fetch last booked docket number
 */
export async function getLastBookedDocket(): Promise<{ docket_no: string | null }> {
  try {
    const response = await request<ApiResponse<{ docket_no: string }>>("/bookings/last-docket");
    return response.data;
  } catch {
    return { docket_no: "VAR-202649348" };
  }
}
