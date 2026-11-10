# PROJECT_FUNCTIONAL_GAP_ANALYSIS.md

> **Master blueprint for completing `client-a-replica` as an independent Atteka Logistics ERP clone.**  
> **Phase:** Analysis & documentation only (no code, config, or database changes were made for this document).  
> **Generated:** 10 Nov 2026  
> **Scope:** `c:\\Software\\Atteka\\client-a-replica`  
> **Method:** Static inventory of App Router pages, API routes, Mongoose models, middleware, module catalog, hub hrefs; prior Mongo connectivity check on `atteka_replica` (20 collections).  
> **Constraint:** No interaction with the original client production website or private production APIs.

---

## 1. Project Overview

`client-a-replica` is a Next.js App Router application that visually and structurally replicates a WebCoreVision-style logistics TMS/ERP (Atteka). It already includes:

- Login + cookie JWT session gate
- Large dashboard surface (~158 pages across Operations, Finance, Fleet, CRM, Tracking, Reports, Masters, Admin, Exceptional)
- ~106 API route handlers
- 25 Mongoose models
- Dual data strategy: **MongoDB** for core ops/masters + many report queries; **in-process memoryStore** fallback; **fabricated DEMO arrays** for many newer finance/bank/operations UI screens
- Simulated GST IRN and bank payment markers (`isSimulated`)

**Business goal of this blueprint:** make the clone fully usable *without* depending on the original client backend, by completing frontend workflows, local APIs, and a local/dev database—using mocks only where external networks (NIC GST, bank H2H, Cloudinary) are unavailable.

| Layer | Count | Notes |
|------|------:|-------|
| Dashboard pages | ~158 | Finance heaviest (~63) |
| API routes | ~106 | Hybrid classifications |
| Module catalog entries | ~147 | Searchable navigation |
| Mongo-touching APIs | ~50–55 | Often + memoryStore fallback |
| Explicit DEMO/Fabricated APIs | ~45–50 | Especially `/api/finance/*`, `/api/bank/*` (except payment) |
| Mongoose models | 25 | See §14 |

---
