# OPERATIONAL WORKFLOW DIAGRAMS

## 1. Freight Booking to Delivery Workflow (Operations)

```mermaid
flowchart TD
    A["Freight Booking (New CN)"] -->|Consignment Recorded| B["Loading Slip / Manifest"]
    B -->|Assign Vehicle & Driver| C["TripSheet (Pickup PDC / THC)"]
    C -->|Departure from Origin Hub| D["In-Transit Tracking"]
    D -->|Arrival at Destination Branch| E["Arrival Entry & Stock Update"]
    E -->|Out for Delivery| F["Delivery PDC Preparation"]
    F -->|Consignee Receives Goods| G["POD (Proof of Delivery) Upload"]
    G -->|Delivery Marked Complete| H["Financial Completion (Ready for Billing)"]
```

## 2. Customer Billing and GST E-Invoice (IRN) Lifecycle

```mermaid
flowchart TD
    A["Completed Dockets List"] -->|Select Customer & Period| B["Bill Generation Step 1"]
    B -->|Review Consignments & Charges| C["Generate Customer Transport Bill"]
    C -->|Trigger E-Invoice| D{"IRN Generation Adapter"}
    D -->|Simulated Provider| E["IRN & QR Code Generated"]
    E -->|Stamp IRN details| F["Official Tax Invoice PDF / Print"]
    F -->|Submit to Client| G["Payment Collection (MR Entry)"]
    G -->|Reconciliation| H["Closed Ledger Balance"]
```

## 3. Vendor Payment & Bank Integration Workflow (Simulated)

```mermaid
flowchart TD
    A["Trip Sheet / Vendor Freight"] -->|Calculate Advance & Freight| B["Vendor Bill / Voucher Entry"]
    B -->|TDS Calculation & Approval| C["Approved Payment Queue"]
    C -->|Dispatch to Bank Service| D["IndusInd Online Payment Process"]
    D -->|Simulated Gateway Execution| E["UTR Generated & Status Marked SUCCESS"]
    E -->|Import Bank Statement| F["Automated BRS Reconciliation"]
```

