/**
 * Three customer bill print formats used by Ateka Logistics ERP:
 * 1. E-Invoice Bill Format  — matches client Tax Invoice PDFs (QR, Ack, full docket grid, CGST/SGST, POD, digital sign)
 * 2. Standard Bill Format   — simpler A4 freight bill without e-invoice chrome
 * 3. Thermal Format         — compact 80mm counter slip
 */

export const BILL_FORMATS = [
  "E-Invoice Bill Formate",
  "Standard Bill Format",
  "Thermal Format"
] as const;

export type BillFormat = (typeof BILL_FORMATS)[number];

function esc(val: any): string {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inr(val: number): string {
  return Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value?: string | Date) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function amountInWords(n: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen"
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (num: number) => {
    if (num < 20) return ones[num];
    return `${tens[Math.floor(num / 10)]}${num % 10 ? " " + ones[num % 10] : ""}`.trim();
  };
  const three = (num: number) => {
    if (num < 100) return two(num);
    return `${ones[Math.floor(num / 100)]} Hundred${num % 100 ? " " + two(num % 100) : ""}`.trim();
  };
  const whole = Math.floor(Math.abs(n));
  const paise = Math.round((Math.abs(n) - whole) * 100);
  if (whole === 0 && paise === 0) return "Zero rupees only";

  let out = "";
  const crore = Math.floor(whole / 10000000);
  const lakh = Math.floor((whole % 10000000) / 100000);
  const thousand = Math.floor((whole % 100000) / 1000);
  const rest = whole % 1000;
  if (crore) out += `${three(crore)} Crore `;
  if (lakh) out += `${three(lakh)} Lakh `;
  if (thousand) out += `${three(thousand)} Thousand `;
  if (rest) out += `${three(rest)} `;
  out = `${out.trim()} rupees`;
  if (paise) out += ` ${two(paise)} paise`;
  return `${out} only`;
}

function normalizeBill(bill: any) {
  const customChargeColumns = Array.isArray(bill.customChargeColumns) ? bill.customChargeColumns : [];
  const lines = Array.isArray(bill.lineItems) && bill.lineItems.length
    ? bill.lineItems
    : (bill.consignments || []).map((docketNo: string) => ({
        docketNo,
        bookingDate: bill.billDate,
        from: bill.city || "",
        to: bill.destinationAddress || "",
        vehicleNo: "",
        freight: Number(bill.totalFreight || 0) / Math.max(1, (bill.consignments || [1]).length),
        totalPkgs: 1,
        totalWt: 0,
        rateType: "Fixed",
        customCharges: {}
      }));

  // Aggregate named extra charges (e.g. AIRPORT RETRIEVAL CHARGES) like client PDF totals block
  const extraChargeTotals = new Map<string, number>();
  for (const row of lines) {
    const charges = row.customCharges || {};
    for (const [id, amt] of Object.entries(charges)) {
      const n = Number(amt) || 0;
      if (!n) continue;
      const col = customChargeColumns.find((c: any) => c.id === id);
      const label = String(col?.particular || id).toUpperCase();
      extraChargeTotals.set(label, (extraChargeTotals.get(label) || 0) + n);
    }
  }

  const lineFreight = lines.reduce((s: number, r: any) => s + Number(r.freight || 0), 0);
  const extrasSum = [...extraChargeTotals.values()].reduce((s, n) => s + n, 0);
  const freight = Number(bill.totalFreight || 0) || lineFreight + extrasSum;
  // Base freight for TOTAL FREIGHT row = totalFreight minus named extras when extras are broken out
  const baseFreight = extrasSum > 0 && freight >= extrasSum ? freight - extrasSum : lineFreight || freight;
  const cgst = Number(bill.cgst || 0);
  const sgst = Number(bill.sgst || 0);
  const igst = Number(bill.igst || 0);
  const tax = Number(bill.taxAmount || cgst + sgst + igst || 0);
  const total = Number(bill.grandTotal || freight + tax);
  // Client PDFs use half of GST% (18 → CGST [9%] / SGST [9%])
  const gstPercent = Number(bill.gstPercent || 18);

  return {
    billNumber: bill.billNumber || "",
    billDate: formatDate(bill.billDate),
    customerName: bill.customerName || bill.partyName || "",
    customerGstin: bill.customerGstin || "",
    partyAddress: bill.partyAddress || "",
    city: bill.city || "",
    remark: bill.remark || "",
    sacCode: bill.sacCode || "996511",
    billingBranch: bill.billingBranch || bill.collectionBranch || "ALC1",
    gstPercent,
    freight,
    baseFreight,
    extraCharges: [...extraChargeTotals.entries()].map(([label, amount]) => ({ label, amount })),
    cgst,
    sgst,
    igst,
    tax,
    total,
    irn: bill.irnDetails?.irn || bill.irn || "",
    ackNo: bill.irnDetails?.ackNo || "",
    ackDate: bill.irnDetails?.ackDate ? formatDate(bill.irnDetails.ackDate) : "",
    preparedBy: bill.preparedBy || "ANISHA OZARKAR",
    podAttachments: Array.isArray(bill.podAttachments) ? bill.podAttachments : [],
    customChargeColumns,
    lines,
    amountWords: amountInWords(total)
  };
}

function openPrintWindow(title: string, html: string) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=980,height=1200");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  // allow assets/styles to settle
  setTimeout(() => {
    try {
      win.focus();
    } catch {
      // ignore
    }
  }, 250);
}

