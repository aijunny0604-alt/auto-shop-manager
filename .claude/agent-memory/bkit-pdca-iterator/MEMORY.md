# PDCA Iterator Agent Memory - auto-shop-manager

## Project Facts
- Stack: Next.js 16 App Router, TypeScript strict, Tailwind CSS v4, Prisma 5 + SQLite, googleapis v171
- Installed but initially unused: zod v4, react-hook-form, zustand
- Auth: No user auth (single-user app), Google OAuth only for Calendar
- Token storage: `prisma/google-token.json` (gitignored)

## Zod v4 API Notes
- Use `error:` not `errorMap:` in z.enum() params (breaking change from v3)
  - Correct: `z.enum(["A","B"], { error: "message" })`
  - Wrong: `z.enum(["A","B"], { errorMap: () => ({ message: "..." }) })`

## Key File Locations
- Google Calendar lib: `src/lib/google-calendar.ts`
- Validation schemas: `src/lib/validations/{inventory,customer,reservation}.ts`
- Feature API layers: `src/features/{inventory,customers,reservations}/api.ts`
- Feature hooks: `src/features/{inventory,customers,reservations}/hooks/use*.ts`
- Shared UI: `src/components/ui/{ConfirmDialog,StatusBadge,EmptyState}.tsx`
- Calendar sync: `src/app/api/calendar/sync/route.ts`

## Gap Fix Patterns (82% -> target 90%)
Items addressed in iteration:
1. POST /api/calendar/sync - pulls events, links by title+time match (+-5min)
2. Zod schemas in src/lib/validations/ for all 3 feature domains
3. .env.example with DATABASE_URL, GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI
4. Shared UI: ConfirmDialog, StatusBadge, EmptyState in src/components/ui/
5. Custom hooks: useInventory, useCustomers, useReservations in features/*/hooks/
