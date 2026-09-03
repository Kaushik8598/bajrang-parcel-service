import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {

  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(date?: string | Date | number | null): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format any date-time string/timestamp
 * Default format: DD-MM-YYYY hh:mm A
 */
export function formatDateTime(date?: string | Date | number | null): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, "0");
  return `${day}-${month}-${year} ${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Get date and time parts separately for UI rendering
 */
export function formatDeliveredDateTime(
  date?: string | Date | number | null
): { datePart: string; timePart: string } | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return { datePart: String(date), timePart: "" };
  }
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, "0");
  return {
    datePart: `${day}-${month}-${year}`,
    timePart: `${formattedHours}:${minutes} ${ampm}`,
  };
}

/**
 * Get current formatted date (YYYY-MM-DD)
 */
export function getCurrentDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get current formatted date-time (DD-MM-YYYY hh:mm A)
 */
export function getCurrentDateTime(): string {
  return formatDateTime(new Date());
}

/**
 * Mask a mobile number showing only first 2 and last 2 digits
 * Example: 9825100001 -> 98******01
 */
export function maskMobileNumber(mobile?: string | number | null): string {
  if (!mobile) return "—";
  const str = String(mobile).trim();
  if (str.length <= 4) return str;
  const first2 = str.slice(0, 2);
  const last2 = str.slice(-2);
  const stars = "*".repeat(str.length - 4);
  return `${first2}${stars}${last2}`;
}

/**
 * Returns full mobile number for admin/superadmin, and masked (first 2 & last 2 digits) for all other roles
 */
export function formatMobileByRole(mobile?: string | number | null, role?: string | null): string {
  if (!mobile) return "—";
  const userRole = (role || "").toLowerCase();
  const isAdminOrSuperAdmin = userRole === "admin" || userRole === "superadmin";
  if (isAdminOrSuperAdmin) return String(mobile).trim();
  return maskMobileNumber(mobile);
}

