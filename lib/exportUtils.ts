"use client";

import { getServerTime } from "@/lib/api/client";
import { getStoredUserRole } from "@/lib/api/auth";
import { formatMobileByRole } from "@/lib/utils";
import type { ColumnDef } from "@/lib/types/common";

export const EXPORT_COMPANY_NAME = "BAJRANG Parcel Service & Road Lines";

/**
 * Checks if a column is suitable for tabular export (filters out action & image/photo columns)
 */
export function isExportableColumn<T>(col: ColumnDef<T>): boolean {
  const keyStr = String(col.key).toLowerCase();
  const labelStr = String(col.label || "").toLowerCase();

  // Exclude action and row number columns
  if (["action", "actions", "sr", "srno", "#"].includes(keyStr)) return false;
  if (labelStr.includes("action")) return false;

  // Exclude photo / image / avatar columns
  if (
    keyStr.includes("photo") ||
    keyStr.includes("image") ||
    keyStr.includes("avatar") ||
    keyStr.includes("picture")
  ) {
    return false;
  }
  if (
    labelStr.includes("photo") ||
    labelStr.includes("image") ||
    labelStr.includes("avatar") ||
    labelStr.includes("picture")
  ) {
    return false;
  }

  return true;
}

/**
 * Returns formatted date-time string and file timestamp using reliable server time
 */
export function getExportDateTime(): { formattedDateTime: string; fileTimestamp: string } {
  const now = getServerTime();
  const day = String(now.getDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthStr = months[now.getMonth()];
  const year = now.getFullYear();

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, "0");

  const formattedDateTime = `${day} ${monthStr} ${year}, ${formattedHours}:${minutes} ${ampm}`;
  const fileTimestamp = `${day}_${monthStr}_${year}_${formattedHours}_${minutes}_${ampm}`;

  return { formattedDateTime, fileTimestamp };
}

/**
 * Cleanly extracts a cell value for table export without HTML or raw objects,
 * applying role-based mobile number masking (admin/superadmin see full, others see 98******01).
 */
