# MODULE INVENTORY

**Total Main Modules:** 8
**Total Functional Pages / Sub-Dashboards:** 214

## Operations (ID: C001)

### Submodule: Freight Booking (C009)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C009`
- **Available Functional Pages (3):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C010 | **New CN** | `PAGES/OPERATIONS.PAGES/ReliableDocketScr.aspx` | `/operations/new-cn` |
| C011 | **Edit CN** | `PAGES/OPERATIONS.PAGES/EditCnNew.aspx` | `/operations/edit-cn` |
| C632 | **View/Print E-Docket** | `PAGES/OPERATIONS.PAGES/Reports/ViewPrintEDocket.aspx` | `/operations/view-print-e-docket` |

### Submodule: CN Operations [System] (C019)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C019`
- **Available Functional Pages (2):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C022 | **Edit CN** | `PAGES/OPERATIONS.PAGES/EditDocketList.aspx` | `/operations/edit-cn` |
| C023 | **View/Print CN** | `PAGES/OPERATIONS.PAGES/Reports/ViewCnsel.aspx?CN` | `/operations/view-print-cn` |

### Submodule: TripSheet Operations (C035)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C035`
- **Available Functional Pages (4):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C036 | **Prepare Pickup PDC** | `PAGES/OPERATIONS.PAGES/PickupPDC.aspx` | `/operations/prepare-pickup-pdc` |
| C037 | **Prepare Delivery PDC** | `PAGES/OPERATIONS.PAGES/DLYPDC.aspx` | `/operations/prepare-delivery-pdc` |
| C709 | **Prepare Loading Slip** | `PAGES/OPERATIONS.PAGES/Reports/LoadingSlip.aspx` | `/operations/prepare-loading-slip` |
| C038 | **Update Delivery PDC** | `PAGES/OPERATIONS.PAGES/UpdateDlyPDC.aspx` | `/operations/update-delivery-pdc` |

### Submodule: View Print Document (C039)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C039`
- **Available Functional Pages (2):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C042 | **View/Print Pickup PDC** | `PAGES/OPERATIONS.PAGES/Reports/ViewCnsel.aspx?PPDC` | `/operations/view-print-pickup-pdc` |
| C043 | **View/Print Delivery PDC** | `PAGES/OPERATIONS.PAGES/Reports/ViewCnsel.aspx?DPDC` | `/operations/view-print-delivery-pdc` |

## Finance (ID: C002)

### Submodule: Vendor Billing (C181)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C181`
- **Available Functional Pages (7):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C188 | **PDC Freight/Advance Payment [Single] ** | `PAGES/ACCOUNTS.PAGES/PDCAdvPayment.aspx` | `/finance/pdc-freight-advance-payment-single` |
| C189 | **PDC Freight/Advance Payment [Multiple] ** | `PAGES/ACCOUNTS.PAGES/MulPDCAdvPay.aspx` | `/finance/pdc-freight-advance-payment-multiple` |
| C190 | **PDC Balance Payment [Single]** | `PAGES/ACCOUNTS.PAGES/PDCBalPayment.aspx` | `/finance/pdc-balance-payment-single` |
| C191 | **PDC Balance Payment [Multiple]** | `PAGES/ACCOUNTS.PAGES/MulPDCBalPay.aspx` | `/finance/pdc-balance-payment-multiple` |
| C704 | **TripShet Advance Payment** | `PAGES/ACCOUNTS.PAGES/VegithTripSheetAdvancePayment.aspx` | `/finance/tripshet-advance-payment` |
| C776 | **TripSheet Balance Payment** | `PAGES/ACCOUNTS.PAGES/VegithTripSheetAdvancePayment.aspx` | `/finance/tripsheet-balance-payment` |
| C777 | **Vendor Bill Finalization Process** | `PAGES/ACCOUNTS.PAGES/VegithTripVendorBillFinlization.aspx` | `/finance/vendor-bill-finalization-process` |

### Submodule: Customer Billing (C194)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C194`
- **Available Functional Pages (6):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C195 | **Docket Financial Completion** | `PAGES/ACCOUNTS.PAGES/Bill/DockListFin.aspx` | `/finance/docket-financial-completion` |
| C196 | **Transport Bill** | `PAGES/ACCOUNTS.PAGES/Bill/BillGenrateStep1.aspx` | `/finance/transport-bill` |
| C331 | **Other Bill** | `PAGES/ACCOUNTS.PAGES/Bill/OtherBill.aspx` | `/finance/other-bill` |
| C197 | **View Print Bill** | `PAGES/ACCOUNTS.PAGES/PrintDoument/ViewPrintBills.aspx` | `/finance/view-print-bill` |
| C754 | **Customer Invoice** | `PAGES/ACCOUNTS.PAGES/Bill/OtherInvoiceEntry.aspx` | `/finance/customer-invoice` |
| C837 | **Download Multiple PODs** | `PAGES/ACCOUNTS.PAGES/Bill/QryMultiplePODView.aspx` | `/finance/download-multiple-pods` |

