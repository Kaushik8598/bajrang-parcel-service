"use client";

import { getServerTime } from "@/lib/api/client";
import type { ColumnDef } from "@/lib/types/common";

export const EXPORT_COMPANY_NAME = "BAJRANG Parcel Service & Road Lines";

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
 * Cleanly extracts a cell value for table export without HTML or raw objects
 */
export function extractExportCellValue<T>(row: T, col: ColumnDef<T>): string {
  const key = col.key as string;
  const rawVal = (row as Record<string, any>)[key];

  if (rawVal === undefined || rawVal === null) return "—";

  if (typeof rawVal === "object") {
    if (rawVal.name && rawVal.code) return `${rawVal.name} (${rawVal.code})`;
    if (rawVal.name) return String(rawVal.name);
    if (rawVal.branchName) return String(rawVal.branchName);
    if (rawVal.branchCode) return String(rawVal.branchCode);
    if (rawVal.image) return "—";
    return String(rawVal);
  }

  if (typeof rawVal === "boolean") {
    return rawVal ? "Yes" : "No";
  }

  if (key.toLowerCase() === "status") {
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
  title: string
) {
  const { utils, writeFile } = await import("xlsx");
  const { formattedDateTime } = getExportDateTime();
  const fileName = generateExportFileName(title, "xlsx");

  const exportableCols = columns.filter(
    (c) => !["action", "actions", "sr", "srno", "#"].includes(String(c.key).toLowerCase())
  );

  const headerRow = ["#", ...exportableCols.map((c) => c.label)];

  const dataRows = data.map((row, idx) => [
    idx + 1,
    ...exportableCols.map((c) => extractExportCellValue(row, c)),
  ]);

  const sheetData = [
    [EXPORT_COMPANY_NAME],
    [`Report: ${title}`, "", `Generated Date & Time: ${formattedDateTime}`],
    [], // Blank separator row
    headerRow,
    ...dataRows,
  ];

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
  title: string
) {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;
  const { formattedDateTime } = getExportDateTime();
  const fileName = generateExportFileName(title, "pdf");

  const exportableCols = columns.filter(
    (c) => !["action", "actions"].includes(String(c.key).toLowerCase())
  );

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

  autoTable(doc, {
    startY: 20,
    head: [tableHeaders],
    body: tableRows,
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
  title: string
) {
  const { formattedDateTime } = getExportDateTime();

  const exportableCols = columns.filter(
    (c) => !["action", "actions"].includes(String(c.key).toLowerCase())
  );

  const headers = `<th>#</th>` + exportableCols.map((c) => `<th>${c.label}</th>`).join("");
  const rows = data
    .map(
      (row, idx) =>
        `<tr><td>${idx + 1}</td>${exportableCols
          .map((c) => `<td>${extractExportCellValue(row, c)}</td>`)
          .join("")}</tr>`
    )
    .join("");

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
  </table>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 250);
  }
}
