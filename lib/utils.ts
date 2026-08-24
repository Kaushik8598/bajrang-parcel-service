import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import moment from "moment";

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

/**
 * Format any date string/timestamp using Moment.js
 * Default format: DD-MM-YYYY
 */
export function formatDate(
  date?: string | Date | number | null,
  format = "DD-MM-YYYY"
): string {
  if (!date) return "—";
  const parsed = moment(date, [
    "DD-MM-YYYY HH:mm:ss",
    "DD-MM-YYYY hh:mm A",
    "YYYY-MM-DD HH:mm:ss",
    "YYYY-MM-DD",
    "DD-MM-YYYY",
    moment.ISO_8601,
  ]);
  return parsed.isValid() ? parsed.format(format) : String(date);
}

/**
 * Format any date-time string/timestamp using Moment.js
 * Default format: DD-MM-YYYY hh:mm A
 */
export function formatDateTime(
  date?: string | Date | number | null,
  format = "DD-MM-YYYY hh:mm A"
): string {
  if (!date) return "—";
  const parsed = moment(date, [
    "DD-MM-YYYY HH:mm:ss",
    "DD-MM-YYYY hh:mm A",
    "YYYY-MM-DD HH:mm:ss",
    "YYYY-MM-DD",
    "DD-MM-YYYY",
    moment.ISO_8601,
  ]);
  return parsed.isValid() ? parsed.format(format) : String(date);
}

/**
 * Get current formatted date using Moment.js
 */
export function getCurrentDate(format = "YYYY-MM-DD"): string {
  return moment().format(format);
}

export { moment };