### Submodule: Genrate E-Invoice (IRN) (C655)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C655`
- **Available Functional Pages (4):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C656 | **Authentication Token** | `PAGES/MASTERS.PAGES/EinvoiceAuthoToken.aspx` | `/finance/authentication-token` |
| C654 | **Genrate IRN** | `PAGES/ACCOUNTS.PAGES/Bill/GenrateIRN.aspx` | `/finance/genrate-irn` |
| C657 | **Cancel IRN** | `PAGES/ACCOUNTS.PAGES/Bill/CancelIRN.aspx` | `/finance/cancel-irn` |
| C948 | **Genrate Credit Note IRN** | `PAGES/ACCOUNTS.PAGES/Bill/CreditNoteIRN.aspx` | `/finance/genrate-credit-note-irn` |

### Submodule: MR Entry (C202)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C202`
- **Available Functional Pages (7):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C459 | **Generate Bill MR With Rebate** | `PAGES/ACCOUNTS.PAGES/MR/BillMR_Rebate.aspx` | `/finance/generate-bill-mr-with-rebate` |
| C204 | **Generate Bill MR.** | `PAGES/ACCOUNTS.PAGES/MR/BillMR_RebateNew.aspx` | `/finance/generate-bill-mr` |
| C568 | **Generate Paid/Topay MR.** | `PAGES/ACCOUNTS.PAGES/MR/QryPaidToMR.aspx` | `/finance/generate-paid-topay-mr` |
| C206 | **View Print MR** | `PAGES/ACCOUNTS.PAGES/PrintDoument/ViewPrintMR.aspx` | `/finance/view-print-mr` |
| C207 | **Credit Note** | `PAGES/ACCOUNTS.PAGES/MR/CreditNote.aspx` | `/finance/credit-note` |
| C605 | **View Print Credit Note** | `PAGES/ACCOUNTS.PAGES/PrintDoument/ViewPrintCreditNote.aspx` | `/finance/view-print-credit-note` |
| C770 | **Credit Note New** | `PAGES/ACCOUNTS.PAGES/MR/QryCreditNot.aspx` | `/finance/credit-note-new` |

### Submodule: Vouchers (C208)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C208`
- **Available Functional Pages (16):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C695 | **Enter Vendor Invoice** | `PAGES/CompVehicle/VendorInvoice/GRNWOInvoiceEntry.aspx` | `/finance/enter-vendor-invoice` |
| C696 | **Enter Vendor Payment** | `PAGES/CompVehicle/VendorInvoice/VendorInvoicePayment.aspx` | `/finance/enter-vendor-payment` |
| C209 | **Debit Voucher** | `PAGES/ACCOUNTS.PAGES/Vouchers/ManualDebitVoucher.aspx?C209` | `/finance/debit-voucher` |
| C210 | **Credit Voucher** | `PAGES/ACCOUNTS.PAGES/Vouchers/CrVoucher.aspx` | `/finance/credit-voucher` |
| C211 | **Contra Entry** | `PAGES/ACCOUNTS.PAGES/Vouchers/CoVoucher.aspx` | `/finance/contra-entry` |
| C212 | **Journal Entry** | `PAGES/ACCOUNTS.PAGES/Vouchers/ManualJournal.aspx` | `/finance/journal-entry` |
| C213 | **View Print Vouchers** | `PAGES/ACCOUNTS.PAGES/PrintDoument/ViewPrintVoucher.aspx` | `/finance/view-print-vouchers` |
| C214 | **View Journal Vouchers** | `PAGES/ACCOUNTS.PAGES/PrintDoument/ViewPrintJVvoucher.aspx` | `/finance/view-journal-vouchers` |
| C755 | **Cancel Vendor Invoice** | `PAGES/CompVehicle/Exceptional/CancelVendorInvoice.aspx` | `/finance/cancel-vendor-invoice` |
| C756 | **Cancel Vendor Payment** | `PAGES/CompVehicle/Exceptional/CancelVendorPayment.aspx` | `/finance/cancel-vendor-payment` |
| C772 | **View/Print Invoice Vendor** | `PAGES/CompVehicle/VendorInvoice/ViewPrintVenodrInvoice.aspx` | `/finance/view-print-invoice-vendor` |
| C773 | **View/Print Invoice Payment** | `PAGES/CompVehicle/VendorInvoice/ViewPrintVenodrPayment.aspx` | `/finance/view-print-invoice-payment` |
| C774 | **Debit Note** | `PAGES/ACCOUNTS.PAGES/Vouchers/DebitNote.aspx` | `/finance/debit-note` |
| C812 | **View Print Vouchers New** | `PAGES/ACCOUNTS.PAGES/PrintDoument/ViewPrintVoucherNew.aspx` | `/finance/view-print-vouchers-new` |
| C842 | **View Cancel Vouchers** | `PAGES/ACCOUNTS.PAGES/PrintDoument/ViewCancelVoucher.aspx?C842` | `/finance/view-cancel-vouchers` |
| C998 | **GSTR2B Invoice Booking** | `PAGES/CompVehicle/VendorInvoice/GSTR2BInvoiceEntry.aspx` | `/finance/gstr2b-invoice-booking` |