/** 1) E-Invoice Tax Invoice — field labels/text taken from client bill PDFs */
function printEInvoiceFormat(bill: any) {
  const b = normalizeBill(bill);
  const useIgst = b.igst > 0 && b.cgst === 0 && b.sgst === 0;
  const halfRate = Math.round((b.gstPercent / 2) * 100) / 100;

  const lineRows = b.lines
    .map((row: any) => {
      const ftl =
        row.ftlType ||
        row.vehicleType ||
        (row.rateType && row.rateType !== "Fixed" ? row.rateType : "") ||
        "";
      return `<tr>
        <td>
          <div class="bold">${esc(row.docketNo)}</div>
          <div>${esc(formatDate(row.bookingDate) || row.bookingDate || "")}</div>
        </td>
        <td>
          <div>${esc(row.consignorName || b.customerName)}</div>
          <div class="sep">${esc(row.consigneeName || b.customerName)}</div>
        </td>
        <td>
          <div>${esc(row.from || "")}</div>
          <div class="sep">${esc(row.to || "")}</div>
        </td>
        <td>
          <div>${esc(row.invoiceNo || row.docketNo || "")}</div>
          <div class="sep">${esc(row.ewayBillNo || "-")}</div>
        </td>
        <td>
          <div>${esc(row.poNo || "-")}</div>
          <div class="sep">${esc(row.shipmentNo || "-")}</div>
        </td>
        <td>
          <div>${esc(ftl)}</div>
          <div class="sep">${esc(row.vehicleNo || "")}</div>
        </td>
        <td>
          <div>${esc(row.particulars || "AS PER INVOICE")}</div>
          <div class="sep">${esc(row.totalPkgs ?? 1)}</div>
        </td>
        <td class="num">
          <div>${esc(row.actualWt ?? row.totalWt ?? 0)}</div>
          <div class="sep">${esc(row.chargedWt ?? row.totalWt ?? 0)}</div>
        </td>
        <td class="num bold">${inr(Number(row.freight || 0))}</td>
      </tr>`;
    })
    .join("");

  const extraRows = b.extraCharges
    .map((x: { label: string; amount: number }) => `<tr><td>${esc(x.label)}</td><td class="num">${inr(x.amount)}</td></tr>`)
    .join("");

  const taxRows = useIgst
    ? `<tr><td>IGST [${b.gstPercent}%]</td><td class="num">${inr(b.igst || b.tax)}</td></tr>`
    : `<tr><td>CGST [${halfRate}%]</td><td class="num">${inr(b.cgst || b.tax / 2)}</td></tr>
       <tr><td>SGST [${halfRate}%]</td><td class="num">${inr(b.sgst || b.tax / 2)}</td></tr>`;

  const podHtml = b.podAttachments
    .map(
      (p: any) =>
        `<div class="pod-item"><a href="${esc(p.podUrl)}" target="_blank">${esc(p.docketNo)}${p.podFileName ? " — " + esc(p.podFileName) : ""}</a></div>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>${esc(b.billNumber)}</title>
  <style>
    @page { size: A4; margin: 8mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 11px; margin: 0; background: #eef2f7; }
    .sheet { width: 210mm; min-height: 297mm; margin: 12px auto; background: #fff; padding: 10mm; border: 1px solid #cbd5e1; }
    .top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
    .logo-box { width: 78px; height: 70px; display:flex; align-items:center; justify-content:center; }
    .logo-box img { max-width: 78px; max-height: 70px; object-fit: contain; }
    .brand { font-size: 22px; font-weight: 800; margin: 0 0 4px; letter-spacing: 0.2px; }
    .hdr-line { color: #222; font-size: 11px; line-height: 1.45; }
    .bold { font-weight: 700; }
    .sep { margin-top: 4px; }
    .qr { width: 86px; height: 86px; border: 1px solid #94a3b8; display:flex; align-items:center; justify-content:center; font-size:9px; text-align:center; color:#64748b; background:#f8fafc; }
    .party { margin-top: 12px; border: 1px solid #111; }
    .party .hd { padding: 5px 8px; font-weight: 700; border-bottom: 1px solid #111; }
    .party .bd { padding: 6px 8px; line-height: 1.5; }
    .meta { margin-top: 8px; display:flex; flex-wrap:wrap; gap: 18px 28px; font-size: 11px; }
    table.grid { width: 100%; border-collapse: collapse; margin-top: 8px; table-layout: fixed; }
    table.grid th, table.grid td { border: 1px solid #111; padding: 4px 5px; vertical-align: top; font-size: 10px; word-wrap: break-word; }
    table.grid th { background: #f3f4f6; font-size: 9px; text-transform: uppercase; text-align: left; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .foot-row { display:flex; justify-content: space-between; gap: 16px; margin-top: 10px; align-items: flex-start; }
    .words { flex: 1; padding-top: 4px; }
    .totals { width: 280px; border-collapse: collapse; }
    .totals td { border: 1px solid #111; padding: 4px 8px; }
    .remark { margin-top: 8px; }
    .stat { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .stat td { border: 1px solid #111; padding: 5px 8px; width: 25%; vertical-align: top; }
    .stat .lbl { font-size: 10px; color: #333; margin-bottom: 2px; }
    .terms { margin-top: 10px; font-size: 10px; line-height: 1.45; }
    .sign { display: flex; justify-content: flex-end; margin-top: 22px; }
    .sign-box { width: 240px; text-align: center; }
    .sign-stamp { min-height: 64px; margin-bottom: 6px; }
    .pod { margin-top: 14px; border: 1px solid #111; min-height: 64px; }
    .pod .hd { padding: 5px 8px; font-weight: 700; border-bottom: 1px solid #111; }
    .pod .bd { padding: 8px; min-height: 48px; }
    .pod-item { margin-bottom: 4px; }
    .toolbar { position: sticky; top: 0; z-index: 20; display:flex; justify-content:flex-end; gap:8px; background:#0f172a; padding:8px 12px; }
    .toolbar button { border:0; border-radius:6px; padding:7px 12px; font-weight:700; cursor:pointer; background:#2563eb; color:#fff; }
    @media print { body { background:#fff; } .toolbar { display:none !important; } .sheet { margin:0; border:0; width:auto; min-height:auto; } }
  </style></head><body>
  <div class="toolbar"><button onclick="window.print()">Print Invoice</button></div>
  <div class="sheet">
    <div class="top">
      <div style="display:flex;gap:12px;">
        <div class="logo-box"><img src="/images/atteka_logo-removebg-preview.png" alt="Ateka" /></div>
        <div>
          <div class="brand">Ateka Logistics</div>
          <div class="hdr-line">Registered Office: C-342,3RD FLOOR,DISMA COMPLEX,STEEL MARKET,KALAMBOLI</div>
          <div class="hdr-line">Billing Branch: Ateka Logistics</div>
          <div class="hdr-line">GSTIN NO: 27HGTPS8288C1ZD</div>
          <div class="hdr-line">State Name: Maharashtra [27]</div>
        </div>
      </div>
      <div class="qr">${b.irn ? "e-Invoice QR" : ""}</div>
    </div>

    <div class="party">
      <div class="hd">Service Recipient Name and Address</div>
      <div class="bd">
        <div><span class="bold">Name:</span> ${esc(b.customerName)}</div>
        <div><span class="bold">Address:</span> ${esc(b.partyAddress || "")}</div>
        <div><span class="bold">GST No:</span> ${esc(b.customerGstin || "")}</div>
        <div><span class="bold">State Name:</span> Maharashtra [27]</div>
      </div>
    </div>

    <div class="meta">
      <div><span class="bold">Tax Invoice No :</span> ${esc(b.billNumber)}</div>
      <div><span class="bold">Tax Invoice Date :</span> ${esc(b.billDate)}</div>
      <div><span class="bold">Ack.No :</span> ${esc(b.ackNo || "")}</div>
      <div><span class="bold">Ack Date :</span> ${esc(b.ackDate || "")}</div>
    </div>

    <table class="grid">
      <thead>
        <tr>
          <th>DOCKET NO<br/>DOCKET DATE</th>
          <th>CONSIGNOR<br/>CONSIGNEE</th>
          <th>FROM<br/>TO</th>
          <th>INVOICE NO<br/>E WAYBILL NO</th>
          <th>PO NO<br/>SHIPMENT NO</th>
          <th>FTL TYPE</th>
          <th>PARTICULARS<br/>PKGS</th>
          <th>ACTUAL WT<br/>CHARGED WT</th>
          <th>FREIGHT</th>
        </tr>
      </thead>
      <tbody>${lineRows}</tbody>
    </table>

    <div class="foot-row">
      <div class="words">
        <div><span class="bold">Rs.(in words) :</span> ${esc(b.amountWords)}</div>
        <div class="remark"><span class="bold">Remark :</span> ${esc(b.remark || "OK")}</div>
      </div>
      <table class="totals">
        <tr><td>TOTAL FREIGHT</td><td class="num">${inr(b.baseFreight)}</td></tr>
        ${extraRows}
        ${taxRows}
        <tr class="bold"><td>Total</td><td class="num">${inr(b.total)}</td></tr>
      </table>
    </div>

    <table class="stat">
      <tr>
        <td><div class="lbl">GSTIN Registration</div><div>Registered – Tax payable as per applicable rate</div></td>
        <td><div class="lbl">SAC CODE</div><div>${esc(b.sacCode)}</div></td>
        <td><div class="lbl">PAN Number - Ateka Logistics</div><div>HGTPS8288C</div></td>
        <td><div class="lbl">CIN - Ateka Logistics</div><div></div></td>
      </tr>
    </table>

    <div class="terms">
      <div class="bold">Terms and conditions:</div>
      <div>1. Subject to Jurisdiction</div>
      <div>2. All payments to be made in favour of Ateka Logistics payable at</div>
      <div>3. Bank details - 08422400000786, IFSC-DCBL0000084, DCB BANK, MGM MEDICAL COLLEGE BLDG, , SECTOR 18, KAMOTHE, NAVI MUMBAI 410 209. State: MAHARASHTRA</div>
      <div>4. Interest @0% applicable on overdue payments</div>
      <div>5. Subject to terms and conditions contained in service agreement by the buyer with Ateka Logistics.</div>
    </div>

    <div class="sign">
      <div class="sign-box">
        <div class="sign-stamp"></div>
        <div class="bold">Ateka Logistics</div>
        <div>Authorised Signatory</div>
        <div style="margin-top:8px;">Prepared By : ${esc(b.preparedBy)}</div>
      </div>
    </div>

    <div class="pod">
      <div class="hd">Proof of Delivery (POD) Attachments</div>
      <div class="bd">${podHtml}</div>
    </div>
  </div>
  </body></html>`;

  openPrintWindow(b.billNumber, html);
}

/** 2) Standard freight bill — cleaner A4 without e-invoice QR/Ack/digital stamp */
function printStandardFormat(bill: any) {
  const b = normalizeBill(bill);
  const useIgst = b.igst > 0 && b.cgst === 0 && b.sgst === 0;

  const rows = b.lines
    .map(
      (row: any, idx: number) => `<tr>
      <td>${idx + 1}</td>
      <td>${esc(row.docketNo)}</td>
      <td>${esc(row.bookingDate || "")}</td>
      <td>${esc(row.from || "")}</td>
      <td>${esc(row.to || "")}</td>
      <td>${esc(row.vehicleNo || "")}</td>
      <td class="num">${esc(row.totalPkgs || 0)}</td>
      <td class="num">${esc(row.totalWt || 0)}</td>
      <td class="num">${inr(Number(row.freight || 0))}</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>${esc(b.billNumber)}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    body { font-family: Arial, sans-serif; color:#0f172a; font-size:12px; margin:0; background:#f8fafc; }
    .sheet { width:210mm; margin:12px auto; background:#fff; padding:12mm; border:1px solid #cbd5e1; }
    h1 { margin:0; font-size:18px; }
    .muted { color:#64748b; font-size:11px; }
    .hdr { display:flex; justify-content:space-between; border-bottom:2px solid #2563eb; padding-bottom:8px; margin-bottom:10px; }
    .box { border:1px solid #cbd5e1; padding:8px; border-radius:6px; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:10px 0; }
    table { width:100%; border-collapse:collapse; margin-top:8px; }
    th,td { border:1px solid #cbd5e1; padding:6px 8px; font-size:11px; }
    th { background:#f8fafc; text-transform:uppercase; font-size:10px; }
    .num { text-align:right; font-family:monospace; }
    .tot { width:280px; margin-left:auto; margin-top:10px; }
    .toolbar { position:sticky; top:0; display:flex; justify-content:flex-end; background:#0f172a; padding:8px 12px; }
    .toolbar button { border:0; border-radius:6px; padding:7px 12px; font-weight:700; cursor:pointer; background:#2563eb; color:#fff; }
    @media print { .toolbar{display:none!important} body{background:#fff} .sheet{margin:0;border:0;width:auto} }
  </style></head><body>
  <div class="toolbar"><button onclick="window.print()">Print Bill</button></div>
  <div class="sheet">
    <div class="hdr">
      <div>
        <h1>Ateka Logistics</h1>
        <div class="muted">Transport Freight Bill · Branch ${esc(b.billingBranch)}</div>
        <div class="muted">GSTIN: 27HGTPS8288C1ZD · SAC ${esc(b.sacCode)}</div>
      </div>
      <div style="text-align:right;">
        <div class="muted">Bill No</div>
        <div style="font-size:16px;font-weight:800;font-family:monospace;">${esc(b.billNumber)}</div>
        <div class="muted">Date: ${esc(b.billDate)}</div>
      </div>
    </div>
    <div class="grid2">
      <div class="box">
        <div class="muted">Billing Party</div>
        <strong>${esc(b.customerName)}</strong>
        <div class="muted">${esc(b.partyAddress || "")}</div>
        <div class="muted">GSTIN: ${esc(b.customerGstin || "-")}</div>
      </div>
      <div class="box">
        <div class="muted">Summary</div>
        <div>Dockets: <strong>${b.lines.length}</strong></div>
        <div>Remark: ${esc(b.remark || "-")}</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Sr</th><th>CN / Docket</th><th>Date</th><th>From</th><th>To</th>
          <th>Vehicle</th><th>Pkgs</th><th>Wt</th><th>Freight</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <table class="tot">
      <tr><td>Freight</td><td class="num">${inr(b.freight)}</td></tr>
      ${
        useIgst
          ? `<tr><td>IGST</td><td class="num">${inr(b.igst || b.tax)}</td></tr>`
          : `<tr><td>CGST</td><td class="num">${inr(b.cgst || b.tax / 2)}</td></tr>
             <tr><td>SGST</td><td class="num">${inr(b.sgst || b.tax / 2)}</td></tr>`
      }
      <tr style="font-weight:800;"><td>Grand Total</td><td class="num">${inr(b.total)}</td></tr>
    </table>
    <p class="muted" style="margin-top:12px;">Amount in words: ${esc(b.amountWords)}</p>
    <p class="muted">Prepared By: ${esc(b.preparedBy)} · Computer generated standard freight bill</p>
  </div></body></html>`;

  openPrintWindow(b.billNumber, html);
}

/** 3) Thermal 80mm counter format */
function printThermalFormat(bill: any) {
  const b = normalizeBill(bill);
  const lines = b.lines
    .slice(0, 8)
    .map(
      (row: any) =>
        `<div class="row"><span>${esc(row.docketNo)}</span><span>${inr(Number(row.freight || 0))}</span></div>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>${esc(b.billNumber)}</title>
  <style>
    @page { size: 80mm auto; margin: 2mm; }
    body { font-family: "Courier New", monospace; font-size: 11px; margin:0; background:#f1f5f9; color:#000; }
    .sheet { width:78mm; margin:10px auto; background:#fff; padding:8px; border:1px dashed #94a3b8; }
    .center { text-align:center; }
    .bold { font-weight:bold; }
    .line { border-bottom:1px dashed #000; margin:6px 0; }
    .row { display:flex; justify-content:space-between; margin:2px 0; }
    .toolbar { position:sticky; top:0; display:flex; justify-content:flex-end; background:#0f172a; padding:8px; }
    .toolbar button { border:0; border-radius:4px; padding:6px 10px; font-weight:700; background:#2563eb; color:#fff; cursor:pointer; }
    @media print { .toolbar{display:none!important} body{background:#fff} .sheet{width:100%;margin:0;border:0} }
  </style></head><body>
  <div class="toolbar"><button onclick="window.print()">Print Thermal</button></div>
  <div class="sheet">
    <div class="center bold">ATEKA LOGISTICS</div>
    <div class="center">TAX / FREIGHT BILL</div>
    <div class="center" style="font-size:9px;">GSTIN 27HGTPS8288C1ZD</div>
    <div class="line"></div>
    <div class="row"><span>BILL NO</span><span class="bold">${esc(b.billNumber)}</span></div>
    <div class="row"><span>DATE</span><span>${esc(b.billDate)}</span></div>
    <div class="line"></div>
    <div><strong>PARTY</strong></div>
    <div>${esc(b.customerName)}</div>
    <div style="font-size:9px;">${esc(b.customerGstin || "")}</div>
    <div class="line"></div>
    <div class="bold">CN / FREIGHT</div>
    ${lines}
    <div class="line"></div>
    <div class="row"><span>FREIGHT</span><span>${inr(b.freight)}</span></div>
    <div class="row"><span>GST</span><span>${inr(b.tax)}</span></div>
    <div class="row bold"><span>TOTAL</span><span>${inr(b.total)}</span></div>
    <div class="line"></div>
    <div class="center" style="font-size:9px;">Thank you<br/>Thermal Format</div>
  </div></body></html>`;

  openPrintWindow(b.billNumber, html);
}

export function printCustomerBill(bill: any, format?: string | null) {
  const f = (format || bill?.billFormat || "E-Invoice Bill Formate") as BillFormat;
  if (f === "Thermal Format") return printThermalFormat(bill);
  if (f === "Standard Bill Format") return printStandardFormat(bill);
  return printEInvoiceFormat(bill);
}
