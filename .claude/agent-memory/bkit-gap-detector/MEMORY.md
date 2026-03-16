# Gap Detector Memory

## Project: auto-shop-manager

- **Stack**: Next.js 16 App Router + Prisma 5 + SQLite + Google Calendar API
- **Level**: Dynamic (features-based module structure)
- **Last Analysis**: 2026-03-15, Match Rate: 83% (csv-excel-import-export feature)

## Key Paths
- Design doc: `docs/02-design/features/auto-shop-manager.design.md`
- Schema: `prisma/schema.prisma` (7 models, all match design)
- API routes: `src/app/api/` (25/26 designed endpoints implemented)
- Analysis: `docs/03-analysis/auto-shop-manager.analysis.md`

## Known Gaps
1. POST `/api/calendar/sync` not implemented (manual Google->App sync)
2. Installed but unused: react-hook-form, zod, zustand
3. No shared UI components extracted (shadcn/ui not initialized)
4. Feature hooks/ and components/ subdirs not created
5. No `.env.example` file
6. Env vars use `GOOGLE_*` prefix instead of `AUTH_GOOGLE_*`

## Positive Additions (not in design)
- Dark mode via CSS variables
- GET `/api/calendar/status` endpoint
- Dashboard `stats` summary object
- Auto stock deduction on service record creation
- Reservation status quick-change buttons

## Feature Analyses
- [csv-excel-import-export-analysis](project_csv_import_export_analysis.md) - 83% match, 2026-03-15

## Pattern Notes
- Glob with `**/*.ts` fails in this project (returns node_modules results or nothing)
- Use direct file reads or Grep for file discovery instead
- Pages consolidate edit/add forms inline (toggle states) rather than separate routes
- zod is installed but consistently not used for validation in any feature
