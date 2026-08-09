# finance-web-app

A personal finance tracker: monthly income/expense transactions, recurring and
split transactions, and net worth (capital) tracking across cash and bank
balances, with support for sharing a read-only or edit view of your sheets
with another account.

This started as a university coursework project. The graded spec of record
lives in `doc/Galutinis_Planas.md` (Lithuanian), and the `doc/*_updated.puml`
diagrams track the delivered database/class/activity/use-case design. Since
the coursework deadline, the project has continued as a personal tool and is
now being actively extended with the help of AI-assisted development
(Claude), which is why the commit history moves faster and covers more
ground than a typical student project.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, NextAuth v5,
Prisma 7 over SQLite (`better-sqlite3` adapter).

## Features

- Monthly sheets per user (one row per month/year), auto-created on first
  visit to that month.
- Transactions: income/expense, categorized, tagged as paid with cash or
  bank.
- Recurring transactions, copied forward automatically into each new month,
  with a configurable interval (every N months, e.g. quarterly or annual
  bills).
- Split transactions: spread one amount evenly across 2-24 future months.
- Capital (net worth) tracking per category (bank accounts, cash, investment
  accounts, etc.), with month-over-month growth shown per category and an
  expected-vs-actual check that flags when your logged transactions don't
  add up to your reported balance change.
- Sharing: grant another account view or edit access to your sheets.
- Admin approval flow: the first registered account becomes admin; every
  account after that is pending until an admin approves it.
- Push notification reminders via ntfy.sh (opt-in per user, see below).
- Haptic feedback on mobile for key interactions (confirm dialogs, drag and
  drop reordering).

## Getting started (self-hosting)

1. Clone the repository and install dependencies:

   ```bash
   git clone git@github.com:lukrencijus/finance-web-app.git
   cd finance-web-app
   npm install
   ```

2. Copy `.env.example` to `.env` and fill it in:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` - defaults to `file:./dev.db`, fine as-is for a
     single-server SQLite setup.
   - `AUTH_SECRET` - generate one with `npx auth secret` or
     `openssl rand -base64 32`.
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` - optional. Only needed if you
     want "Sign in with Google" in addition to email/password. Leave blank
     to skip Google sign-in.

3. Create the database and generate the Prisma client. Note this is two
   separate steps on Prisma 7 - `migrate dev` no longer runs `generate` for
   you automatically:

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. Build and start:

   ```bash
   npm run build
   npm run start
   ```

   Or for local development with hot reload: `npm run dev` (serves on
   `:3000`).

5. Register an account. The very first account created becomes admin and is
   active immediately; every account after that starts as pending and needs
   to be approved from the admin panel before it can sign in.

### Reminder notifications (optional)

Each user can set their own ntfy.sh topic on the Settings page to receive
push reminders (e.g. "you haven't logged anything in 5 days"). This isn't
wired into the running app - it's a standalone script meant to run on a
schedule on the server:

```bash
npm run reminders
```

Example crontab entry to run it every Monday at 9am server time:

```
0 9 * * 1 cd /path/to/finance-web-app && npm run reminders >> reminders.log 2>&1
```

Users who haven't set a topic are simply skipped, so this is safe to run
even if nobody has opted in yet.

## Deploying updates

Once the app is running on your server, pulling in new changes looks like
this:

```bash
git pull origin master
npm install
npx prisma migrate deploy
npx prisma generate
npm run build
```

Then restart the running process so it picks up the new build - the exact
command depends on how you're keeping the app alive (a systemd service,
`pm2 restart finance-web-app`, a tmux/screen session you re-run `npm run
start` in, etc.). A few notes on the steps above:

- `npm install` only matters if `package.json` changed since your last pull
  - safe to run every time regardless.
- `prisma migrate deploy` applies any new migrations without the interactive
  prompts `migrate dev` uses - that's the dev-only command, `deploy` is the
  one meant for an existing server/database.
- `prisma generate` regenerates the Prisma client into
  `app/generated/prisma/`, which is gitignored - skip it and every field
  touched by a recent schema change fails to typecheck even though the
  migration applied fine.
- `npm run build` is also the full typecheck - if it fails, the pull
  introduced a real problem and the old build keeps serving traffic until
  you fix it and rebuild.

If a pull doesn't touch `prisma/schema.prisma`, the two Prisma commands are
no-ops and can be skipped, but running them anyway doesn't hurt anything.

## Planned / under consideration

Things on the roadmap, roughly in order of how settled the idea is:

- **Local LLM integration** - using a locally-hosted model (rather than a
  paid API) for things like auto-categorizing transactions from their
  description, or summarizing monthly spending in plain language.
- **Swedbank integration** - importing transactions/balances automatically
  instead of entering them by hand, most likely via an open banking
  (PSD2) API such as GoCardless Bank Account Data (formerly Nordigen),
  which has a free tier and supports Lithuanian banks.
- **Trading212 integration** - pulling in investment account balances so
  they show up alongside cash/bank capital instead of being tracked
  manually.
- **Coinbase integration** - same idea, for crypto holdings.

## Development notes

See `CLAUDE.md` for conventions, gotchas, and the domain model - it's kept
up to date as the project evolves and is the best starting point for
understanding how the codebase is put together.
