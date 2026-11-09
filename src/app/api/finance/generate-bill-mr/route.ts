import { NextRequest, NextResponse } from "next/server";

/** Fabricated demo bills for MR selection — not client production data. */
const DEMO_CUSTOMERS = [
  { code: "CUS0001", name: "NORTHBOUND FREIGHT PVT LTD" },
  { code: "CUS0002", name: "COASTAL CARGO SOLUTIONS" },
  { code: "CUS0003", name: "METRO LOGISTICS PARTNERS" },
  { code: "CUS0004", name: "GATEWAY DISTRIBUTION CO" }
];

const BILL_TYPES = ["Freight", "Supplementary", "Octroi", "Demurrage"];

function parseIso(s: string | null, fallback: string) {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : s.slice(0, 10);
}

function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function buildDemoBills() {
  const today = new Date().toISOString().slice(0, 10);
  const bills: {
    billNumber: string;
    manualBillNumber: string;
    billingBranch: string;
    partyCode: string;
    partyName: string;
    billType: string;
    billAmount: number;
    unadjustedAmount: number;
    generationDate: string;
    generationDateIso: string;
    dueDate: string;
  }[] = [];

  for (let i = 0; i < 28; i++) {
    const cust = DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length];
    const genIso = addDays(today, -((i % 20) + 1));
    const amount = Number((18500 + (i % 11) * 8750 + (i % 5) * 1250.5).toFixed(2));
    const billNumber = `BLALC${String(12605000 + i)}`;
    bills.push({
      billNumber,
      manualBillNumber: billNumber,
      billingBranch: "ALC1 : Ateka Logistics",
      partyCode: cust.code,
      partyName: `${cust.code} : ${cust.name}`,
      billType: BILL_TYPES[i % BILL_TYPES.length],
      billAmount: amount,
      unadjustedAmount: amount,
      generationDate: fmtDate(genIso),
      generationDateIso: genIso,
      dueDate: i % 4 === 0 ? fmtDate(addDays(genIso, 30)) : ""
    });
  }
  return bills;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("lists") === "1") {
    return NextResponse.json({
      success: true,
      data: {
        customers: DEMO_CUSTOMERS.map((c) => ({
          code: c.code,
          name: c.name,
          label: `${c.code} - ${c.name}`
        })),
        billTypes: ["Show All", ...BILL_TYPES]
      }
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const from = parseIso(searchParams.get("from"), addDays(today, -29));
  const to = parseIso(searchParams.get("to"), today);
  const customer = (searchParams.get("customer") || "").trim().toUpperCase();
  const billType = (searchParams.get("billType") || "Show All").trim();
  const manualBills = (searchParams.get("manualBills") || "")
    .split(/[,;\n]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const mode = (searchParams.get("mode") || "filter").trim(); // manual | filter

  let bills = buildDemoBills();

  if (mode === "manual" && manualBills.length) {
    bills = bills.filter(
      (b) =>
        manualBills.some(
          (m) =>
            b.billNumber.includes(m) ||
            b.manualBillNumber.includes(m) ||
            m.includes(b.billNumber.slice(-6))
        )
    );
    // If no match, synthesize rows from entered bill numbers so UX still works
    if (!bills.length) {
      bills = manualBills.map((m, i) => {
        const cust = DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length];
        const amount = Number((25000 + i * 3500).toFixed(2));
        const billNumber = m.startsWith("BL") ? m : `BLALC${m.replace(/\D/g, "").padStart(8, "0")}`;
        return {
          billNumber,
          manualBillNumber: billNumber,
          billingBranch: "ALC1 : Ateka Logistics",
          partyCode: cust.code,
          partyName: `${cust.code} : ${cust.name}`,
          billType: "Freight",
          billAmount: amount,
          unadjustedAmount: amount,
          generationDate: fmtDate(today),
          generationDateIso: today,
          dueDate: ""
        };
      });
    }
  } else {
    bills = bills.filter((b) => b.generationDateIso >= from && b.generationDateIso <= to);
    if (customer) {
      bills = bills.filter(
        (b) =>
          b.partyCode.includes(customer) ||
          b.partyName.toUpperCase().includes(customer) ||
          customer.includes(b.partyCode)
      );
    }
    if (billType && !/^show all$/i.test(billType)) {
      bills = bills.filter((b) => b.billType.toLowerCase() === billType.toLowerCase());
    }
  }

  return NextResponse.json({
    success: true,
    count: bills.length,
    data: bills,
    meta: {
      from,
      to,
      customer: customer || null,
      billType,
      mode
    }
  });
}
