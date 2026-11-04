/**
 * Bank Integration Architecture
 * Abstract Bank Service with Mock Implementation for simulated operations.
 * Future Real Bank API adapters can plug in cleanly.
 */

export interface PaymentRequest {
  beneficiaryName: string;
  accountNumber: string;
  ifscCode: string;
  amount: number;
  remarks?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  utrNumber: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  message: string;
  isSimulated: boolean;
  timestamp: string;
}

export interface BankStatementRow {
  date: string;
  valueDate: string;
  description: string;
  chequeOrRefNo: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface IBankService {
  processOnlinePayment(req: PaymentRequest): Promise<PaymentResponse>;
  fetchStatement(accountNumber: string, fromDate: string, toDate: string): Promise<BankStatementRow[]>;
}

export class MockIndusIndBankService implements IBankService {
  async processOnlinePayment(req: PaymentRequest): Promise<PaymentResponse> {
    // Simulated bank processing delay
    await new Promise((r) => setTimeout(r, 400));

    const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
    const utr = `INDBR${new Date().getFullYear()}${randomSuffix}`;
    const txnId = `TXN-${Date.now()}`;

    return {
      success: true,
      transactionId: txnId,
      utrNumber: utr,
      status: "SUCCESS",
      message: "[SIMULATION] Payment processed successfully via IndusInd Bank H2H Mock Gateway.",
      isSimulated: true,
      timestamp: new Date().toISOString()
    };
  }

  async fetchStatement(accountNumber: string, fromDate: string, toDate: string): Promise<BankStatementRow[]> {
    return [
      {
        date: fromDate || "2026-11-01",
        valueDate: fromDate || "2026-11-01",
        description: "CMS CHQ CLG - RELIABLE LOGISTICS",
        chequeOrRefNo: "CHQ992812",
        debit: 0,
        credit: 185000,
        balance: 1420500
      },
      {
        date: "2026-11-02",
        valueDate: "2026-11-02",
        description: "NEFT OUT - SHREE ROADWAYS (TRIP ADV)",
        chequeOrRefNo: "INDBR2026881923",
        debit: 35000,
        credit: 0,
        balance: 1385500
      },
      {
        date: "2026-11-03",
        valueDate: "2026-11-03",
        description: "RTGS IN - TATA MOTORS TRANSPORT BILL",
        chequeOrRefNo: "RTGS9910248",
        debit: 0,
        credit: 245000,
        balance: 1630500
      },
      {
        date: toDate || "2026-11-04",
        valueDate: toDate || "2026-11-04",
        description: "NEFT OUT - DIESEL EXPENSES IOCL",
        chequeOrRefNo: "INDBR2026992144",
        debit: 48000,
        credit: 0,
        balance: 1582500
      }
    ];
  }
}

// Active singleton instance using mock adapter
export const bankService: IBankService = new MockIndusIndBankService();

