# REVERSE ENGINEERING SPECIFICATION
## Project: Atteka / WebCoreVision Logistics ERP Greenfield Replication

### 1. Architectural Overview & System Topology
The reference legacy system is a full enterprise logistics & supply-chain management ERP built on Microsoft IIS / ASP.NET (.aspx) with AJAXPro client-side remote procedure calls.
The user session is orchestrated through:
- Authentication entry: `/WCVLogin.aspx`
- Main landing frame: `/Home.aspx`
- Inner application viewport: `/PAGES/ACCOUNTS.PAGES/Menu/RptFin.aspx?<SubmenuId>` which renders module dashboards, card actions, and directs users to sub-views (`ReliableDocketScr.aspx`, `CustomerListMaster.aspx`, etc.).

### 2. Discovered Module Architecture
The system consists of **8 core operational domains**:
1. **Operations (C001):**
   - Freight Booking: Consignment Note (CN / Docket) creation, editing, printing
   - CN Operations: THC (Transhipment Hub Centre) generation, Arrival & Delivery entries, stock updates
   - TripSheet Operations: Pickup PDC, Delivery PDC, Loading Slips, Delivery PDC Updates
   - View/Print Documents: E-Dockets, PDC vouchers, manifest printouts
2. **Finance (C002):**
   - Vendor Billing: Advance freight vouchers, balance payments, finalization
   - Customer Billing: Bill Generation Step 1, Other Billing, Invoice generation
   - E-Invoice (IRN): Token authorization, Generate IRN, Cancel IRN, Credit Note IRN
   - MR (Money Receipt) Entry: Collection recording, rebate calculations, customer credit notes
   - Vouchers: Journal Vouchers, Debit Notes, GSTR-2B invoice booking
   - Cheque Management: Cheque issue, clearing, deposits
   - Cash & Bank Statement: IndusInd Bank H2H Online Payment simulation, Bank Statements, payment re-processing
3. **CRM (C003):**
   - Lead management, Client Visit reports, Customer activity tracker
4. **Fleet (C748):**
   - Trip settlement, Vehicle advance vouchers, BPCL Fuel & Toll integrations
5. **Tracking (C004):**
   - Multi-document query (CN, THC, PDC, Invoice), Proof of Delivery (POD) image verification, PAN & GST validation
6. **Exceptional (C116):**
   - Operational & financial overrides: destination changes, narration updates, BRS reconciliation, GRN/GIN cancellations
7. **Reports (C006):**
   - Operations, Finance, Accounts registers, Final Accounts (Trial Balance, P&L, Balance Sheet)
8. **Admin / Masters (C007):**
   - Company structure (Branches, Employees, Routes, Email Config)
   - Business Partners (Customers with GSTINs, Vendors with Approval workflows)
   - Operations Masters (Vehicles, FTL types, Route costs, GST SAC codes)
   - Verification APIs (Driving License, PAN API mocks)

### 3. Visual & UX Design Specifications
- **Layout:** Collapsible side navigation with quick search, top header with company info, financial year badge, dark/light theme switch, user profile avatar pill, and multi-tabbed operational viewport.
- **Palette:**
  - Primary Blue: `#0171d3` / `#2563eb` (Tailwind `blue-600`)
  - Accent / Green status: `#16a34a` (Tailwind `emerald-600` / `green-600`)
  - Background Neutral: `#f8fafc` (Tailwind `slate-50`)
  - Dark Mode: `#0f172a` (Tailwind `slate-900`)
  - Form Fields: 38px height, rounded-md, crisp borders `#cbd5e1`, blue focus ring
- **Typography:** Google Font `Poppins` / `Inter`, 13px - 14px body, 11px - 12px table cells with tight padding for high information density.

### 4. Technical Stack
- **Framework:** Next.js 14+ App Router, React 18, TypeScript
- **Styling:** Tailwind CSS, Lucide React icons
- **Database:** MongoDB with Mongoose ODM
- **Validation:** Zod schemas for all forms and API endpoints
- **Auth:** Session cookie with bcrypt password hashing and role-based route guard
- **Integration Layer:** Adapter pattern for GST and Banking services (Mock implementations with clear simulation badges)

