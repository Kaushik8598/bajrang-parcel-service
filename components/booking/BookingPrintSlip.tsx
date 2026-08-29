"use client";

import React from "react";
import { generateQrCodeSvg } from "@/lib/utils/qrCodeGenerator";

export interface BookingPrintSlipProps {
  booking: any;
  fromBranch?: any;
  toBranch?: any;
  user?: any;
}

/**
 * Generates exact A4 Half-page Bilty Slip HTML matching the official Bajrang Parcel Slip format.
 */
export function getBookingPrintSlipHtml(props: BookingPrintSlipProps): string {
  const { booking } = props;

  // Exact direct keys from response data
  const lrNo = booking?.docketNo2 || "";
  const bookingDate = booking?.bookingDate || "";
  const bookingTime = booking?.bookingTime || "";

  // Branch Details (from response object)
  const fromBranchObj = booking?.fromBranch || props.fromBranch || {};
  const toBranchObj = booking?.toBranch || props.toBranch || {};

  // Branch Name with Code (e.g. SARTHANA (SRTN))
  const fromName = fromBranchObj?.name
    ? `${fromBranchObj.name}${fromBranchObj.code ? ` (${fromBranchObj.code})` : ""}`
    : "";
  const toName = toBranchObj?.name
    ? `${toBranchObj.name}${toBranchObj.code ? ` (${toBranchObj.code})` : ""}`
    : "";

  // Branch Mobiles
  const fromMobile = fromBranchObj?.mobile1 || fromBranchObj?.mobile2 || "";
  const toMobile = toBranchObj?.mobile1 || toBranchObj?.mobile2 || "";
  const transportId = "24ENEPR0248J1ZW";

  // Sender Details
  const sender = booking?.sender || {};
  const senderName = sender?.name || "";
  const senderMobile = sender?.mobile || "";
  const senderGst = sender?.gst || "";

  // Receiver Details
  const receiver = booking?.receiver || {};
  const receiverName = receiver?.name || "";
  const receiverMobile = receiver?.mobile || "";
  const receiverGst = receiver?.gst || "";

  // Delivery Address: toBranch destination address + mobile
  const toAddress = toBranchObj?.address || {};
  const deliveryAddressParts = [
    toAddress?.address1,
    toAddress?.address2,
    toAddress?.city,
    toAddress?.state,
    toAddress?.pincode ? `PIN: ${toAddress.pincode}` : "",
    toBranchObj?.mobile1 ? `M: ${toBranchObj.mobile1}` : "",
    toBranchObj?.mobile2 ? `M: ${toBranchObj.mobile2}` : "",
  ].filter(Boolean);

  const deliveryAddress = deliveryAddressParts.join(", ");

  // Goods Value & Invoice
  const goodsValue = booking?.goodsValue !== undefined && booking?.goodsValue !== null && booking?.goodsValue !== ""
    ? String(booking.goodsValue)
    : "";
  const billNo = booking?.billNo || "";

  // Items & Packages
  const items = Array.isArray(booking?.items) ? booking.items : [];
  const packagesDesc = items
    .map((it: any) => `${it?.parcel || ""}-${(it?.material || "").toUpperCase()}-${(it?.packing || "").toUpperCase()}`)
    .join(", ");

  // Charges
  const itemsAmount = items.reduce(
    (sum: number, it: any) => sum + (Number(it?.amount) || 0),
    0
  );
  const biltyCharge = Number(booking?.biltyCharge) || 0;
  const totalAmount = Number(booking?.finalBillAmount) || 0;
  const paymentMethod = booking?.paymentMethod || "";

  // 1. QR Code for LR No (Placed next to LR No)
  const lrQrSvg = lrNo ? generateQrCodeSvg(lrNo, { size: 36, margin: 0 }) : "";

  // 2. Red QR Code for Branch Location & Tracking (Placed at bottom-right)
  const branchContactQrSvg = lrNo
    ? generateQrCodeSvg(
      `https://bajrangparcelservice.com/track?lr=${encodeURIComponent(lrNo)}`,
      { size: 78, color: "#b81414", margin: 0 }
    )
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bilty - ${lrNo || "Receipt"}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 5mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      width: 100%;
      background: #fff;
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      display: flex;
      justify-content: center;
      padding: 4px;
    }
    .slip-container {
      width: 100%;
      max-width: 960px;
      border: 2px solid #000;
      background: #fff;
    }

    /* ─── TOP RED HEADER (FULL WIDTH) ─── */
    .header-red {
      background: #b81414;
      color: #fff;
      padding: 4px 14px 6px 14px;
      width: 100%;
    }
    .sacred-mantra {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .brand-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      width: 100%;
      margin-top: 2px;
    }
    .brand-title {
      font-size: 70px;
      font-weight: 900;
      letter-spacing: 3px;
      line-height: 0.9;
      text-transform: uppercase;
      font-family: 'Arial Black', Impact, Arial, sans-serif;
    }
    .brand-subtitle {
      font-size: 34px;
      font-weight: 900;
      letter-spacing: 0.5px;
      line-height: 1.05;
      font-family: Arial, sans-serif;
      text-align: left;
      white-space: nowrap;
    }
    .brand-subtitle div:last-child {
      font-size: 30px;
    }

    /* ─── DARK HELPLINE BAR ─── */
    .bar-helpline {
      background: #0f172a;
      color: #fff;
      display: flex;
      justify-content: space-between;
      padding: 3px 12px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }

    /* ─── GRID TABLE ─── */
    .slip-table {
      width: 100%;
      border-collapse: collapse;
    }
    .slip-table td {
      border: 1px solid #000;
      padding: 4px 6px;
      vertical-align: middle;
    }

    .lbl-title {
      font-size: 9.5px;
      font-weight: 800;
      color: #000;
      text-transform: uppercase;
    }
    .val-text {
      font-size: 13px;
      font-weight: 900;
      color: #000;
      text-transform: uppercase;
    }
    .font-mono {
      font-family: 'Courier New', Courier, monospace;
    }

    .lr-cell-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .lr-qr-box {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .cell-lbl-box {
      font-size: 10px;
      font-weight: 800;
      color: #000;
      width: 78px;
    }
    .cell-val-box {
      font-size: 12px;
      font-weight: 900;
      color: #000;
    }

    .charges-lbl {
      font-size: 10px;
      font-weight: 800;
      color: #000;
    }
    .charges-val {
      font-size: 12px;
      font-weight: 900;
      text-align: right;
      font-family: 'Courier New', Courier, monospace;
    }

    /* ─── GUJARATI NOTICE & OWNER RISK ─── */
    .gujarati-section {
      display: flex;
      flex-direction: column;
      background: #fff;
      padding: 2px 8px;
      border-top: 1px solid #000;
    }
    .owner-risk {
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-align: right;
      color: #000;
    }
    .gujarati-text {
      font-size: 11px;
      font-weight: 900;
      color: #b81414;
      text-align: right;
      line-height: 1.3;
    }

    /* ─── BOTTOM ROUTE BANNER ─── */
    .bottom-banner {
      background: #0f172a;
      color: #fff;
      padding: 4px 6px;
      text-align: center;
    }
    .urgent-text {
      font-size: 11.5px;
      font-weight: 900;
      letter-spacing: 0.8px;
      color: #fff;
      margin-bottom: 2px;
    }
    .routes-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-top: 1px solid #334155;
      padding-top: 2px;
    }
    .hub-box {
      background: #fff;
      color: #000;
      font-weight: 900;
      font-size: 13px;
      padding: 0 8px;
      border-radius: 1px;
      letter-spacing: 0.5px;
    }
    .cities-text {
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #fff;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="slip-container">
    <!-- Top Red Sacred Header (Full Width) -->
    <div class="header-red">
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

    <!-- Transport ID Blue Bar (if available) -->
    <div class="bar-helpline">
      <span></span>
      <span>TRANSPORT ID : ${transportId}</span>
    </div>

    <!-- Row 1: From, To, LR No (with QR), Date / Time -->
    <table class="slip-table" style="${!transportId ? 'border-top: 1.5px solid #000;' : ''}">
      <tr>
        <td style="width: 25%;">
          <div class="lbl-title">From :</div>
          <div class="val-text">${fromName}</div>
          ${fromMobile ? `<div class="font-mono" style="font-size: 14px; font-weight: 800; margin-top: 2px;">${fromMobile}</div>` : ""}
        </td>
        <td style="width: 25%;">
          <div class="lbl-title">To :</div>
          <div class="val-text">${toName}</div>
          ${toMobile ? `<div class="font-mono" style="font-size: 14px; font-weight: 800; margin-top: 2px;">${toMobile}</div>` : ""}
        </td>
        <td style="width: 30%;">
          <div class="lr-cell-content">
            <div>
              <div class="lbl-title">L.R NO :</div>
              <div class="val-text font-mono" style="font-size: 14px;">${lrNo}</div>
            </div>
            ${lrQrSvg ? `<div class="lr-qr-box">${lrQrSvg}</div>` : ""}
          </div>
        </td>
        <td style="width: 20%; padding: 2px 6px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px;">
            <span class="lbl-title">Date</span>
            <span class="val-text font-mono" style="font-size: 11px;">${bookingDate}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 2px;">
            <span class="lbl-title">Time</span>
            <span class="val-text font-mono" style="font-size: 11px;">${bookingTime}</span>
          </div>
        </td>
      </tr>
    </table>

    <!-- Main Party Table (Sender 50% - Receiver 50%) -->
    <table class="slip-table" style="border-top: none;">
      <!-- Row 1: Consignor & Consignee Names -->
      <tr>
        <td class="cell-lbl-box" style="width: 14%;">Consignor</td>
        <td class="cell-val-box" style="width: 36%;">
          <div class="val-text">${senderName}</div>
        </td>
        <td class="cell-lbl-box" style="width: 14%;">Consignee</td>
        <td class="cell-val-box" style="width: 36%;">
          <div class="val-text">${receiverName}</div>
        </td>
      </tr>

      <!-- Row 2: Mobile Numbers -->
      <tr>
        <td class="cell-lbl-box" style="width: 14%;">Mobile No.</td>
        <td class="cell-val-box" style="width: 36%;">
          <div class="val-text font-mono">${senderMobile}</div>
        </td>
        <td class="cell-lbl-box" style="width: 14%;">Mobile No.</td>
        <td class="cell-val-box" style="width: 36%;">
          <div class="val-text font-mono">${receiverMobile}</div>
        </td>
      </tr>

      <!-- Row 3: GSTIN -->
      <tr>
        <td class="cell-lbl-box" style="width: 14%;">GSTIN</td>
        <td class="cell-val-box" style="width: 36%;">
          <div class="val-text font-mono">${senderGst}</div>
        </td>
        <td class="cell-lbl-box" style="width: 14%;">GSTIN</td>
        <td class="cell-val-box" style="width: 36%;">
          <div class="val-text font-mono">${receiverGst}</div>
        </td>
      </tr>
    </table>

    <!-- Goods & Charges Table (Left 50% - Right 50%) -->
    <table class="slip-table" style="border-top: none;">
      <!-- Row 4: Goods Value & Charges / Big Red QR -->
      <tr>
        <td class="cell-lbl-box" style="width: 14%;">Goods Value</td>
        <td class="cell-val-box" style="width: 36%;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="val-text font-mono">${goodsValue}</span>
            <div>
            ${billNo
      ? `<span style="font-size: 10px; font-weight: 800;">Invoice No: </span><span style="font-size: 10px; font-weight: 400;">${billNo}</span>`
      : ""
    }
          </div>
          </div>
        </td>
        <td class="charges-lbl" style="width: 16%;">Amount</td>
        <td class="charges-val" style="width: 16%;">
          ${itemsAmount > 0 ? itemsAmount.toFixed(2) : ""}
        </td>
        <!-- Big Red QR Code spanning 4 rows on the right -->
        <td rowspan="4" style="width: 18%; text-align: center; vertical-align: middle; padding: 4px; border-left: 1px solid #000;">
          ${branchContactQrSvg
      ? `<div style="display: flex; justify-content: center; align-items: center;">${branchContactQrSvg}</div>`
      : ""
    }
        </td>
      </tr>

      <!-- Row 5: Packages & Bilty Charge -->
      <tr>
        <td class="cell-lbl-box" style="width: 14%;">Packages</td>
        <td class="cell-val-box" style="width: 36%;">
          <div class="val-text" style="font-size: 11px;">${packagesDesc}</div>
        </td>
        <td class="charges-lbl" style="width: 16%;">Bilty Charge</td>
        <td class="charges-val" style="width: 16%;">
          ${biltyCharge > 0 ? biltyCharge.toFixed(2) : ""}
        </td>
      </tr>

      <!-- Row 6: Address & Total -->
      <tr>
        <td colspan="2" rowspan="2" style="width: 50%; vertical-align: top; padding: 4px 6px;">
          <div class="lbl-title" style="margin-bottom: 2px;">Delivery Address :</div>
          <div style="font-size: 10.5px; font-weight: 800; line-height: 1.3; text-transform: uppercase;">
            ${deliveryAddress}
          </div>
        </td>
        <td class="charges-lbl" style="width: 16%; font-size: 11px; font-weight: 900; background: #f8fafc;">Total</td>
        <td class="charges-val" style="width: 16%; font-size: 13px; font-weight: 900; background: #f8fafc;">
          ${totalAmount > 0 ? totalAmount.toFixed(2) : ""}
        </td>
      </tr>

      <!-- Row 7: Payment Type -->
      <tr>
        <td colspan="2" style="width: 32%; text-align: center; font-weight: 900; font-size: 13px; text-transform: uppercase; background: #fff; padding: 3px;">
          ${paymentMethod}
        </td>
      </tr>
    </table>

    <!-- ─── FOOTER SECTION ─── -->
    <div class="gujarati-section">
      <div class="owner-risk">BOOKED AT OWNER'S RISK</div>
      <div class="gujarati-text">
        દરેક બ્રાંચના લોકેશન & કોન્ટેક્ટ માટે QR કોડ સ્કેન કરો અને પુરી માહિતી મેળવો.
      </div>
    </div>

    <div class="bottom-banner">
      <div class="urgent-text">DAILY URGENT PARCEL SERVICE / 365 DAYS A YEAR</div>
      <div class="routes-row">
        <span class="hub-box">SURAT</span>
        <span class="cities-text">KIM, ANKLESWAR, BHARUCH, VADODARA, NAVSARI, CHIKHLI, VALSAD, VAPI</span>
      </div>
    </div>
  </div>

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
 * Triggers the browser print dialog with the rendered Bilty Slip.
 */
export function printBookingSlip(props: BookingPrintSlipProps): void {
  const html = getBookingPrintSlipHtml(props);
  const printWindow = window.open("", "_blank", "width=1050,height=750");
  if (!printWindow) {
    alert("Please allow popups to print the booking slip.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export default function BookingPrintSlip(props: BookingPrintSlipProps) {
  return (
    <div
      className="w-full overflow-auto bg-slate-100 p-4 flex justify-center"
      dangerouslySetInnerHTML={{ __html: getBookingPrintSlipHtml(props) }}
    />
  );
}
