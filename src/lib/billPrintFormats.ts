/**
 * Customer bill print formats used by Ateka Logistics ERP:
 * 1. Ateka Bill Format              — classic freight bill (Logistics / ALC)
 * 2. Ateka Road Carrier Bill Format — Road Carrier freight bill (ARC)
 * 3. E-Invoice Bill Format          — tax invoice with QR / Ack / POD
 * 4. Standard Bill Format           — simpler A4 freight bill
 * 5. Thermal Format                 — compact 80mm counter slip
 */

export const BILL_FORMATS = [
  "Ateka Bill Format",
  "Ateka Road Carrier Bill Format",
  "E-Invoice Bill Formate",
  "Standard Bill Format",
  "Thermal Format"
] as const;

/** Company header printed on Ateka Logistics freight / e-invoice bills. */
export const ATEKA_BILL_COMPANY = {
  name: "Ateka Logistics",
  address: "C-342, 3RD FLOOR, DISMA COMPLEX, STEEL MARKET, KALAMBOLI",
  registeredOffice: "C-342,3RD FLOOR,DISMA COMPLEX,STEEL MARKET,KALAMBOLI",
  gstin: "27HGTPS8288C1ZD",
  pan: "HGTPS8288C",
  bankLine:
    "08422400000786, IFSC-DCBL0000084, DCB BANK, MGM MEDICAL COLLEGE BLDG, , SECTOR 18, KAMOTHE, NAVI MUMBAI 410 209. State: MAHARASHTRA"
} as const;

/** Company block for Ateka Road Carrier bills (distinct from Logistics). */
export const ATEKA_ROAD_CARRIER_COMPANY = {
  name: "Ateka Road Carrier",
  address: "C-342, 3RD FLOOR, DISMA COMPLEX, STEEL MARKET, KALAMBOLI",
  pan: "ARHPA4069P",
  gstin: "",
  bankName: "INDUSIND BANK ATEKA",
  accountNo: "201036464679",
  ifsc: "INDB0001025",
  sacCode: "996511"
} as const;

function absoluteAsset(path: string) {
  if (typeof window === "undefined") return path;
  try {
    return new URL(path, window.location.origin).toString();
  } catch {
    return path;
  }
}

function stateLabelFromGstin(gstin?: string) {
  const code = String(gstin || "").slice(0, 2);
  if (code === "27") return "Maharashtra [27]";
  if (code === "24") return "Gujarat [24]";
  if (code === "29") return "Karnataka [29]";
  if (code === "06") return "Haryana [06]";
  if (code === "07") return "Delhi [07]";
  if (code) return `State [${code}]`;
  return "Maharashtra [27]";
}

