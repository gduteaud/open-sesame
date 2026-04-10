# Open Sesame

API key management for **OpenRouter**: create events, import attendees (CSV or one-by-one), set a **per-key USD spending limit**, and let attendees **claim** their own OpenRouter API key (one key per email per event).

## Stack

- Next.js (App Router), TypeScript, Tailwind, shadcn/ui
- Drizzle ORM + PostgreSQL ([Supabase](https://supabase.com) free tier works well)
- Deploy on [Vercel](https://vercel.com) (Hobby / free)

## Setup

1. **Clone & install**

   ```bash
   npm install
   ```

2. **Environment** — copy `.env.example` to `.env.local` and fill in:

   - `DATABASE_URL` — Supabase connection string (use the **transaction** pooler on port `6543` with `?pgbouncer=true` if you use `postgres.js` in serverless).
   - `OPENROUTER_MANAGEMENT_KEY` — from [OpenRouter management keys](https://openrouter.ai/settings/management-keys).
   - `ADMIN_PASSWORD` — plain password for local dev, or a **bcrypt** hash for production.
   - `NEXTAUTH_SECRET` — long random string for signing the admin cookie.

3. **Database schema**

   ```bash
   npm run db:push
   ```

   (Or use `npm run db:generate` + your migration workflow.)

4. **Run**

   ```bash
   npm run dev
   ```

   - Home: [http://localhost:3000](http://localhost:3000)
   - Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
   - Attendee claim: [http://localhost:3000/claim](http://localhost:3000/claim)

5. **Claim links in production** — set `NEXT_PUBLIC_APP_ORIGIN` to your public URL (e.g. `https://your-app.vercel.app`) so the organizer dashboard shows the correct shareable link.

## CSV format

Header row required:

| first_name | last_name | email           |
| ---------- | --------- | --------------- |
| Ada        | Lovelace  | ada@example.com |

Duplicate `(event, email)` rows are skipped on import.

## Security notes

- Admin routes are protected by an HTTP-only JWT cookie.
- Provisioned OpenRouter keys are stored in the database; restrict DB access and use strong secrets in production.
- Attendee flow is **email allowlist only** (no magic link); consider rate limiting at the edge for `/api/claim` if you expose it publicly.

## Scripts

| Command            | Description        |
| ------------------ | ------------------ |
| `npm run dev`      | Development server |
| `npm run build`    | Production build   |
| `npm run db:push`  | Push schema to DB  |
| `npm run db:studio`| Drizzle Studio     |
