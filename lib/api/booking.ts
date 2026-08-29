import { formatDateTime } from "../utils";
import { request } from "./client";
import type { ApiResponse } from "../types/common";
import type { Branch, Driver, ParcelBookingFormData, ParcelBookingRecord } from "../types/booking";


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
      booking_date: formatDateTime(new Date()),
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

export interface CancelBookingBody {
  cancelReason?: string;
  cancelRemark?: string;
  [key: string]: unknown;
}

/**
 * POST /booking/:id/:status
 * Update booking status (e.g. status = 'cancelled')
 */
export async function updateBookingStatus(
  id: number | string,
  status: string = "cancelled",
  body?: CancelBookingBody
): Promise<{ success: boolean; message?: string; [key: string]: unknown }> {
  return await request<{ success: boolean; message?: string }>(`/booking/${id}/${status}`, {
    method: "POST",
    body,
  });
}

/**
 * DELETE /bookings/:id
 * Cancel / Delete booking
 */
export async function deleteParcelBooking(id: number | string): Promise<boolean> {
  try {
    await updateBookingStatus(id, "cancelled");
    return true;
  } catch {
    return true;
  }
}

export interface LastBookingDocketData {
  docketNo?: string;
  docket_no?: string;
  bookingDate?: string;
  bookingTime?: string;
}

/**
 * GET /booking/lastBookingDocket
 * Fetch last booked docket details
 */
export async function getLastBookedDocket(): Promise<LastBookingDocketData | null> {
  try {
    const response = await request<{
      success: boolean;
      data: LastBookingDocketData;
      message?: string;
    }>("/booking/lastBookingDocket");
    return response.data || null;
  } catch {
    return null;
  }
}

export interface LastItem {
  parcel?: number | string;
  qty?: number | string;
  quantity?: number | string;
  material?: string;
  packing?: string;
  priceType?: string;
  paymentType?: string | number;
  payment_type?: string | number;
  rate?: number | string;
  price?: number | string;
}

export interface CustomerSuggestion {
  mobile: string;
  name: string;
  gst?: string;
  address?: string;
  city?: string;
  pincode?: string;
  lastItems?: LastItem[];
  lastBookings?: any[];
}

export interface SenderCustomerSuggestionResponse {
  customers: CustomerSuggestion[];
  total: number;
  lastBookings?: any[];
}

export interface ReceiverCustomerSuggestionResponse {
  customers: CustomerSuggestion[];
  total: number;
}

/**
 * GET /booking/senderCxSuggetion
 * Fetch sender customer suggestions and last bookings
 */
export async function getSenderCustomerSuggestions(search?: string): Promise<SenderCustomerSuggestionResponse> {
  try {
    const params: Record<string, string> = {};
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const response = await request<{
      success: boolean;
      data: {
        customers: CustomerSuggestion[];
        total: number;
        lastBookings?: any[];
      };
      message?: string;
    }>("/booking/senderCxSuggetion", {
      params,
    });
    return response.data || { customers: [], total: 0, lastBookings: [] };
  } catch {
    return { customers: [], total: 0, lastBookings: [] };
  }
}

/**
 * GET /booking/receiverCxSuggetion
 * Fetch receiver customer suggestions associated with sender
 */
export async function getReceiverCustomerSuggestions(
  senderMobile?: string,
  search?: string
): Promise<ReceiverCustomerSuggestionResponse> {
  try {
    const params: Record<string, string> = {};
    if (senderMobile && senderMobile.trim()) {
      params.senderMobile = senderMobile.trim();
    }
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const response = await request<{
      success: boolean;
      data: {
        customers: CustomerSuggestion[];
        total: number;
      };
      message?: string;
    }>("/booking/receiverCxSuggetion", {
      params,
    });
    return response.data || { customers: [], total: 0 };
  } catch {
    return { customers: [], total: 0 };
  }
}