function qrImgHtml(data: string, size = 110) {
  const payload = encodeURIComponent(String(data || "").trim() || "ATEKA");
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${payload}`;
  return `<img src="${src}" width="${size}" height="${size}" alt="e-Invoice QR" style="display:block;width:${size}px;height:${size}px;" />`;
}

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

function particularForRow(row: any, bill: any) {
  if (row.particulars) return String(row.particulars);
  if (row.particular) return String(row.particular);
  const from = String(row.from || row.fromLocation || bill.city || "").trim();
  const to = String(row.to || row.toLocation || bill.destinationAddress || "").trim();
  if (from && to) return `${from} To ${to}`;
  return from || to || "AS PER INVOICE";
}

function normalizeBill(bill: any) {
  const customChargeColumns = Array.isArray(bill.customChargeColumns) ? bill.customChargeColumns : [];
  const lines = (
    Array.isArray(bill.lineItems) && bill.lineItems.length
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
        }))
  ).map((row: any) => ({
    ...row,
    particulars: particularForRow(row, bill),
    rateType: row.rateType || row.rate || "Fixed",
    totalWt: Number(row.totalWt ?? row.chargedWt ?? row.actualWt ?? 0),
    vehicleNo: row.vehicleNo || row.vehNo || ""
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
  const halfCgst = cgst || (igst > 0 ? 0 : Number((tax / 2).toFixed(2)));
  const halfSgst = sgst || (igst > 0 ? 0 : Number((tax / 2).toFixed(2)));
  const advanceAmount = Number(
    bill.advanceAmount ?? bill.advanceAmt ?? bill.totalAdvance ?? bill.meta?.advanceAmount ?? 0
  );
  const balanceAmount = Number(
    bill.balanceAmount ?? bill.totalBalance ?? Math.max(0, total - advanceAmount)
  );

  return {
    billNumber: bill.billNumber || "",
    billDate: formatDate(bill.billDate),
    customerName: bill.customerName || bill.partyName || "",
    customerGstin: bill.customerGstin || "",
    partyAddress: bill.partyAddress || bill.destinationAddress || "",
    city: bill.city || "",
    remark: bill.remark || "OK",
    sacCode: bill.sacCode || "996511",
    billingBranch: bill.billingBranch || bill.collectionBranch || "ALC1",
    gstPercent,
    freight,
    baseFreight,
    extraCharges: [...extraChargeTotals.entries()].map(([label, amount]) => ({ label, amount })),
    cgst: halfCgst,
    sgst: halfSgst,
    igst,
    tax,
    total,
    advanceAmount,
    balance: balanceAmount,
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

/** Fill missing party address / docket vehicle-weight-route from masters before print. */
async function enrichBillForPrint(bill: any) {
  const next = { ...bill };
  const dockets = (bill.consignments || [])
    .map((d: any) => String(d || "").toUpperCase())
    .filter(Boolean);

  const hasRichLines =
    Array.isArray(bill.lineItems) &&
    bill.lineItems.some(
      (l: any) => l.vehicleNo || l.from || l.to || l.totalWt || l.particulars || l.particular
    );

  if ((!next.partyAddress || !next.customerGstin) && typeof fetch !== "undefined") {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      const rows = data.data || [];
      const cust = rows.find(
        (c: any) =>
          String(c.customerCode || "").toUpperCase() === String(bill.customerCode || "").toUpperCase() ||
          String(c.name || "").toUpperCase() === String(bill.customerName || "").toUpperCase()
      );
      if (cust) {
        next.partyAddress =
          next.partyAddress ||
          [cust.address, cust.city, cust.state, cust.pinCode || cust.pincode].filter(Boolean).join(", ");
        next.customerGstin = next.customerGstin || cust.gstin || "";
      }
    } catch {
      // keep bill as-is
    }
  }

  if (hasRichLines || !dockets.length || typeof fetch === "undefined") {
    return next;
  }

  try {
    const res = await fetch("/api/consignments");
    const data = await res.json();
    const map = new Map<string, any>();
    for (const c of data.data || []) {
      map.set(String(c.docketNo || "").toUpperCase(), c);
    }

    const perLine = Number(bill.totalFreight || 0) / Math.max(1, dockets.length);
    next.lineItems = dockets.map((docketNo: string) => {
      const existing = (bill.lineItems || []).find(
        (l: any) => String(l.docketNo || "").toUpperCase() === docketNo
      );
      const cn = map.get(docketNo);
      const from = existing?.from || cn?.fromLocation || "";
      const to = existing?.to || cn?.toLocation || "";
      return {
        docketNo,
        bookingDate: existing?.bookingDate || cn?.bookingDate || bill.billDate,
        from,
        to,
        vehicleNo: existing?.vehicleNo || cn?.vehicleNo || "",
        freight: Number(existing?.freight ?? perLine),
        totalPkgs: existing?.totalPkgs ?? cn?.packageDetails?.packagesCount ?? 1,
        totalWt:
          existing?.totalWt ??
          cn?.packageDetails?.chargedWeight ??
          cn?.packageDetails?.actualWeight ??
          0,
        rateType: existing?.rateType || "Fixed",
        particulars:
          existing?.particulars ||
          existing?.particular ||
          (from && to ? `${from} To ${to}` : "AS PER INVOICE"),
        customCharges: existing?.customCharges || {}
      };
    });
  } catch {
    // keep bill as-is
  }

  return next;
}

function openPrintWindow(title: string, html: string) {
  // Blob URL avoids about:blank + noopener write failures in Chrome
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "width=980,height=1200");
  if (win) {
    try {
      win.focus();
    } catch {
      // ignore
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  const frameId = "atteka-bill-print-frame";
  document.getElementById(frameId)?.remove();
  const iframe = document.createElement("iframe");
  iframe.id = frameId;
  iframe.title = title;
  iframe.src = url;
  iframe.setAttribute(
    "style",
    "position:fixed;inset:0;width:100%;height:100%;border:0;z-index:99999;background:#fff;"
  );
  document.body.appendChild(iframe);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** 1) Ateka freight bill — exact layout from client View/Print Bills PDF */
function printAtekaFormat(bill: any) {
  const b = normalizeBill(bill);
  const useIgst = b.igst > 0 && b.cgst === 0 && b.sgst === 0;

  const rows = b.lines
    .map((row: any) => {
      const wt = Number(row.totalWt ?? row.chargedWt ?? row.actualWt ?? 0);
      return `<tr>
        <td class="c">${esc(row.docketNo)}</td>
        <td class="c">${esc(formatDate(row.bookingDate) || row.bookingDate || "")}</td>
        <td class="c">${esc(row.vehicleNo || "")}</td>
        <td>${esc(row.particulars || particularForRow(row, bill))}</td>
        <td class="num">${wt ? esc(wt) : ""}</td>
        <td class="c">${esc(row.rateType || "Fixed")}</td>
        <td class="num">${inr(Number(row.freight || 0))}</td>
      </tr>`;
    })
    .join("");

  const taxBlock = useIgst
    ? `<tr><td class="lbl">IGST</td><td class="num">${inr(b.igst || b.tax)}</td></tr>`
    : `<tr><td class="lbl">CGST</td><td class="num">${inr(b.cgst)}</td></tr>
       <tr><td class="lbl">SGST</td><td class="num">${inr(b.sgst)}</td></tr>`;

  const html = `<!DOCTYPE html><html><head><title>${esc(b.billNumber)}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #e8eef5; font-family: Arial, Helvetica, sans-serif; color: #111; }
    .toolbar { position: sticky; top: 0; z-index: 20; display: flex; justify-content: flex-end; gap: 8px; background: #0f172a; padding: 8px 12px; }
    .toolbar button { border: 0; border-radius: 6px; padding: 7px 14px; font-weight: 700; cursor: pointer; background: #2563eb; color: #fff; }
    .sheet {
      width: 210mm; min-height: 297mm; margin: 14px auto; background: #fff;
      border: 1px solid #111; padding: 10mm 9mm 12mm;
    }
    .co-name {
      text-align: center; font-size: 28px; font-weight: 800; color: #6b21a8;
      letter-spacing: 0.2px; line-height: 1.15; margin: 0;
    }
    .co-line { text-align: center; font-size: 12px; color: #111; margin-top: 4px; line-height: 1.4; }
    .party-box {
      margin-top: 14px; border: 1px solid #111; display: grid;
      grid-template-columns: 1.45fr 1fr; min-height: 92px;
    }
    .party-left { padding: 10px 12px; border-right: 1px solid #111; }
    .party-right { padding: 10px 12px; }
    .party-name { font-size: 13px; font-weight: 700; text-transform: uppercase; line-height: 1.35; }
    .party-addr { margin-top: 6px; font-size: 12px; line-height: 1.4; }
    .party-gst { margin-top: 8px; font-size: 12px; }
    .meta-row { font-size: 13px; margin: 4px 0; }
    .meta-row .k { font-weight: 700; display: inline-block; min-width: 78px; }
    .intro {
      margin-top: 10px; font-size: 12.5px; line-height: 1.45;
    }
    table.grid { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
    table.grid th, table.grid td {
      border: 1px solid #111; padding: 6px 5px; font-size: 11.5px; vertical-align: middle;
    }
    table.grid th {
      background: #67e8f9; color: #0f172a; font-weight: 700; text-align: center;
    }
    table.grid td.c { text-align: center; }
    table.grid td.num, .num { text-align: right; font-variant-numeric: tabular-nums; }
    .col-docket { width: 14%; }
    .col-date { width: 12%; }
    .col-veh { width: 12%; }
    .col-part { width: 30%; }
    .col-wt { width: 9%; }
    .col-rate { width: 9%; }
    .col-amt { width: 14%; }
    .totals-wrap { display: flex; justify-content: flex-end; margin-top: 2px; }
    table.totals { width: 280px; border-collapse: collapse; }
    table.totals td {
      border: 1px solid #111; padding: 5px 8px; font-size: 12px;
    }
    table.totals td.lbl { font-weight: 600; }
    table.totals tr.strong td { font-weight: 800; }
    .remark { margin-top: 18px; font-size: 12.5px; }
    @media print {
      body { background: #fff; }
      .toolbar { display: none !important; }
      .sheet { margin: 0; border: 1px solid #111; width: auto; min-height: auto; }
    }
  </style></head><body>
  <div class="toolbar"><button onclick="window.print()">Print Bill</button></div>
  <div class="sheet">
    <h1 class="co-name">${esc(ATEKA_BILL_COMPANY.name)}</h1>
    <div class="co-line">${esc(ATEKA_BILL_COMPANY.address)}</div>
    <div class="co-line">${esc(ATEKA_BILL_COMPANY.gstin)}</div>

    <div class="party-box">
      <div class="party-left">
        <div class="party-name">${esc(b.customerName)}</div>
        <div class="party-addr">${esc(b.partyAddress || "")}</div>
        <div class="party-gst"><strong>GST :</strong> ${esc(b.customerGstin || "")}</div>
      </div>
      <div class="party-right">
        <div class="meta-row"><span class="k">Bill No :</span> ${esc(b.billNumber)}</div>
        <div class="meta-row"><span class="k">Bill Date :</span> ${esc(b.billDate)}</div>
        <div class="meta-row"><span class="k">Sac Code :</span> ${esc(b.sacCode)}</div>
      </div>
    </div>

    <div class="intro">We Here by Submit Our Freight Bill For Transportation of Your Goods from as Under.</div>

    <table class="grid">
      <thead>
        <tr>
          <th class="col-docket">Docket No</th>
          <th class="col-date">Docket Dt</th>
          <th class="col-veh">Vehicle No</th>
          <th class="col-part">Particular</th>
          <th class="col-wt">Weight</th>
          <th class="col-rate">Rate</th>
          <th class="col-amt">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td colspan="7" class="c">No docket lines</td></tr>`}
      </tbody>
    </table>

    <div class="totals-wrap">
      <table class="totals">
        ${taxBlock}
        <tr><td class="lbl">Amount</td><td class="num">${inr(b.freight)}</td></tr>
        <tr><td class="lbl">Total Amount</td><td class="num">${inr(b.freight)}</td></tr>
        ${taxBlock}
        <tr class="strong"><td class="lbl">Total Bill Amount</td><td class="num">${inr(b.total)}</td></tr>
        <tr class="strong"><td class="lbl">Total Balance Amount</td><td class="num">${inr(b.balance)}</td></tr>
      </table>
    </div>

    <div class="remark"><strong>Remark :</strong> ${esc(b.remark || "OK")}</div>
  </div>
  </body></html>`;

  openPrintWindow(b.billNumber, html);
}

function ensureEInvoiceAck(bill: any) {
  if (bill?.irnDetails?.irn || bill?.irn) return bill;
  const seed = String(bill?.billNumber || "BILL")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const irn =
    `${seed}f5a1f54e5619775c18070ca94f86f9c255ebacebb9f010798e2dc28b93a9cc0d`.slice(0, 64);
  return {
    ...bill,
    irnDetails: {
      ...(bill?.irnDetails || {}),
      irn,
      ackNo: bill?.irnDetails?.ackNo || String(122654425528886 + (seed.length % 97)),
      ackDate: bill?.irnDetails?.ackDate || bill?.billDate || new Date(),
      status: bill?.irnDetails?.status || "ACT",
      isSimulated: true
    }
  };
}

/** 2) E-Invoice Tax Invoice — matches client FreightBillPrint.aspx / e-invoice PDF */
function printEInvoiceFormat(bill: any) {
  const b = normalizeBill(ensureEInvoiceAck(bill));
  const useIgst = b.igst > 0 && b.cgst === 0 && b.sgst === 0;
  const halfRate = Math.round((b.gstPercent / 2) * 100) / 100;
  const partyState = stateLabelFromGstin(b.customerGstin);
  const logoUrl = absoluteAsset("/images/atteka_logo-removebg-preview.png");
  const words = String(b.amountWords || "").toLowerCase();
  const qrData = b.irn || `Bill:${b.billNumber}|GSTIN:${ATEKA_BILL_COMPANY.gstin}|Amt:${b.total}`;

  const lineRows = b.lines
    .map((row: any) => {
      const ftl =
        row.ftlType ||
        row.vehicleType ||
        (row.rateType && String(row.rateType).toUpperCase() !== "FIXED" ? row.rateType : "") ||
        "";
      const actualWt = row.actualWt ?? row.totalWt ?? 0;
      const chargedWt = row.chargedWt ?? row.totalWt ?? actualWt;
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
          <div>${esc(row.particulars || particularForRow(row, bill) || "AS PER INVOICE")}</div>
          <div class="sep">${esc(row.totalPkgs ?? 1)}</div>
        </td>
        <td class="num">
          <div>${esc(actualWt)}</div>
          <div class="sep">${esc(chargedWt)}</div>
        </td>
        <td class="num bold">${inr(Number(row.freight || 0))}</td>
      </tr>`;
    })
    .join("");

  const extraRows = b.extraCharges
    .map(
      (x: { label: string; amount: number }) =>
        `<tr><td>${esc(x.label)}</td><td class="num">${inr(x.amount)}</td></tr>`
    )
    .join("");

  const taxRows = useIgst
    ? `<tr><td>IGST [${b.gstPercent}%]</td><td class="num">${inr(b.igst || b.tax)}</td></tr>`
    : `<tr><td>CGST [${halfRate}%]</td><td class="num">${inr(b.cgst)}</td></tr>
       <tr><td>SGST [${halfRate}%]</td><td class="num">${inr(b.sgst)}</td></tr>`;

  const podHtml =
    b.podAttachments.length > 0
      ? b.podAttachments
          .map((p: any) => {
            const url = String(p.podUrl || "");
            const isImg = /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url) || url.startsWith("data:image");
            if (isImg) {
              return `<div class="pod-item"><img src="${esc(url)}" alt="${esc(p.docketNo || "POD")}" /><div class="pod-cap">${esc(p.docketNo || "")}${p.podFileName ? " — " + esc(p.podFileName) : ""}</div></div>`;
            }
            return `<div class="pod-item"><a href="${esc(url)}" target="_blank" rel="noreferrer">${esc(p.docketNo || "POD")}${p.podFileName ? " — " + esc(p.podFileName) : ""}</a></div>`;
          })
          .join("")
      : `<div class="pod-empty">No POD attachments</div>`;

  const html = `<!DOCTYPE html><html><head><title>${esc(b.billNumber)} — Tax Invoice</title>
  <style>
    @page { size: A4; margin: 8mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 11px; margin: 0; background: #e8eef5; }
    .toolbar { position: sticky; top: 0; z-index: 20; display:flex; justify-content:flex-end; gap:8px; background:#0f172a; padding:8px 12px; }
    .toolbar button { border:0; border-radius:6px; padding:7px 14px; font-weight:700; cursor:pointer; background:#2563eb; color:#fff; }
    .sheet { width: 210mm; min-height: 297mm; margin: 12px auto; background: #fff; padding: 9mm 9mm 11mm; border: 1px solid #94a3b8; }
    .top { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; }
    .brand-wrap { display:flex; gap: 12px; align-items: flex-start; flex: 1; }
    .logo-box { width: 78px; height: 70px; display:flex; align-items:center; justify-content:center; flex-shrink: 0; }
    .logo-box img { max-width: 78px; max-height: 70px; object-fit: contain; }
    .brand { font-size: 22px; font-weight: 800; margin: 0 0 3px; letter-spacing: 0.2px; color: #0f172a; }
    .hdr-line { color: #1e293b; font-size: 11px; line-height: 1.45; }
    .bold { font-weight: 700; }
    .sep { margin-top: 3px; }
    .qr { width: 112px; flex-shrink: 0; display:flex; flex-direction:column; align-items:center; gap: 4px; }
    .qr-box { width: 110px; height: 110px; border: 1px solid #64748b; display:flex; align-items:center; justify-content:center; background:#fff; padding: 4px; }
    .qr-lbl { font-size: 9px; color: #64748b; text-align: center; }
    .party { margin-top: 12px; border: 1px solid #111; }
    .party .hd { padding: 5px 8px; font-weight: 700; border-bottom: 1px solid #111; background: #f8fafc; }
    .party .bd { padding: 7px 9px; line-height: 1.5; font-size: 11.5px; }
    .meta { margin-top: 8px; display:flex; flex-wrap:wrap; gap: 10px 28px; font-size: 11.5px; }
    .irn { margin-top: 6px; border: 1px solid #111; padding: 5px 8px; font-size: 10px; word-break: break-all; }
    table.grid { width: 100%; border-collapse: collapse; margin-top: 8px; table-layout: fixed; }
    table.grid th, table.grid td { border: 1px solid #111; padding: 4px 5px; vertical-align: top; font-size: 10px; word-wrap: break-word; }
    table.grid th { background: #f1f5f9; font-size: 9px; text-transform: uppercase; text-align: left; line-height: 1.25; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .foot-row { display:flex; justify-content: space-between; gap: 16px; margin-top: 10px; align-items: flex-start; }
    .words { flex: 1; padding-top: 2px; font-size: 11.5px; line-height: 1.45; }
    .totals { width: 290px; border-collapse: collapse; }
    .totals td { border: 1px solid #111; padding: 4px 8px; font-size: 11px; }
    .totals tr.total td { font-weight: 800; }
    .remark { margin-top: 8px; }
    .stat { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .stat td { border: 1px solid #111; padding: 5px 8px; width: 25%; vertical-align: top; font-size: 11px; }
    .stat .lbl { font-size: 10px; color: #334155; margin-bottom: 2px; font-weight: 700; }
    .terms { margin-top: 10px; font-size: 10.5px; line-height: 1.45; }
    .sign { display: flex; justify-content: flex-end; margin-top: 22px; }
    .sign-box { width: 240px; text-align: center; }
    .sign-stamp { min-height: 58px; margin-bottom: 4px; }
    .pod { margin-top: 14px; border: 1px solid #111; min-height: 72px; }
    .pod .hd { padding: 5px 8px; font-weight: 700; border-bottom: 1px solid #111; background: #f8fafc; }
    .pod .bd { padding: 8px; min-height: 56px; display:flex; flex-wrap:wrap; gap: 10px; }
    .pod-item img { max-width: 160px; max-height: 110px; border: 1px solid #cbd5e1; display:block; }
    .pod-cap { font-size: 9px; color: #475569; margin-top: 3px; }
    .pod-empty { color: #94a3b8; font-size: 11px; }
    @media print {
      body { background:#fff; }
      .toolbar { display:none !important; }
      .sheet { margin:0; border:0; width:auto; min-height:auto; box-shadow:none; }
    }
  </style></head><body>
  <div class="toolbar"><button onclick="window.print()">Print Invoice</button></div>
  <div class="sheet">
    <div class="top">
      <div class="brand-wrap">
        <div class="logo-box"><img src="${esc(logoUrl)}" alt="Ateka Logistics" /></div>
        <div>
          <div class="brand">${esc(ATEKA_BILL_COMPANY.name)}</div>
          <div class="hdr-line">Registered Office: ${esc(ATEKA_BILL_COMPANY.registeredOffice)}</div>
          <div class="hdr-line">Billing Branch: Ateka Logistics</div>
          <div class="hdr-line">GSTIN NO: ${esc(ATEKA_BILL_COMPANY.gstin)}</div>
          <div class="hdr-line">State Name: Maharashtra [27]</div>
        </div>
      </div>
      <div class="qr">
        <div class="qr-box">${qrImgHtml(qrData, 100)}</div>
        <div class="qr-lbl">${b.irn ? "e-Invoice QR" : "Bill QR"}</div>
      </div>
    </div>

    <div class="party">
      <div class="hd">Service Recipient Name and Address</div>
      <div class="bd">
        <div><span class="bold">Name:</span> ${esc(b.customerName)}</div>
        <div><span class="bold">Address:</span> ${esc(b.partyAddress || "")}</div>
        <div><span class="bold">GST No:</span> ${esc(b.customerGstin || "")}</div>
        <div><span class="bold">State Name:</span> ${esc(partyState)}</div>
      </div>
    </div>

    <div class="meta">
      <div><span class="bold">Tax Invoice No :</span> ${esc(b.billNumber)}</div>
      <div><span class="bold">Tax Invoice Date :</span> ${esc(b.billDate)}</div>
      <div><span class="bold">Ack.No :</span> ${esc(b.ackNo || "")}</div>
      <div><span class="bold">Ack Date :</span> ${esc(b.ackDate || "")}</div>
    </div>
    ${
      b.irn
        ? `<div class="irn"><span class="bold">IRN :</span> ${esc(b.irn)}</div>`
        : ""
    }

    <table class="grid">
      <thead>
        <tr>
          <th style="width:11%">DOCKET NO<br/>DOCKET DATE</th>
          <th style="width:16%">CONSIGNOR<br/>CONSIGNEE</th>
          <th style="width:11%">FROM<br/>TO</th>
          <th style="width:11%">INVOICE NO<br/>E WAYBILL NO</th>
          <th style="width:10%">PO NO<br/>SHIPMENT NO</th>
          <th style="width:9%">FTL TYPE</th>
          <th style="width:12%">PARTICULARS<br/>PKGS</th>
          <th style="width:10%">ACTUAL WT<br/>CHARGED WT</th>
          <th style="width:10%">FREIGHT</th>
        </tr>
      </thead>
      <tbody>${lineRows || `<tr><td colspan="9" style="text-align:center;padding:12px;">No docket lines</td></tr>`}</tbody>
    </table>

    <div class="foot-row">
      <div class="words">
        <div><span class="bold">Rs.(in words) :</span> ${esc(words)}</div>
        <div class="remark"><span class="bold">Remark :</span> ${esc(b.remark || "OK")}</div>
      </div>
      <table class="totals">
        <tr><td>TOTAL FREIGHT</td><td class="num">${inr(b.baseFreight)}</td></tr>
        ${extraRows}
        ${taxRows}
        <tr class="total"><td>Total</td><td class="num">${inr(b.total)}</td></tr>
      </table>
    </div>

    <table class="stat">
      <tr>
        <td><div class="lbl">GSTIN Registration</div><div>Registered – Tax payable as per applicable rate</div></td>
        <td><div class="lbl">SAC CODE</div><div>${esc(b.sacCode)}</div></td>
        <td><div class="lbl">PAN Number - Ateka Logistics</div><div>${esc(ATEKA_BILL_COMPANY.pan)}</div></td>
        <td><div class="lbl">CIN - Ateka Logistics</div><div></div></td>
      </tr>
    </table>

    <div class="terms">
      <div class="bold">Terms and conditions:</div>
      <div>1. Subject to Jurisdiction</div>
      <div>2. All payments to be made in favour of Ateka Logistics payable at</div>
      <div>3. Bank details - ${esc(ATEKA_BILL_COMPANY.bankLine)}</div>
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

/**
 * Ateka Road Carrier freight bill — exact layout from client ARC PDF.
 * Header = one outer box (company + party left / bill right + grey subject strip).
 * GST sits on the LEFT with customer. Table header dark grey / white text.
 */
function printAtekaRoadCarrierFormat(bill: any) {
  const b = normalizeBill(bill);
  const co = ATEKA_ROAD_CARRIER_COMPANY;
  const sac = b.sacCode || co.sacCode;
  const lineFreight = (b.lines || []).reduce((s: number, r: any) => s + Number(r.freight || 0), 0);
  const amount = Number(lineFreight || b.baseFreight || b.freight || 0);
  const advance = Number(b.advanceAmount || 0);
  const billAmount = amount;
  const balance = Number(Math.max(0, billAmount - advance).toFixed(2));
  const amt = (n: number) => Number(n || 0).toFixed(2);
  const addr = String(co.address || "").replace(/,\s+/g, ",");

  const dataLines = b.lines.length
    ? b.lines
    : [
        {
          docketNo: "",
          bookingDate: "",
          vehicleNo: "",
          particulars: "",
          totalWt: 0,
          rateType: "Fixed",
          freight: amount
        }
      ];

  const dataRows = dataLines
    .map((row: any) => {
      const wt = Number(row.totalWt ?? row.chargedWt ?? row.actualWt ?? 0);
      return `<tr>
        <td class="c">${esc(row.docketNo || "")}</td>
        <td class="c">${esc(formatDate(row.bookingDate) || row.bookingDate || "")}</td>
        <td class="c">${esc(row.vehicleNo || "")}</td>
        <td>${esc(row.particulars || particularForRow(row, bill))}</td>
        <td class="num">${wt ? esc(String(Math.round(wt))) : ""}</td>
        <td class="c">${esc(row.rateType || "Fixed")}</td>
        <td class="num">${amt(Number(row.freight || 0))}</td>
      </tr>`;
    })
    .join("");

  const minBodyRows = 10;
  const emptyNeeded = Math.max(0, minBodyRows - dataLines.length);
  const emptyRows = Array.from({ length: emptyNeeded })
    .map(() => `<tr class="empty"><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`)
    .join("");

  // Summary sits under Particular → Amount (first 3 cols blank)
  const sumRow = (label: string, value: string, bold = false) => `<tr class="sum${bold ? " bold" : ""}">
      <td></td><td></td><td></td>
      <td colspan="3" class="lab">${esc(label)}</td>
      <td class="num">${esc(value)}</td>
    </tr>`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bill ${esc(b.billNumber)}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #000; background: #cfd8e3; font-size: 12px; }
    .toolbar {
      position: sticky; top: 0; z-index: 20;
      display: flex; justify-content: space-between; align-items: center;
      background: #111; color: #fff; padding: 10px 16px;
    }
    .toolbar button {
      border: 0; border-radius: 4px; padding: 7px 14px; font-weight: 700; cursor: pointer;
      background: #2563eb; color: #fff;
    }
    .toolbar .close { background: #444; margin-left: 8px; }
    .sheet {
      width: 210mm; min-height: 297mm; margin: 14px auto; background: #fff;
      padding: 8mm 10mm 12mm; box-shadow: 0 8px 24px rgba(0,0,0,.18);
    }

    /* ===== HEADER: one outer box ===== */
    .hdr {
      border: 1px solid #000;
      margin-bottom: 0;
    }
    .hdr .co {
      text-align: center; padding: 10px 12px 6px;
    }
    .hdr .co-name {
      margin: 0; font-size: 22px; font-weight: 700; color: #000;
    }
    .hdr .co-addr {
      margin: 4px 0 0; font-size: 12px; font-weight: 700; color: #000;
    }
    .hdr .party {
      display: grid; grid-template-columns: 1.35fr 1fr;
      border-top: 1px solid #000;
    }
    .hdr .left {
      padding: 8px 10px; border-right: 1px solid #000; font-size: 12px; line-height: 1.45;
    }
    .hdr .right { padding: 8px 10px; font-size: 12px; line-height: 1.45; }
    .hdr .row { display: grid; grid-template-columns: 110px 1fr; gap: 4px; margin-bottom: 3px; }
    .hdr .k { font-weight: 700; white-space: nowrap; }
    .hdr .v { font-weight: 600; word-break: break-word; }
    .hdr .subj {
      border-top: 1px solid #000;
      background: #b8c0c8;
      padding: 6px 10px;
      font-size: 12px; font-weight: 700;
      text-align: left;
    }

    /* ===== LINES TABLE ===== */
    table.lines { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 0; }
    table.lines th, table.lines td {
      border: 1px solid #000; padding: 4px 5px; vertical-align: middle; height: 22px;
    }
    table.lines th {
      background: #4a5560; color: #fff; font-weight: 700; text-align: center; font-size: 11.5px;
    }
    table.lines td.c { text-align: center; }
    table.lines td.num { text-align: right; white-space: nowrap; }
    table.lines tr.empty td { height: 22px; }
    table.lines tr.sum td { height: 22px; }
    table.lines tr.sum td.lab { text-align: right; padding-right: 10px; font-weight: 600; white-space: nowrap; }
    table.lines tr.sum.bold td { font-weight: 700; }

    .remark { margin: 10px 0 0; font-size: 12.5px; font-weight: 600; }
    .spacer { height: 48px; }

    /* ===== FOOTER BOX ===== */
    .foot {
      display: grid; grid-template-columns: 1.2fr 1fr; border: 1px solid #000;
      min-height: 108px;
    }
    .foot .bank { padding: 10px 12px; border-right: 1px solid #000; font-size: 12px; line-height: 1.6; }
    .foot .bank .row { display: grid; grid-template-columns: 92px 1fr; gap: 4px; }
    .foot .bank .k { font-weight: 700; }
    .foot .sign { padding: 10px 14px; text-align: right; }
    .foot .sign .for { font-weight: 700; font-size: 13px; }
    .foot .sign .sig { margin-top: 56px; font-size: 12px; font-weight: 600; }

    @media print {
      body { background: #fff; }
      .toolbar { display: none !important; }
      .sheet { margin: 0; box-shadow: none; width: auto; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <strong>Ateka Road Carrier Bill · ${esc(b.billNumber)}</strong>
    <div>
      <button type="button" onclick="window.print()">Print</button>
      <button class="close" type="button" onclick="window.close()">Close</button>
    </div>
  </div>
  <div class="sheet">
    <div class="hdr">
      <div class="co">
        <h1 class="co-name">${esc(co.name)}</h1>
        <p class="co-addr">${esc(addr)}</p>
      </div>
      <div class="party">
        <div class="left">
          <div class="row"><span class="k">Customer Name :</span><span class="v">${esc(b.customerName || "")}</span></div>
          <div class="row"><span class="k">Address :</span><span class="v">${esc(b.partyAddress || b.city || "")}</span></div>
          <div class="row"><span class="k">GST :</span><span class="v">${esc(b.customerGstin || "")}</span></div>
        </div>
        <div class="right">
          <div class="row"><span class="k">Bill No :</span><span class="v">${esc(b.billNumber)}</span></div>
          <div class="row"><span class="k">Bill Date :</span><span class="v">${esc(b.billDate)}</span></div>
          <div class="row"><span class="k">Sac Code :</span><span class="v">${esc(sac)}</span></div>
        </div>
      </div>
      <div class="subj">We Here by Submit Our Freight Bill For Transportation of Your Goods from as Under.</div>
    </div>

    <table class="lines">
      <thead>
        <tr>
          <th style="width:13%">Docket No</th>
          <th style="width:11%">Docket Dt.</th>
          <th style="width:12%">Vehicle No</th>
          <th>Particular</th>
          <th style="width:9%">Weight</th>
          <th style="width:9%">Rate</th>
          <th style="width:12%">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${dataRows}
        ${emptyRows}
        ${sumRow("Amount", amt(amount))}
        ${sumRow("Advance Amount", amt(advance))}
        ${sumRow("Total Amount", amt(amount), true)}
        ${sumRow("Total Bill Amount", amt(billAmount), true)}
        ${sumRow("Total Advance Amount", amt(advance), true)}
        ${sumRow("Total Balance Amount", amt(balance), true)}
      </tbody>
    </table>

    <div class="remark">Remark : ${esc(b.remark || "OK")}</div>
    <div class="spacer"></div>

    <div class="foot">
      <div class="bank">
        <div class="row"><span class="k">Pan No :</span><span>${esc(co.pan)}</span></div>
        <div class="row"><span class="k">Bank Name :</span><span>${esc(co.bankName)}</span></div>
        <div class="row"><span class="k">A/C No :</span><span>${esc(co.accountNo)}</span></div>
        <div class="row"><span class="k">IFSC Code :</span><span>${esc(co.ifsc)}</span></div>
      </div>
      <div class="sign">
        <div class="for">For ${esc(co.name)}</div>
        <div class="sig">Authorised Singnature</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  openPrintWindow(b.billNumber || "Road Carrier Bill", html);
}

/** Resolve print format — Road Carrier before generic "Ateka" so ARC bills are not misrouted. */
export function resolveBillFormat(bill: any, format?: string | null): BillFormat {
  const raw = String(format || bill?.billFormat || "").trim();
  const billNo = String(bill?.billNumber || "").toUpperCase();
  const dockets = [
    ...(Array.isArray(bill?.consignments) ? bill.consignments : []),
    ...(Array.isArray(bill?.lineItems) ? bill.lineItems.map((l: any) => l.docketNo) : [])
  ]
    .map((d) => String(d || "").toUpperCase())
    .filter(Boolean);

  const looksRoadCarrier =
    /road\s*carrier/i.test(raw) ||
    /^BLARC/i.test(billNo) ||
    dockets.some((d) => /^ARC\d/i.test(d));

  if (looksRoadCarrier || /road\s*carrier/i.test(raw)) {
    return "Ateka Road Carrier Bill Format";
  }
  if (/thermal/i.test(raw)) return "Thermal Format";
  if (/standard/i.test(raw)) return "Standard Bill Format";
  if (/e-?invoice|formate/i.test(raw)) return "E-Invoice Bill Formate";
  if (/ateka/i.test(raw)) return "Ateka Bill Format";
  return "Ateka Bill Format";
}

export async function printCustomerBill(bill: any, format?: string | null) {
  const enriched = await enrichBillForPrint(bill);
  const f = resolveBillFormat(enriched, format);

  if (f === "Ateka Road Carrier Bill Format") return printAtekaRoadCarrierFormat(enriched);
  if (f === "Thermal Format") return printThermalFormat(enriched);
  if (f === "Standard Bill Format") return printStandardFormat(enriched);
  if (f === "E-Invoice Bill Formate") return printEInvoiceFormat(enriched);
  return printAtekaFormat(enriched);
}
