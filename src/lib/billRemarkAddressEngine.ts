import { connectToDatabase } from "@/lib/mongodb";
import { CustomerBill } from "@/models/CustomerBill";
import { Customer } from "@/models/Customer";
import { memoryStore } from "@/lib/memoryStore";

function fmtDate(d?: Date | string | null) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function mapBill(b: any) {
  const party = [b.customerCode, b.customerName].filter(Boolean).join(" ");
  return {
    billNumber: String(b.billNumber || "").toUpperCase(),
    manualBillNo: String(b.topsheetNo || b.billNumber || "").toUpperCase(),
    remark: String(b.remark || "OK"),
    billAddress: String(b.partyAddress || ""),
    billingParty: party || String(b.customerName || ""),
    customerCode: String(b.customerCode || "").toUpperCase(),
    customerName: String(b.customerName || ""),
    billAmount: Number(b.grandTotal || b.totalFreight || 0) || 0,
    billDate: fmtDate(b.billDate),
    billBranch: String(b.billingBranch || b.collectionBranch || "ALC1").toUpperCase(),
    customerGstin: String(b.customerGstin || "").toUpperCase(),
    destinationAddress: String(b.destinationAddress || b.partyAddress || ""),
    city: String(b.city || ""),
    pinCode: String(b.pinCode || ""),
    status: String(b.status || "")
  };
}

export type GstAddressOption = {
  id: string;
  gstin: string;
  city: string;
  destinationAddress: string;
  pinCode: string;
};

async function findBillDoc(billNo: string) {
  const no = String(billNo || "").trim().toUpperCase();
  if (!no) return null;
  try {
    await connectToDatabase();
    const bill = await CustomerBill.findOne({
      billNumber: { $regex: `^${no.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
    });
    if (bill) return { bill, source: "mongodb" as const };
  } catch {
    /* memory */
  }
  const mem = (memoryStore as any).customerBills || (memoryStore as any).bills || [];
  const list = Array.isArray(mem) ? mem : [];
  const bill = list.find((b: any) => String(b.billNumber || "").toUpperCase() === no);
  return bill ? { bill, source: "memory" as const } : null;
}

export async function getBillForRemarkAddress(billNo: string) {
  const found = await findBillDoc(billNo);
  if (!found) return null;
  return { ...mapBill(found.bill), source: found.source };
}

export async function listGstOptionsForBill(billNo: string): Promise<GstAddressOption[]> {
  const found = await findBillDoc(billNo);
  if (!found) return [];
  const bill = found.bill as any;
  const options: GstAddressOption[] = [];
  const seen = new Set<string>();

  const push = (gstin: string, city: string, dest: string, pin: string) => {
    const g = String(gstin || "").trim().toUpperCase();
    const c = String(city || "").trim();
    const d = String(dest || "").trim();
    const p = String(pin || "").trim();
    if (!g && !d) return;
    const key = `${g}|${c}|${d}|${p}`.toUpperCase();
    if (seen.has(key)) return;
    seen.add(key);
    options.push({
      id: `gst-${options.length + 1}`,
      gstin: g,
      city: c,
      destinationAddress: d,
      pinCode: p
    });
  };

  push(bill.customerGstin, bill.city, bill.destinationAddress || bill.partyAddress, bill.pinCode);

  try {
    await connectToDatabase();
    const cust = await Customer.findOne({
      $or: [
        { customerCode: String(bill.customerCode || "").toUpperCase() },
        { name: { $regex: `^${String(bill.customerName || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } }
      ]
    }).lean();
    if (cust) {
      const addr = [cust.address, cust.city, cust.state, cust.pinCode || cust.pincode]
        .filter(Boolean)
        .join(", ");
      push(cust.gstin || "", cust.city || "", addr || cust.address || "", String(cust.pinCode || cust.pincode || ""));
    }

    // Other bills for same party — alternate GST / destination rows
    const siblings = await CustomerBill.find({
      customerCode: String(bill.customerCode || "").toUpperCase(),
      billNumber: { $ne: String(bill.billNumber || "").toUpperCase() }
    })
      .select("customerGstin city destinationAddress partyAddress pinCode")
      .limit(40)
      .lean();
    for (const s of siblings as any[]) {
      push(s.customerGstin, s.city, s.destinationAddress || s.partyAddress, s.pinCode);
    }
  } catch {
    /* ignore */
  }

  return options;
}

export async function updateBillRemarkAddress(input: {
  billNumber: string;
  remark?: string;
  billAddress?: string;
  customerGstin?: string;
  destinationAddress?: string;
  city?: string;
  pinCode?: string;
}) {
  const no = String(input.billNumber || "").trim().toUpperCase();
  if (!no) throw Object.assign(new Error("Bill No is required"), { status: 400 });

  const patch: Record<string, any> = {};
  if (input.remark !== undefined) patch.remark = String(input.remark || "").trim() || "OK";
  if (input.billAddress !== undefined) patch.partyAddress = String(input.billAddress || "").trim();
  if (input.customerGstin !== undefined) patch.customerGstin = String(input.customerGstin || "").trim().toUpperCase();
  if (input.destinationAddress !== undefined) {
    patch.destinationAddress = String(input.destinationAddress || "").trim();
  }
  if (input.city !== undefined) patch.city = String(input.city || "").trim().toUpperCase();
  if (input.pinCode !== undefined) patch.pinCode = String(input.pinCode || "").trim();

  try {
    await connectToDatabase();
    const updated = await CustomerBill.findOneAndUpdate(
      { billNumber: { $regex: `^${no.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
      { $set: patch },
      { new: true }
    );
    if (!updated) throw Object.assign(new Error(`Bill ${no} not found`), { status: 404 });
    return { ...mapBill(updated), source: "mongodb" as const };
  } catch (err: any) {
    if (err?.status === 404) throw err;
    // memory fallback
    const memKey = (memoryStore as any).customerBills ? "customerBills" : null;
    if (memKey && Array.isArray((memoryStore as any)[memKey])) {
      const list = (memoryStore as any)[memKey] as any[];
      const idx = list.findIndex((b) => String(b.billNumber || "").toUpperCase() === no);
      if (idx < 0) throw Object.assign(new Error(`Bill ${no} not found`), { status: 404 });
      list[idx] = { ...list[idx], ...patch };
      return { ...mapBill(list[idx]), source: "memory" as const, isMemoryStore: true };
    }
    throw err?.status ? err : Object.assign(new Error(err?.message || "Failed to update bill"), { status: 500 });
  }
}
