/**
 * GST Integration Architecture
 * Adapter pattern for GST E-Invoice IRN generation, cancellation, and GSTR-2B operations.
 * Clean simulation with clear indicators.
 */

export interface IrnRequest {
  billNumber: string;
  billDate: string;
  sellerGstin: string;
  buyerGstin: string;
  totalAmount: number;
  taxAmount: number;
}

export interface IrnResponse {
  success: boolean;
  irn: string;
  ackNo: string;
  ackDate: string;
  qrCodeData: string;
  status: "GENERATED" | "FAILED" | "CANCELLED";
  isSimulated: boolean;
  message: string;
}

export interface IGstService {
  generateIRN(req: IrnRequest): Promise<IrnResponse>;
  cancelIRN(irn: string, reason: string): Promise<{ success: boolean; message: string; isSimulated: boolean }>;
}

export class MockGstService implements IGstService {
  async generateIRN(req: IrnRequest): Promise<IrnResponse> {
    await new Promise((r) => setTimeout(r, 350));

    // Generate pseudo 64-character hex IRN hash
    const chars = "abcdef0123456789";
    let irn = "";
    for (let i = 0; i < 64; i++) {
      irn += chars[Math.floor(Math.random() * chars.length)];
    }

    const ackNo = `1224${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    return {
      success: true,
      irn,
      ackNo,
      ackDate: new Date().toISOString(),
      qrCodeData: `MOCK_GSTIN:${req.sellerGstin}|BUYER:${req.buyerGstin}|DOC:${req.billNumber}|TOTAL:${req.totalAmount}|IRN:${irn}`,
      status: "GENERATED",
      isSimulated: true,
      message: "[SIMULATION] E-Invoice IRN successfully generated via Mock GST System."
    };
  }

  async cancelIRN(irn: string, reason: string): Promise<{ success: boolean; message: string; isSimulated: boolean }> {
    await new Promise((r) => setTimeout(r, 300));
    return {
      success: true,
      message: `[SIMULATION] IRN ${irn.substring(0, 10)}... cancelled successfully. Reason: ${reason}`,
      isSimulated: true
    };
  }
}

export const gstService: IGstService = new MockGstService();