### Submodule: Cheque Management (C215)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C215`
- **Available Functional Pages (3):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C216 | **On a/c Cheque Receipt** | `PAGES/ACCOUNTS.PAGES/ChqMgt/ONAcctChequeRecpt.aspx` | `/finance/on-a-c-cheque-receipt` |
| C217 | **On A/C Cheque Deposit** | `PAGES/ACCOUNTS.PAGES/ChqMgt/ONAcctChequeDept.aspx` | `/finance/on-a-c-cheque-deposit` |
| C218 | **Assign Cheque Book** | `PAGES/ACCOUNTS.PAGES/ChqMgt/ChqBookIssue.aspx` | `/finance/assign-cheque-book` |

### Submodule: Cash & Bank Statement (C223)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C223`
- **Available Functional Pages (6):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C224 | **View / Print Cash & Bank Statement** | `PAGES/ACCOUNTS.PAGES/AccountMIS/CBS.aspx` | `/finance/view-print-cash-bank-statement` |
| C782 | **Indusind Bank Online Payment Process** | `PAGES/ACCOUNTS.PAGES/Vouchers/H2HOnlineBankPayment.aspx` | `/finance/indusind-bank-online-payment-process` |
| C628 | **Online Payment Report** | `PAGES/ACCOUNTS.PAGES/Reports/OnlinePaymentReport.aspx` | `/finance/online-payment-report` |
| C813 | **Online Payment Re-Process** | `PAGES/ACCOUNTS.PAGES/Vouchers/OnlinePaymentReProcess.aspx` | `/finance/online-payment-re-process` |
| C850 | **View Bank Statement** | `PAGES/ACCOUNTS.PAGES/Vouchers/BankStatement.aspx` | `/finance/view-bank-statement` |
| C913 | **API Bank Statement** | `PAGES/ACCOUNTS.PAGES/Vouchers/APIBankStatement.aspx` | `/finance/api-bank-statement` |

### Submodule: Print Document [Dot-Matrix ] (C225)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C225`
- **Available Functional Pages (6):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C237 | **PDC Freight Memo** | `PAGES/ACCOUNTS.PAGES/PrintDoument/DotMatrx/QryPDCFrtMemo.aspx` | `/finance/pdc-freight-memo` |
| C238 | **PDC Advance Voucher** | `inline` | `/finance/pdc-advance-voucher` |
| C239 | **Print Voucher** | `PAGES/ACCOUNTS.PAGES/PrintDoument/DotMatrx/VoucherViewPrint.aspx` | `/finance/print-voucher` |
| C240 | **Print Debit Advice** | `PAGES/ACCOUNTS.PAGES/PrintDoument/DotMatrx/QryAdvicePrint.aspx` | `/finance/print-debit-advice` |
| C241 | **Print Journal Voucher ** | `inline` | `/finance/print-journal-voucher` |
| C242 | **Docket Print** | `PAGES/ACCOUNTS.PAGES/PrintDoument/DotMatrx/NonHpCnPrint.aspx` | `/finance/docket-print` |

## CRM (ID: C003)

### Submodule: Lead Details (C504)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C504`
- **Available Functional Pages (1):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C638 | **Outlook** | `PAGES/Sales/ViewOutlook.aspx` | `/crm/outlook` |

### Submodule: Vist Details (C505)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C505`
- **Available Functional Pages (2):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C510 | **Update Visit Details** | `PAGES/Sales/UpdateVisitDet.aspx` | `/crm/update-visit-details` |
| C795 | **Quotation** | `PAGES/Sales/Quotation.aspx` | `/crm/quotation` |

### Submodule: Activity (C916)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C916`
- **Available Functional Pages (1):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C920 | **OutLook Calendar** | `PAGES/Sales/NextVisitCalender.aspx?O` | `/crm/outlook-calendar` |

## Fleet (ID: C748)

### Submodule: Trip Management (C749)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C749`
- **Available Functional Pages (5):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C571 | **Vehicle Advance Payment** | `PAGES/CompVehicle/VehicleAdv.aspx` | `/fleet/vehicle-advance-payment` |
| C572 | **Trip Settlement** | `PAGES/CompVehicle/TripSettlement.aspx` | `/fleet/trip-settlement` |
| C573 | **View Print Trip Settlement** | `PAGES/CompVehicle/ViewPrintTripSettlement.aspx` | `/fleet/view-print-trip-settlement` |
| C574 | **View Print Vehicle Advance Payment** | `PAGES/CompVehicle/ViewPrintVehicleAdvPay.aspx` | `/fleet/view-print-vehicle-advance-payment` |
| C575 | **Voucher Payment** | `PAGES/CompVehicle/VoucherPayment.aspx` | `/fleet/voucher-payment` |

### Submodule: Fuel and Toll Management (C750)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C750`
- **Available Functional Pages (1):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C719 | **BPCL Sale Transaction Report** | `PAGES/CompVehicle/Reports/BPCLFuelData.aspx?1` | `/fleet/bpcl-sale-transaction-report` |

## Tracking (ID: C004)

