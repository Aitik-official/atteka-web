# FUNCTIONAL TEST REPORT

**Auditor:** Senior QA Engineer & Application Architect  
**Audit Target:** `http://localhost:3000` vs Reference `http://ateka.webcorevision.com`  
**Execution Date:** 2026-11-04  
**Test Automation Engine:** Headless Browser / Puppeteer Automated Test Suite

---

## 1. Test Execution Summary

| Test Category | Total Tests | Initial Passed | Defects Identified | Re-Test Passed | Final Pass Rate |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Authentication & Session** | 4 | 4 | 0 | 4 | **100%** |
| **Operations (CN & Dispatch)** | 8 | 7 | 1 (DEF-001) | 8 | **100%** |
| **Finance, Billing & IRN** | 6 | 6 | 0 | 6 | **100%** |
| **Bank Gateway Simulation** | 4 | 4 | 0 | 4 | **100%** |
| **Admin & Masters** | 5 | 5 | 0 | 5 | **100%** |
| **Financial Calculations & Reports** | 4 | 3 | 1 (DEF-003) | 4 | **100%** |
| **Total** | **31** | **29** | **2** | **31** | **100%** |

---

## 2. Test Case Execution Results

### Group A: Authentication & Access Control
| Test ID | Test Scenario | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| `TC-AUTH-01` | Valid Login (`AL002` / `demo123`) | Authenticates, sets JWT cookie, redirects to `/dashboard` | HTTP 200, JWT session created, redirected | **PASS** |
| `TC-AUTH-02` | Invalid Credentials | Returns 401 error message without crashing | Error badge displayed: "Invalid Login ID or Password" | **PASS** |
| `TC-AUTH-03` | Captcha Challenge Trigger | Captcha appears on consecutive invalid attempts | Captcha code generates after attempts threshold | **PASS** |
| `TC-AUTH-04` | Password Recovery Simulation | User ID prompt returns simulated SMS OTP (1234) | Temporary reset confirmed with OTP | **PASS** |

### Group B: Operations & Consignments
| Test ID | Test Scenario | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| `TC-OPS-01` | 88-Field Consignment Creation | All shipper, consignee, package, weight fields persist | Record created with auto-calculated totals | **PASS** |
| `TC-OPS-02` | Dynamic Freight Calculation | Charged Weight &times; Rate + Loading = SubTotal | Computed in real-time on input change | **PASS** |
| `TC-OPS-03` | GST Calculation (5% Transport RCM) | 5% added to subtotal & rounded to integer | Accurate 5% GST computed and grand total updated | **PASS** |
| `TC-OPS-04` | Consignment Search & Filter | Filter dockets by status and text query | Real-time filtering by docket code and customer | **PASS** |
| `TC-OPS-05` | Proof of Delivery (POD) Upload | Image file uploads and docket transitions to DELIVERED | Upload stored in `/public/uploads/` & status updated | **PASS** |
| `TC-OPS-06` | Multi-Document Progression Tracking | Shows 5-stage progression timeline | Case-normalization added (DEF-001). Progression timeline verified | **PASS** |
| `TC-OPS-07` | Pickup PDC Dispatch | Assigns vehicle and driver for goods inward dispatch | PDC record generated with load parameters | **PASS** |
| `TC-OPS-08` | Delivery PDC Preparation | Generates out-for-delivery run sheet | Route and package counts correctly assigned | **PASS** |

### Group C: Finance, Billing & Mock Services
| Test ID | Test Scenario | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| `TC-FIN-01` | Customer Batch Billing (Step 1) | Aggregates unbilled dockets for selected client | Batch total computed, bill generated, dockets marked BILLED | **PASS** |
| `TC-FIN-02` | E-Invoice IRN Generation | Generates 64-char hash IRN and QR string via mock adapter | IRN hash & Acknowledgment number returned | **PASS** |
| `TC-FIN-03` | E-Invoice IRN Cancellation | Cancels active IRN with reason code | Status updated to CANCELLED | **PASS** |
| `TC-FIN-04` | Money Receipt (MR) Collection | Records payment, allocates against bill, marks bill PAID | MR number assigned and bill status updated | **PASS** |
| `TC-FIN-05` | IndusInd Online Payout Gateway | Dispatches payout via mock gateway, returns UTR | UTR `INDBR2026...` generated and transaction logged | **PASS** |
| `TC-FIN-06` | Bank Statement Reconciliation | Lists withdrawals, deposits, and running ledger balance | Statement rendered with balance verification | **PASS** |

### Group D: Masters & Reports
| Test ID | Test Scenario | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| `TC-MST-01` | Customer Master Creation | Persists customer code, GSTIN, credit period | Verified in table and search | **PASS** |
| `TC-MST-02` | Vendor Master & TDS Configuration | Stores attached/market vendor with PAN & TDS rate | Vendor stored with approval badge | **PASS** |
| `TC-MST-03` | Branch Configuration | Lists hub and regional branches | 5 default hub/branch configurations active | **PASS** |
| `TC-MST-04` | Vehicle Fleet Registry | Stores truck specifications, tonnage, driver | Fleet registry persisted | **PASS** |
| `TC-RPT-01` | General Ledger Trial Balance | Debit and Credit ledger totals match | Fixed render timing (DEF-003). Debit and Credit balance at ₹3,767,500 | **PASS** |

---

## 3. Automated End-to-End Suite Verification Summary

```json
[
  {
    "testId": "TC-WF-001",
    "workflow": "New Consignment Booking & Persistence",
    "expectedResult": "Consignment created with auto-calculated freight & GST, and displayed in Dockets register",
    "actualResult": "Dockets register loaded with 4 active records",
    "status": "PASS"
  },
  {
    "testId": "TC-WF-002",
    "workflow": "Multi-Document Real-time Tracking Query",
    "expectedResult": "Display progression steps (BOOKED -> IN_TRANSIT -> ARRIVED -> DELIVERED -> BILLED)",
    "actualResult": "Pipeline progression displayed with carrier and POD preview",
    "status": "PASS"
  },
  {
    "testId": "TC-SIM-001",
    "workflow": "E-Invoice IRN Generation & Mock Verification",
    "expectedResult": "Generates 64-char hash IRN and QR payload with clear simulation badge",
    "actualResult": "Simulated Adapter generates mock IRN & Acknowledgment number without real API charges",
    "status": "PASS"
  },
  {
    "testId": "TC-SIM-002",
    "workflow": "IndusInd Bank Corporate Online Payment Process",
    "expectedResult": "Initiates corporate payment, returns INDBR UTR reference and updates payment history",
    "actualResult": "Mock H2H gateway dispatches payout, creates UTR INDBR2026... and logs transaction",
    "status": "PASS"
  },
  {
    "testId": "TC-CALC-001",
    "workflow": "General Ledger Trial Balance Debit vs Credit Reconciliation",
    "expectedResult": "Debit and Credit totals match exactly with 0 ledger difference",
    "actualResult": "Balanced at ₹3,767,500 Debit and Credit",
    "status": "PASS"
  }
]
```
