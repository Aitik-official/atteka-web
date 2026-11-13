"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { toast } from "@/lib/toastBus";

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

const ACCOUNT_TYPES = ["--Select--", "Company Vehicle Expense", "Fleet Maintenance", "Driver Related", "Vendor Expense"];
const EXPENSE_TYPES = [
  "--Select--",
  "Diesel / Fuel",
  "Toll / Fastag",
  "Repair & Maintenance",
  "Tyre / Spare",
  "Insurance",
  "Parking / RTO",
  "Other Expense"
];
const TDS_TYPES = ["--Select--", "194C - Contractor", "194H - Commission", "194I - Rent", "194J - Professional", "No TDS"];
const MODES = ["--Select--", "CASH", "CHEQUE", "NEFT / RTGS", "UPI", "BANK TRANSFER"];
const CASH_BANK_ACCOUNTS = [
  "--Select--",
  "CASH - ALC1 Counter",
  "DCB BANK - 08422400000786",
  "INDUSIND - Corporate Current"
];

const fieldCls =
  "w-full h-8 px-2 text-[12px] border border-[#7eb6e8] rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#0171d3]";
const labelCls = "block text-[12px] font-semibold text-slate-700 mb-1";

export default function VoucherPaymentPage() { const [vendors, setVendors] = useState<any[]>([]);
  const [showVendorPick, setShowVendorPick] = useState(false);
  const [vendorQuery, setVendorQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ accountType: "--Select--",
    voucherDate: todayInput(),
    expenseType: "--Select--",
    gstNo: "",
    fromDate: todayInput(),
    toDate: todayInput(),
    documentNo: "",
    attachedDocument: "",
    vendor: "",
    panNo: "",
    paidTo: "",
    amount: 0,
    taxableAmount: 0,
    igst: 0,
    cgst: 0,
    sgst: 0,
    tdsType: "--Select--",
    tdsRate: 0,
    tdsAmount: 0,
    totalAmount: 0,
    netPayable: 0,
    modeOfTransaction: "--Select--",
    cashBankAccount: "--Select--",
    chequeNo: "",
    chequeDate: todayInput(),
    remark: ""
  });

  useEffect(() => { fetch("/api/vendors")
      .then((r) => r.json())
      .then((d) => { if (d.success) setVendors(d.data || []);
      })
      .catch(() => {});
  }, []);

  const set = (key: keyof typeof form, value: string | number) => { setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Auto calc totals when amount / tax / tds change
  useEffect(() => { const amount = Number(form.amount) || 0;
    const taxable = Number(form.taxableAmount) || amount;
    const igst = Number(form.igst) || 0;
    const cgst = Number(form.cgst) || 0;
    const sgst = Number(form.sgst) || 0;
    const tdsRate = Number(form.tdsRate) || 0;
    const tdsAmount =
      form.tdsType === "No TDS" || form.tdsType === "--Select--"
        ? Number(form.tdsAmount) || 0
        : Math.round(((taxable * tdsRate) / 100) * 100) / 100;
    const totalAmount = Math.round((taxable + igst + cgst + sgst) * 100) / 100;
    const netPayable = Math.round((totalAmount - tdsAmount) * 100) / 100;

    setForm((prev) => { if (
        prev.taxableAmount === taxable &&
        prev.tdsAmount === tdsAmount &&
        prev.totalAmount === totalAmount &&
        prev.netPayable === netPayable
      ) { return prev;
      }
      return { ...prev,
        taxableAmount: prev.taxableAmount || taxable,
        tdsAmount,
        totalAmount,
        netPayable
      };
    });
  }, [form.amount, form.taxableAmount, form.igst, form.cgst, form.sgst, form.tdsType, form.tdsRate, form.tdsAmount]);

  const filteredVendors = useMemo(() => { const q = vendorQuery.trim().toUpperCase();
    if (!q) return vendors.slice(0, 12);
    return vendors
      .filter((v) => { const name = String(v.vendorName || v.name || "").toUpperCase();
        const code = String(v.vendorCode || v.code || "").toUpperCase();
        const gst = String(v.gstin || v.gstNo || "").toUpperCase();
        return name.includes(q) || code.includes(q) || gst.includes(q);
      })
      .slice(0, 12);
  }, [vendors, vendorQuery]);

  const pickVendor = (v: any) => { setForm((prev) => ({ ...prev,
      vendor: v.vendorName || v.name || "",
      paidTo: v.vendorName || v.name || prev.paidTo,
      gstNo: v.gstin || v.gstNo || prev.gstNo,
      panNo: v.pan || v.panNo || prev.panNo
    }));
    setShowVendorPick(false);
    setVendorQuery("");
  };

  const handleAttach = async (file?: File | null) => { if (!file) return;
    try { const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && (data.url || data.data?.url)) { set("attachedDocument", data.url || data.data.url);
        toast.success("Document attached");
      } else { // Fallback local name if upload API shape differs
        set("attachedDocument", file.name);
        toast.info("Document name captured");
      }
    } catch { set("attachedDocument", file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault();
    if (form.accountType === "--Select--") { toast.error("Select Account Type");
      return;
    }
    if (form.expenseType === "--Select--") { toast.error("Select Expense Type");
      return;
    }
    if (!form.paidTo.trim()) { toast.error("Enter Paid To");
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) { toast.error("Enter Amount");
      return;
    }
    if (form.modeOfTransaction === "--Select--") { toast.error("Select Mode of Transaction");
      return;
    }
    if (form.cashBankAccount === "--Select--") { toast.error("Select Cash / Bank Account");
      return;
    }

    setSaving(true);
    try { const res = await fetch("/api/fleet/voucher-payments", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to submit voucher payment");
        return;
      }

      const voucherNo = data.data?.voucherNo || form.documentNo;
      await fetch("/api/bank/payment", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beneficiaryName: form.paidTo,
          accountNumber: form.cashBankAccount,
          ifscCode: form.modeOfTransaction === "CASH" ? "CASH0000001" : "INDB0000001",
          amount: Number(form.netPayable || form.amount),
          remarks: `Voucher ${voucherNo} | ${form.expenseType} | ${form.vendor || form.paidTo} | ${form.remark}`
        })
      });

      toast.document(`Voucher payment submitted`, {
        title: data.isMemoryStore ? "Voucher (Memory)" : "Voucher Payment",
        code: voucherNo
      });

      setForm((prev) => ({ ...prev,
        documentNo: "",
        attachedDocument: "",
        amount: 0,
        taxableAmount: 0,
        igst: 0,
        cgst: 0,
        sgst: 0,
        tdsRate: 0,
        tdsAmount: 0,
        totalAmount: 0,
        netPayable: 0,
        chequeNo: "",
        remark: ""
      }));
    } catch { toast.error("Failed to submit voucher payment");
    } finally { setSaving(false);
    }
  };

  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-10">
      <form onSubmit={handleSubmit} className="bg-white border border-slate-300 shadow-sm">
        <div className="bg-[#0171d3] text-white text-sm font-semibold px-3 py-2">Voucher Payment</div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <div>
            <label className={labelCls}>Account Type</label>
            <select
              value={form.accountType}
              onChange={(e) => set("accountType", e.target.value)}
              className={fieldCls}
            >
              {ACCOUNT_TYPES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Voucher Date</label>
            <input
              type="date"
              value={form.voucherDate}
              onChange={(e) => set("voucherDate", e.target.value)}
              className={fieldCls}
            />
          </div>

          <div>
            <label className={labelCls}>Expense Type</label>
            <select
              value={form.expenseType}
              onChange={(e) => set("expenseType", e.target.value)}
              className={fieldCls}
            >
              {EXPENSE_TYPES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>GSTNO</label>
            <input
              value={form.gstNo}
              onChange={(e) => set("gstNo", e.target.value.toUpperCase())}
              className={`${fieldCls} uppercase font-mono`}
            />
          </div>

          <div>
            <label className={labelCls}>From Date</label>
            <input
              type="date"
              value={form.fromDate}
              onChange={(e) => set("fromDate", e.target.value)}
              className={fieldCls}
            />
          </div>
          <div>
            <label className={labelCls}>To Date</label>
            <input
              type="date"
              value={form.toDate}
              onChange={(e) => set("toDate", e.target.value)}
              className={fieldCls}
            />
          </div>

          <div>
            <label className={labelCls}>Document No</label>
            <input
              value={form.documentNo}
              onChange={(e) => set("documentNo", e.target.value.toUpperCase())}
              className={`${fieldCls} uppercase font-mono`}
            />
          </div>
          <div>
            <label className={labelCls}>Attached Document</label>
            <div className="flex items-center gap-2">
              <input
                value={form.attachedDocument}
                onChange={(e) => set("attachedDocument", e.target.value)}
                className={fieldCls}
                placeholder=""
                readOnly={!!form.attachedDocument && form.attachedDocument.startsWith("/")}
              />
              <label className="shrink-0 h-8 w-8 inline-flex items-center justify-center border border-[#7eb6e8] rounded-sm text-[#0171d3] cursor-pointer hover:bg-[#e8f1fb]">
                <ExternalLink className="w-4 h-4" />
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleAttach(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>

          <div className="relative">
            <label className={labelCls}>Vendor</label>
            <div className="flex items-center gap-2">
              <input
                value={form.vendor}
                onChange={(e) => set("vendor", e.target.value)}
                className={fieldCls}
              />
              <button
                type="button"
                onClick={() => setShowVendorPick((v) => !v)}
                className="shrink-0 h-8 w-8 inline-flex items-center justify-center rounded-full border border-[#7eb6e8] text-[#0171d3] hover:bg-[#e8f1fb]"
                title="Search vendor"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
            {showVendorPick && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-slate-300 shadow-lg rounded-sm overflow-hidden">
                <input
                  autoFocus
                  value={vendorQuery}
                  onChange={(e) => setVendorQuery(e.target.value)}
                  placeholder="Search vendor..."
                  className="w-full h-8 px-2 text-[12px] border-b border-slate-200"
                />
                <div className="max-h-48 overflow-y-auto">
                  {filteredVendors.map((v, i) => (
                    <button
                      key={v._id || v.vendorCode || i}
                      type="button"
                      onClick={() => pickVendor(v)}
                      className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#e8f1fb] border-b border-slate-100"
                    >
                      <div className="font-semibold text-slate-800">{v.vendorName || v.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {v.vendorCode || ""} {v.gstin || v.gstNo || ""}
                      </div>
                    </button>
                  ))}
                  {filteredVendors.length === 0 && (
                    <div className="px-3 py-3 text-[12px] text-slate-500">No vendors found</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>Pan No</label>
            <input
              value={form.panNo}
              onChange={(e) => set("panNo", e.target.value.toUpperCase())}
              className={`${fieldCls} uppercase font-mono`}
              maxLength={10}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Paid To</label>
            <input
              value={form.paidTo}
              onChange={(e) => set("paidTo", e.target.value)}
              className={fieldCls}
            />
          </div>

          <div>
            <label className={labelCls}>Amount</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => { const amount = Number(e.target.value) || 0;
                setForm((prev) => ({ ...prev,
                  amount,
                  taxableAmount: prev.taxableAmount && prev.taxableAmount !== prev.amount ? prev.taxableAmount : amount
                }));
              }}
              className={`${fieldCls} font-mono`}
            />
          </div>
          <div>
            <label className={labelCls}>Taxable Amount</label>
            <input
              type="number"
              value={form.taxableAmount}
              onChange={(e) => set("taxableAmount", Number(e.target.value) || 0)}
              className={`${fieldCls} font-mono`}
            />
          </div>

          <div>
            <label className={labelCls}>IGST</label>
            <input
              type="number"
              value={form.igst}
              onChange={(e) => set("igst", Number(e.target.value) || 0)}
              className={`${fieldCls} font-mono`}
            />
          </div>
          <div>
            <label className={labelCls}>TDS Type</label>
            <select
              value={form.tdsType}
              onChange={(e) => { const tdsType = e.target.value;
                const rate =
                  tdsType === "194C - Contractor"
                    ? 1
                    : tdsType === "194H - Commission"
                      ? 5
                      : tdsType === "194I - Rent"
                        ? 10
                        : tdsType === "194J - Professional"
                          ? 10
                          : 0;
                setForm((prev) => ({ ...prev, tdsType, tdsRate: rate }));
              }}
              className={fieldCls}
            >
              {TDS_TYPES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>CGST</label>
            <input
              type="number"
              value={form.cgst}
              onChange={(e) => set("cgst", Number(e.target.value) || 0)}
              className={`${fieldCls} font-mono`}
            />
          </div>
          <div>
            <label className={labelCls}>TDS Rate</label>
            <input
              type="number"
              value={form.tdsRate}
              onChange={(e) => set("tdsRate", Number(e.target.value) || 0)}
              className={`${fieldCls} font-mono`}
            />
          </div>

          <div>
            <label className={labelCls}>SGST</label>
            <input
              type="number"
              value={form.sgst}
              onChange={(e) => set("sgst", Number(e.target.value) || 0)}
              className={`${fieldCls} font-mono`}
            />
          </div>
          <div>
            <label className={labelCls}>TDS Amount</label>
            <input
              type="number"
              value={form.tdsAmount}
              onChange={(e) => set("tdsAmount", Number(e.target.value) || 0)}
              className={`${fieldCls} font-mono`}
            />
          </div>

          <div>
            <label className={labelCls}>Total Amount</label>
            <input type="number" value={form.totalAmount} readOnly className={`${fieldCls} font-mono bg-slate-50`} />
          </div>
          <div>
            <label className={labelCls}>Net Payable</label>
            <input type="number" value={form.netPayable} readOnly className={`${fieldCls} font-mono bg-slate-50 font-bold`} />
          </div>

          <div>
            <label className={labelCls}>Mode of Transaction</label>
            <select
              value={form.modeOfTransaction}
              onChange={(e) => set("modeOfTransaction", e.target.value)}
              className={fieldCls}
            >
              {MODES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Cash / Bank Account</label>
            <div className="flex items-center gap-2">
              <select
                value={form.cashBankAccount}
                onChange={(e) => set("cashBankAccount", e.target.value)}
                className={`${fieldCls} flex-1`}
              >
                {CASH_BANK_ACCOUNTS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-600 whitespace-nowrap font-medium">A/C Bal.:-</span>
            </div>
          </div>

          <div>
            <label className={labelCls}>Cheque No</label>
            <input
              value={form.chequeNo}
              onChange={(e) => set("chequeNo", e.target.value.toUpperCase())}
              className={`${fieldCls} uppercase font-mono`}
            />
          </div>
          <div>
            <label className={labelCls}>Cheque Date</label>
            <input
              type="date"
              value={form.chequeDate}
              onChange={(e) => set("chequeDate", e.target.value)}
              className={fieldCls}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Remark</label>
            <textarea
              value={form.remark}
              onChange={(e) => set("remark", e.target.value)}
              rows={4}
              className="w-full px-2 py-2 text-[12px] border border-[#7eb6e8] rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#0171d3] resize-y min-h-[90px]"
            />
          </div>
        </div>

        <div className="flex justify-center py-4 border-t border-slate-200 bg-slate-50/60">
          <button
            type="submit"
            disabled={saving}
            className="min-w-[110px] h-9 px-6 rounded-full border border-[#7eb6e8] bg-white text-[#0171d3] font-semibold text-sm hover:bg-[#e8f1fb] shadow-sm disabled:opacity-60"
          >
            {saving ? "Saving..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
