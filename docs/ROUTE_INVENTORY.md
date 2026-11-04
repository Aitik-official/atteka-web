# ROUTE INVENTORY

Comprehensive map of all routes in the modern Next.js App Router replica corresponding to legacy endpoints.

| Module | Submodule | Code | Page Name | Legacy ASP.NET Path | Next.js Replica Route |
|--------|-----------|------|-----------|---------------------|-----------------------|
| Operations | Freight Booking | C010 | New CN | `PAGES/OPERATIONS.PAGES/ReliableDocketScr.aspx` | `/dashboard/operations/new-cn` |
| Operations | Freight Booking | C011 | Edit CN | `PAGES/OPERATIONS.PAGES/EditCnNew.aspx` | `/dashboard/operations/edit-cn` |
| Operations | Freight Booking | C632 | View/Print E-Docket | `PAGES/OPERATIONS.PAGES/Reports/ViewPrintEDocket.aspx` | `/dashboard/operations/view-print-e-docket` |
| Operations | CN Operations [System] | C022 | Edit CN | `PAGES/OPERATIONS.PAGES/EditDocketList.aspx` | `/dashboard/operations/edit-cn` |
| Operations | CN Operations [System] | C023 | View/Print CN | `PAGES/OPERATIONS.PAGES/Reports/ViewCnsel.aspx?CN` | `/dashboard/operations/view-print-cn` |
| Operations | TripSheet Operations | C036 | Prepare Pickup PDC | `PAGES/OPERATIONS.PAGES/PickupPDC.aspx` | `/dashboard/operations/prepare-pickup-pdc` |
| Operations | TripSheet Operations | C037 | Prepare Delivery PDC | `PAGES/OPERATIONS.PAGES/DLYPDC.aspx` | `/dashboard/operations/prepare-delivery-pdc` |
| Operations | TripSheet Operations | C709 | Prepare Loading Slip | `PAGES/OPERATIONS.PAGES/Reports/LoadingSlip.aspx` | `/dashboard/operations/prepare-loading-slip` |
| Operations | TripSheet Operations | C038 | Update Delivery PDC | `PAGES/OPERATIONS.PAGES/UpdateDlyPDC.aspx` | `/dashboard/operations/update-delivery-pdc` |
| Operations | View Print Document | C042 | View/Print Pickup PDC | `PAGES/OPERATIONS.PAGES/Reports/ViewCnsel.aspx?PPDC` | `/dashboard/operations/view-print-pickup-pdc` |
| Operations | View Print Document | C043 | View/Print Delivery PDC | `PAGES/OPERATIONS.PAGES/Reports/ViewCnsel.aspx?DPDC` | `/dashboard/operations/view-print-delivery-pdc` |
| Finance | Vendor Billing | C188 | PDC Freight/Advance Payment [Single]  | `PAGES/ACCOUNTS.PAGES/PDCAdvPayment.aspx` | `/dashboard/finance/pdc-freight-advance-payment-single` |
| Finance | Vendor Billing | C189 | PDC Freight/Advance Payment [Multiple]  | `PAGES/ACCOUNTS.PAGES/MulPDCAdvPay.aspx` | `/dashboard/finance/pdc-freight-advance-payment-multiple` |
| Finance | Vendor Billing | C190 | PDC Balance Payment [Single] | `PAGES/ACCOUNTS.PAGES/PDCBalPayment.aspx` | `/dashboard/finance/pdc-balance-payment-single` |
| Finance | Vendor Billing | C191 | PDC Balance Payment [Multiple] | `PAGES/ACCOUNTS.PAGES/MulPDCBalPay.aspx` | `/dashboard/finance/pdc-balance-payment-multiple` |
| Finance | Vendor Billing | C704 | TripShet Advance Payment | `PAGES/ACCOUNTS.PAGES/VegithTripSheetAdvancePayment.aspx` | `/dashboard/finance/tripshet-advance-payment` |
| Finance | Vendor Billing | C776 | TripSheet Balance Payment | `PAGES/ACCOUNTS.PAGES/VegithTripSheetAdvancePayment.aspx` | `/dashboard/finance/tripsheet-balance-payment` |
| Finance | Vendor Billing | C777 | Vendor Bill Finalization Process | `PAGES/ACCOUNTS.PAGES/VegithTripVendorBillFinlization.aspx` | `/dashboard/finance/vendor-bill-finalization-process` |
| Finance | Customer Billing | C195 | Docket Financial Completion | `PAGES/ACCOUNTS.PAGES/Bill/DockListFin.aspx` | `/dashboard/finance/docket-financial-completion` |
| Finance | Customer Billing | C196 | Transport Bill | `PAGES/ACCOUNTS.PAGES/Bill/BillGenrateStep1.aspx` | `/dashboard/finance/transport-bill` |
| Finance | Customer Billing | C331 | Other Bill | `PAGES/ACCOUNTS.PAGES/Bill/OtherBill.aspx` | `/dashboard/finance/other-bill` |
| Finance | Customer Billing | C197 | View Print Bill | `PAGES/ACCOUNTS.PAGES/PrintDoument/ViewPrintBills.aspx` | `/dashboard/finance/view-print-bill` |
| Finance | Customer Billing | C754 | Customer Invoice | `PAGES/ACCOUNTS.PAGES/Bill/OtherInvoiceEntry.aspx` | `/dashboard/finance/customer-invoice` |
| Finance | Customer Billing | C837 | Download Multiple PODs | `PAGES/ACCOUNTS.PAGES/Bill/QryMultiplePODView.aspx` | `/dashboard/finance/download-multiple-pods` |
| Finance | Genrate E-Invoice (IRN) | C656 | Authentication Token | `PAGES/MASTERS.PAGES/EinvoiceAuthoToken.aspx` | `/dashboard/finance/authentication-token` |
| Finance | Genrate E-Invoice (IRN) | C654 | Genrate IRN | `PAGES/ACCOUNTS.PAGES/Bill/GenrateIRN.aspx` | `/dashboard/finance/genrate-irn` |
| Finance | Genrate E-Invoice (IRN) | C657 | Cancel IRN | `PAGES/ACCOUNTS.PAGES/Bill/CancelIRN.aspx` | `/dashboard/finance/cancel-irn` |
| Finance | Genrate E-Invoice (IRN) | C948 | Genrate Credit Note IRN | `PAGES/ACCOUNTS.PAGES/Bill/CreditNoteIRN.aspx` | `/dashboard/finance/genrate-credit-note-irn` |
| Finance | MR Entry | C459 | Generate Bill MR With Rebate | `PAGES/ACCOUNTS.PAGES/MR/BillMR_Rebate.aspx` | `/dashboard/finance/generate-bill-mr-with-rebate` |
| Finance | MR Entry | C204 | Generate Bill MR. | `PAGES/ACCOUNTS.PAGES/MR/BillMR_RebateNew.aspx` | `/dashboard/finance/generate-bill-mr` |
| Finance | MR Entry | C568 | Generate Paid/Topay MR. | `PAGES/ACCOUNTS.PAGES/MR/QryPaidToMR.aspx` | `/dashboard/finance/generate-paid-topay-mr` |
| Finance | MR Entry | C206 | View Print MR | `PAGES/ACCOUNTS.PAGES/PrintDoument/ViewPrintMR.aspx` | `/dashboard/finance/view-print-mr` |
| Finance | MR Entry | C207 | Credit Note | `PAGES/ACCOUNTS.PAGES/MR/CreditNote.aspx` | `/dashboard/finance/credit-note` |
| Finance | MR Entry | C605 | View Print Credit Note | `PAGES/ACCOUNTS.PAGES/PrintDoument/ViewPrintCreditNote.aspx` | `/dashboard/finance/view-print-credit-note` |
| Finance | MR Entry | C770 | Credit Note New | `PAGES/ACCOUNTS.PAGES/MR/QryCreditNot.aspx` | `/dashboard/finance/credit-note-new` |
| Finance | Vouchers | C695 | Enter Vendor Invoice | `PAGES/CompVehicle/VendorInvoice/GRNWOInvoiceEntry.aspx` | `/dashboard/finance/enter-vendor-invoice` |
| Finance | Vouchers | C696 | Enter Vendor Payment | `PAGES/CompVehicle/VendorInvoice/VendorInvoicePayment.aspx` | `/dashboard/finance/enter-vendor-payment` |
| Finance | Vouchers | C209 | Debit Voucher | `PAGES/ACCOUNTS.PAGES/Vouchers/ManualDebitVoucher.aspx?C209` | `/dashboard/finance/debit-voucher` |
| Finance | Vouchers | C210 | Credit Voucher | `PAGES/ACCOUNTS.PAGES/Vouchers/CrVoucher.aspx` | `/dashboard/finance/credit-voucher` |
| Finance | Vouchers | C211 | Contra Entry | `PAGES/ACCOUNTS.PAGES/Vouchers/CoVoucher.aspx` | `/dashboard/finance/contra-entry` |
| Finance | Vouchers | C212 | Journal Entry | `PAGES/ACCOUNTS.PAGES/Vouchers/ManualJournal.aspx` | `/dashboard/finance/journal-entry` |
| Finance | Vouchers | C213 | View Print Vouchers | `PAGES/ACCOUNTS.PAGES/PrintDoument/ViewPrintVoucher.aspx` | `/dashboard/finance/view-print-vouchers` |
| Finance | Vouchers | C214 | View Journal Vouchers | `PAGES/ACCOUNTS.PAGES/PrintDoument/ViewPrintJVvoucher.aspx` | `/dashboard/finance/view-journal-vouchers` |
| Finance | Vouchers | C755 | Cancel Vendor Invoice | `PAGES/CompVehicle/Exceptional/CancelVendorInvoice.aspx` | `/dashboard/finance/cancel-vendor-invoice` |
| Finance | Vouchers | C756 | Cancel Vendor Payment | `PAGES/CompVehicle/Exceptional/CancelVendorPayment.aspx` | `/dashboard/finance/cancel-vendor-payment` |
| Finance | Vouchers | C772 | View/Print Invoice Vendor | `PAGES/CompVehicle/VendorInvoice/ViewPrintVenodrInvoice.aspx` | `/dashboard/finance/view-print-invoice-vendor` |
| Finance | Vouchers | C773 | View/Print Invoice Payment | `PAGES/CompVehicle/VendorInvoice/ViewPrintVenodrPayment.aspx` | `/dashboard/finance/view-print-invoice-payment` |
| Finance | Vouchers | C774 | Debit Note | `PAGES/ACCOUNTS.PAGES/Vouchers/DebitNote.aspx` | `/dashboard/finance/debit-note` |
| Finance | Vouchers | C812 | View Print Vouchers New | `PAGES/ACCOUNTS.PAGES/PrintDoument/ViewPrintVoucherNew.aspx` | `/dashboard/finance/view-print-vouchers-new` |
| Finance | Vouchers | C842 | View Cancel Vouchers | `PAGES/ACCOUNTS.PAGES/PrintDoument/ViewCancelVoucher.aspx?C842` | `/dashboard/finance/view-cancel-vouchers` |
| Finance | Vouchers | C998 | GSTR2B Invoice Booking | `PAGES/CompVehicle/VendorInvoice/GSTR2BInvoiceEntry.aspx` | `/dashboard/finance/gstr2b-invoice-booking` |
| Finance | Cheque Management | C216 | On a/c Cheque Receipt | `PAGES/ACCOUNTS.PAGES/ChqMgt/ONAcctChequeRecpt.aspx` | `/dashboard/finance/on-a-c-cheque-receipt` |
| Finance | Cheque Management | C217 | On A/C Cheque Deposit | `PAGES/ACCOUNTS.PAGES/ChqMgt/ONAcctChequeDept.aspx` | `/dashboard/finance/on-a-c-cheque-deposit` |
| Finance | Cheque Management | C218 | Assign Cheque Book | `PAGES/ACCOUNTS.PAGES/ChqMgt/ChqBookIssue.aspx` | `/dashboard/finance/assign-cheque-book` |
| Finance | Cash & Bank Statement | C224 | View / Print Cash & Bank Statement | `PAGES/ACCOUNTS.PAGES/AccountMIS/CBS.aspx` | `/dashboard/finance/view-print-cash-bank-statement` |
| Finance | Cash & Bank Statement | C782 | Indusind Bank Online Payment Process | `PAGES/ACCOUNTS.PAGES/Vouchers/H2HOnlineBankPayment.aspx` | `/dashboard/finance/indusind-bank-online-payment-process` |
| Finance | Cash & Bank Statement | C628 | Online Payment Report | `PAGES/ACCOUNTS.PAGES/Reports/OnlinePaymentReport.aspx` | `/dashboard/finance/online-payment-report` |
| Finance | Cash & Bank Statement | C813 | Online Payment Re-Process | `PAGES/ACCOUNTS.PAGES/Vouchers/OnlinePaymentReProcess.aspx` | `/dashboard/finance/online-payment-re-process` |
| Finance | Cash & Bank Statement | C850 | View Bank Statement | `PAGES/ACCOUNTS.PAGES/Vouchers/BankStatement.aspx` | `/dashboard/finance/view-bank-statement` |
| Finance | Cash & Bank Statement | C913 | API Bank Statement | `PAGES/ACCOUNTS.PAGES/Vouchers/APIBankStatement.aspx` | `/dashboard/finance/api-bank-statement` |
| Finance | Print Document [Dot-Matrix ] | C237 | PDC Freight Memo | `PAGES/ACCOUNTS.PAGES/PrintDoument/DotMatrx/QryPDCFrtMemo.aspx` | `/dashboard/finance/pdc-freight-memo` |
| Finance | Print Document [Dot-Matrix ] | C238 | PDC Advance Voucher | `N/A` | `/dashboard/finance/pdc-advance-voucher` |
| Finance | Print Document [Dot-Matrix ] | C239 | Print Voucher | `PAGES/ACCOUNTS.PAGES/PrintDoument/DotMatrx/VoucherViewPrint.aspx` | `/dashboard/finance/print-voucher` |
| Finance | Print Document [Dot-Matrix ] | C240 | Print Debit Advice | `PAGES/ACCOUNTS.PAGES/PrintDoument/DotMatrx/QryAdvicePrint.aspx` | `/dashboard/finance/print-debit-advice` |
| Finance | Print Document [Dot-Matrix ] | C241 | Print Journal Voucher  | `N/A` | `/dashboard/finance/print-journal-voucher` |
| Finance | Print Document [Dot-Matrix ] | C242 | Docket Print | `PAGES/ACCOUNTS.PAGES/PrintDoument/DotMatrx/NonHpCnPrint.aspx` | `/dashboard/finance/docket-print` |
| CRM | Lead Details | C638 | Outlook | `PAGES/Sales/ViewOutlook.aspx` | `/dashboard/crm/outlook` |
| CRM | Vist Details | C510 | Update Visit Details | `PAGES/Sales/UpdateVisitDet.aspx` | `/dashboard/crm/update-visit-details` |
| CRM | Vist Details | C795 | Quotation | `PAGES/Sales/Quotation.aspx` | `/dashboard/crm/quotation` |
| CRM | Activity | C920 | OutLook Calendar | `PAGES/Sales/NextVisitCalender.aspx?O` | `/dashboard/crm/outlook-calendar` |
| Fleet | Trip Management | C571 | Vehicle Advance Payment | `PAGES/CompVehicle/VehicleAdv.aspx` | `/dashboard/fleet/vehicle-advance-payment` |
| Fleet | Trip Management | C572 | Trip Settlement | `PAGES/CompVehicle/TripSettlement.aspx` | `/dashboard/fleet/trip-settlement` |
| Fleet | Trip Management | C573 | View Print Trip Settlement | `PAGES/CompVehicle/ViewPrintTripSettlement.aspx` | `/dashboard/fleet/view-print-trip-settlement` |
| Fleet | Trip Management | C574 | View Print Vehicle Advance Payment | `PAGES/CompVehicle/ViewPrintVehicleAdvPay.aspx` | `/dashboard/fleet/view-print-vehicle-advance-payment` |
| Fleet | Trip Management | C575 | Voucher Payment | `PAGES/CompVehicle/VoucherPayment.aspx` | `/dashboard/fleet/voucher-payment` |
| Fleet | Fuel and Toll Management | C719 | BPCL Sale Transaction Report | `PAGES/CompVehicle/Reports/BPCLFuelData.aspx?1` | `/dashboard/fleet/bpcl-sale-transaction-report` |
| Tracking | Tracking Douments | C112 | Docket Tracking | `PAGES/OPERATIONS.PAGES/Reports/TrackCn.aspx` | `/dashboard/tracking/docket-tracking` |
| Tracking | Tracking Douments | C800 | New CN Tracking | `PAGES/OPERATIONS.PAGES/Reports/TrackingDocketNew.aspx` | `/dashboard/tracking/new-cn-tracking` |
| Tracking | Tracking Douments | C113 | Track CN Expense | `PAGES/ACCOUNTS.PAGES/SalesReport/DocketWisePL.aspx` | `/dashboard/tracking/track-cn-expense` |
| Tracking | Tracking Douments | C114 | Track Documents [CN/TC/THC/PDC] | `PAGES/OPERATIONS.PAGES/Reports/TrackDocument.aspx` | `/dashboard/tracking/track-documents-cn-tc-thc-pdc` |
| Tracking | Tracking Douments | C115 | View Pod Scan  | `PAGES/OPERATIONS.PAGES/Reports/PodScanScrn.aspx?D` | `/dashboard/tracking/view-pod-scan` |
| Tracking | Tracking Douments | C559 | Bill Genrated Details | `PAGES/ACCOUNTS.PAGES/Reports/RptBillGenDet.aspx` | `/dashboard/tracking/bill-genrated-details` |
| Tracking | Track Customer/Vendor | C346 | Validate Vendor PAN | `PAGES/MASTERS.PAGES/ValidatePanno.aspx` | `/dashboard/tracking/validate-vendor-pan` |
| Tracking | Track Customer/Vendor | C347 | Track Vendor PAN | `PAGES/MASTERS.PAGES/UserGuide/TrackVendor.aspx` | `/dashboard/tracking/track-vendor-pan` |
| Tracking | Track Customer/Vendor | C349 | Track Customer details | `PAGES/MASTERS.PAGES/UserGuide/TrackCustomer.aspx` | `/dashboard/tracking/track-customer-details` |
| Tracking | Track Customer/Vendor | C544 | Customer GST Registration Report | `PAGES/MASTERS.PAGES/CustGSTRegtReport.aspx` | `/dashboard/tracking/customer-gst-registration-report` |
| Exceptional | Operation | C013 | Reassign & Next  Location | `PAGES/OPERATIONS.PAGES/reassign.aspx` | `/dashboard/exceptional/reassign-next-location` |
| Exceptional | Operation | C120 | Cancel Delivery PDC | `PAGES/OPERATIONS.PAGES/Exception/PDCCancel.aspx` | `/dashboard/exceptional/cancel-delivery-pdc` |
| Exceptional | Operation | C122 | Edit THC Vendor/Date/Vehicle | `PAGES/OPERATIONS.PAGES/Exception/EditTHCDet.aspx` | `/dashboard/exceptional/edit-thc-vendor-date-vehicle` |
| Exceptional | Operation | C123 | Change Route | `PAGES/OPERATIONS.PAGES/Exception/EditRut.aspx` | `/dashboard/exceptional/change-route` |
| Exceptional | Operation | C125 | Edit Billing Party | `PAGES/ACCOUNTS.PAGES/Exception/ChngGSTBillParty.aspx` | `/dashboard/exceptional/edit-billing-party` |
| Exceptional | Operation | C126 | Edit Manual document Number | `PAGES/OPERATIONS.PAGES/Exception/EditManualDoc.aspx` | `/dashboard/exceptional/edit-manual-document-number` |
| Exceptional | Operation | C127 | Edit PDC Vendor/Date/Vehicle | `PAGES/OPERATIONS.PAGES/Exception/EditPDCDet.aspx` | `/dashboard/exceptional/edit-pdc-vendor-date-vehicle` |
| Exceptional | Operation | C128 | Edit Billing Party/Branch/Po NO | `PAGES/OPERATIONS.PAGES/Exception/EditBillingPartyBrancPono.aspx` | `/dashboard/exceptional/edit-billing-party-branch-po-no` |
| Exceptional | Operation | C611 | Edit From & To location | `PAGES/OPERATIONS.PAGES/Exception/EditFromToLoc.aspx` | `/dashboard/exceptional/edit-from-to-location` |
| Exceptional | Finance | C138 | Edit PDC Advance Payable Branch | `PAGES/ACCOUNTS.PAGES/Exception/ChngPDCAdvBalBr.aspx?A` | `/dashboard/exceptional/edit-pdc-advance-payable-branch` |
| Exceptional | Finance | C139 | Edit PDC Balance Payable Branch | `PAGES/ACCOUNTS.PAGES/Exception/ChngPDCAdvBalBr.aspx?B` | `/dashboard/exceptional/edit-pdc-balance-payable-branch` |
| Exceptional | Finance | C140 | Edit PDC Vendor/Date/Vehicle | `PAGES/ACCOUNTS.PAGES/Exception/ChngPDCVend.aspx` | `/dashboard/exceptional/edit-pdc-vendor-date-vehicle` |
| Exceptional | Finance | C141 | Cancel PDC Advance Entry | `PAGES/ACCOUNTS.PAGES/Exception/CancelPDCAdv.aspx` | `/dashboard/exceptional/cancel-pdc-advance-entry` |
| Exceptional | Finance | C142 | Cancel Multiple PDC Advance Entry | `PAGES/ACCOUNTS.PAGES/Exception/CancelMulPDCAdv.aspx` | `/dashboard/exceptional/cancel-multiple-pdc-advance-entry` |
| Exceptional | Finance | C143 | Edit Bill Collection Branch | `PAGES/ACCOUNTS.PAGES/Exception/ChngCollBr.aspx` | `/dashboard/exceptional/edit-bill-collection-branch` |
| Exceptional | Finance | C144 | Edit Bill Remark and Bill Address | `PAGES/ACCOUNTS.PAGES/Exception/BillRemark.aspx` | `/dashboard/exceptional/edit-bill-remark-and-bill-address` |
| Exceptional | Finance | C145 | Edit Bill Amount | `PAGES/ACCOUNTS.PAGES/Exception/EditFrtBillAmt.aspx` | `/dashboard/exceptional/edit-bill-amount` |
| Exceptional | Finance | C146 | Edit Billing Party | `PAGES/ACCOUNTS.PAGES/Exception/ChngBillParty.aspx` | `/dashboard/exceptional/edit-billing-party` |
| Exceptional | Finance | C147 | Edit Bill Date | `PAGES/ACCOUNTS.PAGES/Exception/EditBillDt.aspx` | `/dashboard/exceptional/edit-bill-date` |
| Exceptional | Finance | C148 | Cancel Bill | `PAGES/ACCOUNTS.PAGES/Exception/CancelBill.aspx` | `/dashboard/exceptional/cancel-bill` |
| Exceptional | Finance | C149 | Cancel MR | `PAGES/ACCOUNTS.PAGES/MR/CancelMR.aspx` | `/dashboard/exceptional/cancel-mr` |
| Exceptional | Finance | C150 | Edit MR Bank Account | `PAGES/ACCOUNTS.PAGES/MR/EditMrAcct.aspx` | `/dashboard/exceptional/edit-mr-bank-account` |
| Exceptional | Finance | C151 | Edit Manual document Number | `N/A` | `/dashboard/exceptional/edit-manual-document-number` |
| Exceptional | Finance | C152 | Edit Voucher Date | `PAGES/ACCOUNTS.PAGES/Exception/ChngVoucherDt.aspx` | `/dashboard/exceptional/edit-voucher-date` |
| Exceptional | Finance | C153 | Edit Cheque No & Date | `PAGES/ACCOUNTS.PAGES/Exception/EditChqno.aspx` | `/dashboard/exceptional/edit-cheque-no-date` |
| Exceptional | Finance | C155 | Cancel Cheque | `PAGES/ACCOUNTS.PAGES/Exception/CancelChq.aspx` | `/dashboard/exceptional/cancel-cheque` |
| Exceptional | Finance | C156 | Cancel Voucher | `PAGES/ACCOUNTS.PAGES/Exception/CancelVoucher.aspx` | `/dashboard/exceptional/cancel-voucher` |
| Exceptional | Finance | C163 | Edit Account Head | `PAGES/ACCOUNTS.PAGES/Exception/ChangeACHeads.aspx` | `/dashboard/exceptional/edit-account-head` |
| Exceptional | Finance | C166 | Edit Docket | `PAGES/ACCOUNTS.PAGES/Exception/ChngDestProd.aspx` | `/dashboard/exceptional/edit-docket` |
| Exceptional | Finance | C167 | Edit Narration | `PAGES/ACCOUNTS.PAGES/Exception/EditNarration.aspx` | `/dashboard/exceptional/edit-narration` |
| Exceptional | Finance | C168 | Edit Voucher Amount | `N/A` | `/dashboard/exceptional/edit-voucher-amount` |
| Exceptional | Finance | C177 | Edit PDC Non-Financial to Financial | `PAGES/ACCOUNTS.PAGES/Exception/EditPDCNonFin.aspx` | `/dashboard/exceptional/edit-pdc-non-financial-to-financial` |
| Exceptional | Finance | C178 | Update Vendor PAN NUMBER | `PAGES/ACCOUNTS.PAGES/Exception/EditPanNo.aspx` | `/dashboard/exceptional/update-vendor-pan-number` |
| Exceptional | Finance | C484 | Cancel Vendor Invoice | `PAGES/CCFF/Exception/CancelVendorInv.aspx` | `/dashboard/exceptional/cancel-vendor-invoice` |
| Exceptional | Finance | C488 | Cancel Vendor Payment | `PAGES/CCFF/Exception/CancelVendorPayment.aspx` | `/dashboard/exceptional/cancel-vendor-payment` |
| Exceptional | Finance | C518 | Edit Other Bill Amount | `PAGES/ACCOUNTS.PAGES/Exception/QryOtherBill.aspx` | `/dashboard/exceptional/edit-other-bill-amount` |
| Exceptional | Finance | C533 | Update Vendor TDS Aplicable | `PAGES/ACCOUNTS.PAGES/Vouchers/TDSAplicable.aspx` | `/dashboard/exceptional/update-vendor-tds-aplicable` |
| Exceptional | Finance | C775 | Edit Dedicated Bill Amount | `PAGES/ACCOUNTS.PAGES/Exception/EditDedicatedBillAmt.aspx` | `/dashboard/exceptional/edit-dedicated-bill-amount` |
| Exceptional | Bank Reconciliation Statment | C521 | Update BRS | `PAGES/ACCOUNTS.PAGES/ChqMgt/ChqClearDt.aspx` | `/dashboard/exceptional/update-brs` |
| Exceptional | Company Vehicle Exceptional | C589 | Change Payment Branch | `PAGES/CompVehicle/Exceptional/EditPaymentBr.aspx` | `/dashboard/exceptional/change-payment-branch` |
| Exceptional | Company Vehicle Exceptional | C593 | Cancel Vehicle Advance Payment | `PAGES/CompVehicle/Exceptional/CancelVehAdvPayment.aspx` | `/dashboard/exceptional/cancel-vehicle-advance-payment` |
| Exceptional | Company Vehicle Exceptional | C594 | Cancel Trip Settlement | `PAGES/CompVehicle/Exceptional/CancelledTripSettlemnet.aspx` | `/dashboard/exceptional/cancel-trip-settlement` |
| Exceptional | Company Vehicle Exceptional | C803 | Cancel GRN | `PAGES/CompVehicle/FleetGRN/QryCancelGrn.aspx` | `/dashboard/exceptional/cancel-grn` |
| Exceptional | Company Vehicle Exceptional | C804 | Cancel GIN | `PAGES/CompVehicle/FleetGIN/CancelGIN.aspx` | `/dashboard/exceptional/cancel-gin` |
| Reports | Operation Report | C091 | CN Register | `PAGES/OPERATIONS.PAGES/Reports/CNRegister.aspx?1` | `/dashboard/reports/cn-register` |
| Reports | Operation Report | C092 | Undeliverd CN Register | `PAGES/OPERATIONS.PAGES/Reports/CNRegisterUnDeliver.aspx` | `/dashboard/reports/undeliverd-cn-register` |
| Reports | Operation Report | C094 | Delivery Register | `PAGES/OPERATIONS.PAGES/Reports/DelyRegistred.aspx?1` | `/dashboard/reports/delivery-register` |
| Reports | Operation Report | C097 | Booking Summary | `PAGES/OPERATIONS.PAGES/Reports/Bkg_summ.aspx` | `/dashboard/reports/booking-summary` |
| Reports | Operation Report | C103 | PDC Register | `PAGES/OPERATIONS.PAGES/Reports/PDCRegistred.aspx?1` | `/dashboard/reports/pdc-register` |
| Reports | Operation Report | C104 | PDC Register [Docket wise] | `PAGES/OPERATIONS.PAGES/Reports/PDCRegistred.aspx?2` | `/dashboard/reports/pdc-register-docket-wise` |
| Reports | Operation Report | C109 | Scan POD/PODs Report | `PAGES/OPERATIONS.PAGES/Reports/ScanPodReport.aspx` | `/dashboard/reports/scan-pod-pods-report` |
| Reports | Operation Report | C324 | DSR New Report | `PAGES/OPERATIONS.PAGES/HPReports/DSRNewRpt.aspx?1` | `/dashboard/reports/dsr-new-report` |
| Reports | Finance | C093 | CN Register With Freight Details | `PAGES/OPERATIONS.PAGES/Reports/CNRegister.aspx?2` | `/dashboard/reports/cn-register-with-freight-details` |
| Reports | Finance | C260 | Un-Billed CN Registred | `PAGES/ACCOUNTS.PAGES/Reports/UnbilledOSDet.aspx?2` | `/dashboard/reports/un-billed-cn-registred` |
| Reports | Finance | C259 | Un-Billed CNs Branch wise ageing | `PAGES/ACCOUNTS.PAGES/Reports/UnbilledOSDet.aspx?4` | `/dashboard/reports/un-billed-cns-branch-wise-ageing` |
| Reports | Finance | C452 | Bills Generated Report [Docket wise] | `PAGES/ACCOUNTS.PAGES/Reports/BillReg.aspx?2` | `/dashboard/reports/bills-generated-report-docket-wise` |
| Reports | Finance | C787 | Voucher Wise Invoice Report | `PAGES/CompVehicle/Reports/VendorVoucherwiseInvoiceDet.aspx?C787` | `/dashboard/reports/voucher-wise-invoice-report` |
| Reports | Finance | C261 | Bills Generated Report | `PAGES/ACCOUNTS.PAGES/Reports/BillReg.aspx?1` | `/dashboard/reports/bills-generated-report` |
| Reports | Finance | C262 | Party Wise Bill Summary | `PAGES/ACCOUNTS.PAGES/Reports/BillReg.aspx?5` | `/dashboard/reports/party-wise-bill-summary` |
| Reports | Finance | C263 | Bill Register With Collection Details | `PAGES/ACCOUNTS.PAGES/Reports/BillReg.aspx?4` | `/dashboard/reports/bill-register-with-collection-details` |
| Reports | Finance | C266 | Submitted O/S Detail | `PAGES/ACCOUNTS.PAGES/Reports/qry_other.aspx?1` | `/dashboard/reports/submitted-o-s-detail` |
| Reports | Finance | C483 | Submitted O/S Detail [Without On Account] | `PAGES/ACCOUNTS.PAGES/Reports/qry_other.aspx?7` | `/dashboard/reports/submitted-o-s-detail-without-on-account` |
| Reports | Finance | C267 | Submitted O/S [Docket wise] | `PAGES/ACCOUNTS.PAGES/Reports/qry_other.aspx?2` | `/dashboard/reports/submitted-o-s-docket-wise` |
| Reports | Finance | C268 | Submitted O/S Branch wise ageing | `PAGES/ACCOUNTS.PAGES/Reports/qry_other.aspx?4` | `/dashboard/reports/submitted-o-s-branch-wise-ageing` |
| Reports | Finance | C269 | Submitted O/S PDD Report | `PAGES/ACCOUNTS.PAGES/Reports/qry_other.aspx?5` | `/dashboard/reports/submitted-o-s-pdd-report` |
| Reports | Finance | C274 | Docket Wise Octroi Details | `PAGES/ACCOUNTS.PAGES/Reports/qry_DktWiseOct.aspx` | `/dashboard/reports/docket-wise-octroi-details` |
| Reports | Finance | C275 | MR wise Collection Report | `PAGES/ACCOUNTS.PAGES/Reports/MrWiseColl.aspx` | `/dashboard/reports/mr-wise-collection-report` |
| Reports | Finance | C276 | BILL wise Collection Report | `PAGES/ACCOUNTS.PAGES/Reports/BillReg.aspx?6` | `/dashboard/reports/bill-wise-collection-report` |
| Reports | Finance | C281 | THC/PDC Financial updation Pending | `PAGES/ACCOUNTS.PAGES/Reports/THCPDCFinUptPend.aspx` | `/dashboard/reports/thc-pdc-financial-updation-pending` |
| Reports | Finance | C284 | Unadjusted Cheque Report | `PAGES/ACCOUNTS.PAGES/Reports/unadjchq.aspx` | `/dashboard/reports/unadjusted-cheque-report` |
| Reports | Finance | C783 | Customer Un-Billed CN Registred | `PAGES/ACCOUNTS.PAGES/Reports/UnbilledOSDet.aspx?6` | `/dashboard/reports/customer-un-billed-cn-registred` |
| Reports | Finance | C841 | Bill Wise O/S Detail | `PAGES/ACCOUNTS.PAGES/Reports/CustomerWiseOS.aspx` | `/dashboard/reports/bill-wise-o-s-detail` |
| Reports | Accounts | C286 | Cash and Bank Transaction Statement | `PAGES/ACCOUNTS.PAGES/AccountMIS/CBS.aspx` | `/dashboard/reports/cash-and-bank-transaction-statement` |
| Reports | Accounts | C288 | General Ledger | `PAGES/ACCOUNTS.PAGES/AccountMIS/JournalLedger.aspx` | `/dashboard/reports/general-ledger` |
| Reports | Accounts | C289 | Subsidiary Ledger | `PAGES/ACCOUNTS.PAGES/AccountMIS/SubsidiaryLedger.aspx` | `/dashboard/reports/subsidiary-ledger` |
| Reports | Accounts | C647 | Customer Ledger | `PAGES/ACCOUNTS.PAGES/AccountMIS/CustomerSubsidiaryLedgerRpt.aspx` | `/dashboard/reports/customer-ledger` |
| Reports | Accounts | C293 | Branch P&L Report | `PAGES/ACCOUNTS.PAGES/AccountMIS/BrwisePLReport.aspx` | `/dashboard/reports/branch-p-l-report` |
| Reports | Accounts | C300 | Negative Cash Balance Statement | `N/A` | `/dashboard/reports/negative-cash-balance-statement` |
| Reports | Accounts | C301 | Debit Advice Report | `PAGES/ACCOUNTS.PAGES/AccountMIS/DebitAdviceRpt.aspx` | `/dashboard/reports/debit-advice-report` |
| Reports | Accounts | C302 | TDS Report | `PAGES/ACCOUNTS.PAGES/AccountMIS/TdsReport.aspx` | `/dashboard/reports/tds-report` |
| Reports | Accounts | C313 | Issued Cheques | `PAGES/ACCOUNTS.PAGES/AccountMIS/IssuedChq.aspx` | `/dashboard/reports/issued-cheques` |
| Reports | Accounts | C314 | Received Cheques | `PAGES/ACCOUNTS.PAGES/AccountMIS/RecivedChq.aspx` | `/dashboard/reports/received-cheques` |
| Reports | Accounts | C318 | Cash & Bank Report | `N/A` | `/dashboard/reports/cash-bank-report` |
| Reports | Accounts | C512 | Voucher Approvals | `PAGES/ACCOUNTS.PAGES/Vouchers/PendingVoucherAppv.aspx?2` | `/dashboard/reports/voucher-approvals` |
| Reports | Accounts | C514 | Voucher Approval All | `PAGES/ACCOUNTS.PAGES/Vouchers/VoucherApprovalAll.aspx` | `/dashboard/reports/voucher-approval-all` |
| Reports | Accounts | C590 | GST Report | `PAGES/ACCOUNTS.PAGES/AccountMIS/GSTReport.aspx` | `/dashboard/reports/gst-report` |
| Reports | Accounts | C599 | GST OutPut Register | `PAGES/ACCOUNTS.PAGES/AccountMIS/GSTOutPutReport.aspx?O` | `/dashboard/reports/gst-output-register` |
| Reports | Accounts | C622 | GSTR1 Report | `PAGES/ACCOUNTS.PAGES/AccountMIS/GSTOutPutReport.aspx?R1` | `/dashboard/reports/gstr1-report` |
| Reports | Accounts | C600 | Bill Edit Register | `PAGES/ACCOUNTS.PAGES/AccountMIS/BilllEditRep.aspx` | `/dashboard/reports/bill-edit-register` |
| Reports | Purchase Report | C778 | Vendor Outstanding Report | `PAGES/ACCOUNTS.PAGES/Reports/VendorUnbilledReport.aspx?2` | `/dashboard/reports/vendor-outstanding-report` |
| Reports | Purchase Report | C779 | Vendor Unbilled Report | `PAGES/ACCOUNTS.PAGES/Reports/VendorUnbilledReport.aspx?1` | `/dashboard/reports/vendor-unbilled-report` |
| Reports | Purchase Report | C788 | Other Vendor O/s Report | `PAGES/CompVehicle/Reports/WithOutTripWiseVendorOutStandingReport.aspx?C788` | `/dashboard/reports/other-vendor-o-s-report` |
| Reports | Purchase Report | C838 | Vendor Invoice Details | `PAGES/ACCOUNTS.PAGES/Reports/OtherVendorInvoiceDetailsReport.aspx?C838` | `/dashboard/reports/vendor-invoice-details` |
| Reports | Purchase Report | C279 | PDC Advance Payment | `PAGES/ACCOUNTS.PAGES/Reports/PDCAdvPay.aspx` | `/dashboard/reports/pdc-advance-payment` |
| Reports | Purchase Report | C280 | PDC Wise Vendor O/S Report | `PAGES/ACCOUNTS.PAGES/Reports/PDCOSReg.aspx` | `/dashboard/reports/pdc-wise-vendor-o-s-report` |
| Reports | ERP Tracking | C444 | PDC Advance Payment Pending | `PAGES/OPERATIONS.PAGES/Reports/ERPMonitoringReport.aspx?PDCADV` | `/dashboard/reports/pdc-advance-payment-pending` |
| Reports | ERP Tracking | C445 | PDC Balance Payment Pending | `PAGES/OPERATIONS.PAGES/Reports/ERPMonitoringReport.aspx?PDCBAL` | `/dashboard/reports/pdc-balance-payment-pending` |
| Reports | Final Accounts | C291 | Trial Balance | `PAGES/ACCOUNTS.PAGES/AccountMIS/TrailBalance.aspx` | `/dashboard/reports/trial-balance` |
| Reports | Final Accounts | C292 | Profit & Loss Statement | `PAGES/ACCOUNTS.PAGES/AccountMIS/ProfitLoss.aspx` | `/dashboard/reports/profit-loss-statement` |
| Reports | Final Accounts | C295 | Balance Sheet | `PAGES/ACCOUNTS.PAGES/AccountMIS/BalanceSheet.aspx` | `/dashboard/reports/balance-sheet` |
| Reports | Final Accounts | C621 | New Balance Sheet | `PAGES/ACCOUNTS.PAGES/AccountMIS/NewBalanceSheet.aspx` | `/dashboard/reports/new-balance-sheet` |
| Reports | Final Accounts | C810 | New Trial Balance | `PAGES/ACCOUNTS.PAGES/AccountMIS/TrailBalanceNew.aspx` | `/dashboard/reports/new-trial-balance` |
| Reports | Company Vechicle Reports | C577 | Pending for Trip Settlement | `PAGES/CompVehicle/Reports/PendingTripSettlement.aspx?S` | `/dashboard/reports/pending-for-trip-settlement` |
| Reports | Company Vechicle Reports | C578 | Pending for Trip Advance | `PAGES/CompVehicle/Reports/PendingTripSettlement.aspx?A` | `/dashboard/reports/pending-for-trip-advance` |
| Reports | Company Vechicle Reports | C580 | Trip Register | `PAGES/CompVehicle/Reports/TripRegister.aspx` | `/dashboard/reports/trip-register` |
| Reports | Company Vechicle Reports | C581 | Trip wise Income Vs. Expense | `PAGES/CompVehicle/Reports/TripWiseIncomeExp.aspx?T` | `/dashboard/reports/trip-wise-income-vs-expense` |
| Reports | Company Vechicle Reports | C584 | Vehicle Wise Income Vs. Expense | `PAGES/CompVehicle/Reports/TripWiseIncomeExp.aspx?V` | `/dashboard/reports/vehicle-wise-income-vs-expense` |
| Reports | Company Vechicle Reports | C597 | Stock Report | `PAGES/CompVehicle/Reports/StockReport.aspx` | `/dashboard/reports/stock-report` |
| Reports | Company Vechicle Reports | C598 | GIN Register | `PAGES/CompVehicle/Reports/GinRegistre.aspx` | `/dashboard/reports/gin-register` |
| Reports | Company Vechicle Reports | C732 | New Tyre Register Report | `PAGES/CompVehicle/Reports/NewTyreRegistered.aspx` | `/dashboard/reports/new-tyre-register-report` |
| Reports | Company Vechicle Reports | C733 | Old Tyre Register Report | `PAGES/CompVehicle/Reports/OldTyreRegistered.aspx` | `/dashboard/reports/old-tyre-register-report` |
| Reports | Company Vechicle Reports | C734 | Claim Tyre Register Report | `PAGES/CompVehicle/Reports/ClaimTryeReport.aspx?2` | `/dashboard/reports/claim-tyre-register-report` |
| Reports | Company Vechicle Reports | C735 | Remould Tyre Report | `PAGES/CompVehicle/Reports/RemoldTryeReport.aspx` | `/dashboard/reports/remould-tyre-report` |
| Admin | Company Structure | C054 | Branch Master | `PAGES/MASTERS.PAGES/BranchListMaster.aspx?C054` | `/dashboard/admin/branch-master` |
| Admin | Company Structure | C055 | Employee Master | `PAGES/MASTERS.PAGES/EmployeeListMst.aspx?C055` | `/dashboard/admin/employee-master` |
| Admin | Company Structure | C058 | Route Master | `PAGES/MASTERS.PAGES/DestinationList.aspx?C058` | `/dashboard/admin/route-master` |
| Admin | Company Structure | C681 | E-Mail Configuration | `PAGES/MASTERS.PAGES/MailConfig.aspx` | `/dashboard/admin/e-mail-configuration` |
| Admin | Business Partners | C061 | Customer Master | `PAGES/MASTERS.PAGES/CustomerListMaster.aspx?C061` | `/dashboard/admin/customer-master` |
| Admin | Business Partners | C062 | Customer GST Registration | `PAGES/MASTERS.PAGES/CustGSTRegsList.aspx?C062` | `/dashboard/admin/customer-gst-registration` |
| Admin | Business Partners | C063 | Vendor Master | `PAGES/MASTERS.PAGES/VendorListMaster.aspx?C063` | `/dashboard/admin/vendor-master` |
| Admin | Business Partners | C615 | Vendor Approval | `PAGES/MASTERS.PAGES/VendorAproval.aspx` | `/dashboard/admin/vendor-approval` |
| Admin | Business Partners | C721 | Vendor GST Registration | `PAGES/MASTERS.PAGES/VendorGSTRegsList.aspx?C721` | `/dashboard/admin/vendor-gst-registration` |
| Admin | Operations | C067 | FTL Type | `PAGES/MASTERS.PAGES/FTLMasterList.aspx?C067` | `/dashboard/admin/ftl-type` |
| Admin | Operations | C633 | Route Cost Master | `PAGES/MASTERS.PAGES/RutCost.aspx` | `/dashboard/admin/route-cost-master` |
| Admin | Operations | C648 | Vehicle Master | `PAGES/MASTERS.PAGES/VehicleListMst.aspx?C648` | `/dashboard/admin/vehicle-master` |
| Admin | Finance & Accounts | C793 | GST Sac Code Master | `PAGES/MASTERS.PAGES/GSTSacCode.aspx?C793` | `/dashboard/admin/gst-sac-code-master` |
| Admin | APIs | C689 | Driving Licence API | `PAGES/ImportTask/APIs/DriverLicenceUlip.aspx` | `/dashboard/admin/driving-licence-api` |
| Admin | APIs | C688 | Pan Card API | `PAGES/ImportTask/APIs/iddocument.html` | `/dashboard/admin/pan-card-api` |
