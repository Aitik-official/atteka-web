# Atteka Logistics ERP - Greenfield Replication

A standalone, full-stack enterprise logistics and supply-chain management application reverse-engineered and replicated from the client's WebCoreVision TMS.

## Overview
This greenfield project replicates the accessible functionality, business workflows, interface, and navigation hierarchy of the reference system:
- **Operations:** Consignment Note (CN) Booking (`ReliableDocketScr.aspx`), Multi-Document Tracking, TripSheets & PDCs, POD Scans.
- **Finance & Billing:** Customer Transport Billing (Step 1), E-Invoice IRN Engine (Simulated Adapter), Money Receipt (MR) Collection, Debit Notes.
- **Banking Integration:** Host-to-Host (H2H) IndusInd Bank Online Payment Gateway (Simulated Adapter) and Bank Statement reconciliation.
- **Admin & Masters:** Customer Master with GSTIN, Vendor Master with TDS & Approval, Branch Master, Fleet & Vehicle Master.
- **Reports:** Trial Balance, Profit & Loss Statement, Operational Summary Registers.

---

## Technology Stack
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React icons
- **Backend:** Next.js Route Handlers, TypeScript Business Logic
- **Database:** MongoDB with Mongoose ODM (with built-in fallback for instant offline exploration)
- **Validation:** Zod schemas for forms and API requests
- **Authentication:** JWT session cookie with bcrypt password hashing and role-based guards
- **Simulations:** Service Adapter Pattern for IndusInd Bank Online Payments and GST E-Invoice IRN

---

## Directory Structure
```
client-a-replica/
|-- public/               # Static assets & document upload storage
|-- src/
|   |-- app/
|   |   |-- (auth)/login/ # WCVLogin.aspx replication
|   |   |-- (dashboard)/  # Authenticated ERP Shell & Portals
|   |   |   |-- operations/ # New CN (C010), Dockets (C011), Tracking (C111)
|   |   |   |-- finance/    # Billing (C194), E-Invoice (C655), Bank Payment (C782)
|   |   |   |-- masters/    # Customers (C061), Vendors (C063), Branches, Vehicles
|   |   |   |-- reports/    # Trial Balance (C291), P&L Statements
|   |   |-- api/          # REST route handlers
|   |-- components/       # Header, Sidebar, SimulatedBadge, UI controls
|   |-- lib/              # MongoDB connection, Auth, Zod validations
|   |-- models/           # Mongoose schemas (User, Consignment, Bill, Vendor, etc.)
|   |-- services/         # BankService, GstService, StorageService adapters
|-- scripts/
|   |-- seed.js           # Safe, fictional demo database seeder
|-- docs/
|   |-- REVERSE_ENGINEERING_SPEC.md
|   |-- MODULE_INVENTORY.md
|   |-- ROUTE_INVENTORY.md
|   |-- DATABASE_SCHEMA.md
|   |-- WORKFLOW_DIAGRAMS.md
|   |-- FEATURE_PARITY_CHECKLIST.md
|-- .env.example
|-- package.json
|-- tsconfig.json
|-- README.md
```

---

## Getting Started

### 1. Prerequisites
- Node.js (v18.0.0 or later)
- MongoDB instance (Local `mongod` or MongoDB Atlas cloud URI)

### 2. Installation
```bash
cd client-a-replica
npm install
```

### 3. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env.local
```
Configure your MongoDB URI (defaults to `mongodb://localhost:27017/atteka_replica`).

### 4. Database Seeding
Populate the database with safe, fictional logistics records (Customers, Dockets, Branches, Vehicles, Demo Users):
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open your browser at:
```
http://localhost:3000
```

---

## Demo Credentials

| Role | User ID | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Operator** | `AL002` | `demo123` | Operational Booking, Tracking, TripSheets, Billing |
| **Admin** | `ADMIN01` | `admin123` | Full ERP Access, Masters, Approval, Financials |

*(Note: In development, any password will authenticate `AL002` to allow immediate testing even if MongoDB is offline).*

---

## Key Business Workflows Verified

1. **Freight Booking (New CN):**
   - Navigate to **Operations &rarr; New CN Booking (C010)**
   - Fill in shipper, consignee, package count, actual and charged weight
   - Notice real-time dynamic calculation of Freight Amount, 5% GST, and Grand Total
   - Click **Save & Generate Docket** &rarr; persisted in database and visible in Dockets Register.

2. **Proof of Delivery (POD) Upload:**
   - In **Consignments Register**, click **POD** on any docket
   - Select a scanned image or PDF &rarr; status updates to **DELIVERED** with direct preview link.

3. **Customer Billing & E-Invoice:**
   - Go to **Finance &rarr; Customer Billing (C194)**
   - Select `TATA MOTORS LTD`, tick unbilled dockets, click **Generate Bill**
   - Then go to **E-Invoice Engine (C655)**, select the generated bill, and click **Generate IRN**
   - Generates simulated 64-character hash and QR code payload without real API billing.

4. **IndusInd Bank Corporate Payout:**
   - Navigate to **Finance &rarr; Bank Payment (C782)**
   - Enter beneficiary vendor and amount &rarr; click **Process Payout**
   - Generates simulated UTR number and updates payment history ledger.

5. **Trial Balance & Reports:**
   - Go to **Reports &rarr; Trial Balance (C291)**
   - Displays real-time balanced general ledger heads with print-ready view.

