# finance-web-app

Personal finance tracker. University coursework — `doc/Galutinis_Planas.md` is the spec of record.

## Commands

```bash
npm run dev              # dev server on :3000
npm run build            # full typecheck + build; the real verification step
npm run lint
npx prisma migrate dev   # create/migrate dev.db, then regenerate the client
```

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · NextAuth v5 · Prisma 7 over SQLite (`better-sqlite3` adapter).

## Gotchas

- **`proxy.ts` is the middleware.** Next.js 16 renamed `middleware.ts`. There is no `middleware.ts`; don't create one.
- **The Prisma client generates to `app/generated/prisma/`, not `node_modules`.** That path is gitignored, so a fresh clone must run `npx prisma migrate dev` (or `prisma generate`) before anything typechecks. Import from `@/app/generated/prisma/client`, and only via the singleton in `lib/prisma.ts`.
- **Never commit `dev.db`.** It is gitignored and rebuilt from migrations.
- **No API layer.** The only route handler is NextAuth's catch-all. All mutations are server actions.

## Conventions

- **Mutations are server actions** in `app/(dashboard)/<feature>/actions.ts`. Add new ones there rather than adding route handlers.
- **Every action authenticates and authorizes.** Call `getCurrentDbUser()` / `getCurrentAdminUser()` (`lib/current-user.ts`) — they redirect, so no null check needed. For anything touching a sheet, gate the write on `hasEditAccess(sheet.userId, user.id)` (`monthly-sheet/actions.ts`), which covers both the owner and EDIT-shared users. Verify the category belongs to the *sheet's* owner, not the caller.
- **Validate with the zod schemas in `lib/validations.ts`**; return `{ error: string }` rather than throwing.
- **Pages are server components** (`page.tsx`) that fetch and pass data into a `*-client.tsx` sibling holding the interactivity.
- `revalidatePath()` after every mutation.

## Domain model

`MonthlySheet` (unique per user + month + year) is the anchor — transactions and capital entries hang off a *sheet*, not off the user. So "the current month" is a real row, lazily created by `getCurrentMonthSheet()` on dashboard render.

Three features complicate this, all in `lib/sheets.ts` and `monthly-sheet/actions.ts`:

- **Recurring** transactions are copied into each newly created sheet, searching back up to 12 months so skipped months don't break the chain. Day-of-month is clamped to the target month's length.
- **Splits** spread one amount across 1–24 months, eagerly creating future sheets; rounding remainder goes to the last part. Empty future sheets are cleaned up on delete.
- **Sharing** grants another user VIEW or EDIT on your sheets, surfaced under `/shared/[userId]/`.

Auth bootstrap: the first registered user becomes ADMIN/ACTIVE; everyone else is PENDING until an admin approves them.

## Docs

Docs are in **Lithuanian**; code, comments, and UI strings are in **English**. `doc/Galutinis_Planas.md` tracks planned vs. delivered functionality across four iterations, and the `doc/*_updated.puml` diagrams are part of the graded deliverable — update them alongside schema or user-flow changes.
