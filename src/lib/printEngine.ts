/**
 * Atteka Multi-Format Print Engine
 * Supports:
 * 1. 3-Inch Thermal POS Receipt (80mm counter paper roll)
 * 2. 80-Column Dot-Matrix Continuous Tractor Feed
 * 3. Laser A4 Professional Consignment Note with Code128 Barcodes
 * 4. Customer Tax Invoices & PDC Manifests
 */

import JsBarcode from "jsbarcode";
import { toast } from "@/lib/toastBus";

const A4_CSS = `
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; font-size: 12px; background: #f8fafc; }
  .toolbar { position: sticky; top: 0; z-index: 50; display: flex; justify-content: space-between; align-items: center; gap: 12px; background: #0f172a; color: #fff; padding: 10px 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
  .toolbar button { border: 0; border-radius: 6px; padding: 7px 14px; font-weight: 700; cursor: pointer; font-size: 12px; }
  .toolbar .print { background: #2563eb; color: #fff; }
  .toolbar .print:hover { background: #1d4ed8; }
  .toolbar .close { background: #334155; color: #fff; }
  .sheet { width: 210mm; min-height: 297mm; margin: 16px auto; background: #fff; padding: 12mm; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; border-radius: 8px; }
  .letterhead { display: flex; justify-content: space-between; gap: 16px; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 12px; }
  .brand { font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; }
  .muted { color: #64748b; font-size: 10px; line-height: 1.4; }
  .doc-title { text-align: right; }
  .doc-title .tag { display: inline-block; background: #2563eb; color: #fff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px; }
  .doc-title h1 { margin: 4px 0 0; font-size: 16px; font-family: monospace; color: #1e293b; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; font-size: 11px; }
  th { background: #f8fafc; font-size: 10px; text-transform: uppercase; font-weight: 700; color: #475569; }
  .num { text-align: right; font-variant-numeric: tabular-nums; font-family: monospace; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0; }
  .box { border: 1px solid #cbd5e1; padding: 8px; border-radius: 6px; background: #fff; }
  .label { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
  .totals { margin-top: 8px; width: 280px; margin-left: auto; }
  .footer { margin-top: 14px; border-top: 1px dashed #94a3b8; padding-top: 6px; font-size: 9px; color: #64748b; }
  .barcode-wrap { text-align: right; margin-top: 4px; }
  .barcode-wrap svg { max-height: 40px; }
  @media print {
    body { background: #fff; }
    .toolbar { display: none !important; }
    .sheet { width: 100%; margin: 0; padding: 0; box-shadow: none; border: 0; }
  }
`;

const THERMAL_CSS = `
  @page { size: 80mm auto; margin: 2mm; }
  * { box-sizing: border-box; }
  body { font-family: "Courier New", Courier, monospace; color: #000; margin: 0; font-size: 11px; background: #f1f5f9; }
  .toolbar { position: sticky; top: 0; z-index: 50; display: flex; justify-content: space-between; align-items: center; gap: 8px; background: #0f172a; color: #fff; padding: 8px 12px; }
  .toolbar button { border: 0; border-radius: 4px; padding: 6px 12px; font-weight: 700; cursor: pointer; font-size: 11px; }
  .toolbar .print { background: #2563eb; color: #fff; }
  .toolbar .close { background: #475569; color: #fff; }
  .sheet { width: 78mm; margin: 12px auto; background: #fff; padding: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px dashed #94a3b8; }
  .brand { text-align: center; font-weight: bold; font-size: 14px; border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 6px; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .line { border-bottom: 1px dashed #000; margin: 5px 0; }
  .row { display: flex; justify-content: space-between; margin: 2px 0; }
  .barcode { text-align: center; margin: 6px 0; }
  .barcode svg { width: 100%; max-height: 38px; }
  @media print {
    body { background: #fff; }
    .toolbar { display: none !important; }
    .sheet { width: 100%; margin: 0; padding: 0; box-shadow: none; border: 0; }
  }
`;

