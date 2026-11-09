/**
 * Shared in-memory IRN demo store.
 * Used by Generate IRN / Cancel IRN until GST NIC IRP is wired.
 */

export type IrnRecordStatus = "Generated" | "Cancelled" | "Failed";

export type IrnRecord = {
  documentType: string;
  documentNo: string;
  documentDate: string;
  documentDateIso: string;
  party: string;
  partyCode: string;
  branch: string;
  gstin: string;
  ackNo: string;
  ackDate: string;
  irnNo: string;
  status: IrnRecordStatus;
  cancelReason?: string;
  cancelledAt?: string;
};

const g = globalThis as unknown as { __attekaIrnStore?: Map<string, IrnRecord> };

function store() {
  if (!g.__attekaIrnStore) g.__attekaIrnStore = new Map();
  return g.__attekaIrnStore;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Seed a few cancellable demo IRNs if store empty. */
export function ensureDemoIrns() {
  const s = store();
  if (s.size > 0) return;
  const today = new Date().toISOString().slice(0, 10);
  const seeds: Omit<IrnRecord, "status">[] = [
    {
      documentType: "Invoice",
      documentNo: "BLALC12606001",
      documentDate: fmtDate(addDays(today, -2)),
      documentDateIso: addDays(today, -2),
      party: "CUS0001 : NORTHBOUND FREIGHT PVT LTD",
      partyCode: "CUS0001",
      branch: "ALC1",
      gstin: "27AABCN1001A1Z1",
      ackNo: "ACKDEMO1001",
      ackDate: fmtDate(addDays(today, -2)),
      irnNo: "DEMOIRN1001NORTHBOUNDALC1"
    },
    {
      documentType: "Invoice",
      documentNo: "BLALC12606005",
      documentDate: fmtDate(addDays(today, -4)),
      documentDateIso: addDays(today, -4),
      party: "CUS0002 : COASTAL CARGO SOLUTIONS",
      partyCode: "CUS0002",
      branch: "ALC1",
      gstin: "27AABCC2002B1Z2",
      ackNo: "ACKDEMO1005",
      ackDate: fmtDate(addDays(today, -4)),
      irnNo: "DEMOIRN1005COASTALCARGOALC1"
    },
    {
      documentType: "Invoice",
      documentNo: "BLALC12606009",
      documentDate: fmtDate(addDays(today, -1)),
      documentDateIso: addDays(today, -1),
      party: "CUS0003 : METRO LOGISTICS PARTNERS",
      partyCode: "CUS0003",
      branch: "ALC1",
      gstin: "27AABCM3003C1Z3",
      ackNo: "ACKDEMO1009",
      ackDate: fmtDate(addDays(today, -1)),
      irnNo: "DEMOIRN1009METROLOGALC1"
    },
    {
      documentType: "Credit Note",
      documentNo: "CNALC12600012",
      documentDate: fmtDate(addDays(today, -3)),
      documentDateIso: addDays(today, -3),
      party: "CUS0004 : GATEWAY DISTRIBUTION CO",
      partyCode: "CUS0004",
      branch: "ALC1",
      gstin: "27AABCG4004D1Z4",
      ackNo: "ACKDEMO1012",
      ackDate: fmtDate(addDays(today, -3)),
      irnNo: "DEMOIRN1012GATEWAYALC1"
    }
  ];
  for (const row of seeds) {
    s.set(row.documentNo, { ...row, status: "Generated" });
  }
}

export function upsertGeneratedIrn( partial: {
  documentNo: string;
  documentType?: string;
  documentDate?: string;
  documentDateIso?: string;
  party?: string;
  partyCode?: string;
  branch?: string;
  gstin?: string;
  ackNo: string;
  ackDate: string;
  irnNo: string;
}) {
  const s = store();
  const existing = s.get(partial.documentNo);
  s.set(partial.documentNo, {
    documentType: partial.documentType || existing?.documentType || "Invoice",
    documentNo: partial.documentNo,
    documentDate: partial.documentDate || existing?.documentDate || fmtDate(new Date().toISOString().slice(0, 10)),
    documentDateIso: partial.documentDateIso || existing?.documentDateIso || new Date().toISOString().slice(0, 10),
    party: partial.party || existing?.party || "DEMO PARTY",
    partyCode: partial.partyCode || existing?.partyCode || "CUS0000",
    branch: partial.branch || existing?.branch || "ALC1",
    gstin: partial.gstin || existing?.gstin || "27AABCDEMO01Z5",
    ackNo: partial.ackNo,
    ackDate: partial.ackDate.includes("T") ? fmtDate(partial.ackDate.slice(0, 10)) : partial.ackDate,
    irnNo: partial.irnNo,
    status: "Generated"
  });
}

export function listCancellableIrns() {
  ensureDemoIrns();
  return Array.from(store().values()).filter((r) => r.status === "Generated");
}

export function listAllIrns() {
  ensureDemoIrns();
  return Array.from(store().values());
}

export function getIrn(documentNo: string) {
  ensureDemoIrns();
  return store().get(documentNo) || null;
}

export function cancelIrn(documentNo: string, reason: string) {
  ensureDemoIrns();
  const s = store();
  const row = s.get(documentNo);
  if (!row) return { ok: false as const, error: "IRN document not found" };
  if (row.status === "Cancelled") return { ok: false as const, error: "IRN already cancelled" };
  const updated: IrnRecord = {
    ...row,
    status: "Cancelled",
    cancelReason: reason || "1",
    cancelledAt: new Date().toISOString()
  };
  s.set(documentNo, updated);
  return { ok: true as const, data: updated };
}
