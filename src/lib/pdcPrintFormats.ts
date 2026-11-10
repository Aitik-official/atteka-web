import { escapeHtml, printDocumentSheet } from "@/lib/printEngine";

const PDC_CSS = `
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; font-size: 12px; background: #e2e8f0; }
  .toolbar { position: sticky; top: 0; z-index: 50; display: flex; justify-content: space-between; align-items: center; gap: 12px; background: #0f172a; color: #fff; padding: 10px 16px; }
  .toolbar button { border: 0; border-radius: 6px; padding: 7px 14px; font-weight: 700; cursor: pointer; font-size: 12px; }
  .toolbar .print { background: #0171d3; color: #fff; }
  .toolbar .close { background: #334155; color: #fff; }
  .sheet { width: 210mm; max-width: 100%; margin: 16px auto; background: #fff; border: 1px solid #94a3b8; }
  .hdr { display: flex; justify-content: space-between; gap: 16px; padding: 14px 16px; border-bottom: 1px solid #94a3b8; }
  .brand-row { display: flex; align-items: center; gap: 12px; }
  .logo { width: 52px; height: 52px; border-radius: 999px; background: #0171d3; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; }
  .brand { font-size: 18px; font-weight: 900; letter-spacing: 0.02em; }
  .sub { font-size: 10px; color: #64748b; text-transform: uppercase; margin-top: 2px; }
  .meta { border-collapse: collapse; font-size: 11px; min-width: 220px; }
  .meta td { border: 1px solid #64748b; padding: 4px 8px; }
  .meta td.k { font-weight: 700; background: #f8fafc; white-space: nowrap; }
  .title { background: #f1f5f9; border-bottom: 1px solid #94a3b8; text-align: center; font-weight: 800; padding: 6px; font-size: 13px; }
  .info { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; padding: 8px 16px; border-bottom: 1px solid #94a3b8; font-size: 11px; }
  .sec { background: #0171d3; color: #fff; text-align: center; font-weight: 800; font-size: 12px; padding: 6px; letter-spacing: 0.04em; }
  table.lines { width: 100%; border-collapse: collapse; font-size: 11px; }
  table.lines th, table.lines td { border: 1px solid #94a3b8; padding: 6px 8px; text-align: left; vertical-align: top; }
  table.lines th { background: #f8fafc; font-size: 10px; }
  .c { text-align: center; }
  .r { text-align: right; font-variant-numeric: tabular-nums; }
  .tot { background: #f8fafc; font-weight: 700; }
  .foot { padding: 12px 16px; font-size: 11px; line-height: 1.6; border-top: 1px solid #94a3b8; }
  .sign { margin: 24px 16px 16px; border: 1px solid #64748b; min-height: 72px; position: relative; }
  .sign span { position: absolute; top: -8px; left: 10px; background: #fff; padding: 0 6px; font-size: 10px; font-weight: 700; color: #475569; }
  @media print {
    body { background: #fff; }
    .toolbar { display: none !important; }
    .sheet { width: 100%; margin: 0; border: 0; }
  }
`;

type DeliveryLine = {
  srNo: number;
  docketNo: string;
  consigneeName: string;
  pkgsLoad: number;
  pkgsTotal: number;
  weightLoad: number;
  weightTotal: number;
  delivered: boolean;
  stampSign: boolean;
};

type PickupLine = {
  srNo: number;
  docketNo: string;
  consignorName: string;
  pkgsLoad: number;
  pkgsTotal: number;
  weightLoad: number;
  weightTotal: number;
  picked: boolean;
  stampSign: boolean;
};

export type DeliveryPdcPrint = {
  pdcNo: string;
  manualPdcNo: string;
  vehicleNo: string;
  pdcDateLabel: string;
  pdcBranch: string;
  mode: string;
  driverLicenseNo?: string;
  preparedBy: string;
  preparedAt: string;
  preparedOn: string;
  vendor: string;
  fromLocation: string;
  deliveryLocation: string;
  distance: number;
  driverName?: string;
  remark?: string;
  lines: DeliveryLine[];
};

export type PickupPdcPrint = {
  pdcNo: string;
  manualPdcNo: string;
  vehicleNo: string;
  pdcDateLabel: string;
  pdcBranch: string;
  mode: string;
  driverLicenseNo?: string;
  preparedBy: string;
  preparedAt: string;
  preparedOn: string;
  vendor: string;
  fromLocation: string;
  toLocation: string;
  distance: number;
  driverName?: string;
  remark?: string;
  lines: PickupLine[];
};