const DOT_MATRIX_CSS = `
  @page { size: 215mm 140mm; margin: 5mm; }
  * { box-sizing: border-box; }
  body { font-family: "Lucida Console", "Courier New", monospace; color: #000; margin: 0; font-size: 11px; background: #f8fafc; }
  .toolbar { position: sticky; top: 0; z-index: 50; display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: #fff; padding: 8px 12px; }
  .toolbar button { border: 0; border-radius: 4px; padding: 6px 12px; font-weight: bold; cursor: pointer; }
  .toolbar .print { background: #2563eb; color: #fff; }
  .toolbar .close { background: #475569; color: #fff; }
  .sheet { width: 210mm; margin: 12px auto; background: #fff; padding: 8mm; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border: 1px solid #cbd5e1; }
  .header { display: flex; justify-content: space-between; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0; }
  th, td { border-bottom: 1px dashed #666; padding: 3px 4px; text-align: left; font-size: 10px; }
  th { text-transform: uppercase; border-top: 1px solid #000; border-bottom: 1px solid #000; }
  .num { text-align: right; }
  @media print {
    body { background: #fff; }
    .toolbar { display: none !important; }
    .sheet { width: 100%; margin: 0; padding: 0; box-shadow: none; border: 0; }
  }
`;

function renderSvgBarcode(text: string): string {
  try {
    if (typeof document !== "undefined") {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      JsBarcode(svg, text, {
        format: "CODE128",
        width: 1.5,
        height: 32,
        displayValue: true,
        fontSize: 10,
        margin: 2
      });
      return svg.outerHTML;
    }
  } catch (e) {
    console.error("Barcode generation failed", e);
  }
  return `<div style="font-family:monospace;font-weight:bold;letter-spacing:2px;text-align:center;">*${escapeHtml(text)}*</div>`;
}

/** True if node looks like Copy/Excel/Print/column toolbar chrome (not data). */
function looksLikePrintToolbar(el: Element): boolean {
  if (el.querySelector("table")) return false;
  const txt = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!txt) return false;
  if (txt.includes("column visibility") || txt.includes("card view")) return true;
  if (txt.includes("excel") && txt.includes("print") && (txt.includes("copy") || txt.includes("column"))) {
    return true;
  }
  if (txt.includes("show") && txt.includes("entries") && el.querySelector("select")) return true;
  if (
    (txt.includes("refresh") || txt.includes("find")) &&
    txt.includes("print") &&
    txt.includes("excel") &&
    el.querySelectorAll("button").length >= 2
  ) {
    return true;
  }
  return false;
}

