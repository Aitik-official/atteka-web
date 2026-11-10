import { NextRequest, NextResponse } from "next/server";

type ReprocessFile = {
  id: string;
  fileName: string;
  displayLabel: string;
  generatedOn: string;
  voucherCount: number;
  totalAmount: number;
  bank: string;
};

/** Fabricated H2H re-process batch files — not client production data. */
const DEMO_FILES: ReprocessFile[] = [
  {
    id: "rp-003",
    fileName: "ateka_6_19012026_003",
    displayLabel: "Re-Process file 2026_003",
    generatedOn: "2026-01-19",
    voucherCount: 7,
    totalAmount: 312450.5,
    bank: "INDUSIND BANK"
  },
  {
    id: "rp-001",
    fileName: "ateka_6_19012026_001",
    displayLabel: "Re-Process file 2026_001",
    generatedOn: "2026-01-19",
    voucherCount: 4,
    totalAmount: 98500,
    bank: "INDUSIND BANK"
  },
  {
    id: "rp-002",
    fileName: "ateka_6_19012026_002",
    displayLabel: "Re-Process file 2026_002",
    generatedOn: "2026-01-19",
    voucherCount: 5,
    totalAmount: 156200,
    bank: "INDUSIND BANK"
  },
  {
    id: "rp-feb",
    fileName: "ateka_6_17022026_001",
    displayLabel: "Re-Process file 2026_FEB_001",
    generatedOn: "2026-02-17",
    voucherCount: 3,
    totalAmount: 74200,
    bank: "INDUSIND BANK"
  },
  {
    id: "rp-apr",
    fileName: "ateka_6_28042026_001",
    displayLabel: "Re-Process file 2026_APR_001",
    generatedOn: "2026-04-28",
    voucherCount: 6,
    totalAmount: 221800.25,
    bank: "INDUSIND BANK"
  },
  {
    id: "rp-dec",
    fileName: "ateka_6_23122025_001",
    displayLabel: "Re-Process file 2025_001",
    generatedOn: "2025-12-23",
    voucherCount: 8,
    totalAmount: 405120,
    bank: "INDUSIND BANK"
  },
  {
    id: "rp-004",
    fileName: "ateka_6_05032026_001",
    displayLabel: "Re-Process file 2026_MAR_001",
    generatedOn: "2026-03-05",
    voucherCount: 2,
    totalAmount: 45800,
    bank: "INDUSIND BANK"
  },
  {
    id: "rp-005",
    fileName: "ateka_6_11052026_002",
    displayLabel: "Re-Process file 2026_MAY_002",
    generatedOn: "2026-05-11",
    voucherCount: 9,
    totalAmount: 512340.75,
    bank: "INDUSIND BANK"
  }
];

function findFile(raw: string) {
  const q = (raw || "").trim().toLowerCase();
  return (
    DEMO_FILES.find(
      (f) =>
        f.fileName.toLowerCase() === q ||
        f.displayLabel.toLowerCase() === q ||
        f.id.toLowerCase() === q
    ) || DEMO_FILES[0]
  );
}

function buildLines(file: ReprocessFile, remarks: string) {
  const seed = file.fileName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const statuses = ["Success", "Success", "Pending", "Failed", "Success"] as const;
  const count = Math.min(file.voucherCount, 7);
  const lines = Array.from({ length: count }).map((_, i) => {
    const amount = Number(((file.totalAmount / count) * (0.75 + ((seed + i) % 5) * 0.08)).toFixed(2));
    return {
      srNo: i + 1,
      voucherNo: `BPV/ALC1/${26000 + (seed % 90) + i}`,
      paidTo: ["SHREE TRANSPORT CO", "MEHTA FUELS", "PATEL ROADLINES", "AUTO CARE", "NORTHWAY LOGISTICS"][
        (seed + i) % 5
      ],
      amount,
      utrRef: `INDB${file.generatedOn.replace(/-/g, "").slice(2)}${String(10 + i).padStart(4, "0")}`,
      status: statuses[(seed + i) % statuses.length],
      remark: remarks.trim() || (statuses[(seed + i) % statuses.length] === "Failed" ? "Bank timeout — retry" : "")
    };
  });
  return lines;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  let files = DEMO_FILES;
  if (q) {
    files = DEMO_FILES.filter(
      (f) =>
        f.fileName.toLowerCase().includes(q) ||
        f.displayLabel.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({
    success: true,
    count: files.length,
    data: files.map((f) => ({
      id: f.id,
      fileName: f.fileName,
      displayLabel: f.displayLabel,
      generatedOn: f.generatedOn,
      voucherCount: f.voucherCount,
      totalAmount: f.totalAmount,
      bank: f.bank
    }))
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fileKey = String(body.fileName || body.file || body.displayLabel || "").trim();
    const remarks = String(body.remarks || body.notes || "").trim();

    if (!fileKey) {
      return NextResponse.json({ error: "Select a re-process file" }, { status: 400 });
    }

    const file = findFile(fileKey);
    const lines = buildLines(file, remarks);
    const successCount = lines.filter((l) => l.status === "Success").length;
    const failedCount = lines.filter((l) => l.status === "Failed").length;
    const pendingCount = lines.filter((l) => l.status === "Pending").length;
    const processedAmount = lines.reduce((s, l) => s + l.amount, 0);

    return NextResponse.json({
      success: true,
      message: `Re-process submitted for ${file.fileName} (demo)`,
      meta: {
        fileName: file.fileName,
        displayLabel: file.displayLabel,
        bank: file.bank,
        generatedOn: file.generatedOn,
        remarks,
        submittedAt: new Date().toLocaleString("en-GB"),
        batchRef: `H2H-RP-${Date.now().toString().slice(-8)}`
      },
      summary: {
        totalLines: lines.length,
        successCount,
        failedCount,
        pendingCount,
        processedAmount: Number(processedAmount.toFixed(2))
      },
      data: lines
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Re-process failed" }, { status: 500 });
  }
}