function yn(v: boolean) {
  return v ? "Yes" : "No";
}

function metaTable(rows: [string, string][]) {
  return `<table class="meta"><tbody>${rows
    .map(
      ([k, v]) =>
        `<tr><td class="k">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`
    )
    .join("")}</tbody></table>`;
}

function headerBlock(kind: string, meta: [string, string][]) {
  return `
    <div class="hdr">
      <div class="brand-row">
        <div class="logo">AL</div>
        <div>
          <div class="brand">ATEKA LOGISTICS</div>
          <div class="sub">${escapeHtml(kind)}</div>
        </div>
      </div>
      ${metaTable(meta)}
    </div>`;
}

export function printDeliveryPdcDocument(detail: DeliveryPdcPrint, autoPrint = true) {
  const pkgLoad = detail.lines.reduce((s, l) => s + l.pkgsLoad, 0);
  const pkgTotal = detail.lines.reduce((s, l) => s + l.pkgsTotal, 0);
  const wtLoad = detail.lines.reduce((s, l) => s + l.weightLoad, 0);
  const wtTotal = detail.lines.reduce((s, l) => s + l.weightTotal, 0);

  const lineRows = detail.lines
    .map(
      (l) => `<tr>
        <td class="c">${l.srNo}</td>
        <td>${escapeHtml(l.docketNo)}</td>
        <td>${escapeHtml(l.consigneeName)}</td>
        <td class="c">${l.pkgsLoad}/${l.pkgsTotal}</td>
        <td class="r">${l.weightLoad}/${l.weightTotal.toFixed(1)}</td>
        <td class="c">${yn(l.delivered)}</td>
        <td class="c">${yn(l.stampSign)}</td>
      </tr>`
    )
    .join("");

  const html = `
    ${headerBlock("Delivery PDC", [
      ["PDC No", detail.pdcNo],
      ["Manual PDC No", detail.manualPdcNo],
      ["PDC Date", detail.pdcDateLabel],
      ["Mode", detail.mode]
    ])}
    <div class="title">PDC - Delivery</div>
    <div class="info">
      <div><strong>PDC Branch:</strong> ${escapeHtml(detail.preparedAt || detail.pdcBranch)}</div>
      <div><strong>Vehicle No.:</strong> ${escapeHtml(detail.vehicleNo)}</div>
      <div><strong>Driver License No:</strong> ${escapeHtml(detail.driverLicenseNo || "")}</div>
    </div>
    <div class="sec">Delivery PDC Details</div>
    <table class="lines">
      <thead>
        <tr>
          <th>Sr.no</th><th>Docket No.</th><th>Consignee Name</th>
          <th>No. of Packages</th><th>Total Weight</th><th>Delivered</th><th>Stamp/Sign</th>
        </tr>
      </thead>
      <tbody>
        ${lineRows}
        <tr class="tot">
          <td colspan="3">Total</td>
          <td class="c">${pkgLoad}/${pkgTotal}</td>
          <td class="r">${wtLoad}/${wtTotal.toFixed(1)}</td>
          <td colspan="2"></td>
        </tr>
      </tbody>
    </table>
    <div class="foot">
      <div><strong>Prepared By:</strong> ${escapeHtml(detail.preparedBy)} | <strong>At:</strong> ${escapeHtml(detail.preparedAt)} | <strong>ON:</strong> ${escapeHtml(detail.preparedOn)}</div>
      <div><strong>Vendor:</strong> ${escapeHtml(detail.vendor)}</div>
      <div><strong>From Location:</strong> ${escapeHtml(detail.fromLocation)} | <strong>Delivery Location:</strong> ${escapeHtml(detail.deliveryLocation)} | <strong>Distance:</strong> ${detail.distance.toFixed(2)}</div>
      <div><strong>Driver Name:</strong> ${escapeHtml(detail.driverName || "-")} | <strong>Remark:</strong> ${escapeHtml(detail.remark || "")}</div>
    </div>
    <div class="sign"><span>Ateka Logistics Sign</span></div>
  `;

  printDocumentSheet(`Delivery PDC ${detail.pdcNo}`, PDC_CSS, html, autoPrint);
}

