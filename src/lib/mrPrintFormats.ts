/**
 * Money Receipt print format — matches client Bill MR PDF (Ateka Road Carrier layout).
 */

function absoluteAsset(path: string) {
  if (typeof window === "undefined") return path;
  try {
    return new URL(path, window.location.origin).toString();
  } catch {
    return path;
  }
}

function esc(val: any): string {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inr(val: number): string {
  return Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
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

export type MrPrintPayload = {
  mrNumber: string;
  mrDate?: string | Date;
  mrBranch?: string;
  partyCode?: string;
  customerCode?: string;
  partyName?: string;
  customerName?: string;
  partyAddress?: string;
  remark?: string;
  remarks?: string;
  payment?: {
    mode?: string;
    chequeNeftNo?: string;
    chequeDate?: string;
    chequeAmount?: number;
    depositedAccount?: string;
    bankName?: string;
  };
  paymentMode?: string;
  referenceNumber?: string;
  totalReceived?: number;
  billLines?: any[];
  allocatedBills?: any[];
  deductionLines?: any[];
  meta?: Record<string, any>;
};

function branchLabel(branch?: string) {
  const code = String(branch || "ALC1").trim() || "ALC1";
  return `${code} - Ateka Logistics`;
}

function partyCodeOf(mr: MrPrintPayload) {
  return String(mr.partyCode || mr.customerCode || "").trim();
}

function partyNameOf(mr: MrPrintPayload) {
  const raw = String(mr.partyName || mr.customerName || "").trim();
  return raw.replace(/^[^:]+:\s*/, "");
}

function normalizeLines(mr: MrPrintPayload) {
  const meta = mr.meta || {};
  const billLines = Array.isArray(mr.billLines)
    ? mr.billLines
    : Array.isArray(meta.billLines)
      ? meta.billLines
      : [];
  const allocated = Array.isArray(mr.allocatedBills) ? mr.allocatedBills : [];
  const deductions = Array.isArray(mr.deductionLines)
    ? mr.deductionLines
    : Array.isArray(meta.deductionLines)
      ? meta.deductionLines
      : [];

  if (billLines.length) {
    return billLines.map((l: any) => {
      const billAmount = Number(l.pendingAmount ?? l.billAmount ?? l.amount ?? 0);
      const tds = Number(l.tds || 0);
      const freightRebate = Number(l.freightRebate ?? l.rebate ?? 0);
      const claim = Number(l.claim || 0);
      const crNote = Number(l.crNoteAmt || l.creditNoteAmt || 0);
      const os = Number(l.unadjustedAmount || l.osAmount || 0);
      const net =
        Number(l.netRecdAmount) ||
        Number(Math.max(0, billAmount - tds - freightRebate - claim - crNote - os).toFixed(2));
      const reason =
        String(l.shortPaymentRemark || l.deductionReason || "").trim() ||
        (freightRebate || claim || tds ? "CLEAR" : "CLEAR");
      return {
        manualBill: String(l.manualBillNumber || l.billNumber || ""),
        systemBill: String(l.billNumber || ""),
        billDate: l.billDate || "",
        billAmount,
        tds,
        freightRebate,
        claim,
        crNote,
        os,
        net,
        reason
      };
    });
  }

  if (allocated.length) {
    return allocated.map((a: any) => {
      const billAmount = Number(a.amount || 0);
      const freightRebate = Number(a.rebate || 0);
      const net = Number(Math.max(0, billAmount - freightRebate).toFixed(2));
      return {
        manualBill: String(a.billNumber || ""),
        systemBill: String(a.billNumber || ""),
        billDate: "",
        billAmount,
        tds: 0,
        freightRebate,
        claim: 0,
        crNote: 0,
        os: 0,
        net,
        reason: freightRebate ? "CLEAR" : "CLEAR"
      };
    });
  }

  // fallback single row from totals
  const rebate = deductions.reduce((s: number, d: any) => s + Number(d.freightRebate || 0), 0);
  const claim = deductions.reduce((s: number, d: any) => s + Number(d.claimDeduction || 0), 0);
  const net = Number(mr.totalReceived || 0);
  const billAmount = net + rebate + claim;
  return [
    {
      manualBill: "",
      systemBill: "",
      billDate: "",
      billAmount,
      tds: 0,
      freightRebate: rebate,
      claim,
      crNote: 0,
      os: 0,
      net,
      reason: "CLEAR"
    }
  ];
}

function openPrintWindow(title: string, html: string) {
  // Blob URL avoids about:blank + noopener write failures in Chrome
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "width=1100,height=1200");
  if (win) {
    try {
      win.focus();
    } catch {
      // ignore
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  // Popup blocked — show as full-page iframe overlay
  const frameId = "atteka-mr-print-frame";
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

/** Classic Money Receipt PDF layout (Image 5). */
export function printMoneyReceipt(mr: MrPrintPayload) {
  const logoUrl = absoluteAsset("/images/atteka_logo-removebg-preview.png");
  const meta = mr.meta || {};
  const payment = mr.payment || meta.payment || {};
  const lines = normalizeLines(mr);
  const mrDate = formatDate(mr.mrDate);
  const chequeNo = String(payment.chequeNeftNo || mr.referenceNumber || "").trim();
  const chequeDate = formatDate(payment.chequeDate || mr.mrDate);
  const chequeAmt = Number(
    payment.chequeAmount ??
      mr.totalReceived ??
      lines.reduce((s, l) => s + l.net, 0)
  );
  const remark = String(mr.remark || mr.remarks || meta.remark || "").trim() || "OK";
  const branch = String(mr.mrBranch || meta.mrBranch || "ALC1");

  const totBill = lines.reduce((s, l) => s + l.billAmount, 0);
  const totTds = lines.reduce((s, l) => s + l.tds, 0);
  const totReb = lines.reduce((s, l) => s + l.freightRebate, 0);
  const totClaim = lines.reduce((s, l) => s + l.claim, 0);
  const totCr = lines.reduce((s, l) => s + l.crNote, 0);
  const totOs = lines.reduce((s, l) => s + l.os, 0);
  const totNet = lines.reduce((s, l) => s + l.net, 0);

  const rowHtml = lines
    .map((l) => {
      const sysBill = l.billDate
        ? `${esc(l.systemBill)}<div class="sub">${esc(formatDate(l.billDate))}</div>`
        : esc(l.systemBill);
      return `<tr>
        <td>${esc(l.manualBill)}</td>
        <td>${sysBill}</td>
        <td class="num">${inr(l.billAmount)}</td>
        <td class="num">${inr(l.tds)}</td>
        <td class="num">${inr(l.freightRebate)}</td>
        <td class="num">${inr(l.claim)}</td>
        <td class="num">${inr(l.crNote)}</td>
        <td class="num">${inr(l.os)}</td>
        <td class="num">${inr(l.net)}</td>
        <td>${esc(l.reason)}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Money Receipt ${esc(mr.mrNumber)}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; color: #111; background: #e2e8f0; }
    .toolbar {
      position: sticky; top: 0; z-index: 20;
      display: flex; justify-content: space-between; align-items: center;
      background: #0f172a; color: #fff; padding: 10px 16px;
    }
    .toolbar strong { font-size: 13px; }
    .toolbar button {
      border: 0; border-radius: 6px; padding: 7px 14px; font-weight: 700; cursor: pointer;
    }
    .toolbar .print { background: #2563eb; color: #fff; }
    .toolbar .close { background: #334155; color: #fff; margin-left: 8px; }
    .sheet {
      width: 277mm; min-height: 190mm; margin: 16px auto; background: #fff;
      padding: 14mm 16mm 16mm; box-shadow: 0 10px 30px rgba(15,23,42,.18);
    }
    /* 1) Logo block — alone at top */
    .logo-block {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; margin: 0 0 22px; padding-bottom: 16px;
      border-bottom: 1px solid #cbd5e1;
    }
    .logo-block img { width: 96px; height: auto; object-fit: contain; display: block; margin: 0 auto 10px; }
    .logo-block .brand-name {
      font-size: 20px; font-weight: 800; letter-spacing: .03em; color: #0b3d6e; margin: 0;
    }
    .logo-block .doc-title {
      margin-top: 6px; font-size: 12px; font-weight: 700; color: #64748b; letter-spacing: .08em;
      text-transform: uppercase;
    }
    /* 2) Meta table */
    .meta-table {
      width: 100%; border-collapse: collapse; font-size: 12.5px;
      margin: 0 0 22px;
    }
    .meta-table td { border: 1px solid #222; padding: 8px 10px; vertical-align: middle; }
    .meta-table .k { font-weight: 700; white-space: nowrap; width: 1%; background: #f8fafc; }
    .meta-table .v { font-weight: 600; }
    /* 3) Other details */
    .narrative {
      margin: 0 0 10px; font-size: 13px; line-height: 1.55;
    }
    .narrative b { font-weight: 700; }
    .remarks { margin: 0 0 20px; font-size: 13px; }
    .remarks .lab { font-weight: 700; }
    table.lines { width: 100%; border-collapse: collapse; font-size: 11.5px; margin: 0 0 18px; }
    table.lines th, table.lines td { border: 1px solid #222; padding: 7px 8px; vertical-align: top; }
    table.lines th {
      background: #f1f5f9; font-weight: 700; text-align: center; font-size: 11px;
    }
    table.lines td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    table.lines .sub { font-size: 10px; color: #334155; margin-top: 2px; }
    table.lines tr.tot td { font-weight: 700; background: #f8fafc; }
    .words { margin: 4px 0 22px; font-size: 13px; line-height: 1.5; }
    .foot {
      display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
      margin-top: 8px; padding-top: 8px; font-size: 12.5px; align-items: start;
    }
    .note { color: #111; padding-top: 4px; }
    .sign { text-align: right; padding-right: 8px; min-height: 72px; }
    .sign .for { margin-bottom: 48px; }
    .copy {
      text-align: center; margin-top: 36px; padding-top: 16px;
      border-top: 1px dashed #94a3b8;
      font-size: 13px; font-weight: 700; letter-spacing: .06em; color: #334155;
    }
    @media print {
      body { background: #fff; }
      .toolbar { display: none !important; }
      .sheet { margin: 0; box-shadow: none; width: auto; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <strong>Money Receipt · ${esc(mr.mrNumber)}</strong>
    <div>
      <button class="print" onclick="window.print()">Print</button>
      <button class="close" onclick="window.close()">Close</button>
    </div>
  </div>
  <div class="sheet">
    <!-- 1. Logo on top -->
    <div class="logo-block">
      <img src="${esc(logoUrl)}" alt="Ateka Logistics" />
      <div class="brand-name">Ateka Logistics</div>
      <div class="doc-title">Money Receipt</div>
    </div>

    <!-- 2. Header / details table -->
    <table class="meta-table">
      <tr>
        <td class="k">MR No</td>
        <td class="v">${esc(mr.mrNumber)}</td>
        <td class="k">Branch</td>
        <td class="v">${esc(branchLabel(branch))}</td>
      </tr>
      <tr>
        <td class="k">Customer Code No</td>
        <td class="v">${esc(partyCodeOf(mr))}</td>
        <td class="k">Dt.</td>
        <td class="v">${esc(mrDate)}</td>
      </tr>
      <tr>
        <td class="k">Customer Name</td>
        <td class="v" colspan="3">${esc(partyNameOf(mr))}</td>
      </tr>
    </table>

    <!-- 3. Remaining content -->
    <div class="narrative">
      Received with thanks Cheque/D.D. No.
      <b>${esc(chequeNo || "—")}</b>
      Dated <b>${esc(chequeDate || "—")}</b>
      on of Rs. <b>${esc(String(Math.round(chequeAmt)))}</b>
      details given below :-
    </div>
    <div class="remarks"><span class="lab">Remarks :</span> ${esc(remark)}</div>

    <table class="lines">
      <thead>
        <tr>
          <th>Manual Bill</th>
          <th>System Bill</th>
          <th>Bill Amount</th>
          <th>TDS</th>
          <th>Freight Rebate</th>
          <th>Claim</th>
          <th>Cr.Note Amt</th>
          <th>O/S Amount</th>
          <th>Net Recd. Amount</th>
          <th>Deduction Reason</th>
        </tr>
      </thead>
      <tbody>
        ${rowHtml}
        <tr class="tot">
          <td colspan="2">Net Total</td>
          <td class="num">${inr(totBill)}</td>
          <td class="num">${inr(totTds)}</td>
          <td class="num">${inr(totReb)}</td>
          <td class="num">${inr(totClaim)}</td>
          <td class="num">${inr(totCr)}</td>
          <td class="num">${inr(totOs)}</td>
          <td class="num">${inr(totNet)}</td>
          <td></td>
        </tr>
        <tr class="tot">
          <td colspan="8">Gross Total</td>
          <td class="num">${inr(totNet)}</td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <div class="words"><b>Rs. (in Words) :</b> ${esc(amountInWords(totNet))}</div>

    <div class="foot">
      <div class="note">Note : Cheque/D. D. are subject to Reliasation</div>
      <div class="sign">
        <div class="for">for <b>Ateka Logistics</b></div>
      </div>
    </div>
    <div class="copy">CUSTOMER COPY</div>
  </div>
</body>
</html>`;

  openPrintWindow(`Money Receipt ${mr.mrNumber}`, html);
}

/** Build printable payload from a list/API MR row (+ optional full document). */
export function mrRowToPrintPayload(row: any): MrPrintPayload {
  const meta = row.meta || {};
  return {
    mrNumber: row.mrNumber || row.mrNo || "",
    mrDate: row.mrDateIso || row.mrDate || meta.mrDate,
    mrBranch: row.mrLocation || row.mrBranch || meta.mrBranch || "ALC1",
    partyCode: row.customerCode || row.partyCode || meta.partyCode || "",
    customerCode: row.customerCode || row.partyCode || "",
    partyName: row.customerName || row.partyName || "",
    customerName: row.customerName || row.partyName || "",
    remark: row.remarks || row.remark || meta.remark || "",
    remarks: row.remarks || row.remark || "",
    payment: meta.payment || {
      mode: row.paymentMode,
      chequeNeftNo: row.referenceNumber,
      chequeAmount: row.netAmount || row.totalReceived,
      chequeDate: row.mrDateIso || row.mrDate
    },
    paymentMode: row.paymentMode,
    referenceNumber: row.referenceNumber,
    totalReceived: row.netAmount ?? row.totalReceived,
    billLines: meta.billLines || row.billLines,
    allocatedBills: row.allocatedBills || [],
    deductionLines: meta.deductionLines || row.deductionLines,
    meta
  };
}