function isBlueNavHeader(el: Element): boolean {
  const cls = typeof (el as HTMLElement).className === "string" ? (el as HTMLElement).className : "";
  if (!/(1e88e5|0171d3|2563eb|bg-\[#)/i.test(cls) && !/\bbg-blue-600\b|\bbg-blue-700\b/.test(cls)) {
    return false;
  }
  return !el.querySelector("table");
}

export type PrintTableLayout = "auto" | "report" | "compact" | "landscape" | "dot-matrix";

function extractPrintTitle(root: HTMLElement): string {
  const h = root.querySelector("h1, h2, h3");
  if (h?.textContent?.trim()) return h.textContent.trim();
  for (const el of Array.from(root.querySelectorAll("div"))) {
    if (!isBlueNavHeader(el)) continue;
    const t = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (t && t.length < 140 && !/back|print selected/i.test(t)) return t;
  }
  return "";
}

function extractPrintMeta(root: HTMLElement): string {
  for (const el of Array.from(root.querySelectorAll("div"))) {
    if (el.querySelector("table") || looksLikePrintToolbar(el) || isBlueNavHeader(el)) continue;
    const cls = String((el as HTMLElement).className || "");
    const t = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (!t || t.length > 220) continue;
    if (
      (/e8f1fb|bg-slate-50|border-b/.test(cls) || /date|vendor|party|from|branch|period|pdc/i.test(t)) &&
      /:/.test(t)
    ) {
      return t;
    }
  }
  return "";
}

/** Clone a data table for print — no overflow wrapper, no min-width, no checkbox cols. */
function cleanTableForPrint(table: HTMLTableElement): HTMLTableElement {
  const clone = table.cloneNode(true) as HTMLTableElement;
  clone.className = "atteka-print-table";
  clone.removeAttribute("style");
  clone.style.width = "100%";
  clone.style.minWidth = "0";
  clone.style.maxWidth = "100%";
  clone.style.tableLayout = "auto";
  clone.style.borderCollapse = "collapse";

  clone.querySelectorAll("[class]").forEach((node) => {
    const el = node as HTMLElement;
    if (typeof el.className !== "string") return;
    el.className = el.className
      .split(/\s+/)
      .filter((c) => !c.startsWith("min-w") && !c.includes("overflow"))
      .join(" ");
  });

  // Drop checkbox / select-all columns
  const firstHeaderRow = clone.querySelector("thead tr");
  if (firstHeaderRow) {
    const dropIdx: number[] = [];
    Array.from(firstHeaderRow.children).forEach((cell, idx) => {
      if (cell.querySelector('input[type="checkbox"]')) dropIdx.push(idx);
      const label = (cell.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (label === "print" || label === "action" || label === "actions" || label === "select") {
        dropIdx.push(idx);
      }
    });
    const uniq = [...new Set(dropIdx)].sort((a, b) => b - a);
    clone.querySelectorAll("tr").forEach((tr) => {
      uniq.forEach((idx) => {
        const cell = tr.children[idx];
        cell?.remove();
      });
    });
  }

  clone.querySelectorAll("thead tr").forEach((tr) => {
    if (tr.querySelector("input, select, button")) tr.remove();
  });
  clone.querySelectorAll("button, input, select, textarea").forEach((n) => n.remove());

  return clone;
}

function resolveTableLayout(
  layout: PrintTableLayout | undefined,
  colCount: number
): Exclude<PrintTableLayout, "auto"> {
  if (layout && layout !== "auto") return layout;
  if (colCount >= 8) return "landscape";
  if (colCount >= 6) return "report";
  return "compact";
}

/**
 * Build printable HTML from a page root:
 * - Prefer `[data-print-body]`
 * - Else build a clean report sheet from title + meta + table(s)
 * - Else clone root and scrub chrome
 */
function buildPrintFragment(
  root: HTMLElement,
  layout: PrintTableLayout = "auto"
): { fragment: HTMLElement; layout: Exclude<PrintTableLayout, "auto"> } {
  const explicit = root.querySelector("[data-print-body]") as HTMLElement | null;
  if (explicit) {
    const frag = explicit.cloneNode(true) as HTMLElement;
    const cols = frag.querySelector("thead tr")?.children.length || 0;
    return { fragment: frag, layout: resolveTableLayout(layout, cols) };
  }

  const liveTables = Array.from(root.querySelectorAll("table")).filter((t) => {
    const el = t as HTMLElement;
    return el.getClientRects().length > 0;
  }) as HTMLTableElement[];

  if (liveTables.length > 0) {
    const wrap = document.createElement("div");
    wrap.className = "atteka-print-content atteka-print-report";

    const titleText = extractPrintTitle(root);
    if (titleText) {
      const t = document.createElement("div");
      t.className = "atteka-print-title";
      t.textContent = titleText;
      wrap.appendChild(t);
    }

    const metaText = extractPrintMeta(root);
    if (metaText) {
      const m = document.createElement("div");
      m.className = "atteka-print-meta";
      m.textContent = metaText;
      wrap.appendChild(m);
    }

    let maxCols = 0;
    for (const table of liveTables) {
      const cleaned = cleanTableForPrint(table);
      maxCols = Math.max(maxCols, cleaned.querySelector("thead tr")?.children.length || 0);
      const holder = document.createElement("div");
      holder.className = "atteka-print-table-wrap";
      holder.appendChild(cleaned);
      wrap.appendChild(holder);
    }

    const foot = document.createElement("div");
    foot.className = "atteka-print-footer";
    foot.textContent = `Printed ${new Date().toLocaleString("en-IN")} · Atteka Logistics ERP`;
    wrap.appendChild(foot);

    return { fragment: wrap, layout: resolveTableLayout(layout, maxCols) };
  }

  return {
    fragment: root.cloneNode(true) as HTMLElement,
    layout: resolveTableLayout(layout, 0)
  };
}

/** Strip toolbars, filter rows, and interactive controls from a print clone. */
function scrubPrintClone(clone: HTMLElement) {
  clone
    .querySelectorAll("[data-print-hide], .no-print, [class*='print:hidden']")
    .forEach((n) => n.remove());

  // Toolbars / show-entries bars
  Array.from(clone.querySelectorAll("div, section, header, nav")).forEach((el) => {
    if (el === clone) return;
    if (looksLikePrintToolbar(el)) {
      const nested = el.querySelectorAll("div").length;
      if (nested < 40) el.remove();
    }
  });

  // Blue module headers → plain title (when still present on full-card clones)
  Array.from(clone.querySelectorAll("div")).forEach((el) => {
    if (!isBlueNavHeader(el)) return;
    const h = el.querySelector("h1, h2, h3");
    if (h?.textContent?.trim()) {
      const t = document.createElement("h2");
      t.textContent = h.textContent.trim();
      t.setAttribute(
        "style",
        "font:700 15px/1.35 system-ui,Segoe UI,sans-serif;margin:0 0 12px;color:#0f172a;border-bottom:1px solid #cbd5e1;padding-bottom:8px;"
      );
      el.replaceWith(t);
    } else {
      el.remove();
    }
  });

  // Column filter rows in thead
  clone.querySelectorAll("thead tr").forEach((tr) => {
    if (tr.querySelector("input, select, button")) tr.remove();
  });

  // Pagination footers
  Array.from(clone.querySelectorAll("div")).forEach((el) => {
    if (el === clone || el.querySelector("table")) return;
    const txt = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    if (
      /^showing\s+\d+/.test(txt) ||
      (txt.includes("previous") && txt.includes("next") && el.querySelectorAll("button").length > 0)
    ) {
      if (el.querySelectorAll("div").length < 8) el.remove();
    }
  });

  clone.querySelectorAll("button, input, select, textarea").forEach((n) => n.remove());

  // Drop empty "Print" action columns (header says Print, cells were only buttons)
  clone.querySelectorAll("table").forEach((table) => {
    const headerCells = Array.from(table.querySelectorAll("thead tr:first-child th, thead tr:first-child td"));
    headerCells.forEach((th, idx) => {
      const label = (th.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (label !== "print" && label !== "action" && label !== "actions") return;
      table.querySelectorAll("tr").forEach((tr) => {
        const cell = tr.children[idx] as HTMLElement | undefined;
        cell?.remove();
      });
    });
  });
}

function tablePrintLayoutCss(layout: Exclude<PrintTableLayout, "auto">): string {
  const pageSize =
    layout === "landscape" || layout === "dot-matrix"
      ? "A4 landscape"
      : "A4 portrait";
  const fontSize = layout === "compact" ? "10px" : layout === "dot-matrix" ? "10.5px" : "11px";
  const cellPad = layout === "compact" ? "3px 5px" : "5px 7px";
  const titleSize = layout === "compact" ? "13px" : "16px";

  return `
    @page { size: ${pageSize}; margin: 10mm 8mm; }
    html, body {
      background: #fff !important; margin: 0 !important; padding: 0 !important;
      font-family: "Segoe UI", system-ui, sans-serif; color: #0f172a;
    }
    [data-print-hide], .no-print, [class*="print:hidden"] { display: none !important; }

    .atteka-print-toolbar {
      position: sticky; top: 0; z-index: 50; display: flex; justify-content: space-between;
      align-items: center; gap: 12px; background: #0f172a; color: #fff; padding: 10px 16px;
    }
    .atteka-print-toolbar button {
      border: 0; border-radius: 6px; padding: 7px 14px; font-weight: 700; cursor: pointer; font-size: 12px;
    }
    .atteka-print-toolbar .print { background: #0171d3; color: #fff; }
    .atteka-print-toolbar .close { background: #334155; color: #fff; }

    .atteka-print-sheet {
      padding: 14px 16px 20px;
      width: 100%;
      box-sizing: border-box;
    }
    .atteka-print-content {
      width: 100% !important;
      max-width: 100% !important;
      border: 0 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      overflow: visible !important;
    }
    .atteka-print-title {
      font: 700 ${titleSize}/1.3 "Segoe UI", system-ui, sans-serif;
      color: #0f172a;
      margin: 0 0 6px;
      padding-bottom: 8px;
      border-bottom: 2px solid #0171d3;
    }
    .atteka-print-meta {
      font-size: 11px;
      color: #334155;
      margin: 0 0 12px;
      line-height: 1.45;
    }
    .atteka-print-table-wrap {
      width: 100% !important;
      overflow: visible !important;
      margin: 0 0 12px;
    }
    .atteka-print-table,
    .atteka-print-sheet table {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      font-size: ${fontSize} !important;
    }
    .atteka-print-table th,
    .atteka-print-table td,
    .atteka-print-sheet th,
    .atteka-print-sheet td {
      border: 1px solid #94a3b8 !important;
      padding: ${cellPad} !important;
      vertical-align: top;
      word-wrap: break-word;
      overflow-wrap: anywhere;
      white-space: normal !important;
    }
    .atteka-print-table thead th,
    .atteka-print-sheet thead th {
      background: ${layout === "dot-matrix" ? "#e2e8f0" : "#0171d3"} !important;
      color: ${layout === "dot-matrix" ? "#0f172a" : "#fff"} !important;
      font-weight: 700 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .atteka-print-table tbody tr:nth-child(even) td {
      background: #f8fafc !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .atteka-print-footer {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid #cbd5e1;
      font-size: 10px;
      color: #64748b;
    }
    .atteka-print-sheet button,
    .atteka-print-sheet input,
    .atteka-print-sheet select,
    .atteka-print-sheet textarea {
      display: none !important;
    }
    @media print {
      .atteka-print-toolbar { display: none !important; }
      .atteka-print-sheet { padding: 0 !important; }
    }
  `;
}

/**
 * Print only the report/table content (not dashboard shell or card chrome).
 * Prefer `[data-print-root]` → clean table report layouts.
 */
export function printScoped(options?: {
  title?: string;
  selector?: string;
  autoPrint?: boolean;
  /** Table sheet layout — auto picks landscape for wide tables */
  layout?: PrintTableLayout;
}) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const title = options?.title || document.title || "Print";
  const autoPrint = options?.autoPrint !== false;
  const selector = options?.selector || "[data-print-root]";

  let source = document.querySelector(selector) as HTMLElement | null;

  // Explicit non-default selectors (e.g. .docket-print-sheet) are used as-is.
  const usingDefaultRoot = !options?.selector || options.selector === "[data-print-root]";

  if (!source) {
    const candidates = Array.from(
      document.querySelectorAll("main .bg-white, main [class*='bg-white']")
    ) as HTMLElement[];
    source =
      candidates
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 200 && r.height > 120 && el.offsetParent !== null;
        })
        .sort((a, b) => {
          const ar = a.getBoundingClientRect();
          const br = b.getBoundingClientRect();
          return br.width * br.height - ar.width * ar.height;
        })[0] || (document.querySelector("main") as HTMLElement | null);
  }

  if (!source) {
    window.print();
    return;
  }

  let clone: HTMLElement;
  let layout: Exclude<PrintTableLayout, "auto"> = "report";

  if (usingDefaultRoot) {
    const built = buildPrintFragment(source, options?.layout || "auto");
    clone = built.fragment;
    layout = built.layout;
  } else {
    clone = source.cloneNode(true) as HTMLElement;
    layout = options?.layout && options.layout !== "auto" ? options.layout : "report";
  }
  scrubPrintClone(clone);

  // Hidden print sheets (e.g. display:none until print) must be visible in the iframe.
  clone.style.display = "block";
  clone.style.visibility = "visible";
  clone.style.position = "static";
  clone.style.width = "100%";
  clone.style.maxWidth = "100%";
  clone.style.minWidth = "0";
  clone.style.overflow = "visible";
  clone.style.boxShadow = "none";
  clone.style.borderRadius = "0";
  clone.removeAttribute("hidden");

  const frameId = "atteka-scoped-print-frame";
  const existing = document.getElementById(frameId);
  if (existing) existing.remove();

  const iframe = document.createElement("iframe");
  iframe.id = frameId;
  iframe.title = title;
  iframe.setAttribute(
    "style",
    "position:fixed;inset:0;width:100%;height:100%;border:0;z-index:99999;background:#fff;"
  );
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!doc || !win) {
    iframe.remove();
    window.print();
    return;
  }

  const layoutLabel =
    layout === "landscape"
      ? "Landscape report"
      : layout === "dot-matrix"
        ? "Dot-matrix"
        : layout === "compact"
          ? "Compact"
          : "Report";

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      ${tablePrintLayoutCss(layout)}
    </style>
  </head>
  <body>
    <div class="atteka-print-toolbar">
      <span><strong>Atteka Logistics ERP</strong> &bull; ${escapeHtml(title)} &bull; ${layoutLabel}</span>
      <span style="display:flex;gap:8px;">
        <button class="print" type="button" onclick="window.print()">Print Document</button>
        <button class="close" type="button" onclick="parent.document.getElementById('${frameId}')?.remove()">Close</button>
      </span>
    </div>
    <div class="atteka-print-sheet layout-${layout}">${clone.outerHTML}</div>
  </body>
</html>`);
  doc.close();

  const kickPrint = () => {
    try {
      win.focus();
      if (autoPrint) win.print();
    } catch {
      // ignore
    }
  };

  // Wait for layout CSS to settle, then print.
  setTimeout(kickPrint, 350);
}

/** Opens an isolated print preview so only the sheet prints — not the dashboard shell. */
export function printDocumentSheet(title: string, css: string, contentHtml: string, autoPrint = false) {
  if (typeof window === "undefined") return;

  const frameId = "atteka-multi-print-frame";
  const existing = document.getElementById(frameId);
  if (existing) existing.remove();

  const iframe = document.createElement("iframe");
  iframe.id = frameId;
  iframe.title = title;
  iframe.setAttribute(
    "style",
    "position:fixed;inset:0;width:100%;height:100%;border:0;z-index:99999;background:rgba(15,23,42,0.8);backdrop-filter:blur(4px);"
  );
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!doc || !win) {
    iframe.remove();
    toast.error("Could not initialize print engine.");
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>${css}</style>
  </head>
  <body>
    <div class="toolbar">
      <span><strong>Atteka Logistics ERP</strong> &bull; ${escapeHtml(title)}</span>
      <span style="display:flex;gap:8px;">
        <button class="print" type="button" onclick="window.print()">Print Document</button>
        <button class="close" type="button" onclick="parent.document.getElementById('${frameId}').remove()">Close</button>
      </span>
    </div>
    <div class="sheet">${contentHtml}</div>
  </body>
</html>`);
  doc.close();

  if (autoPrint) {
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        // ignore
      }
    }, 200);
  }
}

