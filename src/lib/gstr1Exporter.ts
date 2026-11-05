export interface Gstr1BillInput {
  billNumber: string;
  billDate: string;
  customerName: string;
  customerGstin: string;
  totalFreight: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  irn?: string;
}

export function formatGstr1OfflineJson(bills: Gstr1BillInput[], returnPeriod: string = "112026") {
  const byGstin = new Map<string, Gstr1BillInput[]>();

  for (const b of bills) {
    const gstin = (b.customerGstin || "").replace(/\s/g, "").toUpperCase();
    if (gstin.length === 15) {
      const list = byGstin.get(gstin) || [];
      list.push(b);
      byGstin.set(gstin, list);
    }
  }

  const b2b = Array.from(byGstin.entries()).map(([ctin, invList]) => {
    return {
      ctin,
      inv: invList.map((inv) => {
        const pos = ctin.slice(0, 2);
        const isInterState = pos !== "27"; // Maharashtra is state code 27
        return {
          inum: inv.billNumber.replace(/[\/\\]/g, "-"),
          idt: new Date(inv.billDate).toLocaleDateString("en-GB").replace(/\//g, "-"),
          val: Number(inv.grandTotal.toFixed(2)),
          pos,
          rchrg: "N",
          inv_typ: "R",
          irn: inv.irn || "",
          itms: [
            {
              num: 1,
              itm_det: {
                rt: 18.0,
                txval: Number(inv.totalFreight.toFixed(2)),
                iamt: isInterState ? Number((inv.igst || inv.totalFreight * 0.18).toFixed(2)) : 0,
                camt: !isInterState ? Number((inv.cgst || inv.totalFreight * 0.09).toFixed(2)) : 0,
                samt: !isInterState ? Number((inv.sgst || inv.totalFreight * 0.09).toFixed(2)) : 0,
                csamt: 0
              }
            }
          ]
        };
      })
    };
  });

  return {
    gstin: "27BJZPP7338H1ZA",
    fp: returnPeriod,
    version: "GSTR1_Offline_Utility_v3.1.2",
    hash: "ATTEKA_GST_RETURN_VERIFIED",
    b2b
  };
}
