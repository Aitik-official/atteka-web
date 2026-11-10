/** Flat searchable catalog for global header autocomplete */

export type ModuleSearchItem = {
  id: string;
  label: string;
  code?: string;
  route: string;
  group: string;
  /** Extra keywords that should match besides label/code/group */
  keywords?: string[];
};

export const MODULE_SEARCH_CATALOG: ModuleSearchItem[] = [
  // Operations
  { id: "C009", label: "Freight Booking", code: "C009", route: "/dashboard/operations/freight-booking", group: "Operations" },
  { id: "C019", label: "CN Operations [System]", code: "C019", route: "/dashboard/operations/cn-operations", group: "Operations" },
  { id: "C019E", label: "Edit Complete Pending CNs", code: "C019", route: "/dashboard/operations/cn-operations/edit-cns", group: "Operations", keywords: ["edit cn", "edit cns", "pending cns"] },
  { id: "C019V", label: "View / Print CN", code: "C019", route: "/dashboard/operations/cn-operations/view-print-cn", group: "Operations", keywords: ["view print cn", "view cn", "print cn"] },
  { id: "C010", label: "New CN Booking", code: "C010", route: "/dashboard/operations/new-cn", group: "Operations", keywords: ["cn", "docket"] },
  { id: "C035", label: "TripSheet Operations", code: "C035", route: "/dashboard/operations/tripsheets", group: "Operations" },
  { id: "C035P", label: "Prepare Loading Slip", code: "C035", route: "/dashboard/operations/tripsheets/prepare", group: "Operations", keywords: ["trip", "loading"] },
  { id: "C039", label: "View Print Document", code: "C039", route: "/dashboard/operations/view-print", group: "Operations" },
  { id: "C011", label: "Consignments & Dockets", code: "C011", route: "/dashboard/operations/dockets", group: "Operations", keywords: ["docket"] },
  { id: "C111T", label: "Live Tracking", code: "C111", route: "/dashboard/operations/tracking", group: "Operations", keywords: ["track"] },

  // Finance
  { id: "C002", label: "Finance", code: "C002", route: "/dashboard/finance", group: "Finance", keywords: ["fin"] },
  { id: "C181", label: "Vendor Billing", code: "C181", route: "/dashboard/finance/vendor-billing", group: "Finance" },
  { id: "C181PFS", label: "PDC Freight/Advance Payment [Single]", code: "C181", route: "/dashboard/finance/vendor-billing/pdc-freight-advance-single", group: "Finance", keywords: ["pdc freight advance", "advance payment single"] },
  { id: "C181PFM", label: "PDC Freight/Advance Payment [Multiple]", code: "C181", route: "/dashboard/finance/vendor-billing/pdc-freight-advance-multiple", group: "Finance", keywords: ["pdc freight advance multiple", "multiple advance payment"] },
  { id: "C181PBS", label: "PDC Balance Payment [Single]", code: "C181", route: "/dashboard/finance/vendor-billing/pdc-balance-payment-single", group: "Finance", keywords: ["pdc balance payment single"] },
  { id: "C181PBM", label: "PDC Balance Payment [Multiple]", code: "C181", route: "/dashboard/finance/vendor-billing/pdc-balance-payment-multiple", group: "Finance", keywords: ["pdc balance payment multiple"] },
  { id: "C181TSA", label: "TripSheet Advance Payment", code: "C181", route: "/dashboard/finance/vendor-billing/tripsheet-advance-payment", group: "Finance", keywords: ["tripsheet advance", "dedicated payment entry"] },
  { id: "C181TSB", label: "TripSheet Balance Payment", code: "C181", route: "/dashboard/finance/vendor-billing/tripsheet-balance-payment", group: "Finance", keywords: ["tripsheet balance", "dedicated payment entry"] },
  { id: "C181VBF", label: "Vendor Bill Finalization Process", code: "C181", route: "/dashboard/finance/vendor-billing/vendor-bill-finalization", group: "Finance", keywords: ["vendor bill finalization"] },
  { id: "C194", label: "Customer Billing", code: "C194", route: "/dashboard/finance/customer-billing", group: "Finance", keywords: ["transport bill", "bill"] },
  { id: "C194CF", label: "Completion Financial", code: "C194", route: "/dashboard/finance/customer-billing/completion-financial", group: "Finance", keywords: ["docket financial completion", "completion financial"] },
  { id: "C194T", label: "Transport Bill Generation", code: "C194", route: "/dashboard/finance/customer-billing/transport-bill", group: "Finance", keywords: ["bill", "fin"] },
  { id: "C194OB", label: "Other Bill Generation", code: "C194", route: "/dashboard/finance/customer-billing/other-bill", group: "Finance", keywords: ["other bill", "other bill generation"] },
  { id: "C194V", label: "View / Print Bills", code: "C194", route: "/dashboard/finance/customer-billing/view-print-bills", group: "Finance" },
  { id: "C194CI", label: "Customer Invoice", code: "C194", route: "/dashboard/finance/customer-billing/customer-invoice", group: "Finance", keywords: ["customer invoice", "gst tax invoice", "rate contract"] },
  { id: "C194POD", label: "Download Multiple PODs", code: "C194", route: "/dashboard/finance/customer-billing/download-multiple-pods", group: "Finance", keywords: ["download multiple pods", "pod download"] },
  { id: "C655", label: "Genrate E-Invoice (IRN)", code: "C655", route: "/dashboard/finance/e-invoice", group: "Finance" },
  { id: "C655AUTH", label: "Authentication Token", code: "C655", route: "/dashboard/finance/e-invoice/authentication-token", group: "Finance", keywords: ["auth token", "e-invoice author tocken", "e-waybill"] },
  { id: "C655IRN", label: "Generate Invoice Reference Number (IRN)", code: "C655", route: "/dashboard/finance/e-invoice/generate-irn", group: "Finance", keywords: ["genrate irn", "e-invoice irn", "sac code"] },
  { id: "C655CNL", label: "Cancel Invoice Reference Number (IRN)", code: "C655", route: "/dashboard/finance/e-invoice/cancel-irn", group: "Finance", keywords: ["cancel irn", "ack no", "irn no"] },
  { id: "C655CNIRN", label: "Genrate Credit Note (IRN)", code: "C655", route: "/dashboard/finance/e-invoice/generate-credit-note-irn", group: "Finance", keywords: ["credit note irn", "genrate credit note"] },
  { id: "C202", label: "MR Entry", code: "C202", route: "/dashboard/finance/mr-entry", group: "Finance" },
  { id: "C202MRR", label: "Generate Bill MR With Rebate", code: "C202", route: "/dashboard/finance/mr-entry/generate-bill-mr-rebate", group: "Finance", keywords: ["bill mr", "rebate", "money receipt"] },
  { id: "C202MR", label: "Generate Bill MR.", code: "C202", route: "/dashboard/finance/mr-entry/generate-bill-mr", group: "Finance", keywords: ["generate bill mr", "confirm check bills"] },
  { id: "C202PT", label: "Generate Paid/Topay MR.", code: "C202", route: "/dashboard/finance/mr-entry/paid-topay-mr", group: "Finance", keywords: ["paid topay mr", "paidtopaymr", "docket mr"] },
  { id: "C202VP", label: "View Print MR", code: "C202", route: "/dashboard/finance/mr-entry/view-print-mr", group: "Finance", keywords: ["view print mr", "money receipt print"] },
  { id: "C202CN", label: "Credit Note", code: "C202", route: "/dashboard/finance/mr-entry/credit-note", group: "Finance", keywords: ["generate credit note", "credit note mr"] },
  { id: "C202VPCN", label: "View Print Credit Note", code: "C202", route: "/dashboard/finance/mr-entry/view-print-credit-note", group: "Finance", keywords: ["view print credit note", "print cn"] },
  { id: "C202CNN", label: "Credit Note New", code: "C202", route: "/dashboard/finance/mr-entry/credit-note-new", group: "Finance", keywords: ["credit note new", "billing details selection"] },
  { id: "C208", label: "Vouchers", code: "C208", route: "/dashboard/finance/vouchers", group: "Finance" },
  { id: "C208VI", label: "Enter Vendor Invoice", code: "C208", route: "/dashboard/finance/vouchers/enter-vendor-invoice", group: "Finance", keywords: ["vendor invoice entry", "grn", "gstr2b invoice"] },
  { id: "C208VP", label: "Enter Vendor Payment", code: "C208", route: "/dashboard/finance/vouchers/enter-vendor-payment", group: "Finance", keywords: ["vendor invoice payment", "vendor payment"] },
  { id: "C208DV", label: "Debit Voucher", code: "C208", route: "/dashboard/finance/vouchers/debit-voucher", group: "Finance", keywords: ["debit voucher", "payment voucher gst tds"] },
  { id: "C208CV", label: "Credit Voucher", code: "C208", route: "/dashboard/finance/vouchers/credit-voucher", group: "Finance", keywords: ["credit voucher", "received from"] },
  { id: "C208CE", label: "Contra Entry", code: "C208", route: "/dashboard/finance/vouchers/contra-entry", group: "Finance", keywords: ["contra entry", "contra voucher"] },
  { id: "C208JE", label: "Journal Entry", code: "C208", route: "/dashboard/finance/vouchers/journal-entry", group: "Finance", keywords: ["journal entry", "manual journal", "journal voucher"] },
  { id: "C208VPV", label: "View Print Vouchers", code: "C208", route: "/dashboard/finance/vouchers/view-print-vouchers", group: "Finance", keywords: ["view print bills", "view print vouchers"] },
  { id: "C208VJV", label: "View Journal Vouchers", code: "C208", route: "/dashboard/finance/vouchers/view-journal-vouchers", group: "Finance", keywords: ["view journal vouchers", "enter journal voucher"] },
  { id: "C208CVI", label: "Cancel Vendor Invoice", code: "C208", route: "/dashboard/finance/vouchers/cancel-vendor-invoice", group: "Finance", keywords: ["cancel vendor invoice", "vendor invoice payment criteria"] },
  { id: "C208CVP", label: "Cancel Vendor Payment", code: "C208", route: "/dashboard/finance/vouchers/cancel-vendor-payment", group: "Finance", keywords: ["cancel vendor invoice payment", "cancel vendor payment"] },
  { id: "C208VVI", label: "View Vendor Invoice", code: "C208", route: "/dashboard/finance/vouchers/view-vendor-invoice", group: "Finance", keywords: ["view print invoice vendor", "view vendor invoice"] },
  { id: "C208VVIP", label: "View Vendor Invoice Payment", code: "C208", route: "/dashboard/finance/vouchers/view-vendor-invoice-payment", group: "Finance", keywords: ["view print invoice payment", "vendor invoice payment"] },
  { id: "C208DN", label: "Generate Debit Note.", code: "C208", route: "/dashboard/finance/vouchers/debit-note", group: "Finance", keywords: ["debit note", "generate debit note"] },
  { id: "C208VPVN", label: "View Print Vouchers New", code: "C208", route: "/dashboard/finance/vouchers/view-print-vouchers-new", group: "Finance", keywords: ["view print voucher", "view print vouchers new"] },
  { id: "C208VCV", label: "View Cancel Vouchers", code: "C208", route: "/dashboard/finance/vouchers/view-cancel-vouchers", group: "Finance", keywords: ["view cancel voucher", "cancelled vouchers"] },
  { id: "C208G2B", label: "GSTR2B Invoice Booking", code: "C208", route: "/dashboard/finance/vouchers/gstr2b-invoice-booking", group: "Finance", keywords: ["gstr2b", "gstr2b invoice booking"] },
  { id: "C215", label: "Cheque Management", code: "C215", route: "/dashboard/finance/cheque-management", group: "Finance" },
  { id: "C215OAR", label: "On Account Cheque Receipts", code: "C215", route: "/dashboard/finance/cheque-management/on-account-cheque-receipt", group: "Finance", keywords: ["on a/c cheque receipt", "on account receipts", "cheque utr"] },
  { id: "C215OAD", label: "On A/C Cheque Deposit", code: "C215", route: "/dashboard/finance/cheque-management/on-account-cheque-deposit", group: "Finance", keywords: ["on a/c cheque deposit", "cheque entry date"] },
  { id: "C215ACB", label: "Assign Cheque Book", code: "C215", route: "/dashboard/finance/cheque-management/assign-cheque-book", group: "Finance", keywords: ["cheque book issue", "assign cheque book"] },
  { id: "C223", label: "Cash & Bank Statement", code: "C223", route: "/dashboard/finance/cash-bank-statement", group: "Finance", keywords: ["bank"] },
  { id: "C223VPC", label: "View / Print Cash & Bank Statement", code: "C223", route: "/dashboard/finance/cash-bank-statement/view-print-cbs", group: "Finance", keywords: ["view print cbs", "cash bank statement", "cbs"] },
  { id: "C223OPR", label: "Online Payment Report", code: "C223", route: "/dashboard/finance/cash-bank-statement/online-payment-report", group: "Finance", keywords: ["online payment report", "h2h report", "indus"] },
  { id: "C223ORP", label: "Online Payment Re-Process", code: "C223", route: "/dashboard/finance/cash-bank-statement/online-payment-reprocess", group: "Finance", keywords: ["online payment reprocess", "h2h reprocess", "indus"] },
  { id: "C223CBS", label: "Cash and Bank Transaction Statement", code: "C223", route: "/dashboard/reports/accounts/cash-bank-statement", group: "Reports", keywords: ["cbs", "cash bank statement", "view print cbs"] },
  { id: "C225", label: "Print Document [Dot-Matrix ]", code: "C225", route: "/dashboard/finance/print-dot-matrix", group: "Finance" },
  { id: "C225PFM", label: "PDC Freight Memo", code: "C225", route: "/dashboard/finance/print-dot-matrix/pdc-freight-memo", group: "Finance", keywords: ["pdc freight memo", "dot matrix", "print pdc"] },
  { id: "C225PV", label: "Print Vouchers", code: "C225", route: "/dashboard/finance/print-dot-matrix/print-vouchers", group: "Finance", keywords: ["print voucher", "dot matrix voucher", "view print vouchers"] },
  { id: "C225PDA", label: "Print Debit Advice", code: "C225", route: "/dashboard/finance/print-dot-matrix/print-debit-advice", group: "Finance", keywords: ["print debit advice", "view print debit advice", "dot matrix"] },
  { id: "C225DP", label: "Docket Print / CN Number Print", code: "C225", route: "/dashboard/finance/print-dot-matrix/docket-print", group: "Finance", keywords: ["docket print", "cn number print", "dot matrix"] },
  { id: "C782", label: "IndusInd Bank Online Payment Process", code: "C782", route: "/dashboard/finance/bank-payment", group: "Finance", keywords: ["bank", "indus", "h2h", "online payment"] },
  { id: "C850", label: "View Bank Statement", code: "C850", route: "/dashboard/finance/bank-statement", group: "Finance", keywords: ["view bank statement", "brs", "import bank statement"] },
  { id: "C851", label: "API Bank Statement", code: "C851", route: "/dashboard/finance/cash-bank-statement/api-bank-statement", group: "Finance", keywords: ["api bank statement", "account statement analytics"] },

  // CRM
  { id: "C061", label: "Customer Master", code: "C061", route: "/dashboard/masters/customers", group: "CRM" },
  { id: "C062", label: "Customer GST Registration", code: "C062", route: "/dashboard/masters/customer-gst", group: "CRM" },
  { id: "C504", label: "Lead Details", code: "C504", route: "/dashboard/crm/lead-details", group: "CRM" },
  { id: "C505", label: "Vist Details", code: "C505", route: "/dashboard/crm/visit-details", group: "CRM", keywords: ["visit", "quotation"] },
  { id: "C916", label: "Activity", code: "C916", route: "/dashboard/crm/activity", group: "CRM" },

  // Fleet
  { id: "C749", label: "Trip Management", code: "C749", route: "/dashboard/fleet/trip-management", group: "Fleet", keywords: ["company vehicle payment", "advance"] },
  { id: "C749A", label: "Company Advance Payment Entry", code: "C749", route: "/dashboard/fleet/trip-management/company-advance-payment", group: "Fleet", keywords: ["advance", "vehicle payment", "company advance"] },
  { id: "C749S", label: "Trip Settlement", code: "C749", route: "/dashboard/fleet/trip-management/trip-settlement", group: "Fleet", keywords: ["settlement", "tripsheet settle"] },
  { id: "C749P", label: "View Print Trip Settlement", code: "C749", route: "/dashboard/fleet/trip-management/view-print-trip-settlement", group: "Fleet", keywords: ["print settlement", "view trip settlement"] },
  { id: "C749V", label: "View Print Vehicle Advance Payment", code: "C749", route: "/dashboard/fleet/trip-management/view-print-vehicle-advance", group: "Fleet", keywords: ["print advance", "vehicle advance"] },
  { id: "C749VP", label: "Voucher Payment", code: "C749", route: "/dashboard/fleet/trip-management/voucher-payment", group: "Fleet", keywords: ["voucher", "company vehicle payment"] },
  { id: "C750", label: "Fuel and Toll Management", code: "C750", route: "/dashboard/fleet/fuel-toll", group: "Fleet", keywords: ["bpcl", "fuel", "diesel"] },
  { id: "C750B", label: "BPCL Sale Transaction", code: "C750", route: "/dashboard/fleet/fuel-toll/bpcl-sale-transaction", group: "Fleet", keywords: ["bpcl", "fuel summary", "smartfleet"] },
  { id: "C158V", label: "Vehicle Master", code: "C158", route: "/dashboard/masters/vehicles", group: "Fleet", keywords: ["veh", "fleet"] },

  // Tracking
  { id: "C111", label: "Tracking Douments", code: "C111", route: "/dashboard/tracking/documents", group: "Tracking" },
  { id: "C111C", label: "CN Tracking", code: "C111", route: "/dashboard/tracking/documents/cn-tracking", group: "Tracking", keywords: ["docket track", "invoice", "dn"] },
  { id: "C111N", label: "New CN Tracking", code: "C111", route: "/dashboard/tracking/documents/new-cn-tracking", group: "Tracking", keywords: ["view and track", "new cn tracking"] },
  { id: "C111T", label: "Track Documents [CN/TC/THC/PDC]", code: "C111", route: "/dashboard/tracking/documents/track-documents", group: "Tracking", keywords: ["thc", "pdc", "tc", "tracking document"] },
  { id: "C485", label: "Track Customer/Vendor", code: "C485", route: "/dashboard/tracking/party", group: "Tracking" },

  // Exceptional
  { id: "C117", label: "Operation", code: "C117", route: "/dashboard/operations/dockets", group: "Exceptional" },
  { id: "C132", label: "Finance", code: "C132", route: "/dashboard/exceptional/finance", group: "Exceptional", keywords: ["fin"] },
  { id: "C520", label: "Bank Reconciliation Statment", code: "C520", route: "/dashboard/exceptional/brs", group: "Exceptional" },
  { id: "C588", label: "Company Vechicle Exceptional", code: "C588", route: "/dashboard/exceptional/vehicle", group: "Exceptional" },
  {
    id: "C132F",
    label: "Docket Financial Completion",
    code: "C132",
    route: "/dashboard/exceptional/finance",
    group: "Exceptional",
    keywords: ["fin", "financial", "docket"]
  },
  {
    id: "C132P",
    label: "Edit PDC Non-Financial to Financial",
    code: "C132",
    route: "/dashboard/exceptional/finance",
    group: "Exceptional",
    keywords: ["fin", "financial", "pdc"]
  },

  // Reports
  { id: "C084", label: "Operation Report", code: "C084", route: "/dashboard/reports/operations", group: "Reports" },
  { id: "C084C", label: "Consignment Register", code: "C084", route: "/dashboard/reports/operations/consignment-register", group: "Reports", keywords: ["cn register", "booking register"] },
  { id: "C084D", label: "Delivery Register", code: "C084", route: "/dashboard/reports/operations/delivery-register", group: "Reports", keywords: ["booking register delivered", "delivered cn"] },
  { id: "C084B", label: "Booking Summary", code: "C084", route: "/dashboard/reports/operations/booking-summary", group: "Reports", keywords: ["party wise", "branch wise", "booking summary"] },
  { id: "C084P", label: "PDC Register", code: "C084", route: "/dashboard/reports/operations/pdc-register", group: "Reports", keywords: ["pdc register", "delivery pdc", "pickup pdc"] },
  { id: "C084PD", label: "PDC Register [Docket wise]", code: "C084", route: "/dashboard/reports/operations/pdc-register-docket-wise", group: "Reports", keywords: ["pdc docket wise", "docket wise pdc"] },
  { id: "C084S", label: "Scan POD/PODs Report", code: "C084", route: "/dashboard/reports/operations/scan-pod", group: "Reports", keywords: ["scan pod", "pod report", "pod uploaded"] },
  { id: "C084DSR", label: "Proposed DSR Report", code: "C084", route: "/dashboard/reports/operations/dsr", group: "Reports", keywords: ["dsr", "daily status", "dsr new report"] },
  { id: "C085", label: "Finance", code: "C085", route: "/dashboard/reports/finance", group: "Reports", keywords: ["fin"] },
  { id: "C085CN", label: "CN Register With Freight Details", code: "C085", route: "/dashboard/reports/finance/cn-freight-register", group: "Reports", keywords: ["sales register", "freight details", "cn freight"] },
  { id: "C085UB", label: "Un-Billed CN Register", code: "C085", route: "/dashboard/reports/finance/unbilled-cn-register", group: "Reports", keywords: ["unbilled", "unbilled os", "unbilled cn"] },
  { id: "C085UBA", label: "Un-Billed O/S Branch wise ageing", code: "C085", route: "/dashboard/reports/finance/unbilled-branch-ageing", group: "Reports", keywords: ["branch wise ageing", "unbilled ageing"] },
  { id: "C085BD", label: "Bills Generated Report [Docket wise]", code: "C085", route: "/dashboard/reports/finance/bills-generated-docket-wise", group: "Reports", keywords: ["bill register docket wise", "bills generated"] },
  { id: "C085VI", label: "Voucher Wise Invoice Report", code: "C085", route: "/dashboard/reports/finance/voucher-wise-invoice", group: "Reports", keywords: ["voucher invoice", "vendor invoice"] },
  { id: "C085BG", label: "Bills Generated Report", code: "C085", route: "/dashboard/reports/finance/bills-generated", group: "Reports", keywords: ["bill register", "bills generated", "all bill"] },
  { id: "C085BC", label: "Bill Register With Collection Details", code: "C085", route: "/dashboard/reports/finance/bill-register-collection", group: "Reports", keywords: ["collection details", "mr collection", "cheque"] },
  { id: "C085OS", label: "Submitted O/S Detail", code: "C085", route: "/dashboard/reports/finance/submitted-os-detail", group: "Reports", keywords: ["submitted os", "outstanding", "ageing days"] },
  { id: "C085OSW", label: "Submitted O/S Detail [Without On Account]", code: "C085", route: "/dashboard/reports/finance/submitted-os-without-on-account", group: "Reports", keywords: ["without on account", "interest 24", "submitted os"] },
  { id: "C085OSD", label: "Submitted O/S [Docket wise]", code: "C085", route: "/dashboard/reports/finance/submitted-os-docket-wise", group: "Reports", keywords: ["submitted os docket", "docket wise os", "unclosed"] },
  { id: "C085OSA", label: "Submitted O/S Branch wise ageing", code: "C085", route: "/dashboard/reports/finance/submitted-os-branch-ageing", group: "Reports", keywords: ["branch wise ageing", "submitted os ageing", "pdd total"] },
  { id: "C085OSP", label: "Submitted O/S Party wise ageing", code: "C085", route: "/dashboard/reports/finance/submitted-os-party-ageing", group: "Reports", keywords: ["party wise ageing", "customer wise ageing", "on account"] },
  { id: "C085OCT", label: "Docket Wise Octroi Details", code: "C085", route: "/dashboard/reports/finance/docket-wise-octroi", group: "Reports", keywords: ["octroi", "docket wise octroi"] },
  { id: "C085MR", label: "MR wise Collection Report", code: "C085", route: "/dashboard/reports/finance/mr-wise-collection", group: "Reports", keywords: ["mr collection", "money receipt", "cheque"] },
  { id: "C085PW", label: "Party Wise Bill Register", code: "C085", route: "/dashboard/reports/finance/party-wise-bill-register", group: "Reports", keywords: ["party wise bill", "bill summary"] },
  { id: "C086", label: "Accounts", code: "C086", route: "/dashboard/reports/accounts", group: "Reports", keywords: ["trial"] },
  { id: "C086GL", label: "General Ledger", code: "C086", route: "/dashboard/reports/accounts/general-ledger", group: "Reports", keywords: ["general ledger", "account heads", "opening balance"] },
  { id: "C086SL", label: "Subsidiary Ledger", code: "C086", route: "/dashboard/reports/accounts/subsidiary-ledger", group: "Reports", keywords: ["subsidiary ledger", "customer vendor", "octroi agent"] },
  { id: "C086CL", label: "Customer Ledger", code: "C086", route: "/dashboard/reports/accounts/customer-ledger", group: "Reports", keywords: ["customer ledger", "document date", "party ledger"] },
  { id: "C086BPL", label: "Branch Profit and Loss Report", code: "C086", route: "/dashboard/reports/accounts/branch-profit-loss", group: "Reports", keywords: ["branch pnl", "profit loss", "income expense"] },
  { id: "C840", label: "Purchase Report", code: "C840", route: "/dashboard/reports/purchase", group: "Reports" },
  { id: "C088", label: "ERP Tracking", code: "C088", route: "/dashboard/reports/erp-tracking", group: "Reports" },
  { id: "C486", label: "Final Accounts", code: "C486", route: "/dashboard/reports/final-accounts", group: "Reports", keywords: ["fin", "final"] },
  { id: "C486TB", label: "Trial Balance", code: "C486", route: "/dashboard/reports/final-accounts/trial-balance", group: "Reports", keywords: ["trial balance", "opening debit", "closing credit"] },
  { id: "C486PL", label: "Profit & Loss Statement", code: "C486", route: "/dashboard/reports/final-accounts/profit-loss", group: "Reports", keywords: ["profit and loss", "p&l", "income expense"] },
  { id: "C486BS", label: "Balance Sheet", code: "C486", route: "/dashboard/reports/final-accounts/balance-sheet", group: "Reports", keywords: ["balance sheet", "source of funds", "application of funds"] },
  { id: "C486NBS", label: "New Balance Sheet", code: "C486", route: "/dashboard/reports/final-accounts/new-balance-sheet", group: "Reports", keywords: ["new balance sheet", "comparative", "equity and liabilities"] },
  { id: "C486NTB", label: "New Trial Balance", code: "C486", route: "/dashboard/reports/final-accounts/new-trial-balance", group: "Reports", keywords: ["new trial balance", "invoice period", "opening closing"] },
  { id: "C576", label: "Company Vechicle Reports", code: "C576", route: "/dashboard/reports/company-vehicles", group: "Reports" },

  // Profile
  { id: "PROF", label: "Employee Profile Information", code: "PROF", route: "/dashboard/profile", group: "Profile", keywords: ["my profile", "profile"] },

  // Admin
  { id: "C052", label: "Company Structure", code: "C052", route: "/dashboard/admin/company-structure", group: "Admin" },
  { id: "C060", label: "Business Partners", code: "C060", route: "/dashboard/admin/business-partners", group: "Admin", keywords: ["vendor"] },
  { id: "C065", label: "Operations", code: "C065", route: "/dashboard/admin/operations", group: "Admin" },
  { id: "C066", label: "Docket Number Master", code: "C066", route: "/dashboard/masters/docket-numbers", group: "Admin" },
  { id: "C077", label: "Finance & Accounts", code: "C077", route: "/dashboard/admin/finance-accounts", group: "Admin", keywords: ["fin"] },
  { id: "C686", label: "APIs", code: "C686", route: "/dashboard/admin/apis", group: "Admin" }
];

export function searchModules(query: string, limit = 12): ModuleSearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored = MODULE_SEARCH_CATALOG.map((item) => {
    const label = item.label.toLowerCase();
    const code = (item.code || "").toLowerCase();
    const group = item.group.toLowerCase();
    const hay = [label, code, group, ...(item.keywords || [])].join(" ");

    let score = 0;
    if (label.startsWith(q)) score += 100;
    else if (label.includes(q)) score += 60;
    if (code === q || code.includes(q)) score += 80;
    if (group.startsWith(q) || group.includes(q)) score += 40;
    if ((item.keywords || []).some((k) => k.toLowerCase().includes(q) || q.includes(k.toLowerCase()))) {
      score += 50;
    }
    if (!hay.includes(q) && score === 0) return null;
    // Prefer shorter label matches slightly
    score += Math.max(0, 20 - label.length / 4);
    return { item, score };
  }).filter(Boolean) as { item: ModuleSearchItem; score: number }[];

  scored.sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label));
  return scored.slice(0, limit).map((s) => s.item);
}