function printIframe(title: string, css: string, contentHtml: string) {
  printDocumentSheet(title, css, contentHtml, false);
}

export function escapeHtml(val: any): string {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function inr(val: number): string {
  return `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * 1. Print Laser A4 Consignment Note
 */
export function printLaserA4Cn(cn: any) {
  const barcodeHtml = renderSvgBarcode(cn.cnNumber || "CN000");
  const subtotal = cn.freightCharges?.subtotal || cn.totalFreight || 0;
  const gst = cn.freightCharges?.gst || 0;
  const grandTotal = cn.freightCharges?.grandTotal || subtotal + gst;

  const html = `
    <div class="letterhead">
      <div>
        <div class="brand">ATTEKA LOGISTICS PRIVATE LIMITED</div>
        <div class="muted">
          Corporate Office: Ulwe HO, Navi Mumbai &bull; GSTIN: 27BJZPP7338H1ZA<br/>
          SAC Code: 996511 (Goods Transport Agency) &bull; Helpline: +91 98201 99482
        </div>
      </div>
      <div class="doc-title">
        <span class="tag">CONSIGNMENT NOTE</span>
        <h1>${escapeHtml(cn.cnNumber)}</h1>
        <div class="muted">Date: ${escapeHtml(cn.bookingDate || new Date().toISOString().slice(0, 10))}</div>
      </div>
    </div>

    <div class="barcode-wrap">${barcodeHtml}</div>

    <div class="grid2">
      <div class="box">
        <div class="label">Consignor (Sender)</div>
        <strong>${escapeHtml(cn.consignor?.name || "Cash Booking")}</strong>
        <div class="muted">
          ${escapeHtml(cn.consignor?.address || "Mumbai")}<br/>
          GSTIN: ${escapeHtml(cn.consignor?.gstin || "URP")} &bull; Ph: ${escapeHtml(cn.consignor?.phone || "—")}
        </div>
      </div>
      <div class="box">
        <div class="label">Consignee (Receiver)</div>
        <strong>${escapeHtml(cn.consignee?.name || "Direct Party")}</strong>
        <div class="muted">
          ${escapeHtml(cn.consignee?.address || "Destination")}<br/>
          GSTIN: ${escapeHtml(cn.consignee?.gstin || "URP")} &bull; Ph: ${escapeHtml(cn.consignee?.phone || "—")}
        </div>
      </div>
    </div>

    <div class="grid2">
      <div class="box">
        <div class="label">Transit Corridor</div>
        <strong>${escapeHtml(cn.originBranch || "MUMBAI")} ➔ ${escapeHtml(cn.destinationBranch || "DELHI")}</strong><br/>
        <span class="muted">Delivery Type: ${escapeHtml(cn.deliveryType || "Door Delivery")} &bull; Mode: Road FTL</span>
      </div>
      <div class="box">
        <div class="label">Vehicle & E-Way Bill</div>
        <strong>Vehicle: ${escapeHtml(cn.vehicleNumber || "Assigned on Tripsheet")}</strong><br/>
        <span class="muted">E-Way Bill: ${escapeHtml(cn.ewayBillNumber || "N/A")}</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description of Goods</th>
          <th>Pkgs</th>
          <th class="num">Actual Wt (Kg)</th>
          <th class="num">Charged Wt (Kg)</th>
          <th class="num">Freight (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${escapeHtml(cn.goodsDescription || "Commercial Freight")}</strong>
            <div class="muted">Package Type: ${escapeHtml(cn.packageType || "Cartons / Boxes")}</div>
          </td>
          <td>${escapeHtml(cn.packageCount || 1)}</td>
          <td class="num">${escapeHtml(cn.actualWeight || 0)}</td>
          <td class="num">${escapeHtml(cn.chargedWeight || 0)}</td>
          <td class="num">${inr(subtotal)}</td>
        </tr>
      </tbody>
    </table>

    <table class="totals">
      <tr><td>Basic Freight</td><td class="num">${inr(cn.freightCharges?.basic || subtotal)}</td></tr>
      <tr><td>Docket & Handling Charges</td><td class="num">${inr((cn.freightCharges?.doc || 0) + (cn.freightCharges?.handling || 0))}</td></tr>
      <tr><td>GST (18% SAC 996511)</td><td class="num">${inr(gst)}</td></tr>
      <tr style="font-weight:bold;font-size:12px;border-top:2px solid #000;">
        <td>Grand Total</td><td class="num">${inr(grandTotal)}</td>
      </tr>
    </table>

    <div class="footer">
      Notice: Goods carried at owner's risk unless covered under FOV/Carrier liability. Claims must be logged within 7 days of delivery.<br/>
      Official computer generated docket &bull; Atteka Logistics TMS.
    </div>
  `;

  printIframe(`CN-${cn.cnNumber}-LaserA4`, A4_CSS, html);
}

/**
 * 2. Print 3-Inch Counter Thermal Receipt (80mm)
 */
export function printThermalCounterSlip(cn: any) {
  const barcodeHtml = renderSvgBarcode(cn.cnNumber || "CN000");
  const subtotal = cn.freightCharges?.subtotal || cn.totalFreight || 0;
  const grandTotal = cn.freightCharges?.grandTotal || subtotal;

  const html = `
    <div class="brand">ATTEKA LOGISTICS</div>
    <div class="center bold">BOOKING DOCKET</div>
    <div class="center" style="font-size:9px;">HO: Ulwe, Navi Mumbai &bull; 98201 99482</div>
    <div class="line"></div>
    <div class="barcode">${barcodeHtml}</div>
    <div class="row"><span class="bold">CN NO:</span><span class="bold">${escapeHtml(cn.cnNumber)}</span></div>
    <div class="row"><span>DATE:</span><span>${escapeHtml(cn.bookingDate || new Date().toISOString().slice(0,10))}</span></div>
    <div class="row"><span>FROM:</span><span>${escapeHtml(cn.originBranch || "BOM")}</span></div>
    <div class="row"><span>TO:</span><span>${escapeHtml(cn.destinationBranch || "DEL")}</span></div>
    <div class="line"></div>
    <div><strong>FROM:</strong> ${escapeHtml(cn.consignor?.name || "Cash")}</div>
    <div><strong>TO:</strong> ${escapeHtml(cn.consignee?.name || "Direct")}</div>
    <div class="line"></div>
    <div class="row"><span>PKGS / TYPE:</span><span>${escapeHtml(cn.packageCount || 1)} ${escapeHtml(cn.packageType || "BOX")}</span></div>
    <div class="row"><span>WT (ACT/CHG):</span><span>${escapeHtml(cn.actualWeight || 0)} / ${escapeHtml(cn.chargedWeight || 0)} KG</span></div>
    <div class="row"><span>PAY TYPE:</span><span class="bold">${escapeHtml(cn.deliveryType || "TO PAY")}</span></div>
    <div class="line"></div>
    <div class="row bold" style="font-size:12px;"><span>TOTAL AMOUNT:</span><span>${inr(grandTotal)}</span></div>
    <div class="line"></div>
    <div class="center" style="font-size:9px;">
      Track live at: ateka.com/track<br/>
      Thank you for shipping with Atteka!
    </div>
  `;

  printIframe(`CN-${cn.cnNumber}-Thermal`, THERMAL_CSS, html);
}

/**
 * 3. Print 80-Column Dot-Matrix Stationery Sheet
 */
export function printDotMatrixSheet(cn: any) {
  const subtotal = cn.freightCharges?.subtotal || cn.totalFreight || 0;
  const grandTotal = cn.freightCharges?.grandTotal || subtotal;

  const html = `
    <div class="header">
      <div>
        <strong>ATTEKA LOGISTICS PVT LTD</strong><br/>
        ROAD TRANSPORT CARRIERS &bull; GSTIN: 27BJZPP7338H1ZA
      </div>
      <div style="text-align:right;">
        <strong>CONSIGNMENT NOTE (OFFICE COPY)</strong><br/>
        CN NO: <strong>${escapeHtml(cn.cnNumber)}</strong> &bull; DT: ${escapeHtml(cn.bookingDate || "")}
      </div>
    </div>
    <table>
      <tr>
        <td width="50%"><strong>CONSIGNOR:</strong> ${escapeHtml(cn.consignor?.name)} (${escapeHtml(cn.consignor?.gstin || "URP")})</td>
        <td width="50%"><strong>CONSIGNEE:</strong> ${escapeHtml(cn.consignee?.name)} (${escapeHtml(cn.consignee?.gstin || "URP")})</td>
      </tr>
      <tr>
        <td><strong>ORIGIN:</strong> ${escapeHtml(cn.originBranch)}</td>
        <td><strong>DESTINATION:</strong> ${escapeHtml(cn.destinationBranch)}</td>
      </tr>
    </table>
    <table>
      <thead>
        <tr>
          <th>PKG</th>
          <th>DESCRIPTION</th>
          <th class="num">ACT WT</th>
          <th class="num">CHG WT</th>
          <th class="num">FREIGHT</th>
          <th class="num">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(cn.packageCount)}</td>
          <td>${escapeHtml(cn.goodsDescription || "GOODS TRANSPORT")}</td>
          <td class="num">${escapeHtml(cn.actualWeight)} KG</td>
          <td class="num">${escapeHtml(cn.chargedWeight)} KG</td>
          <td class="num">${inr(subtotal)}</td>
          <td class="num"><strong>${inr(grandTotal)}</strong></td>
        </tr>
      </tbody>
    </table>
    <div style="display:flex;justify-content:space-between;margin-top:12px;font-size:9px;">
      <div>Operator: AL002 &bull; Ulwe Branch</div>
      <div>Authorized Signatory: _________________________</div>
    </div>
  `;

  printIframe(`CN-${cn.cnNumber}-DotMatrix`, DOT_MATRIX_CSS, html);
}