### Submodule: Tracking Douments (C111)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C111`
- **Available Functional Pages (6):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C112 | **Docket Tracking** | `PAGES/OPERATIONS.PAGES/Reports/TrackCn.aspx` | `/tracking/docket-tracking` |
| C800 | **New CN Tracking** | `PAGES/OPERATIONS.PAGES/Reports/TrackingDocketNew.aspx` | `/tracking/new-cn-tracking` |
| C113 | **Track CN Expense** | `PAGES/ACCOUNTS.PAGES/SalesReport/DocketWisePL.aspx` | `/tracking/track-cn-expense` |
| C114 | **Track Documents [CN/TC/THC/PDC]** | `PAGES/OPERATIONS.PAGES/Reports/TrackDocument.aspx` | `/tracking/track-documents-cn-tc-thc-pdc` |
| C115 | **View Pod Scan ** | `PAGES/OPERATIONS.PAGES/Reports/PodScanScrn.aspx?D` | `/tracking/view-pod-scan` |
| C559 | **Bill Genrated Details** | `PAGES/ACCOUNTS.PAGES/Reports/RptBillGenDet.aspx` | `/tracking/bill-genrated-details` |

### Submodule: Track Customer/Vendor (C485)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C485`
- **Available Functional Pages (4):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C346 | **Validate Vendor PAN** | `PAGES/MASTERS.PAGES/ValidatePanno.aspx` | `/tracking/validate-vendor-pan` |
| C347 | **Track Vendor PAN** | `PAGES/MASTERS.PAGES/UserGuide/TrackVendor.aspx` | `/tracking/track-vendor-pan` |
| C349 | **Track Customer details** | `PAGES/MASTERS.PAGES/UserGuide/TrackCustomer.aspx` | `/tracking/track-customer-details` |
| C544 | **Customer GST Registration Report** | `PAGES/MASTERS.PAGES/CustGSTRegtReport.aspx` | `/tracking/customer-gst-registration-report` |

## Exceptional (ID: C116)

### Submodule: Operation (C117)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C117`
- **Available Functional Pages (9):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C013 | **Reassign & Next  Location** | `PAGES/OPERATIONS.PAGES/reassign.aspx` | `/exceptional/reassign-next-location` |
| C120 | **Cancel Delivery PDC** | `PAGES/OPERATIONS.PAGES/Exception/PDCCancel.aspx` | `/exceptional/cancel-delivery-pdc` |
| C122 | **Edit THC Vendor/Date/Vehicle** | `PAGES/OPERATIONS.PAGES/Exception/EditTHCDet.aspx` | `/exceptional/edit-thc-vendor-date-vehicle` |
| C123 | **Change Route** | `PAGES/OPERATIONS.PAGES/Exception/EditRut.aspx` | `/exceptional/change-route` |
| C125 | **Edit Billing Party** | `PAGES/ACCOUNTS.PAGES/Exception/ChngGSTBillParty.aspx` | `/exceptional/edit-billing-party` |
| C126 | **Edit Manual document Number** | `PAGES/OPERATIONS.PAGES/Exception/EditManualDoc.aspx` | `/exceptional/edit-manual-document-number` |
| C127 | **Edit PDC Vendor/Date/Vehicle** | `PAGES/OPERATIONS.PAGES/Exception/EditPDCDet.aspx` | `/exceptional/edit-pdc-vendor-date-vehicle` |
| C128 | **Edit Billing Party/Branch/Po NO** | `PAGES/OPERATIONS.PAGES/Exception/EditBillingPartyBrancPono.aspx` | `/exceptional/edit-billing-party-branch-po-no` |
| C611 | **Edit From & To location** | `PAGES/OPERATIONS.PAGES/Exception/EditFromToLoc.aspx` | `/exceptional/edit-from-to-location` |

