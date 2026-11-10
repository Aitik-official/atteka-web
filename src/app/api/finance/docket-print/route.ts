import { NextRequest, NextResponse } from "next/server";

/**
 * Fabricated CN range print helper — validates range and returns printable CN numbers.
 * Not client production data.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const location = String(body.location || "").trim();
    const fromRaw = String(body.from ?? "").trim();
    const toRaw = String(body.to ?? "").trim();

    if (!location || /select/i.test(location)) {
      return NextResponse.json({ error: "Please select Location" }, { status: 400 });
    }

    const from = Number(fromRaw);
    const to = Number(toRaw);

    if (!Number.isFinite(from) || !Number.isFinite(to)) {
      return NextResponse.json({ error: "Enter valid CN From / To numbers" }, { status: 400 });
    }
    if (from <= 0 || to <= 0) {
      return NextResponse.json({ error: "CN From / To must be greater than 0" }, { status: 400 });
    }
    if (to < from) {
      return NextResponse.json({ error: "CN To must be greater than or equal to From" }, { status: 400 });
    }
    if (to - from + 1 > 200) {
      return NextResponse.json({ error: "Maximum 200 CN numbers per print job (demo)" }, { status: 400 });
    }

    const branchCode = location.includes("-")
      ? location.split("-").pop()?.trim().toUpperCase() || "ALC1"
      : "ALC1";

    const cnList: string[] = [];
    for (let n = from; n <= to; n += 1) {
      cnList.push(`${branchCode}${String(n).padStart(8, "0")}`);
    }

    return NextResponse.json({
      success: true,
      message: `${cnList.length} CN number(s) ready for Dot-Matrix print`,
      meta: {
        location,
        branchCode,
        from,
        to,
        count: cnList.length,
        printedAt: new Date().toLocaleString("en-GB"),
        jobRef: `CNPR-${Date.now().toString().slice(-8)}`
      },
      data: cnList
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Print failed" }, { status: 500 });
  }
}