export function extractExportCellValue<T>(row: T, col: ColumnDef<T>): string {
  const userRole = getStoredUserRole();
  const key = String(col.key);
  const keyLower = key.toLowerCase();
  const labelLower = String(col.label || "").toLowerCase();
  const isMobileColumn =
    keyLower.includes("mobile") ||
    keyLower.includes("phone") ||
    keyLower.includes("contact") ||
    labelLower.includes("mobile") ||
    labelLower.includes("phone") ||
    labelLower.includes("contact");

  // 1. If column has a custom export accessor
  if (col.exportValue) {
    const val = col.exportValue(row);
    if (val !== undefined && val !== null) {
      if (isMobileColumn) {
        return formatMobileByRole(String(val), userRole);
      }
      return String(val);
    }
  }

  // 2. If column has a custom sort accessor returning a meaningful string
  if (col.sortValue) {
    const val = col.sortValue(row);
    if (val !== undefined && val !== null && typeof val !== "object") {
      const s = String(val);
      if (s && s !== "0" && s !== "1") {
        if (isMobileColumn) {
          return formatMobileByRole(s, userRole);
        }
        return s;
      }
    }
  }

  const rowObj = row as Record<string, any>;

  // 3. Direct property lookup
  let rawVal = rowObj[key];

  // 4. Nested lookup in branchInfo, truckInfo, driverInfo, staffInfo, customer
  if (rawVal === undefined || rawVal === null) {
    if (rowObj.branchInfo && rowObj.branchInfo[key] !== undefined) {
      rawVal = rowObj.branchInfo[key];
    } else if (rowObj.truckInfo && rowObj.truckInfo[key] !== undefined) {
      rawVal = rowObj.truckInfo[key];
    } else if (rowObj.driverInfo && rowObj.driverInfo[key] !== undefined) {
      rawVal = rowObj.driverInfo[key];
    } else if (rowObj.staffInfo && rowObj.staffInfo[key] !== undefined) {
      rawVal = rowObj.staffInfo[key];
    }
  }

  // 5. Special field resolutions for master data
  if ((rawVal === undefined || rawVal === null) && key === "branchName") {
    rawVal = rowObj.branchInfo?.branchName || rowObj.name;
  }
  if ((rawVal === undefined || rawVal === null) && key === "branchCode") {
    rawVal = rowObj.branchInfo?.branchCode || rowObj.code;
  }
  if ((rawVal === undefined || rawVal === null) && (key === "mobile1" || key === "mobile_no_1")) {
    rawVal = rowObj.branchInfo?.mobile1 || rowObj.mobile || rowObj.mobile_no_1;
  }
  if ((rawVal === undefined || rawVal === null) && (key === "mobile2" || key === "mobile_no_2")) {
    rawVal = rowObj.branchInfo?.mobile2 || rowObj.mobile_no_2;
  }
  if ((rawVal === undefined || rawVal === null) && (key === "truckNo" || key === "truckNumber" || key === "truck_number")) {
    rawVal = rowObj.truckInfo?.truckNumber || rowObj.name;
  }
  if ((rawVal === undefined || rawVal === null) && key === "truckType") {
    rawVal = rowObj.truckInfo?.truckType;
  }
  if ((rawVal === undefined || rawVal === null) && key === "capacity") {
    rawVal = rowObj.truckInfo?.capacity ? `${rowObj.truckInfo.capacity} kg` : "";
  }
  if ((rawVal === undefined || rawVal === null) && key === "driverName") {
    rawVal = rowObj.truckInfo?.driverName || rowObj.driver?.name;
  }
  if ((rawVal === undefined || rawVal === null) && (key === "licenseNo" || key === "licenseNumber")) {
    rawVal = rowObj.driverInfo?.licenseNumber || rowObj.driverInfo?.licenseNo;
  }
  if ((rawVal === undefined || rawVal === null) && key === "address") {
    const info = rowObj.branchInfo || rowObj.address;
    if (info && typeof info === "object") {
      const parts = [info.address1, info.address2, info.city, info.state, info.pincode].filter(Boolean);
      rawVal = parts.length > 0 ? parts.join(", ") : "-";
    }
  }
  if ((rawVal === undefined || rawVal === null) && (key === "branch" || key === "branchId")) {
    rawVal = rowObj.branch?.name || rowObj.staffInfo?.branchId?.name || rowObj.fromBranch?.name;
  }

  if (rawVal === undefined || rawVal === null || rawVal === "") return "—";

  // Role-based mobile number masking
  if (isMobileColumn) {
    return formatMobileByRole(String(rawVal), userRole);
  }

  if (typeof rawVal === "object") {
    if (rawVal.name && rawVal.code) return `${rawVal.name} (${rawVal.code})`;
    if (rawVal.branchName && rawVal.branchCode) return `${rawVal.branchName} (${rawVal.branchCode})`;
    if (rawVal.name) return String(rawVal.name);
    if (rawVal.branchName) return String(rawVal.branchName);
    if (rawVal.branchCode) return String(rawVal.branchCode);
    if (rawVal.image) return "—";
    return String(rawVal);
  }

  if (typeof rawVal === "boolean") {
    return rawVal ? "Yes" : "No";
  }

  if (keyLower === "status") {
    const str = String(rawVal);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return String(rawVal);
}

/**
 * Generates clean file name: ReportName_DD_MMM_YYYY_hh_mm_AM.ext
 */
export function generateExportFileName(title: string, extension: "xlsx" | "pdf"): string {
  const { fileTimestamp } = getExportDateTime();
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
  return `${sanitizedTitle}_${fileTimestamp}.${extension}`;
}

/**
 * Universal Excel Export with Company Header & Reliable Server Timestamp
 */
export async function exportToExcel<T>(
  columns: ColumnDef<T>[],
  data: T[],
  title: string,
  footerRow?: (string | number | null | undefined)[]
) {
  const { utils, writeFile } = await import("xlsx");
  const { formattedDateTime } = getExportDateTime();
  const fileName = generateExportFileName(title, "xlsx");

  const exportableCols = columns.filter(isExportableColumn);

  const headerRow = ["#", ...exportableCols.map((c) => c.label)];

  const dataRows = data.map((row, idx) => [
    idx + 1,
    ...exportableCols.map((c) => extractExportCellValue(row, c)),
  ]);

  const sheetData: (string | number)[][] = [
    [EXPORT_COMPANY_NAME],
    [`Report: ${title}`, "", `Generated Date & Time: ${formattedDateTime}`],
    [], // Blank separator row
    headerRow,
    ...dataRows,
  ];

  if (footerRow && footerRow.length > 0) {
    let finalFooter = [...footerRow];
    if (finalFooter.length === exportableCols.length) {
      finalFooter = ["Total", ...finalFooter.slice(1)];
    }
    sheetData.push(
      finalFooter.map((cell) => (cell === undefined || cell === null ? "—" : cell)) as (string | number)[]
    );
  }

  const ws = utils.aoa_to_sheet(sheetData);

  // Set column widths
  const colWidths = [{ wch: 6 }, ...exportableCols.map((c) => ({ wch: Math.max(c.label.length + 4, 16) }))];
  ws["!cols"] = colWidths;

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, title.slice(0, 31));
  writeFile(wb, fileName);
}

/**
 * Universal PDF Export (Strictly Black & White Table with Company Header & Reliable Timestamp)
 */