### Submodule: Finance (C132)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C132`
- **Available Functional Pages (29):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C138 | **Edit PDC Advance Payable Branch** | `PAGES/ACCOUNTS.PAGES/Exception/ChngPDCAdvBalBr.aspx?A` | `/exceptional/edit-pdc-advance-payable-branch` |
| C139 | **Edit PDC Balance Payable Branch** | `PAGES/ACCOUNTS.PAGES/Exception/ChngPDCAdvBalBr.aspx?B` | `/exceptional/edit-pdc-balance-payable-branch` |
| C140 | **Edit PDC Vendor/Date/Vehicle** | `PAGES/ACCOUNTS.PAGES/Exception/ChngPDCVend.aspx` | `/exceptional/edit-pdc-vendor-date-vehicle` |
| C141 | **Cancel PDC Advance Entry** | `PAGES/ACCOUNTS.PAGES/Exception/CancelPDCAdv.aspx` | `/exceptional/cancel-pdc-advance-entry` |
| C142 | **Cancel Multiple PDC Advance Entry** | `PAGES/ACCOUNTS.PAGES/Exception/CancelMulPDCAdv.aspx` | `/exceptional/cancel-multiple-pdc-advance-entry` |
| C143 | **Edit Bill Collection Branch** | `PAGES/ACCOUNTS.PAGES/Exception/ChngCollBr.aspx` | `/exceptional/edit-bill-collection-branch` |
| C144 | **Edit Bill Remark and Bill Address** | `PAGES/ACCOUNTS.PAGES/Exception/BillRemark.aspx` | `/exceptional/edit-bill-remark-and-bill-address` |
| C145 | **Edit Bill Amount** | `PAGES/ACCOUNTS.PAGES/Exception/EditFrtBillAmt.aspx` | `/exceptional/edit-bill-amount` |
| C146 | **Edit Billing Party** | `PAGES/ACCOUNTS.PAGES/Exception/ChngBillParty.aspx` | `/exceptional/edit-billing-party` |
| C147 | **Edit Bill Date** | `PAGES/ACCOUNTS.PAGES/Exception/EditBillDt.aspx` | `/exceptional/edit-bill-date` |
| C148 | **Cancel Bill** | `PAGES/ACCOUNTS.PAGES/Exception/CancelBill.aspx` | `/exceptional/cancel-bill` |
| C149 | **Cancel MR** | `PAGES/ACCOUNTS.PAGES/MR/CancelMR.aspx` | `/exceptional/cancel-mr` |
| C150 | **Edit MR Bank Account** | `PAGES/ACCOUNTS.PAGES/MR/EditMrAcct.aspx` | `/exceptional/edit-mr-bank-account` |
| C151 | **Edit Manual document Number** | `inline` | `/exceptional/edit-manual-document-number` |
| C152 | **Edit Voucher Date** | `PAGES/ACCOUNTS.PAGES/Exception/ChngVoucherDt.aspx` | `/exceptional/edit-voucher-date` |
| C153 | **Edit Cheque No & Date** | `PAGES/ACCOUNTS.PAGES/Exception/EditChqno.aspx` | `/exceptional/edit-cheque-no-date` |
| C155 | **Cancel Cheque** | `PAGES/ACCOUNTS.PAGES/Exception/CancelChq.aspx` | `/exceptional/cancel-cheque` |
| C156 | **Cancel Voucher** | `PAGES/ACCOUNTS.PAGES/Exception/CancelVoucher.aspx` | `/exceptional/cancel-voucher` |
| C163 | **Edit Account Head** | `PAGES/ACCOUNTS.PAGES/Exception/ChangeACHeads.aspx` | `/exceptional/edit-account-head` |
| C166 | **Edit Docket** | `PAGES/ACCOUNTS.PAGES/Exception/ChngDestProd.aspx` | `/exceptional/edit-docket` |
| C167 | **Edit Narration** | `PAGES/ACCOUNTS.PAGES/Exception/EditNarration.aspx` | `/exceptional/edit-narration` |
| C168 | **Edit Voucher Amount** | `inline` | `/exceptional/edit-voucher-amount` |
| C177 | **Edit PDC Non-Financial to Financial** | `PAGES/ACCOUNTS.PAGES/Exception/EditPDCNonFin.aspx` | `/exceptional/edit-pdc-non-financial-to-financial` |
| C178 | **Update Vendor PAN NUMBER** | `PAGES/ACCOUNTS.PAGES/Exception/EditPanNo.aspx` | `/exceptional/update-vendor-pan-number` |
| C484 | **Cancel Vendor Invoice** | `PAGES/CCFF/Exception/CancelVendorInv.aspx` | `/exceptional/cancel-vendor-invoice` |
| C488 | **Cancel Vendor Payment** | `PAGES/CCFF/Exception/CancelVendorPayment.aspx` | `/exceptional/cancel-vendor-payment` |
| C518 | **Edit Other Bill Amount** | `PAGES/ACCOUNTS.PAGES/Exception/QryOtherBill.aspx` | `/exceptional/edit-other-bill-amount` |
| C533 | **Update Vendor TDS Aplicable** | `PAGES/ACCOUNTS.PAGES/Vouchers/TDSAplicable.aspx` | `/exceptional/update-vendor-tds-aplicable` |
| C775 | **Edit Dedicated Bill Amount** | `PAGES/ACCOUNTS.PAGES/Exception/EditDedicatedBillAmt.aspx` | `/exceptional/edit-dedicated-bill-amount` |

### Submodule: Bank Reconciliation Statment (C520)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C520`
- **Available Functional Pages (1):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C521 | **Update BRS** | `PAGES/ACCOUNTS.PAGES/ChqMgt/ChqClearDt.aspx` | `/exceptional/update-brs` |

### Submodule: Company Vehicle Exceptional (C588)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C588`
- **Available Functional Pages (5):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C589 | **Change Payment Branch** | `PAGES/CompVehicle/Exceptional/EditPaymentBr.aspx` | `/exceptional/change-payment-branch` |
| C593 | **Cancel Vehicle Advance Payment** | `PAGES/CompVehicle/Exceptional/CancelVehAdvPayment.aspx` | `/exceptional/cancel-vehicle-advance-payment` |
| C594 | **Cancel Trip Settlement** | `PAGES/CompVehicle/Exceptional/CancelledTripSettlemnet.aspx` | `/exceptional/cancel-trip-settlement` |
| C803 | **Cancel GRN** | `PAGES/CompVehicle/FleetGRN/QryCancelGrn.aspx` | `/exceptional/cancel-grn` |
| C804 | **Cancel GIN** | `PAGES/CompVehicle/FleetGIN/CancelGIN.aspx` | `/exceptional/cancel-gin` |

## Reports (ID: C006)

