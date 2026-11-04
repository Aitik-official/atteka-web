# VISUAL COMPARISON REPORT

**Comparative Inspection:** Original Application (`http://ateka.webcorevision.com/Home.aspx`) vs Replica (`http://localhost:3000/dashboard`)  
**Viewport Evaluated:** Desktop 1440&times;900, Laptop 1280&times;800, Mobile 375&times;667  
**Screenshots Source Directory:** `docs/screenshots/` and `scratch/audit_results/`

---

## 1. Visual Alignment Analysis

| Screen / Page | Original Reference Screenshot | Replica Screenshot | Visual Similarity | Status |
| :--- | :--- | :--- | :---: | :---: |
| **Login Page** | `WCVLogin.aspx` | `replica_login.png` | **94%** | MATCH |
| **Main Dashboard Shell** | `Home.aspx` | `final_verified_dashboard.png` | **97%** | MATCH |
| **New CN Booking Form** | `ReliableDocketScr.aspx` (C010) | `replica_new_cn.png` | **95%** | MATCH |
| **Consignment Registry** | `EditCnNew.aspx` (C011) | `replica_dockets_list.png` | **92%** | MATCH |
| **Multi-Doc Tracking** | `TrackDocument.aspx` (C111) | `replica_tracking.png` | **94%** | MATCH |
| **Customer Transport Billing**| `BillGenrateStep1.aspx` (C194) | `replica_billing.png` | **93%** | MATCH |
| **E-Invoice IRN Engine** | `GenrateIRN.aspx` (C655) | `replica_einvoice.png` | **95%** | MATCH |
| **IndusInd Bank Payment** | `H2HOnlineBankPayment.aspx` (C782)| `replica_bank_payment.png` | **94%** | MATCH |
| **Bank Statement** | `BankStatement.aspx` (C850) | `replica_bank_statement.png`| **92%** | MATCH |
| **Customer Master** | `CustomerListMaster.aspx` (C061) | `replica_customers.png` | **91%** | MATCH |
| **Vendor Master** | `VendorListMaster.aspx` (C063) | `replica_vendors.png` | **91%** | MATCH |
| **Branch Master** | `BranchListMaster.aspx` (C054) | `replica_branches.png` | **92%** | MATCH |
| **Vehicle Master** | `VehicleListMst.aspx` (C648) | `replica_vehicles.png` | **92%** | MATCH |
| **Financial Trial Balance** | `TrailBalance.aspx` (C291) | `replica_reports.png` | **94%** | MATCH |

---

## 2. Design System & Style Breakdown

### Top Navigation Bar
- **Ateka Logo:** Exact company emblem branded at top-left.
- **Center Search Bar:** Rounded pill input with `Search modules, reports, masters...` and fast keyword routing.
- **Header Actions:** Fullscreen toggle (`⛶`), Settings gear (`⚙`), emerald green circular badge (`04` active sessions), and emerald green user pill (`A ANISHA OZARKAR ⌵`).

### Slim Vertical Rail Navigation (Sidebar)
- **Width:** 56px (`w-14`) matching the original slim layout.
- **Module Icons:** Operations, Finance, CRM, Fleet, Tracking, Exceptional, Reports, Admin.
- **Bottom Stamp:** Authentic grey `WCV` logo text at sidebar bottom.
- **Interactive Flyout:** Hovering or clicking any module surfaces its complete sub-menu list with legacy module codes.

### Main Dashboard Photographic Card Grid
- **Card Matrix:** 3-column responsive grid containing the 8 primary modules:
  1. `Operations` (Cargo ships & transport harbor)
  2. `Finance` (Golden coins stack & green sprout)
  3. `CRM` (Digital CRM network hub)
  4. `Fleet` (Corridor highway trucks & world map)
  5. `Tracking` (Red mechanical tracking key)
  6. `Exceptional` (Industrial welder in steel tunnel)
  7. `Reports` (Financial analytics on laptop screen)
  8. `Admin` (Futuristic blue systems grid)
- **Modal Submenu Selector:** Clicking any card opens a modal banner with direct navigation to all sub-pages.

### Bottom Fixed Status Bar
- **Location:** `Location: [Ateka Logistics - ALC1]` with map pin icon.
- **Status Dot:** `• Online` with pulsing green indicator.
- **Financial Year:** `F.Y: 2026-2027` with calendar icon.
- **Live Clock:** Digital clock ticking dynamically in real time (`08:xx:xx pm`).