export function printPickupPdcDocument(detail: PickupPdcPrint, autoPrint = true) {
  const pkgLoad = detail.lines.reduce((s, l) => s + l.pkgsLoad, 0);
  const pkgTotal = detail.lines.reduce((s, l) => s + l.pkgsTotal, 0);
  const wtLoad = detail.lines.reduce((s, l) => s + l.weightLoad, 0);
  const wtTotal = detail.lines.reduce((s, l) => s + l.weightTotal, 0);

  const lineRows = detail.lines
    .map(
      (l) => `<tr>
        <td class="c">${l.srNo}</td>
        <td>${escapeHtml(l.docketNo)}</td>
        <td>${escapeHtml(l.consignorName)}</td>
        <td class="c">${l.pkgsLoad}/${l.pkgsTotal}</td>
        <td class="r">${l.weightLoad}/${l.weightTotal.toFixed(1)}</td>
        <td class="c">${yn(l.picked)}</td>
        <td class="c">${yn(l.stampSign)}</td>
      </tr>`
    )
    .join("");

  const html = `
    ${headerBlock("Pickup PDC", [
      ["PDC No", detail.pdcNo],
      ["Manual PDC No", detail.manualPdcNo],
      ["PDC Date", detail.pdcDateLabel],
      ["Mode", detail.mode]
    ])}
    <div class="title">PDC - Pickup</div>
    <div class="info">
      <div><strong>PDC Branch:</strong> ${escapeHtml(detail.preparedAt || detail.pdcBranch)}</div>
      <div><strong>Vehicle No.:</strong> ${escapeHtml(detail.vehicleNo)}</div>
      <div><strong>Driver License No:</strong> ${escapeHtml(detail.driverLicenseNo || "")}</div>
    </div>
    <div class="sec">Pickup PDC Details</div>
    <table class="lines">
      <thead>
        <tr>
          <th>Sr.no</th><th>Docket No.</th><th>Consignor Name</th>
          <th>No. of Packages</th><th>Total Weight</th><th>Picked</th><th>Stamp/Sign</th>
        </tr>
      </thead>
      <tbody>
        ${lineRows}
        <tr class="tot">
          <td colspan="3">Total</td>
          <td class="c">${pkgLoad}/${pkgTotal}</td>
          <td class="r">${wtLoad}/${wtTotal.toFixed(1)}</td>
          <td colspan="2"></td>
        </tr>
      </tbody>
    </table>
    <div class="foot">
      <div><strong>Prepared By:</strong> ${escapeHtml(detail.preparedBy)} | <strong>At:</strong> ${escapeHtml(detail.preparedAt)} | <strong>ON:</strong> ${escapeHtml(detail.preparedOn)}</div>
      <div><strong>Vendor:</strong> ${escapeHtml(detail.vendor)}</div>
      <div><strong>From Location:</strong> ${escapeHtml(detail.fromLocation)} | <strong>To Location:</strong> ${escapeHtml(detail.toLocation)} | <strong>Distance:</strong> ${detail.distance.toFixed(2)}</div>
      <div><strong>Driver Name:</strong> ${escapeHtml(detail.driverName || "-")} | <strong>Remark:</strong> ${escapeHtml(detail.remark || "")}</div>
    </div>
    <div class="sign"><span>Ateka Logistics Sign</span></div>
  `;

  printDocumentSheet(`Pickup PDC ${detail.pdcNo}`, PDC_CSS, html, autoPrint);
}

/** Print only a results table (not the dashboard shell). */
export function printResultsTable(title: string, headers: string[], rows: string[][]) {
  const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
  const body = rows
    .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`)
    .join("");
  const css = `
    @page { size: A4 landscape; margin: 8mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; background: #e2e8f0; color: #111; }
    .toolbar { position: sticky; top: 0; z-index: 50; display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: #fff; padding: 10px 16px; }
    .toolbar button { border: 0; border-radius: 6px; padding: 7px 14px; font-weight: 700; cursor: pointer; font-size: 12px; }
    .toolbar .print { background: #0171d3; color: #fff; }
    .toolbar .close { background: #334155; color: #fff; }
    .sheet { margin: 16px; background: #fff; padding: 12px; border: 1px solid #cbd5e1; }
    h1 { font-size: 14px; margin: 0 0 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #94a3b8; padding: 5px 7px; text-align: left; }
    th { background: #f1f5f9; }
    @media print { body { background: #fff; } .toolbar { display: none !important; } .sheet { margin: 0; border: 0; padding: 0; } }
  `;
  const html = `<h1>${escapeHtml(title)}</h1><table><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td colspan="${Math.max(headers.length, 1)}">No data available in table</td></tr>`}</tbody></table>`;
  printDocumentSheet(title, css, html, true);
}