### Submodule: Operation Report (C084)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C084`
- **Available Functional Pages (8):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C091 | **CN Register** | `PAGES/OPERATIONS.PAGES/Reports/CNRegister.aspx?1` | `/reports/cn-register` |
| C092 | **Undeliverd CN Register** | `PAGES/OPERATIONS.PAGES/Reports/CNRegisterUnDeliver.aspx` | `/reports/undeliverd-cn-register` |
| C094 | **Delivery Register** | `PAGES/OPERATIONS.PAGES/Reports/DelyRegistred.aspx?1` | `/reports/delivery-register` |
| C097 | **Booking Summary** | `PAGES/OPERATIONS.PAGES/Reports/Bkg_summ.aspx` | `/reports/booking-summary` |
| C103 | **PDC Register** | `PAGES/OPERATIONS.PAGES/Reports/PDCRegistred.aspx?1` | `/reports/pdc-register` |
| C104 | **PDC Register [Docket wise]** | `PAGES/OPERATIONS.PAGES/Reports/PDCRegistred.aspx?2` | `/reports/pdc-register-docket-wise` |
| C109 | **Scan POD/PODs Report** | `PAGES/OPERATIONS.PAGES/Reports/ScanPodReport.aspx` | `/reports/scan-pod-pods-report` |
| C324 | **DSR New Report** | `PAGES/OPERATIONS.PAGES/HPReports/DSRNewRpt.aspx?1` | `/reports/dsr-new-report` |

### Submodule: Finance (C085)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C085`
- **Available Functional Pages (20):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C093 | **CN Register With Freight Details** | `PAGES/OPERATIONS.PAGES/Reports/CNRegister.aspx?2` | `/reports/cn-register-with-freight-details` |
| C260 | **Un-Billed CN Registred** | `PAGES/ACCOUNTS.PAGES/Reports/UnbilledOSDet.aspx?2` | `/reports/un-billed-cn-registred` |
| C259 | **Un-Billed CNs Branch wise ageing** | `PAGES/ACCOUNTS.PAGES/Reports/UnbilledOSDet.aspx?4` | `/reports/un-billed-cns-branch-wise-ageing` |
| C452 | **Bills Generated Report [Docket wise]** | `PAGES/ACCOUNTS.PAGES/Reports/BillReg.aspx?2` | `/reports/bills-generated-report-docket-wise` |
| C787 | **Voucher Wise Invoice Report** | `PAGES/CompVehicle/Reports/VendorVoucherwiseInvoiceDet.aspx?C787` | `/reports/voucher-wise-invoice-report` |
| C261 | **Bills Generated Report** | `PAGES/ACCOUNTS.PAGES/Reports/BillReg.aspx?1` | `/reports/bills-generated-report` |
| C262 | **Party Wise Bill Summary** | `PAGES/ACCOUNTS.PAGES/Reports/BillReg.aspx?5` | `/reports/party-wise-bill-summary` |
| C263 | **Bill Register With Collection Details** | `PAGES/ACCOUNTS.PAGES/Reports/BillReg.aspx?4` | `/reports/bill-register-with-collection-details` |
| C266 | **Submitted O/S Detail** | `PAGES/ACCOUNTS.PAGES/Reports/qry_other.aspx?1` | `/reports/submitted-o-s-detail` |
| C483 | **Submitted O/S Detail [Without On Account]** | `PAGES/ACCOUNTS.PAGES/Reports/qry_other.aspx?7` | `/reports/submitted-o-s-detail-without-on-account` |
| C267 | **Submitted O/S [Docket wise]** | `PAGES/ACCOUNTS.PAGES/Reports/qry_other.aspx?2` | `/reports/submitted-o-s-docket-wise` |
| C268 | **Submitted O/S Branch wise ageing** | `PAGES/ACCOUNTS.PAGES/Reports/qry_other.aspx?4` | `/reports/submitted-o-s-branch-wise-ageing` |
| C269 | **Submitted O/S PDD Report** | `PAGES/ACCOUNTS.PAGES/Reports/qry_other.aspx?5` | `/reports/submitted-o-s-pdd-report` |
| C274 | **Docket Wise Octroi Details** | `PAGES/ACCOUNTS.PAGES/Reports/qry_DktWiseOct.aspx` | `/reports/docket-wise-octroi-details` |
| C275 | **MR wise Collection Report** | `PAGES/ACCOUNTS.PAGES/Reports/MrWiseColl.aspx` | `/reports/mr-wise-collection-report` |
| C276 | **BILL wise Collection Report** | `PAGES/ACCOUNTS.PAGES/Reports/BillReg.aspx?6` | `/reports/bill-wise-collection-report` |
| C281 | **THC/PDC Financial updation Pending** | `PAGES/ACCOUNTS.PAGES/Reports/THCPDCFinUptPend.aspx` | `/reports/thc-pdc-financial-updation-pending` |
| C284 | **Unadjusted Cheque Report** | `PAGES/ACCOUNTS.PAGES/Reports/unadjchq.aspx` | `/reports/unadjusted-cheque-report` |
| C783 | **Customer Un-Billed CN Registred** | `PAGES/ACCOUNTS.PAGES/Reports/UnbilledOSDet.aspx?6` | `/reports/customer-un-billed-cn-registred` |
| C841 | **Bill Wise O/S Detail** | `PAGES/ACCOUNTS.PAGES/Reports/CustomerWiseOS.aspx` | `/reports/bill-wise-o-s-detail` |

