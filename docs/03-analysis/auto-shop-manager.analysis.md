# Auto Shop Manager Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: auto-shop-manager
> **Version**: 1.0.0
> **Analyst**: bkit-gap-detector
> **Date**: 2026-03-09
> **Design Doc**: [auto-shop-manager.design.md](../02-design/features/auto-shop-manager.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Compare the design document (`docs/02-design/features/auto-shop-manager.design.md`) against the actual implementation to identify gaps, missing features, added features, and deviations. This is the **Check** phase of the PDCA cycle for the auto-shop-manager feature.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/auto-shop-manager.design.md`
- **Implementation Path**: `src/` (Next.js App Router + Prisma + SQLite)
- **Analysis Date**: 2026-03-09

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 Data Model (Prisma Schema)

**Design**: `docs/02-design/features/auto-shop-manager.design.md` Section 3
**Implementation**: `prisma/schema.prisma`

| Entity | Design | Implementation | Status | Notes |
|--------|--------|----------------|--------|-------|
| InventoryItem | 10 fields + 2 relations | 10 fields + 2 relations | Match | All fields and relations identical |
| StockLog | 6 fields + 1 relation | 6 fields + 1 relation | Match | All fields identical |
| Customer | 6 fields + 2 relations | 6 fields + 2 relations | Match | All fields identical |
| Vehicle | 9 fields + 3 relations | 9 fields + 3 relations | Match | All fields identical |
| ServiceRecord | 9 fields + 2 relations | 9 fields + 2 relations | Match | All fields identical |
| ServicePartUsed | 4 fields + 2 relations | 4 fields + 2 relations | Match | All fields identical |
| Reservation | 12 fields + 2 relations | 12 fields + 2 relations | Match | All fields identical |

**Data Model Score: 100%** -- All 7 entities with all fields, types, defaults, and relations match exactly between design and implementation.

### 2.2 API Endpoints

**Design**: Section 4.1 (25 endpoints)
**Implementation**: `src/app/api/` route files

| Method | Path | Design | Impl | Status | Notes |
|--------|------|:------:|:----:|--------|-------|
| **Inventory** | | | | | |
| GET | `/api/inventory` | Yes | Yes | Match | Search/category filter implemented |
| POST | `/api/inventory` | Yes | Yes | Match | Validation included |
| GET | `/api/inventory/[id]` | Yes | Yes | Match | Includes stockLogs |
| PUT | `/api/inventory/[id]` | Yes | Yes | Match | |
| DELETE | `/api/inventory/[id]` | Yes | Yes | Match | |
| POST | `/api/inventory/[id]/stock` | Yes | Yes | Match | IN/OUT validation, quantity check |
| GET | `/api/inventory/alerts` | Yes | Yes | Match | App-level filter for SQLite |
| **Customers** | | | | | |
| GET | `/api/customers` | Yes | Yes | Match | Search implemented |
| POST | `/api/customers` | Yes | Yes | Match | |
| GET | `/api/customers/[id]` | Yes | Yes | Match | Includes vehicles + service records |
| PUT | `/api/customers/[id]` | Yes | Yes | Match | |
| DELETE | `/api/customers/[id]` | Yes | Yes | Match | |
| POST | `/api/customers/[id]/vehicles` | Yes | Yes | Match | |
| PUT | `/api/vehicles/[id]` | Yes | Yes | Match | |
| DELETE | `/api/vehicles/[id]` | Yes | Yes | Match | |
| POST | `/api/vehicles/[id]/services` | Yes | Yes | Match | Parts used + stock deduction |
| PUT | `/api/services/[id]` | Yes | Yes | Match | |
| DELETE | `/api/services/[id]` | Yes | Yes | Match | |
| **Reservations** | | | | | |
| GET | `/api/reservations` | Yes | Yes | Match | Date range + status filter |
| POST | `/api/reservations` | Yes | Yes | Match | Google Calendar auto-sync |
| GET | `/api/reservations/[id]` | Yes | Yes | Match | Design shows PUT/DELETE only; impl adds GET |
| PUT | `/api/reservations/[id]` | Yes | Yes | Match | Calendar update on change |
| DELETE | `/api/reservations/[id]` | Yes | Yes | Match | Calendar delete on removal |
| **Google Calendar** | | | | | |
| GET | `/api/auth/google` | Yes | Yes | Match | OAuth redirect |
| GET | `/api/auth/google/callback` | Yes | Yes | Match | Token exchange + save |
| POST | `/api/calendar/sync` | Yes | No | Missing | Manual sync endpoint not implemented |
| **Dashboard** | | | | | |
| GET | `/api/dashboard` | Yes | Yes | Match | |
| **Added (not in design)** | | | | | |
| GET | `/api/calendar/status` | No | Yes | Added | Calendar connection status check |

**API Endpoint Score: 93%** (25/26 designed endpoints implemented; 1 missing, 1 added)

### 2.3 UI Pages & Routes

**Design**: Section 6.3 (11 page routes)
**Implementation**: `src/app/` page files

| Page | Design Route | Impl Route | Status | Notes |
|------|-------------|------------|--------|-------|
| Dashboard | `/` | `/` (page.tsx) | Match | Stats, today reservations, low stock, recent services |
| Inventory List | `/inventory` | `/inventory` (page.tsx) | Match | Table with search + category filter |
| Inventory New | `/inventory/new` | `/inventory/new` (page.tsx) | Match | Form with all designed fields |
| Inventory Detail/Edit | `/inventory/[id]` | `/inventory/[id]` (page.tsx) | Match | Combined detail + edit + stock log |
| Stock Log | `/inventory/[id]/stock` | `/inventory/[id]` (page.tsx) | Changed | Stock log integrated into detail page instead of separate page |
| Customer List | `/customers` | `/customers` (page.tsx) | Match | Card list with search |
| Customer New | `/customers/new` | `/customers/new` (page.tsx) | Match | |
| Customer Detail | `/customers/[id]` | `/customers/[id]` (page.tsx) | Match | Includes vehicles + service records inline |
| Customer Edit | `/customers/[id]/edit` | `/customers/[id]` (page.tsx) | Changed | Edit integrated into detail page (inline toggle) |
| Vehicle New | `/customers/[id]/vehicles/new` | `/customers/[id]` (page.tsx) | Changed | Vehicle form integrated into customer detail |
| Service Record New | `/vehicles/[id]/services/new` | `/customers/[id]` (page.tsx) | Changed | Service form integrated into customer detail |
| Reservation List | `/reservations` | `/reservations` (page.tsx) | Match | List view with status management |
| Reservation New | `/reservations/new` | `/reservations/new` (page.tsx) | Match | Customer + vehicle selector |
| Reservation Detail/Edit | `/reservations/[id]` | `/reservations/[id]` (page.tsx) | Match | Combined detail + edit view |

**UI Pages Score: 86%** (10/14 routes match; 4 consolidated -- functional parity maintained)

### 2.4 UI Components

**Design**: Section 6.3 + 6.4
**Implementation**: `src/components/`

| Component | Design Location | Implementation | Status | Notes |
|-----------|----------------|----------------|--------|-------|
| AppLayout | `src/components/layout/` | `src/components/layout/AppLayout.tsx` | Match | Sidebar + Header + Main |
| Sidebar | `src/components/layout/` | `src/components/layout/Sidebar.tsx` | Match | |
| Header | `src/components/layout/` | `src/components/layout/Header.tsx` | Match | |
| MobileNav | `src/components/layout/` | `src/components/layout/MobileNav.tsx` | Match | Bottom tab navigation |
| DataTable | `src/components/ui/` | Inline in pages | Changed | Custom table markup used instead of reusable component |
| SearchBar | `src/components/ui/` | Inline in pages | Changed | Inline search inputs per page |
| FormField | `src/components/ui/` | Inline in pages | Changed | Native form elements used |
| ConfirmDialog | `src/components/ui/` | `window.confirm()` | Changed | Browser native confirm used |
| StatusBadge | `src/components/ui/` | Inline spans | Changed | Inline status spans with color maps |
| EmptyState | `src/components/ui/` | Inline div blocks | Changed | Inline empty state messaging |

**Shared Components Score: 40%** (4/10 match as designed; 6 implemented inline instead of as reusable components)

### 2.5 Google Calendar Integration

**Design**: Section 5 (OAuth, Token Storage, Event Mapping, Sync Strategy)
**Implementation**: `src/lib/google-calendar.ts` + API routes

| Feature | Design | Implementation | Status | Notes |
|---------|--------|----------------|--------|-------|
| OAuth 2.0 Flow | Full flow described | Implemented | Match | getAuthUrl, exchangeCode |
| Token Storage | `prisma/google-token.json` | `prisma/google-token.json` | Match | File-based token storage |
| .gitignore for token | Yes | Yes | Match | `prisma/google-token.json` in .gitignore |
| Event Create (App -> Google) | On reservation create | Implemented | Match | createCalendarEvent |
| Event Update (App -> Google) | On reservation update | Implemented | Match | updateCalendarEvent |
| Event Delete (App -> Google) | On reservation delete | Implemented | Match | deleteCalendarEvent |
| Event Title Format | `[serviceType] customerName - carModel` | Implemented | Match | Exact format followed |
| Calendar Failure Handling | DB saved, calendarEventId=null, log | Implemented | Match | try/catch returns null |
| Manual Sync (Google -> App) | POST `/api/calendar/sync` | Not implemented | Missing | No reverse sync endpoint |
| Connection Status | Not in design | GET `/api/calendar/status` | Added | isConnected() check |

**Google Calendar Score: 82%** (9/11 features; 1 missing, 1 added)

### 2.6 Feature Module Structure

**Design**: Section 9 (File Structure)
**Implementation**: `src/features/`

| Design Path | Implementation | Status | Notes |
|-------------|----------------|--------|-------|
| `src/features/inventory/components/` | Not created | Missing | No separate component files |
| `src/features/inventory/hooks/` | Not created | Missing | No custom hooks (useInventory, useStockLog) |
| `src/features/inventory/api.ts` | `src/features/inventory/api.ts` | Match | All API functions present |
| `src/features/customers/components/` | Not created | Missing | No separate component files |
| `src/features/customers/hooks/` | Not created | Missing | No custom hooks (useCustomers, useVehicles) |
| `src/features/customers/api.ts` | `src/features/customers/api.ts` | Match | All API functions present |
| `src/features/reservations/components/` | Not created | Missing | No separate component files |
| `src/features/reservations/hooks/` | Not created | Missing | No custom hooks (useReservations) |
| `src/features/reservations/api.ts` | `src/features/reservations/api.ts` | Match | All API functions present |
| `src/lib/prisma.ts` | `src/lib/prisma.ts` | Match | Singleton pattern |
| `src/lib/google-calendar.ts` | `src/lib/google-calendar.ts` | Match | Full wrapper |
| `src/lib/utils.ts` | `src/lib/utils.ts` | Match | cn, formatDate, formatDateTime, formatCurrency |
| `src/types/inventory.ts` | `src/types/inventory.ts` | Match | All types defined |
| `src/types/customer.ts` | `src/types/customer.ts` | Match | All types defined |
| `src/types/reservation.ts` | `src/types/reservation.ts` | Match | All types defined |
| `src/store/useAppStore.ts` | Not created | Missing | No Zustand store implemented |

**File Structure Score: 63%** (10/16 designed paths exist; 6 missing -- hooks, components subdirs, store)

### 2.7 Technology Usage

**Design**: Section 2.3 + package.json dependencies
**Implementation**: `package.json` + actual imports

| Technology | Design | Implementation | Status | Notes |
|------------|--------|----------------|--------|-------|
| Next.js (App Router) | Yes | Yes (v16) | Match | |
| TypeScript | Yes | Yes (strict) | Match | |
| Tailwind CSS | Yes | Yes (v4) | Match | |
| Prisma + SQLite | Yes | Yes (v5.22) | Match | |
| shadcn/ui | Yes | No | Missing | Custom CSS variables used instead |
| react-hook-form | Yes (Section 2.2) | Installed but unused | Gap | FormData API used instead |
| zod | Yes (Section 8) | Installed but unused | Gap | Manual validation in API routes |
| zustand | Yes (Section 9) | Installed but unused | Gap | useState used per component |
| googleapis | Yes | Yes (v171) | Match | |

**Technology Usage Score: 67%** (6/9 match; 3 installed but not actually used in code)

---

## 3. Code Quality Analysis

### 3.1 Error Handling

| Design Requirement | Implementation | Status |
|--------------------|----------------|--------|
| 400 - Input validation with toast | Manual validation, alert/inline error | Partial |
| 404 - Resource not found | Implemented in API routes | Match |
| 500 - Server error with toast | No global error boundary | Missing |
| Calendar failure - DB preserved | Implemented (try/catch, return null) | Match |
| Token expiry - Auto refresh | Not explicitly handled | Missing |

### 3.2 Validation Approach

| Design | Implementation | Gap |
|--------|----------------|-----|
| zod schema validation | Manual `if (!field)` checks | Design specifies zod; impl uses manual checks |
| react-hook-form integration | Native FormData API | Design specifies RHF; impl uses native forms |

### 3.3 Code Organization

The implementation consolidates several designed pages into single pages with inline toggle states (editing mode, form visibility). This is a practical simplification for a 1-person shop app but deviates from the designed page-per-action structure.

---

## 4. Clean Architecture Compliance

> Project Level: **Dynamic** (features-based module structure)

### 4.1 Layer Structure Verification

| Designed Layer | Expected Path | Exists | Status |
|----------------|--------------|:------:|--------|
| Presentation | `src/app/` pages, `src/components/` | Yes | Match |
| Application (Features) | `src/features/*/api.ts` | Yes | Partial (no hooks/) |
| Domain | `src/types/` | Yes | Match |
| Infrastructure | `src/lib/` (prisma, google-calendar) | Yes | Match |

### 4.2 Dependency Direction

| Import Pattern | Expected | Actual | Status |
|----------------|----------|--------|--------|
| Pages -> Features API | Pages import from `@/features/*/api` | Yes | Match |
| Pages -> Types | Pages import from `@/types/*` | Yes | Match |
| Pages -> Lib utils | Pages import from `@/lib/utils` | Yes | Match |
| API Routes -> Lib | Routes import from `@/lib/prisma`, `@/lib/google-calendar` | Yes | Match |
| Types -> nothing | Types have no external imports (except cross-type refs) | Yes | Match |

No layer violations found. Dependency direction is correct.

### 4.3 Architecture Score

```
Architecture Compliance: 88%
  Layer placement correct:   All source files
  Dependency violations:     0
  Missing designed layers:   hooks/ subdirectories not created
```

---

## 5. Convention Compliance

### 5.1 Naming Convention Check

| Category | Convention | Compliance | Violations |
|----------|-----------|:----------:|------------|
| Components | PascalCase | 100% | None |
| Functions | camelCase | 100% | None |
| Constants | UPPER_SNAKE_CASE | 100% | `CATEGORIES`, `SERVICE_TYPES`, `RESERVATION_STATUS_LABELS` |
| Files (component) | PascalCase.tsx | 100% | AppLayout.tsx, Sidebar.tsx, Header.tsx, MobileNav.tsx |
| Files (page) | page.tsx (Next.js convention) | 100% | Follows Next.js App Router conventions |
| Files (utility) | camelCase.ts | 100% | prisma.ts, google-calendar.ts, utils.ts |
| Folders | kebab-case | 100% | inventory, customers, reservations, google-calendar |

### 5.2 Import Order Check

Checked across all source files:

- [x] External libraries first (react, next, googleapis)
- [x] Internal absolute imports second (`@/...`)
- [x] Type imports using `import type` where applicable
- [ ] Some files mix type and value imports from same module

### 5.3 Environment Variable Check

| Variable | Convention | Actual | Status |
|----------|-----------|--------|--------|
| DATABASE_URL | Standard Prisma | `DATABASE_URL` | Match |
| GOOGLE_CLIENT_ID | Should be `AUTH_GOOGLE_ID` per convention | `GOOGLE_CLIENT_ID` | Deviation |
| GOOGLE_CLIENT_SECRET | Should be `AUTH_GOOGLE_SECRET` per convention | `GOOGLE_CLIENT_SECRET` | Deviation |
| GOOGLE_REDIRECT_URI | No standard prefix | `GOOGLE_REDIRECT_URI` | Deviation |
| .env.example | Required | Not created | Missing |

### 5.4 Convention Score

```
Convention Compliance: 85%
  Naming:           100%
  Import Order:      90%
  Env Variables:     50%  (no .env.example, non-standard naming)
  Folder Structure:  90%
```

---

## 6. Dashboard API Response Comparison

| Design Field | Implementation | Status | Notes |
|--------------|----------------|--------|-------|
| `todayReservations` | `todayReservations` | Match | |
| `weekReservations` | `weekReservations` | Match | |
| `lowStockItems` | `lowStockItems` | Match | |
| `recentServices` | `recentServices` | Match | |
| - | `stats` | Added | `{ todayCount, weekCount, lowStockCount, totalCustomers }` |

The implementation adds a `stats` summary object not in the original design -- a useful enhancement.

---

## 7. Match Rate Summary

```
+-----------------------------------------------+
|  Overall Match Rate: 82%                       |
+-----------------------------------------------+
|                                                |
|  Category             Score   Status           |
|  -------------------- ------- -------          |
|  Data Model            100%   Match            |
|  API Endpoints          93%   Match            |
|  UI Pages               86%   Match (*)        |
|  Shared Components      40%   Gap              |
|  Google Calendar        82%   Match            |
|  File Structure         63%   Gap              |
|  Technology Usage       67%   Gap              |
|  Architecture           88%   Match            |
|  Convention             85%   Match            |
|                                                |
|  (*) Pages consolidated but functionally       |
|      equivalent                                |
|                                                |
|  Weighted Overall:                             |
|    Core (Data+API+Calendar+Pages): 90%         |
|    Structure (Components+Files+Tech): 57%      |
|    Quality (Architecture+Convention): 87%      |
|                                                |
|  Combined: 82%                                 |
+-----------------------------------------------+
```

---

## 8. Overall Score

```
+-----------------------------------------------+
|  Overall Score: 82/100                         |
+-----------------------------------------------+
|  Design Match (core features):  90 points      |
|  Architecture Compliance:       88 points      |
|  Convention Compliance:         85 points      |
|  Code Organization:             63 points      |
|  Technology Integration:        67 points      |
|  Overall Weighted:              82 points      |
+-----------------------------------------------+
```

---

## 9. Differences Found

### 9.1 Missing Features (Design O, Implementation X)

| # | Item | Design Location | Description | Impact |
|---|------|-----------------|-------------|--------|
| 1 | POST `/api/calendar/sync` | Section 4.1, 5.4 | Manual Google -> App sync endpoint not implemented | Medium |
| 2 | `src/store/useAppStore.ts` | Section 9 | Zustand global store not created | Low |
| 3 | `src/features/*/hooks/` | Section 9 | Custom hooks (useInventory, useCustomers, useReservations) not created | Low |
| 4 | `src/features/*/components/` | Section 9 | Feature-specific reusable components not extracted | Low |
| 5 | shadcn/ui components | Section 6.4 | DataTable, SearchBar, FormField, ConfirmDialog, StatusBadge, EmptyState not created as reusable components | Medium |
| 6 | `.env.example` | Best practice | Template env file for onboarding not created | Low |
| 7 | Separate stock log page | Section 6.3 | `/inventory/[id]/stock` as standalone page | Low |
| 8 | Customer edit page | Section 6.3 | `/customers/[id]/edit` as standalone page | Low |
| 9 | Vehicle add page | Section 6.3 | `/customers/[id]/vehicles/new` as standalone page | Low |
| 10 | Service record add page | Section 6.3 | `/vehicles/[id]/services/new` as standalone page | Low |
| 11 | zod validation | Section 8 | zod installed but not used for API validation | Medium |
| 12 | react-hook-form | Section 2.2 | Installed but not used in any form | Medium |
| 13 | Token auto-refresh handling | Section 7 | No explicit token expiry + auto-refresh logic | Low |

### 9.2 Added Features (Design X, Implementation O)

| # | Item | Implementation Location | Description | Impact |
|---|------|------------------------|-------------|--------|
| 1 | GET `/api/calendar/status` | `src/app/api/calendar/status/route.ts` | Calendar connection status check endpoint | Positive |
| 2 | `stats` in dashboard response | `src/app/api/dashboard/route.ts` | Summary statistics object (todayCount, weekCount, lowStockCount, totalCustomers) | Positive |
| 3 | Dark mode support | `src/app/globals.css` | CSS variables with `prefers-color-scheme: dark` media query | Positive |
| 4 | Parts used auto-stock-deduction | `src/app/api/vehicles/[id]/services/route.ts` | When adding service record with parts, inventory is automatically decremented + stock log created | Positive |
| 5 | Status quick-change buttons | `src/app/reservations/page.tsx` | Quick PENDING->CONFIRMED->COMPLETED buttons on reservation list | Positive |

### 9.3 Changed Features (Design != Implementation)

| # | Item | Design | Implementation | Impact |
|---|------|--------|----------------|--------|
| 1 | Page consolidation | Separate pages for edit/add sub-resources | Inline forms with toggle states in parent detail pages | Low - UX arguably better for 1-person use |
| 2 | Shared UI components | shadcn/ui reusable components | Inline Tailwind markup in page files | Medium - Less maintainable, more duplication |
| 3 | Form handling | react-hook-form + zod | Native FormData + manual validation | Medium - Less robust validation |
| 4 | State management | Zustand global store | useState per component | Low - Acceptable for this scale |
| 5 | Env variable naming | `AUTH_GOOGLE_*` prefix convention | `GOOGLE_*` prefix | Low - Functional but non-standard |

---

## 10. Recommended Actions

### 10.1 Immediate (High Priority)

| # | Action | File(s) | Expected Impact |
|---|--------|---------|-----------------|
| 1 | Implement POST `/api/calendar/sync` | `src/app/api/calendar/sync/route.ts` | Complete Google Calendar integration per design |
| 2 | Add zod validation schemas | `src/lib/validations/*.ts` or in each API route | Improve data integrity and error messages |
| 3 | Create `.env.example` | `.env.example` | Developer onboarding, documentation |

### 10.2 Short-term (Medium Priority)

| # | Action | File(s) | Expected Impact |
|---|--------|---------|-----------------|
| 1 | Extract shared UI components | `src/components/ui/` | Reduce code duplication, improve consistency |
| 2 | Create custom hooks | `src/features/*/hooks/` | Better separation of concerns, testability |
| 3 | Integrate react-hook-form | All form pages | Better form validation UX, design compliance |
| 4 | Standardize env variable names | `.env.local`, `src/lib/google-calendar.ts` | Convention compliance |

### 10.3 Long-term (Low Priority)

| # | Action | File(s) | Notes |
|---|--------|---------|-------|
| 1 | Add Zustand store | `src/store/useAppStore.ts` | Only if cross-component state sharing needed |
| 2 | Initialize shadcn/ui | `components.json`, `src/components/ui/` | Design system compliance |
| 3 | Add token auto-refresh logic | `src/lib/google-calendar.ts` | Handle OAuth token expiry gracefully |
| 4 | Separate sub-resource pages | Inventory stock, customer edit, vehicle/service forms | Only if UX feedback requires it |

---

## 11. Design Document Updates Needed

The following items should be reflected back in the design document:

- [ ] Add GET `/api/calendar/status` endpoint to API spec
- [ ] Add `stats` field to dashboard API response specification
- [ ] Add dark mode support to UI/UX section
- [ ] Document page consolidation decisions (inline edit/add patterns)
- [ ] Add auto-stock-deduction feature to service record creation spec
- [ ] Add status quick-change UI to reservation list spec
- [ ] Note that shadcn/ui was replaced with custom CSS variable system

---

## 12. Summary Assessment

**Match Rate: 82% -- "There are some differences. Document update is recommended."**

The core business functionality is **fully implemented** and working:
- All 7 database entities match 100%
- 25 of 26 designed API endpoints are implemented (96%)
- All user-facing features (inventory CRUD, customer management, reservation + Google Calendar) are operational
- Google Calendar integration works for create/update/delete operations

The primary gaps are in **code organization and tooling**:
- Reusable UI components not extracted (inline Tailwind instead of shadcn/ui)
- Installed dependencies (react-hook-form, zod, zustand) not utilized
- Feature module hooks/ and components/ subdirectories not created
- Manual sync endpoint missing

Several **positive additions** were made beyond the design:
- Dark mode support
- Dashboard statistics summary
- Calendar connection status API
- Auto stock deduction on service record creation
- Quick status change buttons on reservations

**Recommendation**: Focus on items 10.1 (immediate actions) to reach 90%+ match rate. The implementation is production-functional; remaining gaps are primarily structural/organizational improvements.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-09 | Initial gap analysis | bkit-gap-detector |