export async function exportToPDF<T>(
  columns: ColumnDef<T>[],
  data: T[],
  title: string,
  footerRow?: (string | number | null | undefined)[]
) {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;
  const { formattedDateTime } = getExportDateTime();
  const fileName = generateExportFileName(title, "pdf");

  const exportableCols = columns.filter(isExportableColumn);

  // All PDF exports in landscape layout
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  // 7 mm margin on all sides
  const marginMm = 7;

  const drawPageHeader = () => {
    // Left: Company Name (Double Size: 20pt)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text(EXPORT_COMPANY_NAME, marginMm, 12);

    // Right: Report Name & Timestamp (Double Size: 18pt & 14pt)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(title, pageWidth - marginMm, 10, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Date & Time: ${formattedDateTime}`, pageWidth - marginMm, 16, { align: "right" });

    // Clean Black Divider Line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(marginMm, 18, pageWidth - marginMm, 18);
  };

  const tableHeaders = ["#", ...exportableCols.map((c) => c.label)];
  const tableRows = data.map((row, idx) => [
    idx + 1,
    ...exportableCols.map((c) => extractExportCellValue(row, c)),
  ]);

  let pdfFoot: (string | number)[][] | undefined = undefined;
  if (footerRow && footerRow.length > 0) {
    let finalFooter = [...footerRow];
    if (finalFooter.length === exportableCols.length) {
      finalFooter = ["Total", ...finalFooter.slice(1)];
    }
    pdfFoot = [finalFooter.map((cell) => (cell === undefined || cell === null ? "—" : cell)) as (string | number)[]];
  }

  autoTable(doc, {
    startY: 20,
    head: [tableHeaders],
    body: tableRows,
    foot: pdfFoot,
    theme: "grid",
    styles: {
      fontSize: 8,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.15,
      fillColor: [255, 255, 255], // Pure White
      font: "helvetica",
      cellPadding: 2,
    },
    headStyles: {
      fontStyle: "bold",
      textColor: [0, 0, 0], // Pure Black
      fillColor: [255, 255, 255], // Pure White, no gray!
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    footStyles: {
      fontStyle: "bold",
      textColor: [0, 0, 0],
      fillColor: [245, 245, 245],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255], // Pure White
    },
    margin: { left: marginMm, right: marginMm, top: 20, bottom: marginMm },
    didDrawPage: () => {
      // Draw header on each page
      drawPageHeader();
    },
  });

  doc.save(fileName);
}

/**
 * Universal Print Table (Strictly Black & White with Company Header & Reliable Timestamp)
 */
export function printTable<T>(
  columns: ColumnDef<T>[],
  data: T[],
  title: string,
  footerRow?: (string | number | null | undefined)[]
) {
  const { formattedDateTime } = getExportDateTime();

  const exportableCols = columns.filter(isExportableColumn);

  const headers = `<th>#</th>` + exportableCols.map((c) => `<th>${c.label}</th>`).join("");
  const rows = data
    .map(
      (row, idx) =>
        `<tr><td>${idx + 1}</td>${exportableCols
          .map((c) => {
            const cellVal = extractExportCellValue(row, c);
            const htmlVal = String(cellVal ?? "—").replace(/\n/g, "<br/>");
            return `<td>${htmlVal}</td>`;
          })
          .join("")}</tr>`
    )
    .join("");

  let footerHtml = "";
  if (footerRow && footerRow.length > 0) {
    let finalFooter = [...footerRow];
    if (finalFooter.length === exportableCols.length) {
      finalFooter = ["Total", ...finalFooter.slice(1)];
    }
    footerHtml = `<tfoot><tr>${finalFooter
      .map(
        (c) =>
          `<td style="font-weight: bold; background-color: #f8fafc;">${
            c === undefined || c === null ? "—" : c
          }</td>`
      )
      .join("")}</tr></tfoot>`;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - ${EXPORT_COMPANY_NAME}</title>
  <style>
    @page {
      size: landscape;
      margin: 7mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      font-family: Arial, Helvetica, sans-serif;
      color: #000000;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 1.5px solid #000000;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .company-name {
      font-size: 28px;
      font-weight: bold;
      color: #000000;
      letter-spacing: 0.5px;
      line-height: 1.1;
    }
    .report-meta {
      text-align: right;
    }
    .report-title {
      font-size: 24px;
      font-weight: bold;
      color: #000000;
      line-height: 1.1;
    }
    .report-time {
      font-size: 20px;
      font-weight: normal;
      color: #000000;
      margin-top: 3px;
      line-height: 1.1;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #000000;
      background: #ffffff;
      margin-top: 4px;
    }
    th, td {
      border: 1px solid #000000;
      padding: 5px 6px;
      font-size: 10px;
      color: #000000;
      text-align: left;
    }
    th {
      font-weight: bold;
      background-color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    td {
      font-weight: normal;
      background-color: #ffffff;
    }
    tfoot td {
      font-weight: bold !important;
      background-color: #f8fafc !important;
    }
  </style>
</head>
<body>
  <div class="header-container">
    <div class="company-name">${EXPORT_COMPANY_NAME}</div>
    <div class="report-meta">
      <div class="report-title">${title}</div>
      <div class="report-time">${formattedDateTime}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>${headers}</tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    ${footerHtml}
  </table>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to print.");
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  // Print automatically once fully loaded
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };

  // Fallback trigger if onload already occurred
  setTimeout(() => {
    try {
      printWindow.print();
      printWindow.close();
    } catch {
      // Window might already be closed
    }
  }, 600);
}