### Submodule: Accounts (C086)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C086`
- **Available Functional Pages (17):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C286 | **Cash and Bank Transaction Statement** | `PAGES/ACCOUNTS.PAGES/AccountMIS/CBS.aspx` | `/reports/cash-and-bank-transaction-statement` |
| C288 | **General Ledger** | `PAGES/ACCOUNTS.PAGES/AccountMIS/JournalLedger.aspx` | `/reports/general-ledger` |
| C289 | **Subsidiary Ledger** | `PAGES/ACCOUNTS.PAGES/AccountMIS/SubsidiaryLedger.aspx` | `/reports/subsidiary-ledger` |
| C647 | **Customer Ledger** | `PAGES/ACCOUNTS.PAGES/AccountMIS/CustomerSubsidiaryLedgerRpt.aspx` | `/reports/customer-ledger` |
| C293 | **Branch P&L Report** | `PAGES/ACCOUNTS.PAGES/AccountMIS/BrwisePLReport.aspx` | `/reports/branch-p-l-report` |
| C300 | **Negative Cash Balance Statement** | `inline` | `/reports/negative-cash-balance-statement` |
| C301 | **Debit Advice Report** | `PAGES/ACCOUNTS.PAGES/AccountMIS/DebitAdviceRpt.aspx` | `/reports/debit-advice-report` |
| C302 | **TDS Report** | `PAGES/ACCOUNTS.PAGES/AccountMIS/TdsReport.aspx` | `/reports/tds-report` |
| C313 | **Issued Cheques** | `PAGES/ACCOUNTS.PAGES/AccountMIS/IssuedChq.aspx` | `/reports/issued-cheques` |
| C314 | **Received Cheques** | `PAGES/ACCOUNTS.PAGES/AccountMIS/RecivedChq.aspx` | `/reports/received-cheques` |
| C318 | **Cash & Bank Report** | `inline` | `/reports/cash-bank-report` |
| C512 | **Voucher Approvals** | `PAGES/ACCOUNTS.PAGES/Vouchers/PendingVoucherAppv.aspx?2` | `/reports/voucher-approvals` |
| C514 | **Voucher Approval All** | `PAGES/ACCOUNTS.PAGES/Vouchers/VoucherApprovalAll.aspx` | `/reports/voucher-approval-all` |
| C590 | **GST Report** | `PAGES/ACCOUNTS.PAGES/AccountMIS/GSTReport.aspx` | `/reports/gst-report` |
| C599 | **GST OutPut Register** | `PAGES/ACCOUNTS.PAGES/AccountMIS/GSTOutPutReport.aspx?O` | `/reports/gst-output-register` |
| C622 | **GSTR1 Report** | `PAGES/ACCOUNTS.PAGES/AccountMIS/GSTOutPutReport.aspx?R1` | `/reports/gstr1-report` |
| C600 | **Bill Edit Register** | `PAGES/ACCOUNTS.PAGES/AccountMIS/BilllEditRep.aspx` | `/reports/bill-edit-register` |

### Submodule: Purchase Report (C840)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C840`
- **Available Functional Pages (6):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C778 | **Vendor Outstanding Report** | `PAGES/ACCOUNTS.PAGES/Reports/VendorUnbilledReport.aspx?2` | `/reports/vendor-outstanding-report` |
| C779 | **Vendor Unbilled Report** | `PAGES/ACCOUNTS.PAGES/Reports/VendorUnbilledReport.aspx?1` | `/reports/vendor-unbilled-report` |
| C788 | **Other Vendor O/s Report** | `PAGES/CompVehicle/Reports/WithOutTripWiseVendorOutStandingReport.aspx?C788` | `/reports/other-vendor-o-s-report` |
| C838 | **Vendor Invoice Details** | `PAGES/ACCOUNTS.PAGES/Reports/OtherVendorInvoiceDetailsReport.aspx?C838` | `/reports/vendor-invoice-details` |
| C279 | **PDC Advance Payment** | `PAGES/ACCOUNTS.PAGES/Reports/PDCAdvPay.aspx` | `/reports/pdc-advance-payment` |
| C280 | **PDC Wise Vendor O/S Report** | `PAGES/ACCOUNTS.PAGES/Reports/PDCOSReg.aspx` | `/reports/pdc-wise-vendor-o-s-report` |

### Submodule: ERP Tracking (C088)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C088`
- **Available Functional Pages (2):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C444 | **PDC Advance Payment Pending** | `PAGES/OPERATIONS.PAGES/Reports/ERPMonitoringReport.aspx?PDCADV` | `/reports/pdc-advance-payment-pending` |
| C445 | **PDC Balance Payment Pending** | `PAGES/OPERATIONS.PAGES/Reports/ERPMonitoringReport.aspx?PDCBAL` | `/reports/pdc-balance-payment-pending` |

### Submodule: Final Accounts (C486)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C486`
- **Available Functional Pages (5):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C291 | **Trial Balance** | `PAGES/ACCOUNTS.PAGES/AccountMIS/TrailBalance.aspx` | `/reports/trial-balance` |
| C292 | **Profit & Loss Statement** | `PAGES/ACCOUNTS.PAGES/AccountMIS/ProfitLoss.aspx` | `/reports/profit-loss-statement` |
| C295 | **Balance Sheet** | `PAGES/ACCOUNTS.PAGES/AccountMIS/BalanceSheet.aspx` | `/reports/balance-sheet` |
| C621 | **New Balance Sheet** | `PAGES/ACCOUNTS.PAGES/AccountMIS/NewBalanceSheet.aspx` | `/reports/new-balance-sheet` |
| C810 | **New Trial Balance** | `PAGES/ACCOUNTS.PAGES/AccountMIS/TrailBalanceNew.aspx` | `/reports/new-trial-balance` |

