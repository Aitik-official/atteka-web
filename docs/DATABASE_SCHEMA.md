# DATABASE SCHEMA SPECIFICATION

The new independent application uses MongoDB via Mongoose. The observable data model is synthesized from the legacy forms, inputs, and business entities.

## 1. User & Authentication Collection (`users`)
- `userId`: String, required, unique, uppercase (e.g. `AL002`, `ADMIN01`)
- `name`: String, required
- `email`: String
- `passwordHash`: String, bcrypt salt
- `role`: Enum `['ADMIN', 'OPERATOR', 'ACCOUNTS', 'MANAGER', 'GUEST']`
- `branchCode`: String, ref: `branches`
- `operatingLocation`: String
- `financialYear`: String (e.g. `2024-2025`)
- `isActive`: Boolean, default true
- `createdAt`, `updatedAt`: Timestamps

## 2. Branches Collection (`branches`)
- `branchCode`: String, unique (e.g. `MUM`, `DEL`, `BLR`)
- `branchName`: String, required
- `address`: String
- `city`: String
- `state`: String
- `pincode`: String
- `gstin`: String
- `phone`: String
- `isHub`: Boolean, default false

## 3. Customers Collection (`customers`)
- `customerCode`: String, unique (e.g. `CUST001`)
- `name`: String, required
- `customerType`: Enum `['CORPORATE', 'REGULAR', 'WALK_IN']`
- `pan`: String
- `creditPeriod`: Number (days)
- `gstList`: Array of subdocuments:
  - `gstin`: String
  - `state`: String
  - `address`: String
  - `isDefault`: Boolean
- `billingAddress`: Object { address, city, state, pincode, phone, email }
- `isActive`: Boolean, default true

## 4. Vendors Collection (`vendors`)
- `vendorCode`: String, unique (e.g. `VEN001`)
- `name`: String, required
- `vendorType`: Enum `['ATTACHED_VEHICLE', 'MARKET_VEHICLE', 'COURIER', 'MAINTENANCE']`
- `pan`: String
- `tdsApplicable`: Boolean
- `tdsRate`: Number
- `approvalStatus`: Enum `['PENDING', 'APPROVED', 'REJECTED']`
- `bankDetails`: Object { bankName, accountNo, ifscCode, branch }
- `gstList`: Array of subdocuments { gstin, state, address }

## 5. Vehicles Collection (`vehicles`)
- `vehicleNumber`: String, unique, uppercase
- `vehicleType`: String (e.g. `32 FT SXL`, `20 FT`, `14 FT`, `TRAILER`)
- `ownerType`: Enum `['COMPANY', 'ATTACHED', 'MARKET']`
- `rcNumber`: String
- `fitnessExpiry`: Date
- `insuranceExpiry`: Date
- `permitExpiry`: Date
- `capacityTons`: Number
- `driverName`: String
- `driverPhone`: String

## 6. Consignments / Dockets Collection (`consignments`)
The core operational transaction entity:
- `docketNo`: String, unique (e.g. `ALC126001`)
- `bookingDate`: Date, default Date.now
- `bookingType`: Enum `['NORMAL', 'SYSTEM']`
- `bookingBranch`: String, ref: `branches`
- `billingParty`: String, ref: `customers`
- `paymentBasis`: Enum `['PAID', 'TO_PAY', 'TBB']` (To Be Billed)
- `serviceType`: Enum `['FTL', 'LTL', 'DOOR_DELIVERY', 'GODOWN']`
- `fromLocation`: String
- `toLocation`: String
- `originBranch`: String
- `destinationBranch`: String
- `consignor`: Object { name, address, city, pincode, phone, email, gstin }
- `consignee`: Object { name, address, city, pincode, phone, email, gstin }
- `packageDetails`:
  - `packageType`: String (e.g. `BOX`, `DRUM`, `BAG`, `WOODEN_CRATE`, `PALLET`)
  - `productDescription`: String
  - `packagesCount`: Number
  - `actualWeight`: Number
  - `chargedWeight`: Number
- `financials`:
  - `freightRate`: Number
  - `freightAmount`: Number
  - `loadingCharge`: Number
  - `unloadingCharge`: Number
  - `docketCharge`: Number
  - `fovCharge`: Number
  - `subTotal`: Number
  - `gstRate`: Number (default 5% or 18% based on RCM/FCM)
  - `gstAmount`: Number
  - `grandTotal`: Number
- `ewayBill`: Object { number, expiryDate }
- `status`: Enum `['BOOKED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'BILLED', 'CANCELLED']`
- `podDocumentUrl`: String (optional scanned copy)

## 7. Customer Bills Collection (`customer_bills`)
- `billNumber`: String, unique (e.g. `BILL-2024-001`)
- `billDate`: Date
- `customer`: Ref `customers`
- `consignments`: Array of Ref `consignments`
- `totalAmount`: Number
- `taxAmount`: Number
- `grandTotal`: Number
- `irnDetails`: Object { irnNumber, ackNo, ackDate, qrCodeData, status }
- `status`: Enum `['DRAFT', 'GENERATED', 'SUBMITTED', 'PAID', 'CANCELLED']`

## 8. Money Receipts Collection (`money_receipts`)
- `mrNumber`: String, unique (e.g. `MR-001`)
- `mrDate`: Date
- `customer`: Ref `customers`
- `bills`: Array of Object { billId, allocatedAmount, rebateAmount }
- `paymentMode`: Enum `['CHEQUE', 'NEFT', 'RTGS', 'CASH', 'ONLINE']`
- `chequeOrRefNo`: String
- `totalReceived`: Number
- `tdsDeducted`: Number
- `rebateDiscount`: Number

## 9. Bank Operations Collection (`bank_operations`)
- `transactionId`: String, unique
- `bankName`: String (e.g. `IndusInd Bank`, `HDFC`, `SBI`)
- `accountNumber`: String
- `transactionType`: Enum `['ONLINE_PAYMENT', 'STATEMENT_IMPORT', 'RE_PROCESS']`
- `vendorOrBeneficiary`: String
- `amount`: Number
- `status`: Enum `['INITIATED', 'SUCCESS', 'FAILED', 'PENDING']`
- `utrNumber`: String
- `isSimulated`: Boolean, default true
- `rawPayload`: Object

## 10. GST Logs Collection (`gst_operations`)
- `gstin`: String
- `operationType`: Enum `['E_INVOICE_IRN', 'GSTR_2B_PULL', 'CREDIT_NOTE_IRN', 'PAN_VERIFY']`
- `referenceDocNumber`: String
- `status`: Enum `['GENERATED', 'CANCELLED', 'FAILED', 'MOCK_VERIFIED']`
- `isSimulated`: Boolean, default true
- `responsePayload`: Object

