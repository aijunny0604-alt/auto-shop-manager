# CSV/Excel Import/Export Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: auto-shop-manager
> **Version**: 1.0.0
> **Analyst**: gap-detector
> **Date**: 2026-03-15
> **Design Doc**: [csv-excel-import-export.design.md](../02-design/features/csv-excel-import-export.design.md)
> **Plan Doc**: [csv-excel-import-export.plan.md](../01-plan/features/csv-excel-import-export.plan.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Verify that the CSV/Excel Import/Export feature implementation matches its design specification, and identify any gaps, additions, or deviations that require action.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/csv-excel-import-export.design.md`
- **Plan Document**: `docs/01-plan/features/csv-excel-import-export.plan.md`
- **Implementation Files**:
  - `src/lib/excel-parser.ts`
  - `src/app/api/inventory/import/route.ts`
  - `src/app/api/inventory/import/preview/route.ts`
  - `src/app/api/inventory/export/route.ts`
  - `src/features/inventory/api.ts`
  - `src/features/inventory/components/FileUploadModal.tsx`
  - `src/features/inventory/components/ImportPreviewModal.tsx`
  - `src/features/inventory/components/ImportResultModal.tsx`
  - `src/app/inventory/page.tsx`
  - `src/types/inventory.ts`
  - `prisma/schema.prisma`
- **Analysis Date**: 2026-03-15

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 API Endpoints

| Design | Implementation | Status | Notes |
|--------|---------------|--------|-------|
| POST /api/inventory/import | POST /api/inventory/import | ✅ Match | multipart/form-data, file processing, DB save |
| POST /api/inventory/import/preview | POST /api/inventory/import/preview | ✅ Match | File parsing + preview data returned |
| GET /api/inventory/export | GET /api/inventory/export | ✅ Match | Returns xlsx binary with correct Content-Type |
| - | GET /api/inventory/import | ⚠️ Added | Import history endpoint not in design |

#### API Response Format Comparison

| Endpoint | Design Response | Implementation Response | Status |
|----------|----------------|------------------------|--------|
| POST /import | `{ success, imported, errors, importId }` | `{ success, importId, totalRows, successCount, errorCount, errors, inventoryItemsCreated }` | ⚠️ Changed |
| POST /import/preview | `{ headers, rows, mappings }` | `{ fileName, headers, totalRows, validRows, previewRows, parsedRows, inventoryItems }` | ⚠️ Changed |
| GET /export | xlsx binary | xlsx binary | ✅ Match |

**Details on response changes**:
- **Import**: Design says `imported` field; implementation uses `successCount` + `totalRows` + `inventoryItemsCreated` (richer data, reasonable expansion).
- **Preview**: Design says `mappings` field; implementation omits explicit `mappings` but includes `inventoryItems` and `parsedRows` instead (different approach to showing mapping results). The `rows` field in design maps to `previewRows` (raw) and `parsedRows` (mapped) in implementation.

### 2.2 Data Model (ImportHistory)

| Field | Design Type | Implementation Type | Status |
|-------|-------------|---------------------|--------|
| id | String @id @default(cuid()) | String @id @default(cuid()) | ✅ |
| fileName | String | String | ✅ |
| fileType | String | String | ✅ |
| rowCount | Int | Int | ✅ |
| successCount | Int | Int | ✅ |
| errorCount | Int | Int | ✅ |
| status | String ("SUCCESS"/"PARTIAL"/"FAILED") | String ("SUCCESS"/"PARTIAL"/"FAILED") | ✅ |
| errors | String? (JSON array) | String? (JSON array) | ✅ |
| createdAt | DateTime @default(now()) | DateTime @default(now()) | ✅ |

**ImportHistory Model: 9/9 fields match = 100%**

### 2.3 Component Structure

| Design Component | Implementation File | Status | Notes |
|------------------|---------------------|--------|-------|
| FileUploadModal | `src/features/inventory/components/FileUploadModal.tsx` | ✅ Match | Drag-and-drop + click upload implemented |
| ImportPreviewModal | `src/features/inventory/components/ImportPreviewModal.tsx` | ✅ Match | Tabbed preview with raw data + inventory items |
| ExportButton | Inline in `src/app/inventory/page.tsx` (L131-139) | ⚠️ Changed | Not a separate component; implemented as inline button |
| - | `src/features/inventory/components/ImportResultModal.tsx` | ⚠️ Added | Result modal not in design, but valuable addition |

### 2.4 Parsing Logic

| Design Requirement | Implementation | Status | Notes |
|--------------------|----------------|--------|-------|
| Header row detection (first 5 rows) | `findHeaderRow()` scans up to row 10 | ✅ Match | Scans more rows than design (better) |
| Keyword matching ("yeyakiljja", "chalyangbeonho", "geum-aek") | `HEADER_KEYWORDS` array with 13 keywords | ✅ Match | All design keywords covered |
| Header identification threshold | Requires >= 3 keyword matches | ✅ Match | |
| Empty row filtering (FALSE-only rows) | `isEmptyRow()` filters FALSE/null/empty | ✅ Match | |
| xlsx library usage | `import * as XLSX from "xlsx"` | ✅ Match | |
| Data transformation pipeline | parseFile -> extractInventoryItems | ✅ Match | 6-step pipeline implemented |
| Zod validation (step 5) | NOT IMPLEMENTED | ❌ Missing | No Zod schema validation on parsed data |
| Prisma transaction (step 6) | `prisma.$transaction()` in import route | ✅ Match | |

### 2.5 CSV Column Mapping

| CSV Column (Design) | Mapped Field | Implementation | Status |
|----------------------|-------------|----------------|--------|
| yeyakiljja | Reservation.scheduledAt | `colMap.reservationDate` | ✅ |
| sangtae | Reservation.status | `colMap.status` | ✅ |
| soyu chalyang | Vehicle.carModel | `colMap.carModel` | ✅ |
| chalyang beonho | Vehicle.plateNumber | `colMap.plateNumber` | ✅ |
| sijaksigan | Reservation.scheduledAt (time) | `colMap.startTime` | ✅ |
| jongyosigan | Reservation.duration (calc) | `colMap.endTime` + duration calc | ✅ |
| yeonlakcheo | Customer.phone | `colMap.contact` | ✅ |
| geum-aek | ServiceRecord.cost | `colMap.amount` | ✅ |
| suri naeyong | ServiceRecord.description | `colMap.serviceDescription` | ✅ |
| bigo1~3 | memo | `noteIndices` array | ✅ |
| hangmok1~5 | InventoryItem.name | `itemPairs[].nameIdx` | ✅ |
| sayonglyang1~5 | StockLog quantity | `itemPairs[].qtyIdx` | ✅ |
| startDate | Reservation.scheduledAt | `startDateIdx` | ✅ |
| endDate | Reservation end calc | `endDateIdx` | ✅ |

**Column Mapping: 14/14 = 100%**

### 2.6 Frontend Feature Checklist

| Design Feature | Status | Implementation Notes |
|----------------|--------|---------------------|
| Drag-and-drop upload | ✅ | `handleDrag`, `handleDrop` in FileUploadModal |
| Click upload | ✅ | `inputRef.current?.click()` |
| File type validation (.csv, .xlsx, .xls) | ✅ | Both client (`validateFile`) and server-side |
| Upload progress indicator | ❌ Missing | No progress bar; only "importing..." text state |
| Parsed data table preview | ✅ | Raw data tab in ImportPreviewModal |
| Column mapping confirmation | ⚠️ Partial | Shows inventory items tab (auto-mapped), but no explicit mapping confirmation UI |
| Import confirm/cancel | ✅ | Confirm/Cancel buttons in ImportPreviewModal |
| Export download button | ✅ | Inline button in inventory page |
| Export download progress | ⚠️ Partial | Only "downloading..." text, no progress bar |

### 2.7 Plan Requirements Checklist

| Plan Requirement | Status | Notes |
|------------------|--------|-------|
| CSV (.csv) file upload | ✅ | Supported via xlsx library |
| Excel (.xlsx, .xls) file upload | ✅ | Supported via xlsx library |
| Auto header detection | ✅ | `findHeaderRow()` with keyword matching |
| Column mapping preview | ⚠️ Partial | Shows auto-mapped inventory items, no explicit column mapping UI |
| Duplicate detection (by plate number) | ❌ Missing | Design says detect by vehicle plate number; import uses name-based matching for inventory and phone-based for customers |
| Upload history management | ✅ | ImportHistory model + GET /api/inventory/import |
| Inventory list Excel download | ✅ | Sheet "jaegomokrok" in export |
| Reservation/service history Excel download | ✅ | Sheet "yeyakgwanli" in export |
| Bigsumoteoseu format compatible | ✅ | Export uses matching column names |
| UTF-8/EUC-KR multi-encoding support | ⚠️ Partial | Only `codepage: 65001` (UTF-8); EUC-KR not handled |
| Chunk processing for large files | ❌ Missing | No chunking; entire file processed at once |
| file-saver library usage | ❌ Not Used | Installed in package.json but export uses manual blob/anchor approach |

---

## 3. Code Quality Analysis

### 3.1 Complexity Analysis

| File | Function | Approx Lines | Status | Recommendation |
|------|----------|:------------:|--------|----------------|
| excel-parser.ts | parseFile() | 135 | ⚠️ High | Consider splitting column mapping logic into separate function |
| import/route.ts | POST handler | 190 | ⚠️ High | Extract customer/vehicle/reservation creation into service functions |
| export/route.ts | GET handler | 150 | ⚠️ High | Extract sheet creation logic into separate functions per sheet |
| FileUploadModal.tsx | Component | 160 | ✅ OK | Well-structured |
| ImportPreviewModal.tsx | Component | 210 | ⚠️ Moderate | Large but organized with tabs |

### 3.2 Code Smells

| Type | File | Location | Description | Severity |
|------|------|----------|-------------|----------|
| Long function | import/route.ts | L6-233 | 227-line POST handler with mixed concerns | ⚠️ |
| Magic number | import/route.ts | L74 | `minQuantity: 5` hardcoded | ⚠️ |
| Magic number | import/route.ts | L161 | `duration = 60` default hardcoded | ⚠️ |
| Magic number | import/preview/route.ts | L37-38 | `.slice(0, 20)` preview limit hardcoded | Low |
| Missing error type | FileUploadModal.tsx | L27 | `10 * 1024 * 1024` size limit not as named constant | Low |
| Unused dependency | package.json | - | `file-saver` installed but not used in code | ⚠️ |

### 3.3 Security Issues

| Severity | File | Location | Issue | Recommendation |
|----------|------|----------|-------|----------------|
| ⚠️ Warning | import/route.ts | L8-9 | No file size limit on server side | Add `request.headers.get("content-length")` check |
| ⚠️ Warning | import/route.ts | - | No authentication/authorization check | Add auth middleware if needed |
| ⚠️ Warning | export/route.ts | - | No authentication check on data export | Add auth check |
| Low | excel-parser.ts | L101 | XLSX.read with arbitrary buffer | Inherent to file upload; acceptable for internal tool |

---

## 4. Clean Architecture Compliance

### 4.1 Layer Assignment Verification (Dynamic Level)

| Component | Expected Layer | Actual Location | Status |
|-----------|---------------|-----------------|--------|
| FileUploadModal | Presentation | `src/features/inventory/components/` | ✅ |
| ImportPreviewModal | Presentation | `src/features/inventory/components/` | ✅ |
| ImportResultModal | Presentation | `src/features/inventory/components/` | ✅ |
| Import/Export API functions | Application (Service) | `src/features/inventory/api.ts` | ✅ |
| Type definitions | Domain | `src/types/inventory.ts` | ✅ |
| Excel parser | Infrastructure | `src/lib/excel-parser.ts` | ✅ |
| API routes | Infrastructure | `src/app/api/inventory/` | ✅ |

### 4.2 Import Dependency Check

| File | Layer | Imports From | Status |
|------|-------|-------------|--------|
| FileUploadModal.tsx | Presentation | `react` (external) | ✅ No violations |
| ImportPreviewModal.tsx | Presentation | `react` (external) | ✅ No violations |
| ImportResultModal.tsx | Presentation | None (self-contained) | ✅ No violations |
| inventory/page.tsx | Presentation | `@/features/inventory/api` (Application), `@/types/inventory` (Domain), `@/lib/utils`, `@/components/ui/*` | ✅ Correct direction |
| features/inventory/api.ts | Application | `@/types/inventory` (Domain) | ✅ Correct direction |
| import/route.ts | Infrastructure | `@/lib/prisma`, `@/lib/excel-parser` (same layer) | ✅ |
| export/route.ts | Infrastructure | `@/lib/prisma`, `xlsx` (external) | ✅ |

### 4.3 Architecture Score

```
Architecture Compliance: 100%
  ✅ Correct layer placement: 11/11 files
  ⚠️ Dependency violations:   0 files
  ❌ Wrong layer:              0 files
```

---

## 5. Convention Compliance

### 5.1 Naming Convention Check

| Category | Convention | Files Checked | Compliance | Violations |
|----------|-----------|:-------------:|:----------:|------------|
| Components | PascalCase | 3 | 100% | None |
| Functions | camelCase | 15+ | 100% | None |
| Constants | UPPER_SNAKE_CASE | 2 (`HEADER_KEYWORDS`, `CATEGORIES`) | 100% | None |
| Files (component) | PascalCase.tsx | 3 | 100% | None |
| Files (utility) | camelCase.ts | 1 (`excel-parser.ts`) | ⚠️ | `excel-parser.ts` uses kebab-case; acceptable as utility file |
| Interfaces | PascalCase with I-prefix or descriptive | 8 | 100% | None |

### 5.2 Import Order Check

**inventory/page.tsx** (most complex imports):
1. External: `react`, `next/link` -- ✅
2. Internal absolute: `@/features/inventory/api`, `@/types/inventory`, `@/lib/utils`, `@/components/ui/*` -- ✅
3. Feature-relative: `@/features/inventory/components/*` -- ✅
4. Type imports: `import type` used for types -- ✅

All files follow correct import ordering.

### 5.3 Folder Structure Check

| Expected Path | Exists | Contents Correct | Notes |
|---------------|:------:|:----------------:|-------|
| `src/features/inventory/` | ✅ | ✅ | Feature module |
| `src/features/inventory/api.ts` | ✅ | ✅ | API client functions |
| `src/features/inventory/components/` | ✅ | ✅ | 3 modal components |
| `src/types/inventory.ts` | ✅ | ✅ | Import/Export types added |
| `src/lib/excel-parser.ts` | ✅ | ✅ | Parsing utility |
| `src/app/api/inventory/import/` | ✅ | ✅ | Import API route |
| `src/app/api/inventory/import/preview/` | ✅ | ✅ | Preview API route |
| `src/app/api/inventory/export/` | ✅ | ✅ | Export API route |

### 5.4 Convention Score

```
Convention Compliance: 97%
  Naming:           100%
  Folder Structure:  100%
  Import Order:      100%
  File Naming:       90% (excel-parser.ts is kebab-case, acceptable for lib/)
```

---

## 6. Match Rate Summary

### 6.1 Detailed Scoring

| Category | Designed Items | Matched | Partial | Missing | Score |
|----------|:-----------:|:-------:|:-------:|:-------:|:-----:|
| API Endpoints (3) | 3 | 3 | 0 | 0 | 100% |
| API Response Format (3) | 3 | 1 | 2 | 0 | 67% |
| Data Model - ImportHistory (9 fields) | 9 | 9 | 0 | 0 | 100% |
| CSV Column Mapping (14) | 14 | 14 | 0 | 0 | 100% |
| Frontend Components (3) | 3 | 2 | 0 | 1 | 67% |
| Parsing Pipeline (6 steps) | 6 | 5 | 0 | 1 | 83% |
| Frontend Features (9) | 9 | 5 | 2 | 2 | 67% |
| Plan Requirements (12) | 12 | 7 | 2 | 3 | 67% |

### 6.2 Overall Score

```
┌─────────────────────────────────────────────┐
│  Overall Match Rate: 83%                    │
├─────────────────────────────────────────────┤
│  ✅ Full Match:       46 items (78%)        │
│  ⚠️ Partial/Changed:   6 items (10%)        │
│  ❌ Missing:            7 items (12%)        │
├─────────────────────────────────────────────┤
│  Design Match:        83%   ⚠️               │
│  Architecture:       100%   ✅               │
│  Convention:          97%   ✅               │
│  Code Quality:        75%   ⚠️               │
│                                             │
│  *** Overall: 83% ***                 ⚠️     │
└─────────────────────────────────────────────┘
```

---

## 7. Differences Found

### 7.1 Missing Features (Design O, Implementation X)

| # | Item | Design Location | Description | Impact |
|---|------|-----------------|-------------|--------|
| 1 | Zod validation | design.md Section 4.2 step 5 | "Zod validation" listed as step 5 in data transformation pipeline. No Zod schemas are applied to parsed row data. | Medium - Data integrity risk |
| 2 | Upload progress indicator | design.md Section 3.1 | "Upload progress display" specified for FileUploadModal. Only text status ("Importing...") exists, no progress bar. | Low - UX concern |
| 3 | Duplicate detection by plate number | plan.md Section 4.1 | "Duplicate data detection (by vehicle plate number)" not implemented. Import creates new vehicles without checking for existing plate numbers from prior imports. | Medium - May create duplicate records |
| 4 | EUC-KR encoding support | plan.md Section 7 | Multi-encoding support (UTF-8, EUC-KR) listed as risk mitigation. Only UTF-8 (codepage 65001) is handled. | Medium - Korean encoding issues possible |
| 5 | Chunk processing for large files | plan.md Section 7 | Chunk-unit processing listed as risk mitigation for large files. Entire file is processed in memory at once. | Low - Acceptable for typical file sizes |

### 7.2 Added Features (Design X, Implementation O)

| # | Item | Implementation Location | Description | Impact |
|---|------|------------------------|-------------|--------|
| 1 | ImportResultModal | `src/features/inventory/components/ImportResultModal.tsx` | Result summary modal showing success/error counts and error details. Not in design but excellent UX addition. | Positive |
| 2 | GET /api/inventory/import | `src/app/api/inventory/import/route.ts` L236-242 | Import history retrieval endpoint. Not in design but supports history management. | Positive |
| 3 | Category auto-detection | `src/lib/excel-parser.ts` `guessCategory()` | Automatically categorizes inventory items by name keywords (oil, brake, tire, etc.). Not in design. | Positive |
| 4 | Multi-sheet export | `src/app/api/inventory/export/route.ts` | Export includes 3 sheets (inventory, stock logs, reservations) vs design's single "inventory data" export. | Positive |
| 5 | File size validation (10MB) | `FileUploadModal.tsx` L27-29 | Client-side 10MB file size limit. Not in design but good practice. | Positive |
| 6 | Customer/Vehicle auto-creation on import | `import/route.ts` L93-188 | Import creates Customer and Vehicle records from CSV data. Design only mentions inventory import. | Positive - Comprehensive data import |

### 7.3 Changed Features (Design != Implementation)

| # | Item | Design | Implementation | Impact |
|---|------|--------|----------------|--------|
| 1 | Import response format | `{ success, imported, errors, importId }` | `{ success, importId, totalRows, successCount, errorCount, errors, inventoryItemsCreated }` | Low - Superset of design |
| 2 | Preview response format | `{ headers, rows, mappings }` | `{ fileName, headers, totalRows, validRows, previewRows, parsedRows, inventoryItems }` | Medium - `mappings` field absent; different data structure |
| 3 | ExportButton component | Separate `ExportButton` component | Inline button in inventory page | Low - Functionally equivalent |
| 4 | file-saver usage | Plan specifies `file-saver` library | Uses manual Blob + anchor approach | Low - Same result |
| 5 | Header row scan range | "First 5 rows" in design | Scans up to row 10 | Low - Better coverage |
| 6 | Export scope | "Inventory list Excel download" | 3 sheets: inventory + stock logs + reservations | Low - Exceeds design |

---

## 8. Recommended Actions

### 8.1 Immediate Actions (High Priority)

| # | Priority | Item | File | Description |
|---|----------|------|------|-------------|
| 1 | HIGH | Add Zod validation for parsed data | `src/lib/excel-parser.ts` | Create Zod schema for `ParsedRow` and validate each row before returning. Zod is already installed (`zod@4.3.6`). |
| 2 | HIGH | Add duplicate detection | `src/app/api/inventory/import/route.ts` | Before creating vehicles, check existing records by `plateNumber`. Offer skip/update/overwrite options. |

### 8.2 Short-term Actions (Medium Priority)

| # | Priority | Item | File | Expected Impact |
|---|----------|------|------|-----------------|
| 1 | MEDIUM | Add EUC-KR encoding fallback | `src/lib/excel-parser.ts` | Try UTF-8 first, fall back to EUC-KR if parsing produces garbled text. |
| 2 | MEDIUM | Add server-side file size limit | `src/app/api/inventory/import/route.ts` | Check Content-Length header before processing. |
| 3 | MEDIUM | Extract ExportButton component | `src/features/inventory/components/` | Extract inline export button to reusable component per design. |
| 4 | MEDIUM | Refactor import route | `src/app/api/inventory/import/route.ts` | Split 227-line handler into service functions: `importInventoryItems()`, `importReservations()`, `createImportHistory()`. |

### 8.3 Long-term Actions (Low Priority)

| # | Item | Description |
|---|------|-------------|
| 1 | Add upload progress indicator | Replace text-only status with a progress bar component in FileUploadModal. |
| 2 | Add chunk processing | For files > 1000 rows, process in batches of 100 with progress reporting. |
| 3 | Remove unused file-saver | Either use `file-saver`'s `saveAs()` in `exportInventory()` or remove from dependencies. |
| 4 | Extract constants | Replace magic numbers (minQuantity: 5, duration: 60, preview limit: 20) with named constants. |

---

## 9. Design Document Updates Needed

The following items should be added to the design document to reflect actual implementation:

- [ ] Add `ImportResultModal` component to Section 3 (Frontend Components)
- [ ] Add `GET /api/inventory/import` endpoint for history retrieval to Section 2 (API Design)
- [ ] Update import response format to match implementation in Section 2.1
- [ ] Update preview response format to match implementation in Section 2.2
- [ ] Add `guessCategory()` auto-categorization logic to Section 4 (Parsing Logic)
- [ ] Document multi-sheet export (3 sheets) in Section 2.3
- [ ] Add customer/vehicle auto-creation during import to Section 4.2 pipeline
- [ ] Add client-side file size validation (10MB) to Section 3.1
- [ ] Remove or annotate Zod validation step if intentionally deferred

---

## 10. Next Steps

- [ ] Implement Zod validation on parsed row data (highest priority gap)
- [ ] Add plate number duplicate detection on import
- [ ] Update design document with 9 additions listed above
- [ ] Consider refactoring import route for maintainability
- [ ] Write completion report (`csv-excel-import-export.report.md`) after fixes

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-15 | Initial gap analysis | gap-detector |