### Submodule: Company Vechicle Reports (C576)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C576`
- **Available Functional Pages (11):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C577 | **Pending for Trip Settlement** | `PAGES/CompVehicle/Reports/PendingTripSettlement.aspx?S` | `/reports/pending-for-trip-settlement` |
| C578 | **Pending for Trip Advance** | `PAGES/CompVehicle/Reports/PendingTripSettlement.aspx?A` | `/reports/pending-for-trip-advance` |
| C580 | **Trip Register** | `PAGES/CompVehicle/Reports/TripRegister.aspx` | `/reports/trip-register` |
| C581 | **Trip wise Income Vs. Expense** | `PAGES/CompVehicle/Reports/TripWiseIncomeExp.aspx?T` | `/reports/trip-wise-income-vs-expense` |
| C584 | **Vehicle Wise Income Vs. Expense** | `PAGES/CompVehicle/Reports/TripWiseIncomeExp.aspx?V` | `/reports/vehicle-wise-income-vs-expense` |
| C597 | **Stock Report** | `PAGES/CompVehicle/Reports/StockReport.aspx` | `/reports/stock-report` |
| C598 | **GIN Register** | `PAGES/CompVehicle/Reports/GinRegistre.aspx` | `/reports/gin-register` |
| C732 | **New Tyre Register Report** | `PAGES/CompVehicle/Reports/NewTyreRegistered.aspx` | `/reports/new-tyre-register-report` |
| C733 | **Old Tyre Register Report** | `PAGES/CompVehicle/Reports/OldTyreRegistered.aspx` | `/reports/old-tyre-register-report` |
| C734 | **Claim Tyre Register Report** | `PAGES/CompVehicle/Reports/ClaimTryeReport.aspx?2` | `/reports/claim-tyre-register-report` |
| C735 | **Remould Tyre Report** | `PAGES/CompVehicle/Reports/RemoldTryeReport.aspx` | `/reports/remould-tyre-report` |

## Admin (ID: C007)

### Submodule: Company Structure (C052)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C052`
- **Available Functional Pages (4):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C054 | **Branch Master** | `PAGES/MASTERS.PAGES/BranchListMaster.aspx?C054` | `/admin/branch-master` |
| C055 | **Employee Master** | `PAGES/MASTERS.PAGES/EmployeeListMst.aspx?C055` | `/admin/employee-master` |
| C058 | **Route Master** | `PAGES/MASTERS.PAGES/DestinationList.aspx?C058` | `/admin/route-master` |
| C681 | **E-Mail Configuration** | `PAGES/MASTERS.PAGES/MailConfig.aspx` | `/admin/e-mail-configuration` |

### Submodule: Business Partners (C060)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C060`
- **Available Functional Pages (5):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C061 | **Customer Master** | `PAGES/MASTERS.PAGES/CustomerListMaster.aspx?C061` | `/admin/customer-master` |
| C062 | **Customer GST Registration** | `PAGES/MASTERS.PAGES/CustGSTRegsList.aspx?C062` | `/admin/customer-gst-registration` |
| C063 | **Vendor Master** | `PAGES/MASTERS.PAGES/VendorListMaster.aspx?C063` | `/admin/vendor-master` |
| C615 | **Vendor Approval** | `PAGES/MASTERS.PAGES/VendorAproval.aspx` | `/admin/vendor-approval` |
| C721 | **Vendor GST Registration** | `PAGES/MASTERS.PAGES/VendorGSTRegsList.aspx?C721` | `/admin/vendor-gst-registration` |

### Submodule: Operations (C065)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C065`
- **Available Functional Pages (3):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C067 | **FTL Type** | `PAGES/MASTERS.PAGES/FTLMasterList.aspx?C067` | `/admin/ftl-type` |
| C633 | **Route Cost Master** | `PAGES/MASTERS.PAGES/RutCost.aspx` | `/admin/route-cost-master` |
| C648 | **Vehicle Master** | `PAGES/MASTERS.PAGES/VehicleListMst.aspx?C648` | `/admin/vehicle-master` |

### Submodule: Finance & Accounts (C077)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C077`
- **Available Functional Pages (1):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C793 | **GST Sac Code Master** | `PAGES/MASTERS.PAGES/GSTSacCode.aspx?C793` | `/admin/gst-sac-code-master` |

### Submodule: APIs (C686)
- **Navigation Route:** `PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?C686`
- **Available Functional Pages (2):**

| Code | Page Name | Original Legacy URL | Target Architecture Route |
|------|-----------|----------------------|---------------------------|
| C689 | **Driving Licence API** | `PAGES/ImportTask/APIs/DriverLicenceUlip.aspx` | `/admin/driving-licence-api` |
| C688 | **Pan Card API** | `PAGES/ImportTask/APIs/iddocument.html` | `/admin/pan-card-api` |

