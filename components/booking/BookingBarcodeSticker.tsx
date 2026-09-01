"use client";

import React from "react";
import { generateBarcodeSvg } from "@/lib/utils/barcodeGenerator";

export interface BookingBarcodeStickerProps {
  booking: any;
  fromBranch?: any;
  toBranch?: any;
  user?: any;
}

/**
 * Returns clean HTML string for printing 100mm x 65mm Barcode Stickers matching official Bajrang Parcel design.
 */
export function getBookingBarcodeStickerHtml(props: BookingBarcodeStickerProps): string {
  const { booking } = props;

  const docketNo = booking?.docketNo2 || booking?.docketNo1 || booking?.docketNo || "";
  const fromBranchObj = booking?.fromBranch || props.fromBranch || {};
  const toBranchObj = booking?.toBranch || props.toBranch || {};

  const fromBranchName = fromBranchObj?.branchName || fromBranchObj?.name || "";
  const fromBranchCode = fromBranchObj?.branchCode || fromBranchObj?.code || "";
  const fromName = fromBranchName
    ? `${fromBranchName}${fromBranchCode ? ` (${fromBranchCode})` : ""}`
    : "";

  const toBranchName = toBranchObj?.branchName || toBranchObj?.name || "";
  const toBranchCode = toBranchObj?.branchCode || toBranchObj?.code || "";
  const toName = toBranchName
    ? `${toBranchName}${toBranchCode ? ` (${toBranchCode})` : ""}`
    : "";

  const fromPhone = fromBranchObj?.mobile1 || fromBranchObj?.mobile2 || fromBranchObj?.phone || "";
  const toPhone = toBranchObj?.mobile1 || toBranchObj?.mobile2 || toBranchObj?.phone || "";

  const items = Array.isArray(booking?.items) && booking.items.length > 0
    ? booking.items
    : Array.isArray(booking?.packages) && booking.packages.length > 0
      ? booking.packages
      : [];

  const totalParcels = items.length > 0
    ? items.reduce(
      (sum: number, item: any) => sum + (Number(item?.parcel ?? item?.qty) || 1),
      0
    )
    : (Number(booking?.parcel) || 1);

  const count = totalParcels > 0 ? totalParcels : 1;
  const stickersHtmlList: string[] = [];

  for (let i = 1; i <= count; i++) {
    const barcodeValue = `${docketNo}__${String(i).padStart(2, "0")}`;
    const barcodeSvg = generateBarcodeSvg(barcodeValue, {
      height: 72,
      barWidth: 2.2,
      quietZone: 2,
      color: "#000000",
    });

    stickersHtmlList.push(`
      <div class="sticker-page">
        <!-- Top Red Sacred Header (Matches Slip Design) -->
        <div class="sticker-header">
          <div class="sacred-mantra">
            <span>॥ MAVTAR MOMAI ॥</span>
            <span>॥ Shree Ganeshay Namh: ॥</span>
          </div>
          <div class="brand-row">
            <div class="brand-title">BAJRANG</div>
            <div class="brand-subtitle">
              <div>Road Lines</div>
              <div>& Parcel Service</div>
            </div>
          </div>
        </div>

        <!-- Branch From / To Route Box -->
        <div class="route-table">
          <div class="branch-col from-col">
            <div class="branch-lbl">From :</div>
            <div class="branch-name">${fromName}</div>
            ${fromPhone ? `<div class="branch-phone">${fromPhone}</div>` : ""}
          </div>
          <div class="branch-col to-col">
            <div class="branch-lbl">To :</div>
            <div class="branch-name">${toName}</div>
            ${toPhone ? `<div class="branch-phone">${toPhone}</div>` : ""}
          </div>
        </div>

        <!-- Middle: Barcode & Value -->
        <div class="barcode-section">
          <div class="barcode-svg-wrap">
            ${barcodeSvg}
          </div>
          <div class="barcode-value">${barcodeValue}</div>
          <div class="pkg-count-row">
            <span class="pkg-count">${i} / ${count}</span>
          </div>
        </div>

        <!-- Bottom Red Footer Website -->
        <div class="sticker-footer">
          <span>www.bajrangparcelservice.com</span>
        </div>
      </div>
    `);
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Barcode Stickers - ${docketNo}</title>
  <style>
    @page {
      size: 100mm 65mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      width: 100mm;
      background: #fff;
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
    }
    .sticker-page {
      width: 100mm;
      height: 65mm;
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 1px solid #000;
      overflow: hidden;
      background: #fff;
    }
    .sticker-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    /* Top Red Header */
    .sticker-header {
      background: #b81414;
      color: #fff;
      padding: 2px 6px 3px 6px;
      width: 100%;
    }
    .sacred-mantra {
      display: flex;
      justify-content: space-between;
      font-size: 6.5px;
      font-weight: 700;
      letter-spacing: 0.5px;
      line-height: 1;
    }
    .brand-row {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 10px;
      width: 100%;
      margin-top: 1px;
      padding-left: 4px;
    }
    .brand-title {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 1.5px;
      line-height: 0.95;
      text-transform: uppercase;
      font-family: 'Arial Black', Impact, Arial, sans-serif;
    }
    .brand-subtitle {
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.3px;
      line-height: 1.05;
      font-family: Arial, sans-serif;
      text-align: left;
      white-space: nowrap;
    }
    .brand-subtitle div:last-child {
      font-size: 11px;
    }

    /* From / To Route Box */
    .route-table {
      display: flex;
      width: 100%;
      border-top: 1.5px solid #000;
      border-bottom: 1.5px solid #000;
      background: #fff;
    }
    .branch-col {
      flex: 1;
      padding: 2px 6px;
    }
    .from-col {
      border-right: 1px solid #000;
    }
    .branch-lbl {
      font-size: 7.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #000;
      line-height: 1;
    }
    .branch-name {
      font-size: 12.5px;
      font-weight: 900;
      text-transform: uppercase;
      color: #000;
      line-height: 1.15;
      margin-top: 1px;
    }
    .branch-phone {
      font-size: 11px;
      font-weight: 800;
      font-family: 'Courier New', Courier, monospace;
      color: #000;
      margin-top: 1px;
      line-height: 1;
    }

    /* Barcode Section */
    .barcode-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2px 4px;
    }
    .barcode-svg-wrap {
      width: 95mm;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 4px;
    }
    .barcode-svg-wrap svg {
      width: 100%;
      height: 72px;
    }
    .barcode-value {
      font-size: 28px;
      font-weight: 900;
      font-family: 'Courier New', Courier, monospace;
      letter-spacing: 2px;
      color: #000;
      text-align: center;
      margin-top: 3px;
      line-height: 1;
    }
    .pkg-count-row {
      width: 96mm;
      display: flex;
      justify-content: flex-end;
      padding-right: 6px;
      margin-top: 2px;
    }
    .pkg-count {
      font-size: 12px;
      font-weight: 900;
      color: #000;
      font-family: Arial, sans-serif;
    }

    /* Bottom Red Footer */
    .sticker-footer {
      background: #b81414;
      color: #fff;
      text-align: center;
      padding: 2.5px 4px;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 0.8px;
    }
  </style>
</head>
<body>
  ${stickersHtmlList.join("")}

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`;
}

/**
 * Triggers the browser print dialog for the 100mm x 65mm Barcode Stickers.
 */
export function printBookingBarcode(props: BookingBarcodeStickerProps): void {
  const html = getBookingBarcodeStickerHtml(props);
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) {
    alert("Please allow popups to print the barcode labels.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export default function BookingBarcodeSticker(props: BookingBarcodeStickerProps) {
  return (
    <div
      className="w-full overflow-auto bg-slate-100 p-4 flex flex-col items-center gap-4"
      dangerouslySetInnerHTML={{ __html: getBookingBarcodeStickerHtml(props) }}
    />
  );
}
